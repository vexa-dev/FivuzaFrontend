import { Calendar, Check, Dumbbell, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Fragment, useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { useCustomers } from '../../sales/hooks/useCustomers'
import type { DayOfWeek, GymClass } from '../api'
import {
  useBookClass,
  useCancelClassBooking,
  useClassBookings,
  useMarkClassAttendance,
} from '../hooks/useClassBookings'
import {
  useClassSchedules,
  useCreateClassSchedule,
  useDeleteClassSchedule,
  useDeleteGymClass,
  useGymClasses,
} from '../hooks/useGymClasses'
import { GymClassFormModal } from './GymClassFormModal'

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
}

const DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

export function ClassesTab({ canManage }: { canManage: boolean }) {
  const { data: classes, isLoading } = useGymClasses()
  const deleteClass = useDeleteGymClass()
  const [editingClass, setEditingClass] = useState<GymClass | null | undefined>(undefined)
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card core-table-card">
        {canManage && (
          <div className="table-toolbar" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setEditingClass(null)}
            >
              <Plus size={15} strokeWidth={2.5} />
              Nueva clase
            </button>
          </div>
        )}

        {isLoading && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}
        {classes && classes.length === 0 && (
          <EmptyState
            icon={<Dumbbell />}
            title="Todavía no hay clases"
            subtitle={canManage ? 'Crea la primera con "Nueva clase".' : undefined}
          />
        )}
        {classes && classes.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Clase</th>
                <th>Instructor</th>
                <th>Cupo</th>
                <th>Duración</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {classes.map((gymClass) => (
                <Fragment key={gymClass.id}>
                  <tr>
                    <td className="core-table-strong">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          setExpandedClassId((current) =>
                            current === gymClass.id ? null : gymClass.id,
                          )
                        }
                      >
                        <Calendar size={14} strokeWidth={2} />
                        {gymClass.name}
                      </button>
                    </td>
                    <td>{gymClass.instructor_name}</td>
                    <td>{gymClass.max_capacity}</td>
                    <td>{gymClass.duration_minutes} min</td>
                    {canManage && (
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-icon"
                            aria-label={`Editar ${gymClass.name}`}
                            onClick={() => setEditingClass(gymClass)}
                          >
                            <Pencil />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-ghost btn-sm btn-icon"
                            aria-label={`Eliminar ${gymClass.name}`}
                            onClick={() => {
                              if (confirm(`¿Eliminar ${gymClass.name}?`)) {
                                deleteClass.mutate(gymClass.id)
                              }
                            }}
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  {expandedClassId === gymClass.id && (
                    <tr>
                      <td colSpan={canManage ? 5 : 4} style={{ padding: 0 }}>
                        <ClassScheduleAndRoster gymClass={gymClass} canManage={canManage} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingClass !== undefined && (
        <GymClassFormModal editingClass={editingClass} onClose={() => setEditingClass(undefined)} />
      )}
    </div>
  )
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function ClassScheduleAndRoster({
  gymClass,
  canManage,
}: {
  gymClass: GymClass
  canManage: boolean
}) {
  const { data: schedules } = useClassSchedules({ gym_class: gymClass.id })
  const createSchedule = useCreateClassSchedule()
  const deleteSchedule = useDeleteClassSchedule()
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MONDAY')
  const [startTime, setStartTime] = useState('08:00')

  const [classDate, setClassDate] = useState(todayIso())
  const { data: bookings } = useClassBookings({ gym_class: gymClass.id, class_date: classDate })
  const bookClass = useBookClass()
  const markAttendance = useMarkClassAttendance()
  const cancelBooking = useCancelClassBooking()

  const [customerSearch, setCustomerSearch] = useState('')
  const { data: customers } = useCustomers(customerSearch)
  const [bookError, setBookError] = useState<string | null>(null)

  const activeCount =
    bookings?.filter((b) => b.status === 'RESERVADO' || b.status === 'ASISTIO').length ?? 0

  return (
    <div style={{ padding: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 260, flex: 1 }}>
        <h4 style={{ margin: '0 0 8px' }}>Horario semanal</h4>
        {schedules && schedules.length === 0 && (
          <p className="core-page-subtitle" style={{ margin: 0 }}>
            Sin horarios definidos.
          </p>
        )}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {schedules?.map((schedule) => (
            <li
              key={schedule.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>
                {DAY_LABELS[schedule.day_of_week]} · {schedule.start_time.slice(0, 5)}
              </span>
              {canManage && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon"
                  aria-label="Eliminar horario"
                  onClick={() => deleteSchedule.mutate(schedule.id)}
                >
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>

        {canManage && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <select value={dayOfWeek} onChange={(event) => setDayOfWeek(event.target.value as DayOfWeek)}>
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {DAY_LABELS[day]}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() =>
                createSchedule.mutate({
                  gym_class: gymClass.id,
                  day_of_week: dayOfWeek,
                  start_time: startTime,
                })
              }
              disabled={createSchedule.isPending}
            >
              Agregar
            </button>
          </div>
        )}
      </div>

      <div style={{ minWidth: 300, flex: 2 }}>
        <h4 style={{ margin: '0 0 8px' }}>
          Reservas · {activeCount}/{gymClass.max_capacity}
        </h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <input
            type="date"
            value={classDate}
            onChange={(event) => setClassDate(event.target.value)}
          />
          <input
            value={customerSearch}
            onChange={(event) => setCustomerSearch(event.target.value)}
            placeholder="Buscar socio para reservar..."
            autoComplete="off"
            style={{ flex: 1, minWidth: 160 }}
          />
        </div>
        {customerSearch.trim() && customers && customers.length > 0 && (
          <div className="card" style={{ marginBottom: 10, maxHeight: 140, overflowY: 'auto' }}>
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0 }}
                onClick={() => {
                  setBookError(null)
                  bookClass
                    .mutateAsync({
                      customer_id: customer.id,
                      gym_class_id: gymClass.id,
                      class_date: classDate,
                    })
                    .then(() => setCustomerSearch(''))
                    .catch(() => setBookError('No se pudo reservar (¿cupo lleno?).'))
                }}
              >
                {customer.name} · {customer.document_number}
              </button>
            ))}
          </div>
        )}
        {bookError && (
          <p className="login-error" role="alert">
            {bookError}
          </p>
        )}

        {bookings && bookings.length === 0 && (
          <p className="core-page-subtitle" style={{ margin: 0 }}>
            Sin reservas para esta fecha.
          </p>
        )}
        {bookings && bookings.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Socio</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>#{booking.customer}</td>
                  <td>
                    <span className="badge badge-neutral">
                      <span className="dot" />
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    {booking.status === 'RESERVADO' && (
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-icon"
                          aria-label="Marcar asistió"
                          onClick={() => markAttendance.mutate({ id: booking.id, attended: true })}
                        >
                          <Check />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-icon"
                          aria-label="Marcar no asistió"
                          onClick={() => markAttendance.mutate({ id: booking.id, attended: false })}
                        >
                          <X />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-ghost btn-sm btn-icon"
                          aria-label="Cancelar reserva"
                          onClick={() => cancelBooking.mutate(booking.id)}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
