import { ApiError } from './apiClient'

jest.mock('../../features/auth/hooks/session', () => ({
  setAccessToken: jest.fn(),
  clearSession: jest.fn(),
  getSessionEpoch: jest.fn(() => 0),
  isImpersonationExpired: jest.fn(() => false),
}))

import * as session from '../../features/auth/hooks/session'
import { tenantApiFetch } from './tenantApiClient'

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
  } as unknown as Response
}

describe('tenantApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(session.getSessionEpoch).mockReturnValue(0)
    jest.mocked(session.isImpersonationExpired).mockReturnValue(false)
    globalThis.fetch = jest.fn()
  })

  it('sigue next hasta agotar todas las paginas y concatena los resultados', async () => {
    const page1 = {
      count: 3,
      next: 'http://tenant1.localhost:8000/api/v1/things/?page=2',
      previous: null,
      results: [{ id: 1 }],
    }
    const page2 = {
      count: 3,
      next: 'http://tenant1.localhost:8000/api/v1/things/?page=3',
      previous: null,
      results: [{ id: 2 }],
    }
    const page3 = { count: 3, next: null, previous: null, results: [{ id: 3 }] }
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(page1))
      .mockResolvedValueOnce(jsonResponse(page2))
      .mockResolvedValueOnce(jsonResponse(page3))

    const result = await tenantApiFetch('/things/', { token: 'tok' })
    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  it('con unwrapPagination:false devuelve solo el sobre de la primera pagina', async () => {
    const page1 = {
      count: 3,
      next: 'http://tenant1.localhost:8000/api/v1/things/?page=2',
      previous: null,
      results: [{ id: 1 }],
    }
    ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(page1))

    const result = await tenantApiFetch('/things/', { token: 'tok', unwrapPagination: false })
    expect(result).toEqual(page1)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('en un 401 renueva el token una sola vez y reintenta el request original', async () => {
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(null, false, 401))
      .mockResolvedValueOnce(jsonResponse({ access: 'nuevo-token' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))

    const result = await tenantApiFetch('/things/1/', { token: 'viejo' })
    expect(result).toEqual({ ok: true })
    expect(session.setAccessToken).toHaveBeenCalledWith('nuevo-token')
    const retryCall = (globalThis.fetch as jest.Mock).mock.calls[2]
    expect(retryCall[1].headers.Authorization).toBe('Bearer nuevo-token')
  })

  it('dos 401 concurrentes disparan un solo refresh (single-flight)', async () => {
    let resolveRefresh: (value: Response) => void
    const refreshPromise = new Promise<Response>((resolve) => {
      resolveRefresh = resolve
    })
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(null, false, 401))
      .mockResolvedValueOnce(jsonResponse(null, false, 401))
      .mockImplementationOnce(() => refreshPromise)
      .mockResolvedValueOnce(jsonResponse({ ok: 1 }))
      .mockResolvedValueOnce(jsonResponse({ ok: 2 }))

    const call1 = tenantApiFetch('/a/', { token: 'viejo' })
    const call2 = tenantApiFetch('/b/', { token: 'viejo' })
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    resolveRefresh!(jsonResponse({ access: 'nuevo-token' }))

    await Promise.all([call1, call2])
    const refreshCalls = (globalThis.fetch as jest.Mock).mock.calls.filter(([url]) =>
      String(url).includes('/auth/refresh/'),
    )
    expect(refreshCalls).toHaveLength(1)
  })

  it('si la sesion se cierra mientras el refresh esta en vuelo, no revive el token', async () => {
    jest.mocked(session.getSessionEpoch).mockReturnValueOnce(0).mockReturnValueOnce(1)
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(null, false, 401))
      .mockResolvedValueOnce(jsonResponse({ access: 'nuevo-token' }))

    await expect(tenantApiFetch('/things/1/', { token: 'viejo' })).rejects.toBeInstanceOf(ApiError)
    expect(session.setAccessToken).not.toHaveBeenCalled()
  })

  it('si la impersonacion ya expiro, corta el refresh y limpia la sesion', async () => {
    jest.mocked(session.isImpersonationExpired).mockReturnValue(true)
    ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(null, false, 401))

    await expect(tenantApiFetch('/things/1/', { token: 'viejo' })).rejects.toBeInstanceOf(ApiError)
    expect(session.clearSession).toHaveBeenCalled()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })
})
