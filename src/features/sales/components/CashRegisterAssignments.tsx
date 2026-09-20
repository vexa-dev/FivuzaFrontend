import { getErrorMessage } from '../../../shared/utils/errorMessage'
import { useUsers } from '../../users/hooks/useUsers'
import { useCashRegisters, useUpdateCashRegister } from '../hooks/useCashSessions'

/** Bloque A.2: a quién pertenece cada caja. Con una caja asignada, solo esa
 * persona (o quien controla la caja) abre, vende y cierra en ella; sin
 * asignar, el dueño del turno es quien la abrió. */
export function CashRegisterAssignments() {
  const { data: registers, isLoading } = useCashRegisters()
  const { data: users } = useUsers()
  const updateRegister = useUpdateCashRegister()

  if (isLoading) {
    return (
      <div className="loading-row">
        <span className="spinner" />
        Cargando...
      </div>
    )
  }

  if (!registers || registers.length === 0) return null

  const activeUsers = (users ?? []).filter((user) => user.is_active)

  return (
    <div className="card core-table-card">
      <div className="table-toolbar">
        <span className="summary-section-title" style={{ margin: 0 }}>
          Cajas del negocio
        </span>
      </div>
      <p className="core-state-message" style={{ margin: '0 16px 12px' }}>
        Asigna una caja a una persona para que nadie más pueda vender ni cerrar en ella. Si la
        dejas sin asignar, la caja es de quien abra el turno.
      </p>
      <table className="core-table">
        <thead>
          <tr>
            <th>Caja</th>
            <th>Estado</th>
            <th>Asignada a</th>
          </tr>
        </thead>
        <tbody>
          {registers.map((register) => (
            <tr key={register.id}>
              <td className="core-table-strong">{register.name}</td>
              <td>
                <span className={`badge ${register.is_active ? 'badge-success' : 'badge-ghost'}`}>
                  <span className="dot" />
                  {register.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </td>
              <td>
                <select
                  aria-label={`Persona asignada a ${register.name}`}
                  value={register.assigned_user ?? ''}
                  disabled={updateRegister.isPending}
                  onChange={(event) =>
                    updateRegister.mutate({
                      id: register.id,
                      assignedUser: event.target.value ? Number(event.target.value) : null,
                    })
                  }
                >
                  <option value="">Sin asignar</option>
                  {activeUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {updateRegister.isError && (
        <p className="login-error" role="alert" style={{ margin: 12 }}>
          {getErrorMessage(updateRegister.error, 'No se pudo cambiar la asignación.')}
        </p>
      )}
    </div>
  )
}
