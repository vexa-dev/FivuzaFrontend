import type { POSPricingTier, SalePaymentMethod } from '../api'

export interface CartLine {
  variantId: number
  sku: string
  productName: string
  // Precio base del catalogo, sin tramos por volumen (ProductVariant.price).
  basePrice: string
  pricingTiers: POSPricingTier[]
  // Precio efectivo ya resuelto para la cantidad actual (base o de tramo,
  // ver cart/pricing.ts) -es lo que totals.ts usa para la vista previa.
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
