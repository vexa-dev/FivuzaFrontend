import { Printer } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { printHtml } from '../../../shared/utils/printHtml'
import { useQuoteDocument } from '../hooks/useQuotes'

export function QuoteDocumentModal({ quoteId, onClose }: { quoteId: number; onClose: () => void }) {
  const { data: html, isLoading } = useQuoteDocument(quoteId)

  return (
    <Modal title="Documento de cotización" onClose={onClose}>
      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Generando documento...
        </div>
      )}
      {html && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{ maxHeight: 400, overflow: 'auto', border: '1px solid var(--border-subtle)' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <button type="button" className="btn btn-primary" onClick={() => printHtml(html)}>
            <Printer size={15} strokeWidth={2.5} />
            Imprimir / enviar al cliente
          </button>
        </div>
      )}
    </Modal>
  )
}
