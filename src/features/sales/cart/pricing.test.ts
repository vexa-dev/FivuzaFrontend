import { resolveTierUnitPrice } from './pricing'
import type { POSPricingTier } from '../api'

function tier(minQuantity: string, unitPrice: string): POSPricingTier {
  return { min_quantity: minQuantity, unit_price: unitPrice }
}

describe('resolveTierUnitPrice', () => {
  it('usa el precio base cuando no hay tramos', () => {
    const result = resolveTierUnitPrice('20.00', [], '3')
    expect(result).toEqual({ unitPrice: '20.00', appliedTier: null })
  })

  it('usa el precio base cuando la cantidad no alcanza ningun tramo', () => {
    const tiers = [tier('10', '18.00'), tier('50', '15.00')]
    const result = resolveTierUnitPrice('20.00', tiers, '5')
    expect(result).toEqual({ unitPrice: '20.00', appliedTier: null })
  })

  it('aplica el tramo cuando la cantidad lo alcanza exactamente', () => {
    const tiers = [tier('10', '18.00')]
    const result = resolveTierUnitPrice('20.00', tiers, '10')
    expect(result.unitPrice).toBe('18.00')
    expect(result.appliedTier).toEqual(tiers[0])
  })

  it('entre varios tramos alcanzados, gana el de mayor min_quantity', () => {
    const tiers = [tier('10', '18.00'), tier('50', '15.00'), tier('20', '17.00')]
    const result = resolveTierUnitPrice('20.00', tiers, '60')
    expect(result.unitPrice).toBe('15.00')
    expect(result.appliedTier).toEqual(tiers[1])
  })

  it('con la cantidad justo debajo de un tramo, aplica el tramo anterior', () => {
    const tiers = [tier('10', '18.00'), tier('50', '15.00')]
    const result = resolveTierUnitPrice('20.00', tiers, '49')
    expect(result.unitPrice).toBe('18.00')
  })
})
