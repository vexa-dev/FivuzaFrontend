import type { POSPromotion } from '../api'
import { cartReducer } from './cartReducer'
import { exceedsDiscountLimit } from './discount'
import { computeCartTotals } from './totals'
import { emptyCart, type CartState } from './types'
import { toSaleCreateInput } from './useCart'

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
        promotion: null,
      },
    })
    expect(state.lines).toHaveLength(1)
    expect(state.lines[0]).toMatchObject({
      variantId: 1,
      quantity: '1',
      discountAmount: null,
      discountPercent: null,
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
        promotion: null,
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
        promotion: null,
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
        promotion: null,
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
        promotion: null,
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
        promotion: null,
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
        promotion: null,
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
        promotion: null,
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
        promotion: null,
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
          promotion: null,
          unitPrice: '20.00',
          quantity: '2',
          discountAmount: null,
          discountPercent: null,
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
          promotion: null,
          unitPrice: '100.00',
          quantity: '1',
          discountAmount: '10.00',
          discountPercent: '10',
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
        promotion: null,
        unitPrice: '30.00',
        quantity: '1',
        discountAmount: null,
        discountPercent: null,
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
})

describe('descuento manual por porcentaje (Bloque C.2)', () => {
  const addShirt = (quantity = '1') =>
    cartReducer(emptyCart, {
      type: 'ADD_LINE',
      line: {
        variantId: 1,
        sku: 'SKU-1',
        productName: 'Camiseta',
        basePrice: '33.33',
        pricingTiers: [],
        unitOfMeasure: 'UND',
        promotion: null,
        quantity,
      },
    })

  it('deriva el monto del porcentaje, truncado a céntimos', () => {
    const state = cartReducer(addShirt(), {
      type: 'SET_LINE_DISCOUNT',
      variantId: 1,
      discountPercent: '10',
    })
    // 10% de 33.33 es 3.333: se trunca a 3.33 para no pasar el % pedido.
    expect(state.lines[0].discountAmount).toBe('3.33')
  })

  it('recalcula el monto al cambiar la cantidad', () => {
    let state = cartReducer(addShirt(), {
      type: 'SET_LINE_DISCOUNT',
      variantId: 1,
      discountPercent: '10',
    })
    state = cartReducer(state, { type: 'SET_LINE_QUANTITY', variantId: 1, quantity: '3' })
    expect(state.lines[0].discountAmount).toBe('9.99')
  })

  it('un porcentaje vacío o inválido no manda descuento manual', () => {
    for (const discountPercent of [null, '', 'abc', '0']) {
      const state = cartReducer(addShirt(), {
        type: 'SET_LINE_DISCOUNT',
        variantId: 1,
        discountPercent,
      })
      expect(state.lines[0].discountAmount).toBeNull()
    }
  })

  it('nunca descuenta más que la línea', () => {
    const state = cartReducer(addShirt(), {
      type: 'SET_LINE_DISCOUNT',
      variantId: 1,
      discountPercent: '250',
    })
    expect(state.lines[0].discountAmount).toBe('33.33')
  })
})

describe('promoción vigente en el carrito', () => {
  const promo20: POSPromotion = { id: 9, name: 'Promo', type: 'PERCENTAGE', value: '20.0000' }

  const addCap = (promotion: POSPromotion | null, quantity = '1') =>
    cartReducer(emptyCart, {
      type: 'ADD_LINE',
      line: {
        variantId: 1,
        sku: 'GORRA-1',
        productName: 'Gorra',
        basePrice: '25.00',
        pricingTiers: [{ min_quantity: '10', unit_price: '20.00' }],
        unitOfMeasure: 'UND',
        promotion,
        quantity,
      },
    })

  const totalOf = (state: CartState) => computeCartTotals(state.lines, state.payments).total

  it('ADD_LINE guarda la promoción del ítem y el total ya la descuenta', () => {
    const state = addCap(promo20)
    expect(state.lines[0].promotion).toEqual(promo20)
    // La promoción no es descuento manual: discountAmount sigue en null.
    expect(state.lines[0].discountAmount).toBeNull()
    expect(totalOf(state)).toBeCloseTo(20)
  })

  it('agregar el mismo producto otra vez recalcula la promoción sobre la nueva cantidad', () => {
    let state = addCap(promo20)
    state = cartReducer(state, {
      type: 'ADD_LINE',
      line: { ...state.lines[0], quantity: '1' },
    })
    expect(state.lines).toHaveLength(1)
    expect(totalOf(state)).toBeCloseTo(40)
  })

  it('al cambiar la cantidad, la promoción se calcula sobre el precio del tramo', () => {
    let state = addCap(promo20)
    state = cartReducer(state, { type: 'SET_LINE_QUANTITY', variantId: 1, quantity: '10' })
    // 10 x 20.00 (tramo) = 200.00; -20% = 160.00
    expect(state.lines[0].unitPrice).toBe('20.00')
    expect(totalOf(state)).toBeCloseTo(160)
  })

  it('un descuento manual gana sobre la promoción y al quitarlo vuelve la promoción', () => {
    let state = cartReducer(addCap(promo20), {
      type: 'SET_LINE_DISCOUNT',
      variantId: 1,
      discountPercent: '10',
    })
    expect(state.lines[0].discountAmount).toBe('2.50')
    expect(totalOf(state)).toBeCloseTo(22.5)

    state = cartReducer(state, { type: 'SET_LINE_DISCOUNT', variantId: 1, discountPercent: null })
    expect(totalOf(state)).toBeCloseTo(20)
  })

  it('la promoción no cuenta contra el tope de descuento del rol', () => {
    const state = addCap(promo20)
    expect(exceedsDiscountLimit(state.lines, { maxPercent: 0, unlimited: false })).toBe(false)
  })

  it('el payload no manda discount_amount con solo promoción: la resuelve el backend', () => {
    const state = addCap(promo20)
    const payload = toSaleCreateInput({
      ...state,
      customerId: 1,
      cashSessionId: 1,
      payments: [{ method: 'CASH', amount: '20.00' }],
    })
    expect(payload?.lines[0]).toEqual({ variant_id: 1, quantity: '1' })
  })

  it('el payload sí manda discount_amount cuando el cajero da un descuento manual', () => {
    const state = cartReducer(addCap(promo20), {
      type: 'SET_LINE_DISCOUNT',
      variantId: 1,
      discountPercent: '10',
    })
    const payload = toSaleCreateInput({ ...state, customerId: 1, cashSessionId: 1 })
    expect(payload?.lines[0]).toEqual({ variant_id: 1, quantity: '1', discount_amount: '2.50' })
  })
})
