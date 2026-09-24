import { round2, toTwoDecimals } from './decimals'

describe('round2 (espejo de core.decimals.round2 del backend)', () => {
  it('redondea a 2 decimales medio hacia arriba en el empate', () => {
    expect(round2(1.575)).toBe(1.58)
    expect(round2(8.925)).toBe(8.93)
    expect(round2(0.755)).toBe(0.76)
  })

  it('no lo arruina el punto flotante (1.005 * 100 = 100.49999...)', () => {
    expect(round2(1.005)).toBe(1.01)
    expect(round2(0.1 + 0.2)).toBe(0.3)
  })

  it('por debajo del empate redondea hacia abajo', () => {
    expect(round2(12.954)).toBe(12.95)
    expect(round2(1.37375)).toBe(1.37)
  })

  it('en negativos el empate se aleja del cero, como ROUND_HALF_UP de Python', () => {
    expect(round2(-1.575)).toBe(-1.58)
    expect(round2(-12.954)).toBe(-12.95)
  })

  it('deja igual un valor que ya tiene 2 decimales', () => {
    expect(round2(20)).toBe(20)
    expect(round2(0)).toBe(0)
  })
})

describe('toTwoDecimals', () => {
  it('no deja escribir un tercer decimal', () => {
    expect(toTwoDecimals('12.345')).toBe('12.34')
    expect(toTwoDecimals('1.2')).toBe('1.2')
  })

  it('acepta coma como separador decimal', () => {
    expect(toTwoDecimals('3,5')).toBe('3.5')
  })

  it('deja pasar los estados intermedios de quien está tecleando', () => {
    expect(toTwoDecimals('')).toBe('')
    expect(toTwoDecimals('12.')).toBe('12.')
    expect(toTwoDecimals('-')).toBe('-')
  })

  it('descarta lo que no es un número', () => {
    expect(toTwoDecimals('abc')).toBe('')
    expect(toTwoDecimals('12a')).toBe('12')
  })
})
