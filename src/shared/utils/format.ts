import { round2 } from './decimals'

/**
 * El backend serializa los DecimalField de Django como strings con 2
 * decimales fijos (ej. "11.00", "29.90"; ver shared/utils/decimals.ts) -sin
 * pasar por estas funciones, una cantidad entera interpolada directo en JSX
 * se muestra como "3.00" en vez de "3".
 */

/** Precio/monto en soles -siempre 2 decimales, tenga o no centavos. */
export function formatCurrency(value: string | number): string {
  return `S/ ${round2(Number(value)).toFixed(2)}`
}

/** Cantidad/stock -entero si no tiene fraccion (unidades), hasta 2
 * decimales si la tiene (productos por peso, ej. "5.50 kg"). */
export function formatQuantity(value: string | number): string {
  const num = round2(Number(value))
  return Number.isInteger(num) ? String(num) : num.toFixed(2)
}

/** Hora relativa para feeds de actividad -"hace 5 min" en vez de un ISO
 * timestamp que el usuario tiene que parsear mentalmente. */
export function formatRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `hace ${diffHr} h`
  const diffDay = Math.floor(diffHr / 24)
  return `hace ${diffDay} d`
}
