import { round2 } from '../../../shared/utils/decimals'

/** Subtotal de la línea (precio × cantidad) ya redondeado a céntimos, igual
 * que SaleService.create_sale (core.decimals.round2). Si el carrito
 * arrastrara fracciones de céntimo, el pago precargado no cuadraría con el
 * total (PAYMENT_MISMATCH). */
export function lineGross(unitPrice: string, quantity: string): number {
  return round2(Number(unitPrice) * Number(quantity))
}
