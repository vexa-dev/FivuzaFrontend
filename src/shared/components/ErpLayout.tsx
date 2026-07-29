import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useLogout } from '../../features/auth/hooks/useLogout'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import './ErpLayout.css'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/inventario', label: 'Inventario' },
  { to: '/ventas', label: 'Ventas' },
  { to: '/usuarios', label: 'Usuarios', requirePermission: 'USERS_MANAGE' },
]

export function ErpLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, hasPermission } = useAuth()
  const handleLogout = useLogout()

  return (
    <div className={`erp-layout ${collapsed ? 'erp-layout-collapsed' : ''}`}>
      <aside className="erp-sidebar">
        <div className="erp-sidebar-header">
          <Logo height={22} />
          <button
            type="button"
            className="erp-sidebar-toggle"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        <nav className="erp-sidebar-nav">
          {NAV_ITEMS.filter(
            (item) => !item.requirePermission || hasPermission(item.requirePermission),
          ).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `erp-sidebar-link ${isActive ? 'erp-sidebar-link-active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="erp-main">
        <header className="erp-topbar">
          <div className="erp-topbar-user">
            <span className="erp-topbar-email">{user?.email}</span>
            <span className="badge badge-neutral">{user?.role}</span>
          </div>
          <div className="erp-topbar-actions">
            <ThemeToggle />
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="erp-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
