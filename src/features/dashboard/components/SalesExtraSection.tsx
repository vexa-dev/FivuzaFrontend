import { Award, CalendarClock, ClipboardCheck, ReceiptText, ScrollText, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatCurrency } from '../../../shared/utils/format'
import { useEmployees } from '../../hr/hooks/useEmployees'
import { useCashSessionHistory } from '../../sales/hooks/useCashSessions'
import { usePromotions } from '../../sales/hooks/usePromotions'
import { useQuotes } from '../../sales/hooks/useQuotes'
import { useReservations } from '../../sales/hooks/useReservations'
import { useSales } from '../../sales/hooks/useSales'
import { RadialStat, RankingBars } from './ChartPrimitives'
import { MiniStat, SectionHeader } from './DashboardSection'

const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

/** "Vence en" para fechas futuras -formatRelativeTime (shared/utils/format)
 * asume que el timestamp ya paso ("hace 5 min"), con una fecha futura
 * siempre da diffMin negativo y cae en el caso "ahora". Los apartados
 * vencen a futuro, necesitan su propio texto. */
function formatDaysUntil(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now()
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays <= 0) return 'vence hoy'
  if (diffDays === 1) return 'vence mañana'
  return `vence en ${diffDays} días`
}

/** Datos de Ventas que ya existen (ticket, vendedores, promos, cotizaciones,
 * arqueos de caja) pero vivian repartidos en 5 pantallas distintas sin que
 * el dueño del negocio tuviera un solo lugar donde verlos juntos. */
export function SalesExtraSection() {
  const { data: sales } = useSales({ date_from: THIRTY_DAYS_AGO })
  const { data: employees } = useEmployees()
  const { data: promotions } = usePromotions()
  const { data: quotes } = useQuotes({})
  const { data: activeReservations } = useReservations({ status: 'ACTIVE' })
  const { data: closedSessions } = useCashSessionHistory({
    status: 'CLOSED',
    opening_from: SEVEN_DAYS_AGO,
  })

  const { avgTicket, topSellers } = useMemo(() => {
    const completed = sales?.filter((sale) => sale.status === 'COMPLETED') ?? []
    const total = completed.reduce((sum, sale) => sum + Number(sale.total), 0)
    const bySeller = new Map<number, { total: number; count: number }>()
    completed.forEach((sale) => {
      const entry = bySeller.get(sale.user) ?? { total: 0, count: 0 }
      entry.total += Number(sale.total)
      entry.count += 1
      bySeller.set(sale.user, entry)
    })
    const sellerName = (userId: number) =>
      employees?.find((employee) => employee.user === userId)?.full_name ?? `Usuario #${userId}`
    const topSellers = Array.from(bySeller.entries())
      .map(([userId, stats]) => ({ name: sellerName(userId), ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
    return {
      avgTicket: completed.length > 0 ? total / completed.length : 0,
      topSellers,
    }
  }, [sales, employees])

  const activePromotionsCount =
    promotions?.filter((promo) => promo.is_active && promo.end_date >= THIRTY_DAYS_AGO).length ?? 0

  const quoteConversion = useMemo(() => {
    if (!quotes || quotes.length === 0) return null
    const accepted = quotes.filter((quote) => quote.status === 'ACCEPTED').length
    return Math.round((accepted / quotes.length) * 100)
  }, [quotes])

  const upcomingReservations = useMemo(
    () =>
      (activeReservations ?? [])
        .slice()
        .sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())
        .slice(0, 5),
    [activeReservations],
  )

  const cashReconciliation = useMemo(() => {
    const sessions = closedSessions ?? []
    const withDiff = sessions.filter((session) => session.difference !== null)
    const totalDiff = withDiff.reduce((sum, session) => sum + Number(session.difference), 0)
    const short = withDiff.filter((session) => Number(session.difference) < 0).length
    const over = withDiff.filter((session) => Number(session.difference) > 0).length
    return { count: sessions.length, totalDiff, short, over }
  }, [closedSessions])

  return (
    <div className="dashboard-section">
      <SectionHeader icon={<ReceiptText size={15} strokeWidth={2} />} title="Ventas y caja" />

      <div className="dashboard-mini-stats-grid">
        <MiniStat
          icon={<ReceiptText size={13} strokeWidth={2} />}
          label="Ticket promedio (30 días)"
          value={formatCurrency(avgTicket)}
        />
        <MiniStat
          icon={<ScrollText size={13} strokeWidth={2} />}
          label="Promociones activas"
          value={String(activePromotionsCount)}
        />
        <RadialStat
          icon={<ClipboardCheck size={13} strokeWidth={2} />}
          label="Conversión de cotizaciones"
          pct={quoteConversion}
          caption={quotes ? `${quotes.length} cotización(es) en total` : undefined}
        />
        <MiniStat
          icon={<Wallet size={13} strokeWidth={2} />}
          label="Arqueos de caja (7 días)"
          value={String(cashReconciliation.count)}
          caption={
            cashReconciliation.count > 0
              ? `${cashReconciliation.short} con faltante · ${cashReconciliation.over} con sobrante · ${formatCurrency(cashReconciliation.totalDiff)} neto`
              : undefined
          }
        />
      </div>

      <div className="dashboard-split-grid">
        <div className="card dashboard-split-card">
          <div style={{ padding: '12px 16px 0' }}>
            <h3 className="card-title">Top vendedores (30 días)</h3>
          </div>
          {topSellers.length === 0 ? (
            <EmptyState icon={<Award />} title="Sin ventas en este periodo" />
          ) : (
            <RankingBars
              items={topSellers.map((row) => ({
                key: row.name,
                label: row.name,
                value: row.total,
                sublabel: `${row.count} venta(s)`,
              }))}
              valueFormatter={formatCurrency}
            />
          )}
        </div>

        <div className="card core-table-card dashboard-split-card">
          <div style={{ padding: '12px 16px 0' }}>
            <h3 className="card-title">Apartados próximos a vencer</h3>
          </div>
          {upcomingReservations.length === 0 ? (
            <EmptyState icon={<CalendarClock />} title="Sin apartados activos" />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="core-table">
                <thead>
                  <tr>
                    <th>Apartado</th>
                    <th>Cantidad</th>
                    <th>Vence</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td className="core-table-strong">#{reservation.id}</td>
                      <td>{reservation.quantity}</td>
                      <td>{formatDaysUntil(reservation.expires_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
