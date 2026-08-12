import { computeCartTotals } from './totals'
import type { CartLine, CartPayment } from './types'

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    variantId: 1,
    sku: 'SKU-1',
    productName: 'Camiseta',
    basePrice: '20.00',
    pricingTiers: [],
    unitOfMeasure: 'UND',
    unitPrice: '20.00',
    quantity: '1',
    discountAmount: null,
    ...overrides,
  }
}

function payment(overrides: Partial<CartPayment> = {}): CartPayment {
  return { method: 'CASH', amount: '0', ...overrides }
}

describe('computeCartTotals', () => {
  it('con carrito vacio, todo queda en cero y no matchea (no hay pagos)', () => {
    const totals = computeCartTotals([], [])
    expect(totals).toEqual({
      subtotal: 0,
      discountTotal: 0,
      total: 0,
      paymentsTotal: 0,
      paymentsMatchTotal: false,
    })
  })

  it('suma subtotal por linea (unitPrice x quantity)', () => {
    const lines = [
      line({ unitPrice: '20.00', quantity: '2' }),
      line({ variantId: 2, unitPrice: '5.50', quantity: '3' }),
    ]
    const totals = computeCartTotals(lines, [])
    expect(totals.subtotal).toBeCloseTo(56.5)
  })

  it('discountAmount null se trata como 0 (el backend resuelve la promocion real)', () => {
    const totals = computeCartTotals([line({ discountAmount: null })], [])
    expect(totals.discountTotal).toBe(0)
  })

  it('descuenta discountAmount cuando es un override explicito', () => {
    const lines = [line({ unitPrice: '20.00', quantity: '1', discountAmount: '5.00' })]
    const totals = computeCartTotals(lines, [])
    expect(totals.discountTotal).toBe(5)
    expect(totals.total).toBe(15)
  })

  it('paymentsMatchTotal es true cuando los pagos cuadran exacto con el total', () => {
    const lines = [line({ unitPrice: '20.00', quantity: '2' })]
    const payments = [payment({ amount: '40.00' })]
    const totals = computeCartTotals(lines, payments)
    expect(totals.paymentsMatchTotal).toBe(true)
  })

  it('paymentsMatchTotal soporta pagos mixtos que cuadran entre varios metodos', () => {
    const lines = [line({ unitPrice: '20.00', quantity: '2' })]
    const payments = [payment({ method: 'CASH', amount: '25.00' }), payment({ method: 'CARD', amount: '15.00' })]
    const totals = computeCartTotals(lines, payments)
    expect(totals.paymentsMatchTotal).toBe(true)
  })

  it('paymentsMatchTotal es false cuando los pagos no cuadran con el total', () => {
    const lines = [line({ unitPrice: '20.00', quantity: '2' })]
    const payments = [payment({ amount: '39.00' })]
    const totals = computeCartTotals(lines, payments)
    expect(totals.paymentsMatchTotal).toBe(false)
  })

  it('paymentsMatchTotal es false sin pagos aunque el total sea cero', () => {
    const totals = computeCartTotals([], [])
    expect(totals.paymentsMatchTotal).toBe(false)
  })
})
