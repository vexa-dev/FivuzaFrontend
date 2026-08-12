import { ApiError } from '../utils/apiClient'
import { offlineDB, type PendingSale } from './db'
import { getLastSyncedAt, retryFailedSale, syncPendingSales } from './syncService'

jest.mock('../../features/sales/api', () => ({
  syncSales: jest.fn(),
}))
jest.mock('./db', () => ({
  offlineDB: {
    pendingSales: {
      where: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { syncSales } = jest.requireMock('../../features/sales/api') as {
  syncSales: jest.Mock
}

function pendingSale(overrides: Partial<PendingSale> = {}): PendingSale {
  return {
    clientSideUuid: 'uuid-1',
    customerId: 1,
    cashSessionId: 1,
    lines: [],
    payments: [],
    total: '20.00',
    createdAt: '2026-08-12T10:00:00Z',
    status: 'PENDING',
    ...overrides,
  }
}

function mockPendingQueue(sales: PendingSale[]) {
  const mockPendingSales = offlineDB.pendingSales as unknown as {
    where: jest.Mock
  }
  mockPendingSales.where.mockReturnValue({
    equals: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(sales) }),
  })
}

describe('syncPendingSales', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('no llama a syncSales cuando no hay ventas pendientes', async () => {
    mockPendingQueue([])

    const summary = await syncPendingSales()

    expect(syncSales).not.toHaveBeenCalled()
    expect(summary).toEqual({ created: 0, duplicates: 0, failed: 0, conflicts: [] })
  })

  it('cuenta CREATED/DUPLICATE_IGNORED/FAILED y borra del queue las que ya no estan pendientes', async () => {
    const sales = [pendingSale({ clientSideUuid: 'a' }), pendingSale({ clientSideUuid: 'b' }), pendingSale({ clientSideUuid: 'c' })]
    mockPendingQueue(sales)
    syncSales.mockResolvedValue({
      synced: [
        { client_side_uuid: 'a', status: 'CREATED', sale_id: 1 },
        { client_side_uuid: 'b', status: 'DUPLICATE_IGNORED' },
        { client_side_uuid: 'c', status: 'FAILED', error: 'sin cliente' },
      ],
      conflicts: [],
    })

    const summary = await syncPendingSales()

    expect(summary).toEqual({ created: 1, duplicates: 1, failed: 1, conflicts: [] })
    expect(offlineDB.pendingSales.delete).toHaveBeenCalledWith('a')
    expect(offlineDB.pendingSales.delete).toHaveBeenCalledWith('b')
    expect(offlineDB.pendingSales.update).toHaveBeenCalledWith('c', {
      status: 'FAILED',
      error: 'sin cliente',
    })
  })

  it('marca la hora de ultima sincronizacion incluso cuando el lote trae puros duplicados', async () => {
    mockPendingQueue([pendingSale()])
    syncSales.mockResolvedValue({
      synced: [{ client_side_uuid: 'uuid-1', status: 'DUPLICATE_IGNORED' }],
      conflicts: [],
    })

    await syncPendingSales()

    expect(getLastSyncedAt()).not.toBeNull()
  })

  it('propaga conflictos de oversell tal cual vienen del backend', async () => {
    mockPendingQueue([pendingSale()])
    const conflicts = [{ client_side_uuid: 'uuid-1', variant_id: 5, oversell_flag: true as const }]
    syncSales.mockResolvedValue({
      synced: [{ client_side_uuid: 'uuid-1', status: 'CREATED' }],
      conflicts,
    })

    const summary = await syncPendingSales()

    expect(summary.conflicts).toEqual(conflicts)
  })

  it('cuando el request entero es rechazado (400 DRF), marca FAILED solo los items con error y sincroniza igual', async () => {
    const sales = [pendingSale({ clientSideUuid: 'a' }), pendingSale({ clientSideUuid: 'b' })]
    mockPendingQueue(sales)
    syncSales.mockRejectedValue(new ApiError(400, [{ customer_id: ['no existe'] }, {}]))

    const summary = await syncPendingSales()

    expect(summary).toEqual({ created: 0, duplicates: 0, failed: 1, conflicts: [] })
    expect(offlineDB.pendingSales.update).toHaveBeenCalledWith('a', {
      status: 'FAILED',
      error: JSON.stringify({ customer_id: ['no existe'] }),
    })
    expect(offlineDB.pendingSales.update).not.toHaveBeenCalledWith('b', expect.anything())
    expect(getLastSyncedAt()).not.toBeNull()
  })

  it('cuando el error 400 no trae un array paralelo por item, marca todas las pendientes como FAILED', async () => {
    const sales = [pendingSale({ clientSideUuid: 'a' }), pendingSale({ clientSideUuid: 'b' })]
    mockPendingQueue(sales)
    syncSales.mockRejectedValue(new ApiError(400, { detail: 'error inesperado' }))

    const summary = await syncPendingSales()

    expect(summary.failed).toBe(2)
    expect(offlineDB.pendingSales.update).toHaveBeenCalledTimes(2)
  })

  it('relanza errores que no son ApiError (ej. de red) sin tocar el queue', async () => {
    mockPendingQueue([pendingSale()])
    syncSales.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(syncPendingSales()).rejects.toThrow('Failed to fetch')
    expect(offlineDB.pendingSales.update).not.toHaveBeenCalled()
  })
})

describe('retryFailedSale', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('devuelve null cuando la venta ya no esta en el queue', async () => {
    ;(offlineDB.pendingSales.get as jest.Mock).mockResolvedValue(undefined)

    const result = await retryFailedSale('no-existe')

    expect(result).toBeNull()
    expect(syncSales).not.toHaveBeenCalled()
  })

  it('borra la venta del queue cuando el reintento la crea exitosamente', async () => {
    ;(offlineDB.pendingSales.get as jest.Mock).mockResolvedValue(pendingSale())
    syncSales.mockResolvedValue({
      synced: [{ client_side_uuid: 'uuid-1', status: 'CREATED', sale_id: 9 }],
      conflicts: [],
    })

    const result = await retryFailedSale('uuid-1')

    expect(result).toEqual({ client_side_uuid: 'uuid-1', status: 'CREATED', sale_id: 9 })
    expect(offlineDB.pendingSales.delete).toHaveBeenCalledWith('uuid-1')
  })

  it('marca FAILED de nuevo cuando el reintento vuelve a fallar', async () => {
    ;(offlineDB.pendingSales.get as jest.Mock).mockResolvedValue(pendingSale())
    syncSales.mockRejectedValue(new ApiError(400, [{ customer_id: ['eliminado'] }]))

    const result = await retryFailedSale('uuid-1')

    expect(result).toEqual({
      client_side_uuid: 'uuid-1',
      status: 'FAILED',
      error: JSON.stringify({ customer_id: ['eliminado'] }),
    })
    expect(offlineDB.pendingSales.update).toHaveBeenCalledWith('uuid-1', {
      status: 'FAILED',
      error: JSON.stringify({ customer_id: ['eliminado'] }),
    })
  })
})
