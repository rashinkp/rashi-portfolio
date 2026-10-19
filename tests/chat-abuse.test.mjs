import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { verifyTurnstile, verificationBurstGuard } from '../supabase/functions/_shared/turnstile.ts'

const origin = 'https://portfolio.example'
const secret = 'private-unit-test-placeholder'
const reply = data => async () => Response.json(data)

test('Turnstile rejects absent or oversized tokens before contacting Cloudflare', async () => {
  for (const token of [undefined, null, '', ' ', true, 'x'.repeat(2049)]) {
    await assert.rejects(verifyTurnstile(token, origin, secret, () => { throw new Error('Must not fetch') }), error => error.status === 403)
  }
})

test('Turnstile fails closed on rejection, replay, wrong action/host, outages and malformed responses', async () => {
  for (const data of [null, {}, { success: false, 'error-codes': ['timeout-or-duplicate'] }, { success: 'true', hostname: 'portfolio.example', action: 'portfolio_chat' }, { success: true, hostname: 'evil.example', action: 'portfolio_chat' }, { success: true, hostname: 'portfolio.example', action: 'other' }]) {
    await assert.rejects(verifyTurnstile('token', origin, secret, reply(data)), error => error.status === 403)
  }
  for (const fetcher of [async () => { throw new Error('Offline') }, async () => new Response('upstream error', { status: 500 }), async () => new Response('not json')]) {
    await assert.rejects(verifyTurnstile('token', origin, secret, fetcher), error => error.status === 503)
  }
  for (const value of ['', '1x0000000000000000000000000000000AA', '2x0000000000000000000000000000000AA', '3x0000000000000000000000000000000AA']) {
    await assert.rejects(verifyTurnstile('token', origin, value, reply({ success: true })), error => error.status === 503)
  }
})

test('Turnstile validates a fresh token with a bounded server-to-server request', async () => {
  await verifyTurnstile('fresh-token', origin, secret, async (url, options) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify')
    assert.equal(options.method, 'POST')
    assert.deepEqual(JSON.parse(options.body), { secret, response: 'fresh-token' })
    assert.ok(options.signal instanceof AbortSignal)
    return Response.json({ success: true, hostname: 'portfolio.example', action: 'portfolio_chat', challenge_ts: new Date().toISOString() })
  })
})

test('valid-looking verification with missing, expired or future issuance is rejected', async () => {
  for (const challenge_ts of [undefined, 'invalid', new Date(Date.now() - 301000).toISOString(), new Date(Date.now() + 60000).toISOString()]) {
    await assert.rejects(verifyTurnstile('token', origin, secret, reply({ success: true, hostname: 'portfolio.example', action: 'portfolio_chat', challenge_ts })), error => error.status === 403)
  }
})

test('per-worker verification burst cap resets without accumulating client identities', () => {
  const allow = verificationBurstGuard(3, 60000)
  assert.deepEqual([allow(100000), allow(100001), allow(100002), allow(100003)], [true, true, true, false])
  assert.equal(allow(160000), true)
})

