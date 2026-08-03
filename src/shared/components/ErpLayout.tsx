import { LayoutDashboard, LogOut, Menu, Package, ShoppingCart, Users as UsersIcon } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useLogout } from '../../features/auth/hooks/useLogout'
import { useLowStockVariants } from '../../features/inventory/hooks/useStock'
import { ImpersonationBanner } from './ImpersonationBanner'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import './ErpLayout.css'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventario', label: 'Inventario', icon: Package, requirePermission: 'INVENTORY_VIEW' },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { to: '/usuarios', label: 'Usuarios', icon: UsersIcon, requirePermission: 'USERS_MANAGE' },
]

export function ErpLayout() {
  const [collapsed, setCollapsed] = useState(false)
  // Independiente de "collapsed" (que en desktop solo angosta el sidebar):
  // en mobile el sidebar vive fuera de pantalla por defecto y este estado
  // lo trae como un drawer superpuesto, sin afectar el layout de desktop.
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, hasPermission } = useAuth()
  const handleLogout = useLogout()
  const canViewInventory = hasPermission('INVENTORY_VIEW')
  const { data: lowStockVariants } = useLowStockVariants({ enabled: canViewInventory })

  const initial = user?.email?.[0]?.toUpperCase() ?? '?'
  const lowStockCount = lowStockVariants?.length ?? 0

  return (
    <div className={`erp-layout ${collapsed ? 'erp-layout-collapsed' : ''}`}>
      <ImpersonationBanner />
      {mobileOpen && (
        <div className="erp-sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`erp-sidebar ${mobileOpen ? 'erp-sidebar-mobile-open' : ''}`}>
        <div className="erp-sidebar-header">
          <Logo height={22} withWordmark={!collapsed} />
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
          ).map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `erp-sidebar-link ${isActive ? 'erp-sidebar-link-active' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon size={17} strokeWidth={2} className="erp-sidebar-link-icon" />
                <span className="erp-sidebar-link-label">{item.label}</span>
                {item.to === '/inventario' && lowStockCount > 0 && (
                  <span
                    className="erp-sidebar-link-badge"
                    title={`${lowStockCount} variante(s) con stock bajo`}
                  >
                    {lowStockCount}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <div className="erp-main">
        <header className="erp-topbar">
          <div className="erp-topbar-user">
            <button
              type="button"
              className="erp-mobile-menu-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={20} strokeWidth={2} />
            </button>
            <span className="avatar">{initial}</span>
            <div className="erp-topbar-user-info">
              <span className="erp-topbar-email">{user?.email}</span>
              <span className="badge badge-neutral">{user?.role}</span>
            </div>
          </div>
          <div className="erp-topbar-actions">
            <ThemeToggle />
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              <LogOut size={15} strokeWidth={2} />
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
