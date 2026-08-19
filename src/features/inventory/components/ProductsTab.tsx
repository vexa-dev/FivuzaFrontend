import { CheckCircle2, LayoutGrid, List, Package, Pencil, Search, Trash2, XCircle } from 'lucide-react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatCurrency, formatQuantity, formatRelativeTime } from '../../../shared/utils/format'
import type { Attribute, Brand, Category, Product, StockRecord, Supplier, Warehouse } from '../api'
import { attributeValueLabels, attributeValueOnly, primaryAttributeForCategory } from '../hooks/useAttributes'
import './ProductsTab.css'

type ProductVariant = Product['variants'][number]

// Ordena las variantes de UN producto por el valor del atributo
// "principal" de su categoria (ej. Talla) -pedido explicito: cada
// combinacion es su propia fila independiente ("Talla M Color Rojo",
// "Talla M Color Verde"...), pero agrupadas visualmente por Talla al
// quedar adyacentes, sin una fila-resumen ni una grilla separada de por
// medio. Sin atributo principal configurado, el orden original alcanza.
function sortVariantsByPrimary(
  variants: ProductVariant[],
  primary: Attribute | null,
): ProductVariant[] {
  if (!primary) return variants
  const order = new Map(primary.values.map((value, index) => [value.id, index]))
  const indexOf = (variant: ProductVariant) => {
    const match = variant.attribute_values.find((av) => order.has(av.attribute_value))
    return match ? (order.get(match.attribute_value) ?? 0) : Number.MAX_SAFE_INTEGER
  }
  return [...variants].sort((a, b) => indexOf(a) - indexOf(b))
}

type ViewMode = 'cards' | 'list'
type StatusFilter = 'all' | 'active' | 'inactive'
type SupplierFilter = number | 'none' | ''
type TypeFilter = Product['type'] | 'all'
// Universal para cualquier rubro (ropa, abarrotes, ferreteria...): el
// stock bajo/agotado es una alerta que le importa a CUALQUIER negocio que
// maneje inventario, a diferencia de un filtro por atributo especifico
// (Talla, Color) que solo tendria sentido para algunas categorias.
type StockStatusFilter = 'all' | 'low' | 'out'

const VIEW_MODE_KEY = 'fivuza-products-view'

const TYPE_LABELS: Record<Product['type'], string> = {
  PRODUCT: 'Producto',
  SERVICE: 'Servicio',
  ASSET: 'Activo fijo',
}

const UNIT_LABELS: Record<Product['unit_of_measure'], string> = {
  UND: 'Und',
  KG: 'Kg',
}

function readStoredViewMode(): ViewMode {
  const stored = localStorage.getItem(VIEW_MODE_KEY)
  return stored === 'cards' ? 'cards' : 'list'
}

// Ancho + titulo de cada columna, UNA sola fuente de verdad para el
// <colgroup> (que gobierna el ancho real de las celdas del <tbody>) y
// para el <thead> (que ahora es display:flex, no display:table-row -ver
// nota en ProductsTab.css sobre por que position:sticky no funciona
// sobre <th>/<thead> en algunos motores de renderizado). Si estos dos
// arrancaran de fuentes separadas, un cambio de ancho en uno se
// desalinearia del otro sin que nada avisara.
const PRODUCT_COLUMNS: { width: number; label: string; title?: string; grow?: boolean }[] = [
  { width: 40, label: '' },
  { width: 170, label: 'Nombre', grow: true },
  { width: 100, label: 'Categoría' },
  { width: 90, label: 'Marca' },
  { width: 130, label: 'Proveedor' },
  { width: 70, label: 'U.M.' },
  { width: 110, label: 'SKU' },
  { width: 150, label: 'Código de barras' },
  { width: 80, label: 'Costo' },
  { width: 80, label: 'Precio' },
  { width: 90, label: 'Stock mínimo' },
  { width: 70, label: 'Stock' },
  { width: 90, label: 'Estado' },
  { width: 100, label: 'Actualiz.', title: 'Actualizado' },
  { width: 70, label: '' },
]

