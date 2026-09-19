import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PendingSale } from '../../../shared/offline/db'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { SyncStatusModal } from './SyncStatusModal'

jest.mock('../hooks/useOfflineSync', () => ({
  useOfflineSync: jest.fn(),
}))

function sale(overrides: Partial<PendingSale> = {}): PendingSale {
  return {
    clientSideUuid: 'uuid-1',
    customerId: 1,
    cashSessionId: 1,
    lines: [],
    payments: [],
    total: '20.00',
    createdAt: '2026-09-18T20:40:00Z',
    status: 'PENDING',
    ...overrides,
  }
}

function mockSync(overrides: Partial<ReturnType<typeof useOfflineSync>> = {}) {
  const value = {
    isOnline: true,
    pendingSales: [],
    failedSales: [],
    lastSyncedAt: null,
    isSyncing: false,
    syncNow: jest.fn(),
    retryingUuid: null,
    retrySale: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useOfflineSync>
  jest.mocked(useOfflineSync).mockReturnValue(value)
  return value
}

describe('SyncStatusModal', () => {
  it('sin cola muestra que todo esta sincronizado', () => {
    mockSync()
    render(<SyncStatusModal onClose={jest.fn()} />)

    expect(screen.getByText('No hay ventas en cola')).toBeInTheDocument()
  })

  it('permite sincronizar las pendientes cuando hay conexion', async () => {
    const sync = mockSync({ pendingSales: [sale()] })
    render(<SyncStatusModal onClose={jest.fn()} />)

    expect(screen.getByText('Pendientes (1)')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Sincronizar pendientes ahora/ }))

    expect(sync.syncNow).toHaveBeenCalledTimes(1)
  })

  it('sin conexion indica que espera conexion y no ofrece sincronizar', () => {
    mockSync({ isOnline: false, pendingSales: [sale()] })
    render(<SyncStatusModal onClose={jest.fn()} />)

    expect(screen.getByText('Esperando conexión')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Sincronizar pendientes/ })).not.toBeInTheDocument()
  })

  it('muestra el motivo de cada venta fallida y permite reintentarla sola', async () => {
    const sync = mockSync({
      failedSales: [
        sale({ clientSideUuid: 'uuid-err', status: 'FAILED', error: 'El cliente de esta venta ya no existe.' }),
      ],
    })
    render(<SyncStatusModal onClose={jest.fn()} />)

    expect(screen.getByText('El cliente de esta venta ya no existe.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }))

    expect(sync.retrySale).toHaveBeenCalledWith('uuid-err')
  })
})
