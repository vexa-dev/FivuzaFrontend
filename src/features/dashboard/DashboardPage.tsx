import {
  Banknote,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Clock,
  CloudOff,
  FileText,
  LayoutDashboard,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  Percent,
  Receipt,
  Settings,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet,
  Wifi,
  WifiOff,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import '../core/CorePage.css'
import './DashboardPage.css'
import { EmptyState } from '../../shared/components/EmptyState'
import { formatCurrency, formatQuantity, formatRelativeTime } from '../../shared/utils/format'
import { useAuth } from '../auth/hooks/useAuth'
import { useProducts } from '../inventory/hooks/useProducts'
import { usePurchaseOrders } from '../inventory/hooks/usePurchaseOrders'
import { useInventoryMovements, useLowStockVariants } from '../inventory/hooks/useStock'
import type { Sale } from '../sales/api'
import { useCustomers } from '../sales/hooks/useCustomers'
import { useOfflineSync } from '../sales/hooks/useOfflineSync'
import { useQuotes } from '../sales/hooks/useQuotes'
import { useReservations } from '../sales/hooks/useReservations'
import { useSales } from '../sales/hooks/useSales'
import { ActivityFeed, type ActivityItem } from './components/ActivityFeed'
import { CustomersSection } from './components/CustomersSection'
import { DashboardCardsModal } from './components/DashboardCardsModal'
import { GymSection } from './components/GymSection'
import { HrSection } from './components/HrSection'
import { InlineSparkline } from './components/InlineSparkline'
import { InventorySection } from './components/InventorySection'
import { SalesExtraSection } from './components/SalesExtraSection'
import { MonthTrendSparkline } from './components/MonthTrendSparkline'
import { PaymentMethodChart } from './components/PaymentMethodChart'
import { SalesByDayChart } from './components/SalesByDayChart'
import { WidgetSettingsModal } from './components/WidgetSettingsModal'
import { useCardVisibility } from './hooks/useCardVisibility'
import { useAttendanceToday, useOpenCashSessionsCount } from './hooks/useDashboardExtras'
import { useDashboardMetrics } from './hooks/useDashboardMetrics'
import { useWidgetVisibility } from './hooks/useWidgetVisibility'

const SALE_STATUS_LABEL: Record<Sale['payment_status'], string> = {
  PAID: 'Pagado',
  PARTIAL: 'Pago parcial',
  UNPAID: 'Sin pagar',
}

const MOVEMENT_CONCEPT_LABEL: Record<string, string> = {
  PURCHASE: 'Compra',
  ADJUSTMENT: 'Ajuste de stock',
  RETURN: 'Devolución',
}

export function DashboardPage() {
  const { data, isLoading, isConnected } = useDashboardMetrics()
  const { isVisible } = useWidgetVisibility()
  const { isCardVisible } = useCardVisibility()
  const { hasPermission } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [showCardsSettings, setShowCardsSettings] = useState(false)

  const canSeeAttendance = hasPermission('HR_MANAGE')
  const canViewInventory = hasPermission('INVENTORY_VIEW')
  const canSeeGym = hasPermission('GYM_MANAGE')
  const { count: openCashSessions } = useOpenCashSessionsCount()
  const { data: attendanceToday } = useAttendanceToday(canSeeAttendance)
  const { data: lowStockVariants } = useLowStockVariants({ enabled: canViewInventory })
  const showLowStockPanel = isCardVisible('lowStock') && canViewInventory
  const showTopProducts = isCardVisible('topProducts')

  // Pendientes operativos -datos que ya existen para sus propias pestañas
  // (Cotizaciones, Apartados, Ordenes de compra, Clientes) y que antes no
  // se veian en ningun lado sin entrar a cada modulo por separado.
  const { data: pendingQuotes } = useQuotes({ status: 'SENT' })
  const { data: activeReservations } = useReservations({ status: 'ACTIVE' })
  const { data: pendingPurchaseOrders } = usePurchaseOrders({
    status: 'PENDING',
    enabled: canViewInventory,
  })
  const { data: customers } = useCustomers()
  const customersWithDebt = customers?.filter((customer) => Number(customer.current_debt) > 0) ?? []
  const totalDebt = customersWithDebt.reduce((sum, customer) => sum + Number(customer.current_debt), 0)
  const showPendingPanel =
    isCardVisible('pending') &&
    ((pendingQuotes && pendingQuotes.length > 0) ||
      (activeReservations && activeReservations.length > 0) ||
      (canViewInventory && pendingPurchaseOrders && pendingPurchaseOrders.length > 0) ||
      customersWithDebt.length > 0)

  const { pendingCount: offlinePendingCount, failedCount: offlineFailedCount } = useOfflineSync()

  // Feed de actividad -combina ventas (SalesHistoryTab) y movimientos de
  // inventario (KardexTab), ambos acotados a los ultimos 3 dias. No incluye
  // altas de usuario ni cambios de permisos: el backend no guarda un
  // historial de esos eventos a nivel de negocio (ver ActivityFeed.tsx).
  const recentSalesFrom = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const { data: recentSalesRaw } = useSales({ date_from: recentSalesFrom })
  const { data: recentMovementsRaw } = useInventoryMovements({
    date_from: recentSalesFrom,
    enabled: canViewInventory,
  })
  const { data: productsForActivity } = useProducts({ enabled: canViewInventory })

  const customerName = (id: number) =>
    customers?.find((customer) => customer.id === id)?.name ?? `Cliente #${id}`

  const variantInfo = new Map<number, { productName: string; sku: string }>()
  productsForActivity?.forEach((product) => {
    product.variants.forEach((variant) => {
      variantInfo.set(variant.id, { productName: product.name, sku: variant.sku })
    })
  })

  const saleActivity: ActivityItem[] = (recentSalesRaw ?? []).map((sale) => ({
    id: `sale-${sale.id}`,
    timestamp: sale.created_at,
    icon: <Receipt size={14} strokeWidth={2} />,
    tone:
      sale.payment_status === 'PAID'
        ? 'success'
        : sale.payment_status === 'PARTIAL'
          ? 'warning'
          : 'danger',
    primary: customerName(sale.customer),
    secondary: `${sale.invoice_number} · ${SALE_STATUS_LABEL[sale.payment_status]} · ${formatRelativeTime(sale.created_at)}`,
    amount: formatCurrency(sale.total),
  }))

  // SALE queda fuera -esa venta ya aparece en saleActivity; mostrarla dos
  // veces (como venta y como salida de stock) duplicaria el mismo evento.
  const stockActivity: ActivityItem[] = (recentMovementsRaw ?? [])
    .filter((movement) => movement.concept !== 'SALE')
    .map((movement) => {
      const info = variantInfo.get(movement.variant)
      return {
        id: `stock-${movement.id}`,
        timestamp: movement.created_at,
        icon:
          movement.type === 'IN' ? (
            <PackagePlus size={14} strokeWidth={2} />
          ) : (
            <PackageMinus size={14} strokeWidth={2} />
          ),
        tone: movement.type === 'IN' ? 'success' : 'danger',
        primary: info ? info.productName : `Variante #${movement.variant}`,
        secondary: `${MOVEMENT_CONCEPT_LABEL[movement.concept] ?? movement.concept} · ${formatRelativeTime(movement.created_at)}`,
        amount: `${movement.type === 'IN' ? '+' : '-'}${formatQuantity(movement.quantity)}`,
      }
    })

  const activityItems = [...saleActivity, ...stockActivity]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 7)

  const attendanceSummary = attendanceToday
    ? {
        onTime: attendanceToday.reduce((sum, row) => sum + row.on_time_count, 0),
        late: attendanceToday.reduce((sum, row) => sum + row.late_count, 0),
      }
    : null

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="page-header-title-group">
          <span className="page-header-icon">
            <LayoutDashboard size={20} strokeWidth={2} />
          </span>
          <div>
            <h1 className="core-page-title">Dashboard</h1>
            <p className="core-page-subtitle">Métricas del negocio en tiempo real</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(offlinePendingCount > 0 || offlineFailedCount > 0) && (
            <span
              className={`badge ${offlineFailedCount > 0 ? 'badge-danger' : 'badge-warning'}`}
              title={
                offlineFailedCount > 0
                  ? `${offlineFailedCount} venta(s) fallaron al sincronizar -revisa el POS`
                  : `${offlinePendingCount} venta(s) esperando conexión para sincronizar`
              }
            >
              <CloudOff size={13} strokeWidth={2} />
              {offlineFailedCount > 0
                ? `${offlineFailedCount} sin sincronizar`
                : `${offlinePendingCount} pendiente(s) de sync`}
            </span>
          )}
          <span
            className={`badge ${isConnected ? 'badge-success' : 'badge-neutral'}`}
            title={
              isConnected
                ? 'Conectado por WebSocket -las ventas se reflejan al instante'
                : 'Sin conexión en tiempo real -actualizando cada 30 segundos'
            }
          >
            <span className="dot" />
            {isConnected ? (
              <>
                <Wifi size={13} /> En vivo
              </>
            ) : (
              <>
                <WifiOff size={13} /> Actualizando cada 30s
              </>
            )}
          </span>
          <button
            type="button"
            className="dashboard-settings-btn"
            aria-label="Elegir qué cards se muestran"
            title="Elegir qué cards se muestran"
            onClick={() => setShowCardsSettings(true)}
          >
            <Settings size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="hero-stats-grid dashboard-hero-grid">
            <div className="card hero-stat-card dashboard-hero-card dashboard-hero-in">
              <div className="dashboard-hero-card-text">
                <CalendarRange size={22} strokeWidth={2} className="hero-stat-icon" />
                <span className="hero-stat-label">Ventas del mes</span>
                <span className="hero-stat-value">{formatCurrency(data.month.total_sales)}</span>
                <span className="hero-stat-caption">
                  {data.comparison_vs_previous_month.change_pct !== null ? (
                    <>
                      {Number(data.comparison_vs_previous_month.change_pct) >= 0 ? (
                        <TrendingUp size={13} strokeWidth={2} color="var(--success)" />
                      ) : (
                        <TrendingDown size={13} strokeWidth={2} color="var(--danger)" />
                      )}{' '}
                      {Number(data.comparison_vs_previous_month.change_pct) >= 0 ? '+' : ''}
                      {data.comparison_vs_previous_month.change_pct}% vs. mes anterior (
                      {formatCurrency(data.comparison_vs_previous_month.previous_total)})
                    </>
                  ) : (
                    'Sin datos del mes anterior'
                  )}
                </span>
              </div>
              <div className="dashboard-hero-sparkline">
                <MonthTrendSparkline data={data.month.by_day} />
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="dashboard-compact-card-header">
                <span className="dashboard-compact-card-title">Resumen</span>
                <button
                  type="button"
                  className="dashboard-settings-btn"
                  aria-label="Personalizar dashboard"
                  title="Personalizar dashboard"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings size={15} strokeWidth={2} />
                </button>
              </div>
              <div className="compact-stats-stack dashboard-compact-stack">
                {isVisible('SALES_TODAY') && (
                  <CompactStat
                    index={0}
                    icon={<CalendarDays size={18} strokeWidth={2} />}
                    label={`Ventas de hoy · ${data.today.total_transactions} venta(s)`}
                    value={formatCurrency(data.today.total_sales)}
                  />
                )}
                <CompactStat
                  index={1}
                  icon={<Percent size={18} strokeWidth={2} />}
                  label="Margen bruto (30 días)"
                  value={
                    data.gross_margin.margin_pct !== null ? `${data.gross_margin.margin_pct}%` : '—'
                  }
                  title={`Ingresos: ${formatCurrency(data.gross_margin.total_revenue)} · Costo: ${formatCurrency(data.gross_margin.total_cost)}`}
                />
                <CompactStat
                  index={2}
                  icon={<CalendarRange size={18} strokeWidth={2} />}
                  label="Ventas de la semana"
                  value={formatCurrency(data.week.total_sales)}
                  sparkline={<InlineSparkline data={data.week.by_day} />}
                />
                {isVisible('CASH_STATUS') && (
                  <CompactStat
                    index={3}
                    icon={<Wallet size={18} strokeWidth={2} />}
                    label="Cajas abiertas"
                    value={String(openCashSessions)}
                  />
                )}
                {isVisible('ATTENDANCE_TODAY') && canSeeAttendance && attendanceSummary && (
                  <CompactStat
                    index={4}
                    icon={<Clock size={18} strokeWidth={2} />}
                    label={`Asistencia de hoy · ${attendanceSummary.late} tarde`}
                    value={`${attendanceSummary.onTime} a tiempo`}
                  />
                )}
              </div>
            </div>
          </div>

          {(isCardVisible('salesByDay') || isCardVisible('paymentMethods')) && (
            <div className="charts-grid">
              {isCardVisible('salesByDay') && (
                <div className="card dashboard-chart-card" style={{ padding: 16 }}>
                  <h3 className="card-title">Ventas por día (últimos 30 días)</h3>
                  <SalesByDayChart data={data.month.by_day} />
                </div>
              )}
              {isCardVisible('paymentMethods') && (
                <div className="card dashboard-chart-card" style={{ padding: 16 }}>
                  <h3 className="card-title">Métodos de pago (30 días)</h3>
                  <PaymentMethodChart data={data.payment_method_distribution} />
                </div>
              )}
            </div>
          )}

          {(showTopProducts || showLowStockPanel || showPendingPanel) && (
            <div className="dashboard-split-grid">
              {showPendingPanel && (
                <div className="card dashboard-split-card" style={{ padding: 20 }}>
                  <div className="dashboard-compact-card-header">
                    <span className="dashboard-compact-card-title">Pendientes</span>
                  </div>
                  <div className="compact-stats-stack dashboard-compact-stack">
                    {pendingQuotes && pendingQuotes.length > 0 && (
                      <CompactStat
                        index={0}
                        icon={<FileText size={18} strokeWidth={2} />}
                        label="Cotizaciones pendientes"
                        value={String(pendingQuotes.length)}
                      />
                    )}
                    {activeReservations && activeReservations.length > 0 && (
                      <CompactStat
                        index={1}
                        icon={<CalendarClock size={18} strokeWidth={2} />}
                        label="Apartados activos"
                        value={String(activeReservations.length)}
                      />
                    )}
                    {canViewInventory && pendingPurchaseOrders && pendingPurchaseOrders.length > 0 && (
                      <CompactStat
                        index={2}
                        icon={<Truck size={18} strokeWidth={2} />}
                        label="Órdenes de compra por recibir"
                        value={String(pendingPurchaseOrders.length)}
                      />
                    )}
                    {customersWithDebt.length > 0 && (
                      <CompactStat
                        index={3}
                        icon={<Banknote size={18} strokeWidth={2} />}
                        label={`Clientes con deuda · S/ ${totalDebt.toFixed(2)}`}
                        value={String(customersWithDebt.length)}
                      />
                    )}
                  </div>
                </div>
              )}

              {showTopProducts && (
                <div className="card core-table-card dashboard-split-card">
                  <div style={{ padding: '12px 16px 0' }}>
                    <h3 className="card-title">Productos más vendidos (30 días)</h3>
                  </div>
                  {data.top_products.length === 0 ? (
                    <EmptyState icon={<ShoppingCart />} title="Sin ventas en este periodo" />
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="core-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad vendida</th>
                            <th>Ingresos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.top_products.map((product) => (
                            <tr key={product.product_name}>
                              <td className="core-table-strong">{product.product_name}</td>
                              <td>{formatQuantity(product.quantity_sold)}</td>
                              <td>{formatCurrency(product.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {showLowStockPanel && (
                <div className="card core-table-card dashboard-split-card">
                  <div style={{ padding: '12px 16px 0' }}>
                    <h3 className="card-title">Stock crítico</h3>
                  </div>
                  {!lowStockVariants || lowStockVariants.length === 0 ? (
                    <EmptyState icon={<PackageCheck />} title="Sin productos en stock crítico" />
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="core-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Stock</th>
                            <th>Mínimo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lowStockVariants.map((variant) => (
                            <tr key={variant.id}>
                              <td>
                                <div className="core-table-strong">{variant.product_name}</div>
                                <div className="core-page-subtitle" style={{ margin: 0 }}>
                                  {variant.sku}
                                </div>
                              </td>
                              <td>
                                <span className="badge badge-danger">
                                  {formatQuantity(variant.total_stock)}
                                </span>
                              </td>
                              <td>{formatQuantity(variant.min_stock)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Secciones por modulo -todo lo que el sistema ya calcula/guarda
              pero no vivia en ningun lado del dashboard (auditoria previa).
              Cada una pide sus propios datos y se gatea con el mismo
              permiso que ya protege esa pantalla en el sidebar. */}
          {canViewInventory && isCardVisible('inventory') && <InventorySection />}
          {isCardVisible('salesExtra') && <SalesExtraSection />}
          {isCardVisible('customers') && <CustomersSection />}
          {canSeeAttendance && isCardVisible('hr') && <HrSection />}
          {canSeeGym && isCardVisible('gym') && <GymSection />}

          {isCardVisible('activity') && (
            <div className="card" style={{ padding: 20 }}>
              <div className="dashboard-compact-card-header">
                <span className="dashboard-compact-card-title">Actividad reciente</span>
              </div>
              <ActivityFeed items={activityItems} />
            </div>
          )}
        </div>
      )}

      {showSettings && <WidgetSettingsModal onClose={() => setShowSettings(false)} />}
      {showCardsSettings && <DashboardCardsModal onClose={() => setShowCardsSettings(false)} />}
    </div>
  )
}

// Fila compacta de la pila junto al KPI hero -reusa .compact-stat-row del
// modulo Core (misma jerarquia "una cifra manda, el resto acompaña" que ya
// resolvia el Resumen de tenant, ahora tambien en el Dashboard).
function CompactStat({
  icon,
  label,
  value,
  index,
  title,
  sparkline,
}: {
  icon: ReactNode
  label: string
  value: string
  index: number
  title?: string
  sparkline?: ReactNode
}) {
  return (
    <div
      className="compact-stat-row dashboard-compact-row"
      style={{ '--kpi-index': index } as CSSProperties}
      title={title}
    >
      {icon}
      <span className="compact-stat-label">{label}</span>
      {sparkline}
      <span className="compact-stat-value">{value}</span>
    </div>
  )
}
