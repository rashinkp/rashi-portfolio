import {test} from 'node:test'
import assert from 'node:assert/strict'
import {chatViewportHeight} from '../src/lib/chatViewport.ts'

test('keyboard open/close tracks the visible area even when layout height does not change',()=>{
  const browser={innerHeight:844,visualViewport:{height:844,offsetTop:0,scale:1}}
  assert.equal(chatViewportHeight(browser),844)
  browser.visualViewport.height=440
  assert.equal(chatViewportHeight(browser),440)
  browser.visualViewport.height=844
  assert.equal(chatViewportHeight(browser),844)
})
test('viewport panning, rotation, and repeated resizes keep the composer at the visible bottom',()=>{
  assert.equal(chatViewportHeight({innerHeight:844,visualViewport:{height:380,offsetTop:60,scale:1}}),440)
  assert.equal(chatViewportHeight({innerHeight:390,visualViewport:{height:220,offsetTop:0,scale:1}}),220)
  assert.equal(chatViewportHeight({innerHeight:440,visualViewport:{height:844,offsetTop:0,scale:1}}),440)
})
test('pinch zoom and unavailable viewport metrics retain the CSS layout fallback',()=>{
  assert.equal(chatViewportHeight({innerHeight:844}),undefined)
  assert.equal(chatViewportHeight({innerHeight:844,visualViewport:{height:400,offsetTop:0,scale:2}}),undefined)
  assert.equal(chatViewportHeight({innerHeight:844,visualViewport:{height:0,offsetTop:0,scale:1}}),undefined)
})
