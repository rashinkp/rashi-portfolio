// Exercise the real handler without network traffic, credentials, or Gemini use.
Deno.test('chat rejects abuse before database or model work', async t => {
  const originalServe = Deno.serve
  const originalFetch = globalThis.fetch
  let handler!: (request: Request) => Promise<Response>
  let mode = 'rejected'
  let verifications = 0
  let databaseCalls = 0
  let modelInitializations = 0
  const assert = (condition: boolean, message: string) => { if (!condition) throw new Error(message) }
  const environment = {
    ALLOWED_ORIGINS: 'https://portfolio.example', TURNSTILE_SECRET_KEY: 'private-test-placeholder',
    GEMINI_API_KEY: 'private-test-placeholder', RATE_LIMIT_SALT: 'private-test-placeholder',
    SUPABASE_URL: 'https://unit-test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'private-test-placeholder',
  }
  const previous = Object.fromEntries(Object.keys(environment).map(key => [key, Deno.env.get(key)]))
  Object.entries(environment).forEach(([key, value]) => Deno.env.set(key, value))
  Object.defineProperty(Deno, 'serve', { value: (callback: typeof handler) => { handler = callback } })
  Object.assign(globalThis, { Supabase: { ai: { Session: class {
    constructor() { modelInitializations++ }
    run() { throw new Error('Embedding must not run') }
  } } } })
  globalThis.fetch = async input => {
    const url = String(input)
    if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
      verifications++
      if (mode === 'offline') throw new Error('Offline')
      return Response.json({ success: mode === 'budget-denied', hostname: 'portfolio.example', action: 'portfolio_chat', 'error-codes': ['timeout-or-duplicate'] })
    }
    if (url.includes('/rest/v1/rpc/consume_portfolio_chat_budget')) { databaseCalls++; return Response.json(false) }
    throw new Error(`Unexpected outbound call: ${url}`)
  }
  try {
    await import('./index.ts')
    const request = (token: unknown, origin: string | null = 'https://portfolio.example') => new Request('https://unit-test.supabase.co/functions/v1/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
      body: JSON.stringify({ turnstileToken: token, messages: [{ role: 'user', parts: [{ type: 'text', text: 'ByWay?' }] }] }),
    })
    await t.step('missing, spoofed-origin and missing-origin requests fail before verification', async () => {
      for (const req of [request(undefined), request('token', 'https://evil.example'), request('token', null)]) {
        assert((await handler(req)).status === 403, 'Expected 403')
      }
      assert(verifications === 0 && databaseCalls === 0, 'Unexpected work before verification')
    })
    await t.step('invalid or replayed tokens do not consume AI budget', async () => {
      assert((await handler(request('replayed-token'))).status === 403, 'Expected 403')
      assert(databaseCalls === 0, 'Rejected token reached database')
    })
    await t.step('verification outage fails closed', async () => {
      mode = 'offline'
      assert((await handler(request('token'))).status === 503, 'Expected 503')
      assert(databaseCalls === 0, 'Verification outage reached database')
    })
    await t.step('a verified request still stops at the shared budget', async () => {
      mode = 'budget-denied'
      const response = await handler(request('fresh-token'))
      assert(response.status === 429, 'Expected budget rejection')
      assert(databaseCalls === 1 && response.headers.get('Retry-After') === '60', 'Missing database check or retry guidance')
      assert(modelInitializations === 0, 'Rejected traffic initialized the embedding model')
    })
  } finally {
    Object.defineProperty(Deno, 'serve', { value: originalServe })
    globalThis.fetch = originalFetch
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) Deno.env.delete(key); else Deno.env.set(key, value) }
  }
})
