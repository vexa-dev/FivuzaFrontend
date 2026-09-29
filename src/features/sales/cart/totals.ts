import { round2 } from '../../../shared/utils/decimals'
import { lineGross } from './money'
import { promotionDiscount } from './promotion'
import type { CartLine, CartPayment } from './types'

/** Bloque D.3: "Dividir pago" -al editar el monto de una línea, la otra
 * absorbe el resto exacto para que la suma siempre dé el total (mismo
 * criterio de redondeo que ReturnService: la última línea se lleva lo que
 * falte, nunca se reparte el redondeo entre varias). Solo tiene sentido con
 * exactamente 2 líneas -con 1 no hay nada que recalcular y con 3+ no hay una
 * única línea "restante" sin ambigüedad. */
export function rebalancePayments(
  payments: CartPayment[],
  total: number,
  editedIndex: number,
): CartPayment[] {
  if (payments.length !== 2) return payments
  const otherIndex = editedIndex === 0 ? 1 : 0
  const edited = round2(Number(payments[editedIndex].amount || 0))
  const remaining = Math.max(0, round2(total - edited))
  return payments.map((payment, index) =>
    index === otherIndex ? { ...payment, amount: remaining.toFixed(2) } : payment,
  )
}

export interface CartTotals {
  subtotal: number
  discountTotal: number
  total: number
  paymentsTotal: number
  // La UI usa esto para habilitar/deshabilitar "Cobrar" antes de llamar al
  // backend -SaleService.create_sale() sigue siendo la fuente de verdad
  // real (PAYMENT_MISMATCH si no cuadra), esto es solo una vista previa.
  paymentsMatchTotal: boolean
}

// Math en punto flotante -igual que CloseCashSessionModal (Sprint 12), es
// una vista previa para la UI, nunca el valor que se envía o persiste; el
// backend recalcula todo con Decimal antes de aceptar la venta. Cada línea
// se redondea a céntimos con la misma regla que el backend (core.decimals.round2).
function lineSubtotal(line: CartLine): number {
  return lineGross(line.unitPrice, line.quantity)
}

/** Descuento de la línea con la misma prioridad que SaleService.create_sale:
 * el manual gana; sin manual, el de la promoción vigente del producto. Si la
 * vista previa ignorara la promoción, el total y el pago precargado no
 * cuadrarían con el backend y la venta rebotaría con PAYMENT_MISMATCH. */
export function lineDiscount(line: CartLine): number {
  if (line.discountAmount !== null) {
    return Math.min(round2(Number(line.discountAmount)), lineSubtotal(line))
  }
  return promotionDiscount(line.unitPrice, line.quantity, line.promotion)
}

export function computeCartTotals(lines: CartLine[], payments: CartPayment[]): CartTotals {
  // Sumas de montos ya en céntimos: se vuelven a redondear solo para
  // limpiar el ruido del punto flotante (0.1 + 0.2), no cambian el valor.
  const subtotal = round2(lines.reduce((sum, line) => sum + lineSubtotal(line), 0))
  const discountTotal = round2(lines.reduce((sum, line) => sum + lineDiscount(line), 0))
  const total = round2(subtotal - discountTotal)
  const paymentsTotal = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)

  return {
    subtotal,
    discountTotal,
    total,
    paymentsTotal,
    paymentsMatchTotal: payments.length > 0 && Math.abs(paymentsTotal - total) < 0.0001,
  }
}
