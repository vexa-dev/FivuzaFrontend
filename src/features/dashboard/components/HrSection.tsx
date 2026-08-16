import { CalendarX, Contact, UserPlus, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { formatCurrency } from '../../../shared/utils/format'
import { useEmployees } from '../../hr/hooks/useEmployees'
import { useAttendanceReport, usePayrollCostReport } from '../../hr/hooks/useReports'
import { CapsuleColumns } from './ChartPrimitives'
import { MiniStat, SectionHeader } from './DashboardSection'

const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const TODAY = new Date().toISOString().slice(0, 10)
const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const MONTH_START = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .slice(0, 10)

/** RRHH: tendencia de asistencia de la semana (el widget existente solo
 * mira "hoy"), costo de nomina del mes, y planilla activa -antes solo
 * habia "asistencia de hoy" en el Resumen, sin nada de esto visible fuera
 * del modulo RRHH. */
export function HrSection() {
  const { data: employees } = useEmployees()
  const { data: attendanceWeek } = useAttendanceReport({
    date_from: SEVEN_DAYS_AGO,
    date_to: TODAY,
  })
  const { data: payrollCost } = usePayrollCostReport({
    period_start: MONTH_START,
    period_end: TODAY,
  })

  const attendanceSummary = useMemo(() => {
    const rows = attendanceWeek ?? []
    return rows.reduce(
      (acc, row) => ({
        onTime: acc.onTime + row.on_time_count,
        late: acc.late + row.late_count,
        unjustified: acc.unjustified + row.absence_unjustified_count,
      }),
      { onTime: 0, late: 0, unjustified: 0 },
    )
  }, [attendanceWeek])

  const { activeCount, recentHires } = useMemo(() => {
    const list = employees ?? []
    return {
      activeCount: list.filter((employee) => employee.is_active).length,
      recentHires: list.filter((employee) => employee.hire_date >= THIRTY_DAYS_AGO).length,
    }
  }, [employees])

  return (
    <div className="dashboard-section">
      <SectionHeader icon={<Contact size={15} strokeWidth={2} />} title="RRHH" />

      <div className="dashboard-mini-stats-grid">
        <MiniStat
          icon={<Contact size={13} strokeWidth={2} />}
          label="Empleados activos"
          value={String(activeCount)}
          caption={recentHires > 0 ? `${recentHires} contratado(s) en los últimos 30 días` : undefined}
        />
        <MiniStat
          icon={<CalendarX size={13} strokeWidth={2} />}
          label="Tardanzas (7 días)"
          value={String(attendanceSummary.late)}
          caption={`${attendanceSummary.onTime} a tiempo · ${attendanceSummary.unjustified} falta(s) injustificada(s)`}
        />
        <MiniStat
          icon={<Wallet size={13} strokeWidth={2} />}
          label="Costo de nómina (mes)"
          value={payrollCost ? formatCurrency(payrollCost.total_net_amount) : '—'}
        />
        <MiniStat
          icon={<UserPlus size={13} strokeWidth={2} />}
          label="Altas recientes (30 días)"
          value={String(recentHires)}
        />
      </div>

      <div className="card">
        <div style={{ padding: '12px 16px 0' }}>
          <h3 className="card-title">Asistencia de la semana</h3>
        </div>
        <CapsuleColumns
          items={[
            { key: 'onTime', label: 'A tiempo', value: attendanceSummary.onTime, color: 'var(--success)' },
            { key: 'late', label: 'Tardanzas', value: attendanceSummary.late, color: 'var(--warning)' },
            {
              key: 'unjustified',
              label: 'Injustificadas',
              value: attendanceSummary.unjustified,
              color: 'var(--danger)',
            },
          ]}
        />
      </div>
    </div>
  )
}
