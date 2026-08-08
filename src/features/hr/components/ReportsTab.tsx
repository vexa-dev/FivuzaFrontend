import { Download, FileBarChart } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { downloadAttendanceReport, downloadPayrollCostReport } from '../api'
import { useAttendanceReport, usePayrollCostReport } from '../hooks/useReports'

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/** Reportes de RRHH con exportación a CSV/XLSX (Sprint 23, API Spec §4.16):
 * la misma consulta que arma la tabla en pantalla es la que exporta el
 * backend -exportar y ver en pantalla nunca pueden divergir. */
export function ReportsTab() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  const attendanceReport = useAttendanceReport({ date_from: dateFrom, date_to: dateTo })
  const payrollCostReport = usePayrollCostReport({
    period_start: periodStart,
    period_end: periodEnd,
  })

  const handleDownloadAttendance = async (format: 'csv' | 'xlsx') => {
    setDownloading(`attendance-${format}`)
    try {
      const blob = await downloadAttendanceReport({ date_from: dateFrom, date_to: dateTo }, format)
      triggerDownload(blob, `asistencia_${dateFrom}_a_${dateTo}.${format}`)
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadPayrollCost = async (format: 'csv' | 'xlsx') => {
    setDownloading(`payroll-${format}`)
    try {
      const blob = await downloadPayrollCostReport(
        { period_start: periodStart, period_end: periodEnd },
        format,
      )
      triggerDownload(blob, `costo_planilla_${periodStart}_a_${periodEnd}.${format}`)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card core-table-card" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Asistencia por periodo</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
          <div>
            <label htmlFor="report-attendance-from">Desde</label>
            <input
              id="report-attendance-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="report-attendance-to">Hasta</label>
            <input
              id="report-attendance-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
          {dateFrom && dateTo && (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={downloading === 'attendance-csv'}
                onClick={() => handleDownloadAttendance('csv')}
              >
                <Download size={13} strokeWidth={2} />
                CSV
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={downloading === 'attendance-xlsx'}
                onClick={() => handleDownloadAttendance('xlsx')}
              >
                <Download size={13} strokeWidth={2} />
                Excel
              </button>
            </>
          )}
        </div>

        {!dateFrom || !dateTo ? (
          <EmptyState icon={<FileBarChart />} title="Elige un rango de fechas para ver el reporte" />
        ) : attendanceReport.data && attendanceReport.data.length === 0 ? (
          <EmptyState icon={<FileBarChart />} title="Sin marcaciones en este rango" />
        ) : (
          attendanceReport.data && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Trabajador</th>
                  <th>A tiempo</th>
                  <th>Tarde</th>
                  <th>Horas trabajadas</th>
                </tr>
              </thead>
              <tbody>
                {attendanceReport.data.map((row) => (
                  <tr key={row.employee_id}>
                    <td className="core-table-strong">{row.full_name}</td>
                    <td>{row.on_time_count}</td>
                    <td>{row.late_count}</td>
                    <td>{row.total_worked_hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      <div className="card core-table-card" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Costo de planilla por periodo</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
          <div>
            <label htmlFor="report-payroll-from">Inicio</label>
            <input
              id="report-payroll-from"
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="report-payroll-to">Fin</label>
            <input
              id="report-payroll-to"
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
            />
          </div>
          {periodStart && periodEnd && (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={downloading === 'payroll-csv'}
                onClick={() => handleDownloadPayrollCost('csv')}
              >
                <Download size={13} strokeWidth={2} />
                CSV
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={downloading === 'payroll-xlsx'}
                onClick={() => handleDownloadPayrollCost('xlsx')}
              >
                <Download size={13} strokeWidth={2} />
                Excel
              </button>
            </>
          )}
        </div>

        {!periodStart || !periodEnd ? (
          <EmptyState icon={<FileBarChart />} title="Elige un rango de periodos para ver el costo" />
        ) : (
          payrollCostReport.data && (
            <p className="core-table-strong" style={{ fontSize: '1.1rem' }}>
              Total: S/ {payrollCostReport.data.total_net_amount}
            </p>
          )
        )}
      </div>
    </div>
  )
}
