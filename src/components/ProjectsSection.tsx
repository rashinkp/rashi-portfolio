import { revealClassName } from '../hooks/useRevealOnScroll'
import { AspectRatio } from '@astryxdesign/core/AspectRatio'
import { Button } from '@astryxdesign/core/Button'
import { Card } from '@astryxdesign/core/Card'
import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { List, ListItem } from '@astryxdesign/core/List'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Token } from '@astryxdesign/core/Token'
import { featuredProjects, additionalProjects } from '../data/portfolio'

export function ProjectsSection() {
  return (
    <VStack as="section" id="projects" gap={8} paddingBlock={10} data-reveal="section" className={revealClassName}>
      <VStack gap={2} maxWidth="60ch">
        <Text type="supporting" color="accent">Selected work</Text>
        <Heading level={2}>Products built around real workflows</Heading>
        <Text color="secondary">
          Two full-stack platforms that bring together authentication, payments,
          real-time behavior, and production deployment.
        </Text>
      </VStack>
      <Grid columns={{ minWidth: 320, max: 2, repeat: 'fit' }} gap={4}>
        {featuredProjects.map((project) => (
          <Card key={project.name} padding={6} elevation="low" data-reveal="card" className={`${revealClassName} motion-safe:even:delay-(--duration-fast-max)`}>
            <VStack gap={4} height="100%">
              {project.image && project.imageAlt ? (
                <AspectRatio ratio={16 / 9} fit="cover">
                  <img
                    src={project.image}
                    alt={project.imageAlt}
                    loading="lazy"
                    data-project-image
                    className="rounded-sm border-(length:--border-width) border-border"
                  />
                </AspectRatio>
              ) : null}
              <VStack gap={1}>
                <Text type="supporting" color="accent">{project.type}</Text>
                <Heading level={3}>{project.name}</Heading>
              </VStack>
              <Text color="secondary" textWrap="pretty">{project.description}</Text>
              <List listStyle="disc" density="compact" header="Implementation highlights">
                {project.highlights.map((highlight) => (
                  <ListItem
                    key={highlight.title}
                    label={highlight.title}
                    description={
                      <Text color="secondary" textWrap="pretty">
                        {highlight.description}
                      </Text>
                    }
                  />
                ))}
              </List>
              <HStack gap={1} wrap="wrap">
                {project.stack.map((item) => (
                  <Token key={item} label={item} size="sm" />
                ))}
              </HStack>
              <HStack gap={2} wrap="wrap">
                <Button
                  label="View live"
                  variant="primary"
                  href={project.live}
                  target="_blank"
                  rel="noopener noreferrer"
                />
                <Button
                  label="View code"
                  variant="secondary"
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              </HStack>
            </VStack>
          </Card>
        ))}
      </Grid>
      <List
        density="spacious"
        hasDividers
        header={<Heading level={2}>More projects</Heading>}
        data-reveal="list" className={revealClassName}
      >
        {additionalProjects.map((project) => (
          <ListItem
            key={project.name}
            label={project.name}
            description={
              <Text color="secondary" maxLines={2}>
                {project.description}
              </Text>
            }
            href={project.github}
            target="_blank"
          />
        ))}
      </List>
    </VStack>
  )
}
