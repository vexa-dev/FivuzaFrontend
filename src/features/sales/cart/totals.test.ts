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
    promotion: null,
    unitPrice: '20.00',
    quantity: '1',
    discountAmount: null,
    discountPercent: null,
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

  it('sin descuento manual ni promocion, no hay descuento', () => {
    const totals = computeCartTotals([line({ discountAmount: null, promotion: null })], [])
    expect(totals.discountTotal).toBe(0)
  })

  it('sin descuento manual, descuenta la promocion vigente de la linea', () => {
    const lines = [
      line({
        unitPrice: '25.00',
        quantity: '2',
        promotion: { id: 1, name: 'Promo', type: 'PERCENTAGE', value: '20.00' },
      }),
    ]
    const totals = computeCartTotals(lines, [payment({ amount: '40.00' })])
    expect(totals.discountTotal).toBeCloseTo(10)
    expect(totals.total).toBeCloseTo(40)
    // Es el mismo total que calcula el backend: el pago por ese monto cuadra.
    expect(totals.paymentsMatchTotal).toBe(true)
  })

  // CheckoutModal precarga el pago con remaining.toFixed(2): ese monto en
  // centimos tiene que cuadrar con el total, o "Cobrar" queda deshabilitado.
  it('con promocion de % que deja fracciones de centimo, el pago precargado cuadra', () => {
    const lines = [
      line({
        unitPrice: '10.99',
        quantity: '1',
        promotion: { id: 1, name: 'Promo', type: 'PERCENTAGE', value: '12.50' },
      }),
    ]
    const preloaded = computeCartTotals(lines, []).total.toFixed(2)
    const totals = computeCartTotals(lines, [payment({ amount: preloaded })])
    expect(preloaded).toBe('9.62')
    expect(totals.paymentsMatchTotal).toBe(true)
  })

  it('redondea el descuento de cada linea (15% de 10.50 = 1.575 -> 1.58), igual que el backend', () => {
    const lines = [
      line({
        unitPrice: '10.50',
        quantity: '1',
        promotion: { id: 1, name: 'Promo', type: 'PERCENTAGE', value: '15.00' },
      }),
    ]
    const totals = computeCartTotals(lines, [payment({ amount: '8.92' })])
    expect(totals.discountTotal).toBe(1.58)
    expect(totals.total).toBe(8.92)
    expect(totals.paymentsMatchTotal).toBe(true)
    // 8.93 (redondear solo el total) es el monto que el backend rechazaria.
    expect(computeCartTotals(lines, [payment({ amount: '8.93' })]).paymentsMatchTotal).toBe(false)
  })

  it('suma lineas ya redondeadas: el total es la suma de las lineas en centimos', () => {
    const lines = [
      line({ unitPrice: '10.50', quantity: '1.25', unitOfMeasure: 'KG' }),
      line({
        variantId: 2,
        unitPrice: '10.50',
        quantity: '1',
        promotion: { id: 1, name: 'Promo', type: 'PERCENTAGE', value: '15.00' },
      }),
    ]
    const totals = computeCartTotals(lines, [])
    expect(totals.subtotal).toBe(23.63)
    expect(totals.discountTotal).toBe(1.58)
    expect(totals.total).toBe(22.05)
  })

  it('con producto por KG que deja fracciones de centimo, el pago precargado cuadra', () => {
    // 1.25 kg x 10.50 = 13.125 -> 13.13
    const lines = [line({ unitPrice: '10.50', quantity: '1.25', unitOfMeasure: 'KG' })]
    const preloaded = computeCartTotals(lines, []).total.toFixed(2)
    const totals = computeCartTotals(lines, [payment({ amount: preloaded })])
    expect(preloaded).toBe('13.13')
    expect(totals.paymentsMatchTotal).toBe(true)
  })

  it('el descuento manual gana sobre la promocion (no se suman)', () => {
    const lines = [
      line({
        unitPrice: '25.00',
        quantity: '1',
        promotion: { id: 1, name: 'Promo', type: 'PERCENTAGE', value: '20.00' },
        discountAmount: '2.50',
        discountPercent: '10',
      }),
    ]
    const totals = computeCartTotals(lines, [])
    expect(totals.discountTotal).toBe(2.5)
    expect(totals.total).toBe(22.5)
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
