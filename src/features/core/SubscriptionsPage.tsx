import { Receipt, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../shared/components/EmptyState'
import type { Subscription } from './api'
import { SubscriptionEditModal } from './components/SubscriptionEditModal'
import { useAllPlans } from './hooks/usePlansAdmin'
import { useAllSubscriptions } from './hooks/useSubscriptionsAdmin'
import { useTenants } from './hooks/useTenants'

const STATUS_LABEL: Record<Subscription['status'], string> = {
  active: 'Activa',
  past_due: 'Vencida',
  canceled: 'Cancelada',
}

const STATUS_BADGE: Record<Subscription['status'], string> = {
  active: 'badge-success',
  past_due: 'badge-danger',
  canceled: 'badge-neutral',
}

export function SubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState<Subscription['status'] | 'all'>('all')
  const [search, setSearch] = useState('')
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)

  const { data: subscriptions, isLoading } = useAllSubscriptions(
    statusFilter === 'all' ? {} : { status: statusFilter },
  )
  const { data: tenants } = useTenants()
  const { data: plans } = useAllPlans()

  const tenantName = (tenantId: number) =>
    tenants?.find((t) => t.id === tenantId)?.company_name ?? `Tenant #${tenantId}`
  const planName = (planId: number) => plans?.find((p) => p.id === planId)?.name ?? `Plan #${planId}`

  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return subscriptions
    const term = search.trim().toLowerCase()
    if (!term) return subscriptions
    return subscriptions.filter((sub) =>
      (tenants?.find((t) => t.id === sub.tenant)?.company_name ?? '').toLowerCase().includes(term),
    )
  }, [subscriptions, search, tenants])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Suscripciones</h1>
          <p className="core-page-subtitle">Suscripciones activas de todos los tenants</p>
        </div>
      </div>

      <div className="card core-table-card">
        <div className="table-toolbar">
          <div className="search-input">
            <Search />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por negocio..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as Subscription['status'] | 'all')
            }
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activa</option>
            <option value="past_due">Vencida</option>
            <option value="canceled">Cancelada</option>
          </select>
        </div>

        {isLoading && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}
        {filteredSubscriptions && filteredSubscriptions.length === 0 && (
          <EmptyState icon={<Receipt />} title="Sin suscripciones" />
        )}
        {filteredSubscriptions && filteredSubscriptions.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Plan</th>
                <th>Ciclo</th>
                <th>Estado</th>
                <th>Vence</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td className="core-table-strong">
                    <Link to={`/admin/tenants/${sub.tenant}`}>{tenantName(sub.tenant)}</Link>
                  </td>
                  <td>{planName(sub.plan)}</td>
                  <td>{sub.billing_cycle}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[sub.status]}`}>
                      <span className="dot" />
                      {STATUS_LABEL[sub.status]}
                    </span>
                  </td>
                  <td>{new Date(sub.expires_at).toLocaleDateString('es-PE', { dateStyle: 'medium' })}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditingSubscription(sub)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingSubscription && plans && (
        <SubscriptionEditModal
          subscription={editingSubscription}
          plans={plans}
          tenantName={tenantName(editingSubscription.tenant)}
          onClose={() => setEditingSubscription(null)}
        />
      )}
    </div>
  )
}
