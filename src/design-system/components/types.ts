export type ComponentTokenRecord = Record<string, string>

export interface ComponentTokenRegistry {
  [componentName: string]: ComponentTokenRecord
}
