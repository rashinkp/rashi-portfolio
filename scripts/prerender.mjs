import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { render } from '../dist-ssr/entry-server.js'

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
await writeFile(new URL('chat/index.html', output), withTheme
  .replace('<title>Rashin KP | Full-stack Product Engineer</title>', '<title>Ask Rashin | Portfolio</title>')
  .replace('<link rel="canonical" href="https://rashinkp.vercel.app/" />', '<link rel="canonical" href="https://rashinkp.vercel.app/chat" />')
  .replace('<meta property="og:url" content="https://rashinkp.vercel.app/" />', '<meta property="og:url" content="https://rashinkp.vercel.app/chat" />')
  .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, ''),
)
console.log('Pre-rendered portfolio and emitted the chat app shell.')
