import type { AnimationValues } from '../types'

export const animation = {
  duration: {
    fast: 120,
    normal: 180,
    slow: 240,
  },
  spring: {
    stiffness: 300,
    damping: 30,
    mass: 1,
  },
} as const satisfies AnimationValues
