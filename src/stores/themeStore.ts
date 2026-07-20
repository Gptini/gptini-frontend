import { create } from 'zustand'

export type Theme = 'default' | 'gray'

const STORAGE_KEY = 'theme'

function applyTheme(theme: Theme) {
  if (theme === 'default') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'gray' ? 'gray' : 'default'
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialTheme = getInitialTheme()
applyTheme(initialTheme)

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,

  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme)
    applyTheme(theme)
    set({ theme })
  },
}))

export default useThemeStore
