import { useState } from 'react'
import {
  isAuthorizationCancelled,
  useSupervisorAuthorization,
} from '../../../shared/authorization/useSupervisorAuthorization'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import { useAuth } from '../../auth/hooks/useAuth'
import type { Sale } from '../api'
import { useVoidSale } from '../hooks/useSales'

interface VoidSaleModalProps {
  sale: Sale
  onClose: () => void
  onVoided: () => void
}

/** Anulacion (Sprint 18): "la venta nunca debio existir" -exige un motivo
 * obligatorio porque queda en la bitacora (SALE_VOIDED) para siempre.
 * Bloque C: sin SALES_VOID, un supervisor la autoriza desde este equipo. */
export function VoidSaleModal({ sale, onClose, onVoided }: VoidSaleModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const voidSale = useVoidSale()
  const authorization = useSupervisorAuthorization()
  const { hasPermission } = useAuth()
  const needsSupervisor = !hasPermission('SALES_VOID')

  const handleConfirm = () => {
    setError(null)
    if (!reason.trim()) {
      setError('El motivo es obligatorio.')
      return
    }
    authorization
      .run(
        (authorizationToken) =>
          voidSale.mutateAsync({ id: sale.id, reason, authorizationToken }),
        { targetId: sale.id, description: `Anular ${sale.invoice_number}` },
      )
      .then(onVoided)
      .catch((err: unknown) => {
        if (isAuthorizationCancelled(err)) return
        const body = err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
        setError(body?.error?.message ?? 'No se pudo anular la venta.')
      })
  }

  return (
    <Modal title={`Anular ${sale.invoice_number}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p className="core-page-subtitle" style={{ margin: 0 }}>
          Esta acción reingresa el stock completo y revierte el efectivo de la sesión de caja. No
          se puede deshacer.
        </p>
        {needsSupervisor && (
          <p className="core-page-subtitle" style={{ margin: 0 }}>
            Al confirmar, un supervisor tendrá que autorizarla con su clave.
          </p>
        )}
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
          disabled={voidSale.isPending || authorization.isAsking}
          onClick={handleConfirm}
        >
          {voidSale.isPending ? 'Anulando...' : 'Confirmar anulación'}
        </button>
      </div>
      {authorization.modal}
    </Modal>
  )
}
