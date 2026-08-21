import { collectAllPages, isPaginatedResponse } from './pagination'
import { createSingleFlightRefresher } from './singleFlightRefresh'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, body: unknown) {
    super(`Error de API (${status})`)
    this.status = status
    this.body = body
  }
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
    throw new ApiError(response.status, data)
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
    throw new ApiError(response.status, data)
  }

  if (options.unwrapPagination && isPaginatedResponse<unknown>(data)) {
    return (await collectAllPages(data, (next) => fetchJson(next, headers))) as T
  }
  return data as T
}

const refreshPlatformSession = createSingleFlightRefresher(() =>
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
