import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { routeMetadata } from '../src/lib/seo.ts'

const output = new URL('../dist/', import.meta.url)
const home = await readFile(new URL('index.html', output), 'utf8')
const chat = await readFile(new URL('chat/index.html', output), 'utf8')

test('theme is selected before stylesheet loading, including saved preferences and blocked storage', () => {
  const bootstrap = home.match(/<script>([\s\S]*?)<\/script>/)
  assert.ok(bootstrap)
  assert.ok(bootstrap.index < home.indexOf('rel="stylesheet"'))
  for (const { saved, dark, blocked, expected } of [
    { saved: null, dark: true, expected: 'dark' },
    { saved: null, dark: false, expected: 'light' },
    { saved: 'light', dark: true, expected: 'light' },
    { saved: 'dark', dark: false, expected: 'dark' },
    { saved: 'invalid', dark: true, expected: 'dark' },
    { blocked: true, dark: true, expected: 'dark' },
  ]) {
    const classes = new Set()
    const root = { dataset: {}, classList: { add: name => classes.add(name) } }
    runInNewContext(bootstrap[1], {
      document: { documentElement: root },
      localStorage: { getItem: () => { if (blocked) throw new Error('Storage unavailable'); return saved } },
      matchMedia: () => ({ matches: dark }),
    })
    assert.equal(root.dataset.colorMode, expected)
    assert.equal(root.dataset.theme, expected)
    assert.ok(classes.has(`scheme-${expected}`))
  }
})

test('homepage HTML contains the portfolio before JavaScript executes', () => {
  assert.match(home, /<h1\b[^>]*>hey, I’m Rashin KP<\/h1>/)
  assert.equal((home.match(/<h1\b/g) ?? []).length, 1)
  for (const section of ['about', 'skills', 'experience', 'projects', 'contact']) {
    assert.ok(home.includes(`id="${section}"`), `Missing ${section} section`)
  }
  for (const content of ['Offrolls', 'ByWay', 'Mobilify', 'TypeScript']) {
    assert.ok(home.includes(content), `Missing ${content}`)
  }
  assert.match(home, /href="https:\/\/github.com\/rashinkp\/byway"/)
  assert.match(home, /data-prerendered="true"/)
  assert.match(home, /<style data-portfolio-theme>/)
  assert.match(home, /<html\b[^>]*data-theme="light"[^>]*data-astryx-theme="notebook"/)
  assert.doesNotMatch(home, /opacity:0(?:;|"|})/)
})

test('chat has its own app shell rather than pre-rendered homepage content', () => {
  assert.match(chat, /<title>Ask Rashin \| Portfolio<\/title>/)
  assert.match(chat, /rel="canonical" href="https:\/\/rashinkp.vercel.app\/chat"/)
  assert.doesNotMatch(chat, /data-prerendered|<h1\b|application\/ld\+json/)
})

test('chat is excluded from search without blocking crawlers or noindexing the homepage', async () => {
  assert.match(home, /<meta name="robots" content="index, follow"/)
  assert.match(chat, /<meta name="robots" content="noindex, follow"/)
  for (const [html, metadata] of [[home, routeMetadata.home], [chat, routeMetadata.chat]]) {
    assert.ok(html.includes(`<title>${metadata.title}</title>`))
    assert.ok(html.includes(`<meta name="description" content="${metadata.description}"`))
    assert.ok(html.includes(`<link rel="canonical" href="${metadata.url}"`))
  }
  for (const attribute of ['property="og:title"', 'name="twitter:title"']) {
    assert.ok(chat.includes(`<meta ${attribute} content="${routeMetadata.chat.title}"`))
  }
  for (const attribute of ['property="og:description"', 'name="twitter:description"']) {
    assert.ok(chat.includes(`<meta ${attribute} content="${routeMetadata.chat.description}"`))
  }
  const robots = await readFile(new URL('robots.txt', output), 'utf8')
  assert.doesNotMatch(robots, /Disallow:\s*\/chat/)
  const sitemap = await readFile(new URL('sitemap.xml', output), 'utf8')
  assert.doesNotMatch(sitemap, /\/chat/)
  const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url)))
  for (const route of ['/chat', '/chat/', '/chat/index.html']) {
    assert.ok(vercel.headers.some(rule => rule.source === route && rule.headers.some(header =>
      header.key === 'X-Robots-Tag' && header.value === 'noindex, follow')))
  }
})

test('social previews and locally served fonts are included in the deployment', async () => {
  for (const html of [home, chat]) {
    assert.match(html, /property="og:image" content="https:\/\/rashinkp.vercel.app\/social-preview.jpg"/)
    assert.match(html, /name="twitter:image" content="https:\/\/rashinkp.vercel.app\/social-preview.jpg"/)
    assert.match(html, /name="twitter:card" content="summary_large_image"/)
    assert.match(html, /property="og:image:width" content="1200"/)
    assert.match(html, /property="og:image:height" content="630"/)
    assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/)
    for (const [, font] of html.matchAll(/url\(['"]?(\/fonts\/[^'")]+\.woff2)/g)) {
      const bytes = await readFile(new URL(font.slice(1), output))
      assert.equal(bytes.subarray(0, 4).toString(), 'wOF2')
    }
  }
  const preview = await readFile(new URL('social-preview.jpg', output))
  assert.equal(preview.readUInt16BE(0), 0xffd8)
  assert.ok(preview.length < 250_000, 'Keep the social preview lightweight')
})

test('project screenshots use the small WebP assets in prerendered content', async () => {
  const images = [...home.matchAll(/src="(\/projects\/[^"#?]+)"/g)]
  assert.equal(images.length, 3)
  for (const [, image] of images) {
    assert.ok(image.endsWith('.webp'))
    const bytes = await readFile(new URL(image.slice(1), output))
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP')
    assert.ok(bytes.length < 50_000)
  }
})

test('HTML assets and search discovery files are present in the deployment', async () => {
  for (const html of [home, chat]) {
    for (const [, asset] of html.matchAll(/(?:src|href)="(\/assets\/[^"#?]+)"/g)) {
      await access(new URL(asset.slice(1), output))
    }
  }
  for (const file of ['favicon.png', 'robots.txt', 'sitemap.xml', 'google00f07e7f2f1b0a64.html']) {
    await access(new URL(file, output))
  }
  const website = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(([, json]) => JSON.parse(json)).find(item => item['@type'] === 'WebSite')
  assert.equal(website?.name, 'Rashin KP')
  assert.equal(website?.url, 'https://rashinkp.vercel.app/')
  assert.match(home, /rel="icon" type="image\/png" sizes="96x96" href="\/favicon.png"/)
  const favicon = await readFile(new URL('favicon.png', output))
  assert.equal(favicon.subarray(1, 4).toString(), 'PNG')
  assert.equal(favicon.readUInt32BE(16), 96)
  assert.equal(favicon.readUInt32BE(20), 96)
})
