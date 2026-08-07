import { useQuery } from '@tanstack/react-query'
import { fetchAttendanceReport, fetchPayrollCostReport } from '../api'

export function useAttendanceReport(params: {
  date_from: string
  date_to: string
  employee?: number
}) {
  return useQuery({
    queryKey: ['hr', 'reports', 'attendance', params],
    queryFn: () => fetchAttendanceReport(params),
    enabled: Boolean(params.date_from && params.date_to),
  })
}

export function usePayrollCostReport(params: { period_start: string; period_end: string }) {
  return useQuery({
    queryKey: ['hr', 'reports', 'payroll-cost', params],
    queryFn: () => fetchPayrollCostReport(params),
    enabled: Boolean(params.period_start && params.period_end),
  })
}
