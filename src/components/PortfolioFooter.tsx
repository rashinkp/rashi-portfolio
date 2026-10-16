import { Button } from '@astryxdesign/core/Button'
import { HStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { useMediaQuery } from '@astryxdesign/core/hooks'

export function PortfolioFooter() {
  const mobile = useMediaQuery('(max-width: 639px)')
  return (
    <HStack
      as="footer"
      data-reveal="footer"
      hAlign={mobile ? 'center' : 'between'}
      vAlign="center"
      wrap="wrap"
      gap={2}
      paddingBlock={mobile ? 4 : 6}
      className="min-w-0 text-center sm:text-left"
    >
      <Text type="supporting">Rashin K P · Full-stack Product Engineer</Text>
      <Button className="min-h-10!" label="Back to top" variant="ghost" size="sm" href="#top" />
    </HStack>
  )
}
