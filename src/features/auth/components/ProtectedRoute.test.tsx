import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../hooks/AuthContext'
import { type TenantUser } from '../hooks/session'
import { restoreTenantSession } from '../api'
import { ProtectedRoute } from './ProtectedRoute'

jest.mock('../api')

function renderWithSession(user: TenantUser | null, requirePermission?: string) {
  if (user) {
    jest.mocked(restoreTenantSession).mockResolvedValueOnce({ access: 'token', user })
  } else {
    jest.mocked(restoreTenantSession).mockRejectedValueOnce(new Error('Sin sesión'))
  }
  return render(
    <MemoryRouter initialEntries={['/protegida']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Pantalla de login</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route element={<ProtectedRoute requirePermission={requirePermission} />}>
            <Route path="/protegida" element={<div>Contenido protegido</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute (ERP de tenant)', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('redirige a /login cuando no hay usuario autenticado', async () => {
    renderWithSession(null)
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
  })

  it('muestra el contenido cuando esta autenticado y no se requiere un permiso especifico', async () => {
    renderWithSession({ id: 1, email: 'a@negocio.com', role: 'admin', permissions: [] })
    expect(await screen.findByText('Contenido protegido')).toBeInTheDocument()
  })

  it('muestra el contenido cuando el usuario tiene el permiso requerido', async () => {
    renderWithSession(
      { id: 1, email: 'a@negocio.com', role: 'admin', permissions: ['SALES_VOID'] },
      'SALES_VOID',
    )
    expect(await screen.findByText('Contenido protegido')).toBeInTheDocument()
  })

  it('redirige a /dashboard cuando el usuario esta autenticado pero le falta el permiso requerido', async () => {
    renderWithSession(
      { id: 1, email: 'a@negocio.com', role: 'cajero', permissions: [] },
      'SALES_VOID',
    )
    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })
})
