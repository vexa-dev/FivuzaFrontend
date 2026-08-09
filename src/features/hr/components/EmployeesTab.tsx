import { Pencil, Plus, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatCurrency } from '../../../shared/utils/format'
import type { TenantUserRecord } from '../../users/api'
import type { Employee } from '../api'
import { useDeleteEmployee, useEmployees } from '../hooks/useEmployees'
import { EmployeeFormModal } from './EmployeeFormModal'

interface Warehouse {
  id: number
  name: string
}

interface EmployeesTabProps {
  warehouses: Warehouse[]
  users: TenantUserRecord[]
}

const SALARY_TYPE_LABELS: Record<Employee['salary_type'], string> = {
  MONTHLY: 'Mensual',
  DAILY: 'Diario',
  HOURLY: 'Por hora',
}

export function EmployeesTab({ warehouses, users }: EmployeesTabProps) {
  const [search, setSearch] = useState('')
  const { data: employees, isLoading } = useEmployees({ search })
  const deleteEmployee = useDeleteEmployee()
  const [editingEmployee, setEditingEmployee] = useState<Employee | null | undefined>(
    undefined,
  )

  const warehouseName = (id: number) =>
    warehouses.find((warehouse) => warehouse.id === id)?.name ?? '—'
  const userEmail = (id: number | null) =>
    id === null ? null : (users.find((user) => user.id === id)?.email ?? '—')

  return (
    <div className="card core-table-card">
      <div className="table-toolbar">
        <div className="search-input">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre..."
          />
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditingEmployee(null)}>
          <Plus size={15} strokeWidth={2.5} />
          Nuevo trabajador
        </button>
      </div>

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {employees && employees.length === 0 && (
        <EmptyState
          icon={<UserRound />}
          title={search ? 'Sin resultados' : 'Todavía no hay trabajadores registrados'}
          subtitle={search ? 'Prueba con otro término de búsqueda.' : 'Crea el primero con "Nuevo trabajador".'}
        />
      )}
      {employees && employees.length > 0 && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cargo</th>
              <th>Sucursal</th>
              <th>Sueldo</th>
              <th>Usuario vinculado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="core-table-strong">{employee.full_name}</td>
                <td>{employee.position}</td>
                <td>{warehouseName(employee.warehouse)}</td>
                <td>
                  {formatCurrency(employee.salary_amount)} ({SALARY_TYPE_LABELS[employee.salary_type]})
                </td>
                <td>{userEmail(employee.user) ?? <span className="core-page-subtitle">Sin acceso</span>}</td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-icon"
                      aria-label={`Editar ${employee.full_name}`}
                      onClick={() => setEditingEmployee(employee)}
                    >
                      <Pencil />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-ghost btn-sm btn-icon"
                      aria-label={`Dar de baja a ${employee.full_name}`}
                      onClick={() => {
                        if (confirm(`¿Dar de baja a ${employee.full_name}?`)) {
                          deleteEmployee.mutate(employee.id)
                        }
                      }}
                    >
                      <Trash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingEmployee !== undefined && (
        <EmployeeFormModal
          editingEmployee={editingEmployee}
          warehouses={warehouses}
          users={users}
          onClose={() => setEditingEmployee(undefined)}
        />
      )}
    </div>
  )
}
