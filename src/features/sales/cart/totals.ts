import { round2 } from '../../../shared/utils/decimals'
import { lineGross } from './money'
import { promotionDiscount } from './promotion'
import type { CartLine, CartPayment } from './types'

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
