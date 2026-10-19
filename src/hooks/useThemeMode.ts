import { useCallback, useState, useSyncExternalStore } from 'react'

export type ThemeMode = 'light' | 'dark'

const themeStorageKey = 'rashin-portfolio-theme'

function subscribe(onChange: () => void) {
  const preference = window.matchMedia('(prefers-color-scheme: dark)')
  preference.addEventListener('change', onChange)
  window.addEventListener('storage', onChange)
  return () => {
    preference.removeEventListener('change', onChange)
    window.removeEventListener('storage', onChange)
  }
}

const serverThemeMode = (): ThemeMode => 'light'

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
  // Match the static page during hydration, then read browser preferences.
  const preferredMode = useSyncExternalStore(subscribe, getInitialThemeMode, serverThemeMode)
  const [selectedMode, setThemeMode] = useState<ThemeMode | null>(null)
  const themeMode = selectedMode ?? preferredMode
  const handleThemeModeChange = useCallback((mode: ThemeMode) => {
    setThemeMode(mode)

    try {
      window.localStorage.setItem(themeStorageKey, mode)
    } catch {
      // The selected mode still works for this session when storage is unavailable.
    }
  }, [])

  return { themeMode, onThemeModeChange: handleThemeModeChange }
}
