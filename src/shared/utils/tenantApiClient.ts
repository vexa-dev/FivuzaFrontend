import { ApiError } from './apiClient'

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
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    throw new ApiError(response.status, data)
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

    const { getRefreshToken, setAccessToken, clearSession } = await import(
      '../../features/auth/hooks/session'
    )
    const refresh = getRefreshToken()
    if (!refresh) {
      throw error
    }

    let newAccess: string
    try {
      const refreshed = await rawFetch<{ access: string }>('/auth/refresh/', {
        method: 'POST',
        body: { refresh },
      })
      newAccess = refreshed.access
    } catch {
      clearSession()
      throw error
    }

    setAccessToken(newAccess)
    return rawFetch<T>(path, { ...options, token: newAccess })
  }
}
