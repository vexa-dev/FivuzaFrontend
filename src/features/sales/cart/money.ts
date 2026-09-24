/** Espejo de round_money() en el backend (ventas/services/sales.py): cada
 * monto de línea (subtotal y descuento) se redondea a céntimos con
 * ROUND_HALF_UP. Si el carrito arrastrara fracciones de céntimo, el pago
 * precargado en céntimos no cuadraría con el total (PAYMENT_MISMATCH).
 *
 * Math.round(x * 100) falla en los empates por el punto flotante
 * (1.005 * 100 = 100.49999...): se limpia el ruido con toFixed(6) y se
 * desplaza la coma con notación exponencial, que sí es exacta. Los montos
 * del carrito nunca son negativos, así que Math.round es HALF_UP. */
export function roundMoney(value: number): number {
  const clean = Number(value.toFixed(6))
  return Number(`${Math.round(Number(`${clean}e2`))}e-2`)
}

/** Subtotal de la línea (precio × cantidad) ya redondeado a céntimos. */
export function lineGross(unitPrice: string, quantity: string): number {
  return roundMoney(Number(unitPrice) * Number(quantity))
}
