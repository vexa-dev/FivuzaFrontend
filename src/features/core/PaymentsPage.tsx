import { CheckCircle2, CreditCard, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../shared/components/EmptyState'
import type { SubscriptionPayment } from './api'
import { CreatePaymentModal } from './components/CreatePaymentModal'
import { useAuth } from './hooks/useAuth'
import { useConfirmPaymentGlobal, useAllPayments } from './hooks/usePaymentsAdmin'
import { useAllSubscriptions } from './hooks/useSubscriptionsAdmin'
import { useTenants } from './hooks/useTenants'

const STATUS_LABEL: Record<SubscriptionPayment['status'], string> = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  FAILED: 'Fallido',
  REFUNDED: 'Reembolsado',
}

const STATUS_BADGE: Record<SubscriptionPayment['status'], string> = {
  PAID: 'badge-success',
  PENDING: 'badge-warning',
  FAILED: 'badge-danger',
  REFUNDED: 'badge-neutral',
}

export function PaymentsPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole('BILLING')
  const [statusFilter, setStatusFilter] = useState<SubscriptionPayment['status'] | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)

  const { data: payments, isLoading } = useAllPayments(
    statusFilter === 'all' ? {} : { status: statusFilter },
  )
  const { data: subscriptions } = useAllSubscriptions()
  const { data: tenants } = useTenants()
  const confirmPayment = useConfirmPaymentGlobal()

  const tenantIdForSubscription = (subscriptionId: number) =>
    subscriptions?.find((s) => s.id === subscriptionId)?.tenant
  const tenantName = (tenantId: number | undefined) =>
    tenants?.find((t) => t.id === tenantId)?.company_name ?? '—'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Pagos de suscripción</h1>
          <p className="core-page-subtitle">Confirmaciones manuales de pago por transferencia</p>
        </div>
        {canManage && subscriptions && subscriptions.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} strokeWidth={2.5} />
            Registrar pago
          </button>
        )}
      </div>

      <div className="card core-table-card">
        <div className="table-toolbar">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as SubscriptionPayment['status'] | 'all')
            }
          >
            <option value="all">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="PAID">Pagado</option>
            <option value="FAILED">Fallido</option>
            <option value="REFUNDED">Reembolsado</option>
          </select>
        </div>

        {isLoading && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}
        {payments && payments.length === 0 && (
          <EmptyState icon={<CreditCard />} title="Sin pagos registrados" />
        )}
        {payments && payments.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Confirmado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const tenantId = tenantIdForSubscription(payment.subscription)
                return (
                  <tr key={payment.id}>
                    <td className="core-table-strong">
                      {tenantId ? (
                        <Link to={`/admin/tenants/${tenantId}`}>{tenantName(tenantId)}</Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {payment.currency} {Number(payment.amount).toFixed(2)}
                    </td>
                    <td>{payment.payment_method}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[payment.status]}`}>
                        <span className="dot" />
                        {STATUS_LABEL[payment.status]}
                      </span>
                    </td>
                    <td>
                      {payment.paid_at
                        ? new Date(payment.paid_at).toLocaleDateString('es-PE', {
                            dateStyle: 'medium',
                          })
                        : '—'}
                    </td>
                    <td>
                      {canManage && payment.status === 'PENDING' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={confirmPayment.isPending}
                          onClick={() => confirmPayment.mutate(payment.id)}
                        >
                          <CheckCircle2 size={14} strokeWidth={2} />
                          Confirmar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && subscriptions && (
        <CreatePaymentModal
          subscriptions={subscriptions}
          tenantName={(tenantId) => tenantName(tenantId)}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
