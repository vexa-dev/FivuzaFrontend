import {
  ChevronsLeft,
  ChevronsRight,
  Contact,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Users as UsersIcon,
} from 'lucide-react'
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
  { to: '/rrhh', label: 'RRHH', icon: Contact, requirePermission: 'HR_MANAGE' },
  { to: '/gimnasio', label: 'Gimnasio', icon: Dumbbell, requirePermission: 'GYM_MANAGE' },
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
            {collapsed ? <ChevronsRight size={14} strokeWidth={2} /> : <ChevronsLeft size={14} strokeWidth={2} />}
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

        {/* Cuenta/tema/logout viven en el sidebar en vez de una topbar
            aparte (feedback de diseno): libera una fila entera de cada
            pantalla del ERP y deja el avatar/rol junto a la navegacion, que
            es donde el usuario ya esta mirando. */}
        <div className="erp-sidebar-footer">
          <div className="erp-sidebar-user" title={collapsed ? user?.email : undefined}>
            <span className="avatar">{initial}</span>
            <div className="erp-sidebar-user-info">
              <span className="erp-sidebar-user-email">{user?.email}</span>
              <span className="badge badge-neutral">{user?.role}</span>
            </div>
          </div>
          <div className="erp-sidebar-footer-actions">
            <ThemeToggle />
            <button
              type="button"
              className="erp-sidebar-logout"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut size={collapsed ? 14 : 17} strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>

      <div className="erp-main">
        <header className="erp-mobile-topbar">
          <button
            type="button"
            className="erp-mobile-menu-toggle"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          <Logo height={20} withWordmark={false} />
        </header>

        <main className="erp-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
