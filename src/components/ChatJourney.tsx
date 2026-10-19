import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion/react'
import { MotionVStack } from '../lib/motion'
import { prepareChatJourney } from '../lib/journeyPreparation'
import { createChatJourney, sampleJourneyPath, prepareContinuousRobotDrawing, type Point } from '../lib/chatJourney'

interface ChatJourneyProps {
  origin: Point
  returning?: boolean
  onArrive: () => void
  onComplete: () => void
  onCancel: () => void
}

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress

export function ChatJourney({ origin, returning = false, onArrive, onComplete, onCancel }: ChatJourneyProps) {
  const [metrics] = useState(prepareChatJourney)
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<SVGSVGElement>(null)
  const trail = useRef<SVGPathElement>(null)
  const drawingGroup = useRef<SVGGElement>(null)
  const bubbleGroup = useRef<SVGGElement>(null)
  const paper = useRef<SVGGElement>(null)
  const dots = useRef<SVGGElement>(null)
  const tip = useRef<SVGCircleElement>(null)
  const departure = useRef<SVGGElement>(null)
  const finishedRobot = useRef<SVGGElement>(null)
  // Freeze geometry for this journey; viewport changes finish it rather than warp it.
  const [{ width, height }] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  const { path, center, robotScale } = createChatJourney(origin, width, height)
  const [robotRoute] = useState(prepareContinuousRobotDrawing)

  useEffect(() => {
    const departureNode = departure.current
    const finishedNode = finishedRobot.current
    const svg = canvas.current
    const line = trail.current
    const outlines = [...(drawingGroup.current?.querySelectorAll('path') ?? [])]
    const layer = root.current
    if (!svg || !line || !outlines.length || !layer) return
    let arrived = false
    let completed = false
    let landingRobot: Element | null = null
    let targetBounds: DOMRect | undefined
    let targetRobot: Element | null = null
    let destinationScene: HTMLElement | null = null
    const sourceRobot = document.querySelector(returning ? '[data-chat-robot="true"]' : 'a[href="/chat"] svg')
    const sourceBounds = sourceRobot?.getBoundingClientRect()
    const sourceScale = sourceBounds ? Math.min(sourceBounds.width / 104, sourceBounds.height / 112) : 96 / 112
    const sourceOpacity = sourceRobot?.getAttribute('opacity')
    if (sourceRobot && departure.current) {
      const copy = sourceRobot.cloneNode(true) as SVGSVGElement
      copy.removeAttribute('class')
      copy.removeAttribute('data-chat-robot')
      copy.setAttribute('x', '-52')
      copy.setAttribute('y', '-56')
      copy.setAttribute('width', '104')
      copy.setAttribute('height', '112')
      departure.current.replaceChildren(copy)
      sourceRobot.setAttribute('opacity', '0')
    }
    const arrive = () => { if (!arrived) { arrived = true; onArrive() } }
    const finish = () => {
      if (completed) return
      completed = true
      arrive()
      // Restore the real robot before removing the overlay; never leave a
      // painted frame with both the overlay and destination robot invisible.
      landingRobot?.removeAttribute('opacity')
      destinationScene?.style.removeProperty('transform')
      destinationScene?.style.removeProperty('transform-origin')
      destinationScene?.style.removeProperty('will-change')
      onComplete()
    }
    const length = 1
    // Sample SVG geometry once instead of asking the renderer on every frame.
    const samples = sampleJourneyPath(path)
    let previousDrawing = -1
    let previousScale = -1
    let previousCamera = ''
    const lengths = robotRoute.strokes.map(stroke => stroke.length)
    const strokeWidth = metrics.strokeWidth
    const drawingLength = robotRoute.length
    line.setAttribute('stroke-dasharray', String(length))
    line.setAttribute('stroke-dashoffset', String(length))
    line.setAttribute('opacity', '1')
    outlines.forEach(outline => {
      outline.setAttribute('stroke-dasharray', '1')
      outline.setAttribute('stroke-dashoffset', '1')
    })
    const attributes = new WeakMap<Element, Map<string, string>>()
    const write = (element: Element | null, name: string, value: string) => {
      if (!element) return
      let cached = attributes.get(element)
      if (!cached) { cached = new Map(); attributes.set(element, cached) }
      if (cached.get(name) === value) return
      cached.set(name, value)
      element.setAttribute(name, value)
    }
    const duration = metrics.slow * 8.6
    // Camera tracking is intentionally slower than the pen. Follow a broad
    // neighborhood so isolated eyes, arms and legs do not whip the viewport.
    let cameraFollowX = center.x
    let cameraFollowY = center.y - 34 * robotScale
    let previousElapsed = 0

    const animation = animate(0, 1, {
      duration,
      ease: 'linear',
      onUpdate: elapsed => {
        // Read destination layout before any writes, once the route has mounted.
        if (arrived && elapsed >= 0.66 && !targetBounds) {
          targetRobot = document.querySelector(returning ? 'a[href="/chat"] svg' : '[data-chat-robot="true"]')
          if (targetRobot) {
            targetBounds = targetRobot.getBoundingClientRect()
            // The drawn outline becomes the actual opaque robot before the
            // page reveal, so links and cards never show through his face.
            if (finishedNode) {
              const copy = targetRobot.cloneNode(true) as SVGSVGElement
              copy.removeAttribute('class')
              copy.removeAttribute('opacity')
              copy.removeAttribute('data-chat-robot')
              copy.setAttribute('x', '-52')
              copy.setAttribute('y', '-56')
              copy.setAttribute('width', '104')
              copy.setAttribute('height', '112')
              finishedNode.replaceChildren(copy)
            }
            landingRobot = targetRobot
            landingRobot.setAttribute('opacity', '0')
            destinationScene = document.querySelector<HTMLElement>('[data-journey-scene]')
            if (destinationScene) {
              destinationScene.style.willChange = 'transform'
              destinationScene.style.transformOrigin = '0 0'
            }
          }
        }
        const collapseTime = clamp(elapsed / 0.16)
        const collapse = collapseTime * collapseTime * collapseTime * (collapseTime * (collapseTime * 6 - 15) + 10)
        const progress = clamp((elapsed - 0.16) / 0.84)
        write(departure.current, 'transform', `translate(${origin.x} ${origin.y}) scale(${Math.max(0.001, sourceScale * (1 - collapse))})`)
        write(departure.current, 'opacity', String(1 - smooth((collapse - 0.85) / 0.15)))
        const travel = smooth((progress - 0.04) / 0.4)
        const drawing = clamp((progress - 0.44) / 0.34)
        const settling = smooth((progress - 0.82) / 0.16)
        const sampleIndex = travel * 256
        const lower = Math.min(255, Math.floor(sampleIndex))
        const point = { x: mix(samples[lower].x, samples[lower + 1].x, sampleIndex - lower), y: mix(samples[lower].y, samples[lower + 1].y, sampleIndex - lower) }
        const penIndex = drawing * 512
        const penLower = Math.min(511, Math.floor(penIndex))
        const pen = {
          x: mix(robotRoute.points[penLower].x, robotRoute.points[penLower + 1].x, penIndex - penLower),
          y: mix(robotRoute.points[penLower].y, robotRoute.points[penLower + 1].y, penIndex - penLower),
        }
        const focus = smooth(travel / 0.4)
        const lock = smooth((travel - 0.78) / 0.22)
        const travelCameraX = mix(point.x - mix(origin.x, width / 2, focus), center.x - width / 2, lock)
        const travelCameraY = mix(point.y - mix(origin.y, height * 0.44, focus), center.y - height * 0.44, lock)
        // Follow a softly averaged pen position rather than every tiny corner.
        // All samples are cached; no SVG measurements occur during animation.
        let averageX = 0
        let averageY = 0
        for (let offset = -32; offset <= 32; offset += 8) {
          const sample = robotRoute.points[Math.max(0, Math.min(512, penLower + offset))]
          averageX += sample.x
          averageY += sample.y
        }
        const followX = center.x + (averageX / 9 - 52) * robotScale * 0.55
        const followY = center.y + (averageY / 9 - 56) * robotScale * 0.55
        const delta = Math.max(0, elapsed - previousElapsed) * duration
        previousElapsed = elapsed
        const tracking = 1 - Math.exp(-delta / 0.28)
        cameraFollowX = mix(cameraFollowX, followX, tracking)
        cameraFollowY = mix(cameraFollowY, followY, tracking)
        const closeUp = smooth((progress - 0.43) / 0.12) * (1 - smooth((progress - 0.65) / 0.15))
        const cameraZoom = 1 + closeUp * 0.85
        const viewWidth = width / cameraZoom
        const viewHeight = height / cameraZoom
        // Blend the camera's focal point, then derive its viewport origin.
        // Blending origins of differently sized viewports adds unwanted drift.
        const cameraX = mix(travelCameraX + width / 2, cameraFollowX, closeUp) - viewWidth / 2
        const cameraY = mix(travelCameraY + height * 0.44, cameraFollowY, closeUp) - viewHeight * 0.44
        const camera = `${cameraX} ${cameraY} ${viewWidth} ${viewHeight}`
        if (camera !== previousCamera) { write(svg, 'viewBox', camera); previousCamera = camera }
        svg.dataset.stage = progress < 0.44 ? 'travelling' : progress < 0.82 ? 'drawing' : 'arriving'
        write(paper.current, 'opacity', String(smooth(progress / 0.27) * (1 - smooth((progress - 0.81) / 0.05))))
        write(line, 'stroke-dashoffset', String(length * (1 - travel)))
        write(line, 'opacity', String(smooth((progress - 0.04) / 0.025) * (1 - smooth((progress - 0.48) / 0.18))))
        write(tip.current, 'cx', String(progress < 0.44 ? point.x : center.x + (pen.x - 52) * robotScale))
        write(tip.current, 'cy', String(progress < 0.44 ? point.y : center.y + (pen.y - 56) * robotScale))
        write(tip.current, 'opacity', String(smooth((collapse - 0.65) / 0.35) * (1 - smooth((progress - 0.78) / 0.04))))
        write(dots.current, 'opacity', String(smooth((progress - 0.78) / 0.1)))
        if (progress >= 0.4) arrive()
        const target = targetBounds
        const targetScale = target ? Math.min(target.width / 104, target.height / 112) : robotScale
        const x = target ? cameraX + target.left + target.width / 2 : center.x
        const y = target ? cameraY + target.top + target.height / 2 : center.y
        const scale = mix(robotScale, targetScale, settling)
        // Reveal one stroke at a time, preserving the robot's exact geometry.
        if (drawing !== previousDrawing || scale !== previousScale) {
          const distance = drawing * drawingLength
          outlines.forEach((outline, index) => {
            const length = lengths[index]
            const drawn = Math.max(0, Math.min(length, distance - robotRoute.strokes[index].start))
            write(outline, 'opacity', drawn > 0 ? '1' : '0')
            write(outline, 'stroke-dashoffset', String(1 - drawn / length))
          })
          write(drawingGroup.current, 'stroke-width', String(strokeWidth / scale))
          previousDrawing = drawing
          previousScale = scale
        }
        const solid = targetBounds ? smooth((progress - 0.78) / 0.04) : 0
        write(finishedNode, 'opacity', String(solid))
        write(drawingGroup.current, 'opacity', String(1 - solid))
        const screenX = mix(center.x - cameraX, target ? target.left + target.width / 2 : width / 2, settling)
        const screenY = mix(center.y - cameraY, target ? target.top + target.height / 2 : height * 0.44, settling)
        if (target && progress >= 0.8) {
          const zoom = scale / targetScale
          const translateX = screenX - (target.left + target.width / 2) * zoom
          const translateY = screenY - (target.top + target.height / 2) * zoom
          if (destinationScene) {
            destinationScene.style.transform = `matrix(${zoom}, 0, 0, ${zoom}, ${translateX}, ${translateY})`
          }
        }
        write(bubbleGroup.current, 'transform', `translate(${mix(center.x, x, settling)} ${mix(center.y, y, settling)}) scale(${scale})`)
        write(svg, 'opacity', '1')
      },
      onComplete: finish,
    })
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { animation.stop(); onCancel() } }
    const onResize = () => { animation.stop(); finish() }
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const onPreference = () => { if (preference.matches) onResize() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    preference.addEventListener('change', onPreference)
    return () => {
      animation.stop()
      landingRobot?.removeAttribute('opacity')
      destinationScene?.style.removeProperty('transform')
      destinationScene?.style.removeProperty('transform-origin')
      destinationScene?.style.removeProperty('will-change')
      if (sourceRobot) {
        if (sourceOpacity == null) sourceRobot.removeAttribute('opacity')
        else sourceRobot.setAttribute('opacity', sourceOpacity)
      }
      departureNode?.replaceChildren()
      finishedNode?.replaceChildren()
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      preference.removeEventListener('change', onPreference)
    }
  }, [origin, path, center.x, center.y, robotScale, width, height, onArrive, onComplete, onCancel, returning, metrics, robotRoute])

  return (
    <MotionVStack ref={root} gap={0} width={width} height={height} className="fixed inset-0 z-70 overflow-hidden text-accent cursor-progress" role="status" aria-label={returning ? "Following a line back to the portfolio. Press Escape to skip." : "Following a line into the chat. Press Escape to skip."} data-chat-journey="true" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
      <svg aria-hidden="true" width="100%" height="100%" className="absolute inset-0 pointer-events-none">
        <defs>
          <pattern id="journey-paper-dots" width={metrics.paperSpacing} height={metrics.paperSpacing} patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="var(--color-border)" />
          </pattern>
        </defs>
        <g ref={paper} opacity="0">
          <rect width="100%" height="100%" fill="var(--color-background-body)" />
          <rect width="100%" height="100%" fill="url(#journey-paper-dots)" />
        </g>
      </svg>
      <svg ref={canvas} aria-hidden="true" width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="absolute inset-0" fill="none">
        <path ref={trail} pathLength={1} opacity="0" d={path} stroke="currentColor" strokeWidth="var(--spacing-0-5)" strokeLinecap="round" strokeLinejoin="round" />
        <g ref={departure} transform={`translate(${origin.x} ${origin.y})`} />
        <circle ref={tip} opacity="0" cx={origin.x} cy={origin.y} r="var(--spacing-1)" fill="currentColor" />
        <g ref={bubbleGroup} transform={`translate(${center.x} ${center.y}) scale(${robotScale})`}>
          <g ref={drawingGroup} transform="translate(-52 -56)">
          {robotRoute.strokes.map((stroke, index) => <path key={index} opacity="0" d={stroke.path} pathLength={1} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />)}
          <g ref={dots} opacity="0" fill="currentColor"><circle cx="40" cy="46" r="2.2" /><circle cx="63" cy="46" r="2.2" /></g>
          </g>
          <g ref={finishedRobot} opacity="0" />
        </g>
      </svg>
    </MotionVStack>
  )
}
