import { motion, useReducedMotion } from 'motion/react'
import { durationToken } from '../lib/motion'

// Original notebook sketch: an idea, then a meandering route to the title.
const strokes = [
  'M76 119C73 102 52 96 54 74C56 48 88 36 109 54C131 72 120 96 108 106L105 119',
  'M77 122Q91 125 105 121M78 130Q92 133 104 129M83 138Q92 144 100 137',
  'M80 114L76 83L89 94L101 81L99 114',
  'M42 64L30 58M58 41L51 29M88 32L88 17M117 42L129 30M133 69L148 64',
  'M63 151C16 170 21 217 58 210C96 203 77 160 57 173C37 188 85 219 132 185C154 169 169 143 213 147',
  'M201 135L216 147L200 158',
  'M161 102L166 90L172 102L183 107L172 112L166 123L161 112L150 107Z',
]

export function HeroDoodle({ compact = false }: { compact?: boolean }) {
  const reduced = useReducedMotion()
  const duration = durationToken(document.documentElement, '--duration-slow-max', 1.3) * 1.5
  const stagger = durationToken(document.documentElement, '--duration-fast-min', 0.13) / 2
  const hold = durationToken(document.documentElement, '--duration-slow-max', 1.3) * 2
  const erase = durationToken(document.documentElement, '--duration-slow-min', 0.73)
  const total = duration + (strokes.length - 1) * stagger + hold + erase

  return (
    <motion.svg
      aria-hidden="true"
      data-hero-doodle
      viewBox="0 0 240 240"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${compact ? 'w-12 h-12' : 'w-24 h-24'} shrink-0 pointer-events-none text-secondary md:absolute md:left-4 lg:left-16 md:top-1/2 md:-translate-y-1/2 md:w-48 md:h-48`}
    >
      {strokes.map((d, index) => (
        <motion.path
          key={d}
          d={d}
          className={index === 6 ? 'text-accent' : undefined}
          initial={reduced ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          animate={reduced ? { pathLength: 0, opacity: 0 } : {
            pathLength: [0, 0, 1, 1, 0],
            opacity: [1, 1, 1, 1, 1],
            transitionEnd: { opacity: 0 },
          }}
          transition={reduced ? { delay: hold, duration: 0 } : {
            duration: total,
            times: [0, index * stagger / total, (index * stagger + duration) / total, (total - erase) / total, 1],
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.svg>
  )
}
