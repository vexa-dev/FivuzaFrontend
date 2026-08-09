import { getAccessToken } from '../auth/hooks/session'
import { tenantApiFetch } from '../../shared/utils/tenantApiClient'

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
