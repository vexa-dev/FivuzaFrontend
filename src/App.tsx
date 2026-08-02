import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute as CoreProtectedRoute } from './features/core/components/ProtectedRoute'
import { AuthProvider as CoreAuthProvider } from './features/core/hooks/AuthContext'
import { LoginPage as PlatformLoginPage } from './features/core/LoginPage'
import { ProtectedRoute as TenantProtectedRoute } from './features/auth/components/ProtectedRoute'
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage'
import { AuthProvider as TenantAuthProvider } from './features/auth/hooks/AuthContext'
import { LoginPage as TenantLoginPage } from './features/auth/LoginPage'
import { ResetPasswordPage } from './features/auth/ResetPasswordPage'
import { ErpLayout } from './shared/components/ErpLayout'

// Code splitting por ruta (Sprint 7, build de producción): cada pantalla del
// ERP se sirve como su propio chunk, para que el bundle inicial (login) no
// cargue Inventario/Ventas/Usuarios/CorePage por adelantado.
const CorePage = lazy(() => import('./features/core/CorePage').then((m) => ({ default: m.CorePage })))
const DashboardPage = lazy(() =>
  import('./features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const InventoryPage = lazy(() =>
  import('./features/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage })),
)
const SalesPage = lazy(() => import('./features/sales/SalesPage').then((m) => ({ default: m.SalesPage })))
const UsersPage = lazy(() => import('./features/users/UsersPage').then((m) => ({ default: m.UsersPage })))

function App() {
  return (
    <CoreAuthProvider>
      <TenantAuthProvider>
        <Suspense fallback={null}>
          <Routes>
            {/* Panel interno de Fivuza (platform_staff) -siempre bajo /admin. */}
            <Route path="/admin/login" element={<PlatformLoginPage />} />
            <Route element={<CoreProtectedRoute />}>
              <Route path="/admin" element={<CorePage />} />
            </Route>

            {/* ERP de cada tenant -se accede desde el subdominio del negocio. */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<TenantLoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<TenantProtectedRoute />}>
              <Route element={<ErpLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route element={<TenantProtectedRoute requirePermission="INVENTORY_VIEW" />}>
                  <Route path="/inventario" element={<InventoryPage />} />
                </Route>
                <Route path="/ventas" element={<SalesPage />} />
                <Route element={<TenantProtectedRoute requirePermission="USERS_MANAGE" />}>
                  <Route path="/usuarios" element={<UsersPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </TenantAuthProvider>
    </CoreAuthProvider>
  )
}

export default App
