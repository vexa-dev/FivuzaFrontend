import { HandCoins, Receipt } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatCurrency } from '../../../shared/utils/format'
import type { Customer } from '../api'
import { useCustomers } from '../hooks/useCustomers'
import { AccountStatementModal } from './AccountStatementModal'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es-PE', { dateStyle: 'medium' })
}

function daysSince(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

/** Cobranzas (Sprint 19): clientes con deuda, ordenados por antigüedad
 * (fecha del cargo mas viejo aun no saldado) -no hay concepto de "fecha de
 * vencimiento" en la BDD, asi que "antiguedad" es cuanto tiempo lleva esa
 * deuda sin cerrarse, no un plazo formal incumplido. */
export function CollectionsTab() {
  const { data: customers, isLoading } = useCustomers()
  const [statementFor, setStatementFor] = useState<Customer | null>(null)

  const debtors = useMemo(() => {
    return (customers ?? [])
      .filter((c) => Number(c.current_debt) > 0)
      .sort((a, b) => {
        const dateA = a.oldest_unpaid_debt_at ? new Date(a.oldest_unpaid_debt_at).getTime() : 0
        const dateB = b.oldest_unpaid_debt_at ? new Date(b.oldest_unpaid_debt_at).getTime() : 0
        return dateA - dateB
      })
  }, [customers])

  return (
    <div className="card core-table-card">
      <div className="table-toolbar">
        <span className="summary-section-title" style={{ margin: 0 }}>
          Clientes con deuda
        </span>
      </div>

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {debtors.length === 0 && !isLoading && (
        <EmptyState icon={<HandCoins />} title="No hay deudas pendientes" subtitle="Ningún cliente tiene fiado sin pagar." />
      )}
      {debtors.length > 0 && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Deuda desde</th>
              <th>Antigüedad</th>
              <th>Deuda</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {debtors.map((customer) => (
              <tr key={customer.id}>
                <td className="core-table-strong">{customer.name}</td>
                <td>{formatDate(customer.oldest_unpaid_debt_at)}</td>
                <td>
                  {customer.oldest_unpaid_debt_at
                    ? `${daysSince(customer.oldest_unpaid_debt_at)} días`
                    : '—'}
                </td>
                <td>
                  <span className="badge badge-danger">
                    <span className="dot" />
                    {formatCurrency(customer.current_debt)}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setStatementFor(customer)}
                  >
                    <Receipt size={14} strokeWidth={2} />
                    Registrar abono
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {statementFor && (
        <AccountStatementModal customer={statementFor} onClose={() => setStatementFor(null)} />
      )}
    </div>
  )
}
