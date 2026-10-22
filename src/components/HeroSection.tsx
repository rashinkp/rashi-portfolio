import { useRef } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { StickyNote } from './StickyNote'

export function HeroSection() {
  const bounds = useRef<HTMLElement>(null)
  const title = (
    <VStack gap={3} hAlign="center" className="relative z-10 w-full text-center col-span-2 order-3 py-2 md:order-none md:py-24 md:gap-5">
      <Heading level={1} type="display-1" justify="center" className="text-2xl! md:text-5xl! font-heading!">hey, I’m Rashin KP</Heading>
      <Text weight="bold" justify="center" className="text-base! md:text-xl!">PRODUCT ENGINEER<span className="hidden md:inline"> · </span><br className="md:hidden" />BUILDER · DESIGNER</Text>
      <HStack gap={2} wrap="wrap" hAlign="center">
        <Button label="Explore my work ↗" variant="primary" size="sm" href="#projects" className="min-h-10! px-3! text-sm! md:min-h-12! rounded-full!" />
        <Button label="Say hello" variant="ghost" size="sm" href="#contact" className="min-h-10! px-3! text-sm! md:min-h-12!" />
      </HStack>
    </VStack>
  )
  const notes = [
    <StickyNote key="offrolls" label="Product and AI at Offrolls" color="green" angle={-4} bounds={bounds} className="aspect-5/4! p-2! w-28! order-1 justify-self-center md:p-3! md:absolute md:left-4 md:top-16 md:w-44!">
      <VStack gap={1} width="100%" hAlign="center" vAlign="center" className="h-full"><Text justify="center" className="text-xs! md:text-base! whitespace-nowrap">Product &amp; AI @</Text><Heading level={2} justify="center" className="text-lg! md:text-2xl!">Offrolls</Heading></VStack>
    </StickyNote>,
    <StickyNote key="drag" label="Move these notes" color="pink" angle={3} bounds={bounds} className="order-2 justify-self-center p-2! mt-1 w-28! md:mt-0 md:absolute md:right-6 md:top-12 md:w-40!">
      <VStack gap={1} width="100%" hAlign="center" vAlign="center" className="h-full"><Text justify="center" weight="bold" className="text-base! md:text-xl!">Drag me 😆</Text></VStack>
    </StickyNote>,
    <StickyNote key="scale" label="Product craft" color="cyan" angle={-3} bounds={bounds} className="aspect-4/3! p-2! w-28! order-5 justify-self-center md:p-4! md:absolute md:right-0 md:bottom-56 md:w-48!">
      <VStack gap={1} width="100%" hAlign="center" vAlign="center" className="h-full"><Text justify="center" weight="bold" textWrap="nowrap" className="text-sm! md:text-lg! leading-tight!">Big ideas.<br />Fewer clicks.<br />Happy humans.</Text></VStack>
    </StickyNote>,
    <StickyNote key="bca" label="BCA graduate" color="yellow" angle={4} bounds={bounds} className="aspect-4/3! p-2! w-28! order-4 justify-self-center md:p-4! md:mt-0 md:absolute md:left-8 md:bottom-36 md:w-48!">
      <VStack gap={1} width="100%" hAlign="center" vAlign="center" className="h-full"><Text justify="center" weight="bold" className="text-sm! md:text-xl!">BCA graduate</Text><Text justify="center" className="text-xs! leading-tight! md:text-base!">University of Calicut</Text></VStack>
    </StickyNote>
  ]

  return (
    <VStack ref={bounds} as="section" aria-label="Introduction" gap={6} vAlign="center" hAlign="center" minHeight="calc(100svh - var(--spacing-10) * 4)" className="relative isolate min-w-0 pb-12 pt-4 md:py-24 md:min-h-svh">
      <Grid columns={2} gap={6} width="100%" align="start" className="md:contents">
        {notes[0]}
        {notes[1]}
        {title}
        {notes[3]}
        {notes[2]}
      </Grid>
    </VStack>
  )
}
