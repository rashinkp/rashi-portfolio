import { test } from 'node:test'
import assert from 'node:assert/strict'
import { citationStream } from '../supabase/functions/_shared/chat-citations.ts'
async function collect(chunks, count = 2) {
  const readable = new ReadableStream({ start(c) { for (const chunk of chunks) c.enqueue(chunk); c.close() } })
  return Array.fromAsync(readable.pipeThrough(citationStream(count)))
}
const delta = text => ({ type: 'text-delta', id: 'answer', delta: text })
const end = { type: 'text-end', id: 'answer' }
test('citations split at any boundary normalize without losing prose', async () => {
  const text = 'Stripe 【1, 2】. More [1] facts.'
  for (let i = 1; i < text.length; i++) {
    const result = await collect([delta(text.slice(0, i)), delta(text.slice(i)), end])
    assert.equal(result.filter(c => c.type === 'text-delta').map(c => c.delta).join(''), 'Stripe [1][2]. More [1] facts.')
    assert.deepEqual(result.at(-1), end)
  }
})
test('only supplied source numbers become citations and normal links survive', async () => {
  const result = await collect([delta('Known 【1,99】 unknown [99]. [Repo](https://example.com) array [text].'), end])
  assert.equal(result.filter(c => c.type === 'text-delta').map(c => c.delta).join(''), 'Known [1] unknown . [Repo](https://example.com) array [text].')
})
test('prose streams immediately, unfinished brackets flush before text end', async () => {
  const result = await collect([delta('Answer now 【'), delta('1'), delta('】 then ['), end])
  assert.deepEqual(result[0], delta('Answer now '))
  assert.equal(result.filter(c => c.type === 'text-delta').map(c => c.delta).join(''), 'Answer now [1] then [')
  assert.deepEqual(result.at(-1), end)
})
