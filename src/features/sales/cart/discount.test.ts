import { exceedsDiscountLimit, maxManualDiscountPercent } from './discount'
import type { CartLine } from './types'

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    variantId: 1,
    sku: 'SKU-1',
    productName: 'Camiseta',
    basePrice: '100.00',
    pricingTiers: [],
    unitOfMeasure: 'UND',
    unitPrice: '100.00',
    quantity: '1',
    discountAmount: null,
    discountPercent: null,
    ...overrides,
  }
}

describe('tope de descuento por línea', () => {
  it('toma el mayor descuento de las líneas, no el del total', () => {
    const lines = [
      line({ variantId: 1, unitPrice: '1000.00', discountAmount: '10.00', discountPercent: '1' }),
      line({ variantId: 2, unitPrice: '10.00', discountAmount: '5.00', discountPercent: '50' }),
    ]
    expect(maxManualDiscountPercent(lines)).toBe(50)
    expect(exceedsDiscountLimit(lines, { maxPercent: 10, unlimited: false })).toBe(true)
  })

  it('ignora líneas sin descuento manual (la promoción la resuelve el backend)', () => {
    expect(maxManualDiscountPercent([line()])).toBe(0)
    expect(exceedsDiscountLimit([line()], { maxPercent: 0, unlimited: false })).toBe(false)
  })

  it('dentro del tope no pide nada', () => {
    const lines = [line({ discountAmount: '10.00', discountPercent: '10' })]
    expect(exceedsDiscountLimit(lines, { maxPercent: 10, unlimited: false })).toBe(false)
  })

  it('quien tiene SALES_DISCOUNT no tiene tope', () => {
    const lines = [line({ discountAmount: '90.00', discountPercent: '90' })]
    expect(exceedsDiscountLimit(lines, { maxPercent: 0, unlimited: true })).toBe(false)
  })
})
