import type { SalePaymentMethod } from '../api'

export interface PaymentMethodConfig {
  value: SalePaymentMethod
  label: string
  // Bloque D.7: si el metodo se puede cobrar sin conexion. CARD nunca -no
  // hay forma de confirmar el cobro con el banco desde el POS offline; YAPE
  // si, pero exige numero de operacion anotado a mano antes de encolar.
  offlineAllowed: boolean
  requiresOperationNumber: boolean
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  { value: 'CASH', label: 'Efectivo', offlineAllowed: true, requiresOperationNumber: false },
  { value: 'CARD', label: 'Tarjeta', offlineAllowed: false, requiresOperationNumber: true },
  { value: 'YAPE', label: 'Yape', offlineAllowed: true, requiresOperationNumber: true },
  {
    value: 'CREDIT_LEDGER',
    label: 'Crédito (fiado)',
    offlineAllowed: true,
    requiresOperationNumber: false,
  },
  {
    value: 'BALANCE',
    label: 'Saldo a favor',
    offlineAllowed: true,
    requiresOperationNumber: false,
  },
]

const BY_VALUE = new Map(PAYMENT_METHODS.map((method) => [method.value, method]))

export function paymentMethodConfig(method: SalePaymentMethod): PaymentMethodConfig {
  const config = BY_VALUE.get(method)
  if (!config) throw new Error(`Método de pago desconocido: ${method}`)
  return config
}

export function paymentMethodLabel(method: SalePaymentMethod): string {
  return paymentMethodConfig(method).label
}

/** Bloque D.1: el cliente de paso no puede fiar ni tener saldo a favor -el
 * backend lo rechaza (WALK_IN_CREDIT_NOT_ALLOWED/WALK_IN_BALANCE_NOT_ALLOWED),
 * esto solo oculta la opción para no ofrecer algo que va a rebotar. */
export function paymentMethodsFor(isWalkInCustomer: boolean): PaymentMethodConfig[] {
  if (!isWalkInCustomer) return PAYMENT_METHODS
  return PAYMENT_METHODS.filter(
    (method) => method.value !== 'CREDIT_LEDGER' && method.value !== 'BALANCE',
  )
}
