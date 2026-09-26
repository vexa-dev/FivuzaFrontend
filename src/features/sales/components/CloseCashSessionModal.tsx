import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import { formatCurrency } from '../../../shared/utils/format'
import type { CashMovement, CashSession } from '../api'
import { useCloseCashSession, useSubmitCashSessionCount } from '../hooks/useCashSessions'
import { PaymentTotalsGrid } from './PaymentTotalsGrid'
import { toTwoDecimals } from '../../../shared/utils/decimals'

interface CloseCashSessionModalProps {
  session: CashSession
  movements: CashMovement[]
  /** Bloque A.4: totales por medio de pago del turno. Llegan del detalle de
   * la sesión; si aún no cargaron, el modal simplemente no los muestra. */
  paymentTotals?: Record<string, string>
  onClose: () => void
}

function sum(movements: CashMovement[], type: 'IN' | 'OUT') {
  return movements
    .filter((m) => m.type === type)
    .reduce((total, m) => total + Number(m.amount), 0)
}

export function CloseCashSessionModal({
  session,
  movements,
  paymentTotals,
  onClose,
}: CloseCashSessionModalProps) {
  const closeSession = useCloseCashSession()
  const submitCount = useSubmitCashSessionCount()
  const pendingApproval = session.status === 'PENDING_APPROVAL'
  const [countedAmount, setCountedAmount] = useState(
    pendingApproval ? (session.counted_closing_amount ?? '') : '',
  )
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CashSession | null>(null)

  const movementsIn = sum(movements, 'IN')
  const movementsOut = sum(movements, 'OUT')
  // Bloque A.3 (arqueo a ciegas): el backend solo manda el esperado a quien
  // controla la caja. Si no viene, quien está operando es el cajero: cuenta
  // sin referencia y entrega la caja, no la cierra. No se estima nada en el
  // navegador -esa estimación sería la misma pista que el control quita.
  const expected = session.expected_amount_so_far
  const blind = expected == null
  const cashSales = blind
    ? 0
    : Number(expected) - (Number(session.opening_amount) + movementsIn - movementsOut)
  const pending = closeSession.isPending || submitCount.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!countedAmount.trim()) {
      setError('Ingresa el monto contado.')
      return
    }
    const action = blind
      ? submitCount.mutateAsync({
          sessionId: session.id,
          countedClosingAmount: countedAmount,
          notes,
        })
      : closeSession.mutateAsync({
          sessionId: session.id,
          countedClosingAmount: countedAmount,
          notes,
        })
    action.then(setResult).catch((err: unknown) => {
      const body = err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
      setError(
        body?.error?.message ??
          (blind ? 'No se pudo entregar la caja.' : 'No se pudo cerrar la caja.'),
      )
    })
  }

  if (result) {
    if (result.status === 'PENDING_APPROVAL') {
      return (
        <Modal title="Caja entregada" onClose={onClose}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <dl className="detail-grid">
              <dt>Contado</dt>
              <dd>{result.counted_closing_amount}</dd>
            </dl>
            <p className="core-state-message" style={{ margin: 0 }}>
              Tu caja quedó entregada con lo que contaste y ya no admite ventas. Un supervisor
              revisará el arqueo y confirmará el cierre.
            </p>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Listo
            </button>
          </div>
        </Modal>
      )
    }

    const difference = result.difference == null ? null : Number(result.difference)
    return (
      <Modal title="Caja cerrada" onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <dl className="detail-grid">
            {result.expected_closing_amount != null && (
              <>
                <dt>Esperado</dt>
                <dd>{result.expected_closing_amount}</dd>
              </>
            )}
            <dt>Contado</dt>
            <dd>{result.counted_closing_amount}</dd>
            {difference != null && (
              <>
                <dt>Diferencia</dt>
                <dd>
                  <span
                    className={`badge ${difference === 0 ? 'badge-success' : difference > 0 ? 'badge-warning' : 'badge-danger'}`}
                    style={{ fontSize: '1rem' }}
                  >
                    <span className="dot" />
                    {difference > 0 ? '+' : ''}
                    {result.difference}
                  </span>
                </dd>
              </>
            )}
          </dl>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Listo
          </button>
        </div>
      </Modal>
    )
  }

  // El cajero ya entregó y todavía no hay aprobación: no hay nada que hacer
  // desde su lado.
  if (pendingApproval && blind) {
    return (
      <Modal title="Caja entregada" onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <dl className="detail-grid">
            <dt>Contado</dt>
            <dd>{session.counted_closing_amount}</dd>
          </dl>
          <p className="core-state-message" style={{ margin: 0 }}>
            Esta caja está esperando que un supervisor revise el arqueo.
          </p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Entendido
          </button>
        </div>
      </Modal>
    )
  }

  const title = pendingApproval
    ? 'Revisar caja entregada'
    : blind
      ? 'Entregar caja'
      : 'Cerrar caja -arqueo'

  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <dl className="detail-grid">
          <dt>Apertura</dt>
          <dd>{session.opening_amount}</dd>
          {!blind && (
            <>
              <dt>Ventas en efectivo</dt>
              <dd>{cashSales.toFixed(2)}</dd>
            </>
          )}
          <dt>Ingresos manuales</dt>
          <dd>{movementsIn.toFixed(2)}</dd>
          <dt>Egresos manuales</dt>
          <dd>{movementsOut.toFixed(2)}</dd>
          {!blind && (
            <>
              <dt>Esperado (estimado)</dt>
              <dd style={{ fontWeight: 700 }}>{Number(expected).toFixed(2)}</dd>
            </>
          )}
          {pendingApproval && session.counted_closing_amount != null && (
            <>
              <dt>Contado por el cajero</dt>
              <dd style={{ fontWeight: 700 }}>
                {formatCurrency(session.counted_closing_amount)}
              </dd>
            </>
          )}
        </dl>

        {paymentTotals && <PaymentTotalsGrid totals={paymentTotals} />}

        {blind && !pendingApproval && (
          <p className="core-state-message" style={{ margin: 0 }}>
            Cuenta el efectivo que hay en la caja y escribe el total. La caja quedará entregada y
            un supervisor confirmará el cierre.
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label htmlFor="counted-amount">
              {pendingApproval
                ? 'Monto contado (puedes corregirlo)'
                : 'Monto contado (efectivo real en caja)'}
            </label>
            <input
              id="counted-amount"
              inputMode="decimal"
              value={countedAmount}
              onChange={(event) => setCountedAmount(toTwoDecimals(event.target.value))}
              placeholder={blind ? '0.00' : Number(expected).toFixed(2)}
              style={{ fontSize: '1.25rem', padding: '10px 12px' }}
            />
          </div>
          <div>
            <label htmlFor="close-notes">Observaciones (opcional)</label>
            <textarea
              id="close-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
            />
          </div>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending
              ? 'Guardando...'
              : blind
                ? 'Entregar caja'
                : pendingApproval
                  ? 'Confirmar cierre'
                  : 'Cerrar caja'}
          </button>
        </form>
      </div>
    </Modal>
  )
}
