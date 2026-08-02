const ACCESS_KEY = 'fivuza_platform_access'
const REFRESH_KEY = 'fivuza_platform_refresh'
const STAFF_KEY = 'fivuza_platform_staff'

export interface PlatformStaffInfo {
  id: number
  email: string
  full_name: string
  role: 'SUPER_ADMIN' | 'SUPPORT' | 'BILLING'
}

export interface PlatformTokens {
  access: string
  refresh: string
  staff: PlatformStaffInfo
}

export function saveTokens(tokens: PlatformTokens) {
  localStorage.setItem(ACCESS_KEY, tokens.access)
  localStorage.setItem(REFRESH_KEY, tokens.refresh)
  localStorage.setItem(STAFF_KEY, JSON.stringify(tokens.staff))
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function getStoredStaff(): PlatformStaffInfo | null {
  const raw = localStorage.getItem(STAFF_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PlatformStaffInfo
  } catch {
    return null
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(STAFF_KEY)
}
