import { useLayoutEffect } from 'react'

// Fresh shared links can target a section; reloads start a new visit at the top.
export function useInitialAnchor() {
  useLayoutEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const reloaded = navigation?.type === 'reload'
    const previousRestoration = history.scrollRestoration
    if (reloaded) {
      history.scrollRestoration = 'manual'
      history.replaceState(history.state, '', location.pathname + location.search)
    }
    const restore = () => {
      if (!window.location.hash) return
      try {
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
        target?.scrollIntoView({ behavior: 'instant', block: 'start' })
      } catch {
        // Ignore malformed fragment URLs.
      }
    }
    const initialize = () => {
      if (!reloaded) { restore(); return }
      document.querySelector('[data-portfolio-scroll]')?.scrollTo({ top: 0, behavior: 'instant' })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    initialize()
    const frame = requestAnimationFrame(initialize)
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) initialize()
    }
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('hashchange', restore)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('hashchange', restore)
      history.scrollRestoration = previousRestoration
    }
  }, [])
}
