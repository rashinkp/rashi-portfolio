import { useSyncExternalStore } from 'react'

function subscribe(update: () => void) {
  window.addEventListener('resize', update)
  return () => window.removeEventListener('resize', update)
}

const width = () => window.innerWidth
const serverWidth = () => 0

export function useViewportWidth() {
  return useSyncExternalStore(subscribe, width, serverWidth)
}
