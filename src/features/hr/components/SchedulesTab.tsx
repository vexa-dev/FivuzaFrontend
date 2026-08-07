import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import type { DayOfWeek, Employee } from '../api'
import {
  useCreateEmployeeSchedule,
  useDeleteEmployeeSchedule,
  useEmployeeSchedules,
} from '../hooks/useSchedules'

interface SchedulesTabProps {
  employees: Employee[]
}

const DAYS: [DayOfWeek, string][] = [
  ['MONDAY', 'Lunes'],
  ['TUESDAY', 'Martes'],
  ['WEDNESDAY', 'Miércoles'],
  ['THURSDAY', 'Jueves'],
  ['FRIDAY', 'Viernes'],
  ['SATURDAY', 'Sábado'],
  ['SUNDAY', 'Domingo'],
]

export function SchedulesTab({ employees }: SchedulesTabProps) {
  const [employeeId, setEmployeeId] = useState<number | ''>(employees[0]?.id ?? '')
  const { data: schedules } = useEmployeeSchedules(employeeId || undefined)
  const createSchedule = useCreateEmployeeSchedule()
  const deleteSchedule = useDeleteEmployeeSchedule()

  const [addingDay, setAddingDay] = useState<DayOfWeek | null>(null)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [error, setError] = useState<string | null>(null)

  const scheduleForDay = (day: DayOfWeek) =>
    schedules?.find((schedule) => schedule.day_of_week === day && schedule.is_active)

  const handleAdd = (event: FormEvent, day: DayOfWeek) => {
    event.preventDefault()
    setError(null)
    if (!employeeId) return
    if (startTime >= endTime) {
      setError('La hora de inicio debe ser antes que la de fin.')
      return
    }
    createSchedule
      .mutateAsync({
        employee: employeeId,
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        is_active: true,
      })
      .then(() => setAddingDay(null))
      .catch(() => setError('No se pudo guardar el turno.'))
  }

  if (employees.length === 0) {
    return (
      <div className="card core-table-card">
        <EmptyState
          icon={<Plus />}
          title="Todavía no hay trabajadores"
          subtitle="Crea un trabajador en la pestaña Trabajadores antes de asignarle un horario."
        />
      </div>
    )
  }

  return (
    <div className="card core-table-card" style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="schedule-employee">Trabajador</label>
        <select
          id="schedule-employee"
          value={employeeId}
          onChange={(event) => setEmployeeId(Number(event.target.value))}
          style={{ maxWidth: 320 }}
        >
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {DAYS.map(([day, label]) => {
          const schedule = scheduleForDay(day)
          return (
            <div key={day} className="card" style={{ padding: 12 }}>
              <div className="core-table-strong" style={{ marginBottom: 8 }}>
                {label}
              </div>
              {schedule ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>
                    {schedule.start_time.slice(0, 5)} – {schedule.end_time.slice(0, 5)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-danger-ghost btn-sm btn-icon"
                    aria-label={`Quitar turno del ${label}`}
                    onClick={() => deleteSchedule.mutate(schedule.id)}
                  >
                    <Trash2 />
                  </button>
                </div>
              ) : addingDay === day ? (
                <form
                  onSubmit={(event) => handleAdd(event, day)}
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    aria-label="Hora de inicio"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    aria-label="Hora de fin"
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={createSchedule.isPending}>
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setAddingDay(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setAddingDay(day)}
                >
                  <Plus size={13} strokeWidth={2.5} />
                  Agregar turno
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
