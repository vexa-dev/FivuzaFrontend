import { useQuery } from '@tanstack/react-query'
import { fetchTenants, logoutPlatformStaff } from './api'
import { getRefreshToken } from './session'
import { useAuth } from './useAuth'
import './CorePage.css'

export function CorePage() {
  const { logout } = useAuth()
  const { data: tenants, isLoading, error } = useQuery({
    queryKey: ['core', 'tenants'],
    queryFn: fetchTenants,
  })

  const handleLogout = async () => {
    const refresh = getRefreshToken()
    if (refresh) {
      await logoutPlatformStaff(refresh).catch(() => {
        // si el token ya expiro o esta en blacklist, igual cerramos sesion localmente
      })
    }
    logout()
  }

  return (
    <div className="core-page">
      <header className="core-header">
        <h1>Tenants</h1>
        <button type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>

      {isLoading && <p>Cargando...</p>}
      {error && <p role="alert">No se pudieron cargar los tenants.</p>}

      {tenants && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Negocio</th>
              <th>Schema</th>
              <th>Estado</th>
              <th>Creado</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td>{tenant.company_name}</td>
                <td>{tenant.schema_name}</td>
                <td>
                  <span className={`status-badge status-${tenant.status}`}>
                    {tenant.status}
                  </span>
                </td>
                <td>{tenant.created_on}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
