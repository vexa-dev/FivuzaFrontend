import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '../../../shared/utils/apiClient'
import type { Attribute, Brand, Category, Supplier } from '../api'
import { useCreateProduct } from '../hooks/useProducts'
import { ProductFormModal } from './ProductFormModal'

jest.mock('../hooks/useProducts', () => ({ useCreateProduct: jest.fn() }))

const mutateAsync = jest.fn()
const categories: Category[] = [
  { id: 1, name: 'Ropa', is_active: true, primary_attribute: 1, allowed_attributes: [1, 2] },
  { id: 2, name: 'Bebidas', is_active: true, primary_attribute: 3, allowed_attributes: [3] },
  { id: 3, name: 'Accesorios', is_active: true, primary_attribute: 2, allowed_attributes: [1, 2, 4] },
]
const attributes: Attribute[] = [
  { id: 1, name: 'Talla', values: [{ id: 11, attribute: 1, value: 'M' }] },
  { id: 2, name: 'Color', values: [{ id: 21, attribute: 2, value: 'Azul' }] },
  { id: 3, name: 'Presentación', values: [{ id: 31, attribute: 3, value: '500 ml' }] },
  { id: 4, name: 'Material', values: [{ id: 41, attribute: 4, value: 'Cuero' }] },
]
const brands: Brand[] = [{ id: 1, name: 'Marca', is_active: true }]
const suppliers: Supplier[] = [
  { id: 1, ruc_or_dni: '20123456789', company_name: 'Proveedor', phone: '', address: '' },
]

beforeEach(() => {
  jest.clearAllMocks()
  mutateAsync.mockResolvedValue({})
  ;(useCreateProduct as jest.Mock).mockReturnValue({ mutateAsync, isPending: false })
})

function renderModal(onClose = jest.fn(), onConfigureCategory = jest.fn()) {
  render(
    <ProductFormModal
      categories={categories}
      brands={brands}
      suppliers={suppliers}
      attributes={attributes}
      onConfigureCategory={onConfigureCategory}
      onClose={onClose}
    />,
  )
  return onClose
}

test('muestra únicamente los atributos permitidos por la categoría', () => {
  renderModal()
  expect(screen.getByLabelText('Talla de variante 1')).toBeInTheDocument()
  expect(screen.getByLabelText('Color de variante 1')).toBeInTheDocument()
  expect(screen.queryByLabelText('Presentación de variante 1')).not.toBeInTheDocument()
})

test('muestra Color, Talla y Material para Accesorios', async () => {
  renderModal()
  const user = userEvent.setup()
  await user.selectOptions(screen.getByLabelText('Categoría *'), '3')

  expect(screen.getByLabelText('Color de variante 1')).toBeInTheDocument()
  expect(screen.getByLabelText('Talla de variante 1')).toBeInTheDocument()
  expect(screen.getByLabelText('Material de variante 1')).toBeInTheDocument()
  expect(screen.queryByLabelText('Presentación de variante 1')).not.toBeInTheDocument()
})

test('retira atributos incompatibles al cambiar de categoría', async () => {
  renderModal()
  const user = userEvent.setup()
  await user.selectOptions(screen.getByLabelText('Color de variante 1'), '21')
  await user.selectOptions(screen.getByLabelText('Categoría *'), '2')

  expect(screen.queryByLabelText('Color de variante 1')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Presentación de variante 1')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Se retiraron 1 atributos incompatibles')
})

test('envía todos los campos aceptados por el backend', async () => {
  const onClose = renderModal()
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Nombre *'), 'Polo clásico')
  await user.type(screen.getByLabelText('Descripción (opcional)'), 'Algodón')
  await user.type(screen.getByLabelText('SKU *'), 'POLO-M')
  await user.clear(screen.getByLabelText('Costo'))
  await user.type(screen.getByLabelText('Costo'), '25.50')
  await user.clear(screen.getByLabelText('Precio'))
  await user.type(screen.getByLabelText('Precio'), '49.90')
  await user.clear(screen.getByLabelText('Stock mínimo'))
  await user.type(screen.getByLabelText('Stock mínimo'), '5')
  await user.selectOptions(screen.getByLabelText('Talla de variante 1'), '11')
  await user.click(screen.getByText('Guardar producto'))

  await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1))
  expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
    type: 'PRODUCT',
    name: 'Polo clásico',
    description: 'Algodón',
    category: 1,
    is_for_sale: true,
    is_active: true,
    variants_input: [expect.objectContaining({
      sku: 'POLO-M',
      cost: '25.50',
      price: '49.90',
      min_stock: '5',
      attribute_value_ids: [11],
    })],
  }))
  await waitFor(() => expect(onClose).toHaveBeenCalled())
})

