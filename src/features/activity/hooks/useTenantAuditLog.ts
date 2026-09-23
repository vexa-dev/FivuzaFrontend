import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchTenantAuditLogs, type TenantAuditLogFilters } from '../api'

export function useTenantAuditLog(filters: TenantAuditLogFilters, page: number) {
  return useQuery({
    queryKey: ['audit-logs', filters, page],
    queryFn: () => fetchTenantAuditLogs(filters, page),
    // Al pasar de página, la tabla anterior se queda en pantalla hasta que
    // llegue la siguiente, en vez de parpadear con el spinner.
    placeholderData: keepPreviousData,
  })
}
