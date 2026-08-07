import { CheckCircle2 } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import type { Sale } from '../api'
import { useSaleReceipt } from '../hooks/useSales'
import { ReceiptView } from './ReceiptView'

interface PostSaleModalProps {
  sale: Sale
  onClose: () => void
}

/** Confirmación post-venta (Sprint 17): el carrito ya se limpió antes de
 * mostrar este modal (POSCartPanel), así que cerrarlo es lo único que hace
 * falta para volver a un carrito nuevo -el cajero no navega a ningún lado. */
export function PostSaleModal({ sale, onClose }: PostSaleModalProps) {
  const { data: receiptHtml, isLoading } = useSaleReceipt(sale.id)

  return (
    <Modal title="Venta registrada" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={28} strokeWidth={2} style={{ color: 'var(--success)' }} />
          <div>
            <div className="core-table-strong">{sale.invoice_number}</div>
            <p className="core-page-subtitle" style={{ margin: 0 }}>
              Total cobrado: S/ {sale.total}
            </p>
          </div>
        </div>

        <ReceiptView html={receiptHtml} isLoading={isLoading} />

        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Nueva venta
        </button>
      </div>
    </Modal>
  )
}
