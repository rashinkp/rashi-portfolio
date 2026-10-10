import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'

export function AboutPortrait() {
  const portrait = useRef<SVGSVGElement>(null)
  const visible = useInView(portrait, { amount: 0.5 })
  const reduced = useReducedMotion()
  const active = visible && !reduced
  const idle = { duration: 4.8, repeat: Infinity, ease: [0.37, 0, 0.63, 1] as const }
  return (
    <svg ref={portrait} viewBox="0 0 240 240" aria-hidden="true" data-about-portrait data-motion-active={active} className="w-48 h-48 sm:w-60 sm:h-60 text-primary">
      <defs><clipPath id="about-portrait-clip"><circle cx="136" cy="96" r="60" /></clipPath></defs>
      <circle cx="136" cy="96" r="60" className="fill-(--color-background-blue)" />
      <g clipPath="url(#about-portrait-clip)">
        <path d="m94 38-32 111h21l44-99h55v99h15V38Z" className="fill-(--color-background-surface)" />
        <path d="M91 117q44-22 89 0v45H91Z" className="fill-(--color-on-light)" />
        <motion.g initial={false} animate={active ? { y: [0, 1.8, 0] } : { y: 0 }} transition={active ? idle : { duration: 0 }} data-portrait-part="body">
        <path d="M127 101h20v22l-10 9-11-9Z" className="fill-(--color-background-orange)" />
        <path d="M121 115 99 125l8 41h62l10-41-27-11-15 17Z" className="fill-(--color-background-pink)" />
        <path d="m111 121 6 40m42-40-7 40m-47-26h63m-62 12h62" fill="none" stroke="currentColor" strokeWidth="2" opacity=".5" />
        </motion.g>
        <motion.g initial={false} animate={active ? { rotate: [0, -5, 4, 0], x: [0, -1.5, 1.5, 0], y: [0, 1.4, -1, 0] } : { rotate: 0, x: 0, y: 0 }} transition={active ? idle : { duration: 0 }} data-portrait-part="head">
        <ellipse cx="111" cy="80" rx="6" ry="10" className="fill-(--color-background-orange)" />
        <ellipse cx="158" cy="80" rx="6" ry="10" className="fill-(--color-background-orange)" />
        <path d="M111 59q23-20 47 0v30q-4 23-23 23-21-1-24-23Z" className="fill-(--color-background-orange)" />
        <path d="M107 81q-5-24 9-33l7-7 11-2-3 5 15-3-4 6q23 2 19 34l-6 5-3-27q-20 11-36-1l-3 29Z" className="fill-(--color-on-light)" />
        <g fill="none" stroke="var(--color-on-light)" strokeWidth="2" strokeLinecap="round">
          <path d="m119 71 8 2m17-2-7 2m-14 21q5 3 10-1" />
          <motion.g initial={false} animate={active ? { scaleY: [1, 1, 0.08, 1, 1] } : { scaleY: 1 }} transition={active ? { duration: 4.6, repeat: Infinity, times: [0, 0.7, 0.73, 0.76, 1], ease: 'linear' } : { duration: 0 }} data-portrait-part="eyes">
            <path d="m123 80v5m20-5v5" />
          </motion.g>
        </g>
        <path d="m134 78-3 15h7Z" className="fill-(--color-text-red)" opacity=".35" />
        </motion.g>
        <motion.g initial={false} animate={active ? { rotate: [0, -10, 8, 0] } : { rotate: 0 }} transition={active ? idle : { duration: 0 }} data-portrait-part="steering">
        <path d="M103 153q33-40 67 0" fill="none" stroke="var(--color-on-light)" strokeWidth="12" />
        <path d="M106 132q-12-11-18-1l10 15q7 3 14-7m49-7q12-11 18-1l-10 15q-7 3-14-7" className="fill-(--color-background-orange)" />
        </motion.g>
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="m69 39-9-13m22 6 3-16M65 53l-15-5M67 211q-38-3-20-37 3-12 17-21m-16 4 16-4-6 15" />
      </g>
    </svg>
  )
}

