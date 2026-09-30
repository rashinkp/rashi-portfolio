import { useLayoutEffect } from 'react'

// Duration, easing, and movement resolve to the active ASTRYX theme tokens.
export const revealClassName =
  'motion-safe:data-[revealed=false]:opacity-0 motion-safe:data-[revealed=false]:translate-y-4 motion-safe:transition motion-safe:duration-(--duration-medium) ease-out'

export function useRevealOnScroll() {
  useLayoutEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]'),
    )
    const revealAll = () => {
      elements.forEach((element) => {
        element.dataset.revealed = 'true'
      })
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !('IntersectionObserver' in window)) {
      revealAll()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement
            element.dataset.revealed = 'true'
            observer.unobserve(element)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0% 0% -8% 0%' },
    )

    elements.forEach((element) => {
      element.dataset.revealed = 'false'
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
      revealAll()
    }
  }, [])
}
