import type { POSPromotion } from '../api'
import { lineGross, roundMoney } from './money'

/** Espejo de SaleService._resolve_promotion_discount() en el backend:
 * PERCENTAGE descuenta ese % del subtotal de la línea; FIXED_AMOUNT es un
 * monto por unidad, con tope en el subtotal para no dejar la línea en
 * negativo. Redondeado a céntimos (HALF_UP) sobre el subtotal ya redondeado,
 * igual que el backend: el total tiene que cuadrar con los pagos. */
export function promotionDiscount(
  unitPrice: string,
  quantity: string,
  promotion: POSPromotion | null,
): number {
  if (promotion === null) return 0
  const lineSubtotal = lineGross(unitPrice, quantity)
  const value = Number(promotion.value)
  if (promotion.type === 'PERCENTAGE') return roundMoney((lineSubtotal * value) / 100)
  return Math.min(roundMoney(value * Number(quantity)), lineSubtotal)
}

/** Etiqueta corta de la promoción ("-20%", "-S/ 2.00"), para el catálogo y
 * la línea del carrito. */
export function promotionLabel(promotion: POSPromotion): string {
  return promotion.type === 'PERCENTAGE'
    ? `-${Number(promotion.value)}%`
    : `-S/ ${Number(promotion.value).toFixed(2)}`
}
