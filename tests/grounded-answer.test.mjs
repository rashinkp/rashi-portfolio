import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groundedAnswer } from '../supabase/functions/_shared/grounded-answer.ts'
test('rejects unsupported draft, uses feedback, and returns only reviewed answer', async () => {
  const feedback = []; let drafts = 0
  const answer = await groundedAnswer({ sourceCount: 1,
    draft: async note => { feedback.push(note); return ++drafts === 1 ? 'Uses subscriptions 【1】.' : 'Uses Stripe webhooks 【1】.' },
    review: async text => JSON.stringify(text.includes('subscriptions') ? { supported: false, issues: ['Subscription billing is not stated.'] } : { supported: true, issues: [] }),
  })
  assert.equal(answer, 'Uses Stripe webhooks [1].')
  assert.equal(drafts, 2)
  assert.match(feedback[1], /not stated/)
})
test('unsupported answers have a bounded retry and cannot be returned', async () => {
  let drafts = 0
  await assert.rejects(groundedAnswer({ sourceCount: 1, draft: async () => { drafts++; return 'Unsupported [1].' }, review: async () => '{"supported":false,"issues":["Missing evidence"]}' }), /did not pass/)
  assert.equal(drafts, 2)
})
test('malformed or contradictory reviews fail closed', async () => {
  for (const review of ['not JSON', '{"supported":true}', '{"supported":true,"issues":["Unsupported detail"]}']) {
    await assert.rejects(groundedAnswer({ sourceCount: 1, draft: async () => 'Draft [1].', review: async () => review }))
  }
})
