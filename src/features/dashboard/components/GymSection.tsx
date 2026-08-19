import { CalendarClock, Dumbbell, TrendingUp, Users } from 'lucide-react'
import { useMemo } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatCurrency } from '../../../shared/utils/format'
import {
  useClassAttendanceReport,
  useMembershipsExpiringReport,
  useRevenueByPlanReport,
} from '../../gimnasio/hooks/useGymReports'
import { useActiveMembershipsCount } from '../hooks/useDashboardExtras'
import { RadialStat, RankingBars } from './ChartPrimitives'
import { MiniStat, SectionHeader } from './DashboardSection'

const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const TODAY = new Date().toISOString().slice(0, 10)

/** Gimnasio: la vertical entera no tenia ninguna presencia en el dashboard
 * (confirmado en la auditoria) -socios activos, membresias por vencer,
 * ingresos por plan y ocupacion de clases, los 4 numeros que un dueño de
 * gimnasio pediria ver de entrada. */
export function GymSection() {
  const { count: activeMemberships } = useActiveMembershipsCount(true)
  const { data: expiringSoon } = useMembershipsExpiringReport({ days: 7 })
  const { data: revenueByPlan } = useRevenueByPlanReport({
    date_from: THIRTY_DAYS_AGO,
    date_to: TODAY,
  })
  const { data: classAttendance } = useClassAttendanceReport({
    date_from: SEVEN_DAYS_AGO,
    date_to: TODAY,
  })

  const avgOccupancy = useMemo(() => {
    if (!classAttendance || classAttendance.length === 0) return null
    const sum = classAttendance.reduce((acc, row) => acc + row.occupancy_pct, 0)
    return Math.round(sum / classAttendance.length)
  }, [classAttendance])

  const monthRevenue = useMemo(
    () => (revenueByPlan ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0),
    [revenueByPlan],
  )

  return (
    <div className="dashboard-section">
      <SectionHeader icon={<Dumbbell size={15} strokeWidth={2} />} title="Gimnasio" />

      <div className="dashboard-mini-stats-grid">
        <MiniStat
          icon={<Users size={13} strokeWidth={2} />}
          label="Socios con membresía activa"
          value={String(activeMemberships)}
        />
        <MiniStat
          icon={<CalendarClock size={13} strokeWidth={2} />}
          label="Membresías por vencer (7 días)"
          value={String(expiringSoon?.length ?? 0)}
        />
        <MiniStat
          icon={<TrendingUp size={13} strokeWidth={2} />}
          label="Ingresos por membresías (30 días)"
          value={formatCurrency(monthRevenue)}
        />
        <RadialStat
          icon={<Dumbbell size={13} strokeWidth={2} />}
          label="Ocupación de clases (7 días)"
          pct={avgOccupancy}
        />
      </div>

      <div className="dashboard-split-grid">
        <div className="card core-table-card dashboard-split-card">
          <div style={{ padding: '12px 16px 0' }}>
            <h3 className="card-title">Membresías por vencer</h3>
          </div>
          {!expiringSoon || expiringSoon.length === 0 ? (
            <EmptyState icon={<CalendarClock />} title="Sin membresías por vencer en 7 días" />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="core-table">
                <thead>
                  <tr>
                    <th>Socio</th>
                    <th>Plan</th>
                    <th>Vence</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringSoon.slice(0, 5).map((row) => (
                    <tr key={row.membership_id}>
                      <td className="core-table-strong">{row.customer_name}</td>
                      <td>{row.plan_name}</td>
                      <td>{row.end_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card dashboard-split-card">
          <div style={{ padding: '12px 16px 0' }}>
            <h3 className="card-title">Ingresos por plan (30 días)</h3>
          </div>
          {!revenueByPlan || revenueByPlan.length === 0 ? (
            <EmptyState icon={<TrendingUp />} title="Sin pagos de membresías en este periodo" />
          ) : (
            <RankingBars
              items={revenueByPlan.map((row) => ({
                key: row.plan_id,
                label: row.plan_name,
                value: Number(row.total_amount),
                sublabel: `${row.payment_count} pago(s)`,
              }))}
              valueFormatter={formatCurrency}
            />
          )}
        </div>
      </div>
    </div>
  )
}
