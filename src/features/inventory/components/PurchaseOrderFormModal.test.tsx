import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Product, Supplier, Warehouse } from '../api'
import { useCreatePurchaseOrder } from '../hooks/usePurchaseOrders'
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal'

jest.mock('../hooks/usePurchaseOrders', () => ({
  useCreatePurchaseOrder: jest.fn(),
}))

const mutateAsync = jest.fn()

const suppliers = [{ id: 1, company_name: 'Proveedor' }] as Supplier[]
const warehouses = [{ id: 2, name: 'Principal' }] as Warehouse[]
const products = [
  { id: 3, name: 'Tornillo', variants: [{ id: 4, sku: 'TOR-1' }] },
] as unknown as Product[]

function renderModal() {
  render(
    <PurchaseOrderFormModal
      suppliers={suppliers}
      warehouses={warehouses}
      products={products}
      onClose={jest.fn()}
    />,
  )
}

describe('PurchaseOrderFormModal', () => {
  beforeEach(() => {
    mutateAsync.mockReset()
    mutateAsync.mockResolvedValue({})
    jest.mocked(useCreatePurchaseOrder).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreatePurchaseOrder>)
  })

  it('con costo unitario, envía unit_cost y calcula el subtotal a 2 decimales', async () => {
    renderModal()
    await userEvent.selectOptions(screen.getByLabelText('Variante'), '4')
    await userEvent.type(screen.getByLabelText('Cantidad'), '3')
    await userEvent.type(screen.getByLabelText('Costo unit.'), '3.335')

    // No deja escribir el tercer decimal.
    expect(screen.getByLabelText('Costo unit.')).toHaveValue('3.33')
    expect(screen.getByText('9.99')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Crear orden' }))
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        details_input: [{ variant_id: 4, quantity: '3', unit_cost: '3.33' }],
      }),
    )
  })

  it('con el subtotal de la factura, lo envía tal cual y el costo unitario es referencial', async () => {
    renderModal()
    await userEvent.selectOptions(screen.getByLabelText('Variante'), '4')
    await userEvent.type(screen.getByLabelText('Cantidad'), '1000')
    await userEvent.type(screen.getByLabelText('Subtotal'), '33.33')

    // 1000 unidades por S/ 33.33: el costo unitario (0.03) solo se muestra.
    expect(screen.getByLabelText('Costo unit.')).toHaveAttribute('placeholder', '0.03')
    expect(screen.getByText('33.33')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Crear orden' }))
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        details_input: [{ variant_id: 4, quantity: '1000', subtotal: '33.33' }],
      }),
    )
  })
})
