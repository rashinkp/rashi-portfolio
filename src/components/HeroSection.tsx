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
  const mobile = width > 0 && width < 768
  const compact = useMediaQuery('(max-width: 767px) and (max-height: 740px)')

  const title = (
    <VStack gap={compact ? 2 : mobile ? 3 : 5} hAlign="center" className={`relative z-10 w-full text-center md:py-24 ${mobile ? 'col-span-2 order-3' : ''}`}>
        <HeroDoodle compact={compact} mobile={mobile} />
      <Heading level={1} type="display-1" justify="center" className={`${compact ? 'text-2xl!' : 'text-3xl!'} ${mobile ? '' : 'sm:text-4xl! md:text-5xl!'} font-heading!`}>hey, I’m Rashin</Heading>
      <Text weight="bold" justify="center" className={`${compact ? 'text-sm! leading-tight!' : 'text-base!'} ${mobile ? '' : 'sm:text-xl!'} whitespace-pre-line!`}>{mobile ? 'PRODUCT ENGINEER\nBUILDER · DESIGNER' : 'PRODUCT ENGINEER · BUILDER · DESIGNER'}</Text>
      <HStack gap={2} wrap="wrap" hAlign="center">
        <Button label="Explore my work ↗" variant="primary" size={mobile ? "sm" : "lg"} href="#projects" className={`${mobile ? 'min-h-10! px-3! text-sm!' : 'min-h-12!'} rounded-full!`} />
        <Button label="Say hello" variant="ghost" size={mobile ? "sm" : "lg"} href="#contact" className={mobile ? "min-h-10! px-3! text-sm!" : "min-h-12!"} />
      </HStack>
    </VStack>
  )
  const notes = [
      <StickyNote key={`offrolls-${width}-${compact}`} label="Product and AI at Offrolls" color="green" angle={-4} bounds={bounds} className={`aspect-5/4! p-2! md:p-3! md:absolute md:left-4 md:top-16 md:w-44! ${mobile ? `order-1 justify-self-start ${compact ? 'w-24!' : 'w-28!'}` : ''}`}>
        <VStack gap={1} width="100%" hAlign="center" vAlign="center" className="h-full"><Text justify="center" className={`${mobile ? 'text-xs!' : 'text-sm!'} md:text-base! whitespace-nowrap`}>Product &amp; AI @</Text><Heading level={2} justify="center" className={`${compact ? 'text-base!' : mobile ? 'text-lg!' : 'text-xl!'} md:text-2xl!`}>Offrolls</Heading></VStack>
      </StickyNote>,
      <StickyNote key={`drag-${width}-${compact}`} label="Move these notes" color="pink" angle={3} bounds={bounds} className={`${mobile ? `order-2 justify-self-end p-2! mt-3 ${compact ? 'w-24!' : 'w-28!'}` : 'mt-4'} md:mt-0 md:absolute md:right-6 md:top-12`}>
        <VStack gap={1} width="100%" hAlign="center" vAlign="center" className="h-full"><Text justify="center" weight="bold" className={`${compact ? 'text-sm!' : mobile ? 'text-base!' : 'text-lg!'} md:text-xl!`}>Drag me 😆</Text></VStack>
      </StickyNote>,
      <StickyNote key={`scale-${width}-${compact}`} label="Product craft" color="cyan" angle={-3} bounds={bounds} className={`aspect-4/3! p-2! md:p-4! md:absolute md:right-0 md:bottom-56 md:w-48! ${mobile ? `order-5 justify-self-end ${compact ? 'w-24!' : 'w-28!'}` : ''}`}>
        <VStack gap={1} width="100%" hAlign="center" vAlign="center" className="h-full"><Text justify="center" weight="bold" textWrap="nowrap" className={`${compact ? 'text-xs!' : mobile ? 'text-sm!' : 'text-base!'} md:text-lg! leading-tight!`}>Big ideas.<br />Fewer clicks.<br />Happy humans.</Text></VStack>
      </StickyNote>,
      <StickyNote key={`bca-${width}-${compact}`} label="BCA graduate" color="yellow" angle={4} bounds={bounds} className={`aspect-4/3! ${compact ? 'mt-0' : 'mt-4'} p-2! md:p-4! md:mt-0 md:absolute md:left-8 md:bottom-36 md:w-48! ${mobile ? `order-4 justify-self-start ${compact ? 'w-24!' : 'w-28!'}` : ''}`}>
        <VStack gap={1} width="100%" hAlign="center" vAlign="center" className="h-full"><Text justify="center" weight="bold" className={`${compact ? 'text-xs!' : mobile ? 'text-sm!' : 'text-base!'} md:text-xl!`}>BCA graduate</Text><Text justify="center" className={`${mobile ? 'text-xs! leading-tight!' : 'text-sm!'} md:text-base!`}>University of Calicut</Text></VStack>
      </StickyNote>
  ]

  return (
    <VStack ref={bounds} as="section" aria-label="Introduction" gap={compact ? 4 : mobile ? 6 : 10} vAlign="center" hAlign="center" minHeight={width >= 768 ? 'min(calc(100svh - var(--spacing-10) - var(--spacing-10) - var(--spacing-4)), calc(var(--spacing-10) * 20))' : undefined} className={`relative isolate min-w-0 pb-12 sm:py-12 md:py-24 ${compact ? 'pt-3 pb-8!' : mobile ? 'pt-4' : 'pt-10'}`}>
      {mobile ? (
        <Grid columns={2} gap={compact ? 3 : 5} width="100%" align="start">
          {notes[0]}
          {notes[1]}
          {title}
          {notes[3]}
          {notes[2]}
        </Grid>
      ) : (
        <>
          {title}
          <Grid columns={2} gap={4} width="100%" maxWidth={288} className="items-start md:contents">
            {notes}
          </Grid>
        </>
      )}
    </VStack>
  )
}
