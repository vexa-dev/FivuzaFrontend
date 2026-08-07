import { useState } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import type { Customer } from '../api'
import { useCustomerBalanceLedger, useCustomerDebtLedger, useRegisterDebtPayment } from '../hooks/useCreditLedger'

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

interface AccountStatementModalProps {
  customer: Customer
  onClose: () => void
}

/** Estado de cuenta del cliente (Sprint 19): deuda actual, saldo a favor,
 * historial de ambos libros, y accion de registrar abono -mismos numeros
 * que CreditLedgerService.get_debt()/get_balance() en el backend, nunca
 * recalculados aca. */
export function AccountStatementModal({ customer, onClose }: AccountStatementModalProps) {
  const { data: debtEntries, isLoading: loadingDebt } = useCustomerDebtLedger(customer.id)
  const { data: balanceEntries, isLoading: loadingBalance } = useCustomerBalanceLedger(customer.id)
  const registerPayment = useRegisterDebtPayment()

  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const currentDebt = Number(customer.current_debt)

  const handleRegisterPayment = () => {
    setError(null)
    setSuccess(null)
    if (!amount || Number(amount) <= 0) {
      setError('Ingresa un monto valido.')
      return
    }
    registerPayment.mutate(
      { customer_id: customer.id, amount, description },
      {
        onSuccess: (result) => {
          setSuccess(`Abono registrado. Nueva deuda: S/ ${result.customer_current_debt}`)
          setAmount('')
          setDescription('')
        },
        onError: (err: unknown) => {
          const body = err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
          setError(body?.error?.message ?? 'No se pudo registrar el abono.')
        },
      },
    )
  }

  return (
    <Modal title={`Estado de cuenta: ${customer.name}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <dl className="detail-grid">
          <dt>Deuda actual</dt>
          <dd style={{ fontWeight: 700, color: currentDebt > 0 ? 'var(--danger)' : undefined }}>
            S/ {customer.current_debt}
          </dd>
          <dt>Saldo a favor</dt>
          <dd style={{ fontWeight: 700 }}>S/ {customer.current_balance}</dd>
          <dt>Límite de crédito</dt>
          <dd>{customer.credit_limit === null ? 'Sin límite' : `S/ ${customer.credit_limit}`}</dd>
        </dl>

        {currentDebt > 0 && (
          <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ margin: 0 }}>Registrar abono</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Monto"
                style={{ width: 100 }}
              />
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descripción (opcional)"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={registerPayment.isPending}
                onClick={handleRegisterPayment}
              >
                {registerPayment.isPending ? 'Guardando...' : 'Abonar'}
              </button>
            </div>
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="core-state-message" role="status">
                {success}
              </p>
            )}
          </div>
        )}

        <div>
          <p className="summary-section-title" style={{ margin: '0 0 8px' }}>
            Historial de fiado
          </p>
          {loadingDebt && <p className="core-page-subtitle">Cargando...</p>}
          {debtEntries && debtEntries.length === 0 && (
            <p className="core-page-subtitle">Sin movimientos de fiado.</p>
          )}
          {debtEntries && debtEntries.length > 0 && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {debtEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.created_at)}</td>
                    <td>
                      <span className={`badge ${entry.type === 'DEBIT' ? 'badge-danger' : 'badge-success'}`}>
                        <span className="dot" />
                        {entry.type === 'DEBIT' ? 'Cargo' : 'Abono'}
                      </span>
                    </td>
                    <td>S/ {entry.amount}</td>
                    <td>{entry.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <p className="summary-section-title" style={{ margin: '0 0 8px' }}>
            Historial de saldo a favor
          </p>
          {loadingBalance && <p className="core-page-subtitle">Cargando...</p>}
          {balanceEntries && balanceEntries.length === 0 && (
            <p className="core-page-subtitle">Sin movimientos de saldo a favor.</p>
          )}
          {balanceEntries && balanceEntries.length > 0 && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {balanceEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.created_at)}</td>
                    <td>
                      <span className={`badge ${entry.type === 'CREDIT' ? 'badge-success' : 'badge-neutral'}`}>
                        <span className="dot" />
                        {entry.type === 'CREDIT' ? 'Generado' : 'Usado'}
                      </span>
                    </td>
                    <td>S/ {entry.amount}</td>
                    <td>{entry.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  )
}
