import { useEffect, useLayoutEffect, useState } from 'react'
import type { SVGProps } from 'react'
import { AspectRatio } from '@astryxdesign/core/AspectRatio'
import { Button } from '@astryxdesign/core/Button'
import { Card } from '@astryxdesign/core/Card'
import { Center } from '@astryxdesign/core/Center'
import { Divider } from '@astryxdesign/core/Divider'
import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { Icon } from '@astryxdesign/core/Icon'
import { IconButton } from '@astryxdesign/core/IconButton'
import {
  Layout,
  LayoutContent,
  LayoutHeader,
} from '@astryxdesign/core/Layout'
import { List, ListItem } from '@astryxdesign/core/List'
import { Section } from '@astryxdesign/core/Section'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Spinner } from '@astryxdesign/core/Spinner'
import { Text } from '@astryxdesign/core/Text'
import { Theme } from '@astryxdesign/core/theme'
import { Token } from '@astryxdesign/core/Token'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'

const skillGroups = [
  {
    title: 'Frontend',
    skills: [
      'React',
      'Next.js',
      'TypeScript',
      'React Router',
      'TanStack Query',
      'React Hook Form',
      'Tailwind CSS',
      'Responsive UI',
    ],
  },
  {
    title: 'Backend',
    skills: [
      'Node.js',
      'Express',
      'NestJS',
      'REST APIs',
      'Zod',
    ],
  },
  {
    title: 'Databases',
    skills: [
      'MongoDB',
      'MySQL',
      'PostgreSQL',
      'SQL',
      'Kysely',
      'Indexing',
      'Aggregation',
    ],
  },
  {
    title: 'AI & Python',
    skills: [
      'Python',
      'FastAPI',
      'Gemini API',
      'Embeddings',
      'Resume Parsing',
      'Candidate Scoring',
      'Semantic Similarity',
    ],
  },
  {
    title: 'Authentication & security',
    skills: [
      'JWT',
      'Refresh Tokens',
      'OAuth 2.0 + PKCE',
      'RBAC',
      'HttpOnly Cookies',
      'Multi-tenant Isolation',
    ],
  },
  {
    title: 'Integrations',
    skills: [
      'Google Calendar',
      'Microsoft Teams Calendar',
      'Socket.IO',
      'WhatsApp Cloud API',
      'OCI Object Storage',
      'OneSignal',
      'Stripe',
      'Razorpay',
    ],
  },
  {
    title: 'Cloud & deployment',
    skills: [
      'AWS EC2',
      'Amazon S3',
      'Railway',
      'Vercel',
      'Render',
      'Docker',
    ],
  },
  {
    title: 'Engineering',
    skills: [
      'Clean Architecture',
      'Modular Monolith',
      'Vitest',
      'Pytest',
      'Playwright',
      'Sentry',
      'Git',
    ],
  },
]

const offrollsHighlights = [
  {
    title: 'Full-stack product workflows',
    description: 'Multi-role React interfaces and modular TypeScript REST APIs.',
  },
  {
    title: 'AI-assisted hiring',
    description: 'Resume parsing, candidate scoring, and screening workflows.',
  },
  {
    title: 'Calendar automation',
    description: 'Google Calendar and Microsoft Teams calendar integration with OAuth 2.0 and PKCE.',
  },
  {
    title: 'Security and real-time systems',
    description: 'Authentication, RBAC, live updates, and market-aware data isolation.',
  },
]

const offrollsStack = [
  'React',
  'TypeScript',
  'Node.js',
  'Express',
  'MySQL',
  'Python',
  'FastAPI',
  'Gemini',
  'Socket.IO',
  'OAuth 2.0',
]

