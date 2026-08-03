import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/utils/apiClient'
import { useCashRegisters, useOpenCashSession } from '../hooks/useCashSessions'

export function OpenCashSessionForm() {
  const { data: registers, isLoading } = useCashRegisters()
  const openSession = useOpenCashSession()
  const [registerId, setRegisterId] = useState<number | ''>('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  const activeRegisters = (registers ?? []).filter((r) => r.is_active)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!registerId || !amount.trim()) {
      setError('Selecciona una caja e ingresa el monto inicial.')
      return
    }
    openSession
      .mutateAsync({ cashRegisterId: registerId, openingAmount: amount })
      .catch((err: unknown) => {
        const body =
          err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
        setError(body?.error?.message ?? 'No se pudo abrir la caja.')
      })
  }

  if (isLoading) {
    return (
      <div className="loading-row">
        <span className="spinner" />
        Cargando...
      </div>
    )
  }

  return (
    <div className="card cash-open-card">
      <h2 className="core-page-title" style={{ fontSize: '1.125rem' }}>
        Apertura de caja
      </h2>
      <p className="core-page-subtitle">Selecciona la caja y declara el monto inicial.</p>

      {activeRegisters.length === 0 ? (
        <p className="core-state-message">No hay cajas activas configuradas.</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label htmlFor="cash-register">Caja</label>
            <select
              id="cash-register"
              value={registerId}
              onChange={(event) => setRegisterId(Number(event.target.value))}
            >
              <option value="">Selecciona una caja...</option>
              {activeRegisters.map((register) => (
                <option key={register.id} value={register.id}>
                  {register.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="opening-amount">Monto inicial</label>
            <input
              id="opening-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="50.00"
            />
          </div>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={openSession.isPending}>
            {openSession.isPending ? 'Abriendo...' : 'Abrir caja'}
          </button>
        </form>
      )}
    </div>
  )
}
