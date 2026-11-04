import { Button } from '@astryxdesign/core/Button'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { RobotPet } from './RobotPet'

export function NotFoundPage() {
  return (
    <VStack as="main" minHeight="100dvh" padding={6} gap={0} hAlign="center" vAlign="center" className="relative isolate overflow-hidden bg-body text-primary font-sans antialiased text-center">
      <svg aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full text-border pointer-events-none">
        <defs><pattern id="lost-notebook-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="currentColor" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#lost-notebook-dots)" />
      </svg>
      <VStack gap={4} hAlign="center" maxWidth={400}>
        <HStack gap={3} vAlign="center" hAlign="center" aria-hidden="true" className="text-accent">
          <Text type="display-1" className="font-heading text-6xl! sm:text-8xl!">4</Text>
          <VStack gap={0} className="overflow-visible"><RobotPet greetOnArrival /></VStack>
          <Text type="display-1" className="font-heading text-6xl! sm:text-8xl!">4</Text>
        </HStack>
        <Heading level={1} className="text-balance">This page wandered off.</Heading>
        <Button href="/" label="Back home" />
      </VStack>
    </VStack>
  )
}
