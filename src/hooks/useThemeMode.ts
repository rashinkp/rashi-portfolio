import { useCallback, useLayoutEffect, useState, useSyncExternalStore } from 'react'

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
  useLayoutEffect(() => {
    // During hydration preferredMode is still the static light snapshot.
    // Keep the pre-paint preference in place until the browser snapshot updates.
    const mode = selectedMode ?? getInitialThemeMode()
    const root = document.documentElement
    root.dataset.colorMode = mode
    root.dataset.theme = mode
    root.classList.toggle('scheme-dark', mode === 'dark')
    root.classList.toggle('scheme-light', mode === 'light')
  }, [preferredMode, selectedMode])
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
