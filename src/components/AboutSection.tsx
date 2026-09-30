import { revealClassName } from '../hooks/useRevealOnScroll'
import { Heading } from '@astryxdesign/core/Heading'
import { VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'

export function AboutSection() {
  return (
    <VStack
      as="section"
      id="about"
      gap={3}
      maxWidth="60ch"
      paddingBlock={10}
      data-reveal="section" className={revealClassName}
    >
      <Text type="supporting" color="accent">About</Text>
      <Heading level={2}>Building beyond the interface</Heading>
      <Text color="secondary" textWrap="pretty">
        My work spans responsive React interfaces, TypeScript APIs, secure authentication,
        AI-assisted workflows, real-time communication, and cloud deployment. I care about
        modular code, reliable user journeys, and understanding how the whole product fits
        together.
      </Text>
    </VStack>
  )
}
