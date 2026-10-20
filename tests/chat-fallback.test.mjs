import {test} from 'node:test'
import assert from 'node:assert/strict'
import {reviewedFallback} from '../supabase/functions/_shared/chat-fallback.ts'
const controller = () => new AbortController()
test('approved primary answer does not call fallback', async () => {
  let calls = 0
  const result = await reviewedFallback({signal:controller().signal,primary:async()=> 'approved',fallback:async()=>{calls++;return 'fallback'}})
  assert.equal(result.provider,'groq');assert.equal(result.value,'approved');assert.equal(calls,0)
})
test('limits, failures and rejected grounding each use one reviewed fallback', async () => {
  for(const [error,reason] of [[Object.assign(new Error('quota'),{statusCode:429}),'rate_limit'],[new Error('unavailable'),'provider_failure'],[new Error('Answer did not pass grounding review'),'grounding']]) {
    let calls=0
    const result=await reviewedFallback({signal:controller().signal,primary:async()=>{throw error},fallback:async()=>{calls++;return 'reviewed'}})
    assert.equal(result.reason,reason);assert.equal(result.value,'reviewed');assert.equal(calls,1)
  }
})
test('primary timeout aborts it and leaves time for fallback',async()=>{
  let signal
  const result=await reviewedFallback({signal:controller().signal,primaryTimeout:5,primary:async s=>{signal=s;await new Promise(r=>setTimeout(r,25));return 'late draft'},fallback:async()=> 'reviewed'})
  assert.equal(signal.aborted,true);assert.equal(result.reason,'timeout');assert.equal(result.value,'reviewed')
})
test('visitor cancellation never starts fallback',async()=>{
  const c=controller();c.abort();let calls=0
  await assert.rejects(reviewedFallback({signal:c.signal,primary:async()=> 'unused',fallback:async()=>{calls++;return 'unused'}}))
  assert.equal(calls,0)
})
test('failure of both providers returns no draft',async()=>{
  await assert.rejects(reviewedFallback({signal:controller().signal,primary:async()=>{throw new Error('grounding review')},fallback:async()=>{throw new Error('fallback review failed')}}),error=>error.message==='Both providers failed'&&error.primaryReason==='grounding'&&error.secondaryReason==='provider_failure')
})
