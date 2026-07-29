import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '../../shared/utils/apiClient'
import { ThemeProvider } from '../../theme/ThemeContext'
import { AuthProvider } from './hooks/AuthContext'
import { LoginPage } from './LoginPage'
import { loginTenantUser } from './api'

jest.mock('./api')

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

describe('LoginPage (ERP de tenant)', () => {
  it('muestra un error cuando se envía el formulario sin correo ni contraseña', async () => {
    renderLoginPage()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Correo y contraseña son requeridos.',
    )
    expect(loginTenantUser).not.toHaveBeenCalled()
  })

  it('muestra un error de credenciales inválidas cuando el backend responde 400', async () => {
    jest.mocked(loginTenantUser).mockRejectedValueOnce(new ApiError(400, {}))
    renderLoginPage()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/correo/i), 'admin@negocio.com')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'incorrecta')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Correo o contraseña incorrectos.',
      ),
    )
  })

  it('llama a loginTenantUser con las credenciales ingresadas', async () => {
    jest.mocked(loginTenantUser).mockResolvedValueOnce({
      access: 'access-token',
      refresh: 'refresh-token',
      user: { id: 1, email: 'admin@negocio.com', role: 'admin', permissions: [] },
    })
    renderLoginPage()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/correo/i), 'admin@negocio.com')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'ClaveSegura123')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() =>
      expect(loginTenantUser).toHaveBeenCalledWith('admin@negocio.com', 'ClaveSegura123'),
    )
  })
})
