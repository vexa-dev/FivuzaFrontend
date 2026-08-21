export interface PlatformStaffInfo {
  id: number
  email: string
  full_name: string
  role: 'SUPER_ADMIN' | 'SUPPORT' | 'BILLING'
}

export interface PlatformTokens {
  access: string
  staff: PlatformStaffInfo
}

let accessToken: string | null = null

// Incrementa en cada clearTokens() -apiClient.ts la lee antes de esperar un
// refresh en vuelo, para descartar el resultado si la sesion ya se cerro
// mientras tanto (evita revivir el token tras un logout).
let sessionEpoch = 0

for (const key of [
  'fivuza_platform_access',
  'fivuza_platform_refresh',
  'fivuza_platform_staff',
]) {
  localStorage.removeItem(key)
}

export function saveTokens(tokens: PlatformTokens) {
  accessToken = tokens.access
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(access: string) {
  accessToken = access
}

export function getSessionEpoch(): number {
  return sessionEpoch
}

export function clearTokens() {
  accessToken = null
  sessionEpoch += 1
}
