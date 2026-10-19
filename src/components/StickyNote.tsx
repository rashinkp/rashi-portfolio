import { useRef, useState, type ReactNode, type RefObject } from 'react'
import { useReducedMotion } from 'motion/react'
import { MotionCard, noteSpring, durationToken } from '../lib/motion'

interface StickyNoteProps {
  children: ReactNode
  label: string
  color: 'yellow' | 'pink' | 'green' | 'cyan' | 'purple'
  className: string
  angle: number
  bounds: RefObject<HTMLElement | null>
  enterOnView?: boolean
}

export function StickyNote({ children, label, color, className, angle, bounds, enterOnView = false }: StickyNoteProps) {
  const reduced = useReducedMotion()
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [entered, setEntered] = useState(false)
  const element = useRef<HTMLDivElement>(null)
  const currentPosition = useRef({ x: 0, y: 0 })

  return (
    <MotionCard
      ref={element}
      padding={4}
      variant={color}
      elevation="med"
      className={`relative z-20 min-w-0 w-full md:w-40 aspect-square rounded-none! touch-none select-none cursor-grab active:cursor-grabbing focus-visible:outline-accent ${className}`}
      data-sticky-note={label}
      role="group"
      aria-label={`${label}. Drag to move, or use arrow keys. Home resets position.`}
      tabIndex={0}
      drag
      dragConstraints={bounds}
      // Keep the hero's vertical bounds, but let notes cross the content column.
      onMeasureDragConstraints={constraints => {
        const container = bounds.current?.getBoundingClientRect()
        const note = element.current
        if (!container || !note) return constraints
        // Reserve the extra width created by the note's tilt and pickup scale.
        const tilt = reduced ? 0 : Math.max(Math.abs(angle), Math.abs(angle - 4), Math.abs(angle + 3)) * Math.PI / 180
        const scale = reduced ? 1 : 1.1
        const inset = Math.max(0, (scale * (note.offsetWidth * Math.cos(tilt) + note.offsetHeight * Math.sin(tilt)) - note.offsetWidth) / 2)
        return {
          ...constraints,
          left: constraints.left - container.left + inset,
          right: constraints.right + document.documentElement.clientWidth - container.right - inset,
        }
      }}
      dragElastic={0}
      dragMomentum={false}
      initial={false}
      animate={enterOnView ? undefined : { opacity: 1, x: position.x, y: position.y, rotate: reduced ? 0 : angle }}
      whileInView={enterOnView ? { opacity: 1, x: position.x, y: position.y, rotate: reduced ? 0 : angle } : undefined}
      viewport={enterOnView ? { once: true, amount: 0.15 } : undefined}
      transition={reduced ? { duration: 0 } : entered ? noteSpring : {
        type: 'spring', stiffness: 120, damping: 24, mass: 1,
        delay: durationToken(globalThis.document?.documentElement, '--duration-medium-max', 0.55),
      }}
      onAnimationComplete={() => setEntered(true)}
      whileHover={reduced ? undefined : { scale: 1.08, rotate: angle - 4, transition: noteSpring }}
      whileTap={reduced ? undefined : { scale: 1.1, rotate: angle + 3, boxShadow: 'var(--shadow-high)', transition: noteSpring }}
      whileDrag={{ zIndex: 30, boxShadow: 'var(--shadow-high)' }}
      onUpdate={latest => {
        if (typeof latest.x === 'number') currentPosition.current.x = latest.x
        if (typeof latest.y === 'number') currentPosition.current.y = latest.y
      }}
      onDragEnd={() => {
        const box = element.current?.getBoundingClientRect()
        const boundary = bounds.current?.getBoundingClientRect()
        if (!box || !boundary) return
        // Save the constrained transform, not the pointer's unrestricted offset.
        // Account for the tilted note's visible edges when releasing it.
        const dx = Math.max(-box.left, Math.min(0, document.documentElement.clientWidth - box.right))
        const dy = Math.max(boundary.top - box.top, Math.min(0, boundary.bottom - box.bottom))
        setPosition({ x: currentPosition.current.x + dx, y: currentPosition.current.y + dy })
      }}
      onKeyDown={event => {
        if (event.key === 'Home') { event.preventDefault(); setPosition({ x: 0, y: 0 }); return }
        const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
        if (!direction) return
        event.preventDefault()
        const step = parseFloat(getComputedStyle(event.currentTarget).getPropertyValue('--spacing-4')) || 0
        const box = event.currentTarget.getBoundingClientRect()
        const boundary = bounds.current?.getBoundingClientRect()
        if (!boundary) return
        const dx = Math.max(-box.left, Math.min(direction[0] * step, document.documentElement.clientWidth - box.right))
        const dy = Math.max(boundary.top - box.top, Math.min(direction[1] * step, boundary.bottom - box.bottom))
        setPosition(previous => ({ x: previous.x + dx, y: previous.y + dy }))
      }}
    >
      {children}
    </MotionCard>
  )
}
