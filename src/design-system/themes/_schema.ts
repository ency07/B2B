import type {
  SurfaceTokens, TextTokens, BorderTokens, IconTokens,
  ChartTokens, StatusTokens, ActionTokens, SpecialTokens,
} from '../types'

export interface Theme {
  id: string
  name: string
  mode: 'light' | 'dark'
  surface: SurfaceTokens
  text: TextTokens
  border: BorderTokens
  icon: IconTokens
  chart: ChartTokens
  status: StatusTokens
  action: ActionTokens
  special: SpecialTokens
}
