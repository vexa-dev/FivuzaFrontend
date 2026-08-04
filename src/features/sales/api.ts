import { getAccessToken } from '../auth/hooks/session'
import { tenantApiFetch } from '../../shared/utils/tenantApiClient'

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
