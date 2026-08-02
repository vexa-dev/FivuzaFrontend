import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTenant } from './hooks/useTenantLifecycle'
import {
  useConfirmPayment,
  useSubscriptionPayments,
  useTenantAuditLogs,
  useTenantSettings,
  useTenantSubscriptions,
  useUpdateTenantSettings,
} from './hooks/useTenantBilling'
import type { Tenant, TenantSettingsRecord } from './api'

type Tab = 'general' | 'suscripcion' | 'modulos' | 'actividad'

const TABS: [Tab, string][] = [
  ['general', 'Datos generales'],
  ['suscripcion', 'Suscripción y pagos'],
  ['modulos', 'Módulos'],
  ['actividad', 'Actividad'],
]

const STATUS_LABEL: Record<Tenant['status'], string> = {
  active: 'Activo',
  trial: 'Prueba',
  suspended: 'Suspendido',
  canceled: 'Cancelado',
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

const SETTINGS_TOGGLES: [keyof Omit<TenantSettingsRecord, 'id' | 'tenant' | 'updated_at'>, string][] = [
  ['purchases_enabled', 'Compras'],
  ['variants_enabled', 'Variantes de producto'],
  ['multi_warehouse_enabled', 'Multi-almacén'],
  ['hr_module_enabled', 'RRHH'],
  ['cash_module_enabled', 'Caja'],
]

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const tenantId = Number(id)
  const [tab, setTab] = useState<Tab>('general')

  const { data: tenant, isLoading } = useTenant(tenantId)

  if (isLoading || !tenant) {
    return (
      <div className="loading-row">
        <span className="spinner" />
        Cargando...
      </div>
    )
  }

  return (
    <div>
      <Link to="/admin/tenants" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>
        <ArrowLeft size={15} strokeWidth={2} />
        Volver a tenants
      </Link>

      <div className="page-header">
        <div>
          <h1 className="core-page-title">{tenant.company_name}</h1>
          <p className="core-page-subtitle">
            {tenant.schema_name} · {STATUS_LABEL[tenant.status]}
          </p>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`tab ${tab === value ? 'tab-active' : ''}`}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralTab tenant={tenant} />}
      {tab === 'suscripcion' && <SubscriptionTab tenantId={tenant.id} />}
      {tab === 'modulos' && <ModulesTab tenantId={tenant.id} />}
      {tab === 'actividad' && <ActivityTab tenantId={tenant.id} />}
    </div>
  )
}

function GeneralTab({ tenant }: { tenant: Tenant }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <dl className="detail-grid">
        <dt>Nombre</dt>
        <dd>{tenant.company_name}</dd>
        <dt>Schema</dt>
        <dd>{tenant.schema_name}</dd>
        <dt>RUC</dt>
        <dd>{tenant.ruc ?? '—'}</dd>
        <dt>Moneda</dt>
        <dd>{tenant.default_currency}</dd>
        <dt>Estado</dt>
        <dd>{STATUS_LABEL[tenant.status]}</dd>
        <dt>Aprovisionamiento</dt>
        <dd>{tenant.provisioning_status}</dd>
        <dt>Creado</dt>
        <dd>{formatDate(tenant.created_on)}</dd>
        {tenant.suspended_at && (
          <>
            <dt>Suspendido</dt>
            <dd>{formatDate(tenant.suspended_at)}</dd>
          </>
        )}
        {tenant.canceled_at && (
          <>
            <dt>Cancelado</dt>
            <dd>{formatDate(tenant.canceled_at)}</dd>
          </>
        )}
      </dl>
    </div>
  )
}

function SubscriptionTab({ tenantId }: { tenantId: number }) {
  const { data: subscriptions, isLoading } = useTenantSubscriptions(tenantId)
  const currentSubscription = subscriptions?.[0]
  const { data: payments, isLoading: loadingPayments } = useSubscriptionPayments(
    currentSubscription?.id,
  )
  const confirmPayment = useConfirmPayment()

  if (isLoading) {
    return (
      <div className="loading-row">
        <span className="spinner" />
        Cargando...
      </div>
    )
  }

  if (!currentSubscription) {
    return <p className="core-state-message">Este tenant no tiene una suscripción registrada.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 20 }}>
        <dl className="detail-grid">
          <dt>Ciclo</dt>
          <dd>{currentSubscription.billing_cycle}</dd>
          <dt>Estado</dt>
          <dd>{currentSubscription.status}</dd>
          <dt>Precio pagado</dt>
          <dd>
            {currentSubscription.currency} {currentSubscription.price_paid}
          </dd>
          <dt>Vigente desde</dt>
          <dd>{formatDate(currentSubscription.starts_at)}</dd>
          <dt>Vence</dt>
          <dd>{formatDate(currentSubscription.expires_at)}</dd>
        </dl>
      </div>

      <div className="card core-table-card">
        <div className="table-toolbar">
          <span className="summary-section-title" style={{ margin: 0 }}>
            Historial de pagos
          </span>
        </div>
        {loadingPayments && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}
        {payments && payments.length === 0 && (
          <p className="core-state-message">Todavía no hay pagos registrados.</p>
        )}
        {payments && payments.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Monto</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Confirmado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="core-table-strong">
                    {payment.currency} {payment.amount}
                  </td>
                  <td>{payment.payment_method}</td>
                  <td>
                    <span
                      className={`badge ${payment.status === 'PAID' ? 'badge-success' : payment.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}
                    >
                      <span className="dot" />
                      {payment.status}
                    </span>
                  </td>
                  <td>{formatDate(payment.paid_at)}</td>
                  <td>
                    {payment.status === 'PENDING' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={confirmPayment.isPending}
                        onClick={() => confirmPayment.mutate(payment.id)}
                      >
                        <CheckCircle2 size={14} strokeWidth={2} />
                        Confirmar pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function ModulesTab({ tenantId }: { tenantId: number }) {
  const { data: settingsList, isLoading } = useTenantSettings(tenantId)
  const updateSettings = useUpdateTenantSettings()
  const settings = settingsList?.[0]

  if (isLoading) {
    return (
      <div className="loading-row">
        <span className="spinner" />
        Cargando...
      </div>
    )
  }

  if (!settings) {
    return <p className="core-state-message">Este tenant no tiene configuración registrada.</p>
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {SETTINGS_TOGGLES.map(([field, label]) => (
          <label key={field} className="settings-toggle-row">
            <input
              type="checkbox"
              checked={settings[field]}
              onChange={(event) =>
                updateSettings.mutate({
                  id: settings.id,
                  data: { [field]: event.target.checked },
                })
              }
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function ActivityTab({ tenantId }: { tenantId: number }) {
  const { data, isLoading } = useTenantAuditLogs(tenantId)

  if (isLoading) {
    return (
      <div className="loading-row">
        <span className="spinner" />
        Cargando...
      </div>
    )
  }

  if (!data || data.results.length === 0) {
    return <p className="core-state-message">Sin actividad registrada para este tenant.</p>
  }

  return (
    <div className="card core-table-card">
      <table className="core-table">
        <thead>
          <tr>
            <th>Acción</th>
            <th>Staff</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {data.results.map((log) => (
            <tr key={log.id}>
              <td className="core-table-strong">{log.action}</td>
              <td>{log.platform_staff_email}</td>
              <td>{formatDate(log.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
