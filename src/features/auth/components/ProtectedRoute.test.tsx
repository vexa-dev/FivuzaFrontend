import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../hooks/AuthContext'
import { saveSession, type TenantUser } from '../hooks/session'
import { ProtectedRoute } from './ProtectedRoute'

function renderWithSession(user: TenantUser | null, requirePermission?: string) {
  if (user) {
    saveSession({ access: 'token', user })
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

  it('redirige a /login cuando no hay usuario autenticado', () => {
    renderWithSession(null)
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument()
  })

  it('muestra el contenido cuando esta autenticado y no se requiere un permiso especifico', () => {
    renderWithSession({ id: 1, email: 'a@negocio.com', role: 'admin', permissions: [] })
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })

  it('muestra el contenido cuando el usuario tiene el permiso requerido', () => {
    renderWithSession(
      { id: 1, email: 'a@negocio.com', role: 'admin', permissions: ['SALES_VOID'] },
      'SALES_VOID',
    )
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })

  it('redirige a /dashboard cuando el usuario esta autenticado pero le falta el permiso requerido', () => {
    renderWithSession(
      { id: 1, email: 'a@negocio.com', role: 'cajero', permissions: [] },
      'SALES_VOID',
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })
})
