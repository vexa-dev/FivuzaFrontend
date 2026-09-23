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
    expect(promotionDiscount('25.00', '2', promo('PERCENTAGE', '20.0000'))).toBeCloseTo(10)
  })

  it('PERCENTAGE aplica sobre cantidades fraccionarias (productos por KG)', () => {
    // 1.5 kg x 8.00 = 12.00; 25% = 3.00
    expect(promotionDiscount('8.00', '1.500', promo('PERCENTAGE', '25.0000'))).toBeCloseTo(3)
  })

  it('PERCENTAGE no redondea a céntimos, igual que el backend', () => {
    // 15% de 10.50 = 1.575: el backend lo guarda así, sin redondear.
    expect(promotionDiscount('10.50', '1', promo('PERCENTAGE', '15.0000'))).toBeCloseTo(1.575, 10)
  })

  it('FIXED_AMOUNT es un monto por unidad', () => {
    expect(promotionDiscount('25.00', '3', promo('FIXED_AMOUNT', '2.0000'))).toBeCloseTo(6)
  })

  it('FIXED_AMOUNT nunca pasa el subtotal de la línea', () => {
    expect(promotionDiscount('5.00', '2', promo('FIXED_AMOUNT', '8.0000'))).toBe(10)
  })
})

describe('promotionLabel', () => {
  it('muestra el porcentaje sin ceros de sobra', () => {
    expect(promotionLabel(promo('PERCENTAGE', '20.0000'))).toBe('-20%')
  })

  it('muestra el monto fijo en soles con 2 decimales', () => {
    expect(promotionLabel(promo('FIXED_AMOUNT', '2.5000'))).toBe('-S/ 2.50')
  })
})
