import { revealClassName } from '../hooks/useRevealOnScroll'
import { Button } from '@astryxdesign/core/Button'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'

export function HeroSection() {
  return (
    <VStack as="section" gap={6} maxWidth="60ch" paddingBlock={10}>
      <Text type="supporting" color="accent" data-reveal="hero-1" className={revealClassName}>
        Rashin K P · Full Stack Developer · At Offrolls since January 2026
      </Text>
      <Heading level={1} type="display-1" textWrap="balance" data-reveal="hero-2" className={`${revealClassName} motion-safe:delay-(--duration-fast-min)`}>
        I build web applications for hiring, learning, and commerce.
      </Heading>
      <Text type="large" color="secondary" textWrap="pretty" data-reveal="hero-3" className={`${revealClassName} motion-safe:delay-(--duration-fast)`}>
        At Offrolls, I develop recruitment workflows across React interfaces,
        TypeScript APIs, and AI-assisted screening. My projects bring together
        course purchases, online payments, and real-time communication.
      </Text>
      <HStack gap={2} wrap="wrap" data-reveal="hero-4" className={`${revealClassName} motion-safe:delay-(--duration-fast-max)`}>
        <Button label="Explore projects" variant="primary" size="lg" href="#projects" />
        <Button
          label="Download résumé"
          variant="secondary"
          size="lg"
          href="/resume_rashin.pdf"
          target="_blank"
          rel="noopener noreferrer"
        />
        <Button
          label="GitHub"
          variant="ghost"
          size="lg"
          href="https://github.com/rashinkp"
          target="_blank"
          rel="noopener noreferrer"
        />
      </HStack>
    </VStack>
  )
}
