import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { SalePaymentInput, SalePaymentMethod } from '../api'
import { useCashRegisters, useOpenCashSessions } from '../hooks/useCashSessions'

const PAYMENT_METHODS: [SalePaymentMethod, string][] = [
  ['CASH', 'Efectivo'],
  ['CARD', 'Tarjeta'],
  ['YAPE', 'Yape'],
  ['CREDIT_LEDGER', 'Crédito (fiado)'],
  ['BALANCE', 'Saldo a favor'],
]

interface ConvertToSaleModalProps {
  title: string
  total: string
  isSubmitting: boolean
  error: string | null
  onConfirm: (cashSessionId: number, payments: SalePaymentInput[]) => void
  onClose: () => void
}

/** Formulario minimo de cobro para convertir un apartado o una cotizacion
 * en una venta real (Sprint 28) -a diferencia de CheckoutModal (acoplado al
 * carrito del POS), este solo necesita sesion de caja + pagos, porque las
 * lineas y precios ya vienen resueltos por ReservationService/QuoteService.
 * SaleService.create_sale() sigue siendo quien valida que los pagos cuadren
 * exacto (PAYMENT_MISMATCH), esto es solo la UI para armarlos. */
export function ConvertToSaleModal({
  title,
  total,
  isSubmitting,
  error,
  onConfirm,
  onClose,
}: ConvertToSaleModalProps) {
  const { data: openSessions } = useOpenCashSessions()
  const { data: registers } = useCashRegisters()
  const [cashSessionId, setCashSessionId] = useState<number | ''>(openSessions?.[0]?.id ?? '')
  const [payments, setPayments] = useState<SalePaymentInput[]>([{ method: 'CASH', amount: total }])

  const registerName = (id: number) => registers?.find((r) => r.id === id)?.name ?? `Caja #${id}`
  const paymentsTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const handleConfirm = () => {
    if (!cashSessionId) return
    onConfirm(cashSessionId, payments)
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="detail-grid">
          <dt>Total a cobrar</dt>
          <dd style={{ fontWeight: 700, fontSize: '1.125rem' }}>S/ {total}</dd>
        </div>

        {(!openSessions || openSessions.length === 0) && (
          <p className="login-error" role="alert">
            No hay una sesión de caja abierta.
          </p>
        )}

        {openSessions && openSessions.length > 0 && (
          <div>
            <label htmlFor="convert-cash-session">Caja</label>
            <select
              id="convert-cash-session"
              value={cashSessionId}
              onChange={(event) => setCashSessionId(Number(event.target.value) || '')}
            >
              {openSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {registerName(session.cash_register)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ margin: 0 }}>Pagos</label>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPayments((prev) => [...prev, { method: 'CASH', amount: '' }])}
            >
              <Plus size={14} strokeWidth={2} />
              Agregar pago
            </button>
          </div>

          {payments.map((payment, index) => (
            <div key={index} style={{ display: 'flex', gap: 6 }}>
              <select
                value={payment.method}
                onChange={(event) =>
                  setPayments((prev) =>
                    prev.map((p, i) =>
                      i === index ? { ...p, method: event.target.value as SalePaymentMethod } : p,
                    ),
                  )
                }
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
                onChange={(event) =>
                  setPayments((prev) =>
                    prev.map((p, i) => (i === index ? { ...p, amount: event.target.value } : p)),
                  )
                }
                placeholder="0.00"
                style={{ width: 100 }}
                aria-label="Monto del pago"
              />
              <button
                type="button"
                className="btn btn-danger-ghost btn-icon"
                aria-label="Quitar pago"
                onClick={() => setPayments((prev) => prev.filter((_, i) => i !== index))}
              >
                <Trash2 />
              </button>
            </div>
          ))}

          <p
            className={`core-page-subtitle ${paymentsTotal.toFixed(2) === Number(total).toFixed(2) ? '' : 'login-error'}`}
            style={{ margin: 0 }}
          >
            Pagado: S/ {paymentsTotal.toFixed(2)} de S/ {total}
          </p>
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn btn-primary"
          disabled={isSubmitting || !cashSessionId || payments.length === 0}
          onClick={handleConfirm}
        >
          {isSubmitting ? 'Confirmando...' : 'Confirmar cobro'}
        </button>
      </div>
    </Modal>
  )
}
