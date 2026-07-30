import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../theme/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      {theme === 'dark' ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />}
      {theme === 'dark' ? 'Claro' : 'Oscuro'}
    </button>
  )
}
