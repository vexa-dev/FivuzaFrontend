import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Attribute } from '../api'
import { useCreateCategory, useUpdateCategory } from '../hooks/useCategories'
import { CategoryFormModal } from './CategoryFormModal'

jest.mock('../hooks/useCategories', () => ({
  useCreateCategory: jest.fn(),
  useUpdateCategory: jest.fn(),
}))

const createAsync = jest.fn()
const updateAsync = jest.fn()
const attributes: Attribute[] = [
  { id: 1, name: 'Talla', values: [] },
  { id: 2, name: 'Color', values: [] },
]

beforeEach(() => {
  jest.clearAllMocks()
  createAsync.mockResolvedValue({})
  updateAsync.mockResolvedValue({})
  ;(useCreateCategory as jest.Mock).mockReturnValue({ mutateAsync: createAsync, isPending: false })
  ;(useUpdateCategory as jest.Mock).mockReturnValue({ mutateAsync: updateAsync, isPending: false })
})

test('guarda atributos permitidos y limita a ellos el atributo principal', async () => {
  const onClose = jest.fn()
  render(<CategoryFormModal editingCategory={null} attributes={attributes} onClose={onClose} />)
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('Nombre'), 'Ropa')
  expect(screen.getByLabelText('Atributo de agrupación (opcional)')).toBeDisabled()
  await user.click(screen.getByRole('checkbox', { name: 'Talla' }))
  await user.selectOptions(screen.getByLabelText('Atributo de agrupación (opcional)'), '1')
  await user.click(screen.getByText('Guardar'))

  await waitFor(() => expect(createAsync).toHaveBeenCalledWith({
    name: 'Ropa',
    primary_attribute: 1,
    allowed_attributes: [1],
    is_active: true,
  }))
  expect(onClose).toHaveBeenCalled()
})

test('limpia el atributo principal cuando deja de estar permitido', async () => {
  render(
    <CategoryFormModal
      editingCategory={{ id: 1, name: 'Ropa', is_active: true, primary_attribute: 1, allowed_attributes: [1, 2] }}
      attributes={attributes}
      onClose={jest.fn()}
    />,
  )
  const user = userEvent.setup()
  await user.click(screen.getByRole('checkbox', { name: 'Talla' }))
  expect(screen.getByLabelText('Atributo de agrupación (opcional)')).toHaveValue('')
})

test('permite desactivar una categoría existente', async () => {
  const onClose = jest.fn()
  render(
    <CategoryFormModal
      editingCategory={{ id: 1, name: 'Ropa', is_active: true, primary_attribute: null, allowed_attributes: [] }}
      attributes={attributes}
      onClose={onClose}
    />,
  )
  const user = userEvent.setup()

  await user.click(screen.getByRole('checkbox', { name: /Categoría activa/ }))
  await user.click(screen.getByText('Guardar'))

  await waitFor(() =>
    expect(updateAsync).toHaveBeenCalledWith({
      id: 1,
      data: {
        name: 'Ropa',
        primary_attribute: null,
        allowed_attributes: [],
        is_active: false,
      },
    }),
  )
  expect(onClose).toHaveBeenCalled()
})
