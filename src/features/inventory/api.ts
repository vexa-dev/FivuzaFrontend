import { getAccessToken } from '../auth/hooks/session'
import { tenantApiFetch, tenantApiFetchBlob } from '../../shared/utils/tenantApiClient'

export interface Warehouse {
  id: number
  name: string
  address: string
  is_active: boolean
  created_at: string
}

export interface Category {
  id: number
  name: string
  is_active: boolean
}

export interface Supplier {
  id: number
  ruc_or_dni: string
  company_name: string
  phone: string
  address: string
}

export interface Attribute {
  id: number
  name: string
}

export interface ProductVariant {
  id: number
  product: number
  sku: string
  barcode: string | null
  cost: string
  price: string
  min_stock: string
  image_url: string | null
  is_default: boolean
  is_active: boolean
  updated_at: string
}

export interface Product {
  id: number
  type: 'PRODUCT' | 'SERVICE' | 'ASSET'
  name: string
  description: string
  category: number
  supplier: number | null
  unit_of_measure: 'UND' | 'KG'
  is_for_sale: boolean
  is_active: boolean
  variants: ProductVariant[]
  updated_at: string
  created_at: string
}

export interface NewVariantInput {
  sku: string
  barcode?: string
  cost?: string
  price?: string
  min_stock?: string
}

export interface StockRecord {
  id: number
  variant: number
  warehouse: number
  quantity: string
  updated_at: string
}

export interface InventoryMovement {
  id: number
  variant: number
  warehouse: number
  user: number
  type: 'IN' | 'OUT'
  quantity: string
  concept: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN'
  resulting_balance: string
  oversell_flag: boolean
  created_at: string
}

export interface VolumePricingTier {
  id: number
  variant: number
  min_quantity: string
  unit_price: string
}

export interface LowStockVariant {
  id: number
  sku: string
  product_name: string
  total_stock: string
  min_stock: string
}

function authed<T>(path: string, init: Parameters<typeof tenantApiFetch>[1] = {}) {
  return tenantApiFetch<T>(path, { ...init, token: getAccessToken() })
}

// Almacenes
export const fetchWarehouses = (search?: string) =>
  authed<Warehouse[]>(`/inventario/warehouses/${search ? `?search=${search}` : ''}`)

export const createWarehouse = (data: { name: string; address?: string }) =>
  authed<Warehouse>('/inventario/warehouses/', { method: 'POST', body: data })

export const updateWarehouse = (id: number, data: Partial<Warehouse>) =>
  authed<Warehouse>(`/inventario/warehouses/${id}/`, { method: 'PATCH', body: data })

export const deleteWarehouse = (id: number) =>
  authed<void>(`/inventario/warehouses/${id}/`, { method: 'DELETE' })

// Categorías
export const fetchCategories = (search?: string) =>
  authed<Category[]>(`/inventario/categories/${search ? `?search=${search}` : ''}`)

export const createCategory = (data: { name: string }) =>
  authed<Category>('/inventario/categories/', { method: 'POST', body: data })

export const updateCategory = (id: number, data: Partial<Category>) =>
  authed<Category>(`/inventario/categories/${id}/`, { method: 'PATCH', body: data })

export const deleteCategory = (id: number) =>
  authed<void>(`/inventario/categories/${id}/`, { method: 'DELETE' })

// Proveedores
export const fetchSuppliers = (search?: string) =>
  authed<Supplier[]>(`/inventario/suppliers/${search ? `?search=${search}` : ''}`)

export const createSupplier = (data: Omit<Supplier, 'id'>) =>
  authed<Supplier>('/inventario/suppliers/', { method: 'POST', body: data })

export const updateSupplier = (id: number, data: Partial<Supplier>) =>
  authed<Supplier>(`/inventario/suppliers/${id}/`, { method: 'PATCH', body: data })

export const deleteSupplier = (id: number) =>
  authed<void>(`/inventario/suppliers/${id}/`, { method: 'DELETE' })

// Productos
export const fetchProducts = (params?: { search?: string; category?: number }) => {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.category) query.set('category', String(params.category))
  const qs = query.toString()
  return authed<Product[]>(`/inventario/products/${qs ? `?${qs}` : ''}`)
}

export const createProduct = (data: {
  type: Product['type']
  name: string
  description?: string
  category: number
  supplier?: number | null
  unit_of_measure: Product['unit_of_measure']
  variants_input?: NewVariantInput[]
}) => authed<Product>('/inventario/products/', { method: 'POST', body: data })

export const updateProduct = (id: number, data: Partial<Product>) =>
  authed<Product>(`/inventario/products/${id}/`, { method: 'PATCH', body: data })

export const deleteProduct = (id: number) =>
  authed<void>(`/inventario/products/${id}/`, { method: 'DELETE' })

// Variantes
export const createVariant = (
  productId: number,
  data: NewVariantInput & { attribute_value_ids?: number[] },
) =>
  authed<ProductVariant>('/inventario/product-variants/', {
    method: 'POST',
    body: { product: productId, ...data },
  })

export const updateVariant = (id: number, data: Partial<ProductVariant>) =>
  authed<ProductVariant>(`/inventario/product-variants/${id}/`, {
    method: 'PATCH',
    body: data,
  })

export const deleteVariant = (id: number) =>
  authed<void>(`/inventario/product-variants/${id}/`, { method: 'DELETE' })

export const requestVariantImageUploadUrl = (variantId: number, contentType: string) =>
  authed<{ upload_url: string; image_url: string }>(
    `/inventario/product-variants/${variantId}/upload-image-url/`,
    { method: 'POST', body: { content_type: contentType } },
  )

