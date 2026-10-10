import { useLayoutEffect } from 'react'

// React renders anchor targets after the browser's first fragment lookup.
export function useInitialAnchor() {
  useLayoutEffect(() => {
    const restore = () => {
      if (!window.location.hash) return
      try {
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
        target?.scrollIntoView({ behavior: 'instant', block: 'start' })
      } catch {
        // Ignore malformed fragment URLs.
      }
    }
    const frame = requestAnimationFrame(restore)
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) restore()
    }
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('hashchange', restore)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('hashchange', restore)
    }
  }, [])
}
