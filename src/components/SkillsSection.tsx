import { revealClassName } from '../hooks/useRevealOnScroll'
import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Token } from '@astryxdesign/core/Token'
import { skillGroups } from '../data/portfolio'

export function SkillsSection() {
  return (
    <VStack as="section" id="skills" gap={6} paddingBlock={10} data-reveal="section" className={revealClassName}>
      <VStack gap={2} maxWidth="60ch">
        <Text type="supporting" color="accent">Skills</Text>
        <Heading level={2}>Tools I use to ship products</Heading>
        <Text color="secondary">
          A practical stack covering product interfaces, APIs, databases, integrations,
          testing, and delivery.
        </Text>
      </VStack>
      <Grid columns={{ minWidth: 280, max: 2, repeat: 'fit' }} gap={6}>
        {skillGroups.map((group) => (
          <VStack key={group.title} gap={2}>
            <Heading level={3}>{group.title}</Heading>
            <HStack gap={1} wrap="wrap">
              {group.skills.map((skill) => (
                <Token key={skill} label={skill} size="sm" />
              ))}
            </HStack>
          </VStack>
        ))}
      </Grid>
    </VStack>
  )
}
