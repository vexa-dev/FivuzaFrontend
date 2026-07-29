import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  /** Si se define, ademas de estar autenticado el usuario debe tener este
   * permiso -de lo contrario se le redirige al dashboard en vez de mostrar
   * la ruta. La aplicacion real del permiso siempre ocurre en el backend
   * (HasModulePermission); esto es solo para no mostrar una pantalla que
   * de todas formas va a fallar con 403. */
  requirePermission?: string
}

export function ProtectedRoute({ requirePermission }: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requirePermission && !hasPermission(requirePermission)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
