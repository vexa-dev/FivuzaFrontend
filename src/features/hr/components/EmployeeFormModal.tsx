import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import type { TenantUserRecord } from '../../users/api'
import type { Employee } from '../api'
import { useCreateEmployee, useUpdateEmployee } from '../hooks/useEmployees'

interface Warehouse {
  id: number
  name: string
}

interface EmployeeFormModalProps {
  editingEmployee: Employee | null
  warehouses: Warehouse[]
  users: TenantUserRecord[]
  onClose: () => void
}

const SALARY_TYPE_LABELS: Record<Employee['salary_type'], string> = {
  MONTHLY: 'Mensual',
  DAILY: 'Diario',
  HOURLY: 'Por hora',
}

export function EmployeeFormModal({
  editingEmployee,
  warehouses,
  users,
  onClose,
}: EmployeeFormModalProps) {
  const [fullName, setFullName] = useState(editingEmployee?.full_name ?? '')
  const [documentNumber, setDocumentNumber] = useState(
    editingEmployee?.document_number ?? '',
  )
  const [phone, setPhone] = useState(editingEmployee?.phone ?? '')
  const [position, setPosition] = useState(editingEmployee?.position ?? '')
  const [warehouseId, setWarehouseId] = useState<number | ''>(
    editingEmployee?.warehouse ?? warehouses[0]?.id ?? '',
  )
  const [salaryType, setSalaryType] = useState<Employee['salary_type']>(
    editingEmployee?.salary_type ?? 'MONTHLY',
  )
  const [salaryAmount, setSalaryAmount] = useState(editingEmployee?.salary_amount ?? '')
  const [hireDate, setHireDate] = useState(
    editingEmployee?.hire_date ?? new Date().toISOString().slice(0, 10),
  )
  const [userId, setUserId] = useState<number | ''>(editingEmployee?.user ?? '')
  const [error, setError] = useState<string | null>(null)

  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const isPending = createEmployee.isPending || updateEmployee.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!fullName.trim() || !documentNumber.trim() || !warehouseId || !salaryAmount) {
      setError('Nombre, documento, almacén y sueldo son requeridos.')
      return
    }

    const data = {
      full_name: fullName,
      document_number: documentNumber,
      phone,
      position,
      warehouse: warehouseId as number,
      salary_type: salaryType,
      salary_amount: salaryAmount,
      currency: 'PEN',
      hire_date: hireDate,
      user: userId === '' ? null : (userId as number),
    }

    const action = editingEmployee
      ? updateEmployee.mutateAsync({ id: editingEmployee.id, data })
      : createEmployee.mutateAsync(data)

    action
      .then(onClose)
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          const body = err.body as { document_number?: string[] }
          if (body?.document_number) {
            setError('Ya existe un trabajador con ese número de documento.')
            return
          }
        }
        setError('No se pudo guardar el trabajador.')
      })
  }

  return (
    <Modal
      title={editingEmployee ? 'Editar trabajador' : 'Nuevo trabajador'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="employee-name">Nombre completo</label>
          <input
            id="employee-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="employee-document">Documento</label>
            <input
              id="employee-document"
              value={documentNumber}
              onChange={(event) => setDocumentNumber(event.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="employee-phone">Teléfono</label>
            <input
              id="employee-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="employee-position">Cargo</label>
          <input
            id="employee-position"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            placeholder="Cajero, Vendedor, Almacenero..."
          />
        </div>

        <div>
          <label htmlFor="employee-warehouse">Sucursal</label>
          <select
            id="employee-warehouse"
            value={warehouseId}
            onChange={(event) => setWarehouseId(Number(event.target.value))}
          >
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="employee-salary-type">Tipo de sueldo</label>
            <select
              id="employee-salary-type"
              value={salaryType}
              onChange={(event) =>
                setSalaryType(event.target.value as Employee['salary_type'])
              }
            >
              {Object.entries(SALARY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="employee-salary-amount">Monto (S/)</label>
            <input
              id="employee-salary-amount"
              type="number"
              step="0.01"
              min="0"
              value={salaryAmount}
              onChange={(event) => setSalaryAmount(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="employee-hire-date">Fecha de ingreso</label>
          <input
            id="employee-hire-date"
            type="date"
            value={hireDate}
            onChange={(event) => setHireDate(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="employee-user">Usuario del sistema (opcional)</label>
          <select
            id="employee-user"
            value={userId}
            onChange={(event) =>
              setUserId(event.target.value === '' ? '' : Number(event.target.value))
            }
          >
            <option value="">Sin acceso al sistema</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
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
