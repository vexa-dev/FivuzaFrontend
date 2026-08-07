import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { SalePaymentMethod } from '../api'
import type { CartPayment, CartState } from '../cart/types'
import type { CartTotals } from '../cart/totals'

const PAYMENT_METHODS: [SalePaymentMethod, string][] = [
  ['CASH', 'Efectivo'],
  ['CARD', 'Tarjeta'],
  ['YAPE', 'Yape'],
  ['CREDIT_LEDGER', 'Crédito (fiado)'],
  ['BALANCE', 'Saldo a favor'],
]

interface CheckoutModalProps {
  cart: CartState
  totals: CartTotals
  error: string | null
  isSubmitting: boolean
  onAddPayment: (payment: CartPayment) => void
  onUpdatePaymentAmount: (index: number, amount: string) => void
  onUpdatePaymentMethod: (index: number, method: SalePaymentMethod) => void
  onRemovePayment: (index: number) => void
  onConfirm: () => void
  onClose: () => void
}

/** Pantalla de cobro dedicada (Sprint 17): reemplaza el PaymentsBuilder
 * inline que vivía suelto en el carrito. La suma exacta sigue siendo
 * responsabilidad de SaleService.create_sale (PAYMENT_MISMATCH si no
 * cuadra) -acá solo se anticipa esa regla para no dejar que el cajero
 * confirme un cobro que el backend va a rechazar. El "vuelto" es un cálculo
 * puramente local: cuánto efectivo entregó el cliente de más sobre lo que
 * esa fila de pago en efectivo cubre. */
export function CheckoutModal({
  cart,
  totals,
  error,
  isSubmitting,
  onAddPayment,
  onUpdatePaymentAmount,
  onUpdatePaymentMethod,
  onRemovePayment,
  onConfirm,
  onClose,
}: CheckoutModalProps) {
  const [tendered, setTendered] = useState<Record<number, string>>({})

  const remaining = totals.total - totals.paymentsTotal

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
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onAddPayment({ method: 'CASH', amount: remaining > 0 ? remaining.toFixed(2) : '' })}
            >
              <Plus size={14} strokeWidth={2} />
              Agregar pago
            </button>
          </div>

          {cart.payments.length === 0 && (
            <p className="core-page-subtitle" style={{ margin: 0 }}>
              Agrega al menos un pago para cobrar.
            </p>
          )}

          {cart.payments.map((payment, index) => {
            const receivedAmount = tendered[index] ?? ''
            const change = Math.max(0, Number(receivedAmount || 0) - Number(payment.amount || 0))
            return (
              <div key={index} className="card" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    value={payment.method}
                    onChange={(event) => onUpdatePaymentMethod(index, event.target.value as SalePaymentMethod)}
                    style={{ flex: 1 }}
                  >
                    {PAYMENT_METHODS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    inputMode="decimal"
                    value={payment.amount}
                    onChange={(event) => onUpdatePaymentAmount(index, event.target.value)}
                    placeholder="0.00"
                    style={{ width: 100 }}
                    aria-label="Monto del pago"
                  />
                  <button
                    type="button"
                    className="btn btn-danger-ghost btn-icon pos-remove-btn"
                    aria-label="Quitar pago"
                    onClick={() => onRemovePayment(index)}
                  >
                    <Trash2 />
                  </button>
                </div>

                {payment.method === 'CASH' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label htmlFor={`tendered-${index}`} style={{ margin: 0, fontSize: '0.8125rem', flex: 1 }}>
                      Efectivo recibido del cliente
                    </label>
                    <input
                      id={`tendered-${index}`}
                      inputMode="decimal"
                      value={receivedAmount}
                      onChange={(event) =>
                        setTendered((prev) => ({ ...prev, [index]: event.target.value }))
                      }
                      placeholder="0.00"
                      style={{ width: 100 }}
                    />
                  </div>
                )}
                {payment.method === 'CASH' && receivedAmount !== '' && (
                  <p
                    className="core-page-subtitle"
                    style={{ margin: 0, fontWeight: change > 0 ? 700 : 400 }}
                  >
                    Vuelto: S/ {change.toFixed(2)}
                  </p>
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
          disabled={isSubmitting || !totals.paymentsMatchTotal}
          onClick={onConfirm}
        >
          {isSubmitting ? 'Confirmando...' : `Confirmar cobro de S/ ${totals.total.toFixed(2)}`}
        </button>
      </div>
    </Modal>
  )
}
