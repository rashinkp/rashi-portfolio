import { Heading } from '@astryxdesign/core/Heading'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'

export function ExperienceSection() {
  return (
    <VStack as="section" id="experience" gap={5} hAlign="start" className="w-full min-w-0" data-reveal="experience">
      <Heading level={3} className="text-lg! sm:text-2xl! text-(--color-text-green)!">Experience</Heading>
      <VStack gap={2} hAlign="start">
        <Heading level={4}>Offrolls</Heading>
        <HStack gap={3} wrap="wrap" hAlign="start">
          <Text weight="bold">Full-stack Developer</Text>
          <Text color="secondary">Jan 2026 — Present</Text>
        </HStack>
        <Text textWrap="pretty">Modernizing a hiring platform with TypeScript, clearer architecture, and reusable UI.</Text>
        <Text textWrap="pretty">Building AI screening workflows and Google and Microsoft calendar integrations.</Text>
      </VStack>
    </VStack>
  )
}
