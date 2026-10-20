import { Text } from '@astryxdesign/core/Text'
import { lazy, memo, startTransition, Suspense, useCallback, useEffect, useState, type MouseEvent } from 'react'
import { VStack } from '@astryxdesign/core/Stack'
import { Theme } from '@astryxdesign/core/theme'
import { PortfolioView } from './components/PortfolioView'
import { notebookTheme } from './theme/notebook'
import { MotionConfig, useReducedMotion } from 'motion/react'
import { MotionVStack, durationToken } from './lib/motion'
import { ChatJourney } from './components/ChatJourney'
import { prepareChatJourney } from './lib/journeyPreparation'
import type { Point } from './lib/chatJourney'
import { useSmoothAnchors } from './hooks/useSmoothAnchors'
import { useThemeMode } from './hooks/useThemeMode'
import { useInitialAnchor } from './hooks/useInitialAnchor'

const loadChat = () => import('./components/PortfolioChat')
const PortfolioChat = memo(lazy(loadChat))

function App() {
  const { themeMode, onThemeModeChange } = useThemeMode()
  const [isChatPage, setIsChatPage] = useState(() => typeof window !== 'undefined' && window.location.pathname.replace(/\/$/, '') === '/chat')
  const [chatPrepared, setChatPrepared] = useState(isChatPage)
  const [portfolioVisited, setPortfolioVisited] = useState(!isChatPage)
  const [journey, setJourney] = useState<Point | null>(null)
  const [returning, setReturning] = useState(false)
  const reducedMotion = useReducedMotion()
  const [sceneDuration] = useState(() => durationToken(globalThis.document?.documentElement, '--duration-medium-min', 0.31))
  // Warm the lazy chat chunk while the portfolio is idle, before a mobile tap
  // starts the animation (touch screens do not get the hover preload).
  useEffect(() => {
    if (isChatPage) return
    const preload = () => { prepareChatJourney(); void loadChat().then(() => startTransition(() => setChatPrepared(true))).catch(() => {}) }
    if ('requestIdleCallback' in window) {
      const idle = requestIdleCallback(preload, { timeout: 2000 })
      return () => cancelIdleCallback(idle)
    }
    const timer = setTimeout(preload, 1000)
    return () => clearTimeout(timer)
  }, [isChatPage])
  useEffect(() => {
    if (portfolioVisited) return
    const prepare = () => { prepareChatJourney(); setPortfolioVisited(true) }
    if ('requestIdleCallback' in window) {
      const idle = requestIdleCallback(prepare, { timeout: 3000 })
      return () => cancelIdleCallback(idle)
    }
    const timer = setTimeout(prepare, 1500)
    return () => clearTimeout(timer)
  }, [portfolioVisited])
  useEffect(() => {
    const onPopState = () => {
      setJourney(null)
      setIsChatPage(window.location.pathname.replace(/\/$/, '') === '/chat')
      if (window.location.pathname !== '/chat') { setPortfolioVisited(true); document.title = 'Rashin K P | Full-stack Product Engineer' }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  const arriveAtChat = useCallback(() => {
    if (window.location.pathname !== '/chat') history.pushState(null, '', '/chat')
    setIsChatPage(true)
  }, [])
  const arriveAtPortfolio = useCallback(() => {
    if (window.location.pathname !== '/') history.pushState(null, '', '/')
    document.title = 'Rashin K P | Full-stack Product Engineer'
    setPortfolioVisited(true)
    setIsChatPage(false)
  }, [])
  const completeJourney = useCallback(() => {
    setJourney(null)
    requestAnimationFrame(() => {
      const heading = [...document.querySelectorAll<HTMLElement>('main h1')].find(element => element.getClientRects().length > 0 && !element.closest('[aria-hidden="true"]'))
      heading?.setAttribute('tabindex', '-1')
      heading?.classList.add('focus:outline-none')
      heading?.focus({ preventScroll: true })
    })
  }, [])
  const skipJourney = useCallback(() => { arriveAtChat(); completeJourney() }, [arriveAtChat, completeJourney])
  const skipReturn = useCallback(() => { arriveAtPortfolio(); completeJourney() }, [arriveAtPortfolio, completeJourney])
  const preloadChat = useCallback(() => { void loadChat().then(() => startTransition(() => setChatPrepared(true))).catch(() => {}) }, [])
  const openChat = useCallback((event: MouseEvent<HTMLElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (document.querySelector('[data-chat-journey]')) return
    setReturning(false)
    preloadChat()
    if (reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches) { skipJourney(); return }
    const bounds = (event.currentTarget.querySelector('svg') ?? event.currentTarget).getBoundingClientRect()
    setJourney({ x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 })
  }, [preloadChat, reducedMotion, skipJourney])
  const returnToPortfolio = useCallback((event: MouseEvent<HTMLElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (document.querySelector('[data-chat-journey]')) return
    setReturning(true)
    if (reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches) { skipReturn(); return }
    const robot = document.querySelector('[data-chat-robot="true"]')
    const bounds = (robot ?? event.currentTarget).getBoundingClientRect()
    setJourney({ x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 })
  }, [reducedMotion, skipReturn])
  useInitialAnchor()
  useSmoothAnchors()

  return (
    <Theme theme={notebookTheme} mode={themeMode}>
      <MotionConfig reducedMotion="user">
      <VStack gap={0} width="100%" height="100dvh" className="overflow-hidden scheme-light in-data-[color-mode=dark]:scheme-dark">
      <MotionVStack data-journey-scene="true" gap={0} className="relative h-dvh w-full min-h-0 overflow-hidden" inert={Boolean(journey)} aria-busy={Boolean(journey)} initial={false} animate={{ opacity: journey && (returning ? isChatPage : !isChatPage) ? 0.15 : 1 }} transition={{ duration: reducedMotion ? 0 : sceneDuration }}>
      {(chatPrepared || isChatPage) && (
        <VStack gap={0} width="100%" height="100dvh" aria-hidden={!isChatPage} inert={!isChatPage} className={`absolute inset-0 z-10 ${isChatPage ? 'visible' : 'invisible pointer-events-none'}`}><Suspense fallback={<VStack height="100dvh" hAlign="center" vAlign="center"><Text role="status">Opening chat…</Text></VStack>}><PortfolioChat isActive={isChatPage} hasArrived={isChatPage && !journey} onBack={returnToPortfolio} /></Suspense></VStack>
      )}
      {portfolioVisited && <VStack gap={0} width="100%" height="100dvh" aria-hidden={isChatPage} inert={isChatPage} className={`absolute inset-0 z-0 overflow-hidden ${isChatPage ? 'invisible pointer-events-none' : 'visible'}`}>
      <PortfolioView themeMode={themeMode} onThemeModeChange={onThemeModeChange} openChat={openChat} preloadChat={preloadChat} />
      </VStack>}
      </MotionVStack>
      </VStack>
      {journey && <ChatJourney origin={journey} returning={returning} onArrive={returning ? arriveAtPortfolio : arriveAtChat} onComplete={completeJourney} onCancel={returning ? skipReturn : skipJourney} />}
      </MotionConfig>
    </Theme>
  )
}

export default App
