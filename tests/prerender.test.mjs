import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

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
