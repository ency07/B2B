export type { Theme } from './_schema'

export { minimalWhite } from './light/minimal-white'
export { modernBlue } from './light/modern-blue'
export { corporateEmerald } from './light/corporate-emerald'
export { executivePurple } from './light/executive-purple'
export { carbon } from './dark/carbon'
export { graphite } from './dark/graphite'
export { midnightBlue } from './dark/midnight-blue'
export { neoEmerald } from './dark/neo-emerald'

import type { Theme } from './_schema'
import { minimalWhite } from './light/minimal-white'
import { modernBlue } from './light/modern-blue'
import { corporateEmerald } from './light/corporate-emerald'
import { executivePurple } from './light/executive-purple'
import { carbon } from './dark/carbon'
import { graphite } from './dark/graphite'
import { midnightBlue } from './dark/midnight-blue'
import { neoEmerald } from './dark/neo-emerald'

export const themes: Theme[] = [
  minimalWhite,
  modernBlue,
  corporateEmerald,
  executivePurple,
  carbon,
  graphite,
  midnightBlue,
  neoEmerald,
]

export const themeMap: Record<string, Theme> = Object.fromEntries(
  themes.map((t) => [t.id, t]),
)

export function getThemeById(id: string): Theme | undefined {
  return themeMap[id]
}

export function getThemesByMode(mode: 'light' | 'dark'): Theme[] {
  return themes.filter((t) => t.mode === mode)
}
