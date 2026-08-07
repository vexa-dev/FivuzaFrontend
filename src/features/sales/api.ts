import { getAccessToken } from '../auth/hooks/session'
import { tenantApiFetch, tenantApiFetchText } from '../../shared/utils/tenantApiClient'

export interface CashRegister {
  id: number
  warehouse: number
  name: string
  is_active: boolean
}

export interface CashSession {
  id: number
  cash_register: number
  user: number
  opening_amount: string
  opening_at: string
  expected_closing_amount: string | null
  counted_closing_amount: string | null
  difference: string | null
  status: 'OPEN' | 'CLOSED'
  closing_at: string | null
  notes: string | null
}

export type CashMovementType = 'IN' | 'OUT'
export type CashMovementConcept =
  | 'RETIRO'
  | 'PAGO_PROVEEDOR_EFECTIVO'
  | 'DEPOSITO_BANCO'
  | 'AJUSTE'

export interface CashMovement {
  id: number
  cash_session: number
  type: CashMovementType
  concept: CashMovementConcept
  amount: string
  reason: string
  receipt_url: string | null
  user: number
  created_at: string
}

export interface CashSessionDetail extends CashSession {
  movements: CashMovement[]
}

export interface CashSessionFilters {
  status?: 'OPEN' | 'CLOSED'
  cash_register?: number
  user?: number
  opening_from?: string
  opening_to?: string
}

export function fetchCashRegisters() {
  return tenantApiFetch<CashRegister[]>('/ventas/cash-registers/', {
    token: getAccessToken(),
  })
}

export function fetchCashSessions(filters: CashSessionFilters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.cash_register) params.set('cash_register', String(filters.cash_register))
  if (filters.user) params.set('user', String(filters.user))
  if (filters.opening_from) params.set('opening_from', filters.opening_from)
  if (filters.opening_to) params.set('opening_to', filters.opening_to)
  return tenantApiFetch<CashSession[]>(`/ventas/cash-sessions/?${params.toString()}`, {
    token: getAccessToken(),
  })
}

export function fetchCashSessionDetail(sessionId: number) {
  return tenantApiFetch<CashSessionDetail>(`/ventas/cash-sessions/${sessionId}/`, {
    token: getAccessToken(),
  })
}

export function openCashSession(cashRegisterId: number, openingAmount: string) {
  return tenantApiFetch<CashSession>('/ventas/cash-sessions/open/', {
    method: 'POST',
    body: { cash_register_id: cashRegisterId, opening_amount: openingAmount },
    token: getAccessToken(),
  })
}

export function closeCashSession(
  sessionId: number,
  countedClosingAmount: string,
  notes?: string,
) {
  return tenantApiFetch<CashSession>(`/ventas/cash-sessions/${sessionId}/close/`, {
    method: 'POST',
    body: { counted_closing_amount: countedClosingAmount, notes },
    token: getAccessToken(),
  })
}

export function fetchCashMovements(sessionId: number) {
  return tenantApiFetch<CashMovement[]>(`/ventas/cash-movements/?cash_session=${sessionId}`, {
    token: getAccessToken(),
  })
}

export function createCashMovement(payload: {
  cash_session: number
  type: CashMovementType
  concept: CashMovementConcept
  amount: string
  reason?: string
  receipt_url?: string | null
}) {
  return tenantApiFetch<CashMovement>('/ventas/cash-movements/', {
    method: 'POST',
    body: payload,
    token: getAccessToken(),
  })
}

export function requestCashMovementReceiptUploadUrl(contentType: string) {
  return tenantApiFetch<{ upload_url: string; receipt_url: string }>(
    '/ventas/cash-movements/upload-receipt-url/',
    { method: 'POST', body: { content_type: contentType }, token: getAccessToken() },
  )
}

export type CustomerDocumentType = 'RUC' | 'DNI' | 'ANONIMO'

export interface Customer {
  id: number
  document_type: CustomerDocumentType
  document_number: string
  name: string
  phone: string
  address: string
  is_active: boolean
  // null = sin limite configurado (Sprint 19, Ficha de Producto §5.1).
  credit_limit: string | null
  current_debt: string
  current_balance: string
  oldest_unpaid_debt_at: string | null
  updated_at: string
  created_at: string
}

const CUSTOMER_COMPUTED_FIELDS = [
  'current_debt',
  'current_balance',
  'oldest_unpaid_debt_at',
] as const

export function fetchCustomers(search?: string) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  return tenantApiFetch<Customer[]>(`/ventas/customers/?${params.toString()}`, {
    token: getAccessToken(),
  })
}

