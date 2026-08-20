import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import type { Product } from '../api'
import { ProductsTab } from './ProductsTab'

const product: Product = {
  id: 1,
  type: 'PRODUCT',
  name: 'Polo clásico',
  description: 'Producto de prueba',
  category: 1,
  brand: 1,
  supplier: 1,
  unit_of_measure: 'UND',
  is_for_sale: true,
  is_active: true,
  updated_at: '2026-08-19T12:00:00Z',
  created_at: '2026-08-01T12:00:00Z',
  variants: [
    {
      id: 11,
      product: 1,
      sku: 'POLO-M-AZUL',
      barcode: '775000000001',
      cost: '40.00',
      price: '80.00',
      min_stock: '5',
      image_url: null,
      is_default: true,
      is_active: true,
      attribute_values: [],
      updated_at: '2026-08-19T12:00:00Z',
    },
  ],
}

const defaultProps: ComponentProps<typeof ProductsTab> = {
  products: [product],
  loading: false,
  search: '',
  onSearchChange: jest.fn(),
  categories: [{ id: 1, name: 'Ropa', is_active: true, primary_attribute: null, allowed_attributes: [] }],
  brands: [{ id: 1, name: 'Marca Demo', is_active: true }],
  suppliers: [{ id: 1, ruc_or_dni: '20123456789', company_name: 'Proveedor Demo', phone: '', address: '' }],
  warehouses: [
    { id: 1, name: 'Principal', address: '', is_active: true, created_at: '2026-08-01T12:00:00Z' },
    { id: 2, name: 'Secundario', address: '', is_active: true, created_at: '2026-08-01T12:00:00Z' },
  ],
  attributes: [],
  allStock: [
    { id: 1, variant: 11, warehouse: 1, quantity: '12', updated_at: '2026-08-19T12:00:00Z' },
    { id: 2, variant: 11, warehouse: 2, quantity: '4', updated_at: '2026-08-19T12:00:00Z' },
  ],
  canManage: true,
  onViewProduct: jest.fn(),
  onDeleteProduct: jest.fn(),
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 1200,
  })
})

beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
})

function renderProductsTab(overrides: Partial<ComponentProps<typeof ProductsTab>> = {}) {
  return render(<ProductsTab {...defaultProps} {...overrides} />)
}

test('extiende la tabla hasta el ancho disponible aunque haya pocas columnas', async () => {
  renderProductsTab()

  const table = await screen.findByRole('table')
  await waitFor(() => expect(table).toHaveStyle({ width: '1200px', minWidth: '1200px' }))

  const user = userEvent.setup()
  await user.click(screen.getByText('Columnas'))
  await user.click(screen.getByLabelText('Categoría'))

  await waitFor(() => expect(table).toHaveStyle({ width: '1200px', minWidth: '1200px' }))
})

test('permite ajustar y restablecer el ancho de la lista maestra con teclado', async () => {
  renderProductsTab()
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Detalle' }))

  const separator = screen.getByRole('separator', { name: 'Cambiar ancho de la lista de productos' })
  fireEvent.keyDown(separator, { key: 'ArrowRight' })
  expect(separator).toHaveAttribute('aria-valuenow', '416')
  expect(localStorage.getItem('fivuza-products-master-width')).toBe('416')

  fireEvent.doubleClick(separator)
  expect(separator).toHaveAttribute('aria-valuenow', '400')
  expect(localStorage.getItem('fivuza-products-master-width')).toBe('400')
  expect(screen.getByText('Stock por almacén')).toBeInTheDocument()
  expect(screen.getByText('Calidad del catálogo')).toBeInTheDocument()
  expect(screen.queryByText('Margen estimado')).not.toBeInTheDocument()
})

test('muestra métricas abiertas y etiquetas para la clasificación del producto', async () => {
  renderProductsTab()
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Detalle' }))

  const metrics = screen.getByLabelText('Métricas del producto')
  expect(within(metrics).getByText('Variantes')).toBeInTheDocument()
  expect(within(metrics).getByText('Costo')).toBeInTheDocument()
  expect(within(metrics).getByText('Precio')).toBeInTheDocument()
  expect(within(metrics).getByText('Stock total')).toBeInTheDocument()
  expect(within(metrics).getByText('Actualización')).toBeInTheDocument()

  const tags = screen.getByLabelText('Clasificación del producto')
  expect(within(tags).getByText('Ropa')).toHaveClass('products-detail-tag-category')
  expect(within(tags).getByText('Marca Demo')).toHaveClass('products-detail-tag-brand')
  expect(within(tags).getByText('Proveedor Demo')).toHaveClass('products-detail-tag-supplier')
})

test('calcula valorización y calidad del catálogo con los datos disponibles', async () => {
  renderProductsTab()
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Detalle' }))

  const valueCard = screen.getByLabelText('Valor del inventario')
  const costRow = within(valueCard).getByText('Valor al costo').closest('div')
  const saleRow = within(valueCard).getByText('Venta potencial').closest('div')
  const gainRow = within(valueCard).getByText('Ganancia potencial').closest('div')
  expect(within(costRow as HTMLElement).getByText('S/ 640.00')).toBeInTheDocument()
  expect(within(saleRow as HTMLElement).getByText('S/ 1280.00')).toBeInTheDocument()
  expect(within(gainRow as HTMLElement).getByText('S/ 640.00')).toBeInTheDocument()

  const qualityCard = screen.getByLabelText('Calidad del catálogo')
  expect(within(qualityCard).getByText('Calidad del catálogo')).toBeInTheDocument()
  expect(within(qualityCard).getByText('1 observación')).toBeInTheDocument()
  expect(within(qualityCard).getByText('Sin imagen')).toBeInTheDocument()
  expect(within(qualityCard).getByText('Sin código')).toBeInTheDocument()
})

