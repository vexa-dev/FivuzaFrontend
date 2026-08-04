import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import type { CashMovementConcept, CashMovementType } from '../api'
import { useCreateCashMovement } from '../hooks/useCashSessions'

const CONCEPTS: [CashMovementConcept, string][] = [
  ['RETIRO', 'Retiro'],
  ['PAGO_PROVEEDOR_EFECTIVO', 'Pago a proveedor (efectivo)'],
  ['DEPOSITO_BANCO', 'Depósito a banco'],
  ['AJUSTE', 'Ajuste'],
]

export function AddCashMovementModal({
  sessionId,
  onClose,
}: {
  sessionId: number
  onClose: () => void
}) {
  const createMovement = useCreateCashMovement(sessionId)
  const [type, setType] = useState<CashMovementType>('OUT')
  const [concept, setConcept] = useState<CashMovementConcept>('RETIRO')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!amount.trim()) {
      setError('Ingresa el monto.')
      return
    }
    createMovement
      .mutateAsync({ type, concept, amount })
      .then(onClose)
      .catch((err: unknown) => {
        const body =
          err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
        setError(body?.error?.message ?? 'No se pudo registrar el movimiento.')
      })
  }

  return (
    <Modal title="Registrar movimiento de caja" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="movement-type">Tipo</label>
          <select
            id="movement-type"
            value={type}
            onChange={(event) => setType(event.target.value as CashMovementType)}
          >
            <option value="IN">Ingreso</option>
            <option value="OUT">Egreso</option>
          </select>
        </div>
        <div>
          <label htmlFor="movement-concept">Concepto</label>
          <select
            id="movement-concept"
            value={concept}
            onChange={(event) => setConcept(event.target.value as CashMovementConcept)}
          >
            {CONCEPTS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="movement-amount">Monto</label>
          <input
            id="movement-amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="10.00"
          />
        </div>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={createMovement.isPending}>
          {createMovement.isPending ? 'Guardando...' : 'Registrar movimiento'}
        </button>
      </form>
    </Modal>
  )
}