export function createCustomer(
  data: Omit<
    Customer,
    'id' | (typeof CUSTOMER_COMPUTED_FIELDS)[number] | 'updated_at' | 'created_at'
  >,
) {
  return tenantApiFetch<Customer>('/ventas/customers/', {
    method: 'POST',
    body: data,
    token: getAccessToken(),
  })
}

export function updateCustomer(id: number, data: Partial<Customer>) {
  return tenantApiFetch<Customer>(`/ventas/customers/${id}/`, {
    method: 'PATCH',
    body: data,
    token: getAccessToken(),
  })
}

export function deleteCustomer(id: number) {
  return tenantApiFetch<void>(`/ventas/customers/${id}/`, {
    method: 'DELETE',
    token: getAccessToken(),
  })
}

export interface CustomerDebtLedgerEntry {
  id: number
  customer: number
  sale: number | null
  type: 'DEBIT' | 'CREDIT'
  amount: string
  currency: string
  description: string
  created_at: string
}

export interface CustomerBalanceLedgerEntry {
  id: number
  customer: number
  sale: number | null
  sale_return: number | null
  type: 'CREDIT' | 'DEBIT'
  amount: string
  currency: string
  description: string
  created_at: string
}

export function fetchCustomerDebtLedger(customerId: number) {
  return tenantApiFetch<CustomerDebtLedgerEntry[]>(
    `/ventas/customer-debt-ledger/?customer=${customerId}`,
    { token: getAccessToken() },
  )
}

export function fetchCustomerBalanceLedger(customerId: number) {
  return tenantApiFetch<CustomerBalanceLedgerEntry[]>(
    `/ventas/customer-balance-ledger/?customer=${customerId}`,
    { token: getAccessToken() },
  )
}

export function registerDebtPayment(data: {
  customer_id: number
  amount: string
  description?: string
}) {
  return tenantApiFetch<{ id: number; type: string; amount: string; customer_current_debt: string }>(
    '/ventas/customer-debt-ledger/register-payment/',
    { method: 'POST', body: data, token: getAccessToken() },
  )
}

export type PromotionType = 'PERCENTAGE' | 'FIXED_AMOUNT'

export interface PromotionProduct {
  id: number
  promotion: number
  variant: number | null
  category: number | null
}

export interface Promotion {
  id: number
  name: string
  type: PromotionType
  value: string
  start_date: string
  end_date: string
  is_active: boolean
  targets: PromotionProduct[]
  updated_at: string
}

export function fetchPromotions(search?: string) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  return tenantApiFetch<Promotion[]>(`/ventas/promotions/?${params.toString()}`, {
    token: getAccessToken(),
  })
}

export function fetchPromotion(id: number) {
  return tenantApiFetch<Promotion>(`/ventas/promotions/${id}/`, {
    token: getAccessToken(),
  })
}

export function createPromotion(
  data: Omit<Promotion, 'id' | 'targets' | 'updated_at'>,
) {
  return tenantApiFetch<Promotion>('/ventas/promotions/', {
    method: 'POST',
    body: data,
    token: getAccessToken(),
  })
}

export function updatePromotion(id: number, data: Partial<Promotion>) {
  return tenantApiFetch<Promotion>(`/ventas/promotions/${id}/`, {
    method: 'PATCH',
    body: data,
    token: getAccessToken(),
  })
}

export function deletePromotion(id: number) {
  return tenantApiFetch<void>(`/ventas/promotions/${id}/`, {
    method: 'DELETE',
    token: getAccessToken(),
  })
}

export function addPromotionTarget(data: {
  promotion: number
  variant?: number
  category?: number
}) {
  return tenantApiFetch<PromotionProduct>('/ventas/promotion-products/', {
    method: 'POST',
    body: data,
    token: getAccessToken(),
  })
}

export function removePromotionTarget(id: number) {
  return tenantApiFetch<void>(`/ventas/promotion-products/${id}/`, {
    method: 'DELETE',
    token: getAccessToken(),
  })
}

export type SalePaymentMethod = 'CASH' | 'CARD' | 'YAPE' | 'CREDIT_LEDGER' | 'BALANCE'

export interface SaleDetail {
  id: number
  variant_id: number
  product_name_snapshot: string
  sku_snapshot: string
  quantity: string
  unit_price: string
  discount_amount: string
  subtotal: string
}

export interface SalePayment {
  id: number
  method: SalePaymentMethod
  amount: string
  created_at: string
}

