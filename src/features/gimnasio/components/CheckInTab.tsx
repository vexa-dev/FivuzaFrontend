import { CheckCircle2, ScanLine, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useCustomers } from '../../sales/hooks/useCustomers'
import type { CheckInResult } from '../api'
import { useCheckIn } from '../hooks/useCheckIn'
import { useMemberships } from '../hooks/useMemberships'

const REASON_LABELS: Record<string, string> = {
  MEMBERSHIP_FROZEN: 'Membresía congelada',
  MEMBERSHIP_EXPIRED: 'Membresía vencida',
  MEMBERSHIP_CANCELLED: 'Membresía cancelada',
}

/** Check-in rápido (Sprint 31, Ficha de Producto §5.1): escaneo del QR del
 * socio (pegar el texto leído por cualquier lector, ya que este entorno no
 * tiene una camara real que probar) o búsqueda manual por nombre/documento,
 * con validación visual grande de acceso permitido/denegado. */
export function CheckInTab() {
  const [token, setToken] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerId, setCustomerId] = useState<number | ''>('')
  const { data: customers } = useCustomers(customerSearch)
  const { data: memberships } = useMemberships(
    customerId ? { customer: customerId, status: 'ACTIVE' } : undefined,
  )

  const checkIn = useCheckIn()
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runCheckIn = (data: { token?: string; membership_id?: number }) => {
    setError(null)
    setResult(null)
    checkIn
      .mutateAsync(data)
      .then(setResult)
      .catch(() => setError('No se pudo verificar el acceso (código o socio inválido).'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label htmlFor="checkin-token">Escanear QR (pegar el código leído)</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            id="checkin-token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="FIVUZA-MEMBERSHIP-..."
            autoComplete="off"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={!token.trim() || checkIn.isPending}
            onClick={() => runCheckIn({ token: token.trim() })}
          >
            <ScanLine size={15} strokeWidth={2.5} />
            Verificar
          </button>
        </div>

        <label htmlFor="checkin-customer-search" style={{ marginTop: 6 }}>
          O buscar socio manualmente
        </label>
        <input
          id="checkin-customer-search"
          value={customerSearch}
          onChange={(event) => {
            setCustomerSearch(event.target.value)
            setCustomerId('')
          }}
          placeholder="Buscar por documento o nombre..."
          autoComplete="off"
        />
        {customerSearch.trim() && customers && customers.length > 0 && !customerId && (
          <div className="card" style={{ maxHeight: 140, overflowY: 'auto' }}>
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0 }}
                onClick={() => {
                  setCustomerId(customer.id)
                  setCustomerSearch('')
                }}
              >
                {customer.name} · {customer.document_number}
              </button>
            ))}
          </div>
        )}
        {customerId && memberships && memberships.length === 0 && (
          <p className="core-page-subtitle" style={{ margin: 0 }}>
            Este socio no tiene membresías activas.
          </p>
        )}
        {customerId &&
          memberships?.map((membership) => (
            <button
              key={membership.id}
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={checkIn.isPending}
              onClick={() => runCheckIn({ membership_id: membership.id })}
            >
              Verificar membresía #{membership.id}
            </button>
          ))}
      </div>

      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div
          className="card"
          style={{
            maxWidth: 520,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            borderColor: result.allowed ? 'var(--color-success, #16a34a)' : 'var(--color-danger, #dc2626)',
          }}
        >
          {result.allowed ? (
            <CheckCircle2 size={56} strokeWidth={1.75} color="var(--color-success, #16a34a)" />
          ) : (
            <XCircle size={56} strokeWidth={1.75} color="var(--color-danger, #dc2626)" />
          )}
          <h2 style={{ margin: 0 }}>{result.allowed ? 'Acceso permitido' : 'Acceso denegado'}</h2>
          <p className="core-table-strong" style={{ margin: 0 }}>
            {result.customer_name}
          </p>
          <p className="core-page-subtitle" style={{ margin: 0 }}>
            {result.plan_name} · vence {result.end_date}
          </p>
          {!result.allowed && result.reason && (
            <span className="badge badge-danger">
              <span className="dot" />
              {REASON_LABELS[result.reason] ?? result.reason}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
