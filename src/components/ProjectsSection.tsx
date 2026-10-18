import { useReducedMotion } from 'motion/react'
import { useMediaQuery } from '@astryxdesign/core/hooks'
import { AspectRatio } from '@astryxdesign/core/AspectRatio'
import { Button } from '@astryxdesign/core/Button'
import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { MotionCard, noteSpring, spacingToken } from '../lib/motion'
import { featuredProjects } from '../data/portfolio'
import { SectionTitle } from './SectionTitle'

export function ProjectsSection() {
  const reduced = useReducedMotion()
  const mobile = useMediaQuery('(max-width: 639px)')
  return (
    <VStack as="section" id="projects" gap={mobile ? 6 : 8} hAlign="center" className="min-w-0 py-8 sm:py-10 md:py-16">
      <SectionTitle>Projects</SectionTitle>
      <VStack gap={4} width="100%" maxWidth={mobile ? 408 : 640} paddingInline={mobile ? 2 : 0}>
        {featuredProjects.map(project => (
          <MotionCard key={project.name} variant="transparent" padding={mobile ? 2 : 3} elevation="none" data-reveal="project" className="min-w-0 rounded-lg! border-(length:--focus-outline-width)! border-secondary/60!" whileHover={reduced ? undefined : { y: -spacingToken('--spacing-1') }} transition={noteSpring}>
            <Grid columns={{ minWidth: 220, max: 2, repeat: 'fit' }} gap={mobile ? 3 : 4} align="center">
              <AspectRatio ratio={mobile ? 12 / 5 : 16 / 10} fit="cover">
                <img src={project.image} alt={project.imageAlt} loading="lazy" data-project-image className="w-full h-full object-cover rounded-md" />
              </AspectRatio>
              <VStack gap={mobile ? 1 : 2} hAlign="start" className="min-w-0">
                <Text type="supporting" color="accent">{project.type} · Learning project</Text>
                <Heading level={3} className="text-xl! sm:text-2xl!">{project.name}</Heading>
                <Text textWrap="pretty" className="text-base! sm:text-lg!">{project.description}</Text>
                <HStack gap={2} wrap="wrap">
                  <Button label="Live ↗" aria-label={`View ${project.name} live`} variant="ghost" href={project.live} target="_blank" rel="noopener noreferrer" className="min-h-10!" />
                  <Button label="Code ↗" aria-label={`View ${project.name} source code`} variant="ghost" href={project.github} target="_blank" rel="noopener noreferrer" className="min-h-10!" />
                </HStack>
              </VStack>
            </Grid>
          </MotionCard>
        ))}
      </VStack>
      <Button label="More on GitHub ↗" variant="ghost" href="https://github.com/rashinkp?tab=repositories" target="_blank" rel="noopener noreferrer" className="min-h-10!" />
    </VStack>
  )
}
