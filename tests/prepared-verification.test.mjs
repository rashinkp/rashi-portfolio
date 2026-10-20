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
