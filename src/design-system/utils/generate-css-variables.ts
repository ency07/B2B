import type { Theme } from '../themes'
import { componentTokenRegistry } from '../components'
import { resolvePrimitiveColor, resolveSemanticToken } from './resolve-token'

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

function kebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

export function flattenThemeToCSS(theme: Theme): CSSVariables {
  const vars: CSSVariables = {}

  for (const [category, tokens] of Object.entries(theme)) {
    if (!TOKEN_CATEGORIES.has(category)) continue
    if (typeof tokens !== 'object' || tokens === null) continue

    const prefix = CATEGORY_PREFIX[category] ?? `ds-${category}`
    const tokenMap = tokens as Record<string, string>

    for (const [key, ref] of Object.entries(tokenMap)) {
      if (typeof ref !== 'string') continue
      const varName = `--${prefix}-${kebabCase(key)}`
      vars[varName] = resolvePrimitiveColor(ref)
    }
  }

  return vars
}

export function flattenComponentTokensToCSS(theme: Theme): CSSVariables {
  const vars: CSSVariables = {}

  for (const [componentName, tokens] of Object.entries(componentTokenRegistry)) {
    for (const [tokenKey, semanticPath] of Object.entries(tokens)) {
      const [category, ...keyParts] = semanticPath.split('.')
      const key = keyParts.join('.')

      let resolved: string
      if (semanticPath === 'transparent') {
        resolved = 'transparent'
      } else if (category && key) {
        resolved = resolveSemanticToken(theme, category as keyof Theme, key)
      } else {
        resolved = semanticPath
      }

      const varName = `--ds-c-${kebabCase(componentName)}-${kebabCase(tokenKey)}`
      vars[varName] = resolved
    }
  }

  return vars
}

export function generateBridgeCSS(theme: Theme): CSSVariables {
  const bridge: [string, string][] = [
    ['--background', 'surface.background'],
    ['--foreground', 'text.primary'],
    ['--card', 'surface.card'],
    ['--card-foreground', 'text.primary'],
    ['--popover', 'surface.card'],
    ['--popover-foreground', 'text.primary'],
    ['--primary', 'action.primary'],
    ['--primary-foreground', 'text.inverse'],
    ['--secondary', 'action.secondary'],
    ['--secondary-foreground', 'text.primary'],
    ['--muted', 'surface.hover'],
    ['--muted-foreground', 'text.muted'],
    ['--accent', 'surface.hover'],
    ['--accent-foreground', 'text.primary'],
    ['--destructive', 'action.danger'],
    ['--destructive-foreground', 'text.inverse'],
    ['--success', 'status.success'],
    ['--success-foreground', 'text.inverse'],
    ['--warning', 'status.warning'],
    ['--warning-foreground', 'text.inverse'],
    ['--border', 'border.default'],
    ['--input', 'border.default'],
    ['--ring', 'special.focusRing'],
    ['--state-success-fg', 'status.success'],
    ['--state-success-bg', 'status.successBg'],
    ['--state-success-border', 'status.successBorder'],
    ['--state-warning-fg', 'status.warning'],
    ['--state-warning-bg', 'status.warningBg'],
    ['--state-warning-border', 'status.warningBorder'],
    ['--state-danger-fg', 'status.error'],
    ['--state-danger-bg', 'status.errorBg'],
    ['--state-danger-border', 'status.errorBorder'],
    ['--state-info-fg', 'status.info'],
    ['--state-info-bg', 'status.infoBg'],
    ['--state-info-border', 'status.infoBorder'],
    ['--state-neutral-fg', 'status.neutralFg'],
    ['--state-neutral-bg', 'status.neutralBg'],
    ['--state-neutral-border', 'status.neutralBorder'],
  ]

  const vars: CSSVariables = {}
  for (const [cssVar, semanticPath] of bridge) {
    const [category, ...keyParts] = semanticPath.split('.')
    const key = keyParts.join('.')
    if (category && key) {
      vars[cssVar] = resolveSemanticToken(theme, category as keyof Theme, key)
    }
  }
  return vars
}

export function flattenAllThemeToCSS(theme: Theme): CSSVariables {
  return {
    ...flattenThemeToCSS(theme),
    ...flattenComponentTokensToCSS(theme),
    ...generateBridgeCSS(theme),
  }
}

export function generateThemeCSS(theme: Theme): string {
  const vars = flattenAllThemeToCSS(theme)
  const selector = theme.mode === 'dark' ? '.dark' : ':root'
  const declarations = Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')

  return `${selector} {\n${declarations}\n}`
}

export function generateThemeStyleTag(theme: Theme): string {
  return `<style id="ds-theme-vars">${generateThemeCSS(theme)}</style>`
}
