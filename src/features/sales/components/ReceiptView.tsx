import { Printer } from 'lucide-react'
import { printHtml } from '../../../shared/utils/printHtml'
import './ReceiptView.css'

interface ReceiptViewProps {
  html: string | undefined
  isLoading: boolean
}

export function ReceiptView({ html, isLoading }: ReceiptViewProps) {
  if (isLoading) {
    return (
      <div className="loading-row">
        <span className="spinner" />
        Generando ticket...
      </div>
    )
  }

  if (!html) {
    return <p className="core-state-message">No se pudo generar el ticket.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="receipt-preview" dangerouslySetInnerHTML={{ __html: html }} />
      <button type="button" className="btn btn-primary" onClick={() => printHtml(html)}>
        <Printer size={15} strokeWidth={2.5} />
        Imprimir ticket
      </button>
    </div>
  )
}
