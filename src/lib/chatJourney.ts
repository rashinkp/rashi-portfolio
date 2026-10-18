export interface Point { x: number; y: number }

// SVG drawing coordinates, shared by the travelling line and the welcome mark.
export const robotDrawingPaths = [
  'M51 22 52 12',
  'M48 10c0-5 8-5 8 0s-8 5-8 0Z',
  'M27 27c12-3 36-3 49 0 5 1 7 6 7 12l-1 24c0 6-4 9-10 10l-41-1c-7 0-10-4-10-10l1-25c0-5 1-8 5-10Z',
  'M21 42c-10-3-11 17 0 16',
  'M83 42c11-2 10 17-1 16',
  'M31 38c10-2 31-2 41 0l-1 20c-11 3-29 2-40 0Z',
  'M46 46a6 6 0 1 0-12 0a6 6 0 1 0 12 0',
  'M69 46a6 6 0 1 0-12 0a6 6 0 1 0 12 0',
  'M46 55q6 4 12 0',
  'M36 73l-2 19q17 6 35 0l-2-19',
  'M44 79h15',
  'M46 85h11',
  'M33 79l-8 8-7-6',
  'M69 79l9-8 6 3',
  'M78 71l1-5',
  'M78 71l5-2',
  'M42 95l-1 7-9 1',
  'M61 95l2 7 9 1',
  'M88 16l1 7',
  'M85 19l8 1',
  'M12 64l-3 5',
  'M8 64l5 4',
]


export function createChatJourney(origin: Point, width: number, height: number) {
  const center = { x: -width * 1.25, y: -height * 1.1 }
  const robotScale = Math.min(width * 0.52, 220) / 104
  const end = { x: center.x - robotScale, y: center.y - 34 * robotScale }
  const path = [
    `M ${origin.x} ${origin.y}`,
    `C ${origin.x - width * 0.12} ${origin.y - height * 0.02} ${origin.x - width * 0.05} ${origin.y - height * 0.29} ${origin.x - width * 0.34} ${origin.y - height * 0.24}`,
    `S ${-width * 0.24} ${height * 0.45} ${-width * 0.42} ${height * 0.16}`,
    `C ${-width * 0.69} ${-height * 0.3} ${-width * 0.03} ${-height * 0.3} ${-width * 0.35} ${-height * 0.55}`,
    `S ${-width * 1.27} ${-height * 0.47} ${-width * 1.43} ${-height * 0.77}`,
    `C ${-width * 1.62} ${-height * 1.1} ${end.x - width * 0.1} ${end.y + height * 0.16} ${end.x} ${end.y}`,
  ].join(' ')
  return { path, center, robotScale }
}

// Sample our M/C/S journey using ordinary arithmetic. Calling SVG's
// getPointAtLength hundreds of times blocks slower devices before motion starts.
export function sampleJourneyPath(path: string, count = 256): Point[] {
  const tokens = path.match(/[MCS]|[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []
  const points: Point[] = []
  let cursor = 0
  let point: Point = { x: 0, y: 0 }
  let previousControl = point
  const readPoint = () => ({ x: Number(tokens[cursor++]), y: Number(tokens[cursor++]) })
  while (cursor < tokens.length) {
    const command = tokens[cursor++]
    if (command === 'M') {
      point = readPoint()
      previousControl = point
      points.push(point)
      continue
    }
    const start = point
    const first = command === 'S'
      ? { x: 2 * start.x - previousControl.x, y: 2 * start.y - previousControl.y }
      : readPoint()
    const second = readPoint()
    const end = readPoint()
    for (let step = 1; step <= 48; step++) {
      const t = step / 48
      const u = 1 - t
      points.push({
        x: u ** 3 * start.x + 3 * u ** 2 * t * first.x + 3 * u * t ** 2 * second.x + t ** 3 * end.x,
        y: u ** 3 * start.y + 3 * u ** 2 * t * first.y + 3 * u * t ** 2 * second.y + t ** 3 * end.y,
      })
    }
    point = end
    previousControl = second
  }
  const distances = [0]
  for (let index = 1; index < points.length; index++) {
    distances.push(distances[index - 1] + Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y))
  }
  let index = 1
  return Array.from({ length: count + 1 }, (_, sample) => {
    const distance = distances.at(-1)! * sample / count
    while (index < distances.length - 1 && distances[index] < distance) index++
    const ratio = (distance - distances[index - 1]) / (distances[index] - distances[index - 1] || 1)
    return {
      x: points[index - 1].x + (points[index].x - points[index - 1].x) * ratio,
      y: points[index - 1].y + (points[index].y - points[index - 1].y) * ratio,
    }
  })
}

let drawingLengths: number[] | undefined

/** Warm detached geometry during idle time; this never forces page layout. */
export function prepareRobotDrawing() {
  drawingLengths ??= robotDrawingPaths.map(d => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', d)
    return path.getTotalLength()
  })
  return drawingLengths
}
