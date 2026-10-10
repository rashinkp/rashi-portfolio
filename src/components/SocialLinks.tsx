import type { SVGProps } from 'react'
import { useReducedMotion } from 'motion/react'
import { IconButton } from '@astryxdesign/core/IconButton'
import { Heading } from '@astryxdesign/core/Heading'
import { Icon } from '@astryxdesign/core/Icon'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { MotionVStack, noteSpring, spacingToken } from '../lib/motion'

function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.33-3.8-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.94.1-.73.4-1.22.71-1.5-2.5-.29-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15A10.8 10.8 0 0 1 12 6.17c.96 0 1.91.13 2.81.38 2.15-1.46 3.09-1.15 3.09-1.15.61 1.55.23 2.7.12 2.98.72.79 1.15 1.79 1.15 3.02 0 4.33-2.63 5.27-5.14 5.55.41.35.77 1.04.77 2.09v3.09c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" /></svg>
}
function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7.5 10v7M11.5 17v-7m0 3a3 3 0 0 1 6 0v4" /><circle cx="7.5" cy="7" r=".6" fill="currentColor" /></svg>
}
function LeetCodeIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m15 3-9 9a5 5 0 0 0 0 7l1 1a5 5 0 0 0 7 0l2-2M7 11l1-1a5 5 0 0 1 7 0l2 2M11 15h10" /></svg>
}
function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" stroke="none" /></svg>
}
function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 19 19 5M5 5h14v14" /></svg>
}

const profiles = [
  { label: 'GitHub', href: 'https://github.com/rashinkp', icon: GitHubIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/rashinkp/', icon: LinkedInIcon },
  { label: 'LeetCode', href: 'https://leetcode.com/u/rashinkp/', icon: LeetCodeIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/rash.e_/', icon: InstagramIcon },
]

export function SocialLinks() {
  const reduced = useReducedMotion()
  return (
    <VStack gap={4} hAlign="start" data-reveal="social-links">
      <Heading level={3} className="text-2xl! text-(--color-text-purple)!">Stalk Me Here</Heading>
      <HStack as="nav" aria-label="Social profiles" gap={4} wrap="wrap" hAlign="start">
        {profiles.map(profile => (
          <MotionVStack key={profile.label} whileHover={reduced ? undefined : { y: -spacingToken('--spacing-1'), rotate: -8, scale: 1.08 }} whileTap={reduced ? undefined : { scale: 0.96 }} transition={noteSpring}>
            <IconButton label={profile.label} tooltip={profile.label} icon={
              <VStack gap={0} className="relative w-6 h-6" aria-hidden="true">
                <Icon icon={profile.icon} size="md" color="inherit" className="absolute inset-0 transition-[opacity,transform] duration-(--duration-medium-min) ease-out group-hover:opacity-0 group-hover:scale-25 group-focus-visible:opacity-0 group-focus-visible:scale-25 motion-reduce:transition-none" />
                <Icon icon={ArrowIcon} size="md" color="inherit" className="absolute inset-0 opacity-0 scale-25 transition-[opacity,transform] duration-(--duration-medium-min) ease-out group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100 motion-reduce:transition-none" />
              </VStack>
            } href={profile.href} target="_blank" rel="noopener noreferrer" variant="ghost" className="group w-10! h-10! min-w-10! min-h-10! p-2! rounded-lg! border-(length:--focus-outline-width)! border-primary! transition-colors duration-(--duration-medium-min) ease-out hover:bg-(--color-background-blue)! hover:text-on-dark! focus-visible:bg-(--color-background-blue)! focus-visible:text-on-dark! motion-reduce:transition-none" />
          </MotionVStack>
        ))}
      </HStack>
    </VStack>
  )
}
