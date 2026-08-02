import { Plus, Users as UsersIcon } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../shared/components/EmptyState'
import type { PlatformStaffRecord } from './api'
import { StaffFormModal } from './components/StaffFormModal'
import { useAuth } from './hooks/useAuth'
import { useStaff, useUpdateStaff } from './hooks/useStaff'

export function StaffPage() {
  const { staff: currentStaff } = useAuth()
  const { data: staffList, isLoading } = useStaff()
  const updateStaff = useUpdateStaff()
  const [editingStaff, setEditingStaff] = useState<PlatformStaffRecord | null | undefined>(
    undefined,
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Equipo Fivuza</h1>
          <p className="core-page-subtitle">Personal interno con acceso al panel</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditingStaff(null)}>
          <Plus size={15} strokeWidth={2.5} />
          Nuevo miembro
        </button>
      </div>

      <div className="card core-table-card">
        {isLoading && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}
        {staffList && staffList.length === 0 && (
          <EmptyState icon={<UsersIcon />} title="Todavía no hay miembros" />
        )}
        {staffList && staffList.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((member) => (
                <tr key={member.id}>
                  <td className="core-table-strong">{member.full_name}</td>
                  <td>{member.email}</td>
                  <td>
                    <span className="badge badge-neutral">
                      <span className="dot" />
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${member.is_active ? 'badge-success' : 'badge-danger'}`}>
                      <span className="dot" />
                      {member.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditingStaff(member)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${member.is_active ? 'btn-danger-ghost' : 'btn-ghost'}`}
                        disabled={member.id === currentStaff?.id || updateStaff.isPending}
                        title={
                          member.id === currentStaff?.id
                            ? 'No puedes desactivar tu propia cuenta'
                            : undefined
                        }
                        onClick={() =>
                          updateStaff.mutate({
                            id: member.id,
                            data: { is_active: !member.is_active },
                          })
                        }
                      >
                        {member.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingStaff !== undefined && (
        <StaffFormModal editingStaff={editingStaff} onClose={() => setEditingStaff(undefined)} />
      )}
    </div>
  )
}
