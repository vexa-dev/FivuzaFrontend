import logoParaFondoClaro from '../../assets/LogoFivuza/FondoClaro.svg'
import logoParaFondoOscuro from '../../assets/LogoFivuza/FonfoOscuro.svg'
import { useTheme } from '../../theme/useTheme'

interface LogoProps {
  height?: number
  withWordmark?: boolean
}

export function Logo({ height = 24, withWordmark = true }: LogoProps) {
  const { theme } = useTheme()
  const src = theme === 'dark' ? logoParaFondoOscuro : logoParaFondoClaro

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <img src={src} alt="Fivuza" height={height} style={{ width: 'auto' }} />
      {withWordmark && (
        <span
          style={{
            fontWeight: 700,
            fontSize: height * 0.85,
            letterSpacing: '0.02em',
            color: 'var(--text-primary)',
          }}
        >
          FIVUZA
        </span>
      )}
    </span>
  )
}
