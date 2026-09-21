import { formatCurrency } from '../../../shared/utils/format'

/** Bloque A.4: cuánto se cobró por cada medio durante el turno. El esperado
 * del arqueo solo cuenta efectivo -esto responde la otra mitad de la
 * pregunta, la que el módulo de Caja arrastraba pendiente. */
const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  YAPE: 'Yape / Plin',
  CREDIT_LEDGER: 'Fiado',
  BALANCE: 'Saldo a favor',
}

const METHOD_ORDER = ['CASH', 'CARD', 'YAPE', 'CREDIT_LEDGER', 'BALANCE']

export function PaymentTotalsGrid({ totals }: { totals: Record<string, string> }) {
  const entries = Object.entries(totals).sort(
    ([a], [b]) => METHOD_ORDER.indexOf(a) - METHOD_ORDER.indexOf(b),
  )
  if (entries.length === 0) return null

  const total = entries.reduce((sum, [, amount]) => sum + Number(amount), 0)

  return (
    <div>
      <span className="summary-section-title">Cobrado por medio de pago</span>
      <dl className="detail-grid">
        {entries.map(([method, amount]) => (
          <div key={method} style={{ display: 'contents' }}>
            <dt>{METHOD_LABELS[method] ?? method}</dt>
            <dd>{formatCurrency(amount)}</dd>
          </div>
        ))}
        <dt style={{ fontWeight: 700 }}>Total del turno</dt>
        <dd style={{ fontWeight: 700 }}>{formatCurrency(total)}</dd>
      </dl>
    </div>
  )
}
