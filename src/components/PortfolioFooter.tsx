import { revealClassName } from '../hooks/useRevealOnScroll'
import { Button } from '@astryxdesign/core/Button'
import { HStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'

export function PortfolioFooter() {
  return (
    <HStack
      as="footer"
      hAlign="between"
      vAlign="center"
      wrap="wrap"
      gap={2}
      paddingBlock={6}
      data-reveal="section" className={revealClassName}
    >
      <Text type="supporting">Rashin K P · Full Stack Developer</Text>
      <Button label="Back to top" variant="ghost" size="sm" href="#top" />
    </HStack>
  )
}
