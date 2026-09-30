import { revealClassName } from '../hooks/useRevealOnScroll'
import { Heading } from '@astryxdesign/core/Heading'
import { List, ListItem } from '@astryxdesign/core/List'
import { VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'

export function EducationSection() {
  return (
    <VStack as="section" gap={5} paddingBlock={10} data-reveal="section" className={revealClassName}>
      <VStack gap={2}>
        <Text type="supporting" color="accent">Education</Text>
        <Heading level={2}>Learning by building</Heading>
      </VStack>
      <List density="spacious" hasDividers header="Education and training">
        <ListItem
          label="MERN Stack Development"
          description="Brocamp (Brototype) · 2024 – 2025"
        />
        <ListItem
          label="Bachelor of Computer Applications"
          description="University of Calicut, Kerala · 2021 – 2024"
        />
      </List>
    </VStack>
  )
}
