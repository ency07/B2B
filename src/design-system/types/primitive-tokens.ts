export type ColorStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
export type ColorHue = 'blue' | 'gray' | 'green' | 'orange' | 'yellow' | 'red' | 'purple' | 'cyan' | 'teal' | 'pink'
export type ColorScale = Record<ColorStep, string>
export type PrimitiveColors = Record<ColorHue, ColorScale>

export type SpacingToken = 2 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64 | 80 | 96 | 128
export type SpacingValues = Record<SpacingToken, string>

export type RadiusToken = 0 | 2 | 4 | 6 | 8 | 12 | 16 | 20 | 24 | 999
export type RadiusValues = Record<RadiusToken, string>

export type ElevationLevel = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type ElevationValues = Record<ElevationLevel, string>

export type BlurLevel = 'xs' | 'sm' | 'md' | 'lg'
export type BlurValues = Record<BlurLevel, string>

export interface TypographyValues {
  fontFamily: {
    sans: string
    display: string
    mono: string
  }
  fontWeight: {
    normal: number
    medium: number
    semibold: number
    bold: number
  }
  lineHeight: {
    tight: number
    normal: number
    relaxed: number
  }
  letterSpacing: {
    tight: string
    normal: string
    wide: string
  }
}

export interface AnimationValues {
  duration: {
    fast: number
    normal: number
    slow: number
  }
  spring: {
    stiffness: number
    damping: number
    mass: number
  }
}
