import { memo, type MouseEvent } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { Layout, LayoutContent } from '@astryxdesign/core/Layout'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { useRevealOnScroll } from '../hooks/useRevealOnScroll'
import type { ThemeMode } from '../hooks/useThemeMode'
import { PortfolioHeader, PortfolioDock } from './PortfolioHeader'
import { HeroSection } from './HeroSection'
import { AboutSection } from './AboutSection'
import { ExperienceSection } from './ExperienceSection'
import { ProjectsSection } from './ProjectsSection'
import { ContactSection } from './ContactSection'
import { PortfolioFooter } from './PortfolioFooter'
import { RobotPet } from './RobotPet'

interface Props {
  themeMode: ThemeMode
  onThemeModeChange: (mode: ThemeMode) => void
  openChat: (event: MouseEvent<HTMLElement>) => void
  preloadChat: () => void
}

// Route visibility changes do not rebuild the portfolio or restart its effects.
export const PortfolioView = memo(function PortfolioView({ themeMode, onThemeModeChange, openChat, preloadChat }: Props) {
  useRevealOnScroll()
  return <>
      <svg aria-hidden="true" className="fixed inset-0 w-full h-full text-border pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="notebook-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="currentColor" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#notebook-dots)" />
      </svg>
      <VStack gap={0} width="100%" height="100dvh" data-portfolio-scroll="true" className="h-[calc(100dvh_-_var(--spacing-10)*2)]! sm:h-[calc(100dvh_-_var(--spacing-12)*2_-_var(--spacing-4))]! md:h-dvh! overflow-y-auto overscroll-y-contain scroll-pb-6 sm:scroll-pb-28">
      <Layout
        className="relative min-h-svh overflow-x-clip bg-transparent text-primary font-sans antialiased selection:bg-accent-bg selection:text-on-accent"
        height="auto"
        contentWidth={1120}
        padding={0}
        header={
          <PortfolioHeader />
        }
        content={
          <LayoutContent isScrollable={false} className="overflow-visible! px-4! md:px-8!">
            <VStack as="main" id="top" gap={0} className="min-w-0 pb-6 md:pb-28">
              <HeroSection />
              <AboutSection />
              <ExperienceSection />
              <ProjectsSection />
              <ContactSection />
              <PortfolioFooter />
            </VStack>
          </LayoutContent>
        }
      />
      </VStack>
      <HStack gap={2} vAlign="end" className="fixed bottom-4 left-1/2 -translate-x-1/2 -ml-8 z-60 sm:contents">
      <PortfolioDock themeMode={themeMode} onThemeModeChange={onThemeModeChange} />
      </HStack>
      <VStack className="fixed z-60 right-0 bottom-4 sm:right-8 overflow-visible" gap={0}>
        <Button label="Chat with Rashin’s robot" tooltip="Ask me about Rashin" href="/chat" onClick={openChat} onPointerEnter={preloadChat} onFocus={preloadChat} variant="ghost" className="group h-auto! p-0! overflow-visible! [&>span>span]:overflow-visible! rounded-full! bg-transparent! bg-none! hover:bg-transparent! hover:bg-none! transition-transform duration-(--duration-fast-min) ease-out motion-safe:hover:-translate-y-1 motion-safe:active:scale-96 motion-reduce:transition-none">
          <VStack gap={1} hAlign="center" className="overflow-visible">
            <VStack gap={0} hAlign="center" vAlign="center" className="h-16 w-16 sm:h-24 sm:w-24 overflow-visible drop-shadow-md group-hover:drop-shadow-lg transition-[filter] duration-(--duration-fast-min) motion-reduce:transition-none">
              <RobotPet idleJump />
            </VStack>
          </VStack>
        </Button>
      </VStack>
  </>
})
