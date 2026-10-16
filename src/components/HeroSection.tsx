import { useRef } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { useMediaQuery } from '@astryxdesign/core/hooks'
import { StickyNote } from './StickyNote'
import { HeroDoodle } from './HeroDoodle'
import { useViewportWidth } from '../hooks/useViewportWidth'

export function HeroSection() {
  const bounds = useRef<HTMLElement>(null)
  const width = useViewportWidth()
  const mobile = width > 0 && width < 640
  const compact = useMediaQuery('(max-width: 639px) and (max-height: 740px)')

  return (
    <VStack ref={bounds} as="section" aria-label="Introduction" gap={compact ? 4 : mobile ? 6 : 10} vAlign="center" hAlign="center" minHeight={width >= 768 ? 'calc(100svh - var(--spacing-10) - var(--spacing-10) - var(--spacing-4))' : undefined} className={`relative isolate min-w-0 pb-12 sm:py-12 md:py-24 ${compact ? 'pt-6' : 'pt-10'}`}>
      <VStack gap={compact ? 2 : mobile ? 3 : 5} hAlign="center" className="relative z-10 w-full text-center md:py-24">
        <HeroDoodle compact={compact} />
        <Heading level={1} type="display-1" justify="center" className={`${compact ? 'text-2xl!' : 'text-3xl!'} sm:text-4xl! md:text-5xl! font-heading!`}>hey, I’m Rashin</Heading>
        <Text weight="bold" justify="center" className={`${compact ? 'text-sm! leading-tight!' : 'text-base!'} sm:text-xl! whitespace-pre-line!`}>{mobile ? 'PRODUCT ENGINEER\nBUILDER · DESIGNER' : 'PRODUCT ENGINEER · BUILDER · DESIGNER'}</Text>
        <HStack gap={2} wrap="wrap" hAlign="center">
          <Button label="Explore my work ↗" variant="primary" size="lg" href="#projects" className="min-h-12! rounded-full!" />
          <Button label="Say hello" variant="ghost" size="lg" href="#contact" className="min-h-12!" />
        </HStack>
      </VStack>
      <Grid columns={2} gap={compact ? 2 : 4} width="100%" maxWidth={compact ? 224 : 288} className="items-start md:contents">
        <StickyNote key={`offrolls-${width}-${compact}`} label="Product and AI at Offrolls" color="green" angle={-4} bounds={bounds} className="aspect-5/4! p-2! md:p-3! md:absolute md:left-4 md:top-16 md:w-44!">
          <VStack gap={1} width="100%" hAlign="center" vAlign="center" className="h-full"><Text justify="center" className="text-sm! md:text-base! whitespace-nowrap">Product &amp; AI @</Text><Heading level={2} justify="center" className="text-xl! md:text-2xl!">Offrolls</Heading></VStack>
        </StickyNote>
        <StickyNote key={`drag-${width}-${compact}`} label="Move these notes" color="pink" angle={3} bounds={bounds} className={`${compact ? 'mt-0 p-2!' : 'mt-4'} md:mt-0 md:absolute md:right-6 md:top-12`}>
          <VStack gap={1} width="100%" hAlign="center" vAlign="center" className="h-full"><Text justify="center" weight="bold" className="text-lg! md:text-xl!">Drag me 😆</Text></VStack>
        </StickyNote>
        <StickyNote key={`scale-${width}-${compact}`} label="Product craft" color="cyan" angle={-3} bounds={bounds} className="aspect-4/3! p-2! md:p-4! md:absolute md:right-0 md:bottom-56 md:w-48!">
          <VStack gap={1} width="100%" hAlign="center" vAlign="center" className="h-full"><Text justify="center" weight="bold" className={`${compact ? 'text-sm! leading-tight!' : 'text-base!'} md:text-xl!`}>Big ideas.<br />Fewer clicks.<br />Happy humans.</Text></VStack>
        </StickyNote>
        <StickyNote key={`bca-${width}-${compact}`} label="BCA graduate" color="yellow" angle={4} bounds={bounds} className={`aspect-4/3! ${compact ? 'mt-0' : 'mt-4'} p-2! md:p-4! md:mt-0 md:absolute md:left-8 md:bottom-36 md:w-48!`}>
          <VStack gap={1} width="100%" hAlign="center" vAlign="center" className="h-full"><Text justify="center" weight="bold" className={`${compact ? 'text-sm!' : 'text-base!'} md:text-xl!`}>BCA graduate</Text><Text justify="center" className={`${compact ? 'text-xs! leading-tight!' : 'text-sm!'} md:text-base!`}>University of Calicut</Text></VStack>
        </StickyNote>
      </Grid>
    </VStack>
  )
}
