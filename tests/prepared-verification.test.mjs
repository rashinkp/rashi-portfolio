import test from 'node:test'
import assert from 'node:assert/strict'
import { PreparedVerification } from '../src/lib/preparedVerification.ts'

function fixture() {
  let runs = 0
  let now = 0
  const session = new PreparedVerification(() => runs++, () => {}, () => now)
  return { session, runs: () => runs, advance: milliseconds => { now += milliseconds } }
}

test('prepares once and consumes each prepared token only once', async () => {
  const { session, runs } = fixture()
  session.prepare(); session.prepare()
  assert.equal(runs(), 1)
  session.succeed('first')
  assert.equal(await session.verify(), 'first')
  const next = session.verify()
  assert.equal(runs(), 2)
  session.succeed('second')
  assert.equal(await next, 'second')
})

test('sending joins a challenge in flight instead of restarting verification', async () => {
  const { session, runs } = fixture()
  session.prepare()
  const result = session.verify()
  assert.equal(runs(), 1)
  session.succeed('prepared-during-typing')
  assert.equal(await result, 'prepared-during-typing')
})

test('expired cached tokens require a fresh challenge', async () => {
  const { session, runs, advance } = fixture()
  session.prepare(); session.succeed('stale')
  advance(240000)
  const result = session.verify()
  assert.equal(runs(), 2)
  session.succeed('fresh')
  assert.equal(await result, 'fresh')
})

test('stop cancels verification and late callbacks cannot supply a token', async () => {
  const { session, runs } = fixture()
  const controller = new AbortController()
  const result = session.verify(controller.signal)
  controller.abort()
  await assert.rejects(result, error => error.name === 'AbortError')
  session.succeed('late-cancelled-token')
  const next = session.verify()
  assert.equal(runs(), 2)
  session.succeed('new-request')
  assert.equal(await next, 'new-request')
})

test('an already-aborted send does not consume the prepared token', async () => {
  const { session } = fixture()
  session.prepare(); session.succeed('unused')
  await assert.rejects(session.verify(AbortSignal.abort()), error => error.name === 'AbortError')
  assert.equal(await session.verify(), 'unused')
})

test('background failure is recoverable and parallel sends cannot share a token', async () => {
  const { session, runs } = fixture()
  session.prepare(); session.fail(new Error('Challenge unavailable'))
  const first = session.verify()
  await assert.rejects(session.verify(), /already running/)
  assert.equal(runs(), 2)
  session.succeed('fresh')
  assert.equal(await first, 'fresh')
})

test('unmount rejects pending verification and discards cached tokens', async () => {
  const { session, runs } = fixture()
  const result = session.verify()
  session.dispose()
  await assert.rejects(result, error => error.name === 'AbortError')
  session.succeed('late-unmounted-token')
  const retry = session.verify()
  assert.equal(runs(), 2)
  session.succeed('fresh')
  assert.equal(await retry, 'fresh')
})

test('a stalled challenge times out and permits a subsequent retry', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { session, runs } = fixture()
  const result = session.verify()
  t.mock.timers.tick(60000)
  await assert.rejects(result, /Security check failed/)
  const retry = session.verify()
  assert.equal(runs(), 2)
  session.succeed('retry')
  assert.equal(await retry, 'retry')
})

test('idle expiry refreshes without turning a successful check into a message error',async()=>{
  const {session,runs}=fixture()
  session.prepare();session.succeed('idle-token')
  assert.equal(session.expire('idle-token'),true)
  session.prepare()
  assert.equal(runs(),2)
  const waiting=session.verify()
  session.succeed('refreshed')
  assert.equal(await waiting,'refreshed')
})
test('late expiry cannot discard a newer token or interrupt an in-flight send',async()=>{
  const {session}=fixture()
  session.prepare();session.succeed('old')
  assert.equal(await session.verify(),'old')
  const waiting=session.verify()
  assert.equal(session.expire('old'),false)
  session.succeed('new')
  assert.equal(await waiting,'new')
  session.prepare();session.succeed('latest')
  assert.equal(session.expire('old'),false)
  assert.equal(await session.verify(),'latest')
})


test('human interaction suspends the send deadline and success resumes the same question', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { session, runs } = fixture()
  const result = session.verify()
  t.mock.timers.tick(59000)
  session.setInteractive(true)
  t.mock.timers.tick(180000)
  assert.equal(runs(), 1)
  assert.equal(session.succeed('human-verified'), 'consumed')
  assert.equal(await result, 'human-verified')
})

test('a challenge visible before send also waits for the human without timing out', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { session } = fixture()
  session.prepare()
  session.setInteractive(true)
  const result = session.verify()
  t.mock.timers.tick(120000)
  session.setInteractive(false)
  t.mock.timers.tick(59000)
  session.succeed('completed')
  assert.equal(await result, 'completed')
})

test('non-interactive checks still time out after interaction finishes', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { session } = fixture()
  const result = session.verify()
  session.setInteractive(true)
  t.mock.timers.tick(120000)
  session.setInteractive(false)
  t.mock.timers.tick(60000)
  await assert.rejects(result, /Security check failed/)
})

test('only an accepted unused success can unlock the next send', async () => {
  const { session } = fixture()
  assert.equal(session.succeed('unsolicited'), false)
  session.prepare()
  assert.equal(session.succeed('prepared'), 'cached')
  assert.equal(await session.verify(), 'prepared')
  assert.equal(session.succeed('duplicate'), false)
  const controller = new AbortController()
  const waiting = session.verify(controller.signal)
  session.setInteractive(true)
  controller.abort()
  await assert.rejects(waiting, error => error.name === 'AbortError')
  assert.equal(session.succeed('cancelled'), false)
})


test('stalled background preparation offers recovery without a submitted message', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let runs = 0
  let stalled = ''
  const session = new PreparedVerification(() => runs++, () => {}, Date.now, error => { stalled = error.message })
  session.prepare()
  t.mock.timers.tick(30000)
  assert.match(stalled, /taking too long/)
  assert.equal(session.succeed('late'), false)
  session.prepare()
  assert.equal(runs, 2)
  session.succeed('fresh')
  t.mock.timers.tick(60000)
  assert.equal(stalled, 'Security check is taking too long. Please retry the check.')
  session.dispose()
})

test('background human interaction waits for the visitor instead of timing out', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let stalls = 0
  const session = new PreparedVerification(() => {}, () => {}, Date.now, () => stalls++)
  session.prepare()
  session.setInteractive(true)
  t.mock.timers.tick(120000)
  assert.equal(stalls, 0)
  session.setInteractive(false)
  t.mock.timers.tick(30000)
  assert.equal(stalls, 1)
  session.dispose()
})
