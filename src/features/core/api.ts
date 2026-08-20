import { apiFetch } from '../../shared/utils/apiClient'
import { getAccessToken, type PlatformStaffInfo, type PlatformTokens } from './hooks/session'

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
  domain: string | null
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

export const PLAN_FEATURE_CODES = [
  'HAS_SALES_MODULE',
  'HAS_PURCHASES_MODULE',
  'HAS_VARIANTS',
  'HAS_MULTI_WAREHOUSE',
  'HAS_HR_MODULE',
  'HAS_CASH_MODULE',
] as const

export type PlanFeatureCode = (typeof PLAN_FEATURE_CODES)[number]

export interface PlanFeature {
  id: number
  plan: number
  feature_code: PlanFeatureCode
  is_enabled: boolean
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
  cash_difference_alert_threshold: string
  updated_at: string
}

export interface PlatformStaffRecord {
  id: number
  email: string
  full_name: string
  role: PlatformStaffInfo['role']
  is_active: boolean
  last_login: string | null
  created_at: string
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

export function restorePlatformSession() {
  return apiFetch<PlatformTokens>('/platform/auth/refresh/', { method: 'POST' })
}

export function logoutPlatformStaff() {
  return apiFetch<void>('/platform/auth/logout/', {
    method: 'POST',
    token: getAccessToken(),
  })
}

export function fetchTenants() {
  return apiFetch<Tenant[]>('/core/tenants/', { token: getAccessToken(), unwrapPagination: true })
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
  accept_terms: boolean
}

export function registerTenant(payload: RegisterTenantPayload) {
  return apiFetch<{ id: number; status: string; provisioning_status: string }>(
    '/core/tenants/register/',
    { method: 'POST', body: payload, token: getAccessToken() },
  )
}

export interface LegalDocument {
  version: string
  content: string
}

export function fetchLegalDocument(document: 'terms' | 'privacy') {
  return apiFetch<LegalDocument>(`/core/legal/${document}/`)
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
  return apiFetch<Plan[]>('/core/plans/', { token: getAccessToken(), unwrapPagination: true })
}

export interface PlanPayload {
  code: string
  name: string
  max_users: number
  price_monthly: string
  price_semiannual: string
  price_annual: string
  is_active?: boolean
}

export function createPlan(payload: PlanPayload) {
  return apiFetch<Plan>('/core/plans/', { method: 'POST', body: payload, token: getAccessToken() })
}

export function updatePlan(id: number, payload: Partial<PlanPayload>) {
  return apiFetch<Plan>(`/core/plans/${id}/`, {
    method: 'PATCH',
    body: payload,
    token: getAccessToken(), unwrapPagination: true,
  })
}

export function fetchPlanFeatures(planId: number) {
  return apiFetch<PlanFeature[]>(`/core/plan-features/?plan=${planId}`, {
    token: getAccessToken(), unwrapPagination: true,
  })
}

export function createPlanFeature(plan: number, featureCode: PlanFeatureCode, isEnabled: boolean) {
  return apiFetch<PlanFeature>('/core/plan-features/', {
    method: 'POST',
    body: { plan, feature_code: featureCode, is_enabled: isEnabled },
    token: getAccessToken(), unwrapPagination: true,
  })
}

export function updatePlanFeature(id: number, isEnabled: boolean) {
  return apiFetch<PlanFeature>(`/core/plan-features/${id}/`, {
    method: 'PATCH',
    body: { is_enabled: isEnabled },
    token: getAccessToken(),
  })
}

export interface SubscriptionFilters {
  tenant?: number
  status?: Subscription['status']
}

export function fetchSubscriptions(filters: SubscriptionFilters = {}) {
  const params = new URLSearchParams()
  if (filters.tenant) params.set('tenant', String(filters.tenant))
  if (filters.status) params.set('status', filters.status)
  return apiFetch<Subscription[]>(`/core/subscriptions/?${params.toString()}`, {
    token: getAccessToken(),
    unwrapPagination: true,
  })
}

export function updateSubscription(
  id: number,
  data: Partial<Pick<Subscription, 'plan' | 'billing_cycle' | 'status' | 'expires_at'>>,
) {
  return apiFetch<Subscription>(`/core/subscriptions/${id}/`, {
    method: 'PATCH',
    body: data,
    token: getAccessToken(),
  })
}

export interface PaymentFilters {
  subscription?: number
  status?: SubscriptionPayment['status']
}

export function fetchPayments(filters: PaymentFilters = {}) {
  const params = new URLSearchParams()
  if (filters.subscription) params.set('subscription', String(filters.subscription))
  if (filters.status) params.set('status', filters.status)
  return apiFetch<SubscriptionPayment[]>(`/core/subscription-payments/?${params.toString()}`, {
    token: getAccessToken(),
    unwrapPagination: true,
  })
}

export interface CreatePaymentPayload {
  subscription: number
  amount: string
  payment_method: SubscriptionPayment['payment_method']
  external_reference?: string
  status: SubscriptionPayment['status']
}

export function createPayment(payload: CreatePaymentPayload) {
  return apiFetch<SubscriptionPayment>('/core/subscription-payments/', {
    method: 'POST',
    body: payload,
    token: getAccessToken(),
  })
}

export function confirmPayment(id: number) {
  return apiFetch<{ id: number; status: string; paid_at: string }>(
    `/core/subscription-payments/${id}/confirm/`,
    { method: 'POST', body: {}, token: getAccessToken() },
  )
}

export function fetchStaff() {
  return apiFetch<PlatformStaffRecord[]>('/core/platform-staff/', { token: getAccessToken(), unwrapPagination: true })
}

export interface StaffPayload {
  email: string
  full_name: string
  role: PlatformStaffInfo['role']
  password?: string
  is_active?: boolean
}

export function createStaff(payload: StaffPayload) {
  return apiFetch<PlatformStaffRecord>('/core/platform-staff/', {
    method: 'POST',
    body: payload,
    token: getAccessToken(), unwrapPagination: true,
  })
}

export function updateStaff(id: number, payload: Partial<StaffPayload>) {
  return apiFetch<PlatformStaffRecord>(`/core/platform-staff/${id}/`, {
    method: 'PATCH',
    body: payload,
    token: getAccessToken(), unwrapPagination: true,
  })
}

export function fetchTenantSettings(tenantId: number) {
  return apiFetch<TenantSettingsRecord[]>(`/core/tenant-settings/?tenant=${tenantId}`, {
    token: getAccessToken(), unwrapPagination: true,
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
      | 'cash_difference_alert_threshold'
    >
  >,
) {
  return apiFetch<TenantSettingsRecord>(`/core/tenant-settings/${id}/`, {
    method: 'PATCH',
    body: data,
      token: getAccessToken(), unwrapPagination: true,
  })
}

export function fetchTenantAuditLogs(entityId: number) {
  return apiFetch<PaginatedResponse<PlatformAuditLog>>(
    `/core/platform-audit-logs/?entity=Tenant&entity_id=${entityId}&ordering=-created_at`,
    { token: getAccessToken() },
  )
}

export interface AuditLogFilters {
  platform_staff?: number
  entity?: string
  date_from?: string
  date_to?: string
  page?: number
}

export function fetchAuditLogs(filters: AuditLogFilters = {}) {
  const params = new URLSearchParams()
  params.set('ordering', '-created_at')
  if (filters.platform_staff) params.set('platform_staff', String(filters.platform_staff))
  if (filters.entity) params.set('entity', filters.entity)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.page) params.set('page', String(filters.page))
  return apiFetch<PaginatedResponse<PlatformAuditLog>>(
    `/core/platform-audit-logs/?${params.toString()}`,
    { token: getAccessToken() },
  )
}

export function fetchDashboardSummary() {
  return apiFetch<DashboardSummary>('/core/dashboard/summary/', { token: getAccessToken() })
}

export interface ImpersonationStartResult {
  session_id: number
  access_token: string
  expires_at: string
  user: {
    id: number
    email: string
    role: string
    permissions: string[]
  }
}

export function startImpersonation(tenantId: number, reason: string) {
  return apiFetch<ImpersonationStartResult>(`/core/tenants/${tenantId}/impersonation/`, {
    method: 'POST',
    body: { reason },
    token: getAccessToken(),
  })
}

export function endImpersonationSession(tenantId: number, sessionId: number) {
  return apiFetch<void>(`/core/tenants/${tenantId}/impersonation/${sessionId}/`, {
    method: 'DELETE',
    token: getAccessToken(),
  })
}

export interface TenantFeatureOverride {
  id: number
  tenant: number
  feature_code: PlanFeatureCode
  is_enabled: boolean
}

export function fetchTenantFeatureOverrides(tenantId: number) {
  return apiFetch<TenantFeatureOverride[]>(`/core/tenants/${tenantId}/feature-overrides/`, {
    token: getAccessToken(),
    unwrapPagination: true,
  })
}

export function setTenantFeatureOverride(
  tenantId: number,
  featureCode: PlanFeatureCode,
  isEnabled: boolean,
) {
  return apiFetch<{ tenant_id: number; feature_code: string; is_enabled: boolean }>(
    `/core/tenants/${tenantId}/feature-overrides/${featureCode}/`,
    { method: 'PATCH', body: { is_enabled: isEnabled }, token: getAccessToken() },
  )
}

export function removeTenantFeatureOverride(tenantId: number, featureCode: PlanFeatureCode) {
  return apiFetch<void>(`/core/tenants/${tenantId}/feature-overrides/${featureCode}/`, {
    method: 'DELETE',
    token: getAccessToken(),
  })
}

export interface TenantNote {
  id: number
  tenant: number
  platform_staff: { id: number; full_name: string }
  text: string
  created_at: string
}

export function fetchTenantNotes(tenantId: number) {
  return apiFetch<TenantNote[]>(`/core/tenants/${tenantId}/notes/`, {
    token: getAccessToken(),
    unwrapPagination: true,
  })
}

export function createTenantNote(tenantId: number, text: string) {
  return apiFetch<TenantNote>(`/core/tenants/${tenantId}/notes/`, {
    method: 'POST',
    body: { text },
    token: getAccessToken(),
  })
}

export interface SubscriptionDiscount {
  id: number
  subscription_id: number
  discount_percent: string | null
  override_price: string | null
  reason: string
  expires_at: string | null
  created_at: string
}

export interface CreateDiscountPayload {
  subscription_id: number
  discount_percent?: string
  override_price?: string
  reason: string
  expires_at?: string
}

export function fetchSubscriptionDiscounts(subscriptionId: number) {
  return apiFetch<SubscriptionDiscount[]>(
    `/core/subscription-discounts/?subscription=${subscriptionId}`,
    { token: getAccessToken(), unwrapPagination: true },
  )
}

export function createSubscriptionDiscount(payload: CreateDiscountPayload) {
  return apiFetch<SubscriptionDiscount>('/core/subscription-discounts/', {
    method: 'POST',
    body: payload,
    token: getAccessToken(),
  })
}

export function removeSubscriptionDiscount(id: number) {
  return apiFetch<void>(`/core/subscription-discounts/${id}/`, {
    method: 'DELETE',
    token: getAccessToken(),
  })
}

export interface OnboardingChecklist {
  has_catalog: boolean
  has_first_sale: boolean
  has_users_created: boolean
}

export function fetchTenantOnboarding(tenantId: number) {
  return apiFetch<OnboardingChecklist>(`/core/tenants/${tenantId}/onboarding/`, {
    token: getAccessToken(),
  })
}

export interface TenantHealth {
  recent_errors_count: number
  last_error_at: string | null
  last_login_at: string | null
  last_sale_at: string | null
}

export function fetchTenantHealth(tenantId: number) {
  return apiFetch<TenantHealth>(`/core/tenants/${tenantId}/health/`, {
    token: getAccessToken(),
  })
}

export interface TenantConsumption {
  sales_count_last_30_days: number
  active_users_count: number
  catalog_size: number
}

export function fetchTenantConsumption(tenantId: number) {
  return apiFetch<TenantConsumption>(`/core/tenants/${tenantId}/consumption/`, {
    token: getAccessToken(),
  })
}
