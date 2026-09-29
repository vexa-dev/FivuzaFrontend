import { Plus, Trash2, TriangleAlert } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { formatCurrency } from '../../../shared/utils/format'
import type { Customer, SalePaymentMethod } from '../api'
import type { CartPayment, CartState } from '../cart/types'
import type { CartTotals } from '../cart/totals'
import { rebalancePayments } from '../cart/totals'
import { paymentMethodsFor } from '../cart/paymentMethods'
import { toTwoDecimals } from '../../../shared/utils/decimals'

const CASH_QUICK_AMOUNTS = [20, 50, 100]

interface CheckoutModalProps {
  cart: CartState
  totals: CartTotals
  customer: Customer | undefined
  error: string | null
  isSubmitting: boolean
  onAddPayment: (payment: CartPayment) => void
  onUpdatePaymentAmount: (index: number, amount: string) => void
  onUpdatePaymentMethod: (index: number, method: SalePaymentMethod) => void
  onUpdatePaymentField: (
    index: number,
    field: 'operation_number' | 'tendered_amount' | 'change_amount',
    value: string,
  ) => void
  onSetPayments: (payments: CartPayment[]) => void
  onRemovePayment: (index: number) => void
  onConfirm: () => void
  onClose: () => void
}

/** Pantalla de cobro dedicada (Sprint 17, rediseñada en el Bloque D.3): la
 * suma exacta sigue siendo responsabilidad de SaleService.create_sale
 * (PAYMENT_MISMATCH si no cuadra) -acá solo se anticipa esa regla para no
 * dejar que el cajero confirme un cobro que el backend va a rechazar. El
 * efectivo recibido y el vuelto SÍ viajan al backend (SalePayment.
 * tendered_amount/change_amount): se persisten para el ticket, no son solo
 * un cálculo de pantalla. */
