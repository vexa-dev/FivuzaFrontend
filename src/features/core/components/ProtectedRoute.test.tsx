import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../hooks/AuthContext'
import { type PlatformStaffInfo } from '../hooks/session'
import { restorePlatformSession } from '../api'
import { ProtectedRoute } from './ProtectedRoute'

jest.mock('../api')

function renderWithSession(staff: PlatformStaffInfo | null, requireRole?: PlatformStaffInfo['role'][]) {
  if (staff) {
    jest.mocked(restorePlatformSession).mockResolvedValueOnce({ access: 'token', staff })
  } else {
    jest.mocked(restorePlatformSession).mockRejectedValueOnce(new Error('Sin sesión'))
  }
  return render(
    <MemoryRouter initialEntries={['/protegida']}>
      <AuthProvider>
        <Routes>
          <Route path="/admin/login" element={<div>Pantalla de login</div>} />
          <Route path="/admin/resumen" element={<div>Resumen</div>} />
          <Route element={<ProtectedRoute requireRole={requireRole} />}>
            <Route path="/protegida" element={<div>Contenido protegido</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

function staff(role: PlatformStaffInfo['role']): PlatformStaffInfo {
  return { id: 1, email: 'staff@fivuza.com', full_name: 'Staff Uno', role }
}

describe('ProtectedRoute (panel de plataforma)', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('redirige a /admin/login cuando no hay staff autenticado', async () => {
    renderWithSession(null)
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
  })

  it('muestra el contenido cuando esta autenticado y no se requiere un rol especifico', async () => {
    renderWithSession(staff('SUPPORT'))
    expect(await screen.findByText('Contenido protegido')).toBeInTheDocument()
  })

  it('muestra el contenido cuando el rol del staff esta entre los requeridos', async () => {
    renderWithSession(staff('SUPER_ADMIN'), ['SUPER_ADMIN', 'BILLING'])
    expect(await screen.findByText('Contenido protegido')).toBeInTheDocument()
  })

  it('redirige a /admin/resumen cuando el rol del staff no esta entre los requeridos', async () => {
    renderWithSession(staff('SUPPORT'), ['SUPER_ADMIN', 'BILLING'])
    expect(await screen.findByText('Resumen')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })
})