// Tope de cuanto puede crecer la columna Nombre (la unica flexible, ver
// `grow` arriba) en pantallas anchas -sin esto absorbia TODO el espacio
// sobrante y quedaba desproporcionadamente ancha frente al resto de
// columnas angostas de al lado.
const PRODUCT_NAME_MAX_WIDTH = 320

// Suma de PRODUCT_COLUMNS -el ANCHO MINIMO de la tabla (todas las columnas
// en su ancho base, incluida Nombre). En pantallas angostas la tabla no
// encoge mas alla de esto (aparece scroll horizontal, igual que antes).
const PRODUCT_TABLE_WIDTH = PRODUCT_COLUMNS.reduce((sum, col) => sum + col.width, 0)

// Suma de las columnas fijas (todas menos Nombre) -base para repartir el
// sobrante que Nombre ya no puede absorber (ver computeProductColumnWidths).
const PRODUCT_FIXED_COLUMNS_WIDTH =
  PRODUCT_TABLE_WIDTH - (PRODUCT_COLUMNS.find((col) => col.grow)?.width ?? 0)

// Ancho de cada columna para un contenedor de `containerWidth` px.
// - Si el contenedor es mas angosto que PRODUCT_TABLE_WIDTH: cada columna
//   se queda en su ancho base (aparece scroll horizontal, igual que
//   siempre).
// - Si sobra espacio: Nombre lo absorbe primero, pero topado en
//   PRODUCT_NAME_MAX_WIDTH (sin esto quedaba desproporcionadamente ancha
//   frente al resto). Si TODAVIA sobra despues de ese tope, ese resto se
//   reparte proporcionalmente entre las demas columnas -sin este segundo
//   reparto quedaba una franja vacia a la derecha de la tabla (pedido
//   explicito: "no dejes espacio a la derecha").
function computeProductColumnWidths(containerWidth: number) {
  const surplus = Math.max(0, containerWidth - PRODUCT_TABLE_WIDTH)
  const nameBaseWidth = PRODUCT_COLUMNS.find((col) => col.grow)?.width ?? 0
  const nameGrowth = Math.min(surplus, PRODUCT_NAME_MAX_WIDTH - nameBaseWidth)
  const remainingSurplus = surplus - nameGrowth
  const scale = remainingSurplus > 0 ? 1 + remainingSurplus / PRODUCT_FIXED_COLUMNS_WIDTH : 1
  return PRODUCT_COLUMNS.map((col) => (col.grow ? nameBaseWidth + nameGrowth : col.width * scale))
}

// Imagen del producto -no existe un campo de imagen a nivel Product, solo
// por variante (ver ProductVariant.image_url en api.ts). Se usa la de la
// variante predeterminada, o la primera variante que tenga alguna, en vez
// de inventar un campo que el backend no tiene.
function productImage(product: Product): string | null {
  const withImage =
    product.variants.find((variant) => variant.is_default && variant.image_url) ??
    product.variants.find((variant) => variant.image_url)
  return withImage?.image_url ?? null
}

interface ProductsTabProps {
  products: Product[] | undefined
  loading: boolean
  search: string
  onSearchChange: (value: string) => void
  categories: Category[]
  brands: Brand[]
  suppliers: Supplier[]
  warehouses: Warehouse[]
  attributes: Attribute[]
  allStock: StockRecord[] | undefined
  canManage: boolean
  onViewProduct: (id: number) => void
  onDeleteProduct: (product: Product) => void
}

/** Catalogo de productos: vista cards y vista lista sobre los MISMOS datos
 * (ningun campo se muestra en una vista y se omite en la otra) -el usuario
 * elige la densidad que prefiere, no dos pantallas con distinta
 * informacion. Todo lo que se muestra viene directo de Product/
 * ProductVariant (api.ts); no se inventa ningun dato que el backend no
 * entregue (ver auditoria previa del dashboard, mismo criterio aca). */
