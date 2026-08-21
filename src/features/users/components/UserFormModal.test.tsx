import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Role, TenantUserRecord } from '../api'
import type { Warehouse } from '../../inventory/api'
import { useCreateUser, useUpdateUser } from '../hooks/useUsers'
import { UserFormModal } from './UserFormModal'

jest.mock('../hooks/useUsers', () => ({
  useCreateUser: jest.fn(),
  useUpdateUser: jest.fn(),
}))

const createAsync = jest.fn()
const updateAsync = jest.fn()

const adminRole: Role = { id: 1, name: 'admin', is_system_default: true, description: '' }
const sellerRole: Role = { id: 2, name: 'seller', is_system_default: true, description: '' }
const roles = [adminRole, sellerRole]
const warehouses: Warehouse[] = [
  { id: 10, name: 'Principal', address: '', is_active: true, created_at: '' },
  { id: 20, name: 'Sucursal', address: '', is_active: true, created_at: '' },
]

beforeEach(() => {
  jest.clearAllMocks()
  createAsync.mockResolvedValue({})
  updateAsync.mockResolvedValue({})
  ;(useCreateUser as jest.Mock).mockReturnValue({ mutateAsync: createAsync, isPending: false })
  ;(useUpdateUser as jest.Mock).mockReturnValue({ mutateAsync: updateAsync, isPending: false })
})

test('bloquea crear un usuario no-admin sin ningun almacen asignado', async () => {
  render(
    <UserFormModal roles={roles} editingUser={null} warehouses={warehouses} onClose={jest.fn()} />,
  )
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('Correo'), 'nuevo@negocio.com')
  await user.selectOptions(screen.getByLabelText('Rol'), '2')
  await user.type(screen.getByLabelText(/Contraseña/), 'ClaveSegura123')
  await user.click(screen.getByText('Guardar'))

  expect(
    await screen.findByText('Asigna al menos un almacén al cambiar el rol administrador.'),
  ).toBeInTheDocument()
  expect(createAsync).not.toHaveBeenCalled()
})

test('permite crear un usuario no-admin con al menos un almacen asignado', async () => {
  const onClose = jest.fn()
  render(
    <UserFormModal roles={roles} editingUser={null} warehouses={warehouses} onClose={onClose} />,
  )
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('Correo'), 'nuevo@negocio.com')
  await user.selectOptions(screen.getByLabelText('Rol'), '2')
  await user.type(screen.getByLabelText(/Contraseña/), 'ClaveSegura123')
  await user.click(screen.getByRole('checkbox', { name: 'Principal' }))
  await user.click(screen.getByText('Guardar'))

  await waitFor(() =>
    expect(createAsync).toHaveBeenCalledWith({
      email: 'nuevo@negocio.com',
      role: 2,
      password: 'ClaveSegura123',
      warehouse_ids: [10],
    }),
  )
  expect(onClose).toHaveBeenCalled()
})

test('bloquea quitarle a un usuario existente sus ultimos almacenes al editarlo sin ser admin', async () => {
  const editingUser: TenantUserRecord = {
    id: 5,
    email: 'existente@negocio.com',
    role: 2,
    is_active: true,
    last_login: null,
    created_at: '2026-01-01',
    warehouse_ids: [10],
  }
  render(
    <UserFormModal
      roles={roles}
      editingUser={editingUser}
      warehouses={warehouses}
      onClose={jest.fn()}
    />,
  )
  const user = userEvent.setup()

  await user.click(screen.getByRole('checkbox', { name: 'Principal' }))
  await user.click(screen.getByText('Guardar'))

  expect(
    await screen.findByText('Asigna al menos un almacén al cambiar el rol administrador.'),
  ).toBeInTheDocument()
  expect(updateAsync).not.toHaveBeenCalled()
})

test('un usuario admin no requiere almacenes asignados', async () => {
  const onClose = jest.fn()
  render(
    <UserFormModal roles={roles} editingUser={null} warehouses={warehouses} onClose={onClose} />,
  )
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('Correo'), 'admin2@negocio.com')
  await user.type(screen.getByLabelText(/Contraseña/), 'ClaveSegura123')
  await user.click(screen.getByText('Guardar'))

  await waitFor(() =>
    expect(createAsync).toHaveBeenCalledWith({
      email: 'admin2@negocio.com',
      role: 1,
      password: 'ClaveSegura123',
      warehouse_ids: [],
    }),
  )
  expect(onClose).toHaveBeenCalled()
})
