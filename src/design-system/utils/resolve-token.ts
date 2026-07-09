import type { Theme } from '../themes'
import { primitiveColors } from '../primitives'

type HexColor = string

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function parseOpacity(raw: string): number {
  const trimmed = raw.trim()
  if (trimmed.endsWith('%')) {
    return parseFloat(trimmed) / 100
  }
  const num = parseFloat(trimmed)
  return isNaN(num) ? 1 : Math.min(1, Math.max(0, num))
}

export function resolvePrimitiveColor(ref: string): HexColor {
  const hasOpacity = ref.includes('/')
  const [colorRef, opacityRaw] = hasOpacity ? ref.split('/') : [ref, undefined]

  const parts = colorRef.trim().split('.')
  if (parts.length !== 2) return ref

  const [hue, stepStr] = parts
  const step = parseInt(stepStr, 10) as keyof typeof primitiveColors[keyof typeof primitiveColors]

  const scale = primitiveColors[hue as keyof typeof primitiveColors]
  if (!scale) return ref

  const hex = scale[step as keyof typeof scale]
  if (!hex || hasOpacity === false) return hex ?? ref

  const [r, g, b] = hexToRgb(hex)
  const alpha = parseOpacity(opacityRaw!)
  return `rgba(${r},${g},${b},${alpha})`
}

export type TokenPath =
  | `surface.${keyof Theme['surface']}`
  | `text.${keyof Theme['text']}`
  | `border.${keyof Theme['border']}`
  | `icon.${keyof Theme['icon']}`
  | `chart.${keyof Theme['chart']}`
  | `status.${keyof Theme['status']}`
  | `action.${keyof Theme['action']}`
  | `special.${keyof Theme['special']}`

type TokenCategory = 'surface' | 'text' | 'border' | 'icon' | 'chart' | 'status' | 'action' | 'special'

function isTokenCategory(value: unknown): value is TokenCategory {
  return typeof value === 'string' && ['surface', 'text', 'border', 'icon', 'chart', 'status', 'action', 'special'].includes(value)
}

function getTokenValue(tokens: unknown, key: string): string | undefined {
  if (typeof tokens !== 'object' || tokens === null) return undefined
  const map = tokens as Record<string, unknown>
  const value = map[key]
  return typeof value === 'string' ? value : undefined
}

export function resolveToken(theme: Theme, path: TokenPath): string {
  const [category, key] = path.split('.') as [string, string]
  if (!isTokenCategory(category)) return path
  const tokens = theme[category]
  if (!tokens || typeof tokens !== 'object') return path
  const primitiveRef = getTokenValue(tokens, key)
  if (!primitiveRef) return path
  return resolvePrimitiveColor(primitiveRef)
}

export function resolveSemanticToken(theme: Theme, category: keyof Theme, key: string): string {
  if (!isTokenCategory(category)) return String(key)
  const tokens = theme[category]
  if (!tokens || typeof tokens !== 'object') return String(key)
  const ref = getTokenValue(tokens, key)
  if (!ref) return String(key)
  return resolvePrimitiveColor(ref)
}
