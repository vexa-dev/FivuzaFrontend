import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTenantSettings, useUpdateTenantSettings } from '../hooks/useTenantSettings'
import { CashPolicySection } from './CashPolicySection'

jest.mock('../hooks/useTenantSettings', () => ({
  useTenantSettings: jest.fn(),
  useUpdateTenantSettings: jest.fn(),
}))

const mutate = jest.fn()

function mockSettings(overrides: Record<string, unknown> = {}) {
  jest.mocked(useTenantSettings).mockReturnValue({
    data: {
      cashier_can_open_session: false,
      cashier_can_close_session: false,
      updated_at: '2026-09-20T10:00:00Z',
      ...overrides,
    },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useTenantSettings>)
}

describe('CashPolicySection', () => {
  beforeEach(() => {
    mutate.mockReset()
    jest.mocked(useUpdateTenantSettings).mockReturnValue({
      mutate,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useUpdateTenantSettings>)
  })

  it('refleja el estado de cada interruptor', () => {
    mockSettings({ cashier_can_open_session: true })
    render(<CashPolicySection />)

    expect(screen.getByLabelText('El cajero puede abrir su caja')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByLabelText('El cajero puede entregar su caja')).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('guarda el cambio al prender un interruptor', async () => {
    mockSettings()
    render(<CashPolicySection />)

    await userEvent.click(screen.getByLabelText('El cajero puede entregar su caja'))

    expect(mutate).toHaveBeenCalledWith({ cashier_can_close_session: true })
  })
})
