import { useReducedMotion } from 'motion/react'
import { useTheme } from '@astryxdesign/core/theme'
import { useMediaQuery } from '@astryxdesign/core/hooks'
import { Grid } from '@astryxdesign/core/Grid'
import { VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { MotionCard, noteSpring, revealSpring, spacingToken, durationToken } from '../lib/motion'
import { Heading } from '@astryxdesign/core/Heading'
import { skillGroups } from '../data/portfolio'
import { skillLogos } from '../data/skillLogos'

const labels: Record<string, string> = {
  'GitHub Actions': 'GitHub\nActions',
  'WhatsApp API': 'WhatsApp\nAPI',
  'Google APIs': 'Google\nAPIs',
  'Microsoft Calendar': 'Microsoft\nCalendar',
}

export function SkillsSection() {
  const reduced = useReducedMotion()
  const { mode } = useTheme()
  const mobile = useMediaQuery('(max-width: 899px)')
  const narrow = useMediaQuery('(max-width: 359px)')
  const columns = narrow ? 3 : 4

  return (
    <VStack as="section" id="skills" gap={mobile ? 5 : 4} hAlign="start" className="min-w-0 w-full">
      <Heading level={3} className="text-2xl! text-(--color-text-red)!" data-reveal="toolkit-heading">Tool Kit</Heading>
      <VStack gap={6} width="100%" maxWidth={408}>
        {skillGroups.map(group => (
          <VStack as="section" key={group.title} gap={2} width="100%" hAlign="start" aria-label={group.title}>
            <Heading level={4} className="text-base! text-secondary!">{group.title}</Heading>
            <Grid columns={columns} gap={3} width="100%">
              {group.skills.map((skill, index) => {
                const logo = skillLogos[skill]
                return (
                  <MotionCard
                    key={skill}
                    variant="transparent"
                    padding={0.5}
                    elevation="none"
                    className="group cursor-pointer aspect-5/4 min-h-16 min-w-0 rounded-lg! border-(length:--focus-outline-width)! border-primary! transition-colors duration-(--duration-medium-min) ease-out hover:bg-inverted! motion-reduce:transition-none"
                    data-skill-tile={skill}
                    initial={reduced ? false : { opacity: 0, y: spacingToken('--spacing-8') }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{ ...revealSpring, delay: reduced ? 0 : (index % columns) * durationToken(document.documentElement, '--duration-fast-min', 0.13) }}
                    whileHover={reduced ? undefined : { scale: 1.06, rotate: index % 2 ? 4 : -4, transition: noteSpring }}
                  >
                    <VStack gap={1} hAlign="center" vAlign="center" height="100%">
                      {logo ? (
                        <img
                          src={`/skills/${logo.file}.${logo.extension ?? 'svg'}`}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className={`${skill === 'OCI' ? 'h-6 w-12' : skill === 'AWS' ? 'h-6 w-9' : labels[skill] ? 'h-5 w-5' : 'h-6 w-6'} object-contain transition-[filter,background-color] duration-(--duration-medium-min) ease-out motion-reduce:transition-none ${logo.monochrome ? mode === 'dark' ? 'invert group-hover:invert-0' : 'group-hover:invert' : ''} ${['aws', 'mysql', 'docker'].includes(logo.file) ? `rounded-md ${logo.file === 'aws' ? 'p-0.5' : 'p-1'} group-hover:bg-on-dark ${mode === 'dark' ? 'bg-on-dark' : ''}` : ''}`}
                        />
                      ) : null}
                      <Text justify="center" weight="bold" textWrap="nowrap" className="text-xs! whitespace-pre-line! leading-tight! group-hover:text-body! transition-colors duration-(--duration-medium-min) ease-out motion-reduce:transition-none">{labels[skill] ?? skill}</Text>
                    </VStack>
                  </MotionCard>
                )
              })}
            </Grid>
          </VStack>
        ))}
      </VStack>
    </VStack>
  )
}
