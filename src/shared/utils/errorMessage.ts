import { ApiError } from './apiClient'

/** Extrae el mensaje legible de un error de mutacion -mismo shape que ya
 * usaban a mano VoidSaleModal/CustomerFormModal (body.error.message del
 * backend), centralizado aca para que los hooks de mutacion puedan pasarlo
 * directo a un toast sin repetir el cast en cada archivo. */
export function getErrorMessage(error: unknown, fallback: string): string {
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

function firstValidationMessage(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    for (const item of value) {
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
