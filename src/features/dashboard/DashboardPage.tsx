import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  Clock,
  Percent,
  Settings,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useState } from 'react'
import '../core/CorePage.css'
import { EmptyState } from '../../shared/components/EmptyState'
import { useAuth } from '../auth/hooks/useAuth'
import { KpiCard } from './components/KpiCard'
import { PaymentMethodChart } from './components/PaymentMethodChart'
import { SalesByDayChart } from './components/SalesByDayChart'
import { WidgetSettingsModal } from './components/WidgetSettingsModal'
import { useAttendanceToday, useOpenCashSessionsCount } from './hooks/useDashboardExtras'
import { useDashboardMetrics } from './hooks/useDashboardMetrics'
import { useWidgetVisibility } from './hooks/useWidgetVisibility'

function formatCurrency(value: string) {
  return `S/ ${Number(value).toFixed(2)}`
}

export function DashboardPage() {
  const { data, isLoading, isConnected } = useDashboardMetrics()
  const { isVisible } = useWidgetVisibility()
  const { hasPermission } = useAuth()
  const [showSettings, setShowSettings] = useState(false)

  const canSeeAttendance = hasPermission('HR_MANAGE')
  const { count: openCashSessions } = useOpenCashSessionsCount()
  const { data: attendanceToday } = useAttendanceToday(canSeeAttendance)

  const attendanceSummary = attendanceToday
    ? {
        onTime: attendanceToday.reduce((sum, row) => sum + row.on_time_count, 0),
        late: attendanceToday.reduce((sum, row) => sum + row.late_count, 0),
      }
    : null

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Dashboard</h1>
          <p className="core-page-subtitle">Métricas del negocio en tiempo real</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            className="btn btn-ghost btn-sm btn-icon"
            aria-label="Personalizar dashboard"
            onClick={() => setShowSettings(true)}
          >
            <Settings size={16} />
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {isVisible('SALES_TODAY') && (
              <KpiCard
                icon={<CalendarDays size={18} />}
                label="Ventas de hoy"
                value={formatCurrency(data.today.total_sales)}
                subtitle={`${data.today.total_transactions} venta(s)`}
              />
            )}
            <KpiCard
              icon={<CalendarRange size={18} />}
              label="Ventas del mes"
              value={formatCurrency(data.month.total_sales)}
              subtitle={
                data.comparison_vs_previous_month.change_pct !== null
                  ? `${Number(data.comparison_vs_previous_month.change_pct) >= 0 ? '+' : ''}${data.comparison_vs_previous_month.change_pct}% vs. mes anterior`
                  : 'Sin datos del mes anterior'
              }
            />
            <KpiCard
              icon={<Percent size={18} />}
              label="Margen bruto (30 días)"
              value={
                data.gross_margin.margin_pct !== null
                  ? `${data.gross_margin.margin_pct}%`
                  : '—'
              }
              subtitle={`${formatCurrency(data.gross_margin.gross_margin)} de margen`}
            />
            {isVisible('LOW_STOCK') && (
              <KpiCard
                icon={<AlertTriangle size={18} />}
                label="Stock crítico"
                value={String(data.critical_stock_count)}
                subtitle="variante(s) bajo su mínimo"
              />
            )}
            {isVisible('CASH_STATUS') && (
              <KpiCard
                icon={<Wallet size={18} />}
                label="Cajas abiertas"
                value={String(openCashSessions)}
                subtitle="sesión(es) de caja en curso"
              />
            )}
            {isVisible('ATTENDANCE_TODAY') && canSeeAttendance && attendanceSummary && (
              <KpiCard
                icon={<Clock size={18} />}
                label="Asistencia de hoy"
                value={`${attendanceSummary.onTime} a tiempo`}
                subtitle={`${attendanceSummary.late} tarde`}
              />
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Ventas por día (últimos 30 días)</h3>
              <SalesByDayChart data={data.month.by_day} />
            </div>
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Métodos de pago (30 días)</h3>
              <PaymentMethodChart data={data.payment_method_distribution} />
            </div>
          </div>

          {isVisible('TOP_PRODUCTS') && (
            <div className="card core-table-card">
              <div style={{ padding: '12px 16px 0' }}>
                <h3 style={{ marginTop: 0 }}>Productos más vendidos (30 días)</h3>
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
                          <td>{product.quantity_sold}</td>
                          <td>{formatCurrency(product.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="card" style={{ padding: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {Number(data.comparison_vs_previous_month.change_pct ?? 0) >= 0 ? (
                <TrendingUp size={18} color="var(--success, #22c55e)" />
              ) : (
                <TrendingDown size={18} color="var(--danger, #ef4444)" />
              )}
              <span>
                Este mes: {formatCurrency(data.comparison_vs_previous_month.current_total)} · Mes
                anterior: {formatCurrency(data.comparison_vs_previous_month.previous_total)}
              </span>
            </div>
          </div>
        </div>
      )}

      {showSettings && <WidgetSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
