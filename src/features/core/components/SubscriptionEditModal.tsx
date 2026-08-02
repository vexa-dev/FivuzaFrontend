import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Plan, Subscription } from '../api'
import { useUpdateSubscription } from '../hooks/useSubscriptionsAdmin'

interface SubscriptionEditModalProps {
  subscription: Subscription
  plans: Plan[]
  tenantName: string
  onClose: () => void
}

function toDatetimeLocal(value: string) {
  return new Date(value).toISOString().slice(0, 16)
}

export function SubscriptionEditModal({
  subscription,
  plans,
  tenantName,
  onClose,
}: SubscriptionEditModalProps) {
  const [planId, setPlanId] = useState(subscription.plan)
  const [billingCycle, setBillingCycle] = useState(subscription.billing_cycle)
  const [status, setStatus] = useState(subscription.status)
  const [expiresAt, setExpiresAt] = useState(toDatetimeLocal(subscription.expires_at))
  const [error, setError] = useState<string | null>(null)

  const updateSubscription = useUpdateSubscription()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    updateSubscription
      .mutateAsync({
        id: subscription.id,
        data: {
          plan: planId,
          billing_cycle: billingCycle,
          status,
          expires_at: new Date(expiresAt).toISOString(),
        },
      })
      .then(onClose)
      .catch(() => setError('No se pudo actualizar la suscripción.'))
  }

  return (
    <Modal title={`Editar suscripción · ${tenantName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="sub-plan">Plan</label>
          <select
            id="sub-plan"
            value={planId}
            onChange={(event) => setPlanId(Number(event.target.value))}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sub-billing-cycle">Ciclo de facturación</label>
          <select
            id="sub-billing-cycle"
            value={billingCycle}
            onChange={(event) =>
              setBillingCycle(event.target.value as Subscription['billing_cycle'])
            }
          >
            <option value="MONTHLY">Mensual</option>
            <option value="SEMIANNUAL">Semestral</option>
            <option value="ANNUAL">Anual</option>
          </select>
        </div>

        <div>
          <label htmlFor="sub-status">Estado</label>
          <select
            id="sub-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as Subscription['status'])}
          >
            <option value="active">Activa</option>
            <option value="past_due">Vencida (past_due)</option>
            <option value="canceled">Cancelada</option>
          </select>
        </div>

        <div>
          <label htmlFor="sub-expires-at">Vence</label>
          <input
            id="sub-expires-at"
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={updateSubscription.isPending}>
          {updateSubscription.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </Modal>
  )
}
