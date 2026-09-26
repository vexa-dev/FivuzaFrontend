import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CashMovement, CashSession } from '../api'
import { useCloseCashSession, useSubmitCashSessionCount } from '../hooks/useCashSessions'
import { CloseCashSessionModal } from './CloseCashSessionModal'

jest.mock('../hooks/useCashSessions', () => ({
  useCloseCashSession: jest.fn(),
  useSubmitCashSessionCount: jest.fn(),
}))

const mutateAsync = jest.fn()
const submitAsync = jest.fn()

function session(overrides: Partial<CashSession> = {}): CashSession {
  return {
    id: 7,
    cash_register: 1,
    user: 1,
    opening_amount: '50.00',
    opening_at: '2026-09-18T13:00:00Z',
    expected_closing_amount: null,
    expected_amount_so_far: '135.00',
    counted_closing_amount: null,
    counted_at: null,
    approved_by: null,
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
    submitAsync.mockReset()
    jest.mocked(useCloseCashSession).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCloseCashSession>)
    jest.mocked(useSubmitCashSessionCount).mockReturnValue({
      mutateAsync: submitAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useSubmitCashSessionCount>)
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
    // El backend omite el esperado cuando quien opera no controla la caja:
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

  it('el cajero entrega la caja en vez de cerrarla (Bloque A)', async () => {
    submitAsync.mockResolvedValue(
      session({
        status: 'PENDING_APPROVAL',
        counted_closing_amount: '130.00',
        expected_amount_so_far: null,
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
    await userEvent.click(screen.getByRole('button', { name: 'Entregar caja' }))

    expect(submitAsync).toHaveBeenCalledWith({
      sessionId: 7,
      countedClosingAmount: '130',
      notes: '',
    })
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(await screen.findByText('Caja entregada')).toBeInTheDocument()
    expect(screen.getByText(/revisará el arqueo/)).toBeInTheDocument()
    expect(screen.queryByText('Diferencia')).not.toBeInTheDocument()
  })

  it('el supervisor revisa una caja entregada y confirma el cierre', async () => {
    mutateAsync.mockResolvedValue(
      session({
        status: 'CLOSED',
        expected_closing_amount: '135.00',
        counted_closing_amount: '130.00',
        difference: '-5.00',
      }),
    )
    render(
      <CloseCashSessionModal
        session={session({ status: 'PENDING_APPROVAL', counted_closing_amount: '130.00' })}
        movements={[]}
        onClose={jest.fn()}
      />,
    )

    expect(screen.getByText('Contado por el cajero').nextSibling).toHaveTextContent('S/ 130.00')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar cierre' }))

    expect(mutateAsync).toHaveBeenCalledWith({
      sessionId: 7,
      countedClosingAmount: '130.00',
      notes: '',
    })
    expect(await screen.findByText('Caja cerrada')).toBeInTheDocument()
    expect(screen.getByText('-5.00')).toBeInTheDocument()
  })

  it('exige el monto contado y muestra la diferencia al cerrar', async () => {
    mutateAsync.mockResolvedValue(
      session({
        status: 'CLOSED',
        expected_closing_amount: '135.00',
        counted_closing_amount: '130.00',
        difference: '-5.00',
      }),
    )
    render(<CloseCashSessionModal session={session()} movements={[]} onClose={jest.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Ingresa el monto contado.')
    expect(mutateAsync).not.toHaveBeenCalled()

    await userEvent.type(screen.getByLabelText(/Monto contado/), '130')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))

    expect(mutateAsync).toHaveBeenCalledWith({
      sessionId: 7,
      countedClosingAmount: '130',
      notes: '',
    })
    expect(await screen.findByText('Caja cerrada')).toBeInTheDocument()
    expect(screen.getByText('-5.00')).toBeInTheDocument()
  })
})