test('no descarta variantes incompletas ni permite SKU repetidos', async () => {
  renderModal()
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Nombre *'), 'Producto')
  await user.type(screen.getByLabelText('SKU *'), 'REP-1')
  await user.click(screen.getByText('Agregar variante'))
  await user.click(screen.getByText('Guardar producto'))

  expect(screen.getByRole('alert')).toHaveTextContent('Todas las variantes deben tener un SKU')
  expect(mutateAsync).not.toHaveBeenCalled()

  const skuInputs = screen.getAllByLabelText('SKU *')
  await user.type(skuInputs[1], 'REP-1')
  await user.click(screen.getByText('Guardar producto'))
  expect(screen.getByRole('alert')).toHaveTextContent('no pueden repetirse')
  expect(mutateAsync).not.toHaveBeenCalled()
})

test('muestra el mensaje del backend cuando el plan no admite variantes', async () => {
  mutateAsync.mockRejectedValueOnce(
    new ApiError(403, { message: 'El plan/configuración actual no permite variantes.' }),
  )
  renderModal()
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Nombre *'), 'Producto')
  await user.type(screen.getByLabelText('SKU *'), 'SKU-1')
  await user.click(screen.getByText('Guardar producto'))

  expect(await screen.findByRole('alert')).toHaveTextContent('no permite variantes')
})

test('hace crecer la descripción hasta 128 px y luego activa su scroll', async () => {
  renderModal()
  const user = userEvent.setup()
  const description = screen.getByLabelText('Descripción (opcional)')

  Object.defineProperty(description, 'scrollHeight', { configurable: true, value: 84 })
  await user.type(description, 'Descripción de dos líneas')
  expect(description).toHaveStyle({ height: '84px', overflowY: 'hidden' })

  Object.defineProperty(description, 'scrollHeight', { configurable: true, value: 180 })
  await user.type(description, ' con más contenido')
  expect(description).toHaveStyle({ height: '128px', overflowY: 'auto' })
})

test('usa el atributo principal como compatibilidad con categorías del contrato anterior', () => {
  const legacyCategory = {
    id: 3,
    name: 'Accesorios',
    is_active: true,
    primary_attribute: 2,
  } as Category

  render(
    <ProductFormModal
      categories={[legacyCategory]}
      brands={brands}
      suppliers={suppliers}
      attributes={attributes}
      onConfigureCategory={jest.fn()}
      onClose={jest.fn()}
    />,
  )

  expect(screen.getByLabelText('Color de variante 1')).toBeInTheDocument()
})

test('handleCategoryChange tambien usa el atributo principal como fallback legado', async () => {
  const legacyCategory = {
    id: 5,
    name: 'Calzado',
    is_active: true,
    primary_attribute: 1,
  } as Category

  render(
    <ProductFormModal
      categories={[categories[0], legacyCategory]}
      brands={brands}
      suppliers={suppliers}
      attributes={attributes}
      onConfigureCategory={jest.fn()}
      onClose={jest.fn()}
    />,
  )
  const user = userEvent.setup()

  // La categoria inicial (Ropa) permite Talla -selecciona un valor antes
  // de cambiar a la categoria legada, para probar que handleCategoryChange
  // (no solo el useMemo de allowedAttributes) tambien aplica el fallback.
  await user.selectOptions(screen.getByLabelText('Talla de variante 1'), '11')
  await user.selectOptions(screen.getByLabelText('Categoría *'), '5')

  expect(screen.getByLabelText('Talla de variante 1')).toBeInTheDocument()
  expect(screen.getByLabelText('Talla de variante 1')).toHaveValue('11')
})

test('permite configurar una categoría vacía sin desmontar ni limpiar el producto', async () => {
  const emptyCategory: Category = {
    id: 4,
    name: 'Otros',
    is_active: true,
    primary_attribute: null,
    allowed_attributes: [],
  }
  const onConfigureCategory = jest.fn()
  render(
    <ProductFormModal
      categories={[emptyCategory]}
      brands={brands}
      suppliers={suppliers}
      attributes={attributes}
      onConfigureCategory={onConfigureCategory}
      onClose={jest.fn()}
    />,
  )
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Nombre *'), 'Producto pendiente')
  await user.type(screen.getByLabelText('SKU *'), 'PEND-1')
  await user.click(screen.getByText('Configurar atributos'))

  expect(onConfigureCategory).toHaveBeenCalledWith(emptyCategory)
  expect(screen.getByLabelText('Nombre *')).toHaveValue('Producto pendiente')
  expect(screen.getByLabelText('SKU *')).toHaveValue('PEND-1')
})
