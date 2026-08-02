import { apiFetch } from '../../shared/utils/apiClient'
import { getAccessToken, type PlatformTokens } from './hooks/session'

export interface Tenant {
  id: number
  schema_name: string
  company_name: string
  ruc: string | null
  default_currency: string
  status: 'active' | 'trial' | 'suspended' | 'canceled'
  suspended_at: string | null
  canceled_at: string | null
  provisioning_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  created_on: string
}

export interface Plan {
  id: number
  code: string
  name: string
  max_users: number
  price_monthly: string
  price_semiannual: string
  price_annual: string
  is_active: boolean
}

export interface Subscription {
  id: number
  tenant: number
  plan: number
  billing_cycle: 'MONTHLY' | 'SEMIANNUAL' | 'ANNUAL'
  price_paid: string
  currency: string
  status: 'active' | 'past_due' | 'canceled'
  starts_at: string
  expires_at: string
  created_at: string
}

export interface SubscriptionPayment {
  id: number
  subscription: number
  amount: string
  currency: string
  payment_method: 'CARD' | 'TRANSFER' | 'YAPE' | 'PLIN'
  external_reference: string
  status: 'PAID' | 'FAILED' | 'REFUNDED' | 'PENDING'
  paid_at: string | null
  created_at: string
}

export interface TenantSettingsRecord {
  id: number
  tenant: number
  purchases_enabled: boolean
  variants_enabled: boolean
  multi_warehouse_enabled: boolean
  hr_module_enabled: boolean
  cash_module_enabled: boolean
  updated_at: string
}

export interface PlatformAuditLog {
  id: number
  platform_staff: number
  platform_staff_email: string
  action: string
  entity: string
  entity_id: number
  details: string
  created_at: string
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface DashboardSummary {
  tenants_by_status: Record<string, number>
  mrr: number
  pending_payments_count: number
  recent_tenants: { id: number; company_name: string; status: string; created_on: string }[]
  recently_suspended: { id: number; company_name: string; suspended_at: string }[]
  recently_canceled: {
    id: number
    company_name: string
    canceled_at: string
    data_retention_until: string
  }[]
}

export function loginPlatformStaff(email: string, password: string) {
  return apiFetch<PlatformTokens>('/platform/auth/login/', {
    method: 'POST',
    body: { email, password },
  })
}

export function logoutPlatformStaff(refresh: string) {
  return apiFetch<void>('/platform/auth/logout/', {
    method: 'POST',
    body: { refresh },
    token: getAccessToken(),
  })
}

export function fetchTenants() {
  return apiFetch<Tenant[]>('/core/tenants/', { token: getAccessToken() })
}

export function fetchTenant(id: number) {
  return apiFetch<Tenant>(`/core/tenants/${id}/`, { token: getAccessToken() })
}

export interface RegisterTenantPayload {
  company_name: string
  ruc?: string
  schema_name: string
  domain: string
  plan_code: string
  billing_cycle: 'MONTHLY' | 'SEMIANNUAL' | 'ANNUAL'
}

export function registerTenant(payload: RegisterTenantPayload) {
  return apiFetch<{ id: number; status: string; provisioning_status: string }>(
    '/core/tenants/register/',
    { method: 'POST', body: payload, token: getAccessToken() },
  )
}

export function suspendTenant(id: number, reason: string) {
  return apiFetch<{ id: number; status: string; suspended_at: string }>(
    `/core/tenants/${id}/suspend/`,
    { method: 'PATCH', body: { reason }, token: getAccessToken() },
  )
}

export function reactivateTenant(id: number) {
  return apiFetch<{ id: number; status: string }>(`/core/tenants/${id}/reactivate/`, {
    method: 'PATCH',
    body: {},
    token: getAccessToken(),
  })
}

export function cancelTenant(id: number, reason: string) {
  return apiFetch<{
    id: number
    status: string
    canceled_at: string
    data_retention_until: string
  }>(`/core/tenants/${id}/cancel/`, {
    method: 'PATCH',
    body: { reason },
    token: getAccessToken(),
  })
}

export function fetchPlans() {
  return apiFetch<Plan[]>('/core/plans/', { token: getAccessToken() })
}

export function fetchSubscriptions(tenantId: number) {
  return apiFetch<Subscription[]>(`/core/subscriptions/?tenant=${tenantId}`, {
    token: getAccessToken(),
  })
}

export function fetchPayments(subscriptionId: number) {
  return apiFetch<SubscriptionPayment[]>(
    `/core/subscription-payments/?subscription=${subscriptionId}`,
    { token: getAccessToken() },
  )
}

export function confirmPayment(id: number) {
  return apiFetch<{ id: number; status: string; paid_at: string }>(
    `/core/subscription-payments/${id}/confirm/`,
    { method: 'POST', body: {}, token: getAccessToken() },
  )
}

export function fetchTenantSettings(tenantId: number) {
  return apiFetch<TenantSettingsRecord[]>(`/core/tenant-settings/?tenant=${tenantId}`, {
    token: getAccessToken(),
  })
}

export function updateTenantSettings(
  id: number,
  data: Partial<
    Pick<
      TenantSettingsRecord,
      | 'purchases_enabled'
      | 'variants_enabled'
      | 'multi_warehouse_enabled'
      | 'hr_module_enabled'
      | 'cash_module_enabled'
    >
  >,
) {
  return apiFetch<TenantSettingsRecord>(`/core/tenant-settings/${id}/`, {
    method: 'PATCH',
    body: data,
    token: getAccessToken(),
  })
}

export function fetchTenantAuditLogs(entityId: number) {
  return apiFetch<PaginatedResponse<PlatformAuditLog>>(
    `/core/platform-audit-logs/?entity=Tenant&entity_id=${entityId}&ordering=-created_at`,
    { token: getAccessToken() },
  )
}

export function fetchDashboardSummary() {
  return apiFetch<DashboardSummary>('/core/dashboard/summary/', { token: getAccessToken() })
}
