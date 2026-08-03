import { ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { OnboardingBadges } from './components/OnboardingBadges'
import { StartImpersonationModal } from './components/StartImpersonationModal'
import { useAuth } from './hooks/useAuth'
import { useTenant } from './hooks/useTenantLifecycle'
import {
  useConfirmPayment,
  useSubscriptionPayments,
  useTenantAuditLogs,
  useTenantSettings,
  useTenantSubscriptions,
  useUpdateTenantSettings,
} from './hooks/useTenantBilling'
import {
  useRemoveFeatureOverride,
  useSetFeatureOverride,
  useTenantFeatureOverrides,
} from './hooks/useFeatureOverrides'
import {
  useCreateSubscriptionDiscount,
  useCreateTenantNote,
  useRemoveSubscriptionDiscount,
  useSubscriptionDiscounts,
  useTenantHealth,
  useTenantNotes,
} from './hooks/useTenantExtras'
import { PLAN_FEATURE_CODES, type Tenant, type TenantSettingsRecord } from './api'

type Tab =
  | 'general'
  | 'suscripcion'
  | 'modulos'
  | 'caracteristicas'
  | 'notas'
  | 'salud'
  | 'actividad'

const TABS: [Tab, string][] = [
  ['general', 'Datos generales'],
  ['suscripcion', 'Suscripción y pagos'],
  ['modulos', 'Módulos'],
  ['caracteristicas', 'Características especiales'],
  ['notas', 'Notas internas'],
  ['salud', 'Salud técnica'],
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
  const [showImpersonationModal, setShowImpersonationModal] = useState(false)
  const { hasRole } = useAuth()

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
        {hasRole('SUPER_ADMIN', 'SUPPORT') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowImpersonationModal(true)}
          >
            <ShieldAlert size={15} strokeWidth={2} />
            Ingresar como soporte
          </button>
        )}
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
      {tab === 'caracteristicas' && <FeatureOverridesTab tenantId={tenant.id} />}
      {tab === 'notas' && <NotesTab tenantId={tenant.id} />}
      {tab === 'salud' && <HealthTab tenantId={tenant.id} />}
      {tab === 'actividad' && <ActivityTab tenantId={tenant.id} />}

      {showImpersonationModal && (
        <StartImpersonationModal
          tenant={tenant}
          onClose={() => setShowImpersonationModal(false)}
        />
      )}
    </div>
  )
}

function GeneralTab({ tenant }: { tenant: Tenant }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 20 }}>
        <span className="summary-section-title" style={{ display: 'block', marginBottom: 10 }}>
          Onboarding
        </span>
        <OnboardingBadges tenantId={tenant.id} />
      </div>
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

      <DiscountSection subscriptionId={currentSubscription.id} />
    </div>
  )
}

function DiscountSection({ subscriptionId }: { subscriptionId: number }) {
  const { hasRole } = useAuth()
  const { data: discounts, isLoading } = useSubscriptionDiscounts(subscriptionId)
  const createDiscount = useCreateSubscriptionDiscount()
  const removeDiscount = useRemoveSubscriptionDiscount(subscriptionId)
  const [discountType, setDiscountType] = useState<'discount_percent' | 'override_price'>(
    'discount_percent',
  )
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!hasRole('SUPER_ADMIN', 'BILLING')) {
    return null
  }

  const activeDiscount = discounts?.[0]

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!value.trim() || !reason.trim()) {
      setError('El valor y el motivo son requeridos.')
      return
    }
    createDiscount
      .mutateAsync({
        subscription_id: subscriptionId,
        [discountType]: value,
        reason,
      })
      .then(() => {
        setValue('')
        setReason('')
      })
      .catch(() => setError('No se pudo aplicar el descuento.'))
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <span className="summary-section-title" style={{ display: 'block', marginBottom: 12 }}>
        Descuento de suscripción
      </span>

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}

      {activeDiscount ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {activeDiscount.discount_percent
                ? `${activeDiscount.discount_percent}% de descuento`
                : `Precio fijo: ${activeDiscount.override_price}`}
            </p>
            <p className="core-state-message" style={{ margin: '4px 0 0' }}>
              {activeDiscount.reason}
              {activeDiscount.expires_at && ` · vence ${formatDate(activeDiscount.expires_at)}`}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-danger-ghost btn-sm"
            disabled={removeDiscount.isPending}
            onClick={() => removeDiscount.mutate(activeDiscount.id)}
          >
            Quitar descuento
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <select
              value={discountType}
              onChange={(event) =>
                setDiscountType(event.target.value as 'discount_percent' | 'override_price')
              }
            >
              <option value="discount_percent">% de descuento</option>
              <option value="override_price">Precio fijo</option>
            </select>
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={discountType === 'discount_percent' ? '20' : '50.00'}
            />
          </div>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Motivo (ej. negociación por ser tenant piloto)"
            rows={2}
          />
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={createDiscount.isPending}
            style={{ alignSelf: 'flex-start' }}
          >
            {createDiscount.isPending ? 'Aplicando...' : 'Aplicar descuento'}
          </button>
        </form>
      )}
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

