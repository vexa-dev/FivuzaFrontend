import logoParaFondoClaro from '../../assets/LogoFivuza/FondoClaro.svg'
import logoParaFondoOscuro from '../../assets/LogoFivuza/FonfoOscuro.svg'
import { useTheme } from '../../theme/useTheme'

interface LogoProps {
  height?: number
  withWordmark?: boolean
  layout?: 'row' | 'stacked'
}

export function Logo({ height = 24, withWordmark = true, layout = 'row' }: LogoProps) {
  const { theme } = useTheme()
  const src = theme === 'dark' ? logoParaFondoOscuro : logoParaFondoClaro

  const wordmark = withWordmark && (
    <span
      style={{
        fontWeight: 700,
        fontSize: layout === 'stacked' ? height * 0.32 : height * 0.85,
        letterSpacing: '0.06em',
        color: 'var(--text-primary)',
      }}
    >
      FIVUZA
    </span>
  )

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexDirection: layout === 'stacked' ? 'column' : 'row',
        gap: layout === 'stacked' ? 12 : 10,
      }}
    >
      <img src={src} alt="Fivuza" height={height} style={{ width: 'auto' }} />
      {wordmark}
    </span>
  )
}
