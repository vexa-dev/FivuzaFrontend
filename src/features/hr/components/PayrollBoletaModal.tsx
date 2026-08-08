import { Printer } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { printHtml } from '../../../shared/utils/printHtml'
import type { Employee, EmployeePayroll } from '../api'

interface PayrollBoletaModalProps {
  payroll: EmployeePayroll
  employee: Employee | undefined
  onClose: () => void
}

const SALARY_TYPE_LABELS: Record<Employee['salary_type'], string> = {
  MONTHLY: 'Mensual',
  DAILY: 'Diario',
  HOURLY: 'Por hora',
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-PE', { dateStyle: 'medium' })
}

/** Boleta de pago imprimible (Sprint 23). A diferencia del ticket de venta
 * (ReceiptService, Sprint 17), no hay un endpoint de backend que genere el
 * HTML -los datos de la planilla ya vienen completos del listado, así que
 * se arma la boleta en el propio frontend en vez de sumar un endpoint solo
 * para formatear lo que ya se tiene. */
function buildBoletaHtml(payroll: EmployeePayroll, employee: Employee | undefined) {
  return `
    <div style="font-family: monospace; width: 320px; padding: 12px;">
      <h2 style="text-align:center; margin: 0 0 8px;">Boleta de pago</h2>
      <p style="text-align:center; margin: 0 0 12px;">
        ${formatDate(payroll.period_start)} – ${formatDate(payroll.period_end)}
      </p>
      <hr />
      <p><strong>Trabajador:</strong> ${employee?.full_name ?? '—'}</p>
      <p><strong>Documento:</strong> ${employee?.document_number ?? '—'}</p>
      <p><strong>Cargo:</strong> ${employee?.position ?? '—'}</p>
      <p><strong>Tipo de sueldo:</strong> ${employee ? SALARY_TYPE_LABELS[employee.salary_type] : '—'}</p>
      <hr />
      <p>Sueldo base: S/ ${payroll.base_salary}</p>
      <p>Bonos: S/ ${payroll.bonuses}</p>
      <p>Descuentos: S/ ${payroll.deductions}</p>
      <hr />
      <p style="font-size: 1.1em;"><strong>Neto a pagar: S/ ${payroll.net_amount}</strong></p>
      <p><strong>Estado:</strong> ${payroll.status === 'PAID' ? 'PAGADO' : 'PENDIENTE'}</p>
      ${payroll.payment_date ? `<p><strong>Fecha de pago:</strong> ${formatDate(payroll.payment_date)}</p>` : ''}
    </div>
  `
}

export function PayrollBoletaModal({ payroll, employee, onClose }: PayrollBoletaModalProps) {
  const html = buildBoletaHtml(payroll, employee)

  return (
    <Modal title="Boleta de pago" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          className="card"
          style={{ display: 'flex', justifyContent: 'center', padding: 16, overflowX: 'auto' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <button type="button" className="btn btn-primary" onClick={() => printHtml(html)}>
          <Printer size={15} strokeWidth={2.5} />
          Imprimir boleta
        </button>
      </div>
    </Modal>
  )
}
