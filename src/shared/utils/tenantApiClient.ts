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

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  token?: string | null
}

async function rawFetch<T>(path: string, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  const response = await fetch(`${getTenantApiUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    throw new ApiError(response.status, data)
  }

  return data as T
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
