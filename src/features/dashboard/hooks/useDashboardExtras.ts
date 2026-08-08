import { useQuery } from '@tanstack/react-query'
import { fetchAttendanceReport } from '../../hr/api'
import { fetchCashSessions } from '../../sales/api'

/** Datos de los widgets CASH_STATUS y ATTENDANCE_TODAY (Sprint 25) -viven
 * fuera de DashboardMetricsService porque pertenecen a otros módulos
 * (caja, RRHH); pedirlos aparte evita acoplar ese servicio a permisos que
 * no todo usuario del dashboard tiene (HR_MANAGE). */
export function useOpenCashSessionsCount() {
  const query = useQuery({
    queryKey: ['dashboard', 'extras', 'open-cash-sessions'],
    queryFn: () => fetchCashSessions({ status: 'OPEN' }),
  })
  return { ...query, count: query.data?.length ?? 0 }
}

export function useAttendanceToday(enabled: boolean) {
  const today = new Date().toISOString().slice(0, 10)
  return useQuery({
    queryKey: ['dashboard', 'extras', 'attendance-today'],
    queryFn: () => fetchAttendanceReport({ date_from: today, date_to: today }),
    enabled,
  })
}
