import { ApiError } from './apiClient'

/** Extrae el mensaje legible de un error de mutacion -mismo shape que ya
 * usaban a mano VoidSaleModal/CustomerFormModal (body.error.message del
 * backend), centralizado aca para que los hooks de mutacion puedan pasarlo
 * directo a un toast sin repetir el cast en cada archivo. */
export function getErrorMessage(error: unknown, fallback: string): string {
  const throttleMessage = getThrottleMessage(error)
  if (throttleMessage) return throttleMessage

  if (error instanceof ApiError) {
    const body = error.body as {
      error?: { message?: string }
      message?: string
      detail?: string
      [key: string]: unknown
    } | null
    if (body?.error?.message) {
      return body.error.message
    }
    if (typeof body?.message === 'string') return body.message
    if (typeof body?.detail === 'string') return body.detail

    const fieldMessage = firstValidationMessage(body)
    if (fieldMessage) return fieldMessage
  }
  return fallback
}

// Solo acepta un string encontrado DENTRO de un array -el shape real de un
// error de validacion de DRF es {"campo": ["mensaje"]}. Un string suelto a
// nivel raiz (ej. un "code"/"trace_id" del mismo body) no es un mensaje de
// validacion y no deberia poder "ganarle" al mensaje real.
function firstValidationMessage(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string') return item
      const message = firstValidationMessage(item)
      if (message) return message
    }
    return null
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      const message = firstValidationMessage(item)
      if (message) return message
    }
  }
  return null
}

/** Mensaje para un 429 (throttling de DRF: login, autorizacion de supervisor,
 * escrituras de negocio). El detalle de DRF viene en ingles ("Request was
 * throttled. Expected available in 42 seconds."), asi que no se muestra tal
 * cual: solo se le sacan los segundos si no vino la cabecera Retry-After.
 * Devuelve null si el error no es un 429. */
export function getThrottleMessage(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.status !== 429) return null
  const seconds = error.retryAfterSeconds ?? secondsFromThrottleDetail(error.body)
  return `Demasiados intentos. Espera ${formatWait(seconds)} e intenta de nuevo.`
}

function secondsFromThrottleDetail(body: unknown): number | null {
  const data = body as { error?: { message?: unknown }; detail?: unknown } | null
  const detail = data?.error?.message ?? data?.detail
  if (typeof detail !== 'string') return null
  const match = /(\d+)\s*(?:seconds?|segundos?)/i.exec(detail)
  return match ? Number(match[1]) : null
}

function formatWait(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return 'un minuto'
  if (seconds === 1) return '1 segundo'
  if (seconds < 60) return `${seconds} segundos`
  const minutes = Math.ceil(seconds / 60)
  return minutes === 1 ? 'un minuto' : `${minutes} minutos`
}
