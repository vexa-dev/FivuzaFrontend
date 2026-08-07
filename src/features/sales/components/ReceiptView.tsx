import { Printer } from 'lucide-react'
import './ReceiptView.css'

/** Imprime el ticket en un iframe oculto en vez de window.open() -evita el
 * bloqueador de pop-ups del navegador (srcdoc no cuenta como pop-up) y no
 * navega fuera de la pantalla del POS (API Spec §4.11, TRD §3.2). */
function printReceiptHtml(html: string) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }
  doc.open()
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`)
  doc.close()

  iframe.contentWindow?.focus()
  iframe.contentWindow?.print()
  setTimeout(() => document.body.removeChild(iframe), 1000)
}

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
      <button type="button" className="btn btn-primary" onClick={() => printReceiptHtml(html)}>
        <Printer size={15} strokeWidth={2.5} />
        Imprimir ticket
      </button>
    </div>
  )
}
