import { Clock, LogIn, LogOut } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import type { Employee } from '../api'
import { useAttendance, useClockIn, useClockOut } from '../hooks/useAttendance'

interface AttendanceTabProps {
  employees: Employee[]
}

const STATUS_LABELS: Record<string, string> = {
  ON_TIME: 'A tiempo',
  LATE: 'Tarde',
  ABSENCE_JUSTIFIED: 'Falta justificada',
  ABSENCE_UNJUSTIFIED: 'Falta injustificada',
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Interfaz simple pensada para un dispositivo compartido en el local
 * (Sprint 22, Convenciones §5.3): el trabajador se selecciona de una lista
 * corta y un solo botón grande marca entrada o salida segun corresponda. */
export function AttendanceTab({ employees }: AttendanceTabProps) {
  const [employeeId, setEmployeeId] = useState<number | ''>(employees[0]?.id ?? '')
  const { data: attendance } = useAttendance(employeeId || undefined)
  const clockIn = useClockIn()
  const clockOut = useClockOut()
  const [error, setError] = useState<string | null>(null)

  const selectedEmployee = employees.find((employee) => employee.id === employeeId)
  const openAttendance = attendance?.find((entry) => entry.check_out === null)

  const handleClockIn = () => {
    setError(null)
    if (!selectedEmployee) return
    clockIn
      .mutateAsync({ employee_id: selectedEmployee.id, warehouse_id: selectedEmployee.warehouse })
      .catch(() => setError('No se pudo registrar la entrada.'))
  }

  const handleClockOut = () => {
    setError(null)
    if (!openAttendance) return
    clockOut.mutateAsync(openAttendance.id).catch(() => setError('No se pudo registrar la salida.'))
  }

  if (employees.length === 0) {
    return (
      <div className="card core-table-card">
        <EmptyState
          icon={<Clock />}
          title="Todavía no hay trabajadores"
          subtitle="Crea un trabajador en la pestaña Trabajadores antes de marcar asistencia."
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 16 }}>
        <label htmlFor="attendance-employee">Trabajador</label>
        <select
          id="attendance-employee"
          value={employeeId}
          onChange={(event) => setEmployeeId(Number(event.target.value))}
          style={{ maxWidth: 320, marginBottom: 12 }}
        >
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name}
            </option>
          ))}
        </select>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        {openAttendance ? (
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px 0', fontSize: '1rem' }}
            disabled={clockOut.isPending}
            onClick={handleClockOut}
          >
            <LogOut size={18} strokeWidth={2.5} />
            {clockOut.isPending ? 'Registrando...' : 'Marcar salida'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px 0', fontSize: '1rem' }}
            disabled={clockIn.isPending}
            onClick={handleClockIn}
          >
            <LogIn size={18} strokeWidth={2.5} />
            {clockIn.isPending ? 'Registrando...' : 'Marcar entrada'}
          </button>
        )}
      </div>

      <div className="card core-table-card">
        {attendance && attendance.length === 0 && (
          <EmptyState icon={<Clock />} title="Sin marcaciones todavía" />
        )}
        {attendance && attendance.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Estado</th>
                <th>Horas trabajadas</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDateTime(entry.check_in)}</td>
                  <td>{entry.check_out ? formatDateTime(entry.check_out) : '—'}</td>
                  <td>
                    <span
                      className={`badge ${entry.status === 'LATE' ? 'badge-danger' : entry.status === 'ON_TIME' ? 'badge-success' : 'badge-neutral'}`}
                    >
                      <span className="dot" />
                      {STATUS_LABELS[entry.status] ?? entry.status}
                    </span>
                  </td>
                  <td>{entry.worked_hours ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
