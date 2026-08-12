import { formatCurrency, formatQuantity, formatRelativeTime } from './format'

describe('formatCurrency', () => {
  it('formatea un string con 4 decimales del backend a 2 decimales con prefijo S/', () => {
    expect(formatCurrency('11.0000')).toBe('S/ 11.00')
    expect(formatCurrency('29.9000')).toBe('S/ 29.90')
  })

  it('acepta numeros directamente', () => {
    expect(formatCurrency(100)).toBe('S/ 100.00')
  })

  it('redondea a 2 decimales en vez de truncar', () => {
    expect(formatCurrency('19.995')).toBe('S/ 20.00')
  })
})

describe('formatQuantity', () => {
  it('muestra un entero sin decimales para cantidades por unidad', () => {
    expect(formatQuantity('3.000')).toBe('3')
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
