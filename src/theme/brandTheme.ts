// Deriva un tema completo a partir de UN color de marca + una base neutra fija.
// Idea: los neutros y el semaforo (success/warning/danger) NUNCA los toca el
// negocio -eso es lo que mantiene el sistema "bonito" sin importar que color
// elijan-, solo el rol `primary` (accion/marca) se deriva de su input.
// El fondo puede opcionalmente "adaptarse" mezclando un poco del color de
// marca en los neutros (ver mixHex mas abajo), sin perder jerarquia.

import { clamp, contrastRatio, hexToRgb, hexToRgba, bestTextOn, rgbToHsl, hslToRgb, rgbToHex, mixHex } from './colorMath'

export type BaseScheme = 'dark' | 'light'

const NEUTRALS: Record<BaseScheme, Record<string, string>> = {
  dark: {
    bgApp: '#0f1216',
    bgSurface: '#171b21',
    bgSurfaceSecondary: '#1d232b',
    bgSurfaceHover: '#232a33',
    borderSubtle: '#202730',
    borderDefault: '#303a46',
    textPrimary: '#eef1f4',
    textSecondary: '#9aa5b1',
    textMuted: '#626d79',
  },
  light: {
    bgApp: '#f4f5f7',
    bgSurface: '#ffffff',
    bgSurfaceSecondary: '#e9ecf0',
    bgSurfaceHover: '#eff1f4',
    borderSubtle: '#e2e5e9',
    borderDefault: '#cfd4da',
    textPrimary: '#1c2126',
    textSecondary: '#565f68',
    textMuted: '#8b939b',
  },
}

const SEMAPHORE: Record<BaseScheme, Record<string, string>> = {
  dark: { success: '#3fb27f', warning: '#d9a441', danger: '#d9695f' },
  light: { success: '#227a54', warning: '#a06a13', danger: '#c53030' },
}

// Cuanto del color de marca se mezcla en cada superficie cuando el negocio
// activa "adaptar fondo". Muy bajo y decreciente hacia bg-surface -el fondo
// de pagina puede llevar mas tinte que las cards, si no las cards se
// confunden con el fondo y se pierde la jerarquia (regla de la guia de
// colores: bg-app y bg-surface nunca deben leerse como el mismo tono).
// En claro el ojo detecta tinte con mucha menos cantidad que en oscuro.
const TINT_RATIOS: Record<BaseScheme, { app: number; surface: number; secondary: number; hover: number; border: number }> = {
  dark: { app: 0.09, surface: 0.05, secondary: 0.07, hover: 0.09, border: 0.12 },
  light: { app: 0.05, surface: 0.02, secondary: 0.035, hover: 0.045, border: 0.08 },
}

export interface BrandThemeResult {
  vars: Record<string, string>
  contrast: {
    primaryVsSurface: number
    textOnPrimaryVsPrimary: number
    primaryPassesAA: boolean
    textOnPrimaryPassesAA: boolean
  }
  clampedFrom: string | null
  clampDirection: 'wasTooLight' | 'wasTooDark' | null
}

/** Ajusta el input de marca a un rango de luminosidad usable como boton/link, sin cambiar su tono/saturacion. */
function tameForRole(
  hex: string,
  scheme: BaseScheme,
): { hex: string; wasClamped: boolean; direction: 'wasTooLight' | 'wasTooDark' | null } {
  const hsl = rgbToHsl(hexToRgb(hex))
  const [min, max] = scheme === 'dark' ? [0.4, 0.72] : [0.28, 0.55]
  const l = clamp(hsl.l, min, max)
  const wasClamped = Math.abs(l - hsl.l) > 0.001
  const direction = !wasClamped ? null : hsl.l > l ? 'wasTooLight' : 'wasTooDark'
  const rgb = hslToRgb({ ...hsl, l })
  return { hex: rgbToHex(rgb), wasClamped, direction }
}

export function deriveBrandTheme(
  brandHex: string,
  scheme: BaseScheme,
  adaptBackground: boolean = false,
): BrandThemeResult {
  const neutrals = NEUTRALS[scheme]
  const semaphore = SEMAPHORE[scheme]

  const { hex: primary, wasClamped, direction } = tameForRole(brandHex, scheme)
  const hoverDelta = scheme === 'dark' ? 10 : -10
  const primaryHsl = rgbToHsl(hexToRgb(primary))
  const hoverL = clamp(primaryHsl.l + hoverDelta / 100, 0.12, 0.88)
  const primaryHover = rgbToHex(hslToRgb({ ...primaryHsl, l: hoverL }))

  const textOnPrimary = bestTextOn(hexToRgb(primary))
  const primarySubtleAlpha = scheme === 'dark' ? 0.16 : 0.12

  const t = TINT_RATIOS[scheme]
  const bgApp = adaptBackground ? mixHex(neutrals.bgApp, primary, t.app) : neutrals.bgApp
  const bgSurface = adaptBackground ? mixHex(neutrals.bgSurface, primary, t.surface) : neutrals.bgSurface
  const bgSurfaceSecondary = adaptBackground
    ? mixHex(neutrals.bgSurfaceSecondary, primary, t.secondary)
    : neutrals.bgSurfaceSecondary
  const bgSurfaceHover = adaptBackground ? mixHex(neutrals.bgSurfaceHover, primary, t.hover) : neutrals.bgSurfaceHover
  const borderSubtle = adaptBackground ? mixHex(neutrals.borderSubtle, primary, t.secondary) : neutrals.borderSubtle
  const borderDefault = adaptBackground ? mixHex(neutrals.borderDefault, primary, t.border) : neutrals.borderDefault

  const surfaceRgb = hexToRgb(bgSurface)
  const primaryRgb = hexToRgb(primary)
  const primaryVsSurface = contrastRatio(primaryRgb, surfaceRgb)
  const textOnPrimaryVsPrimary = contrastRatio(textOnPrimary.rgb, primaryRgb)

  const vars: Record<string, string> = {
    '--bg-app': bgApp,
    '--bg-surface': bgSurface,
    '--bg-surface-secondary': bgSurfaceSecondary,
    '--bg-surface-hover': bgSurfaceHover,
    '--border-subtle': borderSubtle,
    '--border-default': borderDefault,
    '--text-primary': neutrals.textPrimary,
    '--text-secondary': neutrals.textSecondary,
    '--text-muted': neutrals.textMuted,
    '--primary': primary,
    '--primary-hover': primaryHover,
    '--primary-subtle-bg': hexToRgba(primary, primarySubtleAlpha),
    '--focus-ring': primaryHover,
    '--text-on-primary': textOnPrimary.hex,
    '--success': semaphore.success,
    '--success-subtle-bg': hexToRgba(semaphore.success, scheme === 'dark' ? 0.14 : 0.12),
    '--warning': semaphore.warning,
    '--warning-subtle-bg': hexToRgba(semaphore.warning, scheme === 'dark' ? 0.14 : 0.12),
    '--danger': semaphore.danger,
    '--danger-subtle-bg': hexToRgba(semaphore.danger, scheme === 'dark' ? 0.14 : 0.12),
  }

  return {
    vars,
    contrast: {
      primaryVsSurface,
      textOnPrimaryVsPrimary,
      primaryPassesAA: primaryVsSurface >= 3,
      textOnPrimaryPassesAA: textOnPrimaryVsPrimary >= 4.5,
    },
    clampDirection: direction,
    clampedFrom: wasClamped ? brandHex : null,
  }
}
