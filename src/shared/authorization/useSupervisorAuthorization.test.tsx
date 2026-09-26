import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ApiError } from '../utils/apiClient'
import { requestSupervisorAuthorization } from './api'
import { isAuthorizationCancelled, useSupervisorAuthorization } from './useSupervisorAuthorization'

jest.mock('./api', () => {
  const actual = jest.requireActual('./api')
  return { ...actual, requestSupervisorAuthorization: jest.fn() }
})

const requiredError = (extra: Record<string, string> = {}) =>
  new ApiError(403, {
    error: {
      code: 'SUPERVISOR_AUTHORIZATION_REQUIRED',
      message: 'Necesitas la autorización de un supervisor para anular esta venta.',
      permission: 'SALES_VOID',
      ...extra,
    },
  })

function Harness({ operation }: { operation: (token?: string) => Promise<string> }) {
  const authorization = useSupervisorAuthorization()
  const [result, setResult] = useState('')
  return (
    <>
      <button
        type="button"
        onClick={() =>
          authorization
            .run(operation, { targetId: 12, description: 'Anular V-000012' })
            .then(setResult)
            .catch((err) => setResult(isAuthorizationCancelled(err) ? 'cancelado' : 'error'))
        }
      >
        Operar
      </button>
      <output>{result}</output>
      {authorization.modal}
    </>
  )
}

beforeEach(() => jest.clearAllMocks())

test('sin 403 la operación corre una sola vez y sin token', async () => {
  const operation = jest.fn().mockResolvedValue('hecho')
  render(<Harness operation={operation} />)

  await userEvent.click(screen.getByRole('button', { name: 'Operar' }))

  expect(await screen.findByText('hecho')).toBeInTheDocument()
  expect(operation).toHaveBeenCalledTimes(1)
  expect(operation).toHaveBeenCalledWith()
})

test('ante el 403 pide la clave del supervisor y repite con el token', async () => {
  const operation = jest
    .fn()
    .mockRejectedValueOnce(requiredError())
    .mockResolvedValueOnce('anulada')
  ;(requestSupervisorAuthorization as jest.Mock).mockResolvedValue({
    token: 'token-de-un-uso',
    permission: 'SALES_VOID',
  })
  render(<Harness operation={operation} />)

  await userEvent.click(screen.getByRole('button', { name: 'Operar' }))
  expect(await screen.findByText(/anular esta venta/)).toBeInTheDocument()
  expect(screen.getByText('Anular V-000012')).toBeInTheDocument()

  await userEvent.type(screen.getByLabelText('Correo del supervisor'), 'jefe@negocio.com')
  await userEvent.type(screen.getByLabelText('Contraseña del supervisor'), 'clave')
  await userEvent.click(screen.getByRole('button', { name: 'Autorizar' }))

  expect(await screen.findByText('anulada')).toBeInTheDocument()
  expect(requestSupervisorAuthorization).toHaveBeenCalledWith({
    email: 'jefe@negocio.com',
    password: 'clave',
    permission: 'SALES_VOID',
    target_id: 12,
  })
  expect(operation).toHaveBeenLastCalledWith('token-de-un-uso')
  await waitFor(() =>
    expect(screen.queryByLabelText('Correo del supervisor')).not.toBeInTheDocument(),
  )
})

test('el descuento pide autorización por el porcentaje que calculó el backend', async () => {
  const operation = jest
    .fn()
    .mockRejectedValueOnce(
      requiredError({
        permission: 'SALES_DISCOUNT',
        message: 'Necesitas la autorización de un supervisor para aplicar este descuento.',
        requested_discount_percent: '15.00',
        max_discount_percent: '5.00',
      }),
    )
    .mockResolvedValueOnce('vendida')
  ;(requestSupervisorAuthorization as jest.Mock).mockResolvedValue({ token: 't' })
  render(<Harness operation={operation} />)

  await userEvent.click(screen.getByRole('button', { name: 'Operar' }))
  expect(await screen.findByText(/Descuento pedido: 15% por producto · tu tope es 5%/)).toBeInTheDocument()

  await userEvent.type(screen.getByLabelText('Correo del supervisor'), 'jefe@negocio.com')
  await userEvent.type(screen.getByLabelText('Contraseña del supervisor'), 'clave')
  await userEvent.click(screen.getByRole('button', { name: 'Autorizar' }))

  expect(await screen.findByText('vendida')).toBeInTheDocument()
  expect(requestSupervisorAuthorization).toHaveBeenCalledWith(
    expect.objectContaining({ permission: 'SALES_DISCOUNT', discount_percent: '15.00' }),
  )
})

test('una clave incorrecta se muestra en el modal y deja reintentar', async () => {
  const operation = jest.fn().mockRejectedValueOnce(requiredError())
  ;(requestSupervisorAuthorization as jest.Mock).mockRejectedValue(
    new ApiError(400, {
      error: { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos.' },
    }),
  )
  render(<Harness operation={operation} />)

  await userEvent.click(screen.getByRole('button', { name: 'Operar' }))
  await userEvent.type(await screen.findByLabelText('Correo del supervisor'), 'jefe@negocio.com')
  await userEvent.type(screen.getByLabelText('Contraseña del supervisor'), 'mala')
  await userEvent.click(screen.getByRole('button', { name: 'Autorizar' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
  expect(screen.getByLabelText('Contraseña del supervisor')).toHaveValue('')
  expect(operation).toHaveBeenCalledTimes(1)
})

test('un 429 (throttle) muestra cuánto esperar y deja el modal abierto', async () => {
  const operation = jest.fn().mockRejectedValueOnce(requiredError())
  ;(requestSupervisorAuthorization as jest.Mock).mockRejectedValue(
    new ApiError(429, {
      error: {
        code: 'THROTTLED',
        message: 'Request was throttled. Expected available in 38 seconds.',
      },
    }),
  )
  render(<Harness operation={operation} />)

  await userEvent.click(screen.getByRole('button', { name: 'Operar' }))
  await userEvent.type(await screen.findByLabelText('Correo del supervisor'), 'jefe@negocio.com')
  await userEvent.type(screen.getByLabelText('Contraseña del supervisor'), 'clave')
  await userEvent.click(screen.getByRole('button', { name: 'Autorizar' }))

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Demasiados intentos. Espera 38 segundos e intenta de nuevo.',
  )
  expect(screen.getByLabelText('Contraseña del supervisor')).toHaveValue('')
  expect(operation).toHaveBeenCalledTimes(1)
})

test('cerrar el modal cancela sin mostrar un error', async () => {
  const operation = jest.fn().mockRejectedValueOnce(requiredError())
  render(<Harness operation={operation} />)

  await userEvent.click(screen.getByRole('button', { name: 'Operar' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))

  expect(await screen.findByText('cancelado')).toBeInTheDocument()
  expect(operation).toHaveBeenCalledTimes(1)
})

test('otros errores no abren el modal', async () => {
  const operation = jest
    .fn()
    .mockRejectedValue(new ApiError(409, { error: { code: 'SALE_NOT_COMPLETED' } }))
  render(<Harness operation={operation} />)

  await userEvent.click(screen.getByRole('button', { name: 'Operar' }))

  expect(await screen.findByText('error')).toBeInTheDocument()
  expect(screen.queryByLabelText('Correo del supervisor')).not.toBeInTheDocument()
})
