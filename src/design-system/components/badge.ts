import type { ComponentTokenRecord } from './types'

export const badgeTokens: ComponentTokenRecord = {
  background: 'status.info',
  foreground: 'text.inverse',
  border: 'border.default',

  successBackground: 'status.success',
  successForeground: 'text.inverse',

  warningBackground: 'status.warning',
  warningForeground: 'text.inverse',

  errorBackground: 'status.error',
  errorForeground: 'text.inverse',

  neutralBackground: 'surface.hover',
  neutralForeground: 'text.primary',
}
