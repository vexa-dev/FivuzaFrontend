import { Ban, Dumbbell, PauseCircle, PlayCircle, RefreshCcw, UserSearch } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatCurrency } from '../../../shared/utils/format'
import { useCustomers } from '../../sales/hooks/useCustomers'
import type { Membership } from '../api'
import { useMembershipPlans } from '../hooks/useMembershipPlans'
import {
  useCancelMembership,
  useCreateMembership,
  useFreezeMembership,
  useMemberships,
  useRenewMembership,
  useUnfreezeMembership,
} from '../hooks/useMemberships'

const STATUS_LABELS: Record<Membership['status'], string> = {
  ACTIVE: 'Activa',
  FROZEN: 'Congelada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
}

const STATUS_BADGE: Record<Membership['status'], string> = {
  ACTIVE: 'badge-success',
  FROZEN: 'badge-warning',
  EXPIRED: 'badge-danger',
  CANCELLED: 'badge-danger',
}

export function MembersTab() {
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerId, setCustomerId] = useState<number | ''>('')
  const { data: customers } = useCustomers(customerSearch)
  const selectedCustomer = customers?.find((c) => c.id === customerId)
  const { data: plans } = useMembershipPlans()

  const { data: memberships, isLoading } = useMemberships(
    customerId ? { customer: customerId } : undefined,
  )
  const createMembership = useCreateMembership()
  const [showNewMembership, setShowNewMembership] = useState(false)
  const [planId, setPlanId] = useState<number | ''>('')
  const [startDate, setStartDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const planName = (id: number) => plans?.find((p) => p.id === id)?.name ?? `#${id}`

  const handleCreateMembership = () => {
    setError(null)
    if (!customerId || !planId || !startDate) {
      setError('Selecciona socio, plan y fecha de inicio.')
      return
    }
    createMembership
      .mutateAsync({ customer_id: customerId, plan_id: planId, start_date: startDate })
      .then(() => {
        setShowNewMembership(false)
        setPlanId('')
        setStartDate('')
      })
      .catch(() => setError('No se pudo crear la membresía.'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ maxWidth: 480 }}>
        <label htmlFor="member-search">Buscar socio</label>
        <input
          id="member-search"
          value={selectedCustomer ? selectedCustomer.name : customerSearch}
          onChange={(event) => {
            setCustomerSearch(event.target.value)
            setCustomerId('')
          }}
          placeholder="Buscar por documento o nombre..."
          autoComplete="off"
        />
        {!selectedCustomer && customerSearch.trim() && customers && customers.length > 0 && (
          <div className="card" style={{ marginTop: 4, maxHeight: 160, overflowY: 'auto' }}>
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0 }}
                onClick={() => {
                  setCustomerId(customer.id)
                  setCustomerSearch('')
                }}
              >
                {customer.name} · {customer.document_number}
              </button>
            ))}
          </div>
        )}
      </div>

      {!customerId && (
        <EmptyState icon={<UserSearch />} title="Busca un socio para ver su ficha de membresía" />
      )}

      {customerId && (
        <div className="card core-table-card">
          <div className="table-toolbar" style={{ justifyContent: 'space-between' }}>
            <span className="core-page-subtitle" style={{ margin: 0, fontWeight: 600 }}>
              {selectedCustomer?.name}
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowNewMembership((v) => !v)}
            >
              Nueva membresía
            </button>
          </div>

          {showNewMembership && (
            <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                value={planId}
                onChange={(event) => setPlanId(Number(event.target.value) || '')}
                style={{ flex: 1, minWidth: 180 }}
              >
                <option value="">Selecciona un plan</option>
                {plans?.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({formatCurrency(plan.price)})
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                style={{ flex: 1, minWidth: 160 }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateMembership}
                disabled={createMembership.isPending}
              >
                {createMembership.isPending ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          )}
          {error && (
            <p className="login-error" role="alert" style={{ padding: '0 16px 12px' }}>
              {error}
            </p>
          )}

          {isLoading && (
            <div className="loading-row">
              <span className="spinner" />
              Cargando...
            </div>
          )}
          {memberships && memberships.length === 0 && (
            <EmptyState icon={<Dumbbell />} title="Este socio todavía no tiene membresías" />
          )}
          {memberships && memberships.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px 16px' }}>
              {memberships.map((membership) => (
                <MembershipRow
                  key={membership.id}
                  membership={membership}
                  planName={planName(membership.plan)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MembershipRow({
  membership,
  planName,
}: {
  membership: Membership
  planName: string
}) {
  const renewMembership = useRenewMembership()
  const freezeMembership = useFreezeMembership()
  const unfreezeMembership = useUnfreezeMembership()
  const cancelMembership = useCancelMembership()
  const [showRenew, setShowRenew] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'YAPE'>('CASH')

  return (
    <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="core-table-strong">{planName}</div>
          <div className="core-page-subtitle" style={{ margin: 0 }}>
            {membership.start_date} — {membership.end_date}
            {membership.status === 'FROZEN' && membership.frozen_since && (
              <> · congelada desde {membership.frozen_since}</>
            )}
          </div>
        </div>
        <span className={`badge ${STATUS_BADGE[membership.status]}`}>
          <span className="dot" />
          {STATUS_LABELS[membership.status]}
        </span>
      </div>

      <div className="row-actions">
        {(membership.status === 'ACTIVE' || membership.status === 'EXPIRED') && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowRenew((v) => !v)}
          >
            <RefreshCcw size={14} strokeWidth={2} />
            Renovar
          </button>
        )}
        {membership.status === 'ACTIVE' && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => freezeMembership.mutate(membership.id)}
          >
            <PauseCircle size={14} strokeWidth={2} />
            Congelar
          </button>
        )}
        {membership.status === 'FROZEN' && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => unfreezeMembership.mutate(membership.id)}
          >
            <PlayCircle size={14} strokeWidth={2} />
            Descongelar
          </button>
        )}
        {membership.status !== 'CANCELLED' && (
          <button
            type="button"
            className="btn btn-danger-ghost btn-sm"
            onClick={() => {
              if (confirm('¿Cancelar esta membresía?')) {
                cancelMembership.mutate(membership.id)
              }
            }}
          >
            <Ban size={14} strokeWidth={2} />
            Cancelar
          </button>
        )}
      </div>

      {showRenew && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value as 'CASH' | 'CARD' | 'YAPE')}
          >
            <option value="CASH">Efectivo</option>
            <option value="CARD">Tarjeta</option>
            <option value="YAPE">Yape</option>
          </select>
          <input
            value={paymentAmount}
            onChange={(event) => setPaymentAmount(event.target.value)}
            placeholder="Monto pagado (opcional)"
            inputMode="decimal"
            style={{ width: 180 }}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={renewMembership.isPending}
            onClick={() => {
              renewMembership
                .mutateAsync({
                  id: membership.id,
                  data: paymentAmount
                    ? { payment_amount: paymentAmount, payment_method: paymentMethod }
                    : undefined,
                })
                .then(() => {
                  setShowRenew(false)
                  setPaymentAmount('')
                })
            }}
          >
            {renewMembership.isPending ? 'Renovando...' : 'Confirmar renovación'}
          </button>
        </div>
      )}

      {membership.payments.length > 0 && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Método</th>
            </tr>
          </thead>
          <tbody>
            {membership.payments.map((payment) => (
              <tr key={payment.id}>
                <td>{new Date(payment.created_at).toLocaleDateString('es-PE')}</td>
                <td>{formatCurrency(payment.amount)}</td>
                <td>{payment.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
