import { AlertTriangle, Ban, Building2, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ConsumptionSection } from './components/ConsumptionSection'
import { useDashboardSummary } from './hooks/useDashboardSummary'
import { useTenants } from './hooks/useTenants'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-PE', { dateStyle: 'medium' })
}

export function DashboardPage() {
  const { data, isLoading, error } = useDashboardSummary()
  const { data: tenants } = useTenants()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Resumen</h1>
          <p className="core-page-subtitle">Vista agregada de la plataforma Fivuza</p>
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
          No se pudo cargar el resumen.
        </p>
      )}

      {data && (
        <>
          <div className="hero-stats-grid">
            <div className="card hero-stat-card">
              <DollarSign className="hero-stat-icon" />
              <span className="hero-stat-label">MRR</span>
              <span className="hero-stat-value">{formatCurrency(data.mrr)}</span>
              <span className="hero-stat-caption">Ingreso mensual recurrente de la plataforma</span>
            </div>
            <div className="compact-stats-stack">
              <div className="card compact-stat-row">
                <Building2 />
                <span className="compact-stat-label">Tenants totales</span>
                <span className="compact-stat-value">
                  {Object.values(data.tenants_by_status).reduce((sum, n) => sum + n, 0)}
                </span>
              </div>
              <div className="card compact-stat-row">
                <AlertTriangle />
                <span className="compact-stat-label">Pagos pendientes</span>
                <span className="compact-stat-value">{data.pending_payments_count}</span>
              </div>
              <div className="card compact-stat-row">
                <Ban />
                <span className="compact-stat-label">Suspendidos</span>
                <span className="compact-stat-value">{data.tenants_by_status.suspended ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="summary-cards" style={{ marginTop: 20 }}>
            <div className="card" style={{ padding: 20 }}>
              <h2 className="summary-section-title">Tenants recientes</h2>
              {data.recent_tenants.length === 0 && (
                <p className="core-state-message">Sin registros recientes.</p>
              )}
              <ul className="summary-list">
                {data.recent_tenants.map((tenant) => (
                  <li key={tenant.id}>
                    <Link to={`/admin/tenants/${tenant.id}`}>{tenant.company_name}</Link>
                    <span className="core-state-message">{formatDate(tenant.created_on)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h2 className="summary-section-title">Recién suspendidos</h2>
              {data.recently_suspended.length === 0 && (
                <p className="core-state-message">Sin suspensiones recientes.</p>
              )}
              <ul className="summary-list">
                {data.recently_suspended.map((tenant) => (
                  <li key={tenant.id}>
                    <Link to={`/admin/tenants/${tenant.id}`}>{tenant.company_name}</Link>
                    <span className="core-state-message">{formatDate(tenant.suspended_at)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h2 className="summary-section-title">Recién cancelados</h2>
              {data.recently_canceled.length === 0 && (
                <p className="core-state-message">Sin cancelaciones recientes.</p>
              )}
              <ul className="summary-list">
                {data.recently_canceled.map((tenant) => (
                  <li key={tenant.id}>
                    <Link to={`/admin/tenants/${tenant.id}`}>{tenant.company_name}</Link>
                    <span className="core-state-message">
                      Retención hasta {formatDate(tenant.data_retention_until)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {tenants && <ConsumptionSection tenants={tenants} />}
        </>
      )}
    </div>
  )
}
