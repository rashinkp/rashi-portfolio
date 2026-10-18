import { useEffect } from 'react'
import { animate, type AnimationPlaybackControls } from 'motion/react'
import { durationToken } from '../lib/motion'

// Keep native fragment URLs/history, but ease long section jumps. Manual input
// always wins, so a user never has to fight an in-flight scroll animation.
export function useSmoothAnchors() {
  useEffect(() => {
    let animation: AnimationPlaybackControls | undefined
    const cancel = () => { animation?.stop(); animation = undefined }
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]')
      if (!link || link.target === '_blank') return
      let target: HTMLElement | null
      try { target = document.getElementById(decodeURIComponent(link.hash.slice(1))) } catch { return }
      if (!target) return
      event.preventDefault()
      cancel()
      // Content scrolls in a full-height viewport behind the floating dock.
      const scroller = document.querySelector<HTMLElement>('[data-portfolio-scroll="true"]')
      const current = scroller ? scroller.scrollTop : scrollY
      const origin = scroller ? scroller.getBoundingClientRect().top : 0
      const maximum = scroller ? scroller.scrollHeight - scroller.clientHeight : document.documentElement.scrollHeight - innerHeight
      const destination = Math.max(0, Math.min(target.getBoundingClientRect().top - origin + current, maximum))
      const scrollTo = (top: number) => (scroller ?? window).scrollTo({ top, behavior: 'instant' })
      if (location.hash !== link.hash) history.pushState(null, '', link.hash)
      if (preference.matches) scrollTo(destination)
      else animation = animate(current, destination, {
        duration: durationToken(document.documentElement, '--duration-slow-max', 1.3),
        ease: [0.24, 1, 0.4, 1],
        onUpdate: scrollTo,
        onComplete: () => { animation = undefined },
      })
      // Make keyboard navigation continue from the destination, without jumping.
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1')
        target.classList.add('focus:outline-none')
      }
      target.focus({ preventScroll: true })
    }
    const onKey = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Escape', ' '].includes(event.key)) cancel()
    }
    document.addEventListener('click', onClick)
    window.addEventListener('wheel', cancel, { passive: true })
    window.addEventListener('touchstart', cancel, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('popstate', cancel)
    preference.addEventListener('change', cancel)
    return () => {
      cancel()
      document.removeEventListener('click', onClick)
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchstart', cancel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('popstate', cancel)
      preference.removeEventListener('change', cancel)
    }
  }, [])
}
