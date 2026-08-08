import type { POSPricingTier } from '../api'

// Espejo de SaleService._resolve_unit_price() en el backend (Sprint 26):
// el tramo de mayor min_quantity que la cantidad alcance a cubrir: si
// ninguno aplica, se usa el precio base. Es solo una vista previa para la
// UI -el backend vuelve a resolverlo con Decimal al crear la venta.
export function resolveTierUnitPrice(
  basePrice: string,
  pricingTiers: POSPricingTier[],
  quantity: string,
): { unitPrice: string; appliedTier: POSPricingTier | null } {
  const qty = Number(quantity)
  const tier = pricingTiers
    .filter((t) => Number(t.min_quantity) <= qty)
    .sort((a, b) => Number(b.min_quantity) - Number(a.min_quantity))[0]
  return tier ? { unitPrice: tier.unit_price, appliedTier: tier } : { unitPrice: basePrice, appliedTier: null }
}
