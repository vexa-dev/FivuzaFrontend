import { createContext, useState, type ReactNode } from 'react'
import {
  clearSession,
  getStoredImpersonation,
  getStoredUser,
  saveSession,
  type ImpersonationInfo,
  type TenantSession,
  type TenantUser,
} from './session'

interface AuthContextValue {
  isAuthenticated: boolean
  user: TenantUser | null
  impersonation: ImpersonationInfo | null
  login: (session: TenantSession) => void
  logout: () => void
  hasPermission: (code: string) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TenantUser | null>(() => getStoredUser())
  const [impersonation, setImpersonation] = useState<ImpersonationInfo | null>(() =>
    getStoredImpersonation(),
  )

  const login = (session: TenantSession) => {
    saveSession(session)
    setUser(session.user)
    setImpersonation(session.impersonation ?? null)
  }

  const logout = () => {
    clearSession()
    setUser(null)
    setImpersonation(null)
  }

  const hasPermission = (code: string) => user?.permissions.includes(code) ?? false

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: user !== null,
        user,
        impersonation,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
