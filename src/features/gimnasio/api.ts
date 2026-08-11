import { getAccessToken } from '../auth/hooks/session'
import { tenantApiFetchBlob, tenantApiFetch } from '../../shared/utils/tenantApiClient'

export type MembershipPaymentMethod = 'CASH' | 'CARD' | 'YAPE'

export interface MembershipPlan {
  id: number
  name: string
  price: string
  periodicity: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  benefits: string
  is_active: boolean
  created_at: string
}

function authed<T>(path: string, init: Parameters<typeof tenantApiFetch>[1] = {}) {
  return tenantApiFetch<T>(path, { ...init, token: getAccessToken() })
}

export const fetchMembershipPlans = () =>
  authed<MembershipPlan[]>('/gimnasio/membership-plans/')

export const createMembershipPlan = (data: {
  name: string
  price: string
  periodicity: MembershipPlan['periodicity']
  benefits?: string
}) => authed<MembershipPlan>('/gimnasio/membership-plans/', { method: 'POST', body: data })

export const updateMembershipPlan = (id: number, data: Partial<MembershipPlan>) =>
  authed<MembershipPlan>(`/gimnasio/membership-plans/${id}/`, { method: 'PATCH', body: data })

export const deleteMembershipPlan = (id: number) =>
  authed<void>(`/gimnasio/membership-plans/${id}/`, { method: 'DELETE' })

export interface MembershipPayment {
  id: number
  membership: number
  amount: string
  method: MembershipPaymentMethod
  user: number
  created_at: string
}

export interface Membership {
  id: number
  customer: number
  plan: number
  start_date: string
  end_date: string
  status: 'ACTIVE' | 'FROZEN' | 'EXPIRED' | 'CANCELLED'
  frozen_since: string | null
  group: number | null
  payments: MembershipPayment[]
  created_at: string
}

export const fetchMemberships = (params?: { customer?: number; status?: string }) => {
  const query = new URLSearchParams()
  if (params?.customer) query.set('customer', String(params.customer))
  if (params?.status) query.set('status', params.status)
  const qs = query.toString()
  return authed<Membership[]>(`/gimnasio/memberships/${qs ? `?${qs}` : ''}`)
}

export const createMembership = (data: {
  customer_id: number
  plan_id: number
  start_date: string
}) => authed<Membership>('/gimnasio/memberships/', { method: 'POST', body: data })

export const renewMembership = (
  id: number,
  data?: { payment_amount?: string; payment_method?: MembershipPaymentMethod },
) =>
  authed<Membership>(`/gimnasio/memberships/${id}/renew/`, {
    method: 'POST',
    body: data ?? {},
  })

export const freezeMembership = (id: number) =>
  authed<Membership>(`/gimnasio/memberships/${id}/freeze/`, { method: 'POST' })

export const unfreezeMembership = (id: number) =>
  authed<Membership>(`/gimnasio/memberships/${id}/unfreeze/`, { method: 'POST' })

export const cancelMembership = (id: number) =>
  authed<Membership>(`/gimnasio/memberships/${id}/cancel/`, { method: 'POST' })

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export interface GymClass {
  id: number
  name: string
  instructor: number
  instructor_name: string
  max_capacity: number
  duration_minutes: number
  is_active: boolean
  created_at: string
}

export const fetchGymClasses = (params?: { active_only?: boolean }) => {
  const query = new URLSearchParams()
  if (params?.active_only) query.set('active_only', 'true')
  const qs = query.toString()
  return authed<GymClass[]>(`/gimnasio/classes/${qs ? `?${qs}` : ''}`)
}

export const createGymClass = (data: {
  name: string
  instructor: number
  max_capacity: number
  duration_minutes: number
}) => authed<GymClass>('/gimnasio/classes/', { method: 'POST', body: data })

export const updateGymClass = (id: number, data: Partial<GymClass>) =>
  authed<GymClass>(`/gimnasio/classes/${id}/`, { method: 'PATCH', body: data })

export const deleteGymClass = (id: number) =>
  authed<void>(`/gimnasio/classes/${id}/`, { method: 'DELETE' })

export interface ClassSchedule {
  id: number
  gym_class: number
  day_of_week: DayOfWeek
  start_time: string
  is_active: boolean
}

export const fetchClassSchedules = (params?: { gym_class?: number }) => {
  const query = new URLSearchParams()
  if (params?.gym_class) query.set('gym_class', String(params.gym_class))
  const qs = query.toString()
  return authed<ClassSchedule[]>(`/gimnasio/class-schedules/${qs ? `?${qs}` : ''}`)
}

export const createClassSchedule = (data: {
  gym_class: number
  day_of_week: DayOfWeek
  start_time: string
}) => authed<ClassSchedule>('/gimnasio/class-schedules/', { method: 'POST', body: data })

