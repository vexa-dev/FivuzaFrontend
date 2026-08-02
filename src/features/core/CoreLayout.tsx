import { Building2, LayoutDashboard, LogOut } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { Logo } from '../../shared/components/Logo'
import { ThemeToggle } from '../../shared/components/ThemeToggle'
import { useLogout } from './hooks/useLogout'
import './CorePage.css'
import './CoreLayout.css'

const NAV_ITEMS = [
  { to: '/admin/resumen', label: 'Resumen', icon: LayoutDashboard },
  { to: '/admin/tenants', label: 'Tenants', icon: Building2 },
]

export function CoreLayout() {
  const handleLogout = useLogout()

  return (
    <div className="core-layout">
      <aside className="core-sidebar">
        <div className="core-sidebar-header">
          <Logo height={20} />
        </div>
        <nav className="core-sidebar-nav">
          {NAV_ITEMS.map((item) => {
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
          <span className="core-topbar-title">Panel interno de Fivuza</span>
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
