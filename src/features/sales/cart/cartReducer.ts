import type { CartLine, CartPayment, CartState } from './types'

export type CartAction =
  | { type: 'SET_CUSTOMER'; customerId: number | null }
  | { type: 'SET_CASH_SESSION'; cashSessionId: number | null }
  | { type: 'ADD_LINE'; line: Omit<CartLine, 'quantity' | 'discountAmount'> & { quantity?: string } }
  | { type: 'REMOVE_LINE'; variantId: number }
  | { type: 'SET_LINE_QUANTITY'; variantId: number; quantity: string }
  | { type: 'SET_LINE_DISCOUNT'; variantId: number; discountAmount: string | null }
  | { type: 'ADD_PAYMENT'; payment: CartPayment }
  | { type: 'UPDATE_PAYMENT_AMOUNT'; index: number; amount: string }
  | { type: 'REMOVE_PAYMENT'; index: number }
  | { type: 'CLEAR' }

function upsertLine(lines: CartLine[], newLine: CartLine): CartLine[] {
  const existingIndex = lines.findIndex((line) => line.variantId === newLine.variantId)
  if (existingIndex === -1) return [...lines, newLine]

  // Escanear/agregar el mismo producto dos veces suma cantidad en vez de
  // duplicar la línea -es el comportamiento esperado de un lector de
  // código de barras en un POS (Convenciones §5.3, preparado para el
  // Sprint 16).
  return lines.map((line, index) =>
    index === existingIndex
      ? { ...line, quantity: String(Number(line.quantity) + Number(newLine.quantity)) }
      : line,
  )
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_CUSTOMER':
      return { ...state, customerId: action.customerId }

    case 'SET_CASH_SESSION':
      return { ...state, cashSessionId: action.cashSessionId }

    case 'ADD_LINE':
      return {
        ...state,
        lines: upsertLine(state.lines, {
          ...action.line,
          quantity: action.line.quantity ?? '1',
          discountAmount: null,
        }),
      }

    case 'REMOVE_LINE':
      return { ...state, lines: state.lines.filter((line) => line.variantId !== action.variantId) }

    case 'SET_LINE_QUANTITY':
      return {
        ...state,
        lines: state.lines.map((line) =>
          line.variantId === action.variantId ? { ...line, quantity: action.quantity } : line,
        ),
      }

    case 'SET_LINE_DISCOUNT':
      return {
        ...state,
        lines: state.lines.map((line) =>
          line.variantId === action.variantId
            ? { ...line, discountAmount: action.discountAmount }
            : line,
        ),
      }

    case 'ADD_PAYMENT':
      return { ...state, payments: [...state.payments, action.payment] }

    case 'UPDATE_PAYMENT_AMOUNT':
      return {
        ...state,
        payments: state.payments.map((payment, index) =>
          index === action.index ? { ...payment, amount: action.amount } : payment,
        ),
      }

    case 'REMOVE_PAYMENT':
      return {
        ...state,
        payments: state.payments.filter((_, index) => index !== action.index),
      }

    case 'CLEAR':
      return { ...state, lines: [], payments: [] }

    default:
      return state
  }
}
