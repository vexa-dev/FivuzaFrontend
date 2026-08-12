import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { deriveBrandTheme, type BrandThemeResult } from './brandTheme'
import { useTheme } from './useTheme'

const STORAGE_COLOR_KEY = 'fivuza-brand-color'
const STORAGE_ADAPT_KEY = 'fivuza-brand-adapt-bg'

interface BrandThemeContextValue {
  brandColor: string | null
  setBrandColor: (hex: string | null) => void
  adaptBackground: boolean
  setAdaptBackground: (value: boolean) => void
  result: BrandThemeResult | null
  reset: () => void
}

export const BrandThemeContext = createContext<BrandThemeContextValue | null>(null)

export function BrandThemeProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  const [brandColor, setBrandColorState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_COLOR_KEY),
  )
  const [adaptBackground, setAdaptBackgroundState] = useState<boolean>(
    () => localStorage.getItem(STORAGE_ADAPT_KEY) !== 'false',
  )

  const result = useMemo(
    () => (brandColor ? deriveBrandTheme(brandColor, theme, adaptBackground) : null),
    [brandColor, theme, adaptBackground],
  )

  useEffect(() => {
    const root = document.documentElement
    if (!result) return
    Object.entries(result.vars).forEach(([key, value]) => root.style.setProperty(key, value))
    return () => {
      Object.keys(result.vars).forEach((key) => root.style.removeProperty(key))
    }
  }, [result])

  const setBrandColor = (hex: string | null) => {
    setBrandColorState(hex)
    if (hex) localStorage.setItem(STORAGE_COLOR_KEY, hex)
    else localStorage.removeItem(STORAGE_COLOR_KEY)
  }

  const setAdaptBackground = (value: boolean) => {
    setAdaptBackgroundState(value)
    localStorage.setItem(STORAGE_ADAPT_KEY, String(value))
  }

  const reset = () => setBrandColor(null)

  return (
    <BrandThemeContext.Provider
      value={{ brandColor, setBrandColor, adaptBackground, setAdaptBackground, result, reset }}
    >
      {children}
    </BrandThemeContext.Provider>
  )
}
