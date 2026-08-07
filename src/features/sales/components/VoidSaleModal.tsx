import { useState } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import type { Sale } from '../api'
import { useVoidSale } from '../hooks/useSales'

interface VoidSaleModalProps {
  sale: Sale
  onClose: () => void
  onVoided: () => void
}

/** Anulacion (Sprint 18): "la venta nunca debio existir" -exige un motivo
 * obligatorio porque queda en la bitacora (SALE_VOIDED) para siempre. */
export function VoidSaleModal({ sale, onClose, onVoided }: VoidSaleModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const voidSale = useVoidSale()

  const handleConfirm = () => {
    setError(null)
    if (!reason.trim()) {
      setError('El motivo es obligatorio.')
      return
    }
    voidSale.mutate(
      { id: sale.id, reason },
      {
        onSuccess: onVoided,
        onError: (err: unknown) => {
          const body = err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
          setError(body?.error?.message ?? 'No se pudo anular la venta.')
        },
      },
    )
  }

  return (
    <Modal title={`Anular ${sale.invoice_number}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p className="core-page-subtitle" style={{ margin: 0 }}>
          Esta acción reingresa el stock completo y revierte el efectivo de la sesión de caja. No
          se puede deshacer.
        </p>
        <div>
          <label htmlFor="void-sale-reason">Motivo (obligatorio)</label>
          <textarea
            id="void-sale-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
          />
        </div>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          className="btn btn-danger"
          disabled={voidSale.isPending}
          onClick={handleConfirm}
        >
          {voidSale.isPending ? 'Anulando...' : 'Confirmar anulación'}
        </button>
      </div>
    </Modal>
  )
}
