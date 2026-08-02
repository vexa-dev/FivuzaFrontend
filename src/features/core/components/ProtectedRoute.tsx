import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { PlatformStaffInfo } from '../hooks/session'

interface ProtectedRouteProps {
  /** Si se define, ademas de estar autenticado el staff debe tener uno de
   * estos roles -de lo contrario se le redirige al resumen en vez de
   * mostrar una pantalla que de todas formas va a fallar con 403 contra el
   * backend (que es quien de verdad aplica el permiso). */
  requireRole?: PlatformStaffInfo['role'][]
}

export function ProtectedRoute({ requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, hasRole } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  if (requireRole && !hasRole(...requireRole)) {
    return <Navigate to="/admin/resumen" replace />
  }

  return <Outlet />
}
