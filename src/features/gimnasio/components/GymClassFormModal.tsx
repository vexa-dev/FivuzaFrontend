import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { useEmployees } from '../../hr/hooks/useEmployees'
import type { GymClass } from '../api'
import { useCreateGymClass, useUpdateGymClass } from '../hooks/useGymClasses'

interface GymClassFormModalProps {
  editingClass: GymClass | null
  onClose: () => void
}

export function GymClassFormModal({ editingClass, onClose }: GymClassFormModalProps) {
  const [name, setName] = useState(editingClass?.name ?? '')
  const [instructor, setInstructor] = useState<number | ''>(editingClass?.instructor ?? '')
  const [maxCapacity, setMaxCapacity] = useState(String(editingClass?.max_capacity ?? ''))
  const [durationMinutes, setDurationMinutes] = useState(
    String(editingClass?.duration_minutes ?? ''),
  )
  const [error, setError] = useState<string | null>(null)

  const { data: employees } = useEmployees()
  const createClass = useCreateGymClass()
  const updateClass = useUpdateGymClass()
  const isPending = createClass.isPending || updateClass.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim() || !instructor || !maxCapacity || !durationMinutes) {
      setError('Todos los campos son requeridos.')
      return
    }

    const data = {
      name,
      instructor: Number(instructor),
      max_capacity: Number(maxCapacity),
      duration_minutes: Number(durationMinutes),
    }
    const action = editingClass
      ? updateClass.mutateAsync({ id: editingClass.id, data })
      : createClass.mutateAsync(data)

    action.then(onClose).catch(() => setError('No se pudo guardar la clase.'))
  }

  return (
    <Modal title={editingClass ? 'Editar clase' : 'Nueva clase'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="class-name">Nombre</label>
          <input
            id="class-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Spinning"
          />
        </div>

        <div>
          <label htmlFor="class-instructor">Instructor</label>
          <select
            id="class-instructor"
            value={instructor}
            onChange={(event) => setInstructor(Number(event.target.value) || '')}
          >
            <option value="">Selecciona un instructor</option>
            {employees?.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="class-capacity">Cupo máximo</label>
            <input
              id="class-capacity"
              value={maxCapacity}
              onChange={(event) => setMaxCapacity(event.target.value)}
              placeholder="15"
              inputMode="numeric"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="class-duration">Duración (min)</label>
            <input
              id="class-duration"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              placeholder="45"
              inputMode="numeric"
            />
          </div>
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </Modal>
  )
}