test('mueve el stock por almacén debajo de la tabla y deja tres insights laterales', async () => {
  renderProductsTab()
  const user = userEvent.setup()

  await user.click(screen.getByText('Más filtros'))
  const warehouseField = screen.getByText('Almacén').closest('label')
  await user.selectOptions(within(warehouseField as HTMLElement).getByRole('combobox'), '1')
  await user.click(screen.getByRole('button', { name: 'Detalle' }))

  const footer = screen.getByLabelText('Stock por almacén')
  const detailMain = footer.closest('.products-detail-main')
  const insights = screen.getByLabelText('Resumen de inventario')
  expect(detailMain).toContainElement(footer)
  expect(insights).not.toContainElement(footer)
  expect(insights.querySelectorAll(':scope > .products-insight-card')).toHaveLength(3)
  expect(within(insights).queryByText('Comercial y catálogo')).not.toBeInTheDocument()
  expect(within(insights).queryByText('Margen estimado')).not.toBeInTheDocument()

  const principalCard = within(footer).getByText('Principal').closest('article')
  expect(principalCard).toHaveClass('products-warehouse-card-active')
  expect(principalCard).toHaveAttribute('aria-current', 'true')
  expect(within(principalCard as HTMLElement).getByText('12')).toBeInTheDocument()
})

test('ajusta el panel al viewport y mantiene la tabla desplazable por teclado', async () => {
  const originalHeight = window.innerHeight
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 })
  const rectSpy = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({ top: 180 } as DOMRect)

  try {
    const { container } = renderProductsTab()
    const panel = container.querySelector('.products-card') as HTMLElement
    await waitFor(() => expect(panel.style.getPropertyValue('--products-panel-height')).toBe('664px'))

    const scrollArea = screen.getByLabelText('Tabla de productos desplazable')
    expect(scrollArea).toHaveAttribute('tabindex', '0')

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    fireEvent(window, new Event('resize'))
    await waitFor(() => expect(panel.style.getPropertyValue('--products-panel-height')).toBe('564px'))
  } finally {
    rectSpy.mockRestore()
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalHeight })
  }
})

test('separa stock y stock mínimo en Lista y Detalle', async () => {
  renderProductsTab({
    allStock: [{ id: 1, variant: 11, warehouse: 1, quantity: '2', updated_at: '2026-08-19T12:00:00Z' }],
  })

  let table = screen.getByRole('table')
  expect(within(table).getByRole('columnheader', { name: 'Stock' })).toBeInTheDocument()
  expect(within(table).getByRole('columnheader', { name: 'Stock mínimo' })).toBeInTheDocument()
  expect(within(table).queryByRole('columnheader', { name: 'Stock / mín.' })).not.toBeInTheDocument()
  expect(within(table).getByText('Mín. 5')).toHaveClass('products-min-stock-badge')
  expect(within(table).getByText('2')).toHaveClass('products-stock-low')

  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Detalle' }))
  table = screen.getByRole('table')
  expect(within(table).getByRole('columnheader', { name: 'Costo' })).toBeInTheDocument()
  expect(within(table).getByRole('columnheader', { name: 'Stock' })).toBeInTheDocument()
  expect(within(table).getByRole('columnheader', { name: 'Stock mínimo' })).toBeInTheDocument()
  expect(within(table).getByText('S/ 40.00')).toHaveClass('products-cost-cell')
  expect(within(table).getByText('Mín. 5')).toHaveClass('products-min-stock-badge')
  expect(within(table).getByText('2')).toHaveClass('products-stock-low')

  const replenishment = screen.getByLabelText('Alertas y reposición')
  expect(within(replenishment).getByText('Reposición sugerida')).toBeInTheDocument()
  expect(within(replenishment).getByText('3 und')).toBeInTheDocument()
  expect(within(replenishment).getByText(/POLO-M-AZUL/)).toBeInTheDocument()
})

test('presenta etiquetas atenuadas cuando faltan marca y proveedor', async () => {
  renderProductsTab({ products: [{ ...product, brand: null, supplier: null }] })
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Detalle' }))

  const tags = screen.getByLabelText('Clasificación del producto')
  expect(within(tags).getByText('Sin marca')).toHaveClass('products-detail-tag-muted')
  expect(within(tags).getByText('Sin proveedor')).toHaveClass('products-detail-tag-muted')
})

test('limpiar filtros conserva el orden seleccionado', async () => {
  renderProductsTab()
  const user = userEvent.setup()
  const sort = screen.getByLabelText('Ordenar productos')
  await user.selectOptions(sort, 'price')
  await user.selectOptions(screen.getByLabelText('Filtrar por nivel de stock'), 'low')
  await user.click(screen.getByRole('button', { name: /Limpiar filtros/ }))

  expect(sort).toHaveValue('price')
  expect(screen.getByLabelText('Filtrar por nivel de stock')).toHaveValue('all')
})
