import { FileBarChart } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ExportButtons } from '../../../shared/components/ExportButtons'
import { formatCurrency } from '../../../shared/utils/format'
import {
  downloadClassAttendanceReport,
  downloadMembershipsExpiringReport,
  downloadRevenueByPlanReport,
} from '../api'
import {
  useClassAttendanceReport,
  useMembershipsExpiringReport,
  useRevenueByPlanReport,
} from '../hooks/useGymReports'

/** Reportes de gimnasio exportables a CSV/XLSX (Sprint 31, API Spec §4.16):
 * misma consulta en pantalla y en el archivo exportado, mismo patron que
 * los reportes de RRHH del Sprint 23. */
export function GymReportsTab() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expiringDays, setExpiringDays] = useState(7)

  const attendanceReport = useClassAttendanceReport({ date_from: dateFrom, date_to: dateTo })
  const expiringReport = useMembershipsExpiringReport({ days: expiringDays })
  const revenueReport = useRevenueByPlanReport({ date_from: dateFrom, date_to: dateTo })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card core-table-card" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Asistencia y ocupación por clase</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
          <div>
            <label htmlFor="gym-report-from">Desde</label>
            <input
              id="gym-report-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="gym-report-to">Hasta</label>
            <input
              id="gym-report-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
          {dateFrom && dateTo && (
            <ExportButtons
              filename={`asistencia_clases_${dateFrom}_a_${dateTo}`}
              onDownload={(format) =>
                downloadClassAttendanceReport({ date_from: dateFrom, date_to: dateTo }, format)
              }
            />
          )}
        </div>

        {!dateFrom || !dateTo ? (
          <EmptyState icon={<FileBarChart />} title="Elige un rango de fechas para ver el reporte" />
        ) : attendanceReport.data && attendanceReport.data.length === 0 ? (
          <EmptyState icon={<FileBarChart />} title="Sin reservas en este rango" />
        ) : (
          attendanceReport.data && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Clase</th>
                  <th>Fecha</th>
                  <th>Asistieron</th>
                  <th>No asistieron</th>
                  <th>Ocupación</th>
                </tr>
              </thead>
              <tbody>
                {attendanceReport.data.map((row) => (
                  <tr key={`${row.class_name}-${row.class_date}`}>
                    <td className="core-table-strong">{row.class_name}</td>
                    <td>{row.class_date}</td>
                    <td>{row.attended_count}</td>
                    <td>{row.no_show_count}</td>
                    <td>{row.occupancy_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      <div className="card core-table-card" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Membresías por vencer</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
          <div>
            <label htmlFor="gym-report-days">Próximos días</label>
            <input
              id="gym-report-days"
              type="number"
              min={1}
              value={expiringDays}
              onChange={(event) => setExpiringDays(Number(event.target.value) || 7)}
              style={{ width: 100 }}
            />
          </div>
          <ExportButtons
            filename={`membresias_por_vencer_${expiringDays}d`}
            onDownload={(format) => downloadMembershipsExpiringReport({ days: expiringDays }, format)}
          />
        </div>

        {expiringReport.data && expiringReport.data.length === 0 ? (
          <EmptyState icon={<FileBarChart />} title="Sin membresías por vencer en ese rango" />
        ) : (
          expiringReport.data && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Socio</th>
                  <th>Plan</th>
                  <th>Vence</th>
                </tr>
              </thead>
              <tbody>
                {expiringReport.data.map((row) => (
                  <tr key={row.membership_id}>
                    <td className="core-table-strong">{row.customer_name}</td>
                    <td>{row.plan_name}</td>
                    <td>{row.end_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      <div className="card core-table-card" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Ingresos por plan</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
          {dateFrom && dateTo && (
            <ExportButtons
              filename={`ingresos_por_plan_${dateFrom}_a_${dateTo}`}
              onDownload={(format) =>
                downloadRevenueByPlanReport({ date_from: dateFrom, date_to: dateTo }, format)
              }
            />
          )}
        </div>

        {!dateFrom || !dateTo ? (
          <EmptyState icon={<FileBarChart />} title="Usa el rango de fechas de arriba para ver los ingresos" />
        ) : revenueReport.data && revenueReport.data.length === 0 ? (
          <EmptyState icon={<FileBarChart />} title="Sin pagos registrados en este rango" />
        ) : (
          revenueReport.data && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Pagos</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {revenueReport.data.map((row) => (
                  <tr key={row.plan_id}>
                    <td className="core-table-strong">{row.plan_name}</td>
                    <td>{row.payment_count}</td>
                    <td>{formatCurrency(row.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  )
}
