import { primitiveColors } from '../primitives'
import type { Theme } from '../themes'
import { resolveSemanticToken } from './resolve-token'

function hexToLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255

  const toSRGB = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)

  return 0.2126 * toSRGB(r) + 0.7152 * toSRGB(g) + 0.0722 * toSRGB(b)
}

export function contrastRatio(foreground: string, background: string): number {
  const l1 = hexToLuminance(foreground)
  const l2 = hexToLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function meetsAA(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= 4.5
}

export function meetsAAA(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= 7
}

export function meetsAALarge(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= 3
}

export function validateThemeContrast(theme: Theme): Array<{
  pair: string
  ratio: number
  aa: boolean
  aaa: boolean
}> {
  const results: Array<{ pair: string; ratio: number; aa: boolean; aaa: boolean }> = []
  const textKeys = ['primary', 'secondary', 'muted'] as const

  for (const key of textKeys) {
    const foreground = resolveSemanticToken(theme, 'text', key)
    const background = resolveSemanticToken(theme, 'surface', 'background')
    const ratio = contrastRatio(foreground, background)
    results.push({
      pair: `text.${key} on surface.background`,
      ratio: Math.round(ratio * 100) / 100,
      aa: meetsAA(foreground, background),
      aaa: meetsAAA(foreground, background),
    })
  }

  return results
}
