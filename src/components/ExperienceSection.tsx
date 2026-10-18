import { Heading } from '@astryxdesign/core/Heading'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { List, ListItem } from '@astryxdesign/core/List'

const contributions = [
  'Building agentic candidate screening on WhatsApp.',
  'Recording interviews with Recall.ai for recruiter review.',
  'Turning resumes and screening responses into candidate summaries to support shortlisting.',
]

export function ExperienceSection() {
  return (
    <VStack as="section" id="experience" gap={5} hAlign="start" className="w-full min-w-0" data-reveal="experience">
      <Heading level={3} className="text-lg! sm:text-2xl! text-(--color-text-green)!">Experience</Heading>
      <VStack gap={3} hAlign="start" width="100%">
        <VStack gap={1} hAlign="start" width="100%">
          <Heading level={4} id="offrolls-experience">Offrolls</Heading>
          <HStack gap={3} wrap="wrap" hAlign="start" className="gap-y-0!">
            <Text weight="bold">Full-stack Developer</Text>
            <Text color="secondary">Jan 2026 — Present</Text>
          </HStack>
        </VStack>
        <List listStyle="disc" density="compact" aria-labelledby="offrolls-experience" className="w-full">
          {contributions.map(contribution => (
            <ListItem key={contribution} className="py-0!" label={<Text textWrap="pretty" className="leading-snug!">{contribution}</Text>} />
          ))}
        </List>
      </VStack>
    </VStack>
  )
}