// Stock / Kardex
export const fetchStock = (params?: { variant?: number; warehouse?: number }) => {
  const query = new URLSearchParams()
  if (params?.variant) query.set('variant', String(params.variant))
  if (params?.warehouse) query.set('warehouse', String(params.warehouse))
  const qs = query.toString()
  return authed<StockRecord[]>(`/inventario/stock/${qs ? `?${qs}` : ''}`)
}

export const fetchInventoryMovements = (params?: {
  variant?: number
  warehouse?: number
  date_from?: string
  date_to?: string
}) => {
  const query = new URLSearchParams()
  if (params?.variant) query.set('variant', String(params.variant))
  if (params?.warehouse) query.set('warehouse', String(params.warehouse))
  if (params?.date_from) query.set('date_from', params.date_from)
  if (params?.date_to) query.set('date_to', params.date_to)
  const qs = query.toString()
  return authed<InventoryMovement[]>(`/inventario/inventory-movements/${qs ? `?${qs}` : ''}`)
}

export const adjustStock = (data: {
  variant: number
  warehouse: number
  counted_quantity: string
  concept: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN'
}) =>
  authed<InventoryMovement>('/inventario/stock/adjust/', {
    method: 'POST',
    body: data,
  })

export const fetchLowStockVariants = () =>
  authed<LowStockVariant[]>('/inventario/stock/low-stock/')

// Traslado de stock entre almacenes (Sprint 26)
export const transferStock = (data: {
  variant: number
  from_warehouse: number
  to_warehouse: number
  quantity: string
}) =>
  authed<{ out_movement: InventoryMovement; in_movement: InventoryMovement }>(
    '/inventario/stock/transfer/',
    { method: 'POST', body: data },
  )

// Precios por volumen (Sprint 26, Ficha de Producto §5.1)
export const fetchVolumePricingTiers = (variantId: number) =>
  authed<VolumePricingTier[]>(`/inventario/volume-pricing-tiers/?variant=${variantId}`)

export const createVolumePricingTier = (data: {
  variant: number
  min_quantity: string
  unit_price: string
}) => authed<VolumePricingTier>('/inventario/volume-pricing-tiers/', { method: 'POST', body: data })

export const deleteVolumePricingTier = (id: number) =>
  authed<void>(`/inventario/volume-pricing-tiers/${id}/`, { method: 'DELETE' })

// Reportes exportables (Sprint 24/25, API Spec §4.16)
export const downloadLowStockReport = (format: 'csv' | 'xlsx') =>
  tenantApiFetchBlob(`/inventario/stock/low-stock/?export=${format}`, getAccessToken())

export const downloadStockValuationReport = (format: 'csv' | 'xlsx', warehouseId?: number) => {
  const params = new URLSearchParams({ export: format })
  if (warehouseId) params.set('warehouse', String(warehouseId))
  return tenantApiFetchBlob(
    `/inventario/reports/stock-valuation/?${params.toString()}`,
    getAccessToken(),
  )
}

// Impuestos
export interface TaxRate {
  id: number
  name: string
  percentage: string
  is_active: boolean
}

export const fetchTaxRates = () => authed<TaxRate[]>('/inventario/tax-rates/')

export const createTaxRate = (data: { name: string; percentage: string; is_active?: boolean }) =>
  authed<TaxRate>('/inventario/tax-rates/', { method: 'POST', body: data })

export const updateTaxRate = (id: number, data: Partial<TaxRate>) =>
  authed<TaxRate>(`/inventario/tax-rates/${id}/`, { method: 'PATCH', body: data })

export const deleteTaxRate = (id: number) =>
  authed<void>(`/inventario/tax-rates/${id}/`, { method: 'DELETE' })

// Ordenes de compra
export interface PurchaseOrderDetail {
  id: number
  purchase_order: number
  variant_id: number
  quantity: string
  unit_cost: string
  subtotal: string
}

export interface PurchaseOrder {
  id: number
  supplier: number
  warehouse: number
  user: number
  invoice_number: string
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED'
  total: string
  currency: string
  received_at: string | null
  details: PurchaseOrderDetail[]
  created_at: string
}

export interface NewPurchaseOrderLine {
  variant_id: number
  quantity: string
  unit_cost: string
}

export const fetchPurchaseOrders = (params?: { status?: string; supplier?: number }) => {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.supplier) query.set('supplier', String(params.supplier))
  const qs = query.toString()
  return authed<PurchaseOrder[]>(`/inventario/purchase-orders/${qs ? `?${qs}` : ''}`)
}

export const createPurchaseOrder = (data: {
  supplier: number
  warehouse: number
  invoice_number?: string
  details_input: NewPurchaseOrderLine[]
}) => authed<PurchaseOrder>('/inventario/purchase-orders/', { method: 'POST', body: data })

export const receivePurchaseOrder = (id: number) =>
  authed<{ id: number; status: string; movements_created: number }>(
    `/inventario/purchase-orders/${id}/receive/`,
    { method: 'POST' },
  )

// Importacion masiva de catalogo
export interface CatalogImportRow {
  row: number
  sku: string
  status: 'created' | 'error'
  error?: string
}

export interface CatalogImportReport {
  total: number
  created: number
  errors: number
  rows: CatalogImportRow[]
}

export const downloadCatalogImportTemplate = () =>
  tenantApiFetchBlob('/inventario/catalog-import/template/', getAccessToken())

export const importCatalog = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return authed<CatalogImportReport>('/inventario/catalog-import/', {
    method: 'POST',
    body: formData,
  })
}
