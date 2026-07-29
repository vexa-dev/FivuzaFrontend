import { Modal } from '../../../shared/components/Modal'
import type { Permission, TenantUserRecord, UserPermissionOverride } from '../api'
import { usePermissions } from '../hooks/usePermissions'
import { useSetUserOverride, useUserPermissionOverrides } from '../hooks/useUserOverrides'

interface UserOverridesModalProps {
  user: TenantUserRecord
  onClose: () => void
}

type OverrideState = 'inherited' | 'granted' | 'denied'

function stateOf(
  permission: Permission,
  userId: number,
  overrides: UserPermissionOverride[] | undefined,
): OverrideState {
  const override = overrides?.find(
    (item) => item.user === userId && item.permission === permission.id,
  )
  if (!override) return 'inherited'
  return override.is_granted ? 'granted' : 'denied'
}

export function UserOverridesModal({ user, onClose }: UserOverridesModalProps) {
  const { data: permissions } = usePermissions()
  const { data: overrides } = useUserPermissionOverrides()
  const { set } = useSetUserOverride()

  const cycle = (permission: Permission) => {
    const current = stateOf(permission, user.id, overrides)
    // inherited -> granted -> denied -> inherited
    if (current === 'inherited') {
      set.mutate({ user: user.id, permission: permission.id, isGranted: true })
    } else if (current === 'granted') {
      set.mutate({ user: user.id, permission: permission.id, isGranted: false })
    } else {
      set.mutate({ user: user.id, permission: permission.id, isGranted: true })
    }
  }

  return (
    <Modal title={`Permisos individuales — ${user.email}`} onClose={onClose}>
      <p className="login-subtitle" style={{ margin: 0, textAlign: 'left' }}>
        Estos overrides se suman o restan a los permisos que el usuario ya tiene por su rol.
        Clic para alternar: heredado → otorgado → denegado.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {permissions?.map((permission) => {
          const state = stateOf(permission, user.id, overrides)
          const badgeClass =
            state === 'granted'
              ? 'badge-success'
              : state === 'denied'
                ? 'badge-danger'
                : 'badge-neutral'
          const label =
            state === 'granted' ? 'Otorgado' : state === 'denied' ? 'Denegado' : 'Heredado'

          return (
            <button
              key={permission.id}
              type="button"
              className="btn btn-ghost"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
              }}
              onClick={() => cycle(permission)}
            >
              <span>{permission.code}</span>
              <span className={`badge ${badgeClass}`}>{label}</span>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
