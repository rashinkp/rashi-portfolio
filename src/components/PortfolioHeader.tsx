import type { SVGProps } from 'react'
import type { ThemeMode } from '../hooks/useThemeMode'
import { Button } from '@astryxdesign/core/Button'
import { Icon } from '@astryxdesign/core/Icon'
import { IconButton } from '@astryxdesign/core/IconButton'
import { LayoutHeader } from '@astryxdesign/core/Layout'
import { HStack } from '@astryxdesign/core/Stack'

function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M20.35 15.35A9 9 0 0 1 8.65 3.65a9 9 0 1 0 11.7 11.7Z" />
    </svg>
  )
}

interface PortfolioHeaderProps {
  themeMode: ThemeMode
  onThemeModeChange: (mode: ThemeMode) => void
}

export function PortfolioHeader({ themeMode, onThemeModeChange }: PortfolioHeaderProps) {
  const nextTheme = themeMode === 'dark' ? 'light' : 'dark'
  const themeActionLabel = `Switch to ${nextTheme} theme`

  return (
    <LayoutHeader>
      <HStack as="header" hAlign="between" vAlign="center" wrap="wrap" gap={2}>
        <Button label="Rashin K P" variant="ghost" href="#top" />
        <HStack gap={2} wrap="wrap" vAlign="center">
          <HStack as="nav" gap={1} wrap="wrap" aria-label="Main navigation">
            <Button label="About" variant="ghost" size="sm" href="#about" />
            <Button label="Projects" variant="ghost" size="sm" href="#projects" />
            <Button label="Skills" variant="ghost" size="sm" href="#skills" />
            <Button label="Contact" variant="ghost" size="sm" href="#contact" />
          </HStack>
          <IconButton
            label={themeActionLabel}
            tooltip={themeActionLabel}
            icon={
              <Icon
                icon={themeMode === 'dark' ? SunIcon : MoonIcon}
                color="inherit"
              />
            }
            variant="ghost"
            size="sm"
            onClick={() => onThemeModeChange(nextTheme)}
          />
        </HStack>
      </HStack>
    </LayoutHeader>
  )
}
