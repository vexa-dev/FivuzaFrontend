import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '../../../shared/utils/apiClient'
import { loginPlatformStaff } from '../api'
import { useLogin } from './useLogin'

jest.mock('../api')
jest.mock('./useAuth', () => ({ useAuth: () => ({ login: jest.fn() }) }))

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('useLogin (panel de plataforma)', () => {
  it('ante un 429 (throttle de login) dice cuánto esperar, no que falla la red', async () => {
    jest.mocked(loginPlatformStaff).mockRejectedValueOnce(new ApiError(429, null, 20))
    const { result } = renderHook(() => useLogin(), { wrapper })

    act(() => result.current.submit('staff@fivuza.com', 'ClaveSegura123'))

    await waitFor(() =>
      expect(result.current.formError).toBe(
        'Demasiados intentos. Espera 20 segundos e intenta de nuevo.',
      ),
    )
  })

  it('un error sin respuesta del servidor sigue mostrando el mensaje de conexión', async () => {
    jest.mocked(loginPlatformStaff).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { result } = renderHook(() => useLogin(), { wrapper })

    act(() => result.current.submit('staff@fivuza.com', 'ClaveSegura123'))

    await waitFor(() =>
      expect(result.current.formError).toBe(
        'No se pudo conectar con el servidor. Intenta de nuevo.',
      ),
    )
  })
})
