import type {
  SurfaceTokens, TextTokens, BorderTokens, IconTokens,
  ChartTokens, StatusTokens, ActionTokens, SpecialTokens,
} from './semantic-tokens'

export interface ThemeSemantics {
  surface: SurfaceTokens
  text: TextTokens
  border: BorderTokens
  icon: IconTokens
  chart: ChartTokens
  status: StatusTokens
  action: ActionTokens
  special: SpecialTokens
}

export type TokenKey = string
export type ComponentTokenResolver = (semantics: ThemeSemantics) => Record<string, TokenKey>
