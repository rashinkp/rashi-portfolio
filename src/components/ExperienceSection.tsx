import { revealClassName } from '../hooks/useRevealOnScroll'
import { Button } from '@astryxdesign/core/Button'
import { Card } from '@astryxdesign/core/Card'
import { Heading } from '@astryxdesign/core/Heading'
import { List, ListItem } from '@astryxdesign/core/List'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Token } from '@astryxdesign/core/Token'
import { offrollsHighlights, offrollsStack } from '../data/portfolio'

export function ExperienceSection() {
  return (
    <VStack
      as="section"
      id="experience"
      gap={6}
      paddingBlock={10}
      data-reveal="section" className={revealClassName}
    >
      <VStack gap={2} maxWidth="60ch">
        <Text type="supporting" color="accent">Experience</Text>
        <Heading level={2}>Building recruitment workflows across web, APIs, and AI</Heading>
        <Text color="secondary" textWrap="pretty">
          At Offrolls, I help develop a multi-role recruitment platform for employers,
          recruiters, vendors, candidates, and administrators.
        </Text>
      </VStack>
      <Card padding={6} elevation="low">
        <VStack gap={4}>
          <HStack hAlign="between" vAlign="start" wrap="wrap" gap={2}>
            <VStack gap={1}>
              <Heading level={3}>Software Developer</Heading>
              <Text color="accent">Offrolls · Bengaluru, India</Text>
            </VStack>
            <Token label="Since January 2026" size="sm" />
          </HStack>
          <VStack maxWidth="60ch">
            <Text color="secondary" textWrap="pretty">
              The product supports hiring operations across India and Kuwait, including
              job and application management, candidate screening, interview scheduling,
              subscriptions, payouts, and administrative workflows.
            </Text>
          </VStack>
          <List listStyle="disc" density="compact" header="Selected contributions">
            {offrollsHighlights.map((highlight) => (
              <ListItem
                key={highlight.title}
                label={highlight.title}
                description={
                  <Text color="secondary" textWrap="pretty">
                    {highlight.description}
                  </Text>
                }
              />
            ))}
          </List>
          <HStack gap={1} wrap="wrap">
            {offrollsStack.map((item) => (
              <Token key={item} label={item} size="sm" />
            ))}
          </HStack>
          <HStack gap={2} wrap="wrap">
            <Button
              label="Company website"
              variant="primary"
              href="https://offrolls.com"
              target="_blank"
              rel="noopener noreferrer"
            />
            <Button
              label="Offrolls on LinkedIn"
              variant="secondary"
              href="https://www.linkedin.com/company/offrolls.com?originalSubdomain=in"
              target="_blank"
              rel="noopener noreferrer"
            />
          </HStack>
        </VStack>
      </Card>
    </VStack>
  )
}
