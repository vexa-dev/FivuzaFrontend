import { useTheme } from '../../theme/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme}>
      {theme === 'dark' ? '☀ Claro' : '☾ Oscuro'}
    </button>
  )
}
