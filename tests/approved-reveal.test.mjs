import {test} from 'node:test'
import assert from 'node:assert/strict'
import {revealApprovedAnswer} from '../supabase/functions/_shared/approved-reveal.ts'

test('approved text appears progressively without changing markdown or citations', async()=>{
  const answer='  **Reviewed** answer [1][2].\n\n- Visit [the project](https://example.com).\n'
  const chunks=[]
  const pending=revealApprovedAnswer({answer,signal:new AbortController().signal,write:text=>chunks.push(text)})
  assert.ok(chunks.length>0 && chunks.join('').length<answer.length)
  await pending
  assert.equal(chunks.join(''),answer)
  assert.ok(chunks.includes('[1][2].\n\n'))
})
test('reduced motion shows the approved answer immediately',async()=>{
  const chunks=[]
  await revealApprovedAnswer({answer:'Approved answer [1].',reducedMotion:true,signal:new AbortController().signal,write:text=>chunks.push(text)})
  assert.deepEqual(chunks,['Approved answer [1].'])
})
test('stop cancels pacing and no later words appear',async()=>{
  const controller=new AbortController(),chunks=[]
  const pending=revealApprovedAnswer({answer:'Approved words that should stop here.',signal:controller.signal,write:text=>chunks.push(text)})
  controller.abort()
  await assert.rejects(pending,{name:'AbortError'})
  const stopped=chunks.join('')
  await new Promise(resolve=>setTimeout(resolve,40))
  assert.equal(chunks.join(''),stopped)
  assert.ok(stopped.length<'Approved words that should stop here.'.length)
})
