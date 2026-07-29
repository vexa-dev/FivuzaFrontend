import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute as CoreProtectedRoute } from './features/core/components/ProtectedRoute'
import { AuthProvider as CoreAuthProvider } from './features/core/hooks/AuthContext'
import { CorePage } from './features/core/CorePage'
import { LoginPage as PlatformLoginPage } from './features/core/LoginPage'
import { ProtectedRoute as TenantProtectedRoute } from './features/auth/components/ProtectedRoute'
import { AuthProvider as TenantAuthProvider } from './features/auth/hooks/AuthContext'
import { LoginPage as TenantLoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { InventoryPage } from './features/inventory/InventoryPage'
import { SalesPage } from './features/sales/SalesPage'
import { UsersPage } from './features/users/UsersPage'
import { ErpLayout } from './shared/components/ErpLayout'

function App() {
  return (
    <CoreAuthProvider>
      <TenantAuthProvider>
        <Routes>
          {/* Panel interno de Fivuza (platform_staff) -siempre bajo /admin. */}
          <Route path="/admin/login" element={<PlatformLoginPage />} />
          <Route element={<CoreProtectedRoute />}>
            <Route path="/admin" element={<CorePage />} />
          </Route>

          {/* ERP de cada tenant -se accede desde el subdominio del negocio. */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<TenantLoginPage />} />
          <Route element={<TenantProtectedRoute />}>
            <Route element={<ErpLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/inventario" element={<InventoryPage />} />
              <Route path="/ventas" element={<SalesPage />} />
              <Route element={<TenantProtectedRoute requirePermission="USERS_MANAGE" />}>
                <Route path="/usuarios" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </TenantAuthProvider>
    </CoreAuthProvider>
  )
}

export default App
