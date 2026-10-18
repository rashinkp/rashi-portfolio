import { Heading } from '@astryxdesign/core/Heading'
import { VStack } from '@astryxdesign/core/Stack'
import { Grid, GridSpan } from '@astryxdesign/core/Grid'
import { useMediaQuery } from '@astryxdesign/core/hooks'
import { Text } from '@astryxdesign/core/Text'
import { List, ListItem } from '@astryxdesign/core/List'

const contributions = [
  'Built WhatsApp candidate screening with adaptive follow-ups.',
  'Building interview recording and review with Recall.ai.',
  'Contributed to resume intake, profile prefilling, and candidate summaries.',
  'Modernized the frontend and backend with reusable UI and modular TypeScript architecture.',
  'Set up Sentry, Langfuse, and PostHog for error tracking, AI evaluation, and product insights.',
]

export function ExperienceSection() {
  const stacked = useMediaQuery('(max-width: 899px)')
  return (
    <VStack as="section" id="experience" gap={5} hAlign="start" maxWidth={stacked ? 408 : 800} paddingInline={stacked ? 2 : 0} paddingBlock={stacked ? 6 : 8} className="w-full min-w-0 self-center" data-reveal="experience">
      <Heading level={2} className="text-lg! sm:text-2xl! text-(--color-text-green)!">Experience</Heading>
      <Grid columns={stacked ? 1 : 3} gap={stacked ? 3 : 8} width="100%" align="start">
        <VStack gap={1} hAlign="start" width="100%">
          <Heading level={3} id="offrolls-experience">Offrolls</Heading>
          <VStack gap={0} hAlign="start">
            <Text weight="bold">Full-stack Developer</Text>
            <Text color="secondary">Jan 2026 — Present</Text>
          </VStack>
        </VStack>
        <GridSpan columns={stacked ? 1 : 2}>
          <List listStyle="disc" density="compact" aria-labelledby="offrolls-experience" className="w-full">
            {contributions.map(contribution => (
              <ListItem key={contribution} className="py-0!" label={<Text textWrap="pretty" className="leading-snug!">{contribution}</Text>} />
            ))}
          </List>
        </GridSpan>
      </Grid>
    </VStack>
  )
}
