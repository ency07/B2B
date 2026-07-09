import type { ComponentTokenRecord } from './types'

export const buttonTokens: ComponentTokenRecord = {
  background: 'action.primary',
  foreground: 'text.inverse',
  hoverBackground: 'action.hover',
  pressedBackground: 'action.pressed',
  disabledBackground: 'surface.disabled',
  disabledForeground: 'text.disabled',
  focusRing: 'special.focusRing',

  destructiveBackground: 'action.danger',
  destructiveForeground: 'text.inverse',

  outlineBorder: 'border.default',
  outlineBackground: 'surface.card',
  outlineForeground: 'text.primary',

  secondaryBackground: 'action.secondary',
  secondaryForeground: 'text.primary',

  ghostHoverBackground: 'surface.hover',
  ghostForeground: 'text.primary',

  linkForeground: 'text.link',
}
