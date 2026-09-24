import { lineGross, roundMoney } from './money'

describe('roundMoney (espejo de round_money del backend)', () => {
  it('redondea a céntimos con HALF_UP en el empate', () => {
    expect(roundMoney(1.575)).toBe(1.58)
    expect(roundMoney(8.925)).toBe(8.93)
    expect(roundMoney(0.755)).toBe(0.76)
  })

  it('no lo arruina el punto flotante (1.005 * 100 = 100.49999...)', () => {
    expect(roundMoney(1.005)).toBe(1.01)
    expect(roundMoney(0.1 + 0.2)).toBe(0.3)
  })

  it('por debajo del empate redondea hacia abajo', () => {
    expect(roundMoney(12.954)).toBe(12.95)
    expect(roundMoney(1.37375)).toBe(1.37)
  })

  it('deja igual un monto que ya está en céntimos', () => {
    expect(roundMoney(20)).toBe(20)
    expect(roundMoney(0)).toBe(0)
  })
})

describe('lineGross', () => {
  it('precio × cantidad por KG, redondeado a céntimos', () => {
    // 1.234 kg x 10.50 = 12.957
    expect(lineGross('10.5000', '1.234')).toBe(12.96)
  })
})
