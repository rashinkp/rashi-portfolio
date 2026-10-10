import { useLayoutEffect } from 'react'

// The hero stays readable from the first frame; only its supporting card moves.
export function useHeroEntrance() {
  useLayoutEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (preference.matches || !Element.prototype.animate) return
    const element = document.querySelector<HTMLElement>('[data-reveal="hero-card"]')
    if (!element) return
    const tokens = getComputedStyle(element)
    const value = tokens.getPropertyValue('--duration-medium-max').trim()
    const duration = parseFloat(value) * (value.endsWith('ms') ? 1 : 1000)
    if (!Number.isFinite(duration)) return
    const animation = element.animate([
      { transform: 'translateY(var(--spacing-4))' },
      { transform: 'translateY(0)' },
    ], { duration, easing: tokens.getPropertyValue('--ease-standard').trim() })
    const finish = () => animation.cancel()
    const onPreference = () => { if (preference.matches) finish() }
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && element.contains(event.target)) finish()
    }
    preference.addEventListener('change', onPreference)
    document.addEventListener('focusin', onFocus)
    return () => {
      finish()
      preference.removeEventListener('change', onPreference)
      document.removeEventListener('focusin', onFocus)
    }
  }, [])
}
