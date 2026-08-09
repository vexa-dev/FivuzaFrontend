import { CloudOff } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { formatCurrency } from '../../../shared/utils/format'

interface OfflineSaleQueuedModalProps {
  total: string
  onClose: () => void
}

/** Confirmación cuando la venta se cobró sin conexión (Sprint 20): no hay
 * comprobante de la API todavía -ReceiptService necesita que la venta
 * exista en el servidor, y esta recién quedó en la cola local. El ticket
 * se puede reimprimir desde el historial una vez sincronizada. */
export function OfflineSaleQueuedModal({ total, onClose }: OfflineSaleQueuedModalProps) {
  return (
    <Modal title="Venta guardada sin conexión" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CloudOff size={28} strokeWidth={2} style={{ color: 'var(--warning)' }} />
          <div>
            <div className="core-table-strong">Total cobrado: {formatCurrency(total)}</div>
            <p className="core-page-subtitle" style={{ margin: 0 }}>
              Se sincronizará automáticamente en cuanto vuelva la conexión. El ticket se puede
              imprimir desde el historial una vez sincronizada.
            </p>
          </div>
        </div>

        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Nueva venta
        </button>
      </div>
    </Modal>
  )
}
