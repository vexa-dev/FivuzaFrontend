import { ApiError } from './apiClient'
import { getErrorMessage, getThrottleMessage } from './errorMessage'

describe('getErrorMessage', () => {
  it('devuelve el fallback cuando el error no es un ApiError', () => {
    expect(getErrorMessage(new Error('otra cosa'), 'Fallback')).toBe('Fallback')
  })

  it('prioriza body.error.message', () => {
    const error = new ApiError(400, { error: { message: 'Mensaje del backend' } })
    expect(getErrorMessage(error, 'Fallback')).toBe('Mensaje del backend')
  })

  it('usa body.message cuando no hay body.error.message', () => {
    const error = new ApiError(400, { message: 'Mensaje directo' })
    expect(getErrorMessage(error, 'Fallback')).toBe('Mensaje directo')
  })

  it('usa body.detail cuando no hay message', () => {
    const error = new ApiError(404, { detail: 'No encontrado' })
    expect(getErrorMessage(error, 'Fallback')).toBe('No encontrado')
  })

  it('extrae el primer mensaje de un error de validacion de DRF ({campo: [msg]})', () => {
    const error = new ApiError(400, { email: ['Este campo es requerido.'] })
    expect(getErrorMessage(error, 'Fallback')).toBe('Este campo es requerido.')
  })

  it('no deja que un string suelto a nivel raiz (ej. un trace_id) le gane al mensaje real', () => {
    const error = new ApiError(400, {
      trace_id: 'abc-123-no-es-un-mensaje',
      email: ['Este campo es requerido.'],
    })
    expect(getErrorMessage(error, 'Fallback')).toBe('Este campo es requerido.')
  })

  it('cae al fallback si el body no tiene ningun string dentro de un array', () => {
    const error = new ApiError(400, { trace_id: 'abc-123-no-es-un-mensaje' })
    expect(getErrorMessage(error, 'Fallback')).toBe('Fallback')
  })

  it('devuelve el fallback si el body es null', () => {
    const error = new ApiError(500, null)
    expect(getErrorMessage(error, 'Fallback')).toBe('Fallback')
  })
})

describe('getThrottleMessage (429)', () => {
  const drfDetail = (seconds: number) => ({
    error: {
      code: 'THROTTLED',
      message: `Request was throttled. Expected available in ${seconds} seconds.`,
    },
  })

  it('devuelve null si el error no es un 429', () => {
    expect(getThrottleMessage(new ApiError(400, {}))).toBeNull()
    expect(getThrottleMessage(new Error('red'))).toBeNull()
  })

  it('usa los segundos de Retry-After', () => {
    const error = new ApiError(429, drfDetail(59), 42)
    expect(getThrottleMessage(error)).toBe(
      'Demasiados intentos. Espera 42 segundos e intenta de nuevo.',
    )
  })

  it('sin Retry-After saca los segundos del detalle de DRF', () => {
    expect(getThrottleMessage(new ApiError(429, drfDetail(17)))).toBe(
      'Demasiados intentos. Espera 17 segundos e intenta de nuevo.',
    )
    expect(getThrottleMessage(new ApiError(429, { detail: 'Expected available in 1 second.' }))).toBe(
      'Demasiados intentos. Espera 1 segundo e intenta de nuevo.',
    )
  })

  it('redondea a minutos una espera de 60 segundos o más', () => {
    expect(getThrottleMessage(new ApiError(429, null, 60))).toBe(
      'Demasiados intentos. Espera un minuto e intenta de nuevo.',
    )
    expect(getThrottleMessage(new ApiError(429, null, 125))).toBe(
      'Demasiados intentos. Espera 3 minutos e intenta de nuevo.',
    )
  })

  it('sin dato de espera pide un minuto', () => {
    expect(getThrottleMessage(new ApiError(429, null))).toBe(
      'Demasiados intentos. Espera un minuto e intenta de nuevo.',
    )
  })

  it('getErrorMessage prefiere el mensaje en español al detalle en inglés de DRF', () => {
    expect(getErrorMessage(new ApiError(429, drfDetail(30)), 'Fallback')).toBe(
      'Demasiados intentos. Espera 30 segundos e intenta de nuevo.',
    )
  })
})
