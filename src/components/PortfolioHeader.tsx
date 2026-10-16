import { useEffect, useState, type SVGProps } from 'react'
import { useReducedMotion } from 'motion/react'
import type { ThemeMode } from '../hooks/useThemeMode'
import { Button } from '@astryxdesign/core/Button'
import { Icon } from '@astryxdesign/core/Icon'
import { IconButton } from '@astryxdesign/core/IconButton'
import { LayoutHeader } from '@astryxdesign/core/Layout'
import { HStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { useMediaQuery } from '@astryxdesign/core/hooks'
import { MotionVStack, MotionHStack, noteSpring, spacingToken } from '../lib/motion'

const paths = {
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  work: 'M8 7V4h8v3M3 7h18v14H3ZM3 12l9 3 9-3M12 12v4',
  about: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  contact: 'M3 5h18v14H3ZM3 6l9 7 9-7',
  resume: 'M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6',
  sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  moon: 'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',
}
type IconName = keyof typeof paths
function DockIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}><path d={paths[name]} /></svg>
}
const destinations = [
  { id: 'top', label: 'Home', icon: 'home' },
  { id: 'about', label: 'About', icon: 'about' },
  { id: 'projects', label: 'Work', icon: 'work' },
  { id: 'contact', label: 'Contact', icon: 'contact' },
] as const
interface PortfolioHeaderProps { themeMode: ThemeMode; onThemeModeChange: (mode: ThemeMode) => void }

export function PortfolioHeader() {
  const compact = useMediaQuery('(max-width: 639px) and (max-height: 740px)')
  return (
    <LayoutHeader className={`px-4! md:px-8! ${compact ? 'py-0!' : 'py-4!'}`}>
      <HStack as="header" hAlign="between" vAlign="center" gap={3}>
        <Button label="Rashin K P ↗" variant="ghost" href="#top" className="min-h-10!" />
        <Text color="secondary" className="hidden sm:block">A product engineer’s notebook</Text>
      </HStack>
    </LayoutHeader>
  )
}

export function PortfolioDock({ themeMode, onThemeModeChange }: PortfolioHeaderProps) {
  const reduced = useReducedMotion()
  const [active, setActive] = useState('top')
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section[id], main'))
    const update = () => {
      const viewport = document.querySelector('[data-portfolio-scroll="true"]')?.getBoundingClientRect()
      const trigger = (viewport?.top ?? 0) + (viewport?.height ?? innerHeight) * 0.4
      let current = 'top'
      for (const section of sections) if (section.getBoundingClientRect().top <= trigger) current = section.id
      setActive(current === 'experience' || current === 'skills' || current === 'education' ? 'about' : current)
    }
    let frame = 0
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; update() }) }
    update()
    document.addEventListener('scroll', onScroll, { passive: true, capture: true })
    return () => { document.removeEventListener('scroll', onScroll, true); cancelAnimationFrame(frame) }
  }, [])
  const nextTheme = themeMode === 'dark' ? 'light' : 'dark'
  const icon = (name: IconName) => <Icon icon={props => <DockIcon {...props} name={name} />} color="inherit" />
  const hover = reduced ? undefined : { y: -spacingToken('--spacing-2'), scale: 1.08 }

  return (
      <MotionHStack as="nav" aria-label="Main navigation" gap={1} padding={2} className="fixed z-50 bottom-4 left-1/2 -translate-x-1/2 max-w-full md:gap-2! md:p-3! rounded-xl bg-surface/95 border border-border shadow-lg backdrop-blur-md" initial={reduced ? false : { opacity: 0, y: spacingToken('--spacing-10') }} animate={{ opacity: 1, y: 0 }} transition={{ ...noteSpring, delay: 0.4 }}>
        {destinations.map(item => (
          <MotionVStack key={item.id} className="relative isolate rounded-lg bg-muted shadow-sm" whileHover={hover} whileTap={reduced ? undefined : { scale: 0.96 }} transition={noteSpring}>
            {active === item.id && (
              <MotionVStack
                aria-hidden="true"
                data-dock-highlight={item.id}
                layoutId={reduced ? undefined : 'portfolio-dock-highlight'}
                initial={false}
                transition={reduced ? { duration: 0 } : noteSpring}
                className="absolute inset-0 rounded-lg bg-accent-bg pointer-events-none"
              />
            )}
            <IconButton label={item.label} tooltip={item.label} icon={icon(item.icon)} variant="ghost" size="lg" elevation="none" href={`#${item.id}`} aria-current={active === item.id ? 'location' : undefined} className={`relative z-10 bg-transparent! w-10! md:w-12! min-h-12! min-w-10! md:min-w-12! rounded-lg! transition-colors duration-(--duration-medium-min) ease-out motion-reduce:transition-none ${active === item.id ? 'text-on-accent!' : 'text-primary!'}`} />
          </MotionVStack>
        ))}
        <MotionVStack whileHover={hover} whileTap={reduced ? undefined : { scale: 0.96 }} transition={noteSpring}>
          <IconButton label="Download résumé" tooltip="Download résumé" icon={icon('resume')} variant="secondary" size="lg" elevation="low" href="/resume_rashin.pdf" target="_blank" rel="noopener noreferrer" className="w-10! md:w-12! min-h-12! min-w-10! md:min-w-12! rounded-lg!" />
        </MotionVStack>
        <MotionVStack whileHover={hover} whileTap={reduced ? undefined : { scale: 0.96 }} transition={noteSpring}>
          <IconButton label={`Switch to ${nextTheme} theme`} tooltip={`Switch to ${nextTheme} theme`} icon={icon(themeMode === 'dark' ? 'sun' : 'moon')} variant="secondary" size="lg" elevation="low" className="w-10! md:w-12! min-h-12! min-w-10! md:min-w-12! rounded-lg!" onClick={() => onThemeModeChange(nextTheme)} />
        </MotionVStack>
      </MotionHStack>
  )
}