export interface Sale {
  id: number
  invoice_number: string
  customer: number
  user: number
  warehouse: number
  cash_session: number
  subtotal: string
  discount_total: string
  total: string
  currency: string
  payment_status: 'PAID' | 'PARTIAL' | 'UNPAID'
  status: 'COMPLETED' | 'VOIDED' | 'CANCELLED'
  sync_status: 'SYNCED' | 'OFFLINE_PENDING' | 'CONFLICT'
  details: SaleDetail[]
  payments: SalePayment[]
  created_at: string
}

export interface SaleLineInput {
  variant_id: number
  quantity: string
  discount_amount?: string
}

export interface SalePaymentInput {
  method: SalePaymentMethod
  amount: string
}

export interface SaleCreateInput {
  customer_id: number
  cash_session_id: number
  client_side_uuid?: string
  lines: SaleLineInput[]
  payments: SalePaymentInput[]
}

export function createSale(data: SaleCreateInput) {
  return tenantApiFetch<Sale>('/ventas/sales/', {
    method: 'POST',
    body: data,
    token: getAccessToken(),
  })
}

export interface SaleSyncItemInput {
  client_side_uuid: string
  customer_id: number
  cash_session_id: number
  lines: SaleLineInput[]
  payments: SalePaymentInput[]
}

export interface SaleSyncedResult {
  client_side_uuid: string
  status: 'CREATED' | 'DUPLICATE_IGNORED' | 'FAILED'
  sale_id?: number
  error?: unknown
}

export interface SaleSyncConflict {
  client_side_uuid: string
  variant_id: number
  oversell_flag: true
}

export interface SaleSyncResponse {
  synced: SaleSyncedResult[]
  conflicts: SaleSyncConflict[]
}

export function syncSales(sales: SaleSyncItemInput[]) {
  return tenantApiFetch<SaleSyncResponse>('/ventas/sales/sync/', {
    method: 'POST',
    body: { sales },
    token: getAccessToken(),
  })
}

export function fetchSales(
  filters: {
    customer?: number
    user?: number
    cash_register?: number
    date_from?: string
    date_to?: string
  } = {},
) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) params.set(key, String(value))
  }
  return tenantApiFetch<Sale[]>(`/ventas/sales/?${params.toString()}`, {
    token: getAccessToken(),
  })
}

export function fetchSale(id: number) {
  return tenantApiFetch<Sale>(`/ventas/sales/${id}/`, {
    token: getAccessToken(),
  })
}

export function voidSale(id: number, reason: string) {
  return tenantApiFetch<Sale>(`/ventas/sales/${id}/void/`, {
    method: 'POST',
    body: { reason },
    token: getAccessToken(),
  })
}

export type RefundType = 'BALANCE' | 'CASH'

export interface SaleReturnDetail {
  id: number
  sale_detail: number
  quantity_returned: string
  restock: boolean
  subtotal: string
}

export interface SaleReturn {
  id: number
  sale: number
  user: number
  reason: string
  total_refund_amount: string
  refund_type: RefundType
  details: SaleReturnDetail[]
  created_at: string
}

export interface SaleReturnItemInput {
  sale_detail_id: number
  quantity_returned: string
  restock?: boolean
}

export interface SaleReturnCreateInput {
  sale_id: number
  reason?: string
  refund_type: RefundType
  cash_session_id?: number
  items: SaleReturnItemInput[]
}

export function createSaleReturn(data: SaleReturnCreateInput) {
  return tenantApiFetch<SaleReturn>('/ventas/sale-returns/', {
    method: 'POST',
    body: data,
    token: getAccessToken(),
  })
}

export function fetchSaleReturns(saleId: number) {
  return tenantApiFetch<SaleReturn[]>(`/ventas/sale-returns/?sale=${saleId}`, {
    token: getAccessToken(),
  })
}

export function fetchSaleReceipt(id: number, widthMm: 58 | 80 = 58) {
  return tenantApiFetchText(`/ventas/sales/${id}/receipt/?width_mm=${widthMm}`, getAccessToken())
}

export interface POSPromotion {
  id: number
  name: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: string
}

export interface POSCatalogItem {
  id: number
  sku: string
  barcode: string | null
  product_name: string
  price: string
  stock: string
  promotion: POSPromotion | null
}

export function fetchPOSCatalog(warehouseId: number) {
  return tenantApiFetch<POSCatalogItem[]>(`/ventas/pos/catalog/?warehouse=${warehouseId}`, {
    token: getAccessToken(),
  })
}

export function fetchPOSSearch(warehouseId: number, query: string) {
  const params = new URLSearchParams({ warehouse: String(warehouseId), q: query })
  return tenantApiFetch<POSCatalogItem[]>(`/ventas/pos/search/?${params.toString()}`, {
    token: getAccessToken(),
  })
}
