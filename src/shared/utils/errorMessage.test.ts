import { ApiError } from './apiClient'
import { getErrorMessage } from './errorMessage'

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
