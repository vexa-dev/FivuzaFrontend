import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CartLine } from '../cart/types'
import { POSLineDiscount } from './POSLineDiscount'

const baseLine: CartLine = {
  variantId: 1,
  sku: 'SKU-1',
  productName: 'Polo',
  basePrice: '50.00',
  pricingTiers: [],
  unitOfMeasure: 'UND',
  promotion: null,
  unitPrice: '50.00',
  quantity: '1',
  discountAmount: null,
  discountPercent: null,
}

test('sin descuento solo ofrece el botón', async () => {
  const onChange = jest.fn()
  render(<POSLineDiscount line={baseLine} overLimit={false} onChange={onChange} />)

  await userEvent.click(screen.getByRole('button', { name: 'Dar descuento a Polo' }))
  await userEvent.type(screen.getByLabelText('Descuento de Polo en %'), '5')

  expect(onChange).toHaveBeenLastCalledWith('5')
})

test('con descuento muestra el monto y avisa si pasa el tope', () => {
  render(
    <POSLineDiscount
      line={{ ...baseLine, discountPercent: '20', discountAmount: '10.00' }}
      overLimit
      onChange={jest.fn()}
    />,
  )
  expect(screen.getByText('-S/ 10.00')).toBeInTheDocument()
  expect(screen.getByText('Requiere autorización')).toBeInTheDocument()
})

test('quitar el descuento lo deja en null', async () => {
  const onChange = jest.fn()
  render(
    <POSLineDiscount
      line={{ ...baseLine, discountPercent: '10', discountAmount: '5.00' }}
      overLimit={false}
      onChange={onChange}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Quitar descuento de Polo' }))
  expect(onChange).toHaveBeenCalledWith(null)
  expect(screen.queryByText('Requiere autorización')).not.toBeInTheDocument()
})
