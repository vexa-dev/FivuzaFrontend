import { useQuery } from '@tanstack/react-query'
import {
  fetchClassAttendanceReport,
  fetchMembershipsExpiringReport,
  fetchRevenueByPlanReport,
} from '../api'

export function useClassAttendanceReport(params: { date_from: string; date_to: string }) {
  return useQuery({
    queryKey: ['gimnasio', 'reports', 'class-attendance', params.date_from, params.date_to],
    queryFn: () => fetchClassAttendanceReport(params),
    enabled: Boolean(params.date_from && params.date_to),
  })
}

export function useMembershipsExpiringReport(params: { days: number }) {
  return useQuery({
    queryKey: ['gimnasio', 'reports', 'memberships-expiring', params.days],
    queryFn: () => fetchMembershipsExpiringReport(params),
  })
}

export function useRevenueByPlanReport(params: { date_from: string; date_to: string }) {
  return useQuery({
    queryKey: ['gimnasio', 'reports', 'revenue-by-plan', params.date_from, params.date_to],
    queryFn: () => fetchRevenueByPlanReport(params),
    enabled: Boolean(params.date_from && params.date_to),
  })
}
