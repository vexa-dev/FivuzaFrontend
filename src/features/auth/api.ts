import { tenantApiFetch } from '../../shared/utils/tenantApiClient'
import { getAccessToken, type TenantSession } from './hooks/session'

export function loginTenantUser(email: string, password: string) {
  return tenantApiFetch<TenantSession>('/auth/login/', {
    method: 'POST',
    body: { email, password },
  })
}

export function restoreTenantSession() {
  return tenantApiFetch<TenantSession>('/auth/refresh/', { method: 'POST' })
}

export function logoutTenantUser() {
  return tenantApiFetch<void>('/auth/logout/', {
    method: 'POST',
    token: getAccessToken(),
  })
}

export function requestPasswordReset(email: string) {
  return tenantApiFetch<void>('/auth/password-reset/', {
    method: 'POST',
    body: { email },
  })
}

export function confirmPasswordReset(token: string, newPassword: string) {
  return tenantApiFetch<void>('/auth/password-reset/confirm/', {
    method: 'POST',
    body: { token, new_password: newPassword },
  })
}

export function endImpersonation() {
  return tenantApiFetch<void>('/impersonation/end/', {
    method: 'POST',
    body: {},
    token: getAccessToken(),
  })
}
