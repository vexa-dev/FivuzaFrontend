import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import type { CashMovement, CashSession } from '../api'
import { useCloseCashSession } from '../hooks/useCashSessions'

interface CloseCashSessionModalProps {
  session: CashSession
  movements: CashMovement[]
  onClose: () => void
}

function sum(movements: CashMovement[], type: 'IN' | 'OUT') {
  return movements
    .filter((m) => m.type === type)
    .reduce((total, m) => total + Number(m.amount), 0)
}

export function CloseCashSessionModal({ session, movements, onClose }: CloseCashSessionModalProps) {
  const closeSession = useCloseCashSession()
  const [countedAmount, setCountedAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CashSession | null>(null)

  const movementsIn = sum(movements, 'IN')
  const movementsOut = sum(movements, 'OUT')
  // Estimado calculado en el navegador a partir de los movimientos ya
  // visibles -no incluye ventas al contado (todavia no existe el modulo de
  // Ventas/POS para generarlas). El expected_closing_amount real, que el
  // backend calcula al cerrar, es la fuente de verdad -esto es solo una
  // vista previa para orientar al cajero antes de contar el efectivo.
  const estimatedExpected = Number(session.opening_amount) + movementsIn - movementsOut

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
    const difference = Number(result.difference)
    return (
      <Modal title="Caja cerrada" onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <dl className="detail-grid">
            <dt>Esperado</dt>
            <dd>{result.expected_closing_amount}</dd>
            <dt>Contado</dt>
            <dd>{result.counted_closing_amount}</dd>
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
          </dl>
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
          <dt>Ingresos manuales</dt>
          <dd>{movementsIn.toFixed(2)}</dd>
          <dt>Egresos manuales</dt>
          <dd>{movementsOut.toFixed(2)}</dd>
          <dt>Esperado (estimado)</dt>
          <dd style={{ fontWeight: 700 }}>{estimatedExpected.toFixed(2)}</dd>
        </dl>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label htmlFor="counted-amount">Monto contado (efectivo real en caja)</label>
            <input
              id="counted-amount"
              inputMode="decimal"
              value={countedAmount}
              onChange={(event) => setCountedAmount(event.target.value)}
              placeholder={estimatedExpected.toFixed(2)}
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
