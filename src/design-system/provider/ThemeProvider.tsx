'use client'

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { themes, themeMap, getThemeById } from '../themes'
import type { Theme } from '../themes'
import { componentTokenRegistry } from '../components'
import { flattenAllThemeToCSS } from '../utils'
import { resolveToken, resolveSemanticToken } from '../utils/resolve-token'
import type { TokenPath } from '../utils/resolve-token'

export interface ThemeContextValue {
  theme: Theme
  themes: Theme[]
  setTheme: (id: string) => void
  setMode: (mode: 'light' | 'dark') => void
  setOverrides: (vars: Record<string, string>) => void
  clearOverrides: () => void
  resolved: (path: TokenPath) => string
  resolve: (category: keyof Theme, key: string) => string
  componentToken: (component: string, token: string) => string
  cssVars: Record<string, string>
}

export const DesignSystemContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'ds-theme-id'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return themes[0]
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && themeMap[stored]) return themeMap[stored]
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (prefersDark) return themes.find((t) => t.id === 'carbon') ?? themes[0]
  return themes[0]
}

interface DesignSystemProviderProps {
  children: ReactNode
  initialThemeId?: string
}

export function DesignSystemProvider({
  children,
  initialThemeId,
}: DesignSystemProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (initialThemeId && themeMap[initialThemeId]) {
      return themeMap[initialThemeId]
    }
    return getInitialTheme()
  })
  const [overrides, setOverridesState] = useState<Record<string, string>>({})

  const setTheme = useCallback((id: string) => {
    const next = getThemeById(id)
    if (!next) return
    setThemeState(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, id)
    }
  }, [])

  const setMode = useCallback((mode: 'light' | 'dark') => {
    const candidates = themes.filter((t) => t.mode === mode)
    if (candidates.length === 0) return
    const current = theme
    const sameFamily = candidates.find(
      (t) => t.id.replace(/-(light|dark)$/, '') === current.id.replace(/-(light|dark)$/, ''),
    )
    setThemeState(sameFamily ?? candidates[0])
  }, [theme])

  const setOverrides = useCallback((vars: Record<string, string>) => {
    setOverridesState(vars)
  }, [])

  const clearOverrides = useCallback(() => {
    setOverridesState({})
  }, [])

  const cssVars = useMemo(() => flattenAllThemeToCSS(theme), [theme])

  const mergedCssVars = useMemo(() => {
    if (Object.keys(overrides).length === 0) return cssVars
    return { ...cssVars, ...overrides }
  }, [cssVars, overrides])

  useEffect(() => {
    const root = document.documentElement
    for (const [name, value] of Object.entries(mergedCssVars)) {
      root.style.setProperty(name, value)
    }

    if (theme.mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    return () => {
      for (const name of Object.keys(mergedCssVars)) {
        root.style.removeProperty(name)
      }
    }
  }, [mergedCssVars, theme.mode])

  const resolved = useCallback(
    (path: TokenPath) => resolveToken(theme, path),
    [theme],
  )

  const resolve = useCallback(
    (category: keyof Theme, key: string) =>
      resolveSemanticToken(theme, category, key),
    [theme],
  )

  const componentToken = useCallback(
    (component: string, token: string): string => {
      const compTokens = componentTokenRegistry[component]
      if (!compTokens) return token
      const semanticPath = compTokens[token]
      if (!semanticPath) return token
      if (semanticPath === 'transparent') return 'transparent'
      const [category, ...keyParts] = semanticPath.split('.')
      const key = keyParts.join('.')
      if (category && key) {
        return resolveSemanticToken(theme, category as keyof Theme, key)
      }
      return semanticPath
    },
    [theme],
  )

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themes: [...themes],
      setTheme,
      setMode,
      setOverrides,
      clearOverrides,
      resolved,
      resolve,
      componentToken,
      cssVars: mergedCssVars,
    }),
    [theme, setTheme, setMode, setOverrides, clearOverrides, resolved, resolve, componentToken, mergedCssVars],
  )

  return (
    <DesignSystemContext.Provider value={value}>
      {children}
    </DesignSystemContext.Provider>
  )
}
