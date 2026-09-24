import { ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Modal } from '../components/Modal'
import { PasswordInput } from '../components/PasswordInput'
import { ApiError } from '../utils/apiClient'
import { getThrottleMessage } from '../utils/errorMessage'
import {
  requestSupervisorAuthorization,
  type AuthorizationRequirement,
  type SupervisorAuthorization,
} from './api'

interface SupervisorAuthorizationModalProps {
  requirement: AuthorizationRequirement
  targetId?: number
  /** Qué se va a autorizar, en palabras del cajero ("Anular la V-000123"). */
  description?: string
  onAuthorized: (authorization: SupervisorAuthorization) => void
  onCancel: () => void
}

/** Bloque C.3: el supervisor escribe su correo y contraseña en el equipo del
 * cajero. Su sesión nunca se abre: solo se emite una autorización de un solo
 * uso para esta operación. */
export function SupervisorAuthorizationModal({
  requirement,
  targetId,
  description,
  onAuthorized,
  onCancel,
}: SupervisorAuthorizationModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Ingresa el correo y la contraseña del supervisor.')
      return
    }
    setSubmitting(true)
    requestSupervisorAuthorization({
      email: email.trim(),
      password,
      permission: requirement.permission,
      ...(targetId !== undefined ? { target_id: targetId } : {}),
      ...(requirement.requestedDiscountPercent
        ? { discount_percent: requirement.requestedDiscountPercent }
        : {}),
    })
      .then(onAuthorized)
      .catch((err: unknown) => {
        setPassword('')
        const throttleMessage = getThrottleMessage(err)
        if (throttleMessage) {
          setError(throttleMessage)
          return
        }
        const body = err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
        setError(body?.error?.message ?? 'No se pudo autorizar la operación.')
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <Modal title="Autorización de supervisor" onClose={onCancel}>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        aria-label="Autorización de supervisor"
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <ShieldCheck size={20} strokeWidth={2} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>{requirement.message}</p>
            {description && (
              <p className="core-page-subtitle" style={{ margin: '4px 0 0' }}>
                {description}
              </p>
            )}
            {requirement.requestedDiscountPercent && (
              <p className="core-page-subtitle" style={{ margin: '4px 0 0' }}>
                Descuento pedido: {Number(requirement.requestedDiscountPercent)}% por producto
                {requirement.maxDiscountPercent !== undefined &&
                  ` · tu tope es ${Number(requirement.maxDiscountPercent)}%`}
              </p>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="supervisor-auth-email">Correo del supervisor</label>
          <input
            id="supervisor-auth-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="off"
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="supervisor-auth-password">Contraseña del supervisor</label>
          <PasswordInput
            id="supervisor-auth-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="off"
          />
        </div>
        <p className="core-page-subtitle" style={{ margin: 0 }}>
          La autorización vale para esta operación y vence en 2 minutos. Queda en la bitácora
          quién la pidió y quién la dio.
        </p>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Autorizando...' : 'Autorizar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
