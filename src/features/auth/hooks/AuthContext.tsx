import { createContext, useState, type ReactNode } from 'react'
import {
  clearSession,
  getStoredUser,
  saveSession,
  type TenantSession,
  type TenantUser,
} from './session'

interface AuthContextValue {
  isAuthenticated: boolean
  user: TenantUser | null
  login: (session: TenantSession) => void
  logout: () => void
  hasPermission: (code: string) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TenantUser | null>(() => getStoredUser())

  const login = (session: TenantSession) => {
    saveSession(session)
    setUser(session.user)
  }

  const logout = () => {
    clearSession()
    setUser(null)
  }

  const hasPermission = (code: string) => user?.permissions.includes(code) ?? false

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: user !== null, user, login, logout, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  )
}