test('SQL limiter enforces shared budgets and bounded bucket allocation', async t => {
  const db = new PGlite()
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create table public.portfolio_chat_limits (bucket text primary key, requests integer not null default 0, expires_at timestamptz not null);`)
    await db.exec(await readFile(new URL('../supabase/migrations/20261018120000_chat_abuse_protection.sql', import.meta.url), 'utf8'))
    await db.exec(await readFile(new URL('../supabase/migrations/20261019090000_chat_token_replay_guard.sql', import.meta.url), 'utf8'))
    const hash = n => n.toString(16).padStart(64, '0')
    const consume = async n => (await db.query('select public.consume_portfolio_chat_budget($1) as allowed', [hash(n)])).rows[0].allowed
    const clear = () => db.exec('truncate public.portfolio_chat_limits')
    const expireCooldown = () => db.exec("update public.portfolio_chat_limits set expires_at = now() - interval '1 second' where bucket like 'ip-cooldown:%'")

    await t.test('a token cannot be replayed from another IP or concurrent request', async () => {
      const verified = async (client, token) => (await db.query('select public.consume_verified_portfolio_chat_budget($1,$2) as allowed', [hash(client), hash(token)])).rows[0].allowed
      const results = await Promise.all(Array.from({ length: 10 }, (_, index) => verified(index, 1000)))
      assert.equal(results.filter(Boolean).length, 1)
      assert.equal((await db.query("select requests from public.portfolio_chat_limits where bucket like 'global-day:%'")).rows[0].requests, 1)
      assert.equal(await verified(20, 1001), true)
      assert.equal(await verified(21, 1000), false)
      assert.equal((await db.query("select has_function_privilege('anon', 'public.consume_verified_portfolio_chat_budget(text,text)', 'EXECUTE') as allowed")).rows[0].allowed, false)
      await clear()
    })

    await t.test('five-second cooldown blocks rapid repeats without incrementing budgets', async () => {
      assert.equal(await consume(1), true)
      assert.equal(await consume(1), false)
      const counts = await db.query("select requests from public.portfolio_chat_limits where bucket like 'global-day:%'")
      assert.equal(counts.rows[0].requests, 1)
      await expireCooldown()
      assert.equal(await consume(1), true)
    })
    await t.test('per-IP minute and day budgets work independently', async () => {
      await clear()
      for (let index = 0; index < 5; index++) { await expireCooldown(); assert.equal(await consume(1), true) }
      await expireCooldown()
      assert.equal(await consume(1), false)
      assert.equal(await consume(2), true)
      await clear()
      await db.query("insert into public.portfolio_chat_limits values ('ip-day:' || $1 || ':' || to_char(now() at time zone 'UTC', 'YYYYMMDD'), 30, now() + interval '1 day')", [hash(1)])
      assert.equal(await consume(1), false)
      assert.equal(await consume(2), true)
    })
    await t.test('rotating IPs cannot exceed the shared minute cap', async () => {
      await clear()
      const accepted = await Promise.all(Array.from({ length: 35 }, (_, n) => consume(n + 10)))
      assert.equal(accepted.filter(Boolean).length, 20)
      assert.equal((await db.query('select count(*)::int as total from public.portfolio_chat_limits')).rows[0].total, 63)
    })
    await t.test('daily/monthly caps reject fresh identities without allocating rows', async () => {
      for (const [prefix, format, limit] of [['global-day:', 'YYYYMMDD', 200], ['global-month:', 'YYYYMM', 3000]]) {
        await clear()
        await db.query("insert into public.portfolio_chat_limits values ($1 || to_char(now() at time zone 'UTC', $2), $3, now() + interval '32 days')", [prefix, format, limit])
        for (let index = 0; index < 10; index++) assert.equal(await consume(index), false)
        assert.equal((await db.query('select count(*)::int as total from public.portfolio_chat_limits')).rows[0].total, 1)
      }
    })
    await t.test('cleanup stays bounded and expired cooldowns are reusable', async () => {
      await clear()
      await db.exec("insert into public.portfolio_chat_limits select 'expired-' || n, 1, now() - interval '1 day' from generate_series(1,250) n")
      assert.equal(await consume(1), true)
      assert.equal((await db.query("select count(*)::int as total from public.portfolio_chat_limits where bucket like 'expired-%'")).rows[0].total, 150)
      await expireCooldown()
      assert.equal(await consume(1), true)
    })
    await t.test('anonymous roles cannot invoke the budget function and invalid identities allocate nothing', async () => {
      assert.equal((await db.query("select has_function_privilege('anon', 'public.consume_portfolio_chat_budget(text)', 'EXECUTE') as allowed")).rows[0].allowed, false)
      assert.equal((await db.query("select has_function_privilege('authenticated', 'public.consume_portfolio_chat_budget(text)', 'EXECUTE') as allowed")).rows[0].allowed, false)
      await clear()
      assert.equal((await db.query("select public.consume_portfolio_chat_budget('spoofed') as allowed")).rows[0].allowed, false)
      assert.equal((await db.query('select count(*)::int as total from public.portfolio_chat_limits')).rows[0].total, 0)
    })
  } finally { await db.close() }
})
