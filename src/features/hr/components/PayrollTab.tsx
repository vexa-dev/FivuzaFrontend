import { Plus, Receipt } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatCurrency } from '../../../shared/utils/format'
import type { Employee } from '../api'
import { useMarkPayrollPaid, usePayroll } from '../hooks/usePayroll'
import { PayrollBoletaModal } from './PayrollBoletaModal'
import { PayrollGenerateModal } from './PayrollGenerateModal'

interface PayrollTabProps {
  employees: Employee[]
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-PE', { dateStyle: 'medium' })
}

export function PayrollTab({ employees }: PayrollTabProps) {
  const { data: payroll, isLoading } = usePayroll()
  const markPaid = useMarkPayrollPaid()
  const [showGenerate, setShowGenerate] = useState(false)
  const [boletaPayrollId, setBoletaPayrollId] = useState<number | null>(null)

  const employeeName = (id: number) =>
    employees.find((employee) => employee.id === id)?.full_name ?? '—'
  const boletaPayroll = payroll?.find((row) => row.id === boletaPayrollId) ?? null
  const boletaEmployee = boletaPayroll
    ? employees.find((employee) => employee.id === boletaPayroll.employee)
    : undefined

  return (
    <div className="card core-table-card">
      <div className="table-toolbar" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-primary" onClick={() => setShowGenerate(true)}>
          <Plus size={15} strokeWidth={2.5} />
          Generar planilla
        </button>
      </div>

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {payroll && payroll.length === 0 && (
        <EmptyState
          icon={<Receipt />}
          title="Todavía no hay planillas generadas"
          subtitle='Genera la primera con "Generar planilla".'
        />
      )}
      {payroll && payroll.length > 0 && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Trabajador</th>
              <th>Periodo</th>
              <th>Neto a pagar</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {payroll.map((row) => (
              <tr key={row.id}>
                <td className="core-table-strong">{employeeName(row.employee)}</td>
                <td>
                  {formatDate(row.period_start)} – {formatDate(row.period_end)}
                </td>
                <td className="core-table-strong">{formatCurrency(row.net_amount)}</td>
                <td>
                  <span className={`badge ${row.status === 'PAID' ? 'badge-success' : 'badge-neutral'}`}>
                    <span className="dot" />
                    {row.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setBoletaPayrollId(row.id)}
                    >
                      Ver boleta
                    </button>
                    {row.status === 'PENDING' && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={markPaid.isPending}
                        onClick={() => markPaid.mutate({ id: row.id })}
                      >
                        Marcar pagado
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showGenerate && (
        <PayrollGenerateModal
          employees={employees}
          onClose={() => setShowGenerate(false)}
          onGenerated={(payrollId) => {
            setShowGenerate(false)
            setBoletaPayrollId(payrollId)
          }}
        />
      )}

      {boletaPayroll && (
        <PayrollBoletaModal
          payroll={boletaPayroll}
          employee={boletaEmployee}
          onClose={() => setBoletaPayrollId(null)}
        />
      )}
    </div>
  )
}
