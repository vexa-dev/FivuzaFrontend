import { logoutPlatformStaff } from '../api'
import { getRefreshToken } from './session'
import { useAuth } from './useAuth'

export function useLogout() {
  const { logout } = useAuth()

  return async () => {
    const refresh = getRefreshToken()
    if (refresh) {
      await logoutPlatformStaff(refresh).catch(() => {
        // si el token ya expiro o esta en blacklist, igual cerramos sesion localmente
      })
    }
    logout()
  }
}
