import type { Theme } from '../themes'
import { resolvePrimitiveColor } from './resolve-token'

export type CSSVariables = Record<string, string>

const CATEGORY_PREFIX: Record<string, string> = {
  surface: 'ds-surface',
  text: 'ds-text',
  border: 'ds-border',
  icon: 'ds-icon',
  chart: 'ds-chart',
  status: 'ds-status',
  action: 'ds-action',
  special: 'ds-special',
}

const TOKEN_CATEGORIES = new Set(['surface', 'text', 'border', 'icon', 'chart', 'status', 'action', 'special'])

export function flattenThemeToCSS(theme: Theme): CSSVariables {
  const vars: CSSVariables = {}

  for (const [category, tokens] of Object.entries(theme)) {
    if (!TOKEN_CATEGORIES.has(category)) continue
    if (typeof tokens !== 'object' || tokens === null) continue

    const prefix = CATEGORY_PREFIX[category] ?? `ds-${category}`
    const tokenMap = tokens as Record<string, string>

    for (const [key, ref] of Object.entries(tokenMap)) {
      if (typeof ref !== 'string') continue
      const varName = `--${prefix}-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      vars[varName] = resolvePrimitiveColor(ref)
    }
  }

  return vars
}

export function generateThemeCSS(theme: Theme): string {
  const vars = flattenThemeToCSS(theme)
  const selector = theme.mode === 'dark' ? '.dark' : ':root'
  const declarations = Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')

  return `${selector} {\n${declarations}\n}`
}

export function generateThemeStyleTag(theme: Theme): string {
  return `<style id="ds-theme-vars">${generateThemeCSS(theme)}</style>`
}
