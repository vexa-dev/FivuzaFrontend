import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CashMovement, CashSession } from '../api'
import { useCloseCashSession } from '../hooks/useCashSessions'
import { CloseCashSessionModal } from './CloseCashSessionModal'

jest.mock('../hooks/useCashSessions', () => ({
  useCloseCashSession: jest.fn(),
}))

const mutateAsync = jest.fn()

function session(overrides: Partial<CashSession> = {}): CashSession {
  return {
    id: 7,
    cash_register: 1,
    user: 1,
    opening_amount: '50.0000',
    opening_at: '2026-09-18T13:00:00Z',
    expected_closing_amount: null,
    expected_amount_so_far: '135.0000',
    counted_closing_amount: null,
    difference: null,
    status: 'OPEN',
    closing_at: null,
    notes: null,
    ...overrides,
  }
}

function movement(type: 'IN' | 'OUT', amount: string): CashMovement {
  return { id: Math.random(), cash_session: 7, type, amount } as unknown as CashMovement
}

describe('CloseCashSessionModal', () => {
  beforeEach(() => {
    mutateAsync.mockReset()
    jest.mocked(useCloseCashSession).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCloseCashSession>)
  })

  it('usa el esperado del backend, que incluye las ventas en efectivo', () => {
    // 50 apertura + 10 ingreso - 5 egreso = 55 sin ventas; el backend
    // informa 135, asi que hubo 80 en ventas en efectivo.
    render(
      <CloseCashSessionModal
        session={session()}
        movements={[movement('IN', '10.00'), movement('OUT', '5.00')]}
        onClose={jest.fn()}
      />,
    )

    expect(screen.getByText('Ventas en efectivo').nextSibling).toHaveTextContent('80.00')
    expect(screen.getByText('Esperado (estimado)').nextSibling).toHaveTextContent('135.00')
  })

  it('sin el esperado del backend el arqueo va a ciegas (Bloque A.3)', () => {
    // El backend omite el esperado cuando quien cierra no controla la caja:
    // el modal no lo estima localmente, porque esa estimacion seria la
    // misma pista que el control busca quitar.
    render(
      <CloseCashSessionModal
        session={session({ expected_amount_so_far: null })}
        movements={[movement('IN', '10.00'), movement('OUT', '5.00')]}
        onClose={jest.fn()}
      />,
    )

    expect(screen.queryByText('Ventas en efectivo')).not.toBeInTheDocument()
    expect(screen.queryByText('Esperado (estimado)')).not.toBeInTheDocument()
    expect(screen.queryByText('55.00')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
  })

  it('al cerrar a ciegas solo confirma lo contado', async () => {
    mutateAsync.mockResolvedValue(
      session({
        status: 'CLOSED',
        expected_closing_amount: null,
        counted_closing_amount: '130.0000',
        difference: null,
      }),
    )
    render(
      <CloseCashSessionModal
        session={session({ expected_amount_so_far: null })}
        movements={[]}
        onClose={jest.fn()}
      />,
    )

    await userEvent.type(screen.getByLabelText(/Monto contado/), '130')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))

    expect(await screen.findByText('Caja cerrada')).toBeInTheDocument()
    expect(screen.getByText('130.0000')).toBeInTheDocument()
    expect(screen.queryByText('Diferencia')).not.toBeInTheDocument()
    expect(screen.queryByText('Esperado')).not.toBeInTheDocument()
  })

  it('exige el monto contado y muestra la diferencia al cerrar', async () => {
    mutateAsync.mockResolvedValue(
      session({
        status: 'CLOSED',
        expected_closing_amount: '135.0000',
        counted_closing_amount: '130.0000',
        difference: '-5.0000',
      }),
    )
    render(<CloseCashSessionModal session={session()} movements={[]} onClose={jest.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Ingresa el monto contado.')
    expect(mutateAsync).not.toHaveBeenCalled()

    await userEvent.type(screen.getByLabelText(/Monto contado/), '130')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))

    expect(mutateAsync).toHaveBeenCalledWith({ sessionId: 7, countedClosingAmount: '130', notes: '' })
    expect(await screen.findByText('Caja cerrada')).toBeInTheDocument()
    expect(screen.getByText('-5.0000')).toBeInTheDocument()
  })
})
