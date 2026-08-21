import { logoutPlatformStaff } from '../api'
import { useAuth } from './useAuth'

export function useLogout() {
  const { logout } = useAuth()

  return async () => {
    await logoutPlatformStaff().catch(() => {
      // si la cookie ya expiró, igual cerramos la sesión en memoria
    })
    logout()
  }
}
