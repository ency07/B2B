'use client'

import { useContext } from 'react'
import { DesignSystemContext } from './ThemeProvider'
import type { ThemeContextValue } from './ThemeProvider'

export function useDesignSystem(): ThemeContextValue {
  const ctx = useContext(DesignSystemContext)
  if (!ctx) {
    throw new Error(
      'useDesignSystem must be used within a DesignSystemProvider',
    )
  }
  return ctx
}
