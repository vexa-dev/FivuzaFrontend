import type { POSPromotion } from '../api'
import { promotionDiscount, promotionLabel } from './promotion'

// El catálogo del POS manda value como str(Decimal) del backend (4 decimales).
function promo(type: POSPromotion['type'], value: string): POSPromotion {
  return { id: 1, name: 'Promo', type, value }
}

describe('promotionDiscount (espejo de SaleService._resolve_promotion_discount)', () => {
  it('sin promoción no hay descuento', () => {
    expect(promotionDiscount('25.00', '2', null)).toBe(0)
  })

  it('PERCENTAGE descuenta ese % del subtotal de la línea', () => {
    expect(promotionDiscount('25.00', '2', promo('PERCENTAGE', '20.00'))).toBeCloseTo(10)
  })

  it('PERCENTAGE aplica sobre cantidades fraccionarias (productos por KG)', () => {
    // 1.5 kg x 8.00 = 12.00; 25% = 3.00
    expect(promotionDiscount('8.00', '1.50', promo('PERCENTAGE', '25.00'))).toBeCloseTo(3)
  })

  it('PERCENTAGE redondea a céntimos con HALF_UP, igual que el backend', () => {
    // 15% de 10.50 = 1.575 -> 1.58.
    expect(promotionDiscount('10.50', '1', promo('PERCENTAGE', '15.00'))).toBe(1.58)
  })

  it('PERCENTAGE aplica sobre el subtotal ya redondeado', () => {
    // 1.25 kg x 10.50 = 13.125 -> 13.13; 50% de 13.13 = 6.565 -> 6.57
    // (sobre el subtotal sin redondear daría 6.5625 -> 6.56).
    expect(promotionDiscount('10.50', '1.25', promo('PERCENTAGE', '50.00'))).toBe(6.57)
  })

  it('FIXED_AMOUNT por cantidad fraccionaria redondea a céntimos', () => {
    // S/ 1.50 por kg x 1.25 kg = 1.875 -> 1.88
    expect(promotionDiscount('4.00', '1.25', promo('FIXED_AMOUNT', '1.50'))).toBe(1.88)
  })

  it('FIXED_AMOUNT es un monto por unidad', () => {
    expect(promotionDiscount('25.00', '3', promo('FIXED_AMOUNT', '2.00'))).toBeCloseTo(6)
  })

  it('FIXED_AMOUNT nunca pasa el subtotal de la línea', () => {
    expect(promotionDiscount('5.00', '2', promo('FIXED_AMOUNT', '8.00'))).toBe(10)
  })
})

describe('promotionLabel', () => {
  it('muestra el porcentaje sin ceros de sobra', () => {
    expect(promotionLabel(promo('PERCENTAGE', '20.00'))).toBe('-20%')
  })

  it('muestra el monto fijo en soles con 2 decimales', () => {
    expect(promotionLabel(promo('FIXED_AMOUNT', '2.50'))).toBe('-S/ 2.50')
  })
})
