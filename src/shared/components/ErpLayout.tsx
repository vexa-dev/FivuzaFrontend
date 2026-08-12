import {
  ChevronsLeft,
  Contact,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Users as UsersIcon,
} from 'lucide-react'
import { useRef, useState } from 'react'
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

  // Ripple liquido al presionar un boton/link del sidebar (no al pasar el
  // mouse por el panel entero -eso se veia como un blob persiguiendo el
  // cursor, no como vidrio). Va por estado de React (no appendChild directo
  // al DOM): el sidebar re-renderiza seguido por su cuenta (polling de
  // stock bajo, cambios de ruta que actualizan isActive en el link que se
  // acaba de clickear), y un nodo insertado a mano se lo pisa React en el
  // proximo render -se veia roto a mitad de animacion. Como estado, React
  // lo trata como un hijo mas y lo sobrevive.
  const rippleIdRef = useRef(0)
  const [ripples, setRipples] = useState<
    { id: number; key: string; left: number; top: number; size: number }[]
  >([])

  const spawnLiquidRipple = (rippleKey: string) => (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'touch' && event.pointerType !== 'pen') {
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 1.8
    rippleIdRef.current += 1
    setRipples((prev) => [
      ...prev,
      {
        id: rippleIdRef.current,
        key: rippleKey,
        left: event.clientX - rect.left - size / 2,
        top: event.clientY - rect.top - size / 2,
        size,
      },
    ])
  }

  const removeRipple = (id: number) => {
    setRipples((prev) => prev.filter((ripple) => ripple.id !== id))
  }

  const renderRipples = (rippleKey: string) =>
    ripples
      .filter((ripple) => ripple.key === rippleKey)
      .map((ripple) => (
        <span
          key={ripple.id}
          className="liquid-ripple"
          style={{ left: ripple.left, top: ripple.top, width: ripple.size, height: ripple.size }}
          onAnimationEnd={() => removeRipple(ripple.id)}
        />
      ))

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
            onPointerDown={spawnLiquidRipple('toggle')}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <ChevronsLeft
              size={14}
              strokeWidth={2}
              className="erp-sidebar-toggle-icon"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
            {renderRipples('toggle')}
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
                onPointerDown={spawnLiquidRipple(item.to)}
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
                {renderRipples(item.to)}
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
            <NavLink
              to="/configuracion"
              className={({ isActive }) => `erp-sidebar-settings ${isActive ? 'erp-sidebar-settings-active' : ''}`}
              onPointerDown={spawnLiquidRipple('settings')}
              aria-label="Configuración"
              title="Configuración"
            >
              <Settings size={collapsed ? 14 : 17} strokeWidth={2} />
              {renderRipples('settings')}
            </NavLink>
            <button
              type="button"
              className="erp-sidebar-logout"
              onClick={handleLogout}
              onPointerDown={spawnLiquidRipple('logout')}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut size={collapsed ? 14 : 17} strokeWidth={2} />
              {renderRipples('logout')}
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
