import { useEffect, useRef } from 'react'
import { animate } from 'motion/react'
import { durationToken } from '../lib/motion'

/** A small notebook doodle that doubles as the chat launcher. */
export function RobotPet({ isChatWelcome = false, greetOnArrival = false, compact = false }: { isChatWelcome?: boolean; greetOnArrival?: boolean; compact?: boolean }) {
  const faceRef = useRef<SVGSVGElement>(null)
  const pupilsRef = useRef<SVGGElement>(null)

  const eyesRef = useRef<SVGGElement>(null)
  const armRef = useRef<SVGGElement>(null)

  useEffect(() => {
    const svg = faceRef.current
    const launcher = svg?.closest('a') ?? svg
    if (!svg || !launcher) return
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
    const fast = durationToken(svg, '--duration-fast-min', 0.15)
    let timer: ReturnType<typeof setTimeout>
    let blink: ReturnType<typeof animate> | undefined
    let wave: ReturnType<typeof animate> | undefined
    let armAngle = 0
    const setArmAngle = (angle: number) => {
      armAngle = angle
      armRef.current?.setAttribute('transform', `rotate(${angle} 69 79)`)
    }
    const openEyes = () => eyesRef.current?.setAttribute('transform', 'translate(0 46) scale(1 1) translate(0 -46)')
    const scheduleBlink = () => {
      timer = setTimeout(() => {
        if (!document.hidden && !reducedMotion.matches) {
          blink = animate(0, 1, {
            duration: fast * 2,
            onUpdate: progress => {
              const scale = 1 - Math.sin(progress * Math.PI) * 0.94
              eyesRef.current?.setAttribute('transform', `translate(0 46) scale(1 ${scale}) translate(0 -46)`)
            },
            onComplete: openEyes,
          })
        }
        scheduleBlink()
      }, 3500 + Math.random() * 3500)
    }
    const waveHello = (loop = true) => {
      if (reducedMotion.matches) return
      wave?.stop()
      let startingAngle = armAngle
      wave = animate(0, 1, {
        duration: fast * 8,
        repeat: loop ? Infinity : 0,
        onRepeat: () => { startingAngle = 0 },
        ease: 'linear',
        onUpdate: progress => {
          const angle = -Math.sin(progress * Math.PI) * 18 + Math.sin(progress * Math.PI * 6) * Math.sin(progress * Math.PI) * 22
          setArmAngle(angle + startingAngle * Math.max(0, 1 - progress * 6))
        },
        onComplete: () => setArmAngle(0),
      })
    }
    const stopWave = () => {
      wave?.stop()
      if (reducedMotion.matches) { setArmAngle(0); return }
      wave = animate(armAngle, 0, {
        duration: fast * 2,
        ease: 'easeOut',
        onUpdate: setArmAngle,
      })
    }
    const reset = () => {
      blink?.stop()
      wave?.stop()
      setArmAngle(0)
      openEyes()
    }
    const hoverWave = () => waveHello(true)
    scheduleBlink()
    if (greetOnArrival) waveHello(false)
    launcher.addEventListener('pointerenter', hoverWave)
    launcher.addEventListener('focus', hoverWave)
    launcher.addEventListener('pointerleave', stopWave)
    launcher.addEventListener('blur', stopWave)
    window.addEventListener('blur', stopWave)
    reducedMotion.addEventListener('change', reset)
    return () => {
      clearTimeout(timer)
      reset()
      launcher.removeEventListener('pointerenter', hoverWave)
      launcher.removeEventListener('focus', hoverWave)
      launcher.removeEventListener('pointerleave', stopWave)
      launcher.removeEventListener('blur', stopWave)
      window.removeEventListener('blur', stopWave)
      reducedMotion.removeEventListener('change', reset)
    }
  }, [greetOnArrival])

  useEffect(() => {
    let frame = 0
    let pointer: { x: number; y: number } | null = null
    let gaze = { x: 0, y: 0 }
    let tracking: ReturnType<typeof animate> | undefined
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
    const moveEyes = (x: number, y: number) => {
      tracking?.stop()
      const start = { ...gaze }
      tracking = animate(0, 1, {
        duration: reducedMotion.matches ? 0 : durationToken(faceRef.current ?? document.documentElement, '--duration-fast-min', 0.15) * 1.5,
        ease: 'easeOut',
        onUpdate: progress => {
          gaze = { x: start.x + (x - start.x) * progress, y: start.y + (y - start.y) * progress }
          pupilsRef.current?.setAttribute('transform', `translate(${gaze.x} ${gaze.y})`)
        },
      })
    }
    const update = () => {
      frame = 0
      const svg = faceRef.current
      const pupils = pupilsRef.current
      if (!svg || !pupils) return
      const matrix = svg.getScreenCTM()
      if (!pointer || !matrix) {
        moveEyes(0, 0)
        return
      }
      const position = new DOMPoint(pointer.x, pointer.y).matrixTransform(matrix.inverse())
      const dx = position.x - 52
      const dy = position.y - 46
      const distance = Math.hypot(dx, dy)
      const offset = Math.min(distance / 12, 3.8)
      moveEyes(distance ? dx / distance * offset : 0, distance ? dy / distance * offset : 0)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const follow = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
      pointer = { x: event.clientX, y: event.clientY }
      schedule()
    }
    const reset = () => { pointer = null; schedule() }
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) reset() }
    window.addEventListener('pointermove', follow, { passive: true })
    window.addEventListener('pointerout', leave)
    window.addEventListener('blur', reset)
    return () => {
      cancelAnimationFrame(frame)
      tracking?.stop()
      window.removeEventListener('pointermove', follow)
      window.removeEventListener('pointerout', leave)
      window.removeEventListener('blur', reset)
    }
  }, [])

  return (
    <svg data-chat-robot={isChatWelcome ? "true" : undefined} ref={faceRef} viewBox="0 0 104 112" fill="none" aria-hidden="true" className={`${compact ? 'h-10 w-10' : 'h-16 w-16 sm:h-24 sm:w-24'} overflow-visible text-accent transition-transform duration-200 origin-bottom motion-safe:group-hover:scale-105 motion-reduce:transition-none`}>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M51 22 52 12M48 10c0-5 8-5 8 0s-8 5-8 0Z" />
        <path d="M27 27c12-3 36-3 49 0 5 1 7 6 7 12l-1 24c0 6-4 9-10 10l-41-1c-7 0-10-4-10-10l1-25c0-5 1-8 5-10Z" className="fill-surface" />
        <path d="M21 42c-10-3-11 17 0 16M83 42c11-2 10 17-1 16" className="fill-surface" />
        <path d="M31 38c10-2 31-2 41 0l-1 20c-11 3-29 2-40 0Z" className="fill-accent-bg" />
        <g ref={eyesRef}>
        <circle cx="40" cy="46" r="6" className="fill-surface" />
        <circle cx="63" cy="46" r="6" className="fill-surface" />
        <g ref={pupilsRef} fill="currentColor" stroke="none">
          <circle cx="40" cy="46" r="2.2" />
          <circle cx="63" cy="46" r="2.2" />
        </g>
        </g>
        <path d="M46 55q6 4 12 0" />
        <path d="m36 73-2 19q17 6 35 0l-2-19M44 79h15M46 85h11" className="fill-surface" />
        <path d="m33 79-8 8-7-6M42 95l-1 7-9 1m29-8 2 7 9 1" />
        <g ref={armRef}><path d="m69 79 9-8 6 3m-6-3 1-5m-1 5 5-2" /></g>
        <path d="m88 16 1 7m-4-4 8 1M12 64l-3 5m-1-5 5 4" opacity=".6" />
      </g>
    </svg>
  )
}
