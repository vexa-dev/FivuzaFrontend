import { useQuery } from '@tanstack/react-query'
import { fetchAuditLogs, type AuditLogFilters } from '../api'

export function useAuditLog(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ['core', 'audit-logs', 'all', filters],
    queryFn: () => fetchAuditLogs(filters),
  })
}
