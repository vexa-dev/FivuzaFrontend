const ACCESS_KEY = 'fivuza_tenant_access'
const REFRESH_KEY = 'fivuza_tenant_refresh'
const USER_KEY = 'fivuza_tenant_user'

export interface TenantUser {
  id: number
  email: string
  role: string
  permissions: string[]
}

export interface TenantSession {
  access: string
  refresh: string
  user: TenantUser
}

export function saveSession(session: TenantSession) {
  localStorage.setItem(ACCESS_KEY, session.access)
  localStorage.setItem(REFRESH_KEY, session.refresh)
  localStorage.setItem(USER_KEY, JSON.stringify(session.user))
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setAccessToken(access: string) {
  localStorage.setItem(ACCESS_KEY, access)
}

export function getStoredUser(): TenantUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as TenantUser
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}
