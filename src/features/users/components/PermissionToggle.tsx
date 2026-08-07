import './PermissionToggle.css'

interface PermissionToggleProps {
  checked: boolean
  onChange: () => void
  label: string
  disabled?: boolean
}

/** Switch animado -reemplaza el checkbox nativo de la matriz de permisos.
 * El thumb se desliza con un leve rebote (cubic-bezier con overshoot) en
 * vez de saltar de golpe, para que conceder/revocar un permiso se sienta
 * como una accion real, no un cambio de estado silencioso. */
export function PermissionToggle({ checked, onChange, label, disabled }: PermissionToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`permission-toggle ${checked ? 'permission-toggle-on' : ''}`}
      onClick={onChange}
    >
      <span className="permission-toggle-thumb" />
    </button>
  )
}
