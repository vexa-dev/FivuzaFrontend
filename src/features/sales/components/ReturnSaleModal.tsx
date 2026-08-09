import { useState } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import { formatQuantity } from '../../../shared/utils/format'
import type { RefundType, Sale } from '../api'
import { useOpenCashSessions } from '../hooks/useCashSessions'
import { useCreateSaleReturn, useSaleReturns } from '../hooks/useSaleReturns'

interface ReturnSaleModalProps {
  sale: Sale
  onClose: () => void
  onReturned: () => void
}

/** Devolucion (Sprint 18): a diferencia de anular, asume que la venta fue
 * correcta -el cliente trae mercaderia de vuelta, quizas dias despues. Por
 * eso el reembolso en efectivo sale de la caja ABIERTA AHORA, no de la
 * sesion (probablemente ya cerrada) que cobro la venta original. */
export function ReturnSaleModal({ sale, onClose, onReturned }: ReturnSaleModalProps) {
  const { data: existingReturns } = useSaleReturns(sale.id)
  const { data: openSessions } = useOpenCashSessions()
  const createReturn = useCreateSaleReturn()

  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const [reason, setReason] = useState('')
  const [refundType, setRefundType] = useState<RefundType>('BALANCE')
  const [cashSessionId, setCashSessionId] = useState<number | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const alreadyReturned = (saleDetailId: number) =>
    (existingReturns ?? [])
      .flatMap((sr) => sr.details)
      .filter((d) => d.sale_detail === saleDetailId)
      .reduce((sum, d) => sum + Number(d.quantity_returned), 0)

  const availableToReturn = (saleDetailId: number, sold: string) =>
    Math.max(0, Number(sold) - alreadyReturned(saleDetailId))

  const handleConfirm = () => {
    setError(null)
    const items = sale.details
      .map((detail) => ({
        sale_detail_id: detail.id,
        quantity_returned: quantities[detail.id] ?? '',
      }))
      .filter((item) => Number(item.quantity_returned) > 0)

    if (items.length === 0) {
      setError('Indica al menos una cantidad a devolver.')
      return
    }
    if (refundType === 'CASH' && cashSessionId === undefined) {
      setError('Selecciona la caja abierta que hará el reembolso en efectivo.')
      return
    }

    createReturn.mutate(
      {
        sale_id: sale.id,
        reason,
        refund_type: refundType,
        cash_session_id: refundType === 'CASH' ? cashSessionId : undefined,
        items,
      },
      {
        onSuccess: onReturned,
        onError: (err: unknown) => {
          const body = err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
          setError(body?.error?.message ?? 'No se pudo registrar la devolución.')
        },
      },
    )
  }

  return (
    <Modal title={`Devolución sobre ${sale.invoice_number}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <table className="core-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Vendido</th>
              <th>Disponible</th>
              <th>Devolver</th>
            </tr>
          </thead>
          <tbody>
            {sale.details.map((detail) => {
              const available = availableToReturn(detail.id, detail.quantity)
              return (
                <tr key={detail.id}>
                  <td>
                    <div className="core-table-strong">{detail.product_name_snapshot}</div>
                    <div className="core-page-subtitle" style={{ margin: 0 }}>
                      {detail.sku_snapshot}
                    </div>
                  </td>
                  <td>{formatQuantity(detail.quantity)}</td>
                  <td>{formatQuantity(available)}</td>
                  <td>
                    <input
                      inputMode="decimal"
                      style={{ width: 70 }}
                      disabled={available <= 0}
                      value={quantities[detail.id] ?? ''}
                      onChange={(event) =>
                        setQuantities((prev) => ({ ...prev, [detail.id]: event.target.value }))
                      }
                      placeholder="0"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div>
          <label htmlFor="return-reason">Motivo</label>
          <textarea
            id="return-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
          />
        </div>

        <div>
          <label htmlFor="return-refund-type">Reembolso</label>
          <select
            id="return-refund-type"
            value={refundType}
            onChange={(event) => setRefundType(event.target.value as RefundType)}
          >
            <option value="BALANCE">Saldo a favor del cliente</option>
            <option value="CASH">Efectivo</option>
          </select>
        </div>

        {refundType === 'CASH' && (
          <div>
            <label htmlFor="return-cash-session">Caja que reembolsa</label>
            <select
              id="return-cash-session"
              value={cashSessionId ?? ''}
              onChange={(event) => setCashSessionId(Number(event.target.value) || undefined)}
            >
              <option value="">Selecciona una caja abierta...</option>
              {openSessions?.map((session) => (
                <option key={session.id} value={session.id}>
                  Sesión #{session.id}
                </option>
              ))}
            </select>
            {openSessions && openSessions.length === 0 && (
              <p className="core-page-subtitle" style={{ margin: '4px 0 0' }}>
                No hay ninguna caja abierta para hacer el reembolso en efectivo.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn btn-primary"
          disabled={createReturn.isPending}
          onClick={handleConfirm}
        >
          {createReturn.isPending ? 'Registrando...' : 'Registrar devolución'}
        </button>
      </div>
    </Modal>
  )
}
