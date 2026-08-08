import { cartReducer } from './cartReducer'
import { computeCartTotals } from './totals'
import { emptyCart } from './types'

describe('cartReducer', () => {
  it('agrega una línea nueva con cantidad 1 por defecto', () => {
    const state = cartReducer(emptyCart, {
      type: 'ADD_LINE',
      line: {
        variantId: 1,
        sku: 'SKU-1',
        productName: 'Camiseta',
        basePrice: '20.00',
        pricingTiers: [],
        unitOfMeasure: 'UND',
      },
    })
    expect(state.lines).toHaveLength(1)
    expect(state.lines[0]).toMatchObject({
      variantId: 1,
      quantity: '1',
      discountAmount: null,
      unitPrice: '20.00',
    })
  })

  it('sumar la misma variante dos veces acumula cantidad en vez de duplicar la línea', () => {
    let state = cartReducer(emptyCart, {
      type: 'ADD_LINE',
      line: {
        variantId: 1,
        sku: 'SKU-1',
        productName: 'Camiseta',
        basePrice: '20.00',
        pricingTiers: [],
        unitOfMeasure: 'UND',
      },
    })
    state = cartReducer(state, {
      type: 'ADD_LINE',
      line: {
        variantId: 1,
        sku: 'SKU-1',
        productName: 'Camiseta',
        basePrice: '20.00',
        pricingTiers: [],
        unitOfMeasure: 'UND',
      },
    })

    expect(state.lines).toHaveLength(1)
    expect(state.lines[0].quantity).toBe('2')
  })

  it('SET_LINE_QUANTITY actualiza solo la línea indicada', () => {
    let state = cartReducer(emptyCart, {
      type: 'ADD_LINE',
      line: {
        variantId: 1,
        sku: 'SKU-1',
        productName: 'Camiseta',
        basePrice: '20.00',
        pricingTiers: [],
        unitOfMeasure: 'UND',
      },
    })
    state = cartReducer(state, {
      type: 'ADD_LINE',
      line: {
        variantId: 2,
        sku: 'SKU-2',
        productName: 'Pantalón',
        basePrice: '50.00',
        pricingTiers: [],
        unitOfMeasure: 'UND',
      },
    })
    state = cartReducer(state, { type: 'SET_LINE_QUANTITY', variantId: 2, quantity: '3' })

    expect(state.lines.find((l) => l.variantId === 1)?.quantity).toBe('1')
    expect(state.lines.find((l) => l.variantId === 2)?.quantity).toBe('3')
  })

  it('REMOVE_LINE quita solo la variante indicada', () => {
    let state = cartReducer(emptyCart, {
      type: 'ADD_LINE',
      line: {
        variantId: 1,
        sku: 'SKU-1',
        productName: 'Camiseta',
        basePrice: '20.00',
        pricingTiers: [],
        unitOfMeasure: 'UND',
      },
    })
    state = cartReducer(state, { type: 'REMOVE_LINE', variantId: 1 })
    expect(state.lines).toHaveLength(0)
  })

  it('ADD_PAYMENT / REMOVE_PAYMENT / UPDATE_PAYMENT_AMOUNT', () => {
    let state = cartReducer(emptyCart, {
      type: 'ADD_PAYMENT',
      payment: { method: 'CASH', amount: '10.00' },
    })
    state = cartReducer(state, {
      type: 'ADD_PAYMENT',
      payment: { method: 'CARD', amount: '5.00' },
    })
    state = cartReducer(state, { type: 'UPDATE_PAYMENT_AMOUNT', index: 0, amount: '15.00' })
    expect(state.payments).toEqual([
      { method: 'CASH', amount: '15.00' },
      { method: 'CARD', amount: '5.00' },
    ])

    state = cartReducer(state, { type: 'REMOVE_PAYMENT', index: 1 })
    expect(state.payments).toEqual([{ method: 'CASH', amount: '15.00' }])
  })

  it('CLEAR vacía líneas y pagos, sin tocar cliente/sesión de caja', () => {
    let state = cartReducer(emptyCart, { type: 'SET_CUSTOMER', customerId: 7 })
    state = cartReducer(state, { type: 'SET_CASH_SESSION', cashSessionId: 3 })
    state = cartReducer(state, {
      type: 'ADD_LINE',
      line: {
        variantId: 1,
        sku: 'SKU-1',
        productName: 'Camiseta',
        basePrice: '20.00',
        pricingTiers: [],
        unitOfMeasure: 'UND',
      },
    })
    state = cartReducer(state, { type: 'CLEAR' })

    expect(state.lines).toHaveLength(0)
    expect(state.payments).toHaveLength(0)
    expect(state.customerId).toBe(7)
    expect(state.cashSessionId).toBe(3)
  })

  it('un tramo por volumen se aplica al agregar cuando la cantidad inicial ya lo alcanza', () => {
    const state = cartReducer(emptyCart, {
      type: 'ADD_LINE',
      line: {
        variantId: 1,
        sku: 'SKU-1',
        productName: 'Camiseta',
        basePrice: '20.00',
        pricingTiers: [{ min_quantity: '12', unit_price: '15.00' }],
        unitOfMeasure: 'UND',
        quantity: '12',
      },
    })
    expect(state.lines[0].unitPrice).toBe('15.00')
  })

  it('SET_LINE_QUANTITY resuelve el tramo al cruzar el umbral y lo revierte al bajar', () => {
    let state = cartReducer(emptyCart, {
      type: 'ADD_LINE',
      line: {
        variantId: 1,
        sku: 'SKU-1',
        productName: 'Camiseta',
        basePrice: '20.00',
        pricingTiers: [{ min_quantity: '12', unit_price: '15.00' }],
        unitOfMeasure: 'UND',
      },
    })
    expect(state.lines[0].unitPrice).toBe('20.00')

    state = cartReducer(state, { type: 'SET_LINE_QUANTITY', variantId: 1, quantity: '12' })
    expect(state.lines[0].unitPrice).toBe('15.00')

    state = cartReducer(state, { type: 'SET_LINE_QUANTITY', variantId: 1, quantity: '5' })
    expect(state.lines[0].unitPrice).toBe('20.00')
  })
})