const featuredProjects = [
  {
    name: 'ByWay',
    type: 'Learning platform',
    description:
      'A multi-role e-learning platform where students purchase courses, learn through interactive content, apply as tutors, and earn certificates.',
    highlights: [
      'Role-based tutor onboarding',
      'Google and Facebook OAuth',
      'Stripe webhook payments',
      'Socket.IO chat and notifications',
    ],
    stack: ['Next.js', 'TypeScript', 'Stripe', 'Socket.IO', 'Docker'],
    image: '/projects/byway-preview.png',
    imageAlt: 'ByWay learning platform landing page',
    live: 'https://byway-3yj3.onrender.com/',
    github: 'https://github.com/rashinkp/byway',
  },
  {
    name: 'Mobilify',
    type: 'E-commerce platform',
    description:
      'An end-to-end commerce system with secure checkout, wallet support, and automated inventory and order workflows.',
    highlights: [
      'Redux Toolkit and RTK Query',
      'Node.js, Express, and MongoDB',
      'Razorpay payments and refunds',
      'Live stock and order updates on AWS',
    ],
    stack: ['React', 'Node.js', 'MongoDB', 'Razorpay', 'AWS'],
    image: '/projects/mobilify-preview.png',
    imageAlt: 'Mobilify electronics storefront landing page',
    live: 'https://mobilify-two.vercel.app/',
    github: 'https://github.com/rashinkp/mobilify',
  },
]

const additionalProjects = [
  {
    name: 'LinkUp — Real-Time Chat',
    description:
      'One-to-one messaging with live delivery, presence updates, dynamic theming, and an event-driven React, Express, MongoDB, and Socket.IO architecture.',
    github: 'https://github.com/rashinkp/linkup',
  },
  {
    name: 'Wholesale Delivery Management',
    description:
      'A NestJS logistics system for wholesalers, vendors, inventory, and delivery orders with JWT authentication and role-based access.',
    github: 'https://github.com/rashinkp/Delivery-Management',
  },
  {
    name: 'Aadhaar OCR Extraction',
    description:
      'A document-processing service using Node.js, Express, Tesseract OCR, and MongoDB to validate Aadhaar images and extract user details.',
    github: 'https://github.com/rashinkp/adhaar-ocr',
  },
  {
    name: 'Student Management System',
    description:
      'A record and attendance platform with Google OAuth, admin CRUD workflows, Express, HBS, MongoDB, and an MVC structure.',
    github: 'https://github.com/rashinkp/Student-Management-System',
  },
]

type ThemeMode = 'light' | 'dark'

const themeStorageKey = 'rashin-portfolio-theme'

