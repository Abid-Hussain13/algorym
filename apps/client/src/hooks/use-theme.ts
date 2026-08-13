import { useEffect } from 'react'

import { selectTheme, setTheme, toggleTheme } from '@/stores/theme-slice'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'

/** Applies the current theme to <html data-theme="..."> on mount and persists it. */
export function useTheme() {
  const dispatch = useAppDispatch()
  const theme = useAppSelector(selectTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('algorym-theme', theme)
    } catch {
      /* noop */
    }
  }, [theme])

  return {
    theme,
    setTheme: (next: typeof theme) => dispatch(setTheme(next)),
    toggle: () => dispatch(toggleTheme()),
  }
}