describe('computeCartTotals', () => {
  it('calcula subtotal/total sin descuentos ni pagos', () => {
    const totals = computeCartTotals(
      [
        {
          variantId: 1,
          sku: 'SKU-1',
          productName: 'Camiseta',
          basePrice: '20.00',
          pricingTiers: [],
          unitOfMeasure: 'UND',
          unitPrice: '20.00',
          quantity: '2',
          discountAmount: null,
        },
      ],
      [],
    )
    expect(totals.subtotal).toBe(40)
    expect(totals.discountTotal).toBe(0)
    expect(totals.total).toBe(40)
    expect(totals.paymentsMatchTotal).toBe(false)
  })

  it('resta el descuento manual de una línea del total', () => {
    const totals = computeCartTotals(
      [
        {
          variantId: 1,
          sku: 'SKU-1',
          productName: 'Camiseta',
          basePrice: '100.00',
          pricingTiers: [],
          unitOfMeasure: 'UND',
          unitPrice: '100.00',
          quantity: '1',
          discountAmount: '10.00',
        },
      ],
      [],
    )
    expect(totals.subtotal).toBe(100)
    expect(totals.discountTotal).toBe(10)
    expect(totals.total).toBe(90)
  })

  it('paymentsMatchTotal es true solo cuando la suma de pagos mixtos cuadra con el total', () => {
    const lines = [
      {
        variantId: 1,
        sku: 'SKU-1',
        productName: 'Camiseta',
        basePrice: '30.00',
        pricingTiers: [],
        unitOfMeasure: 'UND' as const,
        unitPrice: '30.00',
        quantity: '1',
        discountAmount: null,
      },
    ]
    const matching = computeCartTotals(lines, [
      { method: 'CASH', amount: '20.00' },
      { method: 'CARD', amount: '10.00' },
    ])
    expect(matching.paymentsMatchTotal).toBe(true)

    const mismatched = computeCartTotals(lines, [{ method: 'CASH', amount: '25.00' }])
    expect(mismatched.paymentsMatchTotal).toBe(false)
  })

  it('un descuento automático (discountAmount null) no se anticipa en la vista previa', () => {
    const totals = computeCartTotals(
      [
        {
          variantId: 1,
          sku: 'SKU-1',
          productName: 'Camiseta',
          basePrice: '50.00',
          pricingTiers: [],
          unitOfMeasure: 'UND',
          unitPrice: '50.00',
          quantity: '1',
          discountAmount: null,
        },
      ],
      [],
    )
    expect(totals.discountTotal).toBe(0)
    expect(totals.total).toBe(50)
  })
})
