/**
 * Regla única de decimales del sistema, espejo de core/decimals.py en el
 * backend: todo número con decimales (montos, precios, costos, cantidades,
 * peso y porcentajes) va con 2 decimales, redondeando medio hacia arriba
 * (1.575 -> 1.58, 12.957 -> 12.96). El backend rechaza una entrada con más
 * de 2 decimales, así que los formularios no dejan escribirla.
 */

/** Redondea a 2 decimales, medio hacia arriba (lejos del cero en los
 * empates, también para negativos: -1.575 -> -1.58, igual que ROUND_HALF_UP
 * de Python).
 *
 * Math.round(x * 100) falla en los empates por el punto flotante
 * (1.005 * 100 = 100.49999...): se limpia el ruido con toFixed(6) y se
 * desplaza la coma con notación exponencial, que sí es exacta. */
export function round2(value: number): number {
  const clean = Math.abs(Number(value.toFixed(6)))
  const rounded = Number(`${Math.round(Number(`${clean}e2`))}e-2`)
  return value < 0 ? -rounded : rounded
}

/** Limpia lo que se escribe en un campo decimal: acepta coma o punto como
 * separador y corta en el segundo decimal (no se puede escribir el
 * tercero). Deja pasar estados intermedios válidos ("", "-", "12.") para
 * no pelear con quien está tecleando. */
export function toTwoDecimals(raw: string): string {
  const match = raw.replace(',', '.').match(/^-?\d*(\.\d{0,2})?/)
  return match ? match[0] : ''
}
