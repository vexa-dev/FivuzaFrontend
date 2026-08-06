import { useMemo, useReducer } from 'react'
import type { SaleCreateInput } from '../api'
import { cartReducer } from './cartReducer'
import { computeCartTotals } from './totals'
import { emptyCart } from './types'

/** Store local del carrito del POS (Sprint 15: solo estructura de estado,
 * sin pantalla todavía -la UI llega en el Sprint 16 sobre este mismo hook).
 * Vive en memoria del componente que lo monte; no hay necesidad de un
 * store global (Zustand/Redux) porque el carrito es exclusivo de la
 * pestaña/sesión de POS activa, no se comparte entre pantallas. */
export function useCart() {
  const [state, dispatch] = useReducer(cartReducer, emptyCart)
  const totals = useMemo(
    () => computeCartTotals(state.lines, state.payments),
    [state.lines, state.payments],
  )

  return { state, totals, dispatch }
}

/** Traduce el carrito al payload exacto que espera POST /ventas/sales/
 * (SaleService.create_sale) -null en discountAmount se omite para que el
 * backend resuelva la promoción vigente en vez de mandar un 0 literal. */
export function toSaleCreateInput(state: {
  customerId: number | null
  cashSessionId: number | null
  lines: { variantId: number; quantity: string; discountAmount: string | null }[]
  payments: { method: SaleCreateInput['payments'][number]['method']; amount: string }[]
}): SaleCreateInput | null {
  if (state.customerId === null || state.cashSessionId === null) return null

  return {
    customer_id: state.customerId,
    cash_session_id: state.cashSessionId,
    lines: state.lines.map((line) => ({
      variant_id: line.variantId,
      quantity: line.quantity,
      ...(line.discountAmount !== null ? { discount_amount: line.discountAmount } : {}),
    })),
    payments: state.payments,
  }
}
