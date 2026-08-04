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
  user: number
  created_at: string
}

export function fetchCashRegisters() {
  return tenantApiFetch<CashRegister[]>('/ventas/cash-registers/', {
    token: getAccessToken(),
  })
}

export function fetchCashSessions(filters: { status?: 'OPEN' | 'CLOSED' } = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  return tenantApiFetch<CashSession[]>(`/ventas/cash-sessions/?${params.toString()}`, {
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
}) {
  return tenantApiFetch<CashMovement>('/ventas/cash-movements/', {
    method: 'POST',
    body: payload,
    token: getAccessToken(),
  })
}
