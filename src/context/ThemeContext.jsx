import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Colour theming.
 *
 * Themes are pure CSS custom property overrides on <html data-theme> and
 * <html data-surface> (see index.css). Because every Tailwind brand/ink
 * utility compiles to var(--color-*), swapping the attribute recolours the
 * whole interface instantly - no re-render, no per-component wiring.
 */

export const THEMES = [
  { id: 'indigo', name: 'Indigo', colors: ['#6366f1', '#a855f7'] },
  { id: 'violet', name: 'Violet', colors: ['#8b5cf6', '#ec4899'] },
  { id: 'ocean', name: 'Ocean', colors: ['#0ea5e9', '#06b6d4'] },
  { id: 'emerald', name: 'Emerald', colors: ['#10b981', '#0ea5e9'] },
  { id: 'amber', name: 'Amber', colors: ['#f59e0b', '#f97316'] },
  { id: 'rose', name: 'Rose', colors: ['#f43f5e', '#e879f9'] },
  { id: 'teal', name: 'Teal', colors: ['#14b8a6', '#0ea5e9'] },
]

export const SURFACES = [
  { id: 'midnight', name: 'Midnight', color: '#070a16' },
  { id: 'slate', name: 'Slate', color: '#020617' },
  { id: 'carbon', name: 'Carbon', color: '#09090b' },
]

const THEME_KEY = 'vsl-studio.admin.theme'
const SURFACE_KEY = 'vsl-studio.admin.surface'
const DEFAULT_THEME = 'teal'
const DEFAULT_SURFACE = 'midnight'

const ThemeContext = createContext(null)

function read(key, fallback, allowed) {
  try {
    const stored = localStorage.getItem(key)
    return stored && allowed.some((item) => item.id === stored) ? stored : fallback
  } catch {
    return fallback
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => read(THEME_KEY, DEFAULT_THEME, THEMES))
  const [surface, setSurfaceState] = useState(() => read(SURFACE_KEY, DEFAULT_SURFACE, SURFACES))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    // "midnight" is the baseline defined in @theme - no attribute needed.
    if (surface === DEFAULT_SURFACE) delete document.documentElement.dataset.surface
    else document.documentElement.dataset.surface = surface
  }, [surface])

  const setTheme = useCallback((next) => {
    setThemeState(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      /* private mode - the theme simply will not persist */
    }
  }, [])

  const setSurface = useCallback((next) => {
    setSurfaceState(next)
    try {
      localStorage.setItem(SURFACE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, surface, setSurface, themes: THEMES, surfaces: SURFACES }),
    [theme, setTheme, surface, setSurface],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>')
  return context
}
