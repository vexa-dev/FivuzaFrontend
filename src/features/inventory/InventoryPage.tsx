import {
  CheckCircle2,
  ChevronRight,
  PackageSearch,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { Fragment, useState, type ReactNode } from 'react'
import '../core/CorePage.css'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { EmptyState } from '../../shared/components/EmptyState'
import { formatCurrency, formatQuantity } from '../../shared/utils/format'
import { useAuth } from '../auth/hooks/useAuth'
import { CatalogImportTab } from './components/CatalogImportTab'
import { CategoryFormModal } from './components/CategoryFormModal'
import { KardexTab } from './components/KardexTab'
import { LabelsPrintTab } from './components/LabelsPrintTab'
import { ProductDetailModal } from './components/ProductDetailModal'
import { ProductFormModal } from './components/ProductFormModal'
import { PurchaseOrdersTab } from './components/PurchaseOrdersTab'
import { StockAdjustTab } from './components/StockAdjustTab'
import { StockTransferTab } from './components/StockTransferTab'
import { SupplierFormModal } from './components/SupplierFormModal'
import { TaxRatesTab } from './components/TaxRatesTab'
import { WarehouseFormModal } from './components/WarehouseFormModal'
import type { Category, Product, Supplier, Warehouse } from './api'
import { useCategories, useDeleteCategory } from './hooks/useCategories'
import { useDeleteProduct, useProducts } from './hooks/useProducts'
import { useDeleteSupplier, useSuppliers } from './hooks/useSuppliers'
import { useAllStock } from './hooks/useStock'
import { useDeleteWarehouse, useWarehouses } from './hooks/useWarehouses'

type Tab =
  | 'productos'
  | 'categorias'
  | 'proveedores'
  | 'almacenes'
  | 'stock'
  | 'traslados'
  | 'kardex'
  | 'compras'
  | 'impuestos'
  | 'importar'
  | 'etiquetas'

// 11 pestañas en una sola barra se desbordaban (texto partido en varias
// lineas, scroll horizontal para llegar a las ultimas). Agrupadas en 3
// categorias con sentido de negocio: cada una cabe sin desbordar y el
// usuario ve de entrada solo las ~4-5 pestañas de la seccion que le
// interesa, no las 11 juntas.
const TAB_GROUPS: { id: string; label: string; tabs: [Tab, string][] }[] = [
  {
    id: 'catalogo',
    label: 'Catálogo',
    tabs: [
      ['productos', 'Productos'],
      ['categorias', 'Categorías'],
      ['proveedores', 'Proveedores'],
      ['importar', 'Importar catálogo'],
      ['etiquetas', 'Imprimir etiquetas'],
    ],
  },
  {
    id: 'almacenes',
    label: 'Almacenes y stock',
    tabs: [
      ['almacenes', 'Almacenes'],
      ['stock', 'Ajustar stock'],
      ['traslados', 'Traslado de stock'],
      ['kardex', 'Kardex'],
    ],
  },
  {
    id: 'compras',
    label: 'Compras',
    tabs: [
      ['compras', 'Compras'],
      ['impuestos', 'Impuestos'],
    ],
  },
]

function LoadingRow() {
  return (
    <div className="loading-row">
      <span className="spinner" />
      Cargando...
    </div>
  )
}

export function InventoryPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('INVENTORY_MANAGE')
  const canManagePurchases = hasPermission('PURCHASES_MANAGE')

  const [tab, setTab] = useState<Tab>('productos')
  const [search, setSearch] = useState('')

  const { data: categories, isLoading: loadingCategories } = useCategories()
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers()
  const { data: warehouses, isLoading: loadingWarehouses } = useWarehouses()
  const { data: products, isLoading: loadingProducts } = useProducts({ search })
  // Sin filtro de busqueda -Kardex/Ajustar stock necesitan el catalogo
  // completo, independiente de lo que el usuario haya buscado en la tab
  // Productos (son pestañas distintas, no deberian compartir ese estado).
  const { data: allProducts } = useProducts()
  const { data: allStock } = useAllStock()

  const [expandedProductId, setExpandedProductId] = useState<number | null>(null)
  const [stockWarehouseFilter, setStockWarehouseFilter] = useState<number | ''>('')

  // variantId -> [{warehouseId, quantity}] -construido una vez del stock
  // completo del tenant, no un fetch por variante (evita N+1 requests al
  // expandir cada fila).
  const stockByVariant = new Map<number, { warehouseId: number; quantity: string }[]>()
  allStock?.forEach((record) => {
    const list = stockByVariant.get(record.variant) ?? []
    list.push({ warehouseId: record.warehouse, quantity: record.quantity })
    stockByVariant.set(record.variant, list)
  })

  const variantStockRows = (variantId: number) => {
    const rows = stockByVariant.get(variantId) ?? []
    return stockWarehouseFilter
      ? rows.filter((row) => row.warehouseId === stockWarehouseFilter)
      : rows
  }
  const variantStockTotal = (variantId: number) =>
    variantStockRows(variantId).reduce((sum, row) => sum + Number(row.quantity), 0)
  const productStockTotal = (product: Product) =>
    product.variants.reduce((sum, variant) => sum + variantStockTotal(variant.id), 0)

  const deleteCategory = useDeleteCategory()
  const deleteSupplier = useDeleteSupplier()
  const deleteWarehouse = useDeleteWarehouse()
  const deleteProduct = useDeleteProduct()

  const [showProductForm, setShowProductForm] = useState(false)
  const [viewingProductId, setViewingProductId] = useState<number | null>(null)
  // Se deriva del listado en vivo (no se guarda el objeto Product completo
  // en el estado) para que el modal refleje de inmediato una variante
  // recien editada, sin depender de que el usuario cierre y reabra.
  const viewingProduct = products?.find((product) => product.id === viewingProductId) ?? null
  const [editingCategory, setEditingCategory] = useState<Category | null | undefined>(undefined)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null | undefined>(undefined)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null | undefined>(undefined)
  const [showTaxRateForm, setShowTaxRateForm] = useState(false)
  const [showPurchaseOrderForm, setShowPurchaseOrderForm] = useState(false)

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null)

  const categoryName = (id: number) => categories?.find((c) => c.id === id)?.name ?? '—'

  const visibleGroups = TAB_GROUPS.map((group) => ({
    ...group,
    tabs: group.tabs.filter(
      ([value]) =>
        (!['stock', 'importar', 'etiquetas'].includes(value) || canManage) &&
        (value !== 'traslados' || (canManage && (warehouses?.length ?? 0) > 1)) &&
        (!['compras', 'impuestos'].includes(value) || canManagePurchases),
    ),
  })).filter((group) => group.tabs.length > 0)

  const activeGroup =
    visibleGroups.find((group) => group.tabs.some(([value]) => value === tab)) ?? visibleGroups[0]

  // La accion "Nuevo X" vivia adentro de la tarjeta de cada tabla, como si
  // fuera un control mas de esa tabla -pasa a la misma fila que las
  // sub-pestañas (nivel de pagina, no de tabla), un botón distinto segun
  // la pestaña activa.
  let primaryAction: ReactNode = null
  if (tab === 'productos' && canManage) {
    primaryAction = (
      <button type="button" className="btn btn-primary" onClick={() => setShowProductForm(true)}>
        <Plus size={15} strokeWidth={2.5} />
        Nuevo producto
      </button>
    )
  } else if (tab === 'categorias' && canManage) {
    primaryAction = (
      <button type="button" className="btn btn-primary" onClick={() => setEditingCategory(null)}>
        <Plus size={15} strokeWidth={2.5} />
        Nueva categoría
      </button>
    )
  } else if (tab === 'proveedores' && canManage) {
    primaryAction = (
      <button type="button" className="btn btn-primary" onClick={() => setEditingSupplier(null)}>
        <Plus size={15} strokeWidth={2.5} />
        Nuevo proveedor
      </button>
    )
  } else if (tab === 'almacenes' && canManage) {
    primaryAction = (
      <button type="button" className="btn btn-primary" onClick={() => setEditingWarehouse(null)}>
        <Plus size={15} strokeWidth={2.5} />
        Nuevo almacén
      </button>
    )
  } else if (tab === 'compras' && canManagePurchases) {
    primaryAction = (
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setShowPurchaseOrderForm(true)}
      >
        <Plus size={15} strokeWidth={2.5} />
        Nueva orden de compra
      </button>
    )
  } else if (tab === 'impuestos' && canManagePurchases) {
    primaryAction = (
      <button type="button" className="btn btn-primary" onClick={() => setShowTaxRateForm(true)}>
        <Plus size={15} strokeWidth={2.5} />
        Nuevo impuesto
      </button>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Inventario</h1>
          <p className="core-page-subtitle">Catálogo, almacenes y proveedores</p>
        </div>
      </div>

      {visibleGroups.length > 1 && (
        <div className="tab-groups">
          {visibleGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              className={`tab-group ${activeGroup.id === group.id ? 'tab-group-active' : ''}`}
              onClick={() => setTab(group.tabs[0][0])}
            >
              {group.label}
            </button>
          ))}
        </div>
      )}

      <div className="tabs-toolbar-row">
        <div className="tabs">
          {activeGroup.tabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`tab ${tab === value ? 'tab-active' : ''}`}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {primaryAction}
      </div>

      {tab === 'productos' && (
        <div className="card core-table-card">
          <div className="table-toolbar" style={{ justifyContent: 'flex-start' }}>
            <div className="search-input">
              <Search />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre..."
              />
            </div>
            {(warehouses?.length ?? 0) > 1 && (
              <select
                value={stockWarehouseFilter}
                onChange={(event) => setStockWarehouseFilter(Number(event.target.value) || '')}
                style={{ maxWidth: 200 }}
                aria-label="Filtrar stock por almacén"
              >
                <option value="">Stock: todos los almacenes</option>
                {warehouses?.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    Stock: {warehouse.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {loadingProducts && <LoadingRow />}
          {products && products.length === 0 && (
            <EmptyState
              icon={<PackageSearch />}
              title={search ? 'Sin resultados' : 'Todavía no hay productos'}
              subtitle={
                search
                  ? 'Prueba con otro término de búsqueda.'
                  : canManage
                    ? 'Crea el primero con "Nuevo producto".'
                    : 'Cuando se agreguen productos, aparecerán aquí.'
              }
            />
          )}
          {products && products.length > 0 && (
            <table className="core-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Variantes</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const expanded = expandedProductId === product.id
                  return (
                    <Fragment key={product.id}>
                      <tr
                        className="core-table-row-expandable"
                        onClick={() => setExpandedProductId(expanded ? null : product.id)}
                      >
                        <td>
                          <ChevronRight
                            size={15}
                            strokeWidth={2}
                            className={`core-table-chevron ${expanded ? 'core-table-chevron-open' : ''}`}
                          />
                        </td>
                        <td className="core-table-strong">{product.name}</td>
                        <td>{categoryName(product.category)}</td>
                        <td>
                          <span className="badge badge-neutral">{product.variants.length}</span>
                        </td>
                        <td className="core-table-strong">{formatQuantity(productStockTotal(product))}</td>
                        <td>
                          <div className="row-actions" onClick={(event) => event.stopPropagation()}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setViewingProductId(product.id)}
                            >
                              Ver variantes
                            </button>
                            {canManage && (
                              <button
                                type="button"
                                className="btn btn-danger-ghost btn-sm btn-icon"
                                aria-label={`Eliminar ${product.name}`}
                                onClick={() => setDeletingProduct(product)}
                              >
                                <Trash2 />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="core-table-expanded-row">
                          <td colSpan={6}>
                            <table className="core-table core-table-nested">
                              <thead>
                                <tr>
                                  <th>SKU</th>
                                  <th>Precio compra</th>
                                  <th>Precio venta</th>
                                  <th>Stock</th>
                                  <th>Predet.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {product.variants.map((variant) => {
                                  const rows = variantStockRows(variant.id)
                                  return (
                                    <tr key={variant.id}>
                                      <td className="core-table-strong">{variant.sku}</td>
                                      <td>{formatCurrency(variant.cost)}</td>
                                      <td>{formatCurrency(variant.price)}</td>
                                      <td>
                                        {stockWarehouseFilter || rows.length <= 1 ? (
                                          formatQuantity(variantStockTotal(variant.id))
                                        ) : (
                                          <span className="core-table-stock-breakdown">
                                            {rows.map((row) => (
                                              <span key={row.warehouseId}>
                                                {warehouses?.find((w) => w.id === row.warehouseId)?.name ??
                                                  `#${row.warehouseId}`}
                                                : {formatQuantity(row.quantity)}
                                              </span>
                                            ))}
                                          </span>
                                        )}
                                      </td>
                                      <td>
                                        {variant.is_default && (
                                          <CheckCircle2
                                            size={15}
                                            strokeWidth={2}
                                            color="var(--success)"
                                          />
                                        )}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'categorias' && (
        <div className="card core-table-card">
          {loadingCategories && <LoadingRow />}
          {categories && categories.length === 0 && (
            <EmptyState icon={<PackageSearch />} title="Todavía no hay categorías" />
          )}
          {categories && categories.length > 0 && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="core-table-strong">{category.name}</td>
                    {canManage && (
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon"
                            aria-label={`Editar ${category.name}`}
                            onClick={() => setEditingCategory(category)}
                          >
                            <Pencil />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-ghost btn-sm btn-icon"
                            aria-label={`Eliminar ${category.name}`}
                            onClick={() => setDeletingCategory(category)}
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'proveedores' && (
        <div className="card core-table-card">
          {loadingSuppliers && <LoadingRow />}
          {suppliers && suppliers.length === 0 && (
            <EmptyState icon={<PackageSearch />} title="Todavía no hay proveedores" />
          )}
          {suppliers && suppliers.length > 0 && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>RUC/DNI</th>
                  <th>Razón social</th>
                  <th>Teléfono</th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.ruc_or_dni}</td>
                    <td className="core-table-strong">{supplier.company_name}</td>
                    <td>{supplier.phone}</td>
                    {canManage && (
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon"
                            aria-label={`Editar ${supplier.company_name}`}
                            onClick={() => setEditingSupplier(supplier)}
                          >
                            <Pencil />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-ghost btn-sm btn-icon"
                            aria-label={`Eliminar ${supplier.company_name}`}
                            onClick={() => setDeletingSupplier(supplier)}
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'almacenes' && (
        <div className="card core-table-card">
          {loadingWarehouses && <LoadingRow />}
          {warehouses && warehouses.length === 0 && (
            <EmptyState icon={<PackageSearch />} title="Todavía no hay almacenes" />
          )}
          {warehouses && warehouses.length > 0 && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {warehouses.map((warehouse) => (
                  <tr key={warehouse.id}>
                    <td className="core-table-strong">{warehouse.name}</td>
                    <td>{warehouse.address}</td>
                    {canManage && (
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon"
                            aria-label={`Editar ${warehouse.name}`}
                            onClick={() => setEditingWarehouse(warehouse)}
                          >
                            <Pencil />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-ghost btn-sm btn-icon"
                            aria-label={`Eliminar ${warehouse.name}`}
                            onClick={() => setDeletingWarehouse(warehouse)}
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'stock' && canManage && (
        <StockAdjustTab products={allProducts ?? []} warehouses={warehouses ?? []} />
      )}

      {tab === 'traslados' && canManage && (
        <StockTransferTab products={allProducts ?? []} warehouses={warehouses ?? []} />
      )}

      {tab === 'kardex' && (
        <KardexTab products={allProducts ?? []} warehouses={warehouses ?? []} />
      )}

      {tab === 'compras' && canManagePurchases && (
        <PurchaseOrdersTab
          canManage={canManagePurchases}
          suppliers={suppliers ?? []}
          warehouses={warehouses ?? []}
          products={allProducts ?? []}
          showCreateForm={showPurchaseOrderForm}
          onCloseCreateForm={() => setShowPurchaseOrderForm(false)}
        />
      )}

      {tab === 'impuestos' && canManagePurchases && (
        <TaxRatesTab
          canManage={canManagePurchases}
          showCreateForm={showTaxRateForm}
          onCloseCreateForm={() => setShowTaxRateForm(false)}
        />
      )}

      {tab === 'importar' && canManage && <CatalogImportTab />}

      {tab === 'etiquetas' && canManage && <LabelsPrintTab products={allProducts ?? []} />}

      {showProductForm && (
        <ProductFormModal
          categories={categories ?? []}
          suppliers={suppliers ?? []}
          onClose={() => setShowProductForm(false)}
        />
      )}

      {viewingProduct && (
        <ProductDetailModal
          product={viewingProduct}
          canManage={canManage}
          onClose={() => setViewingProductId(null)}
        />
      )}

      {editingCategory !== undefined && (
        <CategoryFormModal
          editingCategory={editingCategory}
          onClose={() => setEditingCategory(undefined)}
        />
      )}

      {editingSupplier !== undefined && (
        <SupplierFormModal
          editingSupplier={editingSupplier}
          onClose={() => setEditingSupplier(undefined)}
        />
      )}

      {editingWarehouse !== undefined && (
        <WarehouseFormModal
          editingWarehouse={editingWarehouse}
          onClose={() => setEditingWarehouse(undefined)}
        />
      )}

      {deletingProduct && (
        <ConfirmDialog
          title="Dar de baja producto"
          message={`¿Dar de baja "${deletingProduct.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Dar de baja"
          onConfirm={() => deleteProduct.mutate(deletingProduct.id)}
          onClose={() => setDeletingProduct(null)}
        />
      )}

      {deletingCategory && (
        <ConfirmDialog
          title="Eliminar categoría"
          message={`¿Eliminar "${deletingCategory.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => deleteCategory.mutate(deletingCategory.id)}
          onClose={() => setDeletingCategory(null)}
        />
      )}

      {deletingSupplier && (
        <ConfirmDialog
          title="Eliminar proveedor"
          message={`¿Eliminar "${deletingSupplier.company_name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => deleteSupplier.mutate(deletingSupplier.id)}
          onClose={() => setDeletingSupplier(null)}
        />
      )}

      {deletingWarehouse && (
        <ConfirmDialog
          title="Eliminar almacén"
          message={`¿Eliminar "${deletingWarehouse.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => deleteWarehouse.mutate(deletingWarehouse.id)}
          onClose={() => setDeletingWarehouse(null)}
        />
      )}
    </div>
  )
}
