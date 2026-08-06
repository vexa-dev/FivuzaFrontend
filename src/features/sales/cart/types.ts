import type { SalePaymentMethod } from '../api'

export interface CartLine {
  variantId: number
  sku: string
  productName: string
  unitPrice: string
  quantity: string
  // null = se deja que el backend resuelva el descuento por la promoción
  // vigente (SaleService._resolve_promotion_discount); un string es un
  // override manual que el cajero ingresó a mano y que gana sobre la
  // promoción automática (mismo contrato que SaleService.create_sale).
  discountAmount: string | null
}

export interface CartPayment {
  method: SalePaymentMethod
  amount: string
}

export interface CartState {
  customerId: number | null
  cashSessionId: number | null
  lines: CartLine[]
  payments: CartPayment[]
}

export const emptyCart: CartState = {
  customerId: null,
  cashSessionId: null,
  lines: [],
  payments: [],
}
