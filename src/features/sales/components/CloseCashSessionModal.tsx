import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import type { CashMovement, CashSession } from '../api'
import { useCloseCashSession } from '../hooks/useCashSessions'
import { PaymentTotalsGrid } from './PaymentTotalsGrid'

interface CloseCashSessionModalProps {
  session: CashSession
  movements: CashMovement[]
  /** Bloque A.4: totales por medio de pago del turno. Llegan del detalle de
   * la sesion; si aun no cargaron, el modal simplemente no los muestra. */
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
  const [countedAmount, setCountedAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CashSession | null>(null)

  const movementsIn = sum(movements, 'IN')
  const movementsOut = sum(movements, 'OUT')
  // Bloque A.3 (arqueo a ciegas): el backend solo manda el esperado a quien
  // controla la caja. Si no viene, el cajero cuenta sin referencia -no se
  // estima en el navegador: una estimacion local seria la misma pista que
  // el control quiere quitar.
  const expected = session.expected_amount_so_far
  const blind = expected == null
  const cashSales = blind
    ? 0
    : Number(expected) - (Number(session.opening_amount) + movementsIn - movementsOut)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!countedAmount.trim()) {
      setError('Ingresa el monto contado.')
      return
    }
    closeSession
      .mutateAsync({ sessionId: session.id, countedClosingAmount: countedAmount, notes })
      .then(setResult)
      .catch((err: unknown) => {
        const body =
          err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
        setError(body?.error?.message ?? 'No se pudo cerrar la caja.')
      })
  }

  if (result) {
    // El cierre devuelve esperado y diferencia en null cuando quien cerro no
    // controla la caja: se le confirma lo que conto y nada mas.
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
          {difference == null && (
            <p className="core-state-message" style={{ margin: 0 }}>
              Tu caja quedó cerrada con lo que contaste. El arqueo lo revisa quien administra la
              caja.
            </p>
          )}
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Listo
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={`Cerrar caja -arqueo`} onClose={onClose}>
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
        </dl>

        {paymentTotals && <PaymentTotalsGrid totals={paymentTotals} />}

        {blind && (
          <p className="core-state-message" style={{ margin: 0 }}>
            Cuenta el efectivo que hay en la caja y escribe el total. El monto esperado lo revisa
            quien administra la caja.
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label htmlFor="counted-amount">Monto contado (efectivo real en caja)</label>
            <input
              id="counted-amount"
              inputMode="decimal"
              value={countedAmount}
              onChange={(event) => setCountedAmount(event.target.value)}
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
          <button type="submit" className="btn btn-primary" disabled={closeSession.isPending}>
            {closeSession.isPending ? 'Cerrando...' : 'Cerrar caja'}
          </button>
        </form>
      </div>
    </Modal>
  )
}
