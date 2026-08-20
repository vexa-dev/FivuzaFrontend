import {
  ArrowDownUp,
  BadgeCheck,
  Clock3,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Coins,
  Columns3,
  Layers3,
  List,
  Package,
  PanelRight,
  Pencil,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Tags,
  Truck,
  Warehouse as WarehouseIcon,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatCurrency, formatQuantity, formatRelativeTime } from '../../../shared/utils/format'
import type { Attribute, Brand, Category, Product, StockRecord, Supplier, Warehouse } from '../api'
import { attributeValueLabels, attributeValueOnly, primaryAttributeForCategory } from '../hooks/useAttributes'
import { ProductInsights } from './ProductInsights'
import {
  COLUMNS_KEY,
  DEFAULT_OPTIONAL_COLUMNS,
  LIST_COLUMNS,
  MASTER_WIDTH_DEFAULT,
  MASTER_WIDTH_KEY,
  MASTER_WIDTH_MAX,
  MASTER_WIDTH_MIN,
  OPTIONAL_COLUMNS,
  PAGE_SIZE_KEY,
  PAGE_SIZE_OPTIONS,
  TYPE_LABELS,
  UNIT_LABELS,
  VIEW_MODE_KEY,
  clampMasterWidth,
  formatCostRange,
  formatPriceRange,
  productImage,
  readStoredColumns,
  readStoredMasterWidth,
  readStoredPageSize,
  readStoredViewMode,
  sortVariantsByPrimary,
} from './ProductsTab.model'
import type {
  ListColumn,
  OptionalColumnId,
  ProductVariant,
  SortOption,
  StatusFilter,
  StockStatusFilter,
  SupplierFilter,
  TypeFilter,
  VariantRow,
  ViewMode,
} from './ProductsTab.model'
import './ProductsTab.css'

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
  const [visibleOptionalColumns, setVisibleOptionalColumns] = useState<OptionalColumnId[]>(readStoredColumns)
  const [pageSize, setPageSize] = useState(readStoredPageSize)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [masterListWidth, setMasterListWidth] = useState(readStoredMasterWidth)
  const [isResizingMaster, setIsResizingMaster] = useState(false)
  const [tableContainerWidth, setTableContainerWidth] = useState(0)
  const [productsPanelHeight, setProductsPanelHeight] = useState<number | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('')
  const [brandFilter, setBrandFilter] = useState<number | ''>('')
  const [supplierFilter, setSupplierFilter] = useState<SupplierFilter>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [stockWarehouseFilter, setStockWarehouseFilter] = useState<number | ''>('')
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('name')
  const [sortDescending, setSortDescending] = useState(false)
  const productsCardRef = useRef<HTMLDivElement>(null)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const masterResizeStart = useRef({ pointerX: 0, width: MASTER_WIDTH_DEFAULT })
  const masterResizing = useRef(false)
  const masterPendingWidth = useRef(masterListWidth)

  const attributeLabels = useMemo(() => attributeValueLabels(attributes), [attributes])
  const attributeValues = useMemo(() => attributeValueOnly(attributes), [attributes])
  const stockByVariant = useMemo(() => {
    const result = new Map<number, { warehouseId: number; quantity: number }[]>()
    allStock?.forEach((record) => {
      const rows = result.get(record.variant) ?? []
      rows.push({ warehouseId: record.warehouse, quantity: Number(record.quantity) })
      result.set(record.variant, rows)
    })
    return result
  }, [allStock])

  const categoryName = (id: number) => categories.find((category) => category.id === id)?.name ?? '—'
  const supplierName = (id: number | null) =>
    id === null ? null : (suppliers.find((supplier) => supplier.id === id)?.company_name ?? `Proveedor #${id}`)
  const brandName = (id: number | null) =>
    id === null ? null : (brands.find((brand) => brand.id === id)?.name ?? `Marca #${id}`)
  const variantStockTotal = (variantId: number) =>
    (stockByVariant.get(variantId) ?? [])
      .filter((row) => !stockWarehouseFilter || row.warehouseId === stockWarehouseFilter)
      .reduce((total, row) => total + row.quantity, 0)
  const productStockTotal = (product: Product) =>
    product.variants.reduce((total, variant) => total + variantStockTotal(variant.id), 0)
  const productStockAtWarehouse = (product: Product, warehouseId: number) =>
    product.variants.reduce(
      (total, variant) =>
        total +
        (stockByVariant.get(variant.id) ?? [])
          .filter((row) => row.warehouseId === warehouseId)
          .reduce((sum, row) => sum + row.quantity, 0),
      0,
    )
  const productHasLowStock = (product: Product) =>
    product.variants.some((variant) => {
      const minimum = Number(variant.min_stock)
      return minimum > 0 && variantStockTotal(variant.id) <= minimum
    })
  const variantAttributeChips = (variant: ProductVariant) =>
    variant.attribute_values
      .map((value) => ({
        id: value.id,
        label: attributeValues.get(value.attribute_value),
        title: attributeLabels.get(value.attribute_value),
      }))
      .filter(
        (chip): chip is { id: number; label: string; title: string | undefined } => Boolean(chip.label),
      )

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
        const minimum = Number(variant.min_stock)
        return stockStatusFilter === 'out' ? stock <= 0 : minimum > 0 && stock <= minimum
      })
      if (!matches) return false
    }
    return true
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0
    if (sortOption === 'name') {
      comparison = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    } else if (sortOption === 'price') {
      const minimumPrice = (product: Product) =>
        product.variants.length ? Math.min(...product.variants.map((variant) => Number(variant.price))) : 0
      comparison = minimumPrice(a) - minimumPrice(b)
    } else if (sortOption === 'stock') {
      comparison = productStockTotal(a) - productStockTotal(b)
    } else {
      comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    }
    return sortDescending ? -comparison : comparison
  })

  const variantRows: VariantRow[] = sortedProducts.flatMap((product) => {
    const primary = primaryAttributeForCategory(product.category, categories, attributes)
    return sortVariantsByPrimary(product.variants, primary).map((variant, index) => ({
      product,
      variant,
      productStart: index === 0,
    }))
  })
  const pageCount = Math.max(1, Math.ceil(variantRows.length / pageSize))
  const pageRows = variantRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const pageStart = variantRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, variantRows.length)
  const selectedProduct = sortedProducts.find((product) => product.id === selectedProductId) ?? sortedProducts[0] ?? null
  const effectiveSelectedProductId = selectedProduct?.id ?? null
  const activeOptionalColumns = new Set(visibleOptionalColumns)
  const visibleColumns = LIST_COLUMNS.filter(
    (column) => !column.optional || activeOptionalColumns.has(column.id as OptionalColumnId),
  )
  const tableMinimumWidth = visibleColumns.reduce((total, column) => total + column.width, 0)
  const availableSurplus = Math.max(0, tableContainerWidth - tableMinimumWidth)
  const totalGrow = visibleColumns.reduce((total, column) => total + column.grow, 0)
  const columnWidths = visibleColumns.map((column) =>
    column.width + (totalGrow > 0 ? (availableSurplus * column.grow) / totalGrow : 0),
  )
  const tableWidth = Math.max(tableMinimumWidth, tableContainerWidth)
  const advancedFilterCount = [
    Boolean(brandFilter),
    Boolean(supplierFilter),
    statusFilter !== 'all',
    typeFilter !== 'all',
    Boolean(stockWarehouseFilter),
  ].filter(Boolean).length
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === stockWarehouseFilter)
  const stockMetricLabel = selectedWarehouse ? `Stock en ${selectedWarehouse.name}` : 'Stock total'
  const selectedStockAlerts = selectedProduct
    ? selectedProduct.variants.reduce(
        (summary, variant) => {
          const stock = variantStockTotal(variant.id)
          const minimum = Number(variant.min_stock)
          if (stock <= 0) summary.out += 1
          else if (minimum > 0 && stock <= minimum) summary.low += 1
          return summary
        },
        { out: 0, low: 0 },
      )
    : { out: 0, low: 0 }
  const selectedInventoryInsights = selectedProduct
    ? selectedProduct.variants.reduce(
        (summary, variant) => {
          const stock = variantStockTotal(variant.id)
          const positiveStock = Math.max(0, stock)
          const shortage = Math.max(0, Number(variant.min_stock) - stock)
          summary.costValue += positiveStock * Number(variant.cost)
          summary.saleValue += positiveStock * Number(variant.price)
          summary.reorderUnits += shortage
          summary.missingImages += variant.image_url ? 0 : 1
          summary.missingBarcodes += variant.barcode ? 0 : 1
          summary.inactiveVariants += variant.is_active ? 0 : 1
          if (shortage > summary.mostUrgent.shortage) {
            summary.mostUrgent = { sku: variant.sku, shortage }
          }
          return summary
        },
        {
          costValue: 0,
          saleValue: 0,
          reorderUnits: 0,
          missingImages: 0,
          missingBarcodes: 0,
          inactiveVariants: 0,
          mostUrgent: { sku: '', shortage: 0 },
        },
      )
    : {
        costValue: 0,
        saleValue: 0,
        reorderUnits: 0,
        missingImages: 0,
        missingBarcodes: 0,
        inactiveVariants: 0,
        mostUrgent: { sku: '', shortage: 0 },
      }
  const selectedWarehouseStock = selectedProduct
    ? warehouses.map((warehouse) => ({
        ...warehouse,
        quantity: productStockAtWarehouse(selectedProduct, warehouse.id),
      }))
    : []
  const maximumWarehouseStock = Math.max(
    1,
    ...selectedWarehouseStock.map((warehouse) => Math.max(0, warehouse.quantity)),
  )
  const masterDetailStyle = {
    '--products-master-width': `${masterListWidth}px`,
  } as CSSProperties
  const productsCardStyle = productsPanelHeight
    ? ({ '--products-panel-height': `${productsPanelHeight}px` } as CSSProperties)
    : undefined

  useEffect(() => {
    setSelectedProductId(effectiveSelectedProductId)
  }, [effectiveSelectedProductId])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, categoryFilter, brandFilter, supplierFilter, statusFilter, typeFilter, stockWarehouseFilter, stockStatusFilter, sortOption, sortDescending, pageSize])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount))
  }, [pageCount])

  useEffect(() => {
    if (viewMode !== 'list' || variantRows.length === 0) return
    const element = tableScrollRef.current
    if (!element) return
    const measure = () => setTableContainerWidth(element.clientWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [viewMode, variantRows.length])

  useEffect(() => {
    const measureAvailableHeight = () => {
      if (window.matchMedia?.('(max-width: 1023px)').matches) {
        setProductsPanelHeight(null)
        return
      }
      const element = productsCardRef.current
      if (!element) return
      const availableHeight = Math.max(
        420,
        Math.floor(window.innerHeight - element.getBoundingClientRect().top - 56),
      )
      setProductsPanelHeight(availableHeight)
    }

    measureAvailableHeight()
    window.addEventListener('resize', measureAvailableHeight)
    window.visualViewport?.addEventListener('resize', measureAvailableHeight)
    return () => {
      window.removeEventListener('resize', measureAvailableHeight)
      window.visualViewport?.removeEventListener('resize', measureAvailableHeight)
    }
  }, [])

  const setViewModePersisted = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem(VIEW_MODE_KEY, mode)
  }

  const toggleColumn = (column: OptionalColumnId) => {
    setVisibleOptionalColumns((current) => {
      const next = current.includes(column) ? current.filter((item) => item !== column) : [...current, column]
      localStorage.setItem(COLUMNS_KEY, JSON.stringify(next))
      return next
    })
  }

  const resetColumns = () => {
    setVisibleOptionalColumns(DEFAULT_OPTIONAL_COLUMNS)
    localStorage.setItem(COLUMNS_KEY, JSON.stringify(DEFAULT_OPTIONAL_COLUMNS))
  }

  const changePageSize = (size: number) => {
    setPageSize(size)
    localStorage.setItem(PAGE_SIZE_KEY, String(size))
  }

  const persistMasterWidth = (width: number) => {
    const clamped = clampMasterWidth(width)
    setMasterListWidth(clamped)
    localStorage.setItem(MASTER_WIDTH_KEY, String(clamped))
  }

  const handleMasterPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    masterResizeStart.current = { pointerX: event.clientX, width: masterListWidth }
    masterPendingWidth.current = masterListWidth
    masterResizing.current = true
    setIsResizingMaster(true)
  }

  const handleMasterPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!masterResizing.current) return
    const nextWidth = masterResizeStart.current.width + event.clientX - masterResizeStart.current.pointerX
    masterPendingWidth.current = clampMasterWidth(nextWidth)
    setMasterListWidth(masterPendingWidth.current)
  }

  const handleMasterPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!masterResizing.current) return
    masterResizing.current = false
    setIsResizingMaster(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    persistMasterWidth(masterPendingWidth.current)
  }

  const handleMasterKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    let nextWidth: number | null = null
    if (event.key === 'ArrowLeft') nextWidth = masterListWidth - 16
    if (event.key === 'ArrowRight') nextWidth = masterListWidth + 16
    if (event.key === 'Home') nextWidth = MASTER_WIDTH_MIN
    if (event.key === 'End') nextWidth = MASTER_WIDTH_MAX
    if (nextWidth === null) return
    event.preventDefault()
    persistMasterWidth(nextWidth)
  }

  const selectProduct = (product: Product) => {
    if (window.matchMedia?.('(max-width: 1023px)').matches) {
      onViewProduct(product.id)
      return
    }
    setSelectedProductId(product.id)
  }

  const hasActiveFilters = Boolean(
    search || categoryFilter || brandFilter || supplierFilter || statusFilter !== 'all' ||
    typeFilter !== 'all' || stockWarehouseFilter || stockStatusFilter !== 'all',
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

  const renderListCell = (column: ListColumn, row: VariantRow) => {
    const { product, variant } = row
    const stock = variantStockTotal(variant.id)
    const minimum = Number(variant.min_stock)
    const stockAlert = stock <= 0 || (minimum > 0 && stock <= minimum)
    const suffix = variantAttributeChips(variant).map((chip) => chip.label).join(' ')
    const active = product.is_active && variant.is_active

    switch (column.id) {
      case 'product': {
        const image = productImage(product)
        return (
          <div className="products-list-product">
            <span className="products-list-thumb">
              {image ? <img src={image} alt="" loading="lazy" /> : <Package size={14} />}
            </span>
            <span className="products-list-product-copy">
              <strong>{product.name}{suffix ? ` ${suffix}` : ''}</strong>
              {product.type !== 'PRODUCT' && <small>{TYPE_LABELS[product.type]}</small>}
            </span>
          </div>
        )
      }
      case 'category': return categoryName(product.category)
      case 'brand': return brandName(product.brand) ?? 'Sin marca'
      case 'supplier': return supplierName(product.supplier) ?? 'Sin proveedor'
      case 'unit': return UNIT_LABELS[product.unit_of_measure]
      case 'sku': return <strong>{variant.sku}</strong>
      case 'cost': return formatCurrency(variant.cost)
      case 'price': return <strong>{formatCurrency(variant.price)}</strong>
      case 'barcode': return variant.barcode ?? '—'
      case 'stock':
        return <strong className={stockAlert ? 'products-stock-low' : ''}>{formatQuantity(stock)}</strong>
      case 'minStock':
        return <span className="products-min-stock-badge" aria-label={`Stock mínimo ${formatQuantity(variant.min_stock)}`}>Mín. {formatQuantity(variant.min_stock)}</span>
      case 'status':
        return <span className={`badge ${active ? 'badge-success' : 'badge-danger'}`}>{active ? 'Activa' : 'Inactiva'}</span>
      case 'updated':
        return <span title={product.updated_at}>{formatRelativeTime(product.updated_at)}</span>
      case 'actions':
        return (
          <div className="row-actions">
            <button type="button" className="btn btn-ghost btn-sm btn-icon" title={canManage ? 'Gestionar variantes' : 'Ver detalle'} aria-label={`${canManage ? 'Gestionar' : 'Ver'} ${product.name}`} onClick={() => onViewProduct(product.id)}><Pencil /></button>
            {canManage && <button type="button" className="btn btn-danger-ghost btn-sm btn-icon products-row-delete" title="Eliminar producto" aria-label={`Eliminar ${product.name}`} onClick={() => onDeleteProduct(product)}><Trash2 /></button>}
          </div>
        )
    }
  }

  return (
    <div className="card core-table-card products-card" ref={productsCardRef} style={productsCardStyle}>
      <div className="table-toolbar products-toolbar">
        <div className="products-toolbar-primary">
          <div className="search-input">
            <Search />
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar por nombre..." />
          </div>
          {categories.length > 0 && (
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(Number(event.target.value) || '')} aria-label="Filtrar por categoría">
              <option value="">Todas las categorías</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          )}
          <select value={stockStatusFilter} onChange={(event) => setStockStatusFilter(event.target.value as StockStatusFilter)} aria-label="Filtrar por nivel de stock">
            <option value="all">Cualquier nivel de stock</option>
            <option value="low">Stock bajo</option>
            <option value="out">Sin stock</option>
          </select>
          <details className="products-popover products-more-filters">
            <summary>
              <SlidersHorizontal size={14} />
              Más filtros
              {advancedFilterCount > 0 && <span className="products-filter-count">{advancedFilterCount}</span>}
            </summary>
            <div className="products-popover-panel products-more-filters-panel">
              {brands.length > 0 && (
                <label className="products-filter-field">
                  <span>Marca</span>
                  <select value={brandFilter} onChange={(event) => setBrandFilter(Number(event.target.value) || '')}>
                    <option value="">Todas las marcas</option>
                    {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                  </select>
                </label>
              )}
              {suppliers.length > 0 && (
                <label className="products-filter-field">
                  <span>Proveedor</span>
                  <select value={supplierFilter} onChange={(event) => { const value = event.target.value; setSupplierFilter(value === 'none' ? 'none' : Number(value) || '') }}>
                    <option value="">Todos los proveedores</option>
                    <option value="none">Sin proveedor</option>
                    {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.company_name}</option>)}
                  </select>
                </label>
              )}
              {typesPresent.size > 1 && (
                <label className="products-filter-field">
                  <span>Tipo</span>
                  <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}>
                    <option value="all">Todos los tipos</option>
                    {Array.from(typesPresent).map((type) => <option key={type} value={type}>{TYPE_LABELS[type]}</option>)}
                  </select>
                </label>
              )}
              <label className="products-filter-field">
                <span>Estado</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                  <option value="all">Activos e inactivos</option><option value="active">Solo activos</option><option value="inactive">Solo inactivos</option>
                </select>
              </label>
              {warehouses.length > 1 && (
                <label className="products-filter-field">
                  <span>Almacén</span>
                  <select value={stockWarehouseFilter} onChange={(event) => setStockWarehouseFilter(Number(event.target.value) || '')}>
                    <option value="">Todos los almacenes</option>
                    {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                  </select>
                </label>
              )}
            </div>
          </details>
          {hasActiveFilters && <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}><XCircle size={14} />Limpiar filtros</button>}
        </div>

        <div className="products-toolbar-actions">
          <label className="products-sort-control">
            <ArrowDownUp size={14} /><span className="sr-only">Ordenar productos</span>
            <select value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)} aria-label="Ordenar productos">
              <option value="name">Nombre</option><option value="price">Precio</option><option value="stock">Stock</option><option value="updated">Actualización</option>
            </select>
            <button type="button" className="products-sort-direction" onClick={() => setSortDescending((value) => !value)} aria-label={sortDescending ? 'Orden ascendente' : 'Orden descendente'} title={sortDescending ? 'Orden ascendente' : 'Orden descendente'}>{sortDescending ? '↓' : '↑'}</button>
          </label>
          {viewMode === 'list' && (
            <details className="products-popover products-columns-menu">
              <summary><Columns3 size={14} />Columnas</summary>
              <div className="products-popover-panel products-columns-panel">
                <strong>Columnas visibles</strong>
                {OPTIONAL_COLUMNS.map((column) => (
                  <label key={column.id}><input type="checkbox" checked={activeOptionalColumns.has(column.id)} onChange={() => toggleColumn(column.id)} />{column.label}</label>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={resetColumns}><RotateCcw size={13} />Restablecer columnas</button>
              </div>
            </details>
          )}

          <div className="view-toggle" role="group" aria-label="Cambiar vista">
            <button type="button" className={`view-toggle-btn ${viewMode === 'list' ? 'view-toggle-btn-active' : ''}`} onClick={() => setViewModePersisted('list')} aria-pressed={viewMode === 'list'}><List size={15} />Lista</button>
            <button type="button" className={`view-toggle-btn ${viewMode === 'detail' ? 'view-toggle-btn-active' : ''}`} onClick={() => setViewModePersisted('detail')} aria-pressed={viewMode === 'detail'}><PanelRight size={15} />Detalle</button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="products-active-filters" aria-label="Filtros activos">
            {search && <button type="button" onClick={() => onSearchChange('')}>Búsqueda: {search}<XCircle size={12} /></button>}
            {categoryFilter && <button type="button" onClick={() => setCategoryFilter('')}>{categoryName(categoryFilter)}<XCircle size={12} /></button>}
            {brandFilter && <button type="button" onClick={() => setBrandFilter('')}>{brandName(brandFilter)}<XCircle size={12} /></button>}
            {supplierFilter && <button type="button" onClick={() => setSupplierFilter('')}>{supplierFilter === 'none' ? 'Sin proveedor' : supplierName(supplierFilter)}<XCircle size={12} /></button>}
            {statusFilter !== 'all' && <button type="button" onClick={() => setStatusFilter('all')}>{statusFilter === 'active' ? 'Solo activos' : 'Solo inactivos'}<XCircle size={12} /></button>}
            {typeFilter !== 'all' && <button type="button" onClick={() => setTypeFilter('all')}>{TYPE_LABELS[typeFilter]}<XCircle size={12} /></button>}
            {stockWarehouseFilter && <button type="button" onClick={() => setStockWarehouseFilter('')}>Stock: {warehouses.find((warehouse) => warehouse.id === stockWarehouseFilter)?.name ?? 'almacén'}<XCircle size={12} /></button>}
            {stockStatusFilter !== 'all' && <button type="button" onClick={() => setStockStatusFilter('all')}>{stockStatusFilter === 'low' ? 'Stock bajo' : 'Sin stock'}<XCircle size={12} /></button>}
          </div>
        )}
      </div>

      <div className={`products-content ${viewMode === 'detail' ? 'products-content-detail' : ''}`}>
        {loading && <div className="loading-row"><span className="spinner" />Cargando...</div>}
        {products && filteredProducts.length === 0 && (
          <EmptyState icon={<Package />} title={hasActiveFilters ? 'Sin resultados' : 'Todavía no hay productos'} subtitle={hasActiveFilters ? 'Prueba con otros filtros.' : canManage ? 'Crea el primero con "Nuevo producto".' : 'Cuando se agreguen productos, aparecerán aquí.'} />
        )}

        {viewMode === 'detail' && sortedProducts.length > 0 && (
          <div className={`products-master-detail ${isResizingMaster ? 'products-master-detail-resizing' : ''}`} style={masterDetailStyle}>
            <aside className="products-master-list" id="products-master-list" aria-label="Productos">
              <div className="products-master-count">{sortedProducts.length} productos</div>
              {sortedProducts.map((product) => {
                const image = productImage(product)
                const stock = productStockTotal(product)
                const lowStock = productHasLowStock(product)
                const partner = brandName(product.brand) ?? supplierName(product.supplier)
                return (
                  <button type="button" key={product.id} className={`products-master-item ${selectedProduct?.id === product.id ? 'products-master-item-active' : ''}`} onClick={() => selectProduct(product)} aria-current={selectedProduct?.id === product.id ? 'true' : undefined}>
                    <span className="products-master-thumb">{image ? <img src={image} alt="" loading="lazy" /> : <Package size={17} />}</span>
                    <span className="products-master-copy">
                      <strong>{product.name}</strong>
                      <small>{categoryName(product.category)}{partner ? ` · ${partner}` : ''}</small>
                      <span className="products-master-metrics"><span>{product.variants.length} variantes</span><span>{formatPriceRange(product.variants)}</span><span className={lowStock ? 'products-stock-low' : ''}>{formatQuantity(stock)} stock</span></span>
                    </span>
                    <ChevronRight className="products-master-chevron" size={16} />
                  </button>
                )
              })}
            </aside>

            <div
              className="products-master-resizer"
              role="separator"
              tabIndex={0}
              aria-label="Cambiar ancho de la lista de productos"
              aria-controls="products-master-list products-detail-panel"
              aria-orientation="vertical"
              aria-valuemin={MASTER_WIDTH_MIN}
              aria-valuemax={MASTER_WIDTH_MAX}
              aria-valuenow={Math.round(masterListWidth)}
              onPointerDown={handleMasterPointerDown}
              onPointerMove={handleMasterPointerMove}
              onPointerUp={handleMasterPointerEnd}
              onPointerCancel={handleMasterPointerEnd}
              onKeyDown={handleMasterKeyDown}
              onDoubleClick={() => persistMasterWidth(MASTER_WIDTH_DEFAULT)}
              title="Arrastra para cambiar el ancho. Doble clic para restablecer."
            >
              <span />
            </div>

            {selectedProduct && (
              <section className="products-detail-panel" id="products-detail-panel" aria-label={`Detalle de ${selectedProduct.name}`}>
                <header className="products-detail-header">
                  <span className="products-detail-image">{productImage(selectedProduct) ? <img src={productImage(selectedProduct) ?? ''} alt="" /> : <Package size={26} />}</span>
                  <span className="products-detail-title">
                    <span className="products-detail-title-line"><h3>{selectedProduct.name}</h3><span className={`badge ${selectedProduct.is_active ? 'badge-success' : 'badge-danger'}`}>{selectedProduct.is_active ? 'Activo' : 'Inactivo'}</span></span>
                    <span className="products-detail-tags" aria-label="Clasificación del producto">
                      <span className="products-detail-tag products-detail-tag-category"><Tags size={12} />{categoryName(selectedProduct.category)}</span>
                      <span className={`products-detail-tag ${brandName(selectedProduct.brand) ? 'products-detail-tag-brand' : 'products-detail-tag-muted'}`}><BadgeCheck size={12} />{brandName(selectedProduct.brand) ?? 'Sin marca'}</span>
                      <span className={`products-detail-tag ${supplierName(selectedProduct.supplier) ? 'products-detail-tag-supplier' : 'products-detail-tag-muted'}`}><Truck size={12} />{supplierName(selectedProduct.supplier) ?? 'Sin proveedor'}</span>
                    </span>
                    {selectedProduct.description && <small>{selectedProduct.description}</small>}
                  </span>
                  <div className="products-detail-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => onViewProduct(selectedProduct.id)}>{canManage ? 'Gestionar variantes' : 'Ver detalle'}</button>
                    {canManage && <button type="button" className="btn btn-danger-ghost btn-sm btn-icon products-row-delete" aria-label={`Eliminar ${selectedProduct.name}`} title="Eliminar producto" onClick={() => onDeleteProduct(selectedProduct)}><Trash2 /></button>}
                  </div>
                </header>

                <div className="products-detail-summary" aria-label="Métricas del producto">
                  <div className="products-detail-metric">
                    <span className="products-detail-metric-icon"><Layers3 size={16} /></span>
                    <span className="products-detail-metric-copy"><span>Variantes</span><strong>{selectedProduct.variants.length}</strong></span>
                  </div>
                  <div className="products-detail-metric">
                    <span className="products-detail-metric-icon"><Coins size={16} /></span>
                    <span className="products-detail-metric-copy"><span>Costo</span><strong>{formatCostRange(selectedProduct.variants)}</strong></span>
                  </div>
                  <div className="products-detail-metric">
                    <span className="products-detail-metric-icon"><CircleDollarSign size={16} /></span>
                    <span className="products-detail-metric-copy"><span>Precio</span><strong>{formatPriceRange(selectedProduct.variants)}</strong></span>
                  </div>
                  <div className="products-detail-metric">
                    <span className="products-detail-metric-icon"><WarehouseIcon size={16} /></span>
                    <span className="products-detail-metric-copy"><span>{stockMetricLabel}</span><strong className={productHasLowStock(selectedProduct) ? 'products-stock-low' : ''}>{formatQuantity(productStockTotal(selectedProduct))}</strong></span>
                  </div>
                  <div className="products-detail-metric">
                    <span className="products-detail-metric-icon"><Clock3 size={16} /></span>
                    <span className="products-detail-metric-copy"><span>Actualización</span><strong>{formatRelativeTime(selectedProduct.updated_at)}</strong></span>
                  </div>
                </div>

                <div className="products-detail-body">
                  <div className="products-detail-main">
                    {selectedProduct.variants.length === 0 ? (
                      <div className="products-detail-empty"><Package /><strong>Producto sin variantes</strong><span>Gestiona el producto para añadir su primera variante.</span></div>
                    ) : (
                      <div className="products-detail-variants">
                        <table className="core-table">
                          <thead><tr><th>Atributos</th><th>SKU</th><th>Costo</th><th>Precio</th><th>Stock</th><th>Stock mínimo</th><th>Estado</th></tr></thead>
                          <tbody>
                            {sortVariantsByPrimary(selectedProduct.variants, primaryAttributeForCategory(selectedProduct.category, categories, attributes)).map((variant) => {
                              const stock = variantStockTotal(variant.id)
                              const minimum = Number(variant.min_stock)
                              const stockAlert = stock <= 0 || (minimum > 0 && stock <= minimum)
                              const chips = variantAttributeChips(variant)
                              return (
                                <tr key={variant.id}>
                                  <td>{chips.length ? <span className="products-attribute-chips">{chips.map((chip) => <span className="badge badge-neutral" key={chip.id} title={chip.title}>{chip.label}</span>)}</span> : '—'}</td>
                                  <td className="core-table-strong">{variant.sku}</td>
                                  <td className="products-cost-cell">{formatCurrency(variant.cost)}</td>
                                  <td className="products-price-cell">{formatCurrency(variant.price)}</td>
                                  <td><strong className={stockAlert ? 'products-stock-low' : ''}>{formatQuantity(stock)}</strong></td>
                                  <td><span className="products-min-stock-badge" aria-label={`Stock mínimo ${formatQuantity(variant.min_stock)}`}>Mín. {formatQuantity(variant.min_stock)}</span></td>
                                  <td><span className={`badge ${variant.is_active ? 'badge-success' : 'badge-danger'}`}>{variant.is_active ? 'Activa' : 'Inactiva'}</span></td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <section className="products-warehouse-footer" aria-label="Stock por almacén">
                      <header><span><WarehouseIcon size={15} /><strong>Stock por almacén</strong></span><small>Distribución total</small></header>
                      {selectedWarehouseStock.length > 0 ? (
                        <div className="products-warehouse-cards" role="list">
                          {selectedWarehouseStock.map((warehouse) => (
                            <article className={`products-warehouse-card ${warehouse.id === stockWarehouseFilter ? 'products-warehouse-card-active' : ''}`} key={warehouse.id} role="listitem" aria-current={warehouse.id === stockWarehouseFilter ? 'true' : undefined}>
                              <span><span>{warehouse.name}</span>{warehouse.id === stockWarehouseFilter && <small>Seleccionado</small>}</span>
                              <strong>{formatQuantity(warehouse.quantity)}</strong>
                              <span className="products-warehouse-track" aria-hidden="true"><span style={{ width: `${(Math.max(0, warehouse.quantity) / maximumWarehouseStock) * 100}%` }} /></span>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="products-warehouse-empty">No hay almacenes disponibles.</p>
                      )}
                    </section>
                  </div>

                  <ProductInsights
                    product={selectedProduct}
                    selectedWarehouse={selectedWarehouse}
                    stockAlerts={selectedStockAlerts}
                    inventory={selectedInventoryInsights}
                  />
                </div>
              </section>
            )}
          </div>
        )}

        {viewMode === 'list' && variantRows.length > 0 && (
          <div className="products-list-view">
            <div className="products-table-scroll" ref={tableScrollRef} tabIndex={0} aria-label="Tabla de productos desplazable">
              <table className="core-table products-list-table" style={{ width: tableWidth, minWidth: tableWidth }}>
                <colgroup>{visibleColumns.map((column, index) => <col key={column.id} style={{ width: columnWidths[index] }} />)}</colgroup>
                <thead><tr>{visibleColumns.map((column) => <th key={column.id} className={`products-column-${column.id}`}>{column.label}</th>)}</tr></thead>
                <tbody>
                  {pageRows.map((row, rowIndex) => (
                    <tr key={row.variant.id} className={`${rowIndex % 2 ? 'products-zebra ' : ''}${row.productStart ? 'products-product-start' : ''}`}>
                      {visibleColumns.map((column) => <td key={column.id} className={`products-column-${column.id}`}>{renderListCell(column, row)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="products-pagination">
              <span>Mostrando {pageStart}–{pageEnd} de {variantRows.length} variantes</span>
              <label>Filas<select value={pageSize} onChange={(event) => changePageSize(Number(event.target.value))} aria-label="Filas por página">{PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
              <div className="products-pagination-controls">
                <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Página anterior"><ChevronLeft /></button>
                <span>Página {currentPage} de {pageCount}</span>
                <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount} aria-label="Página siguiente"><ChevronRight /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
