import { durationToken, spacingToken } from './motion'
import { prepareRobotDrawing } from './chatJourney'

let journeyMetrics: { slow: number; paperSpacing: number; strokeWidth: number } | undefined

export function prepareChatJourney() {
  prepareRobotDrawing()
  if (!journeyMetrics) {
    const host = document.querySelector('[data-astryx-theme]') ?? document.documentElement
    journeyMetrics = {
      slow: durationToken(host, '--duration-slow', 0.975),
      paperSpacing: spacingToken('--spacing-6') || 24,
      strokeWidth: spacingToken('--spacing-0-5') || 2,
    }
  }
  return journeyMetrics
}
