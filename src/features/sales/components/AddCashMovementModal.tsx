import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import { requestCashMovementReceiptUploadUrl, type CashMovementConcept, type CashMovementType } from '../api'
import { useCreateCashMovement } from '../hooks/useCashSessions'

const CONCEPTS: [CashMovementConcept, string][] = [
  ['RETIRO', 'Retiro'],
  ['PAGO_PROVEEDOR_EFECTIVO', 'Pago a proveedor (efectivo)'],
  ['DEPOSITO_BANCO', 'Depósito a banco'],
  ['AJUSTE', 'Ajuste'],
]

const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

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
  const [reason, setReason] = useState('')
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReceiptChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
      setError('Formato de comprobante no permitido (usa JPG, PNG, WEBP o PDF).')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const { upload_url, receipt_url } = await requestCashMovementReceiptUploadUrl(file.type)
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadResponse.ok) throw new Error('upload_failed')
      setReceiptUrl(receipt_url)
    } catch {
      setError('No se pudo subir el comprobante.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!amount.trim()) {
      setError('Ingresa el monto.')
      return
    }
    createMovement
      .mutateAsync({ type, concept, amount, reason, receiptUrl })
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
        <div>
          <label htmlFor="movement-reason">Motivo (opcional)</label>
          <textarea
            id="movement-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
          />
        </div>
        <div>
          <label htmlFor="movement-receipt">Comprobante (opcional)</label>
          {receiptUrl && (
            <p className="core-page-subtitle" style={{ margin: '0 0 6px' }}>
              Comprobante subido.
            </p>
          )}
          <input
            id="movement-receipt"
            type="file"
            accept={ALLOWED_RECEIPT_TYPES.join(',')}
            onChange={handleReceiptChange}
            disabled={uploading}
          />
          {uploading && <p className="core-page-subtitle">Subiendo...</p>}
        </div>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={createMovement.isPending || uploading}
        >
          {createMovement.isPending ? 'Guardando...' : 'Registrar movimiento'}
        </button>
      </form>
    </Modal>
  )
}
