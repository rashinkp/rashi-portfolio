import { useRef } from 'react'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { SectionTitle } from './SectionTitle'
import { ExperienceSection } from './ExperienceSection'
import { SocialLinks } from './SocialLinks'
import { SkillsSection } from './SkillsSection'
import { StickyNote } from './StickyNote'
import { AboutPortrait } from './AboutPortrait'
import { useViewportWidth } from '../hooks/useViewportWidth'

const notes = [
  { label: 'Product ownership', color: 'green', text: 'From first\nidea to\n“it works!”', position: '', angle: -2 },
  { label: 'Product craft', color: 'pink', text: 'Building so\nyou don’t\nRAGE QUIT', position: 'mt-10', angle: 2 },
  { label: 'Always learning', color: 'yellow', text: 'Curiosity led.\nGoogle helped.\nStill learning.', position: '', angle: -1 },
  { label: 'Based in Kerala', color: 'cyan', text: '📍 Kerala\nBuilding\nfrom here.', position: 'mt-10', angle: 1 },
  { label: 'Thoughtful experiences', color: 'purple', text: 'Less friction.\nMore\n“oh, nice!”', position: '', angle: -1 },
  { label: 'Move these notes too', color: 'yellow', text: 'These notes\ncan move\ntoo 😆', position: 'mt-10', angle: 2 },
] as const


export function AboutSection() {
  const bounds = useRef<HTMLElement>(null)
  // Re-measure note constraints after rotation instead of retaining old drag offsets.
  const width = useViewportWidth()
  const mobile = width > 0 && width < 900
  const portrait = (
    <VStack gap={0} hAlign="center" className="relative shrink-0" data-reveal="about-copy">
      <AboutPortrait compact={mobile} />
      <Heading level={3} className={`absolute bottom-0 right-0 font-sans! ${mobile ? 'text-lg!' : 'text-2xl! sm:text-3xl!'}`}>Yours Truly</Heading>
    </VStack>
  )
  const noteGrid = (
    <Grid columns={mobile && width >= 360 ? 3 : 2} gap={mobile ? 4 : 0} width="100%" maxWidth={mobile ? 352 : undefined} className={mobile ? 'items-start self-center' : 'gap-y-10!'}>
      {notes.map(note => (
        <StickyNote key={`${width}-${note.label}`} label={note.label} color={note.color} angle={note.angle} bounds={bounds} enterOnView className={mobile ? `w-full! p-1.5! ${note.position ? 'mt-3' : ''}` : `w-32! p-3! ${note.position}`}>
          <VStack hAlign="center" vAlign="center" height="100%" width="100%">
            <Text justify="center" weight="bold" className={`w-full whitespace-pre! text-sm! ${mobile ? '' : 'sm:text-base!'} leading-tight!`}>{note.text}</Text>
          </VStack>
        </StickyNote>
      ))}
    </Grid>
  )

  if (mobile) {
    return (
      <VStack ref={bounds} as="section" id="about" gap={6} hAlign="center" className="relative min-w-0 py-8">
        <SectionTitle>About</SectionTitle>
        <VStack gap={10} width="100%" maxWidth={408} paddingInline={2}>
          <HStack gap={3} wrap="wrap" hAlign="center" vAlign="center">
            {portrait}
            <SocialLinks compact />
          </HStack>
          <SkillsSection />
          {noteGrid}
          <ExperienceSection />
        </VStack>
      </VStack>
    )
  }
  return (
    <VStack ref={bounds} as="section" id="about" gap={mobile ? 6 : 10} hAlign="center" className="relative min-w-0 py-8 sm:py-10 md:py-16">
      <SectionTitle>About</SectionTitle>
      <HStack gap={mobile ? 6 : 10} wrap="wrap" hAlign="center" vAlign="start" width="100%" maxWidth={800}>
        <VStack gap={mobile ? 4 : 8} width={mobile ? 248 : 280} maxWidth="100%" hAlign="center" className="min-w-0 shrink-0">
          {portrait}
          {noteGrid}
        </VStack>
        <VStack gap={mobile ? 6 : 10} width={mobile ? 320 : 480} maxWidth="100%" hAlign="start" className="min-w-0 shrink-0">
          <SocialLinks />
          <SkillsSection />
          <ExperienceSection />
        </VStack>
      </HStack>
    </VStack>
  )
}
