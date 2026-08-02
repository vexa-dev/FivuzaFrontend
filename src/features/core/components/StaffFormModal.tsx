import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { PlatformStaffInfo } from '../hooks/session'
import type { PlatformStaffRecord } from '../api'
import { useCreateStaff, useUpdateStaff } from '../hooks/useStaff'

interface StaffFormModalProps {
  editingStaff: PlatformStaffRecord | null
  onClose: () => void
}

export function StaffFormModal({ editingStaff, onClose }: StaffFormModalProps) {
  const [email, setEmail] = useState(editingStaff?.email ?? '')
  const [fullName, setFullName] = useState(editingStaff?.full_name ?? '')
  const [role, setRole] = useState<PlatformStaffInfo['role']>(editingStaff?.role ?? 'SUPPORT')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createStaff = useCreateStaff()
  const updateStaff = useUpdateStaff()
  const isPending = createStaff.isPending || updateStaff.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!email || !fullName) {
      setError('Correo y nombre son requeridos.')
      return
    }
    if (!editingStaff && !password) {
      setError('La contraseña es requerida para un miembro nuevo.')
      return
    }

    const action = editingStaff
      ? updateStaff.mutateAsync({
          id: editingStaff.id,
          data: { email, full_name: fullName, role, ...(password ? { password } : {}) },
        })
      : createStaff.mutateAsync({ email, full_name: fullName, role, password })

    action.then(onClose).catch(() => setError('No se pudo guardar el miembro del equipo.'))
  }

  return (
    <Modal title={editingStaff ? 'Editar miembro' : 'Nuevo miembro del equipo'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="staff-email">Correo</label>
          <input
            id="staff-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="staff-full-name">Nombre completo</label>
          <input
            id="staff-full-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="staff-role">Rol</label>
          <select
            id="staff-role"
            value={role}
            onChange={(event) => setRole(event.target.value as PlatformStaffInfo['role'])}
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="SUPPORT">SUPPORT</option>
            <option value="BILLING">BILLING</option>
          </select>
        </div>

        <div>
          <label htmlFor="staff-password">
            Contraseña {editingStaff && '(dejar vacío para no cambiarla)'}
          </label>
          <input
            id="staff-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
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
