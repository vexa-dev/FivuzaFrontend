import { ApiError } from './apiClient'

/** Extrae el mensaje legible de un error de mutacion -mismo shape que ya
 * usaban a mano VoidSaleModal/CustomerFormModal (body.error.message del
 * backend), centralizado aca para que los hooks de mutacion puedan pasarlo
 * directo a un toast sin repetir el cast en cada archivo. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const body = error.body as { error?: { message?: string } } | null
    if (body?.error?.message) {
      return body.error.message
    }
  }
  return fallback
}
