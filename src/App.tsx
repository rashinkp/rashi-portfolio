import { Layout, LayoutContent } from '@astryxdesign/core/Layout'
import { VStack } from '@astryxdesign/core/Stack'
import { Theme } from '@astryxdesign/core/theme'
import { notebookTheme } from './theme/notebook'
import { MotionConfig } from 'motion/react'
import { useSmoothAnchors } from './hooks/useSmoothAnchors'
import { useThemeMode } from './hooks/useThemeMode'
import { useRevealOnScroll } from './hooks/useRevealOnScroll'
import { useInitialAnchor } from './hooks/useInitialAnchor'
import { PortfolioHeader, PortfolioDock } from './components/PortfolioHeader'
import { HeroSection } from './components/HeroSection'
import { AboutSection } from './components/AboutSection'
import { ProjectsSection } from './components/ProjectsSection'
import { ContactSection } from './components/ContactSection'
import { PortfolioFooter } from './components/PortfolioFooter'

function App() {
  const { themeMode, onThemeModeChange } = useThemeMode()
  useInitialAnchor()
  useSmoothAnchors()
  useRevealOnScroll()

  return (
    <Theme theme={notebookTheme} mode={themeMode}>
      <MotionConfig reducedMotion="user">
      <svg aria-hidden="true" className="fixed inset-0 w-full h-full text-border pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="notebook-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="currentColor" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#notebook-dots)" />
      </svg>
      <VStack gap={0} width="100%" height="calc(100dvh - var(--spacing-10) - var(--spacing-10) - var(--spacing-4))" data-portfolio-scroll="true" className="overflow-y-auto overscroll-y-contain">
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
            <VStack as="main" id="top" gap={0} className="min-w-0 pb-4">
              <HeroSection />
              <AboutSection />
              <ProjectsSection />
              <ContactSection />
              <PortfolioFooter />
            </VStack>
          </LayoutContent>
        }
      />
      </VStack>
      <PortfolioDock themeMode={themeMode} onThemeModeChange={onThemeModeChange} />
      </MotionConfig>
    </Theme>
  )
}

export default App
