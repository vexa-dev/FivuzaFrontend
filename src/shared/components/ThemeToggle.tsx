import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../theme/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-switch"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      aria-pressed={isDark}
      title={isDark ? 'Tema oscuro' : 'Tema claro'}
    >
      <span className="theme-switch-thumb">
        <span className="theme-switch-icon" key={theme}>
          {isDark ? <Moon size={11} strokeWidth={2} /> : <Sun size={11} strokeWidth={2} />}
        </span>
      </span>
    </button>
  )
}
