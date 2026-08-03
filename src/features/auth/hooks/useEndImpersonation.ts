import { endImpersonation } from '../api'
import { useAuth } from './useAuth'

export function useEndImpersonation() {
  const { logout } = useAuth()

  return async () => {
    await endImpersonation().catch(() => {
      // si el token ya vencio o la sesion ya se termino del lado del panel
      // core, igual cerramos sesion localmente -no hay nada mas que revocar.
    })
    logout()
  }
}
