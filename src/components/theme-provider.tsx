import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeProviderContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  systemTheme: 'dark' | 'light'
}

interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

const ThemeProviderContext = createContext<ThemeProviderContextValue | undefined>(undefined)

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setThemeState(savedTheme)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const effectiveTheme = theme === 'system' ? systemTheme : theme

    if (disableTransitionOnChange) {
      const css = document.createElement('style')
      css.type = 'text/css'
      css.appendChild(document.createTextNode(
        '*{transition:none!important;animation-duration:0s!important;animation-delay:0s!important;}'
      ))
      document.head.appendChild(css)

      setTimeout(() => {
        document.head.removeChild(css)
      }, 1)
    }

    if (attribute === 'class') {
      root.classList.remove('light', 'dark')
      root.classList.add(effectiveTheme)
    } else if (attribute === 'data-theme') {
      root.setAttribute('data-theme', effectiveTheme)
    }
  }, [theme, systemTheme, attribute, disableTransitionOnChange])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, systemTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}