export function CheckoutModal({
  cart,
  totals,
  customer,
  error,
  isSubmitting,
  onAddPayment,
  onUpdatePaymentAmount,
  onUpdatePaymentMethod,
  onUpdatePaymentField,
  onSetPayments,
  onRemovePayment,
  onConfirm,
  onClose,
}: CheckoutModalProps) {
  const availableMethods = paymentMethodsFor(Boolean(customer?.is_walk_in))
  const remaining = totals.total - totals.paymentsTotal

  function handleSplit() {
    onAddPayment({ method: 'CASH', amount: remaining > 0 ? remaining.toFixed(2) : '' })
  }

  function handleAmountChange(index: number, amount: string) {
    onUpdatePaymentAmount(index, amount)
    if (cart.payments.length === 2) {
      const rebalanced = rebalancePayments(
        cart.payments.map((p, i) => (i === index ? { ...p, amount } : p)),
        totals.total,
        index,
      )
      onSetPayments(rebalanced)
    }
  }

  const operationNumbersMissing = cart.payments.some(
    (payment) =>
      (payment.method === 'CARD' || payment.method === 'YAPE') &&
      !payment.operation_number?.trim(),
  )

  return (
    <Modal title="Cobrar" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="detail-grid">
          <dt>Total a cobrar</dt>
          <dd style={{ fontWeight: 700, fontSize: '1.25rem' }}>S/ {totals.total.toFixed(2)}</dd>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ margin: 0 }}>Pagos</label>
            {cart.payments.length === 1 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleSplit}>
                <Plus size={14} strokeWidth={2} />
                Dividir pago
              </button>
            )}
          </div>

          {cart.payments.length === 0 && (
            <p className="core-page-subtitle" style={{ margin: 0 }}>
              Agrega al menos un pago para cobrar.
            </p>
          )}

          {cart.payments.map((payment, index) => {
            const change = Math.max(
              0,
              Number(payment.tendered_amount || 0) - Number(payment.amount || 0),
            )
            return (
              <div key={index} className="card" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {availableMethods.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      className={`btn btn-sm ${payment.method === method.value ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => onUpdatePaymentMethod(index, method.value)}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    inputMode="decimal"
                    value={payment.amount}
                    onChange={(event) => handleAmountChange(index, toTwoDecimals(event.target.value))}
                    placeholder="0.00"
                    style={{ width: 100 }}
                    aria-label="Monto del pago"
                  />
                  {cart.payments.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger-ghost btn-icon pos-remove-btn"
                      aria-label="Quitar pago"
                      onClick={() => onRemovePayment(index)}
                    >
                      <Trash2 />
                    </button>
                  )}
                </div>

                {payment.method === 'CASH' && (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {CASH_QUICK_AMOUNTS.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() =>
                            onUpdatePaymentField(index, 'tendered_amount', amount.toFixed(2))
                          }
                        >
                          S/ {amount}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          onUpdatePaymentField(index, 'tendered_amount', payment.amount || '0.00')
                        }
                      >
                        Exacto
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label htmlFor={`tendered-${index}`} style={{ margin: 0, fontSize: '0.8125rem', flex: 1 }}>
                        Efectivo recibido del cliente
                      </label>
                      <input
                        id={`tendered-${index}`}
                        inputMode="decimal"
                        value={payment.tendered_amount ?? ''}
                        onChange={(event) => {
                          const value = toTwoDecimals(event.target.value)
                          onUpdatePaymentField(index, 'tendered_amount', value)
                          const changeValue = Math.max(
                            0,
                            Number(value || 0) - Number(payment.amount || 0),
                          )
                          onUpdatePaymentField(index, 'change_amount', changeValue.toFixed(2))
                        }}
                        placeholder="0.00"
                        style={{ width: 100 }}
                      />
                    </div>
                    {payment.tendered_amount && (
                      <p
                        className="core-page-subtitle"
                        style={{ margin: 0, fontWeight: change > 0 ? 700 : 400 }}
                      >
                        Vuelto: S/ {change.toFixed(2)}
                      </p>
                    )}
                  </>
                )}

                {(payment.method === 'CARD' || payment.method === 'YAPE') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label htmlFor={`operation-${index}`} style={{ margin: 0, fontSize: '0.8125rem', flex: 1 }}>
                      Número de operación
                    </label>
                    <input
                      id={`operation-${index}`}
                      value={payment.operation_number ?? ''}
                      onChange={(event) =>
                        onUpdatePaymentField(index, 'operation_number', event.target.value)
                      }
                      placeholder="Requerido"
                      style={{ width: 140 }}
                    />
                  </div>
                )}

                {payment.method === 'CREDIT_LEDGER' && (
                  <CreditWarning customer={customer} paymentAmount={payment.amount} />
                )}
                {payment.method === 'BALANCE' && (
                  <BalanceWarning customer={customer} paymentAmount={payment.amount} />
                )}
              </div>
            )
          })}

          {cart.payments.length > 0 && (
            <p
              className={`core-page-subtitle ${totals.paymentsMatchTotal ? '' : 'login-error'}`}
              style={{ margin: 0 }}
            >
              Pagado: S/ {totals.paymentsTotal.toFixed(2)} de S/ {totals.total.toFixed(2)}
            </p>
          )}
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn btn-primary pos-checkout-btn"
          disabled={isSubmitting || !totals.paymentsMatchTotal || operationNumbersMissing}
          onClick={onConfirm}
        >
          {isSubmitting ? 'Confirmando...' : `Confirmar cobro de S/ ${totals.total.toFixed(2)}`}
        </button>
      </div>
    </Modal>
  )
}

/** Advertencia visible (Sprint 19): el limite real lo valida el backend
 * (CREDIT_LIMIT_EXCEEDED) -esto es solo un heads-up para el cajero antes de
 * confirmar, mismo criterio que paymentsMatchTotal (vista previa, no fuente
 * de verdad). */
function CreditWarning({
  customer,
  paymentAmount,
}: {
  customer: Customer | undefined
  paymentAmount: string
}) {
  if (!customer) {
    return (
      <p className="core-page-subtitle" style={{ margin: 0 }}>
        Selecciona un cliente para vender a crédito.
      </p>
    )
  }

  const currentDebt = Number(customer.current_debt)
  const projectedDebt = currentDebt + Number(paymentAmount || 0)
  const creditLimit = customer.credit_limit === null ? null : Number(customer.credit_limit)
  const exceedsLimit = creditLimit !== null && projectedDebt > creditLimit

  return (
    <p
      className="core-page-subtitle"
      style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: exceedsLimit ? 'var(--danger)' : undefined }}
    >
      {exceedsLimit && <TriangleAlert size={14} strokeWidth={2} />}
      Deuda actual: {formatCurrency(customer.current_debt)}
      {creditLimit !== null && ` · Límite: ${formatCurrency(creditLimit)}`}
      {exceedsLimit && ' · Supera el límite de crédito'}
    </p>
  )
}

function BalanceWarning({
  customer,
  paymentAmount,
}: {
  customer: Customer | undefined
  paymentAmount: string
}) {
  if (!customer) return null

  const currentBalance = Number(customer.current_balance)
  const insufficient = Number(paymentAmount || 0) > currentBalance

  return (
    <p
      className="core-page-subtitle"
      style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: insufficient ? 'var(--danger)' : undefined }}
    >
      {insufficient && <TriangleAlert size={14} strokeWidth={2} />}
      Saldo a favor disponible: {formatCurrency(customer.current_balance)}
      {insufficient && ' · Insuficiente'}
    </p>
  )
}
