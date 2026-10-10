import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/Stack'

export function SectionTitle({ children }: { children: string }) {
  const line = (
    <svg aria-hidden="true" viewBox="0 0 100 10" className="w-8 sm:w-12 md:w-24 h-3 shrink-0 text-secondary" fill="none">
      <path d="M3 6Q42 3 97 5M5 7Q53 4 95 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
  return (
    <HStack gap={3} vAlign="center" hAlign="center" className="min-w-0 max-w-full sm:gap-6!" data-reveal="heading">
      {line}
      <Heading level={2} type="display-2" justify="center" className="text-3xl! md:text-4xl!">{children}</Heading>
      {line}
    </HStack>
  )
}
