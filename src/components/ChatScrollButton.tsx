import { useEffect, useState } from 'react'
import { ChatLayoutScrollButton, useChatLayoutContext } from '@astryxdesign/core/Chat'

export function ChatScrollButton() {
  const context = useChatLayoutContext()
  const scrollRef = context?.scrollContainerRef
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const container = scrollRef?.current
    if (!container) return

    const update = () => {
      // Allow for fractional scroll positions and mobile overscroll.
      setIsVisible(container.scrollHeight - container.clientHeight - container.scrollTop > 10)
    }
    const observer = new ResizeObserver(update)
    observer.observe(container)
    // Watch message growth and composer resizing, including streaming replies.
    for (const child of container.children) observer.observe(child)
    container.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      observer.disconnect()
      container.removeEventListener('scroll', update)
    }
  }, [scrollRef])

  return <ChatLayoutScrollButton isVisible={isVisible} onClick={() => {
    const container = scrollRef?.current
    container?.scrollTo({
      top: container.scrollHeight,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }} />
}
