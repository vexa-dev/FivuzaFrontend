import { useQuery } from '@tanstack/react-query'
import { fetchAttendanceReport } from '../../hr/api'
import { fetchCashSessions } from '../../sales/api'
import { fetchMemberships } from '../../gimnasio/api'

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

/** Socias/os con membresia activa -useMemberships (del modulo gimnasio) esta
 * gateado a `customer` (piensa "membresias de UN cliente"), asi que para un
 * conteo global del tenant se llama fetchMemberships directo con su propio
 * useQuery, en vez de forzar ese hook a un uso para el que no esta pensado. */
export function useActiveMembershipsCount(enabled: boolean) {
  const query = useQuery({
    queryKey: ['dashboard', 'extras', 'active-memberships'],
    queryFn: () => fetchMemberships({ status: 'ACTIVE' }),
    enabled,
  })
  return { ...query, count: query.data?.length ?? 0 }
}
