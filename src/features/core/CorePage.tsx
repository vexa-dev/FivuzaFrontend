import { Building2, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../shared/components/EmptyState'
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
  const [search, setSearch] = useState('')

  const filteredTenants = useMemo(() => {
    if (!tenants) return tenants
    const term = search.trim().toLowerCase()
    if (!term) return tenants
    return tenants.filter(
      (tenant) =>
        tenant.company_name.toLowerCase().includes(term) ||
        tenant.schema_name.toLowerCase().includes(term),
    )
  }, [tenants, search])

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
        <div className="page-header">
          <div>
            <h1 className="core-page-title">Tenants</h1>
            <p className="core-page-subtitle">Negocios registrados en la plataforma Fivuza</p>
          </div>
        </div>

        <div className="card core-table-card">
          <div className="table-toolbar">
            <div className="search-input">
              <Search />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por negocio o schema..."
              />
            </div>
          </div>

          {isLoading && (
            <div className="loading-row">
              <span className="spinner" />
              Cargando...
            </div>
          )}
          {error && (
            <p className="core-state-message" role="alert">
              No se pudieron cargar los tenants.
            </p>
          )}
          {filteredTenants && filteredTenants.length === 0 && (
            <EmptyState
              icon={<Building2 />}
              title={search ? 'Sin resultados' : 'Todavía no hay tenants'}
              subtitle={
                search
                  ? 'Prueba con otro término de búsqueda.'
                  : 'Los negocios que se registren en Fivuza aparecerán aquí.'
              }
            />
          )}
          {filteredTenants && filteredTenants.length > 0 && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Negocio</th>
                  <th>Schema</th>
                  <th>RUC</th>
                  <th>Estado</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="core-table-strong">{tenant.company_name}</td>
                    <td>{tenant.schema_name}</td>
                    <td>{tenant.ruc ?? '—'}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[tenant.status]}`}>
                        <span className="dot" />
                        {STATUS_LABEL[tenant.status] ?? tenant.status}
                      </span>
                    </td>
                    <td>
                      {new Date(tenant.created_on).toLocaleDateString('es-PE', {
                        dateStyle: 'medium',
                      })}
                    </td>
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
