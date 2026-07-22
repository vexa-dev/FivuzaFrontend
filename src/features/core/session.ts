const ACCESS_KEY = 'fivuza_platform_access'
const REFRESH_KEY = 'fivuza_platform_refresh'

export interface PlatformTokens {
  access: string
  refresh: string
}

export function saveTokens(tokens: PlatformTokens) {
  localStorage.setItem(ACCESS_KEY, tokens.access)
  localStorage.setItem(REFRESH_KEY, tokens.refresh)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}
