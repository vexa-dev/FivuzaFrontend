import { render, screen } from '@testing-library/react'
import { PaymentTotalsGrid } from './PaymentTotalsGrid'

describe('PaymentTotalsGrid', () => {
  it('muestra cada medio de pago con su nombre y suma el turno', () => {
    render(
      <PaymentTotalsGrid
        totals={{
          CARD: '40.00',
          CASH: '60.00',
          YAPE: '0',
          CREDIT_LEDGER: '0',
          BALANCE: '0',
        }}
      />,
    )

    // El efectivo va primero aunque el backend lo mande en otro orden.
    const labels = screen.getAllByRole('term').map((node) => node.textContent)
    expect(labels).toEqual([
      'Efectivo',
      'Tarjeta',
      'Yape / Plin',
      'Fiado',
      'Saldo a favor',
      'Total del turno',
    ])

    expect(screen.getByText('S/ 60.00')).toBeInTheDocument()
    expect(screen.getByText('S/ 40.00')).toBeInTheDocument()
    expect(screen.getByText('S/ 100.00')).toBeInTheDocument()
  })
})
