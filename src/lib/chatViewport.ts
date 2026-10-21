export interface ChatViewportSource {
  innerHeight: number
  visualViewport?: { height: number; offsetTop: number; scale: number } | null
}

// The keyboard may resize only the visual viewport. Its bottom edge also
// accounts for Safari panning the viewport to keep the focused input in view.
// Leave pinch zoom alone instead of resizing the interface around the zoom.
export function chatViewportHeight(source: ChatViewportSource): number | undefined {
  const viewport = source.visualViewport
  if (!viewport || Math.abs(viewport.scale - 1) > 0.01) return undefined
  const bottom = viewport.height + Math.max(0, viewport.offsetTop)
  if (!Number.isFinite(bottom) || bottom <= 0) return undefined
  return Math.min(source.innerHeight, bottom)
}
