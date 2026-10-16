import { useLayoutEffect } from 'react'
import { animate, type AnimationPlaybackControls } from 'motion/react'
import { durationToken } from '../lib/motion'

export const revealClassName = 'motion-reduce:transform-none'

export function useRevealOnScroll() {
  useLayoutEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const elements = new Set<HTMLElement>()
    const visible = new Set<HTMLElement>()
    const animations = new Map<HTMLElement, AnimationPlaybackControls>()
    const cleanupFrames = new Map<HTMLElement, number>()
    const root = document.querySelector<HTMLElement>('[data-portfolio-scroll]')
    const inViewport = (element: HTMLElement) => {
      const box = element.getBoundingClientRect()
      const viewport = root?.getBoundingClientRect()
      const transform = getComputedStyle(element).transform
      const y = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42
      return box.top - y < (viewport?.bottom ?? innerHeight) && box.bottom - y > (viewport?.top ?? 0)
    }
    // Keep headings inside their own gap while they enter above nearby tiles.
    const revealDistance = (element: HTMLElement) => {
      const heading = element.dataset.reveal === 'heading' || element.dataset.reveal === 'toolkit-heading'
      return parseFloat(getComputedStyle(element).getPropertyValue(heading ? '--spacing-2' : '--spacing-10')) || 0
    }
    const finish = (element: HTMLElement) => {
      const pending = cleanupFrames.get(element)
      if (pending !== undefined) cancelAnimationFrame(pending)
      cleanupFrames.delete(element)
      const animation = animations.get(element)
      animations.delete(element)
      animation?.stop()
      element.style.removeProperty('opacity')
      element.style.removeProperty('transform')
      if (animation) {
        // Motion can still flush its last render after stop(). Apply the
        // current visibility again unless a new entrance has already started.
        cleanupFrames.set(element, requestAnimationFrame(() => {
          cleanupFrames.delete(element)
          if (animations.has(element)) return
          element.style.removeProperty('transform')
          if (preference.matches || visible.has(element)) element.style.removeProperty('opacity')
          else element.style.opacity = '0'
        }))
      }
    }
    const finishAll = () => elements.forEach(finish)
    if (!window.IntersectionObserver) return
    const stage = (element: HTMLElement) => {
      finish(element)
      visible.delete(element)
      // Reset only opacity offscreen. A translated exit can move the element
      // back across the observer boundary and repeatedly restart its entrance.
      element.style.opacity = '0'
    }
    const observer = new IntersectionObserver(entries => {
      let index = 0
      entries.forEach(entry => {
        const element = entry.target as HTMLElement
        const focused = element.contains(document.activeElement)
        if (preference.matches || focused) {
          visible.add(element)
          finish(element)
          return
        }
        if (!entry.isIntersecting) {
          // The entrance itself can briefly move a heading outside the root.
          // Only reset it when its layout position has actually left the view.
          if (animations.has(element) && inViewport(element)) return
          stage(element)
          return
        }
        if (visible.has(element)) return
        visible.add(element)
        finish(element)
        const distance = revealDistance(element)
        const animation = animate(element, {
          opacity: [0, 1], y: [Number.isFinite(distance) ? distance : 0, 0],
        }, {
          type: 'spring', stiffness: 120, damping: 24, mass: 1,
          delay: index++ * durationToken(element, '--duration-fast-min', 0.13),
          onComplete: () => {
            if (animations.get(element) === animation) finish(element)
          },
        })
        animations.set(element, animation)
      })
    }, { root, threshold: [0, 0.15] })
    const registerElements = () => {
      elements.forEach(element => {
        if (element.isConnected) return
        observer.unobserve(element)
        finish(element)
        elements.delete(element)
        visible.delete(element)
      })
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element => {
        if (elements.has(element)) return
        elements.add(element)
        if (preference.matches || inViewport(element)) {
          visible.add(element)
          finish(element)
        } else stage(element)
        observer.observe(element)
      })
    }
    registerElements()
    // About swaps its layout at mobile breakpoints; observe replacement nodes too.
    const mutations = new MutationObserver(registerElements)
    mutations.observe(document.querySelector('main') ?? document.body, { childList: true, subtree: true })
    const onPreference = () => {
      elements.forEach(element => {
        if (preference.matches || element.contains(document.activeElement) || inViewport(element)) {
          visible.add(element)
          finish(element)
        } else stage(element)
      })
    }
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element) elements.forEach(element => {
        if (element.contains(event.target as Element)) {
          visible.add(element)
          finish(element)
        }
      })
    }
    preference.addEventListener('change', onPreference)
    document.addEventListener('focusin', onFocus)
    return () => {
      observer.disconnect()
      mutations.disconnect()
      finishAll()
      cleanupFrames.forEach(cancelAnimationFrame)
      preference.removeEventListener('change', onPreference)
      document.removeEventListener('focusin', onFocus)
    }
  }, [])
}
