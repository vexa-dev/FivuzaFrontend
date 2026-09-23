import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/hooks/useAuth'
import { fetchUsers } from '../users/api'
import { ActivityPage } from './ActivityPage'
import { fetchLoginAttempts, fetchTenantAuditLogs, type TenantAuditLog } from './api'
import { AuditDetails } from './components/AuditDetails'

jest.mock('../auth/hooks/useAuth', () => ({ useAuth: jest.fn() }))
jest.mock('../users/api', () => ({ fetchUsers: jest.fn() }))
jest.mock('./api', () => ({
  fetchTenantAuditLogs: jest.fn(),
  downloadTenantAuditLogs: jest.fn(),
  fetchLoginAttempts: jest.fn(),
}))

const productUpdate: TenantAuditLog = {
  id: 1,
  user: 7,
  user_email: 'admin@negocio.com',
  action: 'UPDATE',
  entity: 'Product',
  entity_id: 42,
  details: JSON.stringify({ name: { before: 'Polo', after: 'Polo clásico' } }),
  created_at: '2026-09-20T15:00:00-05:00',
}

function page(results: TenantAuditLog[]) {
  return { count: results.length, next: null, previous: null, results }
}

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

function mockPermissions(codes: string[]) {
  ;(useAuth as jest.Mock).mockReturnValue({
    hasPermission: (code: string) => codes.includes(code),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetchUsers as jest.Mock).mockResolvedValue([{ id: 7, email: 'admin@negocio.com' }])
  ;(fetchTenantAuditLogs as jest.Mock).mockResolvedValue(page([productUpdate]))
})

test('muestra la bitacora con acciones y entidades en español', async () => {
  mockPermissions(['USERS_VIEW_AUDIT', 'USERS_MANAGE'])
  renderWithClient(<ActivityPage />)

  const row = (await screen.findByText('admin@negocio.com', { selector: 'td' })).closest('tr')!
  expect(within(row).getByText('Editó')).toBeInTheDocument()
  expect(within(row).getByText('Producto #42')).toBeInTheDocument()
})

test('al expandir una edicion muestra antes y despues', async () => {
  mockPermissions(['USERS_VIEW_AUDIT'])
  renderWithClient(<ActivityPage />)
  const user = userEvent.setup()

  await user.click(await screen.findByRole('button', { name: 'Ver detalle' }))

  expect(screen.getByText('Polo')).toHaveClass('activity-details-before')
  expect(screen.getByText('Polo clásico')).toHaveClass('activity-details-after')
})

test('cambiar un filtro vuelve a pedir desde la primera pagina con ese filtro', async () => {
  mockPermissions(['USERS_VIEW_AUDIT'])
  renderWithClient(<ActivityPage />)
  const user = userEvent.setup()
  await screen.findByText('Producto #42')

  await user.selectOptions(screen.getByLabelText('Acción'), 'DELETE')

  expect(fetchTenantAuditLogs).toHaveBeenLastCalledWith({ action: 'DELETE' }, 1)
})

test('sin USERS_MANAGE no ofrece el filtro por persona ni pide la lista de usuarios', async () => {
  mockPermissions(['USERS_VIEW_AUDIT'])
  renderWithClient(<ActivityPage />)
  await screen.findByText('Producto #42')

  expect(screen.queryByLabelText('Persona')).not.toBeInTheDocument()
  expect(fetchUsers).not.toHaveBeenCalled()
})

test('un detalle en texto libre se muestra tal cual', () => {
  render(<AuditDetails details="[accion de soporte Fivuza] algo" />)
  expect(screen.getByText('[accion de soporte Fivuza] algo')).toBeInTheDocument()
})

test('exportar exige un rango de fechas de como maximo un año', async () => {
  mockPermissions(['USERS_VIEW_AUDIT'])
  renderWithClient(<ActivityPage />)
  const user = userEvent.setup()
  await screen.findByText('Producto #42')

  expect(screen.getByRole('button', { name: /CSV/ })).toBeDisabled()
  expect(screen.getByText('Elige Desde y Hasta para exportar')).toBeInTheDocument()

  await user.type(screen.getByLabelText('Desde'), '2025-01-01')
  await user.type(screen.getByLabelText('Hasta'), '2026-06-01')
  expect(screen.getByText('Exporta como máximo 366 días')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /CSV/ })).toBeDisabled()

  await user.clear(screen.getByLabelText('Desde'))
  await user.type(screen.getByLabelText('Desde'), '2026-01-01')
  await screen.findByText('Producto #42')
  expect(screen.queryByText(/Exporta como máximo/)).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /CSV/ })).toBeEnabled()
})

test('el detalle de una operacion autorizada dice quien la autorizo', () => {
  render(
    <AuditDetails
      details={JSON.stringify({
        invoice_number: 'V-000012',
        reason: 'cobro duplicado',
        authorized_by: 3,
        authorized_by_email: 'jefe@negocio.com',
      })}
    />,
  )
  expect(screen.getByText('Autorizado por')).toBeInTheDocument()
  expect(screen.getByText('jefe@negocio.com')).toBeInTheDocument()
  // El id sobra cuando ya viene el correo.
  expect(screen.queryByText('authorized_by')).not.toBeInTheDocument()
})

test('la pestaña de intentos de acceso lista los correos desconocidos', async () => {
  mockPermissions(['USERS_VIEW_AUDIT'])
  ;(fetchLoginAttempts as jest.Mock).mockResolvedValue({
    count: 1,
    next: null,
    previous: null,
    results: [
      {
        id: 1,
        email: 'bot@ataque.com',
        ip: '203.0.113.9',
        user_agent: 'curl/8.0',
        source: 'LOGIN',
        created_at: '2026-09-22T03:10:00-05:00',
      },
    ],
  })
  renderWithClient(<ActivityPage />)
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: 'Intentos de acceso' }))

  const row = (await screen.findByText('bot@ataque.com')).closest('tr')!
  expect(within(row).getByText('Inicio de sesión')).toBeInTheDocument()
  expect(within(row).getByText('203.0.113.9')).toBeInTheDocument()

  await user.selectOptions(screen.getByLabelText('Origen'), 'SUPERVISOR_AUTHORIZATION')
  expect(fetchLoginAttempts).toHaveBeenLastCalledWith({ source: 'SUPERVISOR_AUTHORIZATION' }, 1)
})