function getInitialThemeMode(): ThemeMode {
  try {
    const savedMode = window.localStorage.getItem(themeStorageKey)
    if (savedMode === 'light' || savedMode === 'dark') {
      return savedMode
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

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

function useRevealOnScroll() {
  useLayoutEffect(() => {
    const root = document.documentElement
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]'),
    )

    root.dataset.motion = 'ready'

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((element) => {
        element.dataset.revealed = 'true'
      })
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement
            element.dataset.revealed = 'true'
            observer.unobserve(element)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0% 0% -8% 0%' },
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [])
}

interface AppProps {
  themeMode: ThemeMode
  onThemeModeChange: (mode: ThemeMode) => void
}

function PortfolioPage({ themeMode, onThemeModeChange }: AppProps) {
  useRevealOnScroll()

  const nextTheme = themeMode === 'dark' ? 'light' : 'dark'
  const themeActionLabel = `Switch to ${nextTheme} theme`

  return (
    <Layout
      height="auto"
      contentWidth={960}
      padding={6}
      defaultHasDividers
      header={
        <LayoutHeader>
          <HStack as="header" hAlign="between" vAlign="center" wrap="wrap" gap={2}>
            <Button label="Rashin K P" variant="ghost" href="#top" />
            <HStack gap={2} wrap="wrap" vAlign="center">
              <HStack as="nav" gap={1} wrap="wrap" aria-label="Main navigation">
                <Button label="About" variant="ghost" size="sm" href="#about" />
                <Button label="Skills" variant="ghost" size="sm" href="#skills" />
                <Button label="Projects" variant="ghost" size="sm" href="#projects" />
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
      }
      content={
        <LayoutContent>
          <VStack as="main" id="top" gap={0}>
            <VStack as="section" gap={6} maxWidth="60ch" paddingBlock={10}>
              <Text type="supporting" color="accent" data-reveal="hero-1">
                Full Stack Developer · MERN and SaaS products · Professional experience since January 2026
              </Text>
              <Heading level={1} type="display-1" textWrap="balance" data-reveal="hero-2">
                I build full-stack products that work end to end.
              </Heading>
              <Text type="large" color="secondary" textWrap="pretty" data-reveal="hero-3">
                I’m Rashin K P, a self-taught developer focused on scalable web applications,
                clean architecture, secure APIs, real-time systems, and cloud deployment.
              </Text>
              <HStack gap={2} wrap="wrap" data-reveal="hero-4">
                <Button label="Explore projects" variant="primary" size="lg" href="#projects" />
                <Button
                  label="Download résumé"
                  variant="secondary"
                  size="lg"
                  href="/resume_rashin.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                />
                <Button
                  label="GitHub"
                  variant="ghost"
                  size="lg"
                  href="https://github.com/rashinkp"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              </HStack>
            </VStack>

            <VStack
              as="section"
              id="about"
              gap={3}
              maxWidth="60ch"
              paddingBlock={10}
              data-reveal="section"
            >
              <Text type="supporting" color="accent">About</Text>
              <Heading level={2}>Building beyond the interface</Heading>
              <Text color="secondary" textWrap="pretty">
                My work spans responsive React interfaces, TypeScript APIs, secure authentication,
                AI-assisted workflows, real-time communication, and cloud deployment. I care about
                modular code, reliable user journeys, and understanding how the whole product fits
                together.
              </Text>
            </VStack>

            <Divider />

            <VStack
              as="section"
              id="experience"
              gap={6}
              paddingBlock={10}
              data-reveal="section"
            >
              <VStack gap={2} maxWidth="60ch">
                <Text type="supporting" color="accent">Experience</Text>
                <Heading level={2}>Building recruitment workflows across web, APIs, and AI</Heading>
                <Text color="secondary" textWrap="pretty">
                  At Offrolls, I help develop a multi-role recruitment platform for employers,
                  recruiters, vendors, candidates, and administrators.
                </Text>
              </VStack>
              <Card padding={6} elevation="low">
                <VStack gap={4}>
                  <HStack hAlign="between" vAlign="start" wrap="wrap" gap={2}>
                    <VStack gap={1}>
                      <Heading level={3}>Software Developer</Heading>
                      <Text color="accent">Offrolls · Bengaluru, India</Text>
                    </VStack>
                    <Token label="Since January 2026" size="sm" />
                  </HStack>
                  <VStack maxWidth="60ch">
                    <Text color="secondary" textWrap="pretty">
                      The product supports hiring operations across India and Kuwait, including
                      job and application management, candidate screening, interview scheduling,
                      subscriptions, payouts, and administrative workflows.
                    </Text>
                  </VStack>
                  <List listStyle="disc" density="compact" header="Selected contributions">
                    {offrollsHighlights.map((highlight) => (
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
                    {offrollsStack.map((item) => (
                      <Token key={item} label={item} size="sm" />
                    ))}
                  </HStack>
                  <HStack gap={2} wrap="wrap">
                    <Button
                      label="Company website"
                      variant="primary"
                      href="https://offrolls.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                    <Button
                      label="Offrolls on LinkedIn"
                      variant="secondary"
                      href="https://www.linkedin.com/company/offrolls.com?originalSubdomain=in"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  </HStack>
                </VStack>
              </Card>
            </VStack>

            <Divider />

            <VStack as="section" id="skills" gap={6} paddingBlock={10} data-reveal="section">
              <VStack gap={2} maxWidth="60ch">
                <Text type="supporting" color="accent">Skills</Text>
                <Heading level={2}>Tools I use to ship products</Heading>
                <Text color="secondary">
                  A practical stack covering product interfaces, APIs, databases, integrations,
                  testing, and delivery.
                </Text>
              </VStack>
              <Grid columns={{ minWidth: 280, max: 2, repeat: 'fit' }} gap={6}>
                {skillGroups.map((group) => (
                  <VStack key={group.title} gap={2}>
                    <Heading level={3}>{group.title}</Heading>
                    <HStack gap={1} wrap="wrap">
                      {group.skills.map((skill) => (
                        <Token key={skill} label={skill} size="sm" />
                      ))}
                    </HStack>
                  </VStack>
                ))}
              </Grid>
            </VStack>

            <Divider />

            <VStack as="section" id="projects" gap={8} paddingBlock={10} data-reveal="section">
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
                  <Card key={project.name} padding={6} elevation="low" data-reveal="card">
                    <VStack gap={4} height="100%">
                      {project.image && project.imageAlt ? (
                        <AspectRatio ratio={16 / 9} fit="cover">
                          <img
                            src={project.image}
                            alt={project.imageAlt}
                            loading="lazy"
                            data-project-image
                          />
                        </AspectRatio>
                      ) : null}
                      <VStack gap={1}>
                        <Text type="supporting" color="accent">{project.type}</Text>
                        <Heading level={3}>{project.name}</Heading>
                      </VStack>
                      <Text color="secondary" textWrap="pretty">{project.description}</Text>
                      <List listStyle="disc" density="compact" header="What it includes">
                        {project.highlights.map((highlight) => (
                          <ListItem key={highlight} label={highlight} />
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
                data-reveal="list"
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

            <Divider />

            <VStack as="section" gap={5} paddingBlock={10} data-reveal="section">
              <VStack gap={2}>
                <Text type="supporting" color="accent">Education</Text>
                <Heading level={2}>Learning by building</Heading>
              </VStack>
              <List density="spacious" hasDividers header="Education and training">
                <ListItem
                  label="MERN Stack Development"
                  description="Brocamp (Brototype) · 2024 – 2025"
                />
                <ListItem
                  label="Bachelor of Computer Applications"
                  description="University of Calicut, Kerala · 2021 – 2024"
                />
              </List>
            </VStack>

            <Section variant="muted" padding={8}>
              <VStack
                as="section"
                id="contact"
                gap={4}
                maxWidth="60ch"
                data-reveal="section"
              >
                <Text type="supporting" color="accent">Contact</Text>
                <Heading level={2} textWrap="balance">Have a project or opportunity in mind?</Heading>
                <Text color="secondary" textWrap="pretty">
                  I’m open to full-stack development opportunities and collaborations where I can
                  contribute, learn, and help ship useful software.
                </Text>
                <HStack gap={2} wrap="wrap">
                  <Button
                    label="Email me"
                    variant="primary"
                    href="mailto:rashinkp001@gmail.com"
                  />
                  <Button
                    label="LinkedIn"
                    variant="secondary"
                    href="https://www.linkedin.com/in/rashinkp/"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                  <Button
                    label="LeetCode"
                    variant="ghost"
                    href="https://leetcode.com/u/rashinkp/"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                </HStack>
              </VStack>
            </Section>

            <Divider />

            <HStack
              as="footer"
              hAlign="between"
              vAlign="center"
              wrap="wrap"
              gap={2}
              paddingBlock={6}
              data-reveal="section"
            >
              <Text type="supporting">Rashin K P · Full Stack Developer</Text>
              <Button label="Back to top" variant="ghost" size="sm" href="#top" />
            </HStack>
          </VStack>
        </LayoutContent>
      }
    />
  )
}

function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode)
  const [isLoading, setIsLoading] = useState(() => document.readyState !== 'complete')

  useEffect(() => {
    if (!isLoading) {
      return
    }

    const handleLoad = () => setIsLoading(false)
    window.addEventListener('load', handleLoad, { once: true })

    return () => window.removeEventListener('load', handleLoad)
  }, [isLoading])

  const handleThemeModeChange = (mode: ThemeMode) => {
    setThemeMode(mode)

    try {
      window.localStorage.setItem(themeStorageKey, mode)
    } catch {
      // The selected mode still works for this session when storage is unavailable.
    }
  }

  return (
    <Theme theme={neutralTheme} mode={themeMode}>
      {isLoading ? (
        <Center minHeight="100svh">
          <Spinner size="lg" label="Loading portfolio" />
        </Center>
      ) : (
        <PortfolioPage
          themeMode={themeMode}
          onThemeModeChange={handleThemeModeChange}
        />
      )}
    </Theme>
  )
}

export default App
