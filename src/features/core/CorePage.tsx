import { Logo } from '../../shared/components/Logo'
import { ThemeToggle } from '../../shared/components/ThemeToggle'
import type { Tenant } from './api'
import { useLogout } from './hooks/useLogout'
import { useTenants } from './hooks/useTenants'
import './CorePage.css'

const STATUS_BADGE: Record<Tenant['status'], string> = {
  active: 'badge-success',
  trial: 'badge-warning',
  suspended: 'badge-danger',
  canceled: 'badge-neutral',
}

const STATUS_LABEL: Record<Tenant['status'], string> = {
  active: 'Activo',
  trial: 'Prueba',
  suspended: 'Suspendido',
  canceled: 'Cancelado',
}

export function CorePage() {
  const { data: tenants, isLoading, error } = useTenants()
  const handleLogout = useLogout()

  return (
    <div className="core-page">
      <header className="core-topbar">
        <Logo height={22} />
        <div className="core-topbar-actions">
          <ThemeToggle />
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="core-content">
        <h1 className="core-page-title">Tenants</h1>
        <p className="core-page-subtitle">Negocios registrados en la plataforma Fivuza</p>

        <div className="card core-table-card">
          {isLoading && <p className="core-state-message">Cargando...</p>}
          {error && (
            <p className="core-state-message" role="alert">
              No se pudieron cargar los tenants.
            </p>
          )}

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
                    <td className="core-table-strong">{tenant.company_name}</td>
                    <td>{tenant.schema_name}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[tenant.status]}`}>
                        <span className="dot" />
                        {STATUS_LABEL[tenant.status] ?? tenant.status}
                      </span>
                    </td>
                    <td>{tenant.created_on}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
