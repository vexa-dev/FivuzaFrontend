import { formatCurrency, formatQuantity, formatRelativeTime } from './format'

describe('formatCurrency', () => {
  it('formatea un string del backend con prefijo S/ y 2 decimales', () => {
    expect(formatCurrency('11.00')).toBe('S/ 11.00')
    expect(formatCurrency('29.9')).toBe('S/ 29.90')
  })

  it('acepta numeros directamente', () => {
    expect(formatCurrency(100)).toBe('S/ 100.00')
  })

  it('redondea a 2 decimales en vez de truncar', () => {
    expect(formatCurrency('19.995')).toBe('S/ 20.00')
  })

  it('redondea medio hacia arriba aunque el punto flotante no ayude', () => {
    // (1.005).toFixed(2) da "1.00": el sistema redondea con round2.
    expect(formatCurrency(1.005)).toBe('S/ 1.01')
  })
})

describe('formatQuantity', () => {
  it('muestra un entero sin decimales para cantidades por unidad', () => {
    expect(formatQuantity('3.00')).toBe('3')
  })

  it('muestra hasta 2 decimales para cantidades fraccionarias (productos por peso)', () => {
    expect(formatQuantity('5.50')).toBe('5.50')
  })

  it('acepta numeros directamente', () => {
    expect(formatQuantity(2)).toBe('2')
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-12T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('muestra "ahora" para menos de un minuto', () => {
    expect(formatRelativeTime('2026-08-12T11:59:30Z')).toBe('ahora')
  })

  it('muestra minutos para menos de una hora', () => {
    expect(formatRelativeTime('2026-08-12T11:45:00Z')).toBe('hace 15 min')
  })

  it('muestra horas para menos de un dia', () => {
    expect(formatRelativeTime('2026-08-12T09:00:00Z')).toBe('hace 3 h')
  })

  it('muestra dias para un dia o mas', () => {
    expect(formatRelativeTime('2026-08-10T12:00:00Z')).toBe('hace 2 d')
  })
})
