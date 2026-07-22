import { createContext, useState, type ReactNode } from 'react'
import { clearTokens, getAccessToken, saveTokens, type PlatformTokens } from './session'

interface AuthContextValue {
  isAuthenticated: boolean
  login: (tokens: PlatformTokens) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAccessToken()))

  const login = (tokens: PlatformTokens) => {
    saveTokens(tokens)
    setIsAuthenticated(true)
  }

  const logout = () => {
    clearTokens()
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
