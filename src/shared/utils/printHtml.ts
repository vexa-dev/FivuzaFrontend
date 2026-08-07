/** Imprime HTML en un iframe oculto en vez de window.open() -evita el
 * bloqueador de pop-ups del navegador (srcdoc no cuenta como pop-up) y no
 * navega fuera de la pantalla actual (Sprint 17, API Spec §4.11, TRD §3.2).
 * Compartido entre el ticket de venta (ReceiptView) y la boleta de pago de
 * RRHH (Sprint 23) -misma tecnica, ambos son documentos imprimibles de
 * ancho fijo generados a partir de HTML. */
export function printHtml(html: string) {
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
