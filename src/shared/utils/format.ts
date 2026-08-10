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
