const VARIANTS = ['primary', 'success', 'warning', 'danger'] as const

function hashToVariant(seed: number): (typeof VARIANTS)[number] {
  return VARIANTS[seed % VARIANTS.length]
}

/** Avatar por fila con color derivado del id -mismo componente .avatar del
 * topbar (inicial + circulo), pero cada usuario de la lista se distingue
 * del resto en vez de que todos compartan el mismo tono "vos" del topbar.
 * Solo usa las 4 variantes semanticas ya existentes (success/warning/
 * danger/primary), ninguna es un color nuevo. */
export function UserAvatar({ email, seed }: { email: string; seed: number }) {
  const variant = hashToVariant(seed)
  return (
    <span className={`avatar user-avatar-${variant}`}>{email[0]?.toUpperCase() ?? '?'}</span>
  )
}
