import test from 'node:test'
import assert from 'node:assert/strict'
import { analyticsAllowed, eventProperties } from '../src/lib/analytics-policy.ts'

test('owner, local, preview and automated visits are excluded', () => {
  assert.equal(analyticsAllowed('rashinkp.vercel.app', false, false), true)
  for (const host of ['localhost', '127.0.0.1', 'preview.vercel.app']) assert.equal(analyticsAllowed(host, false, false), false)
  assert.equal(analyticsAllowed('rashinkp.vercel.app', true, false), false)
  assert.equal(analyticsAllowed('rashinkp.vercel.app', false, true), false)
})

test('only allowlisted labels are sent; chat text and form details cannot become event properties', () => {
  assert.deepEqual(eventProperties('chat_message_sent', 'private chat message'), {})
  assert.deepEqual(eventProperties('contact_draft_opened', 'name@email.com private form message'), {})
  assert.equal(eventProperties('section_viewed', 'private query'), null)
  assert.equal(eventProperties('project_link_clicked', 'https://example.com/?email=private'), null)
  assert.equal(eventProperties('social_link_clicked', 'private@email.com'), null)
  assert.equal(eventProperties('unknown_event'), null)
  assert.deepEqual(eventProperties('project_link_clicked', 'byway:code'), { project_link: 'byway:code' })
  assert.deepEqual(eventProperties('navigation_clicked', 'projects'), { section: 'projects' })
})
