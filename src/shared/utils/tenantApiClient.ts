import { ApiError } from './apiClient'
import { collectAllPages, isPaginatedResponse } from './pagination'
import { createSingleFlightRefresher } from './singleFlightRefresh'

const API_PORT = import.meta.env.VITE_API_PORT ?? '8000'

/**
 * A diferencia de core/api.ts (que usa una VITE_API_URL fija, porque el
 * panel de platform_staff siempre vive en el mismo dominio raiz), el ERP de
 * un tenant se sirve desde el subdominio de CADA negocio -la API debe
 * resolverse contra ESE mismo subdominio para que TenantMainMiddleware
 * (backend) resuelva el esquema correcto por el header Host.
 */
function getTenantApiUrl(): string {
  const { protocol, hostname } = window.location
  return `${protocol}//${hostname}:${API_PORT}/api/v1`
}

/**
 * Igual que getTenantApiUrl, pero para el WebSocket del dashboard (Sprint
 * 24, TRD §2.5) -mismo host/puerto que la API REST (Daphne sirve ambos
 * protocolos en el mismo proceso), solo cambia el esquema http(s) -> ws(s).
 */
export function getTenantWebSocketUrl(path: string): string {
  const { protocol, hostname } = window.location
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:'
  return `${wsProtocol}//${hostname}:${API_PORT}${path}`
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  token?: string | null
  /** Sigue `next` y devuelve todos los resultados concatenados. Default
   * `true` (preserva el comportamiento historico) -pasar `false` cuando el
   * llamador quiere el sobre de paginacion crudo (solo la pagina 1). */
  unwrapPagination?: boolean
}

async function fetchJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const pageResponse = await fetch(url, { headers, credentials: 'include' })
  if (!pageResponse.ok) throw new ApiError(pageResponse.status, null)
  return pageResponse.json()
}

async function rawFetch<T>(path: string, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  // FormData (subida de archivos) nunca se serializa como JSON, y el
  // Content-Type con el boundary lo pone el navegador solo -si lo fijamos
  // a mano aqui, el boundary real se pierde y el backend no puede parsear
  // el multipart.
  const isFormData = options.body instanceof FormData
  let body: BodyInit | undefined
  if (isFormData) {
    body = options.body as FormData
  } else if (options.body) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  const response = await fetch(`${getTenantApiUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body,
    credentials: 'include',
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  let data = isJson ? await response.json() : null

  if (!response.ok) {
    throw new ApiError(response.status, data)
  }

  if ((options.unwrapPagination ?? true) && isPaginatedResponse<unknown>(data)) {
    data = await collectAllPages(data, (next) => fetchJson(next, headers))
  }
  return data as T
}

/**
 * Descarga un archivo (ej. la plantilla CSV de importacion) autenticado con
 * el mismo esquema de tenant -tenantApiFetch solo sabe parsear JSON, esta
 * variante devuelve el Blob crudo para que el llamador dispare la descarga.
 */
export async function tenantApiFetchBlob(
  path: string,
  token: string | null,
): Promise<Blob> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${getTenantApiUrl()}${path}`, { headers })
  if (!response.ok) {
    throw new ApiError(response.status, null)
  }
  return response.blob()
}

/**
 * Igual que tenantApiFetchBlob, pero para respuestas text/html (el ticket
 * de venta de ReceiptService) en vez de un archivo descargable.
 */
export async function tenantApiFetchText(path: string, token: string | null): Promise<string> {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${getTenantApiUrl()}${path}`, { headers })
  if (!response.ok) {
    throw new ApiError(response.status, null)
  }
  return response.text()
}

/**
 * Igual que tenantApiFetchText, pero para endpoints que arman el HTML a
 * partir de un body (ej. la hoja de etiquetas de código de barras, Sprint
 * 27) -tenantApiFetchText solo sirve para GET.
 */
export async function tenantApiFetchTextPost(
  path: string,
  token: string | null,
  body: unknown,
): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${getTenantApiUrl()}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new ApiError(response.status, data)
  }
  return response.text()
}

const refreshTenantSession = createSingleFlightRefresher(() =>
  rawFetch<{ access: string }>('/auth/refresh/', { method: 'POST' }),
)

/**
 * Igual que rawFetch, pero si la respuesta es 401 (access token vencido) y
 * hay un refresh token disponible, intenta renovarlo UNA sola vez y repite
 * el request original -el usuario nunca ve un login inesperado solo porque
 * pasaron los 30 minutos de vida del access token (Plan de Implementacion,
 * Sprint 2: "refresh automatico ante 401").
 */
export async function tenantApiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    return await rawFetch<T>(path, options)
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !options.token) {
      throw error
    }

    const { setAccessToken, clearSession, getSessionEpoch, isImpersonationExpired } =
      await import('../../features/auth/hooks/session')

    if (isImpersonationExpired()) {
      // El backend es quien de verdad decide si el refresh procede -esto
      // solo corta antes, del lado cliente, un caso que ya sabemos invalido
      // (impersonar por mas del tope permitido).
      clearSession()
      throw error
    }

    const epochBeforeRefresh = getSessionEpoch()
    let refreshed: { access: string }
    try {
      refreshed = await refreshTenantSession()
    } catch {
      clearSession()
      throw error
    }

    if (getSessionEpoch() !== epochBeforeRefresh) {
      throw error
    }
    setAccessToken(refreshed.access)
    return rawFetch<T>(path, { ...options, token: refreshed.access })
  }
}
