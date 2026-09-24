import { lineGross } from './money'

describe('lineGross', () => {
  it('precio × cantidad, redondeado a céntimos medio hacia arriba', () => {
    // 1.25 kg x 10.50 = 13.125
    expect(lineGross('10.50', '1.25')).toBe(13.13)
  })

  it('deja igual un subtotal que ya está en céntimos', () => {
    expect(lineGross('25.00', '2')).toBe(50)
  })
})
