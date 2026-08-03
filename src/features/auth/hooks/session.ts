const ACCESS_KEY = 'fivuza_tenant_access'
const REFRESH_KEY = 'fivuza_tenant_refresh'
const USER_KEY = 'fivuza_tenant_user'
const IMPERSONATION_KEY = 'fivuza_tenant_impersonation'

export interface TenantUser {
  id: number
  email: string
  role: string
  permissions: string[]
}

export interface ImpersonationInfo {
  sessionId: number
  expiresAt: string
}

export interface TenantSession {
  access: string
  // Una sesion de impersonacion (Sprint 10) no trae refresh token a
  // proposito -sin el, el acceso no puede extenderse mas alla de los 60
  // minutos que dura la sesion de soporte (Especificacion de API §4.24).
  refresh?: string
  user: TenantUser
  impersonation?: ImpersonationInfo
}

export function saveSession(session: TenantSession) {
  localStorage.setItem(ACCESS_KEY, session.access)
  if (session.refresh) {
    localStorage.setItem(REFRESH_KEY, session.refresh)
  } else {
    localStorage.removeItem(REFRESH_KEY)
  }
  localStorage.setItem(USER_KEY, JSON.stringify(session.user))
  if (session.impersonation) {
    localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(session.impersonation))
  } else {
    localStorage.removeItem(IMPERSONATION_KEY)
  }
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

export function getStoredImpersonation(): ImpersonationInfo | null {
  const raw = localStorage.getItem(IMPERSONATION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ImpersonationInfo
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(IMPERSONATION_KEY)
}
