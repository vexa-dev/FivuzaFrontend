// Utilidades de color para el prototipo de "tema de marca por negocio"
// (BrandThemeLab). Puramente funcional, sin dependencias externas.

export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number
  s: number
  l: number
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const num = parseInt(full, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0)
      break
    case gn:
      h = (bn - rn) / d + 2
      break
    default:
      h = (rn - gn) / d + 4
  }
  return { h: h * 60, s, l }
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  if (s === 0) {
    const v = l * 255
    return { r: v, g: v, b: v }
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hn = h / 360
  return {
    r: hue2rgb(p, q, hn + 1 / 3) * 255,
    g: hue2rgb(p, q, hn) * 255,
    b: hue2rgb(p, q, hn - 1 / 3) * 255,
  }
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function srgbToLinear(c: number): number {
  const cs = c / 255
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)
}

export function relativeLuminance({ r, g, b }: RGB): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Blanco o casi-negro segun cual de los dos de mas contraste contra el fondo dado. */
export function bestTextOn(bg: RGB): { hex: string; rgb: RGB } {
  const white: RGB = { r: 255, g: 255, b: 255 }
  const near_black: RGB = { r: 17, g: 20, b: 24 }
  const cw = contrastRatio(bg, white)
  const cb = contrastRatio(bg, near_black)
  return cw >= cb ? { hex: '#ffffff', rgb: white } : { hex: '#111418', rgb: near_black }
}

export function withLightness(hex: string, l: number): string {
  const hsl = rgbToHsl(hexToRgb(hex))
  return rgbToHex(hslToRgb({ ...hsl, l: clamp(l, 0, 1) }))
}

export function shiftLightness(hex: string, deltaPercent: number): string {
  const hsl = rgbToHsl(hexToRgb(hex))
  return withLightness(hex, hsl.l + deltaPercent / 100)
}

/** Mezcla lineal base<-brand en proporcion `ratio` (0 = solo base, 1 = solo brand). */
export function mixHex(baseHex: string, brandHex: string, ratio: number): string {
  const base = hexToRgb(baseHex)
  const brand = hexToRgb(brandHex)
  const t = clamp(ratio, 0, 1)
  return rgbToHex({
    r: base.r + (brand.r - base.r) * t,
    g: base.g + (brand.g - base.g) * t,
    b: base.b + (brand.b - base.b) * t,
  })
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`
}
