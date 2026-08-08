import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  Percent,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
} from 'lucide-react'
import '../core/CorePage.css'
import { EmptyState } from '../../shared/components/EmptyState'
import { KpiCard } from './components/KpiCard'
import { PaymentMethodChart } from './components/PaymentMethodChart'
import { SalesByDayChart } from './components/SalesByDayChart'
import { useDashboardMetrics } from './hooks/useDashboardMetrics'

function formatCurrency(value: string) {
  return `S/ ${Number(value).toFixed(2)}`
}

export function DashboardPage() {
  const { data, isLoading, isConnected } = useDashboardMetrics()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Dashboard</h1>
          <p className="core-page-subtitle">Métricas del negocio en tiempo real</p>
        </div>
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
            <KpiCard
              icon={<CalendarDays size={18} />}
              label="Ventas de hoy"
              value={formatCurrency(data.today.total_sales)}
              subtitle={`${data.today.total_transactions} venta(s)`}
            />
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
            <KpiCard
              icon={<AlertTriangle size={18} />}
              label="Stock crítico"
              value={String(data.critical_stock_count)}
              subtitle="variante(s) bajo su mínimo"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Ventas por día (últimos 30 días)</h3>
              <SalesByDayChart data={data.month.by_day} />
            </div>
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Métodos de pago (30 días)</h3>
              <PaymentMethodChart data={data.payment_method_distribution} />
            </div>
          </div>

          <div className="card core-table-card">
            <div style={{ padding: '12px 16px 0' }}>
              <h3 style={{ marginTop: 0 }}>Productos más vendidos (30 días)</h3>
            </div>
            {data.top_products.length === 0 ? (
              <EmptyState icon={<ShoppingCart />} title="Sin ventas en este periodo" />
            ) : (
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
            )}
          </div>

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
    </div>
  )
}
