import { Percent, X } from 'lucide-react'
import { useState } from 'react'
import type { CartLine } from '../cart/types'
import { toTwoDecimals } from '../../../shared/utils/decimals'

interface POSLineDiscountProps {
  line: CartLine
  /** El % pedido pasa el tope del rol: al cobrar, un supervisor autoriza. */
  overLimit: boolean
  onChange: (discountPercent: string | null) => void
}

/** Descuento manual de una línea del POS (Bloque C.2), en %. Gana sobre la
 * promoción automática del producto, igual que en el backend. */
export function POSLineDiscount({ line, overLimit, onChange }: POSLineDiscountProps) {
  const [editing, setEditing] = useState(false)
  const visible = editing || line.discountPercent !== null

  if (!visible) {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-sm pos-line-discount-toggle"
        onClick={() => setEditing(true)}
        aria-label={`Dar descuento a ${line.productName}`}
      >
        <Percent size={12} strokeWidth={2} />
        Descuento
      </button>
    )
  }

  return (
    <div className="pos-line-discount">
      <label className="pos-line-discount-field">
        <input
          aria-label={`Descuento de ${line.productName} en %`}
          value={line.discountPercent ?? ''}
          onChange={(event) => {
            const value = toTwoDecimals(event.target.value)
            onChange(value === '' ? null : value)
          }}
          inputMode="decimal"
          placeholder="0"
          autoFocus={editing && line.discountPercent === null}
        />
        <span aria-hidden="true">%</span>
      </label>
      {line.discountAmount !== null && (
        <span className="pos-line-discount-amount">-S/ {line.discountAmount}</span>
      )}
      <button
        type="button"
        className="btn btn-ghost btn-icon btn-sm"
        aria-label={`Quitar descuento de ${line.productName}`}
        onClick={() => {
          onChange(null)
          setEditing(false)
        }}
      >
        <X size={12} strokeWidth={2} />
      </button>
      {overLimit && (
        <span className="badge badge-warning pos-line-discount-badge">Requiere autorización</span>
      )}
    </div>
  )
}
