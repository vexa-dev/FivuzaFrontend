import {
  Activity,
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Users,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { Logo } from '../../shared/components/Logo'
import { ThemeToggle } from '../../shared/components/ThemeToggle'
import { useAuth } from './hooks/useAuth'
import { useLogout } from './hooks/useLogout'
import type { PlatformStaffInfo } from './hooks/session'
import './CorePage.css'
import './CoreLayout.css'

const NAV_ITEMS: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  roles?: PlatformStaffInfo['role'][]
}[] = [
  { to: '/admin/resumen', label: 'Resumen', icon: LayoutDashboard },
  { to: '/admin/tenants', label: 'Tenants', icon: Building2 },
  { to: '/admin/planes', label: 'Planes', icon: Package },
  { to: '/admin/suscripciones', label: 'Suscripciones', icon: Receipt },
  { to: '/admin/pagos', label: 'Pagos', icon: CreditCard },
  // Equipo Fivuza expone quien tiene cada rol interno -solo SUPER_ADMIN,
  // igual que ya lo exige el backend (PlatformStaffViewSet).
  { to: '/admin/equipo', label: 'Equipo Fivuza', icon: Users, roles: ['SUPER_ADMIN'] },
  { to: '/admin/actividad', label: 'Actividad', icon: Activity },
]

export function CoreLayout() {
  const handleLogout = useLogout()
  const { staff, hasRole } = useAuth()

  return (
    <div className="core-layout">
      <aside className="core-sidebar">
        <div className="core-sidebar-header">
          <Logo height={20} />
        </div>
        <nav className="core-sidebar-nav">
          {NAV_ITEMS.filter((item) => !item.roles || hasRole(...item.roles)).map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `core-sidebar-link ${isActive ? 'core-sidebar-link-active' : ''}`
                }
              >
                <Icon size={17} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <div className="core-main">
        <header className="core-topbar">
          <span className="core-topbar-title">
            Panel interno de Fivuza
            {staff && <span className="core-topbar-role badge badge-neutral">{staff.role}</span>}
          </span>
          <div className="core-topbar-actions">
            <ThemeToggle />
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              <LogOut size={15} strokeWidth={2} />
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="core-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
