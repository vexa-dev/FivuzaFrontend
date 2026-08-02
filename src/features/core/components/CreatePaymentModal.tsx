import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Subscription, SubscriptionPayment } from '../api'
import { useCreatePayment } from '../hooks/usePaymentsAdmin'

interface CreatePaymentModalProps {
  subscriptions: Subscription[]
  tenantName: (tenantId: number) => string
  onClose: () => void
}

export function CreatePaymentModal({
  subscriptions,
  tenantName,
  onClose,
}: CreatePaymentModalProps) {
  const [subscriptionId, setSubscriptionId] = useState(subscriptions[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] =
    useState<SubscriptionPayment['payment_method']>('TRANSFER')
  const [externalReference, setExternalReference] = useState('')
  const [status, setStatus] = useState<SubscriptionPayment['status']>('PENDING')
  const [error, setError] = useState<string | null>(null)

  const createPayment = useCreatePayment()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!subscriptionId || !amount) {
      setError('Suscripción y monto son requeridos.')
      return
    }

    createPayment
      .mutateAsync({
        subscription: Number(subscriptionId),
        amount,
        payment_method: paymentMethod,
        external_reference: externalReference || undefined,
        status,
      })
      .then(onClose)
      .catch(() => setError('No se pudo registrar el pago.'))
  }

  return (
    <Modal title="Registrar pago" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="payment-subscription">Suscripción</label>
          <select
            id="payment-subscription"
            value={subscriptionId}
            onChange={(event) => setSubscriptionId(Number(event.target.value))}
          >
            {subscriptions.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {tenantName(sub.tenant)} · {sub.billing_cycle}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="payment-amount">Monto</label>
          <input
            id="payment-amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="39.00"
          />
        </div>

        <div>
          <label htmlFor="payment-method">Método</label>
          <select
            id="payment-method"
            value={paymentMethod}
            onChange={(event) =>
              setPaymentMethod(event.target.value as SubscriptionPayment['payment_method'])
            }
          >
            <option value="TRANSFER">Transferencia</option>
            <option value="CARD">Tarjeta</option>
            <option value="YAPE">Yape</option>
            <option value="PLIN">Plin</option>
          </select>
        </div>

        <div>
          <label htmlFor="payment-reference">Referencia externa (opcional)</label>
          <input
            id="payment-reference"
            value={externalReference}
            onChange={(event) => setExternalReference(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="payment-status">Estado</label>
          <select
            id="payment-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as SubscriptionPayment['status'])}
          >
            <option value="PENDING">Pendiente</option>
            <option value="PAID">Pagado</option>
            <option value="FAILED">Fallido</option>
            <option value="REFUNDED">Reembolsado</option>
          </select>
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={createPayment.isPending}>
          {createPayment.isPending ? 'Guardando...' : 'Registrar pago'}
        </button>
      </form>
    </Modal>
  )
}
