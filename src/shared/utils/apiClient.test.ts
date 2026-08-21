jest.mock('../../features/core/hooks/session', () => ({
  setAccessToken: jest.fn(),
  clearTokens: jest.fn(),
  getSessionEpoch: jest.fn(() => 0),
}))

import * as session from '../../features/core/hooks/session'
import { ApiError, apiFetch } from './apiClient'

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
  } as unknown as Response
}

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(session.getSessionEpoch).mockReturnValue(0)
    globalThis.fetch = jest.fn()
  })

  it('con unwrapPagination:true sigue next y devuelve todos los resultados (no solo la pagina 1)', async () => {
    const page1 = {
      count: 2,
      next: 'http://localhost:8000/api/v1/things/?page=2',
      previous: null,
      results: [{ id: 1 }],
    }
    const page2 = { count: 2, next: null, previous: null, results: [{ id: 2 }] }
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(page1))
      .mockResolvedValueOnce(jsonResponse(page2))

    const result = await apiFetch('/things/', { token: 'tok', unwrapPagination: true })
    expect(result).toEqual([{ id: 1 }, { id: 2 }])
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  it('sin unwrapPagination devuelve el sobre de paginacion crudo', async () => {
    const page1 = {
      count: 2,
      next: 'http://localhost:8000/api/v1/things/?page=2',
      previous: null,
      results: [{ id: 1 }],
    }
    ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(page1))

    const result = await apiFetch('/things/', { token: 'tok' })
    expect(result).toEqual(page1)
  })

  it('en un 401 renueva el token una sola vez y reintenta el request original fuera del try del refresh', async () => {
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(null, false, 401))
      .mockResolvedValueOnce(jsonResponse({ access: 'nuevo-token' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))

    const result = await apiFetch('/things/1/', { token: 'viejo' })
    expect(result).toEqual({ ok: true })
    expect(session.setAccessToken).toHaveBeenCalledWith('nuevo-token')
  })

  it('si el reintento tras el refresh falla, el error no queda enmascarado por el 401 original', async () => {
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(null, false, 401))
      .mockResolvedValueOnce(jsonResponse({ access: 'nuevo-token' }))
      .mockResolvedValueOnce(jsonResponse({ detail: 'error del servidor' }, false, 500))

    await expect(apiFetch('/things/1/', { token: 'viejo' })).rejects.toMatchObject({
      status: 500,
    })
  })

  it('si la sesion se cierra mientras el refresh esta en vuelo, no revive el token', async () => {
    jest.mocked(session.getSessionEpoch).mockReturnValueOnce(0).mockReturnValueOnce(1)
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(null, false, 401))
      .mockResolvedValueOnce(jsonResponse({ access: 'nuevo-token' }))

    await expect(apiFetch('/things/1/', { token: 'viejo' })).rejects.toBeInstanceOf(ApiError)
    expect(session.setAccessToken).not.toHaveBeenCalled()
  })
})
