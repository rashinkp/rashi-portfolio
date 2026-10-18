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

const skills = skillGroups.flatMap(group => group.skills)

export function SkillsSection() {
  const reduced = useReducedMotion()
  const { mode } = useTheme()
  const mobile = useMediaQuery('(max-width: 899px)')
  const narrow = useMediaQuery('(max-width: 359px)')
  const columns = narrow ? 3 : 4

  return (
    <VStack as="section" id="skills" gap={mobile ? 5 : 4} hAlign="start" className="min-w-0 w-full">
      <Heading level={3} className="text-2xl! text-(--color-text-red)!" data-reveal="toolkit-heading">Tool Kit</Heading>
      <Grid columns={columns} gap={3} width="100%" maxWidth={408}>
        {skills.map((skill, index) => {
          const logo = skillLogos[skill]
          return (
            <MotionCard
              key={skill}
              variant="transparent"
              padding={mobile ? 0.5 : 1}
              elevation="none"
              className="group cursor-pointer aspect-square min-w-0 rounded-lg! border-(length:--focus-outline-width)! border-primary! transition-colors duration-(--duration-medium-min) ease-out hover:bg-inverted! motion-reduce:transition-none"
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
                    className={`${['GitHub Actions', 'WhatsApp API'].includes(skill) ? 'h-5 w-5' : 'h-7 w-7'} sm:h-10 sm:w-10 object-contain transition-[filter,background-color] duration-(--duration-medium-min) ease-out motion-reduce:transition-none ${logo.monochrome ? mode === 'dark' ? 'invert group-hover:invert-0' : 'group-hover:invert' : ''} ${['aws', 'mysql', 'docker'].includes(logo.file) ? `rounded-md p-1 group-hover:bg-on-dark ${mode === 'dark' ? 'bg-on-dark' : ''}` : ''}`}
                  />
                ) : null}
                <Text justify="center" weight="bold" textWrap="nowrap" className={`${['Playwright', 'TypeScript', 'PostgreSQL', 'GitHub Actions', 'WhatsApp API'].includes(skill) ? 'text-xs! sm:text-base!' : 'text-sm! sm:text-lg!'} whitespace-pre-line! leading-tight! group-hover:text-body! transition-colors duration-(--duration-medium-min) ease-out motion-reduce:transition-none`}>{skill === 'GitHub Actions' ? 'GitHub\nActions' : skill === 'WhatsApp API' ? 'WhatsApp\nAPI' : skill === 'Tailwind CSS' ? 'Tailwind' : skill === 'Gemini API' ? 'Gemini' : skill === 'OAuth 2.0' ? 'OAuth' : skill}</Text>
              </VStack>
            </MotionCard>
          )
        })}
      </Grid>
    </VStack>
  )
}
