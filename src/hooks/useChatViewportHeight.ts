import { useEffect, useState } from 'react'
import { chatViewportHeight } from '../lib/chatViewport'

export function useChatViewportHeight(active: boolean) {
  const [height, setHeight] = useState<number>()
  useEffect(() => {
    if (!active) return
    const viewport = window.visualViewport
    const update = () => setHeight(chatViewportHeight(window))
    update()
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [active])
  return active ? height : undefined
}
