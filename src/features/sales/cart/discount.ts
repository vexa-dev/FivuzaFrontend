import type { CartLine } from './types'

/** Mayor descuento manual por línea del carrito, en % (Bloque C.2: el tope
 * del rol es por línea, no sobre el total). 0 si no hay ninguno. */
export function maxManualDiscountPercent(lines: CartLine[]): number {
  return lines.reduce((max, line) => {
    if (line.discountAmount === null) return max
    return Math.max(max, Math.min(Number(line.discountPercent), 100))
  }, 0)
}

/** ¿Algún descuento del carrito pasa el tope de quien vende? Quien tiene
 * SALES_DISCOUNT no tiene tope. Es solo el aviso previo: el backend decide. */
export function exceedsDiscountLimit(
  lines: CartLine[],
  { maxPercent, unlimited }: { maxPercent: number; unlimited: boolean },
): boolean {
  if (unlimited) return false
  return maxManualDiscountPercent(lines) > maxPercent
}