function FeatureOverridesTab({ tenantId }: { tenantId: number }) {
  const { data: overrides, isLoading } = useTenantFeatureOverrides(tenantId)
  const setOverride = useSetFeatureOverride(tenantId)
  const removeOverride = useRemoveFeatureOverride(tenantId)

  if (isLoading) {
    return (
      <div className="loading-row">
        <span className="spinner" />
        Cargando...
      </div>
    )
  }

  const overrideByCode = new Map((overrides ?? []).map((o) => [o.feature_code, o]))

  return (
    <div className="card" style={{ padding: 20 }}>
      <p className="core-state-message" style={{ marginBottom: 14 }}>
        Activa o desactiva una característica para ESTE tenant, sin cambiarle de plan contratado.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PLAN_FEATURE_CODES.map((code) => {
          const override = overrideByCode.get(code)
          return (
            <div
              key={code}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <label className="settings-toggle-row">
                <input
                  type="checkbox"
                  checked={override?.is_enabled ?? false}
                  onChange={(event) =>
                    setOverride.mutate({ featureCode: code, isEnabled: event.target.checked })
                  }
                />
                <span>{code}</span>
              </label>
              {override ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-warning">
                    <span className="dot" />
                    Override individual
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={removeOverride.isPending}
                    onClick={() => removeOverride.mutate(code)}
                  >
                    Volver al plan
                  </button>
                </div>
              ) : (
                <span className="badge badge-neutral">
                  <span className="dot" />
                  Heredado del plan
                </span>
              )}
            </div>
          )
        })}
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

function NotesTab({ tenantId }: { tenantId: number }) {
  const { data: notes, isLoading } = useTenantNotes(tenantId)
  const createNote = useCreateTenantNote(tenantId)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!text.trim()) {
      setError('La nota no puede estar vacía.')
      return
    }
    createNote.mutateAsync(text).then(() => setText('')).catch(() => setError('No se pudo guardar la nota.'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 20 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Agregar una nota interna sobre este tenant..."
            rows={3}
          />
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={createNote.isPending}
            style={{ alignSelf: 'flex-start' }}
          >
            {createNote.isPending ? 'Guardando...' : 'Agregar nota'}
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {notes && notes.length === 0 && (
        <p className="core-state-message">Todavía no hay notas internas para este tenant.</p>
      )}
      {notes && notes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map((note) => (
            <div key={note.id} className="card" style={{ padding: 16 }}>
              <p style={{ margin: '0 0 6px', whiteSpace: 'pre-wrap' }}>{note.text}</p>
              <p className="core-state-message" style={{ margin: 0 }}>
                {note.platform_staff.full_name} · {formatDate(note.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HealthTab({ tenantId }: { tenantId: number }) {
  const { data, isLoading } = useTenantHealth(tenantId)

  if (isLoading) {
    return (
      <div className="loading-row">
        <span className="spinner" />
        Cargando...
      </div>
    )
  }

  if (!data) {
    return <p className="core-state-message">No se pudo cargar la salud técnica de este tenant.</p>
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <dl className="detail-grid">
        <dt>Errores recientes (24h)</dt>
        <dd>
          <span
            className={`badge ${data.recent_errors_count > 0 ? 'badge-danger' : 'badge-success'}`}
          >
            <span className="dot" />
            {data.recent_errors_count}
          </span>
        </dd>
        <dt>Último error</dt>
        <dd>{formatDate(data.last_error_at)}</dd>
        <dt>Último login</dt>
        <dd>{formatDate(data.last_login_at)}</dd>
        <dt>Última venta</dt>
        <dd>{formatDate(data.last_sale_at)}</dd>
      </dl>
    </div>
  )
}
