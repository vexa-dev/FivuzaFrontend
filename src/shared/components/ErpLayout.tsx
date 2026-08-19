import {
  Contact,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Users as UsersIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useLogout } from '../../features/auth/hooks/useLogout'
import { useLowStockVariants } from '../../features/inventory/hooks/useStock'
import { useTheme } from '../../theme/useTheme'
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

// Layout en 2 partes claras: .erp-topbar (arriba, fija, logo+avatar
// perfectamente alineados) y .erp-content (el cuerpo, debajo, libre de
// ocupar toda la pantalla sin que nada lo mueva). El menu de navegacion y
// el de cuenta son dropdowns que flotan SOBRE el cuerpo cuando se abren
// -ninguno de los dos empuja ni redimensiona nada, asi la topbar nunca
// necesita moverse para hacerles espacio.
export function ErpLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const { user, hasPermission } = useAuth()
  const { theme } = useTheme()
  const handleLogout = useLogout()
  const canViewInventory = hasPermission('INVENTORY_VIEW')
  const { data: lowStockVariants } = useLowStockVariants({ enabled: canViewInventory })

  const initial = user?.email?.[0]?.toUpperCase() ?? '?'
  const lowStockCount = lowStockVariants?.length ?? 0

  // Dropdown de navegacion: mismo patron que el de cuenta (portal a body,
  // posicion calculada desde el boton que lo abre) -crece hacia abajo
  // desde el logo, que esta pegado al borde izquierdo.
  const navTriggerRef = useRef<HTMLButtonElement>(null)
  const navMenuRef = useRef<HTMLDivElement>(null)
  const [navMenuPos, setNavMenuPos] = useState({ top: 0, left: 0 })

  const openNav = () => {
    const rect = navTriggerRef.current?.getBoundingClientRect()
    // Centro horizontal del logo (no su borde izquierdo) -el dropdown se
    // centra sobre el con translateX(-50%) en CSS, en vez de compartir el
    // mismo borde izquierdo (que se veia desalineado cuando difieren de
    // ancho, el logo con wordmark vs el link mas largo del menu).
    if (rect) setNavMenuPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 })
    setNavOpen(true)
  }

  // Cuanto se corre el contenido en desktop cuando el menu esta abierto
  // (ver .erp-layout-nav-open .erp-content en el CSS, que usa esto via
  // variable inline). Se mide el ancho REAL del dropdown ya renderizado en
  // vez de asumir un valor fijo -el ancho cambia segun el label mas largo
  // y la tipografia/tema activo, un numero fijo quedaba desactualizado
  // (dejaba de mas o de menos hueco) apenas cambiaba cualquiera de esos.
  // El hueco VISIBLE (borde derecho del menu -> donde arrancan las tarjetas,
  // no el borde de la caja) tiene que quedar igual al hueco del lado
  // izquierdo (topbar padding, 20px). .erp-content ya trae su propio
  // padding-left (32px, ver CSS) antes de esas tarjetas, asi que ese
  // padding hay que restarlo del margin-left -si no, el hueco derecho
  // termina siendo 20+32=52px en vez de 20px, el doble que el izquierdo.
  const CONTENT_GAP = 20
  const CONTENT_PADDING_LEFT = 32
  const [navGapPx, setNavGapPx] = useState(180)
  useEffect(() => {
    if (!navOpen) return
    const measure = () => {
      const rect = navMenuRef.current?.getBoundingClientRect()
      if (rect) setNavGapPx(Math.round(rect.right + CONTENT_GAP - CONTENT_PADDING_LEFT))
    }
    const raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [navOpen])

  useEffect(() => {
    if (!navOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        navTriggerRef.current &&
        !navTriggerRef.current.contains(target) &&
        navMenuRef.current &&
        !navMenuRef.current.contains(target)
      ) {
        setNavOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [navOpen])

  // Cuenta: mismo mecanismo, anclado al boton del avatar (borde derecho).
  const accountTriggerRef = useRef<HTMLDivElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const [accountMenuPos, setAccountMenuPos] = useState({ top: 0, right: 0 })

  const openAccountMenu = () => {
    const rect = accountTriggerRef.current?.getBoundingClientRect()
    if (rect) setAccountMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    setAccountOpen(true)
  }

  useEffect(() => {
    if (!accountOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        accountTriggerRef.current &&
        !accountTriggerRef.current.contains(target) &&
        accountMenuRef.current &&
        !accountMenuRef.current.contains(target)
      ) {
        setAccountOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [accountOpen])

  // Ripple liquido al presionar un boton (logo, avatar, links del menu) -va
  // por estado de React, no appendChild directo: estos elementos
  // re-renderizan seguido por su cuenta (polling de stock bajo, cambios de
  // ruta), y un nodo insertado a mano se lo pisa React a mitad de animacion.
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
    <div className={`erp-layout ${navOpen ? 'erp-layout-nav-open' : ''}`}>
      <ImpersonationBanner />

      {/* Parte de arriba: fila unica, logo a la izquierda y avatar a la
          derecha, perfectamente alineados -nunca se mueve, nunca se tapa. */}
      <header className="erp-topbar">
        <button
          type="button"
          ref={navTriggerRef}
          className={`erp-sidebar-logo-trigger ${navOpen ? 'erp-sidebar-logo-trigger-open' : ''}`}
          onClick={() => (navOpen ? setNavOpen(false) : openNav())}
          onPointerDown={spawnLiquidRipple('logo')}
          aria-expanded={navOpen}
          aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <Logo height={22} withWordmark />
          {renderRipples('logo')}
        </button>

        <div className="erp-topbar-account" ref={accountTriggerRef}>
          <button
            type="button"
            className="erp-avatar-trigger"
            onClick={() => (accountOpen ? setAccountOpen(false) : openAccountMenu())}
            onPointerDown={spawnLiquidRipple('account')}
            aria-label="Cuenta"
            aria-expanded={accountOpen}
            title={user?.email}
          >
            <span className="avatar">{initial}</span>
            {renderRipples('account')}
          </button>
        </div>
      </header>

      {/* Dropdown de navegacion: flota SOBRE el cuerpo, no lo empuja. */}
      {navOpen &&
        createPortal(
          <div
            className="erp-nav-menu"
            role="menu"
            ref={navMenuRef}
            style={{ top: navMenuPos.top, left: navMenuPos.left }}
          >
            {NAV_ITEMS.filter(
              (item) => !item.requirePermission || hasPermission(item.requirePermission),
            ).map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setNavOpen(false)}
                  onPointerDown={spawnLiquidRipple(item.to)}
                  className={({ isActive }) =>
                    `erp-sidebar-link ${isActive ? 'erp-sidebar-link-active' : ''}`
                  }
                  role="menuitem"
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
          </div>,
          document.body,
        )}

      {/* Dropdown de cuenta: mismo trato, flota sobre el cuerpo. */}
      {accountOpen &&
        createPortal(
          <div
            className="erp-account-menu"
            role="menu"
            ref={accountMenuRef}
            style={{ top: accountMenuPos.top, right: accountMenuPos.right }}
          >
            <div className="erp-account-menu-header">
              <span className="erp-account-menu-email">{user?.email}</span>
              <span className="badge badge-neutral">{user?.role}</span>
            </div>

            <div className="erp-account-menu-divider" />

            <div className="erp-account-menu-row">
              <span>Tema {theme === 'dark' ? 'oscuro' : 'claro'}</span>
              <ThemeToggle />
            </div>

            <NavLink
              to="/configuracion"
              className="erp-account-menu-item"
              onClick={() => setAccountOpen(false)}
              role="menuitem"
            >
              <Settings size={16} strokeWidth={2} />
              Configuración
            </NavLink>

            <button
              type="button"
              className="erp-account-menu-item erp-account-menu-item-danger"
              onClick={handleLogout}
              role="menuitem"
            >
              <LogOut size={16} strokeWidth={2} />
              Cerrar sesión
            </button>
          </div>,
          document.body,
        )}

      {/* Parte de abajo: el cuerpo, libre -nunca se corre ni se achica
          para hacerle espacio a nada de arriba. --erp-nav-gap alimenta el
          margin-left de .erp-layout-nav-open .erp-content (ver CSS); en
          tablet/mobile ese media query lo ignora, el menu queda de overlay. */}
      <main className="erp-content" style={{ '--erp-nav-gap': `${navGapPx}px` } as React.CSSProperties}>
        <Outlet />
      </main>
    </div>
  )
}
