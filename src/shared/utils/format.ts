/**
 * El backend serializa los DecimalField de Django como strings con 4
 * decimales fijos (ej. "11.0000", "29.9000") -sin pasar por estas
 * funciones, cualquier {campo} interpolado directo en JSX muestra esos 4
 * decimales tal cual, incluso en cantidades enteras.
 */

/** Precio/monto en soles -siempre 2 decimales, tenga o no centavos. */
export function formatCurrency(value: string | number): string {
  return `S/ ${Number(value).toFixed(2)}`
}

/** Cantidad/stock -entero si no tiene fraccion (unidades), hasta 2
 * decimales si la tiene (productos por peso, ej. "5.50 kg"). */
export function formatQuantity(value: string | number): string {
  const num = Number(value)
  return Number.isInteger(num) ? String(num) : num.toFixed(2)
}
