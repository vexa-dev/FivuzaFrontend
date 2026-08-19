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
// cargue Inventario/Ventas/Usuarios/panel core por adelantado.
const CoreLayout = lazy(() =>
  import('./features/core/CoreLayout').then((m) => ({ default: m.CoreLayout })),
)
const CoreDashboardPage = lazy(() =>
  import('./features/core/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const TenantsPage = lazy(() =>
  import('./features/core/TenantsPage').then((m) => ({ default: m.TenantsPage })),
)
const TenantDetailPage = lazy(() =>
  import('./features/core/TenantDetailPage').then((m) => ({ default: m.TenantDetailPage })),
)
const PlansPage = lazy(() =>
  import('./features/core/PlansPage').then((m) => ({ default: m.PlansPage })),
)
const SubscriptionsPage = lazy(() =>
  import('./features/core/SubscriptionsPage').then((m) => ({ default: m.SubscriptionsPage })),
)
const PaymentsPage = lazy(() =>
  import('./features/core/PaymentsPage').then((m) => ({ default: m.PaymentsPage })),
)
const StaffPage = lazy(() =>
  import('./features/core/StaffPage').then((m) => ({ default: m.StaffPage })),
)
const ActivityPage = lazy(() =>
  import('./features/core/ActivityPage').then((m) => ({ default: m.ActivityPage })),
)
const DashboardPage = lazy(() =>
  import('./features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const InventoryPage = lazy(() =>
  import('./features/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage })),
)
const SalesPage = lazy(() => import('./features/sales/SalesPage').then((m) => ({ default: m.SalesPage })))
const UsersPage = lazy(() => import('./features/users/UsersPage').then((m) => ({ default: m.UsersPage })))
const HRPage = lazy(() => import('./features/hr/HRPage').then((m) => ({ default: m.HRPage })))
const GimnasioPage = lazy(() =>
  import('./features/gimnasio/GimnasioPage').then((m) => ({ default: m.GimnasioPage })),
)
const SettingsPage = lazy(() =>
  import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const ImpersonateLandingPage = lazy(() =>
  import('./features/auth/ImpersonateLandingPage').then((m) => ({
    default: m.ImpersonateLandingPage,
  })),
)

function App() {
  return (
    <CoreAuthProvider>
      <TenantAuthProvider>
        <Suspense fallback={null}>
          <Routes>
            {/* Panel interno de Fivuza (platform_staff) -siempre bajo /admin. */}
            <Route path="/admin/login" element={<PlatformLoginPage />} />
            <Route element={<CoreProtectedRoute />}>
              <Route element={<CoreLayout />}>
                <Route path="/admin" element={<Navigate to="/admin/resumen" replace />} />
                <Route path="/admin/resumen" element={<CoreDashboardPage />} />
                <Route path="/admin/tenants" element={<TenantsPage />} />
                <Route path="/admin/tenants/:id" element={<TenantDetailPage />} />
                <Route path="/admin/planes" element={<PlansPage />} />
                <Route path="/admin/suscripciones" element={<SubscriptionsPage />} />
                <Route path="/admin/pagos" element={<PaymentsPage />} />
                <Route path="/admin/actividad" element={<ActivityPage />} />
                <Route element={<CoreProtectedRoute requireRole={['SUPER_ADMIN']} />}>
                  <Route path="/admin/equipo" element={<StaffPage />} />
                </Route>
              </Route>
            </Route>

            {/* ERP de cada tenant -se accede desde el subdominio del negocio. */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<TenantLoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/impersonate" element={<ImpersonateLandingPage />} />
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
                <Route element={<TenantProtectedRoute requirePermission="HR_MANAGE" />}>
                  <Route path="/rrhh" element={<HRPage />} />
                </Route>
                <Route element={<TenantProtectedRoute requirePermission="GYM_MANAGE" />}>
                  <Route path="/gimnasio" element={<GimnasioPage />} />
                </Route>
                <Route path="/configuracion" element={<SettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </TenantAuthProvider>
    </CoreAuthProvider>
  )
}

export default App