export const deleteClassSchedule = (id: number) =>
  authed<void>(`/gimnasio/class-schedules/${id}/`, { method: 'DELETE' })

export interface ClassBooking {
  id: number
  customer: number
  gym_class: number
  class_date: string
  status: 'RESERVADO' | 'ASISTIO' | 'NO_ASISTIO' | 'CANCELADO'
  created_at: string
}

export const fetchClassBookings = (params?: {
  customer?: number
  gym_class?: number
  class_date?: string
}) => {
  const query = new URLSearchParams()
  if (params?.customer) query.set('customer', String(params.customer))
  if (params?.gym_class) query.set('gym_class', String(params.gym_class))
  if (params?.class_date) query.set('class_date', params.class_date)
  const qs = query.toString()
  return authed<ClassBooking[]>(`/gimnasio/class-bookings/${qs ? `?${qs}` : ''}`)
}

export const bookClass = (data: {
  customer_id: number
  gym_class_id: number
  class_date: string
}) => authed<ClassBooking>('/gimnasio/class-bookings/', { method: 'POST', body: data })

export const markClassAttendance = (id: number, attended: boolean) =>
  authed<ClassBooking>(`/gimnasio/class-bookings/${id}/attend/`, {
    method: 'POST',
    body: { attended },
  })

export const cancelClassBooking = (id: number) =>
  authed<ClassBooking>(`/gimnasio/class-bookings/${id}/cancel/`, { method: 'POST' })

export interface MembershipGroup {
  id: number
  holder_customer: number
  name: string
  memberships: Membership[]
  created_at: string
}

export const fetchMembershipGroups = () =>
  authed<MembershipGroup[]>('/gimnasio/membership-groups/')

export const createMembershipGroup = (data: {
  holder_customer_id: number
  name?: string
  membership_ids: number[]
}) =>
  authed<MembershipGroup>('/gimnasio/membership-groups/', { method: 'POST', body: data })

export interface AccessCheckResult {
  allowed: boolean
  reason: string | null
}

export const fetchAccessCheck = (membershipId: number) =>
  authed<AccessCheckResult>(`/gimnasio/memberships/${membershipId}/access-check/`)

export const downloadMembershipQr = (membershipId: number) =>
  tenantApiFetchBlob(`/gimnasio/memberships/${membershipId}/qr/`, getAccessToken())

export interface CheckInResult extends AccessCheckResult {
  membership_id: number
  customer_name: string
  plan_name: string
  end_date: string
}

export const checkIn = (data: { token?: string; membership_id?: number }) =>
  authed<CheckInResult>('/gimnasio/check-in/', { method: 'POST', body: data })

export interface ClassAttendanceReportRow {
  class_name: string
  class_date: string
  max_capacity: number
  reserved_count: number
  attended_count: number
  no_show_count: number
  cancelled_count: number
  occupancy_pct: number
}

export const fetchClassAttendanceReport = (params: { date_from: string; date_to: string }) => {
  const query = new URLSearchParams(params)
  return authed<ClassAttendanceReportRow[]>(`/gimnasio/reports/class-attendance/?${query.toString()}`)
}

export const downloadClassAttendanceReport = (
  params: { date_from: string; date_to: string },
  format: 'csv' | 'xlsx',
) => {
  const query = new URLSearchParams({ ...params, export: format })
  return tenantApiFetchBlob(`/gimnasio/reports/class-attendance/?${query.toString()}`, getAccessToken())
}

export interface MembershipsExpiringReportRow {
  membership_id: number
  customer_name: string
  plan_name: string
  end_date: string
}

export const fetchMembershipsExpiringReport = (params: { days: number }) =>
  authed<MembershipsExpiringReportRow[]>(`/gimnasio/reports/memberships-expiring/?days=${params.days}`)

export const downloadMembershipsExpiringReport = (params: { days: number }, format: 'csv' | 'xlsx') =>
  tenantApiFetchBlob(
    `/gimnasio/reports/memberships-expiring/?days=${params.days}&export=${format}`,
    getAccessToken(),
  )

export interface RevenueByPlanReportRow {
  plan_id: number
  plan_name: string
  payment_count: number
  total_amount: string
}

export const fetchRevenueByPlanReport = (params: { date_from: string; date_to: string }) => {
  const query = new URLSearchParams(params)
  return authed<RevenueByPlanReportRow[]>(`/gimnasio/reports/revenue-by-plan/?${query.toString()}`)
}

export const downloadRevenueByPlanReport = (
  params: { date_from: string; date_to: string },
  format: 'csv' | 'xlsx',
) => {
  const query = new URLSearchParams({ ...params, export: format })
  return tenantApiFetchBlob(`/gimnasio/reports/revenue-by-plan/?${query.toString()}`, getAccessToken())
}
