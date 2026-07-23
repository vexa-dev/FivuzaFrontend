import { apiFetch } from '../../shared/utils/apiClient'
import { getAccessToken, type PlatformTokens } from './hooks/session'

export interface Tenant {
  id: number
  schema_name: string
  company_name: string
  ruc: string | null
  status: 'active' | 'trial' | 'suspended' | 'canceled'
  suspended_at: string | null
  created_on: string
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