export function ProductsTab({
  products,
  loading,
  search,
  onSearchChange,
  categories,
  brands,
  suppliers,
  warehouses,
  attributes,
  allStock,
  canManage,
  onViewProduct,
  onDeleteProduct,
}: ProductsTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode)
  const attributeLabels = useMemo(() => attributeValueLabels(attributes), [attributes])
  const attributeValues = useMemo(() => attributeValueOnly(attributes), [attributes])
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('')
  const [brandFilter, setBrandFilter] = useState<number | ''>('')
  const [supplierFilter, setSupplierFilter] = useState<SupplierFilter>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [stockWarehouseFilter, setStockWarehouseFilter] = useState<number | ''>('')
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>('all')

  const setViewModePersisted = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem(VIEW_MODE_KEY, mode)
  }

  // Distancia entre el tope del viewport y donde arranca la region con
  // scroll propio de abajo (titulo "Inventario", sub-tabs, fila de
  // acciones, y ahora tambien el toolbar de filtros -que vive FUERA de
  // esta region, en flujo normal, por eso no necesita ser el mismo sticky)
  // -necesaria para acotarle la altura. No se puede usar
  // <main class="erp-content"> como el scroll real: tiene overflow-x:auto
  // (ErpLayout.css), lo que por regla del modulo CSS Overflow fuerza
  // tambien overflow-y:auto, pero como esa altura no esta acotada nunca
  // llega a desbordar DE VERDAD (el documento/html es quien scrollea en la
  // practica) -eso vuelve inerte cualquier position:sticky adentro (el
  // contenedor "de referencia" nunca mueve su propio scrollTop). La unica
  // forma confiable de un header pegajoso es que ESTA region tenga su
  // propia altura acotada y su propio overflow:auto genuino, en vez de
  // depender del scroll de la pagina.
  const scrollRegionRef = useRef<HTMLDivElement>(null)
  const [regionTop, setRegionTop] = useState(0)
  useLayoutEffect(() => {
    const el = scrollRegionRef.current
    if (!el) return
    const measure = () => setRegionTop(el.getBoundingClientRect().top)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Ancho real (en px) de cada columna de la tabla de lista -no se puede
  // lograr con CSS puro (max-width en un <col> de una tabla con
  // table-layout:fixed se ignora, confirmado en el navegador: el <td>
  // seguia estirandose sin tope aunque el header si respetaba el limite,
  // desalineando ambos). Se mide el ancho disponible del contenedor con
  // ResizeObserver y se calcula a mano (computeProductColumnWidths) cuanto
  // le corresponde a cada columna -mismos numeros aplicados como <col>
  // width real (no max-width) tanto en el header como en el tbody.
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const [columnWidths, setColumnWidths] = useState(() =>
    PRODUCT_COLUMNS.map((col) => col.width),
  )
  useLayoutEffect(() => {
    const el = tableScrollRef.current
    if (!el) return
    const measure = () => setColumnWidths(computeProductColumnWidths(el.clientWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
    // viewMode Y products como dependencias a proposito -esta tabla (y su
    // ref) solo existen en el DOM cuando viewMode === 'list' Y ADEMAS ya
    // hay productos cargados (filteredProducts.length > 0). Si el efecto
    // corre en el primer render (viewMode ya es 'list' por localStorage,
    // pero products todavia es undefined mientras carga), el ref esta en
    // null y el efecto no vuelve a correr solo porque viewMode no cambio
    // despues -dejaba columnWidths fijo en sus anchos base para siempre
    // (el bug reportado: la columna Nombre no crecia en pantallas
    // anchas). products -no filteredProducts, que se recalcula cada
    // render con un array nuevo y dispararia el efecto sin necesidad en
    // cada re-render.
  }, [viewMode, products])

  // Ancho total real de la tabla -suma de columnWidths (ya calculada
  // arriba, cada columna con su ancho final). Se usa como width
  // EXPLICITO -no '100%'- tanto en <table> como en .products-header-row:
  // con width:100%, table-layout:fixed reparte cualquier sobrante entre
  // TODAS las columnas del <colgroup> de nuevo por su cuenta, ademas del
  // reparto ya hecho a mano -volviendo a desalinear todo. Con un numero
  // exacto en vez de 100%, la tabla nunca se estira mas alla de lo que
  // sus columnas realmente suman.
  const productTableWidth = columnWidths.reduce((sum, width) => sum + width, 0)

  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? '—'
  const supplierName = (id: number | null) =>
    id === null ? null : (suppliers.find((s) => s.id === id)?.company_name ?? `Proveedor #${id}`)
  const brandName = (id: number | null) =>
    id === null ? null : (brands.find((b) => b.id === id)?.name ?? `Marca #${id}`)

  // variantId -> [{warehouseId, quantity}] -construido una vez del stock
  // completo del tenant, no un fetch por variante.
  const stockByVariant = new Map<number, { warehouseId: number; quantity: string }[]>()
  allStock?.forEach((record) => {
    const list = stockByVariant.get(record.variant) ?? []
    list.push({ warehouseId: record.warehouse, quantity: record.quantity })
    stockByVariant.set(record.variant, list)
  })

  const variantStockRows = (variantId: number) => {
    const rows = stockByVariant.get(variantId) ?? []
    return stockWarehouseFilter ? rows.filter((row) => row.warehouseId === stockWarehouseFilter) : rows
  }
  const variantStockTotal = (variantId: number) =>
    variantStockRows(variantId).reduce((sum, row) => sum + Number(row.quantity), 0)

  // ["Talla: M", "Color: Azul"] -uno por atributo que la variante tenga
  // asignado (ver AttributesTab); si el negocio los sigue metiendo a mano
  // en el SKU, esto simplemente no devuelve nada extra. Una columna por
  // atributo (Talla, Color, Talla de calzado...) se probo y no escala: un
  // catalogo con varios tipos de producto (ropa, calzado, abarrotes...)
  // terminaria con una columna por cada atributo de CUALQUIER categoria,
  // casi todas vacias para la mayoria de las filas. Chips en UNA sola
  // columna "Atributos" no crecen con la cantidad de atributos del
  // catalogo, solo con los que ESA variante puntual realmente tiene.
  const variantAttributeChips = (
    variant: ProductVariant,
    primary: Attribute | null,
    excludePrimary = false,
  ) => {
    const primaryValueIds = new Set(primary?.values.map((value) => value.id) ?? [])
    return variant.attribute_values
      .filter((av) => !excludePrimary || !primaryValueIds.has(av.attribute_value))
      .map((av) => ({
        id: av.id,
        label: attributeValues.get(av.attribute_value),
        title: attributeLabels.get(av.attribute_value),
      }))
      .filter(
        (chip): chip is { id: number; label: string; title: string | undefined } =>
          Boolean(chip.label),
      )
  }

  const typesPresent = new Set((products ?? []).map((product) => product.type))

  const filteredProducts = (products ?? []).filter((product) => {
    if (categoryFilter && product.category !== categoryFilter) return false
    if (brandFilter && product.brand !== brandFilter) return false
    if (supplierFilter === 'none' && product.supplier !== null) return false
    if (typeof supplierFilter === 'number' && product.supplier !== supplierFilter) return false
    if (statusFilter === 'active' && !product.is_active) return false
    if (statusFilter === 'inactive' && product.is_active) return false
    if (typeFilter !== 'all' && product.type !== typeFilter) return false
    if (stockStatusFilter !== 'all') {
      const matches = product.variants.some((variant) => {
        const stock = variantStockTotal(variant.id)
        const minStock = Number(variant.min_stock)
        if (stockStatusFilter === 'out') return stock <= 0
        return minStock > 0 && stock <= minStock
      })
      if (!matches) return false
    }
    return true
  })

  const hasActiveFilters = Boolean(
    search ||
      categoryFilter ||
      brandFilter ||
      supplierFilter ||
      statusFilter !== 'all' ||
      typeFilter !== 'all' ||
      stockWarehouseFilter ||
      stockStatusFilter !== 'all',
  )

  const clearFilters = () => {
    onSearchChange('')
    setCategoryFilter('')
    setBrandFilter('')
    setSupplierFilter('')
    setStatusFilter('all')
    setTypeFilter('all')
    setStockWarehouseFilter('')
    setStockStatusFilter('all')
  }

  return (
    <div className="card core-table-card">
      <div className="table-toolbar products-toolbar">
        <div className="products-toolbar-filters">
          <div className="search-input">
            <Search />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por nombre..."
            />
          </div>
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(Number(event.target.value) || '')}
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
          {brands.length > 0 && (
            <select
              value={brandFilter}
              onChange={(event) => setBrandFilter(Number(event.target.value) || '')}
              aria-label="Filtrar por marca"
            >
              <option value="">Todas las marcas</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          )}
          {suppliers.length > 0 && (
            <select
              value={supplierFilter}
              onChange={(event) => {
                const value = event.target.value
                setSupplierFilter(value === 'none' ? 'none' : Number(value) || '')
              }}
              aria-label="Filtrar por proveedor"
            >
              <option value="">Todos los proveedores</option>
              <option value="none">Sin proveedor</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.company_name}
                </option>
              ))}
            </select>
          )}
          {typesPresent.size > 1 && (
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
              aria-label="Filtrar por tipo"
            >
              <option value="all">Todos los tipos</option>
              {Array.from(typesPresent).map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            aria-label="Filtrar por estado"
          >
            <option value="all">Activos e inactivos</option>
            <option value="active">Solo activos</option>
            <option value="inactive">Solo inactivos</option>
          </select>
          {warehouses.length > 1 && (
            <select
              value={stockWarehouseFilter}
              onChange={(event) => setStockWarehouseFilter(Number(event.target.value) || '')}
              aria-label="Filtrar stock por almacén"
            >
              <option value="">Stock: todos los almacenes</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  Stock: {warehouse.name}
                </option>
              ))}
            </select>
          )}
          {/* Bajo stock / agotado -util para cualquier rubro que maneje
              inventario (ropa, abarrotes, ferreteria, gimnasio con
              merchandising...), a diferencia de un filtro por atributo
              especifico que no aplicaria a todas las categorias por igual. */}
          <select
            value={stockStatusFilter}
            onChange={(event) => setStockStatusFilter(event.target.value as StockStatusFilter)}
            aria-label="Filtrar por nivel de stock"
          >
            <option value="all">Cualquier nivel de stock</option>
            <option value="low">Stock bajo</option>
            <option value="out">Sin stock</option>
          </select>
          {hasActiveFilters && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
              <XCircle size={14} strokeWidth={2} />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="view-toggle" role="group" aria-label="Cambiar vista">
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'list' ? 'view-toggle-btn-active' : ''}`}
            onClick={() => setViewModePersisted('list')}
            aria-pressed={viewMode === 'list'}
            title="Vista de lista"
          >
            <List size={15} strokeWidth={2} />
            Lista
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'cards' ? 'view-toggle-btn-active' : ''}`}
            onClick={() => setViewModePersisted('cards')}
            aria-pressed={viewMode === 'cards'}
            title="Vista de tarjetas"
          >
            <LayoutGrid size={15} strokeWidth={2} />
            Cards
          </button>
        </div>
      </div>

      <div
        className="products-scroll-region"
        ref={scrollRegionRef}
        style={{ maxHeight: `calc(100vh - ${regionTop}px)`, overflow: 'auto' }}
      >
      {loading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}

      {products && filteredProducts.length === 0 && (
        <EmptyState
          icon={<Package />}
          title={hasActiveFilters ? 'Sin resultados' : 'Todavía no hay productos'}
          subtitle={
            hasActiveFilters
              ? 'Prueba con otros filtros.'
              : canManage
                ? 'Crea el primero con "Nuevo producto".'
                : 'Cuando se agreguen productos, aparecerán aquí.'
          }
        />
      )}

      {viewMode === 'cards' && filteredProducts.length > 0 && (
        <div className="product-cards-grid">
          {filteredProducts.map((product) => {
            const image = productImage(product)
            const supplier = supplierName(product.supplier)
            const brand = brandName(product.brand)
            const hasMultipleVariants = product.variants.length > 1
            const primary = primaryAttributeForCategory(product.category, categories, attributes)
            const orderedVariants = sortVariantsByPrimary(product.variants, primary)

            const renderVariantRow = (variant: ProductVariant) => {
              const stock = variantStockTotal(variant.id)
              const minStock = Number(variant.min_stock)
              const isLowStock = minStock > 0 && stock <= minStock
              const chips = variantAttributeChips(variant, primary, false)
              return (
                <div className="product-card-variant-row" key={variant.id}>
                  <span className="product-card-variant-identity">
                    <span className="product-card-variant-sku">
                      {variant.sku}
                      {variant.is_default && hasMultipleVariants && (
                        <CheckCircle2 size={12} strokeWidth={2} color="var(--success)" />
                      )}
                      {!variant.is_active && <span className="badge badge-danger">Inactiva</span>}
                    </span>
                    {chips.length > 0 && (
                      <span className="product-card-variant-chips">
                        {chips.map((chip) => (
                          <span className="badge badge-neutral" key={chip.id} title={chip.title}>
                            {chip.label}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  <span className="product-card-variant-price">{formatCurrency(variant.price)}</span>
                  <span
                    className={`product-card-variant-stock ${isLowStock ? 'product-card-stock-low' : ''}`}
                  >
                    {formatQuantity(stock)}
                  </span>
                </div>
              )
            }

            return (
              <div className="card product-card" key={product.id}>
                <div className="product-card-image">
                  {image ? (
                    <img src={image} alt={product.name} loading="lazy" />
                  ) : (
                    <Package size={28} strokeWidth={1.5} />
                  )}
                </div>

                <div className="product-card-body">
                  <div className="product-card-header">
                    <span className="product-card-name">{product.name}</span>
                    {product.type !== 'PRODUCT' && (
                      <span className="badge badge-neutral">{TYPE_LABELS[product.type]}</span>
                    )}
                  </div>

                  {product.description && (
                    <p className="product-card-description">{product.description}</p>
                  )}

                  <p className="product-card-meta">
                    {categoryName(product.category)}
                    {brand ? ` · ${brand}` : ''}
                    {supplier ? ` · ${supplier}` : ''} · {UNIT_LABELS[product.unit_of_measure]}
                  </p>

                  <div className="product-card-badges">
                    <span className={`badge ${product.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {product.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className={`badge ${product.is_for_sale ? 'badge-success' : 'badge-neutral'}`}>
                      {product.is_for_sale ? 'En venta' : 'No en venta'}
                    </span>
                  </div>

                  {/* Cada combinacion (Talla+Color) es su propia fila
                      independiente y completa -pedido explicito, en vez de
                      una fila-resumen o una grilla aparte. Se agrupan
                      visualmente quedando ADYACENTES por Talla (ver
                      sortVariantsByPrimary) dentro del mismo borde
                      compartido de .product-card-variants. */}
                  <div
                    className={`product-card-variants ${hasMultipleVariants ? 'product-card-variants-grouped' : ''}`}
                  >
                    {orderedVariants.map((variant) => renderVariantRow(variant))}
                  </div>

                  <div className="product-card-footer">
                    <span className="product-card-updated" title={product.updated_at}>
                      Actualizado {formatRelativeTime(product.updated_at)}
                    </span>
                  </div>

                  <div className="product-card-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onViewProduct(product.id)}
                    >
                      Editar variantes
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        className="btn btn-danger-ghost btn-sm btn-icon products-row-delete"
                        title="Eliminar"
                        aria-label={`Eliminar ${product.name}`}
                        onClick={() => onDeleteProduct(product)}
                      >
                        <Trash2 />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Cada combinacion (Talla+Color) es su propia fila, completa e
          independiente -sin acordeon, sin fila-resumen: para un producto
          de 1 variante se lee igual que una tabla plana de siempre; para
          2+, quedan ADYACENTES y ordenadas por Talla (sortVariantsByPrimary)
          con las columnas de producto (imagen, nombre, categoria...) en
          blanco salvo la primera fila, asi el ojo agrupa las filas por
          compartir ese bloque en vez de tener que abrir algo. */}
      {viewMode === 'list' && filteredProducts.length > 0 && (
        // Sin overflow propio a proposito -el scroll (horizontal y
        // vertical) lo maneja .products-scroll-region como UNICO
        // contenedor con scroll real; un overflow-x:auto aca (aunque sea
        // solo para el eje horizontal) fuerza -por regla del modulo CSS
        // Overflow- que el eje Y tambien pase a 'auto', convirtiendo a
        // ESTE div en el contenedor de referencia para el thead sticky de
        // abajo en vez de la region exterior -y como este div nunca
        // desborda verticalmente por si mismo, el sticky queda inerte
        // (confirmado en el navegador: con este div cargando
        // overflowX:auto, el thead dejaba de pegarse al hacer scroll).
        <div className="products-table-scroll" ref={tableScrollRef}>
          {/* Encabezado como <div> normal, FUERA del <table> -no como
              <thead>. Un <thead> con width:100% no resuelve su ancho de
              forma confiable dentro del algoritmo de layout de una tabla
              (confirmado en el navegador: se quedaba fijo en su
              min-width, sin importar que el <table> padre si se
              estirara), mientras que un <div> normal con width:100%
              relativo a .products-table-scroll (un contenedor de bloque
              comun) SI funciona de forma predecible -mismo motivo por el
              que position:sticky tambien se saca de <th>/<thead> mas
              abajo (ver .products-header-row en ProductsTab.css). Las
              columnas siguen viniendo de PRODUCT_COLUMNS, la misma fuente
              que <colgroup>, para que ambos sigan sincronizados. */}
          <div className="products-header-row" role="row" style={{ width: productTableWidth }}>
            {PRODUCT_COLUMNS.map((col, index) => (
              <div
                key={index}
                className="products-header-cell"
                role="columnheader"
                style={{ width: columnWidths[index] }}
                title={col.title}
              >
                {col.label}
              </div>
            ))}
          </div>
          {/* width explicito en px (productTableWidth, la misma suma que
              usa .products-header-row de arriba) -NO '100%': con
              width:100%, table-layout:fixed reparte cualquier sobrante
              entre TODAS las columnas del <colgroup> por igual (ya
              ninguna es "auto", todas tienen un ancho fijo -Nombre incluye
              el suyo, ya calculado con su propio tope mas arriba),
              volviendo a desalinear todo con el header -mismo sintoma
              reportado antes, con otra causa. Con un numero exacto en vez
              de 100%, la tabla nunca se estira mas alla de lo que sus
              columnas realmente suman. */}
          <table
            className="core-table products-grouped-table"
            style={{ width: productTableWidth }}
          >
            {/* table-layout:fixed + colgroup -sin esto, el ancho de cada
                columna se recalcula por fila segun su contenido; con
                nombres/descripciones de largo variable entre filas, eso
                hace que la misma columna no caiga siempre en la misma
                posicion X. Anchos fijos = misma columna, mismo lugar,
                siempre (salvo Nombre, la unica flexible -ver arriba). */}
            <colgroup>
              {columnWidths.map((width, index) => (
                <col key={index} style={{ width }} />
              ))}
            </colgroup>
            <tbody>
              {/* Cada VARIANTE es su propia fila completa e independiente
                  ("Polo M", "Polo L", "Polo S"...) con su propio nombre,
                  categoria, marca, etc. -pedido explicito: nada de
                  agrupar bajo un "Polo" con Talla M/L/S como sub-filas en
                  blanco, porque el usuario igual va a filtrar para
                  encontrar lo que busca, no a leer la tabla de arriba
                  hacia abajo por producto. El nombre de cada fila suma el
                  producto + sus atributos (Talla, Color...) para que se
                  lea "Polo Deportivo M Rojo" de un vistazo, sin tener que
                  cruzar con la columna Atributos de al lado (que igual se
                  mantiene, para filtrar/escanear por separado). */}
              {filteredProducts
                .flatMap((product) => {
                  const primary = primaryAttributeForCategory(product.category, categories, attributes)
                  const orderedVariants = sortVariantsByPrimary(product.variants, primary)
                  return orderedVariants.map((variant) => ({ product, variant, primary }))
                })
                .map(({ product, variant, primary }, rowIndex) => {
                  const image = productImage(product)
                  const supplier = supplierName(product.supplier)
                  const brand = brandName(product.brand)
                  const stock = variantStockTotal(variant.id)
                  const minStock = Number(variant.min_stock)
                  const isLowStock = minStock > 0 && stock <= minStock
                  const chips = variantAttributeChips(variant, primary, false)
                  const variantSuffix = chips.map((chip) => chip.label).join(' ')
                  return (
                    <tr key={variant.id} className={rowIndex % 2 === 1 ? 'products-zebra' : ''}>
                      <td>
                        <div className="products-list-thumb">
                          {image ? <img src={image} alt="" loading="lazy" /> : <Package size={14} />}
                        </div>
                      </td>
                      <td className="core-table-strong products-name-cell">
                        {product.name}
                        {variantSuffix && ` ${variantSuffix}`}
                        {product.type !== 'PRODUCT' && (
                          <span className="badge badge-neutral" style={{ marginLeft: 8 }}>
                            {TYPE_LABELS[product.type]}
                          </span>
                        )}
                        {(!product.is_active || !product.is_for_sale) && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                            {!product.is_active && <span className="badge badge-danger">Inactivo</span>}
                            {!product.is_for_sale && (
                              <span className="badge badge-neutral">No en venta</span>
                            )}
                          </div>
                        )}
                        {product.description && (
                          <p className="products-list-description">{product.description}</p>
                        )}
                      </td>
                      <td>{categoryName(product.category)}</td>
                      <td>{brand ?? '—'}</td>
                      <td>{supplier ?? '—'}</td>
                      <td>{UNIT_LABELS[product.unit_of_measure]}</td>
                      <td className="core-table-strong">{variant.sku}</td>
                      <td className="products-nowrap-cell" title={variant.barcode ?? undefined}>
                        {variant.barcode ?? '—'}
                      </td>
                      <td>{formatCurrency(variant.cost)}</td>
                      <td className="products-price-cell">{formatCurrency(variant.price)}</td>
                      <td className="products-min-stock-cell">{formatQuantity(variant.min_stock)}</td>
                      <td
                        className={`products-stock-cell ${isLowStock ? 'product-card-stock-low' : ''}`}
                      >
                        {formatQuantity(stock)}
                      </td>
                      <td>
                        <span className={`badge ${variant.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {variant.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td title={product.updated_at}>{formatRelativeTime(product.updated_at)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon"
                            title="Editar"
                            aria-label={`Editar ${product.name}`}
                            onClick={() => onViewProduct(product.id)}
                          >
                            <Pencil />
                          </button>
                          {canManage && (
                            <button
                              type="button"
                              className="btn btn-danger-ghost btn-sm btn-icon products-row-delete"
                              title="Eliminar"
                              aria-label={`Eliminar ${product.name}`}
                              onClick={() => onDeleteProduct(product)}
                            >
                              <Trash2 />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  )
}
