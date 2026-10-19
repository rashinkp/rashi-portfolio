import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveChatLink } from '../src/data/chat-links.ts'

test('published profiles, project links, email and source destinations are clickable', () => {
  assert.equal(resolveChatLink('linkedin.com/in/rashinkp/'), 'https://www.linkedin.com/in/rashinkp/')
  assert.equal(resolveChatLink('https://linkedin.com/in/rashinkp'), 'https://www.linkedin.com/in/rashinkp/')
  assert.equal(resolveChatLink('https://leetcode.com/u/rashinkp/'), 'https://leetcode.com/u/rashinkp/')
  assert.equal(resolveChatLink('https://github.com/rashinkp/byway'), 'https://github.com/rashinkp/byway')
  assert.equal(resolveChatLink('https://mobilify-two.vercel.app/'), 'https://mobilify-two.vercel.app/')
  assert.equal(resolveChatLink('mailto:rashinkp001@gmail.com'), 'mailto:rashinkp001@gmail.com')
  assert.equal(resolveChatLink('rashinkp001@gmail.com'), 'mailto:rashinkp001@gmail.com')
  assert.equal(resolveChatLink('/#contact'), '/#contact')
  assert.equal(resolveChatLink('/resume_rashin.pdf'), '/resume_rashin.pdf')
})

test('unknown, injected and lookalike destinations stay plain text', () => {
  for (const href of [
    'javascript:alert(1)', 'data:text/html,test', '//evil.example',
    'https://linkedin.com.evil.example/in/rashinkp/',
    'https://www.linkedin.com/in/someone-else/',
    'https://evil.example@www.linkedin.com/in/rashinkp/',
    'https://www.linkedin.com/in/rashinkp/?redirect=evil',
    'http://github.com/rashinkp', 'mailto:other@example.com',
    'mailto:rashinkp001@gmail.com?bcc=other@example.com',
  ]) assert.equal(resolveChatLink(href), null, href)
})
