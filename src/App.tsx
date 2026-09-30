import { Divider } from '@astryxdesign/core/Divider'
import { Layout, LayoutContent } from '@astryxdesign/core/Layout'
import { VStack } from '@astryxdesign/core/Stack'
import { Theme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'
import { useThemeMode } from './hooks/useThemeMode'
import { useRevealOnScroll } from './hooks/useRevealOnScroll'
import { PortfolioHeader } from './components/PortfolioHeader'
import { HeroSection } from './components/HeroSection'
import { AboutSection } from './components/AboutSection'
import { ExperienceSection } from './components/ExperienceSection'
import { ProjectsSection } from './components/ProjectsSection'
import { SkillsSection } from './components/SkillsSection'
import { EducationSection } from './components/EducationSection'
import { ContactSection } from './components/ContactSection'
import { PortfolioFooter } from './components/PortfolioFooter'

function App() {
  const { themeMode, onThemeModeChange } = useThemeMode()
  useRevealOnScroll()

  return (
    <Theme theme={neutralTheme} mode={themeMode}>
      <Layout
        className="min-h-svh bg-body text-primary font-sans antialiased selection:bg-accent-bg selection:text-on-accent"
        height="auto"
        contentWidth={960}
        padding={6}
        defaultHasDividers
        header={
          <PortfolioHeader themeMode={themeMode} onThemeModeChange={onThemeModeChange} />
        }
        content={
          <LayoutContent>
            <VStack as="main" id="top" gap={0}>
              <HeroSection />
              <AboutSection />
              <Divider />
              <ExperienceSection />
              <Divider />
              <ProjectsSection />
              <Divider />
              <SkillsSection />
              <Divider />
              <EducationSection />
              <ContactSection />
              <Divider />
              <PortfolioFooter />
            </VStack>
          </LayoutContent>
        }
      />
    </Theme>
  )
}

export default App
