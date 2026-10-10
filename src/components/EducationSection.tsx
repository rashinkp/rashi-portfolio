import { Heading } from '@astryxdesign/core/Heading'
import { VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'

export function EducationSection() {
  return (
    <VStack as="section" id="education" gap={1} maxWidth={560} hAlign="center" className="w-full min-w-0" data-reveal="education">
      <Heading level={3} justify="center">Background</Heading>
      <Text color="secondary" justify="center">MERN Stack · Brocamp, 2024–25</Text>
      <Text color="secondary" justify="center">BCA · University of Calicut, 2021–24</Text>
    </VStack>
  )
}
