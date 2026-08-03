import { Building2, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../shared/components/EmptyState'
import type { Tenant } from './api'
import { CancelTenantModal } from './components/CancelTenantModal'
import { OnboardingBadges } from './components/OnboardingBadges'
import { ReactivateTenantModal } from './components/ReactivateTenantModal'
import { RegisterTenantModal } from './components/RegisterTenantModal'
import { SuspendTenantModal } from './components/SuspendTenantModal'
import { usePlans } from './hooks/useTenantBilling'
import { useTenants } from './hooks/useTenants'

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

type ActiveModal = 'register' | { type: 'suspend' | 'reactivate' | 'cancel'; tenant: Tenant } | null

export function TenantsPage() {
  const { data: tenants, isLoading, error } = useTenants()
  const { data: plans } = usePlans()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Tenant['status'] | 'all'>('all')
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  const filteredTenants = useMemo(() => {
    if (!tenants) return tenants
    const term = search.trim().toLowerCase()
    return tenants.filter((tenant) => {
      const matchesTerm =
        !term ||
        tenant.company_name.toLowerCase().includes(term) ||
        tenant.schema_name.toLowerCase().includes(term)
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter
      return matchesTerm && matchesStatus
    })
  }, [tenants, search, statusFilter])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Tenants</h1>
          <p className="core-page-subtitle">Negocios registrados en la plataforma Fivuza</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setActiveModal('register')}>
          <Plus size={15} strokeWidth={2.5} />
          Registrar tenant
        </button>
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
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as Tenant['status'] | 'all')}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="trial">Prueba</option>
            <option value="suspended">Suspendido</option>
            <option value="canceled">Cancelado</option>
          </select>
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
                : 'Registra el primero con "Registrar tenant".'
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
                <th>Onboarding</th>
                <th>Creado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="core-table-strong">
                    <Link to={`/admin/tenants/${tenant.id}`}>{tenant.company_name}</Link>
                  </td>
                  <td>{tenant.schema_name}</td>
                  <td>{tenant.ruc ?? '—'}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[tenant.status]}`}>
                      <span className="dot" />
                      {STATUS_LABEL[tenant.status] ?? tenant.status}
                    </span>
                  </td>
                  <td>
                    <OnboardingBadges tenantId={tenant.id} />
                  </td>
                  <td>
                    {new Date(tenant.created_on).toLocaleDateString('es-PE', {
                      dateStyle: 'medium',
                    })}
                  </td>
                  <td>
                    <div className="row-actions">
                      {tenant.status === 'suspended' && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setActiveModal({ type: 'reactivate', tenant })}
                        >
                          Reactivar
                        </button>
                      )}
                      {(tenant.status === 'active' || tenant.status === 'trial') && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setActiveModal({ type: 'suspend', tenant })}
                        >
                          Suspender
                        </button>
                      )}
                      {tenant.status !== 'canceled' && (
                        <button
                          type="button"
                          className="btn btn-danger-ghost btn-sm"
                          onClick={() => setActiveModal({ type: 'cancel', tenant })}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {activeModal === 'register' && (
        <RegisterTenantModal plans={plans ?? []} onClose={() => setActiveModal(null)} />
      )}
      {activeModal && activeModal !== 'register' && activeModal.type === 'suspend' && (
        <SuspendTenantModal tenant={activeModal.tenant} onClose={() => setActiveModal(null)} />
      )}
      {activeModal && activeModal !== 'register' && activeModal.type === 'reactivate' && (
        <ReactivateTenantModal tenant={activeModal.tenant} onClose={() => setActiveModal(null)} />
      )}
      {activeModal && activeModal !== 'register' && activeModal.type === 'cancel' && (
        <CancelTenantModal tenant={activeModal.tenant} onClose={() => setActiveModal(null)} />
      )}
    </div>
  )
}
