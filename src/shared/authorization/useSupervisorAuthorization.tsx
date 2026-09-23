import { useCallback, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  AuthorizationCancelledError,
  authorizationRequirementFrom,
  type AuthorizationRequirement,
} from './api'
import { SupervisorAuthorizationModal } from './SupervisorAuthorizationModal'

interface RunOptions {
  /** Venta a la que queda atada la autorización (anular, devolver). */
  targetId?: number
  description?: string
}

interface PendingRequest {
  requirement: AuthorizationRequirement
  options: RunOptions
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

/** Bloque C.3: corre la operación; si el backend responde que falta la
 * autorización de un supervisor, abre el modal y la repite con el token.
 *
 *   const authorization = useSupervisorAuthorization()
 *   authorization.run((token) => voidSale(id, reason, token), { targetId: id })
 *   ...
 *   return <>{...}{authorization.modal}</>
 *
 * Si el cajero cierra el modal, `run` rechaza con AuthorizationCancelledError
 * (ver isAuthorizationCancelled) para que el llamador no lo muestre como
 * error. */
export function useSupervisorAuthorization() {
  const [pending, setPending] = useState<PendingRequest | null>(null)

  const askSupervisor = useCallback(
    (requirement: AuthorizationRequirement, options: RunOptions) =>
      new Promise<string>((resolve, reject) => {
        setPending({ requirement, options, resolve, reject })
      }),
    [],
  )

  const close = () => setPending(null)

  const run = useCallback(
    async <T,>(operation: (token?: string) => Promise<T>, options: RunOptions = {}): Promise<T> => {
      try {
        return await operation()
      } catch (error) {
        const requirement = authorizationRequirementFrom(error)
        if (requirement === null) throw error
        const token = await askSupervisor(requirement, options)
        return operation(token)
      }
    },
    [askSupervisor],
  )

  const modal: ReactNode = pending
    ? createPortal(
        <SupervisorAuthorizationModal
          requirement={pending.requirement}
          targetId={pending.options.targetId}
          description={pending.options.description}
          onAuthorized={(authorization) => {
            pending.resolve(authorization.token)
            close()
          }}
          onCancel={() => {
            pending.reject(new AuthorizationCancelledError())
            close()
          }}
        />,
        document.body,
      )
    : null

  return { run, modal, isAsking: pending !== null }
}

export function isAuthorizationCancelled(error: unknown): boolean {
  return error instanceof AuthorizationCancelledError
}
