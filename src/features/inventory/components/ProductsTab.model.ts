import { formatCurrency } from '../../../shared/utils/format'
import type { Attribute, Product } from '../api'

export type ProductVariant = Product['variants'][number]
export type ViewMode = 'detail' | 'list'
export type StatusFilter = 'all' | 'active' | 'inactive'
export type SupplierFilter = number | 'none' | ''
export type TypeFilter = Product['type'] | 'all'
export type StockStatusFilter = 'all' | 'low' | 'out'
export type SortOption = 'name' | 'price' | 'stock' | 'updated'
export type OptionalColumnId = 'category' | 'brand' | 'supplier' | 'unit' | 'cost' | 'barcode' | 'updated'
export type ListColumnId = 'product' | OptionalColumnId | 'sku' | 'price' | 'stock' | 'minStock' | 'status' | 'actions'

export interface ListColumn {
  id: ListColumnId
  label: string
  width: number
  grow: number
  optional?: boolean
}

export interface VariantRow {
  product: Product
  variant: ProductVariant
  productStart: boolean
}

export const VIEW_MODE_KEY = 'fivuza-products-view'
export const COLUMNS_KEY = 'fivuza-products-columns'
export const PAGE_SIZE_KEY = 'fivuza-products-page-size'
export const MASTER_WIDTH_KEY = 'fivuza-products-master-width'
export const MASTER_WIDTH_DEFAULT = 400
export const MASTER_WIDTH_MIN = 320
export const MASTER_WIDTH_MAX = 520
export const DEFAULT_OPTIONAL_COLUMNS: OptionalColumnId[] = ['category']
export const PAGE_SIZE_OPTIONS = [50, 100, 200] as const

export const LIST_COLUMNS: ListColumn[] = [
  { id: 'product', label: 'Producto', width: 300, grow: 4 },
  { id: 'category', label: 'Categoría', width: 120, grow: 1.5, optional: true },
  { id: 'brand', label: 'Marca', width: 120, grow: 1.5, optional: true },
  { id: 'supplier', label: 'Proveedor', width: 150, grow: 1.5, optional: true },
  { id: 'unit', label: 'U.M.', width: 80, grow: 1, optional: true },
  { id: 'sku', label: 'SKU', width: 145, grow: 1.5 },
  { id: 'cost', label: 'Costo', width: 100, grow: 1, optional: true },
  { id: 'price', label: 'Precio', width: 100, grow: 1 },
  { id: 'barcode', label: 'Código de barras', width: 160, grow: 1.5, optional: true },
  { id: 'stock', label: 'Stock', width: 90, grow: 1 },
  { id: 'minStock', label: 'Stock mínimo', width: 115, grow: 1 },
  { id: 'status', label: 'Estado', width: 105, grow: 1 },
  { id: 'updated', label: 'Actualización', width: 125, grow: 1, optional: true },
  { id: 'actions', label: '', width: 82, grow: 0 },
]

export const OPTIONAL_COLUMNS = LIST_COLUMNS.filter(
  (column): column is ListColumn & { id: OptionalColumnId } => Boolean(column.optional),
)

const OPTIONAL_COLUMN_IDS = new Set<OptionalColumnId>(
  OPTIONAL_COLUMNS.map((column) => column.id),
)

export const TYPE_LABELS: Record<Product['type'], string> = {
  PRODUCT: 'Producto',
  SERVICE: 'Servicio',
  ASSET: 'Activo fijo',
}

export const UNIT_LABELS: Record<Product['unit_of_measure'], string> = {
  UND: 'Und',
  KG: 'Kg',
}

export function readStoredViewMode(): ViewMode {
  const stored = localStorage.getItem(VIEW_MODE_KEY)
  return stored === 'detail' || stored === 'cards' ? 'detail' : 'list'
}

export function readStoredColumns(): OptionalColumnId[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(COLUMNS_KEY) ?? 'null')
    if (!Array.isArray(stored)) return DEFAULT_OPTIONAL_COLUMNS
    return stored.filter(
      (column): column is OptionalColumnId =>
        typeof column === 'string' && OPTIONAL_COLUMN_IDS.has(column as OptionalColumnId),
    )
  } catch {
    return DEFAULT_OPTIONAL_COLUMNS
  }
}

export function readStoredPageSize(): number {
  const stored = Number(localStorage.getItem(PAGE_SIZE_KEY))
  return PAGE_SIZE_OPTIONS.includes(stored as (typeof PAGE_SIZE_OPTIONS)[number]) ? stored : 100
}

export function clampMasterWidth(value: number): number {
  return Math.min(MASTER_WIDTH_MAX, Math.max(MASTER_WIDTH_MIN, value))
}

export function readStoredMasterWidth(): number {
  const stored = Number(localStorage.getItem(MASTER_WIDTH_KEY))
  return Number.isFinite(stored) && stored > 0
    ? clampMasterWidth(stored)
    : MASTER_WIDTH_DEFAULT
}

export function sortVariantsByPrimary(
  variants: ProductVariant[],
  primary: Attribute | null,
): ProductVariant[] {
  if (!primary) return variants
  const order = new Map(primary.values.map((value, index) => [value.id, index]))
  const indexOf = (variant: ProductVariant) => {
    const match = variant.attribute_values.find((value) => order.has(value.attribute_value))
    return match ? (order.get(match.attribute_value) ?? 0) : Number.MAX_SAFE_INTEGER
  }
  return [...variants].sort((a, b) => indexOf(a) - indexOf(b))
}

export function productImage(product: Product): string | null {
  const withImage =
    product.variants.find((variant) => variant.is_default && variant.image_url) ??
    product.variants.find((variant) => variant.image_url)
  return withImage?.image_url ?? null
}

export function formatPriceRange(variants: ProductVariant[]): string {
  if (variants.length === 0) return '—'
  const prices = variants.map((variant) => Number(variant.price))
  const minimum = Math.min(...prices)
  const maximum = Math.max(...prices)
  return minimum === maximum
    ? formatCurrency(minimum)
    : `${formatCurrency(minimum)} – ${formatCurrency(maximum)}`
}

export function formatCostRange(variants: ProductVariant[]): string {
  if (variants.length === 0) return '—'
  const costs = variants.map((variant) => Number(variant.cost)).filter(Number.isFinite)
  if (costs.length === 0) return '—'
  const minimum = Math.min(...costs)
  const maximum = Math.max(...costs)
  return minimum === maximum
    ? formatCurrency(minimum)
    : `${formatCurrency(minimum)} – ${formatCurrency(maximum)}`
}
