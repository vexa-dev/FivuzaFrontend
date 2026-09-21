import { getAccessToken } from '../auth/hooks/session'
import { tenantApiFetch, tenantApiFetchBlob } from '../../shared/utils/tenantApiClient'
import type { PaginatedResponse } from '../../shared/utils/pagination'

/** Registro de la bitácora del negocio (Bloque B). `details` llega como
 * texto: JSON cuando la acción guardó campos (antes/después, totales...),
 * texto libre en los registros más antiguos. */
export interface TenantAuditLog {
  id: number
  user: number
  user_email: string
  action: string
  entity: string
  entity_id: number
  details: string
  created_at: string
}

export interface TenantAuditLogFilters {
  user?: number
  action?: string
  entity?: string
  entity_id?: number
  date_from?: string
  date_to?: string
}

function toQuery(filters: TenantAuditLogFilters) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  return params
}

export function fetchTenantAuditLogs(filters: TenantAuditLogFilters, page: number) {
  const params = toQuery(filters)
  params.set('page', String(page))
  // Se pide una página a la vez: la bitácora crece sin tope y juntar todas
  // las páginas (el comportamiento por defecto del cliente) la bajaría entera.
  return tenantApiFetch<PaginatedResponse<TenantAuditLog>>(
    `/usuarios/audit-logs/?${params.toString()}`,
    { token: getAccessToken(), unwrapPagination: false },
  )
}

export function downloadTenantAuditLogs(
  filters: TenantAuditLogFilters,
  format: 'csv' | 'xlsx',
) {
  const params = toQuery(filters)
  params.set('export', format)
  return tenantApiFetchBlob(`/usuarios/audit-logs/?${params.toString()}`, getAccessToken())
}
