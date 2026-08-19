import { useContext } from 'react'
import { BrandThemeContext } from './BrandThemeContext'

export function useBrandTheme() {
  const context = useContext(BrandThemeContext)
  if (!context) {
    throw new Error('useBrandTheme debe usarse dentro de <BrandThemeProvider>')
  }
  return context
}
