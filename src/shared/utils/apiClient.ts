import { collectAllPages, isPaginatedResponse } from './pagination'
import { createSingleFlightRefresher } from './singleFlightRefresh'

// Mismo origen por defecto (nginx en produccion, proxy de Vite en dev): el
// panel interno se abre desde un dominio registrado para el esquema public
// (ej. admin.fivuza.com, o public.localhost:5173 en desarrollo).
const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

export class ApiError extends Error {
  status: number
  body: unknown
  /** Segundos de espera que pide el backend (cabecera Retry-After que DRF
   * agrega a un 429 por throttling). null si no vino o no se pudo leer. */
  retryAfterSeconds: number | null

  constructor(status: number, body: unknown, retryAfterSeconds: number | null = null) {
    super(`Error de API (${status})`)
    this.status = status
    this.body = body
    this.retryAfterSeconds = retryAfterSeconds
  }
}

/** Lee Retry-After en sus dos formas (RFC 9110): segundos enteros, que es
 * lo que manda DRF, o una fecha HTTP. Cualquier otra cosa devuelve null. */
export function parseRetryAfter(value: string | null | undefined): number | null {
  if (!value) return null
  const trimmed = value.trim()
  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  const date = Date.parse(trimmed)
  if (Number.isNaN(date)) return null
  return Math.max(0, Math.ceil((date - Date.now()) / 1000))
}

/** Arma el ApiError de una respuesta fallida, con el Retry-After si vino. */
export function apiErrorFromResponse(response: Response, body: unknown): ApiError {
  return new ApiError(response.status, body, parseRetryAfter(response.headers?.get('retry-after')))
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  token?: string | null
  unwrapPagination?: boolean
}

async function fetchJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, { headers, credentials: 'include' })
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null
  if (!response.ok) {
    throw apiErrorFromResponse(response, data)
  }
  return data
}

async function rawApiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    throw apiErrorFromResponse(response, data)
  }

  if (options.unwrapPagination && isPaginatedResponse<unknown>(data)) {
    return (await collectAllPages(data, (next) => fetchJson(next, headers))) as T
  }
  return data as T
}

/** Mismo criterio que refreshTenantSession (tenantApiClient.ts): la
 * restauracion al cargar y el reintento ante 401 comparten un solo refresh
 * en vuelo, porque el refresh rota y bloquea el token anterior. */
export const refreshPlatformSession = createSingleFlightRefresher(() =>
  rawApiFetch<{ access: string }>('/platform/auth/refresh/', { method: 'POST' }),
)

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await rawApiFetch<T>(path, options)
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !options.token) throw error

    const { setAccessToken, clearTokens, getSessionEpoch } = await import(
      '../../features/core/hooks/session'
    )
    const epochBeforeRefresh = getSessionEpoch()
    let refreshed: { access: string }
    try {
      refreshed = await refreshPlatformSession()
    } catch {
      clearTokens()
      throw error
    }

    if (getSessionEpoch() !== epochBeforeRefresh) {
      // La sesion se cerro (u otro refresh la reemplazo) mientras este
      // esperaba -no revivirla con un token que ya no corresponde.
      throw error
    }
    setAccessToken(refreshed.access)
    return rawApiFetch<T>(path, { ...options, token: refreshed.access })
  }
}
