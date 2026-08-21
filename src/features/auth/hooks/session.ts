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
let impersonation: ImpersonationInfo | null = null

// Incrementa en cada clearSession() -tenantApiClient.ts la lee antes de
// esperar un refresh en vuelo, para descartar el resultado si la sesion ya
// se cerro mientras tanto (evita revivir el token tras un logout).
let sessionEpoch = 0

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
  impersonation = session.impersonation ?? null
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(access: string) {
  accessToken = access
}

export function getImpersonation(): ImpersonationInfo | null {
  return impersonation
}

export function getSessionEpoch(): number {
  return sessionEpoch
}

export function isImpersonationExpired(): boolean {
  return impersonation !== null && Date.parse(impersonation.expiresAt) <= Date.now()
}

export function clearSession() {
  accessToken = null
  impersonation = null
  sessionEpoch += 1
}
