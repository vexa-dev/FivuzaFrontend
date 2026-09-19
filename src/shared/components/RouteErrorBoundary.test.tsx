import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { RouteErrorBoundary } from './RouteErrorBoundary'

let shouldThrow = true

function Flaky() {
  if (shouldThrow) throw new Error('fallo de render')
  return <div>Pantalla cargada</div>
}

describe('RouteErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true
    // React registra el error capturado en consola; se silencia para no
    // ensuciar la salida del test.
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('muestra un fallback en vez de dejar la pantalla en blanco y permite reintentar', async () => {
    render(
      <MemoryRouter>
        <div>Sidebar</div>
        <RouteErrorBoundary>
          <Flaky />
        </RouteErrorBoundary>
      </MemoryRouter>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal al mostrar esta pantalla')
    expect(screen.getByText('Sidebar')).toBeInTheDocument()

    shouldThrow = false
    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(screen.getByText('Pantalla cargada')).toBeInTheDocument()
  })
})
