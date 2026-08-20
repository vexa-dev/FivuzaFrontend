import { createContext, useEffect, useState, type ReactNode } from 'react'
import { restorePlatformSession } from '../api'
import {
  clearTokens,
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
  isRestoring: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<PlatformStaffInfo | null>(null)
  const [isRestoring, setIsRestoring] = useState(true)

  useEffect(() => {
    restorePlatformSession()
      .then((tokens) => {
        saveTokens(tokens)
        setStaff(tokens.staff)
      })
      .catch(clearTokens)
      .finally(() => setIsRestoring(false))
  }, [])

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
      value={{ isAuthenticated: staff !== null, staff, login, logout, hasRole, isRestoring }}
    >
      {children}
    </AuthContext.Provider>
  )
}
