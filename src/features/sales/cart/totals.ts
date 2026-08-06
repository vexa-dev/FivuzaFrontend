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
// backend recalcula todo con Decimal antes de aceptar la venta.
function lineSubtotal(line: CartLine): number {
  return Number(line.unitPrice) * Number(line.quantity)
}

function lineDiscount(line: CartLine): number {
  // Cuando discountAmount es null, el descuento real lo resuelve el
  // backend (promoción vigente) -no hay forma de anticiparlo sin duplicar
  // PromotionService en el cliente, así que la vista previa lo trata como 0.
  return line.discountAmount === null ? 0 : Number(line.discountAmount)
}

export function computeCartTotals(lines: CartLine[], payments: CartPayment[]): CartTotals {
  const subtotal = lines.reduce((sum, line) => sum + lineSubtotal(line), 0)
  const discountTotal = lines.reduce((sum, line) => sum + lineDiscount(line), 0)
  const total = subtotal - discountTotal
  const paymentsTotal = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)

  return {
    subtotal,
    discountTotal,
    total,
    paymentsTotal,
    paymentsMatchTotal: payments.length > 0 && Math.abs(paymentsTotal - total) < 0.0001,
  }
}
