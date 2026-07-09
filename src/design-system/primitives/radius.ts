import type { RadiusValues } from '../types'

export const radius = {
  0: '0px',
  2: '2px',
  4: '4px',
  6: '6px',
  8: '8px',
  12: '12px',
  16: '16px',
  20: '20px',
  24: '24px',
  999: '9999px',
} as const satisfies RadiusValues
