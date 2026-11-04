import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { render } from '../dist-ssr/entry-server.js'
import { routeMetadata } from '../src/lib/seo.ts'

const output = new URL('../dist/', import.meta.url)
const template = await readFile(new URL('index.html', output), 'utf8')
const root = '<section id="root" class="min-h-svh"></section>'
if (!template.includes(root)) throw new Error('Cannot find the empty app root for pre-rendering.')

const { html, theme } = render()
if (!html.includes('hey, I’m Rashin KP') || !html.includes('id="projects"')) {
  throw new Error('Pre-rendered portfolio is missing its heading or projects.')
}

// Emit the design system's theme rules so the static page is styled before JS runs.
const themeStyles = `<style data-portfolio-theme>@layer reset {${theme.prose}}\n@layer astryx-theme {${theme.component}}</style>`
const withTheme = template.replace('</head>', `${themeStyles}\n</head>`)
await writeFile(new URL('index.html', output), withTheme.replace(root,
  `<section id="root" class="min-h-svh" data-prerendered="true">${html}</section>`,
))

// Direct chat visits mount the chat app, rather than hydrating the homepage.
await mkdir(new URL('chat/', output), { recursive: true })
const chat = routeMetadata.chat
await writeFile(new URL('chat/index.html', output), withTheme
  .replace(/<title>[^<]*<\/title>/, `<title>${chat.title}</title>`)
  .replace(/(<link rel="canonical" href=")[^"]+/, `$1${chat.url}`)
  .replace(/(<meta name="robots" content=")[^"]+/, `$1${chat.robots}`)
  .replace(/(<meta name="description" content=")[^"]+/, `$1${chat.description}`)
  .replace(/(<meta property="og:url" content=")[^"]+/, `$1${chat.url}`)
  .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]+/g, `$1${chat.title}`)
  .replace(/(<meta (?:property="og:description"|name="twitter:description") content=")[^"]+/g, `$1${chat.description}`)
  .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, ''),
)
console.log('Pre-rendered portfolio and emitted the chat app shell.')

// Vercel serves this file for unmatched paths with a real HTTP 404 status.
const missing = routeMetadata.notFound
const { html: missingHtml } = render('/404')
await writeFile(new URL('404.html', output), withTheme
  .replace(root, `<section id="root" class="min-h-svh" data-prerendered="404">${missingHtml}</section>`)
  .replace(/<title>[^<]*<\/title>/, `<title>${missing.title}</title>`)
  .replace(/(<meta name="robots" content=")[^"]+/, `$1${missing.robots}`)
  .replace(/(<meta name="description" content=")[^"]+/, `$1${missing.description}`)
  .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]+/g, `$1${missing.title}`)
  .replace(/(<meta (?:property="og:description"|name="twitter:description") content=")[^"]+/g, `$1${missing.description}`)
  .replace(/(<meta property="og:url" content=")[^"]+/, `$1${missing.url}`)
  .replace(/\s*<link rel="canonical"[^>]*>/g, '')
  .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, ''),
)
