import { revealClassName } from '../hooks/useRevealOnScroll'
import { Button } from '@astryxdesign/core/Button'
import { Heading } from '@astryxdesign/core/Heading'
import { Section } from '@astryxdesign/core/Section'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'

export function ContactSection() {
  return (
    <Section variant="muted" padding={8}>
      <VStack
        as="section"
        id="contact"
        gap={4}
        maxWidth="60ch"
        data-reveal="section" className={revealClassName}
      >
        <Text type="supporting" color="accent">Contact</Text>
        <Heading level={2} textWrap="balance">Have a project or opportunity in mind?</Heading>
        <Text color="secondary" textWrap="pretty">
          I’m open to full-stack development opportunities and collaborations where I can
          contribute, learn, and help ship useful software.
        </Text>
        <HStack gap={2} wrap="wrap">
          <Button
            label="Email me"
            variant="primary"
            href="mailto:rashinkp001@gmail.com"
          />
          <Button
            label="LinkedIn"
            variant="secondary"
            href="https://www.linkedin.com/in/rashinkp/"
            target="_blank"
            rel="noopener noreferrer"
          />
          <Button
            label="LeetCode"
            variant="ghost"
            href="https://leetcode.com/u/rashinkp/"
            target="_blank"
            rel="noopener noreferrer"
          />
        </HStack>
      </VStack>
    </Section>
  )
}
