import { useState } from 'react'

export type ThemeMode = 'light' | 'dark'

const themeStorageKey = 'rashin-portfolio-theme'

function getInitialThemeMode(): ThemeMode {
  try {
    const savedMode = window.localStorage.getItem(themeStorageKey)
    if (savedMode === 'light' || savedMode === 'dark') {
      return savedMode
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useThemeMode() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode)
  const handleThemeModeChange = (mode: ThemeMode) => {
    setThemeMode(mode)

    try {
      window.localStorage.setItem(themeStorageKey, mode)
    } catch {
      // The selected mode still works for this session when storage is unavailable.
    }
  }

  return { themeMode, onThemeModeChange: handleThemeModeChange }
}
