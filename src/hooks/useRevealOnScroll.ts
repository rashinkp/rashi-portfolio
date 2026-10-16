import { useLayoutEffect } from 'react'
import { animate, type AnimationPlaybackControls } from 'motion/react'
import { durationToken } from '../lib/motion'

export const revealClassName = 'motion-reduce:transform-none'

export function useRevealOnScroll() {
  useLayoutEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    const animations = new Map<HTMLElement, AnimationPlaybackControls>()
    const cleanupFrames = new Set<number>()
    // Keep headings inside their own gap while they enter above nearby tiles.
    const revealDistance = (element: HTMLElement) => {
      const heading = element.dataset.reveal === 'heading' || element.dataset.reveal === 'toolkit-heading'
      return parseFloat(getComputedStyle(element).getPropertyValue(heading ? '--spacing-2' : '--spacing-10')) || 0
    }
    let observer: IntersectionObserver | undefined
    const finish = (element: HTMLElement) => {
      const animation = animations.get(element)
      animations.delete(element)
      animation?.stop()
      element.style.removeProperty('opacity')
      element.style.removeProperty('transform')
      // A focus jump can stop an entrance with a Motion render still queued.
      // Clear that last frame too, so focused project cards stay fully visible.
      if (animation) {
        const frame = requestAnimationFrame(() => {
          element.style.removeProperty('opacity')
          element.style.removeProperty('transform')
          cleanupFrames.delete(frame)
        })
        cleanupFrames.add(frame)
      }
      observer?.unobserve(element)
    }
    const finishAll = () => elements.forEach(finish)
    if (preference.matches || !window.IntersectionObserver) { finishAll(); return }
    observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
      visible.forEach((entry, index) => {
        const element = entry.target as HTMLElement
        observer?.unobserve(element)
        const distance = revealDistance(element)
        const animation = animate(element, {
          opacity: [0, 1], y: [Number.isFinite(distance) ? distance : 0, 0],
        }, {
          type: 'spring', stiffness: 120, damping: 24, mass: 1,
          delay: index * durationToken(element, '--duration-fast-min', 0.13),
          onComplete: () => finish(element),
        })
        animations.set(element, animation)
      })
    }, { rootMargin: '0% 0% -4% 0%', threshold: 0.15 })
    elements.forEach(element => {
      const box = element.getBoundingClientRect()
      if (box.top < innerHeight && box.bottom > 0) finish(element)
      else {
        const distance = revealDistance(element)
        // Stage offscreen blocks before observing, so the entrance is visible.
        element.style.opacity = '0'
        element.style.transform = `translateY(${Number.isFinite(distance) ? distance : 0}px)`
        observer?.observe(element)
      }
    })
    const onPreference = () => { if (preference.matches) { observer?.disconnect(); finishAll() } }
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element) elements.filter(element => element.contains(event.target as Element)).forEach(finish)
    }
    preference.addEventListener('change', onPreference)
    document.addEventListener('focusin', onFocus)
    return () => {
      observer?.disconnect()
      finishAll()
      cleanupFrames.forEach(cancelAnimationFrame)
      preference.removeEventListener('change', onPreference)
      document.removeEventListener('focusin', onFocus)
    }
  }, [])
}
