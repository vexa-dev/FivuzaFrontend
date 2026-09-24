import type { POSPricingTier, POSPromotion, SalePaymentMethod } from '../api'

export interface CartLine {
  variantId: number
  sku: string
  productName: string
  // Precio base del catalogo, sin tramos por volumen (ProductVariant.price).
  basePrice: string
  pricingTiers: POSPricingTier[]
  // Sprint 27: si es 'KG', el panel del carrito reemplaza los botones +/-
  // por la lectura de la balanza (o el campo manual de respaldo).
  unitOfMeasure: 'UND' | 'KG'
  // Precio efectivo ya resuelto para la cantidad actual (base o de tramo,
  // ver cart/pricing.ts) -es lo que totals.ts usa para la vista previa.
  unitPrice: string
  quantity: string
  // Promoción vigente del catálogo del POS al agregar el producto. Solo
  // sirve para la vista previa del total (cart/promotion.ts): el backend la
  // vuelve a resolver al crear la venta y nunca viaja en el payload.
  promotion: POSPromotion | null
  // Descuento MANUAL de la línea. null = se deja que el backend resuelva la
  // promoción vigente (SaleService._resolve_promotion_discount); un string
  // es un override manual que gana sobre la promoción automática (mismo
  // contrato que SaleService.create_sale) y cuenta contra el tope del rol.
  discountAmount: string | null
  // Bloque C.2: el cajero da el descuento manual en %, que es como se mide
  // el tope de su rol. discountAmount se deriva de aquí (cartReducer) y se
  // recalcula si cambia la cantidad o el precio del tramo.
  discountPercent: string | null
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
