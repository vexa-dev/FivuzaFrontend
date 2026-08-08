import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import type { Employee } from '../api'
import { useGeneratePayroll } from '../hooks/usePayroll'

interface PayrollGenerateModalProps {
  employees: Employee[]
  onClose: () => void
  onGenerated: (payrollId: number) => void
}

/** Genera la planilla de un periodo (Sprint 23). Bonos/descuentos se
 * ingresan aquí, antes de confirmar -una vez generada, los montos quedan
 * congelados: no hay pantalla de edición posterior, solo un nuevo
 * intento para otro periodo. */
export function PayrollGenerateModal({
  employees,
  onClose,
  onGenerated,
}: PayrollGenerateModalProps) {
  const [employeeId, setEmployeeId] = useState<number | ''>(employees[0]?.id ?? '')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [bonuses, setBonuses] = useState('0.00')
  const [deductions, setDeductions] = useState('0.00')
  const [error, setError] = useState<string | null>(null)

  const generatePayroll = useGeneratePayroll()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!employeeId || !periodStart || !periodEnd) {
      setError('Trabajador, inicio y fin del periodo son requeridos.')
      return
    }

    generatePayroll
      .mutateAsync({
        employee_id: employeeId,
        period_start: periodStart,
        period_end: periodEnd,
        bonuses,
        deductions,
      })
      .then((payroll) => onGenerated(payroll.id))
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          const body = err.body as { error?: { code?: string } }
          if (body?.error?.code === 'PAYROLL_ALREADY_EXISTS') {
            setError('Ya existe una planilla generada para este trabajador en este periodo.')
            return
          }
        }
        setError('No se pudo generar la planilla.')
      })
  }

  return (
    <Modal title="Generar planilla" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="payroll-employee">Trabajador</label>
          <select
            id="payroll-employee"
            value={employeeId}
            onChange={(event) => setEmployeeId(Number(event.target.value))}
          >
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="payroll-period-start">Inicio del periodo</label>
            <input
              id="payroll-period-start"
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="payroll-period-end">Fin del periodo</label>
            <input
              id="payroll-period-end"
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="payroll-bonuses">Bonos (S/)</label>
            <input
              id="payroll-bonuses"
              type="number"
              step="0.01"
              min="0"
              value={bonuses}
              onChange={(event) => setBonuses(event.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="payroll-deductions">Descuentos (S/)</label>
            <input
              id="payroll-deductions"
              type="number"
              step="0.01"
              min="0"
              value={deductions}
              onChange={(event) => setDeductions(event.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={generatePayroll.isPending}>
          {generatePayroll.isPending ? 'Generando...' : 'Generar planilla'}
        </button>
      </form>
    </Modal>
  )
}
