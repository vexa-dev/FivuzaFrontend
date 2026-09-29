import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Customer } from '../api'
import type { CartTotals } from '../cart/totals'
import type { CartPayment, CartState } from '../cart/types'
import { CheckoutModal } from './CheckoutModal'

function cart(payments: CartPayment[]): CartState {
  return { customerId: 1, cashSessionId: 1, lines: [], payments }
}

function totals(total: number, paymentsTotal: number): CartTotals {
  return {
    subtotal: total,
    discountTotal: 0,
    total,
    paymentsTotal,
    paymentsMatchTotal: Math.abs(total - paymentsTotal) < 0.005,
  }
}

const customer: Customer = {
  id: 1,
  document_type: 'DNI',
  document_number: '12345678',
  name: 'Cliente',
  phone: '',
  address: '',
  is_active: true,
  is_walk_in: false,
  credit_limit: '100.00',
  current_debt: '80.00',
  current_balance: '5.00',
  oldest_unpaid_debt_at: null,
  updated_at: '2026-09-01T00:00:00Z',
  created_at: '2026-09-01T00:00:00Z',
} as Customer

function renderCheckout(overrides: Partial<Parameters<typeof CheckoutModal>[0]> = {}) {
  const props = {
    cart: cart([{ method: 'CASH', amount: '40.00' }]),
    totals: totals(40, 40),
    customer,
    error: null,
    isSubmitting: false,
    onAddPayment: jest.fn(),
    onSetPayments: jest.fn(),
    onUpdatePaymentAmount: jest.fn(),
    onUpdatePaymentMethod: jest.fn(),
    onUpdatePaymentField: jest.fn(),
    onRemovePayment: jest.fn(),
    onConfirm: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  }
  render(<CheckoutModal {...props} />)
  return props
}

describe('CheckoutModal', () => {
  it('muestra el vuelto ya calculado del efectivo recibido', () => {
    renderCheckout({
      cart: cart([{ method: 'CASH', amount: '40.00', tendered_amount: '50.00', change_amount: '10.00' }]),
    })

    expect(screen.getByText('Vuelto: S/ 10.00')).toBeInTheDocument()
  })

  it('escribir el efectivo recibido avisa el nuevo valor y el vuelto', async () => {
    const props = renderCheckout()

    await userEvent.type(screen.getByLabelText('Efectivo recibido del cliente'), '50')

    expect(props.onUpdatePaymentField).toHaveBeenCalledWith(0, 'tendered_amount', expect.any(String))
  })

  it('no deja confirmar si los pagos no cuadran con el total', () => {
    const props = renderCheckout({
      cart: cart([{ method: 'CASH', amount: '30.00' }]),
      totals: totals(40, 30),
    })

    const confirm = screen.getByRole('button', { name: /Confirmar cobro de S\/ 40.00/ })
    expect(confirm).toBeDisabled()
    expect(screen.getByText('Pagado: S/ 30.00 de S/ 40.00')).toBeInTheDocument()
    expect(props.onConfirm).not.toHaveBeenCalled()
  })

  it('confirma cuando los pagos cuadran', async () => {
    const props = renderCheckout()

    await userEvent.click(screen.getByRole('button', { name: /Confirmar cobro/ }))

    expect(props.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('no deja confirmar un pago con tarjeta sin numero de operacion', () => {
    renderCheckout({
      cart: cart([{ method: 'CARD', amount: '40.00' }]),
    })

    expect(screen.getByRole('button', { name: /Confirmar cobro/ })).toBeDisabled()
  })

  it('dividir pago agrega una segunda linea con el resto', async () => {
    const props = renderCheckout({
      cart: cart([{ method: 'CASH', amount: '25.00' }]),
      totals: totals(40, 25),
    })

    await userEvent.click(screen.getByRole('button', { name: /Dividir pago/ }))

    expect(props.onAddPayment).toHaveBeenCalledWith({ method: 'CASH', amount: '15.00' })
  })

  it('avisa cuando un fiado supera el limite de credito del cliente', () => {
    // Deuda actual 80 + 40 fiado = 120 > limite 100.
    renderCheckout({ cart: cart([{ method: 'CREDIT_LEDGER', amount: '40.00' }]) })

    expect(screen.getByText(/Supera el límite de crédito/)).toBeInTheDocument()
  })

  it('avisa cuando el saldo a favor no alcanza', () => {
    renderCheckout({ cart: cart([{ method: 'BALANCE', amount: '40.00' }]) })

    expect(screen.getByText(/Insuficiente/)).toBeInTheDocument()
  })

  it('no ofrece fiado ni saldo a favor para el cliente de paso', () => {
    renderCheckout({ customer: { ...customer, is_walk_in: true } })

    expect(screen.queryByRole('button', { name: 'Crédito (fiado)' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Saldo a favor' })).not.toBeInTheDocument()
  })

  it('muestra el error del backend y el estado de envio', () => {
    renderCheckout({ error: 'Stock insuficiente.', isSubmitting: true })

    expect(screen.getByRole('alert')).toHaveTextContent('Stock insuficiente.')
    expect(screen.getByRole('button', { name: 'Confirmando...' })).toBeDisabled()
  })
})
