import { createContext, useState, type ReactNode } from 'react'
import {
  clearTokens,
  getStoredStaff,
  saveTokens,
  type PlatformStaffInfo,
  type PlatformTokens,
} from './session'

interface AuthContextValue {
  isAuthenticated: boolean
  staff: PlatformStaffInfo | null
  login: (tokens: PlatformTokens) => void
  logout: () => void
  hasRole: (...roles: PlatformStaffInfo['role'][]) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<PlatformStaffInfo | null>(() => getStoredStaff())

  const login = (tokens: PlatformTokens) => {
    saveTokens(tokens)
    setStaff(tokens.staff)
  }

  const logout = () => {
    clearTokens()
    setStaff(null)
  }

  const hasRole = (...roles: PlatformStaffInfo['role'][]) =>
    staff !== null && roles.includes(staff.role)

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: staff !== null, staff, login, logout, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  )
}
