export interface TenantUser {
  id: number
  email: string
  role: string
  permissions: string[]
  warehouse_ids?: number[]
}

export interface ImpersonationInfo {
  sessionId: number
  expiresAt: string
}

export interface TenantSession {
  access: string
  user: TenantUser
  impersonation?: ImpersonationInfo
}

let accessToken: string | null = null

for (const key of [
  'fivuza_tenant_access',
  'fivuza_tenant_refresh',
  'fivuza_tenant_user',
  'fivuza_tenant_impersonation',
]) {
  localStorage.removeItem(key)
}

export function saveSession(session: TenantSession) {
  accessToken = session.access
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(access: string) {
  accessToken = access
}

export function clearSession() {
  accessToken = null
}
