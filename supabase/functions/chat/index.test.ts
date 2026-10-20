// Exercise the real handler without network traffic, credentials, or Gemini use.
Deno.test('chat rejects abuse before database or model work', async t => {
  const originalServe = Deno.serve
  const originalFetch = globalThis.fetch
  let handler!: (request: Request) => Promise<Response>
  let mode = 'rejected'
  let verifications = 0
  let databaseCalls = 0
  let modelInitializations = 0
  let generatedPrompt = ''
  let inventoryReads = 0
  let failEmbedding = false
  let groqDraftReasoning: unknown
  let groqMode = 'good'
  let groqDrafts = 0
  let correctionSeen = false
  let googleMode = 'good'
  let googleCalls = 0
  let reviewGate: Promise<void> | undefined
  let reviewStarted = false
  const projects = ['ByWay', 'Mobilify', 'LinkUp', 'Delivery Management', 'Aadhaar OCR', 'Student Management']
  const catalog = projects.map((name, i) => ({ id: i < 2 ? `project-${name.toLowerCase()}-1` : `additional-project-${i - 1}-1`, title: `${name}: portfolio project`, url: '/#projects', content: `${name}: published project.` }))
  const assert = (condition: boolean, message: string) => { if (!condition) throw new Error(message) }
  const environment = {
    ALLOWED_ORIGINS: 'https://portfolio.example', TURNSTILE_SECRET_KEY: 'private-test-placeholder',
    GEMINI_API_KEY: 'private-test-placeholder', GROQ_API_KEY: 'private-test-placeholder', CHAT_PROVIDER: 'google', RATE_LIMIT_SALT: 'private-test-placeholder',
    SUPABASE_URL: 'https://unit-test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'private-test-placeholder',
  }
  const previous = Object.fromEntries(Object.keys(environment).map(key => [key, Deno.env.get(key)]))
  Object.entries(environment).forEach(([key, value]) => Deno.env.set(key, value))
  Object.defineProperty(Deno, 'serve', { value: (callback: typeof handler) => { handler = callback } })
  Object.assign(globalThis, { Supabase: { ai: { Session: class {
    constructor() { modelInitializations++ }
    run() { if (failEmbedding || mode !== 'allowed') throw new Error('Embedding must not run'); return new Float32Array(384).fill(0.1) }
  } } } })
  globalThis.fetch = async (input, init) => {
    const url = String(input)
    if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
      verifications++
      if (mode === 'offline') throw new Error('Offline')
      return Response.json({ success: mode === 'budget-denied' || mode === 'allowed', hostname: 'portfolio.example', action: 'portfolio_chat', challenge_ts: new Date().toISOString(), 'error-codes': ['timeout-or-duplicate'] })
    }
    if (url.includes('/rest/v1/rpc/consume_verified_portfolio_chat_budget')) { databaseCalls++; return Response.json(mode === 'allowed') }
    if (mode === 'allowed' && url.includes('/rest/v1/portfolio_documents?')) { inventoryReads++; return Response.json(catalog) }
    if (mode === 'allowed' && url.includes('/rest/v1/rpc/match_portfolio_documents')) return Response.json([{ id: 'byway-details-1', title: 'ByWay details', url: '/#projects', content: 'ByWay uses Stripe.', similarity: 0.8 }])
    if (mode === 'allowed' && url.includes('api.groq.com')) {
      generatedPrompt = String(init?.body)
      if (groqMode === '429' || groqMode === '503') return Response.json({ error: { message: 'Unavailable', type: 'rate_limit_error' } }, { status: Number(groqMode), headers: { 'Retry-After': '60' } })
      const payload = JSON.parse(generatedPrompt)
      const reviewing = payload.messages[0].content.includes('You check whether')
      if (!reviewing) { groqDraftReasoning = payload.reasoning_effort; groqDrafts++; correctionSeen ||= payload.messages[0].content.includes('CORRECT THE PREVIOUS DRAFT') }
      if (reviewing && groqMode === 'review-503') return Response.json({ error: { message: 'Unavailable' } }, { status: 503 })
      const reject = groqMode === 'reject' || (groqMode === 'repair' && groqDrafts === 1)
      return Response.json({ id: 'test', object: 'chat.completion', created: 1, model: 'openai/gpt-oss-20b', choices: [{ index: 0, message: { role: 'assistant', content: reviewing ? (reject ? '{"supported":false,"issues":["Unsupported claim"]}' : '{"supported":true,"issues":[]}') : (reject ? 'UNSUPPORTED DRAFT 【1】' : 'Grounded 【1】 reply.') }, finish_reason: 'stop' }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })
    }
    if (mode === 'allowed' && url.includes('generativelanguage.googleapis.com')) {
      generatedPrompt = String(init?.body)
      googleCalls++
      const reviewing = generatedPrompt.includes('You check whether')
      if (reviewing) {
        reviewStarted = true
        await reviewGate
        const config = JSON.parse(generatedPrompt).generationConfig
        assert(config.responseMimeType === 'application/json' && config.responseSchema?.required?.includes('supported'), 'Gemini review must use a required JSON schema')
        assert(config.maxOutputTokens === 1400, 'Gemini review token allowance is too small')
      }
      const text = reviewing ? (googleMode === 'reject' ? '{"supported":false,"issues":["Unsupported"]}' : '{"supported":true,"issues":[]}') : 'Test reply. [1]'
      return Response.json({ candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }] })
    }
    throw new Error(`Unexpected outbound call: ${url}`)
  }
  try {
    await import('./index.ts')
    const request = (token: unknown, origin: string | null = 'https://portfolio.example', question = 'ByWay?', reducedMotion = true) => new Request('https://unit-test.supabase.co/functions/v1/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
      body: JSON.stringify({ turnstileToken: token, reducedMotion, messages: [{ role: 'user', parts: [{ type: 'text', text: question }] }] }),
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
    await t.step('project-list requests send the full inventory despite a narrow search', async () => {
      mode = 'allowed'
      const response = await handler(request('fresh-catalog-token', 'https://portfolio.example', 'List all projects'))
      const stream = await response.text()
      assert(response.status === 200 && inventoryReads === 1, 'Missing project inventory query')
      for (const name of projects) {
        assert(generatedPrompt.includes(name), `Model is missing ${name}`)
        assert(stream.includes(name), `Sources are missing ${name}`)
      }
      assert(generatedPrompt.includes('list every project in that inventory'), 'Missing completeness instruction')
      assert(stream.includes('Test reply.'), 'Model stream was not forwarded')
      assert(response.headers.get('Server-Timing')?.includes('embedding;dur=') === true, 'Missing backend timing')
      assert(response.headers.has('X-Chat-Request-Id'), 'Missing trace ID')
    })
    await t.step('focused questions omit unrelated inventory from prompt and citations', async () => {
      const response = await handler(request('fresh-focused-token'))
      const stream = await response.text()
      assert(generatedPrompt.includes('ByWay uses Stripe.'), 'Relevant detail missing')
      for (const name of projects.slice(1)) {
        assert(!generatedPrompt.includes(name), `Unrelated ${name} in prompt`)
        assert(!stream.includes(name), `Unrelated ${name} in sources`)
      }
    })
    await t.step('word reveal begins only after review approves the complete answer', async () => {
      let release!: () => void
      reviewGate = new Promise<void>(resolve => { release = resolve })
      reviewStarted = false
      let returned = false
      const pending = handler(request('approved-word-reveal', 'https://portfolio.example', 'ByWay?', false)).then(response => { returned = true; return response })
      try {
        for (let i = 0; i < 100 && !reviewStarted; i++) await new Promise(resolve => setTimeout(resolve, 5))
        assert(reviewStarted && !returned, 'A response escaped before review completed')
        release()
        const response = await pending
        const events = (await response.text()).split('\n').filter(line => line.startsWith('data: {')).map(line => JSON.parse(line.slice(6)))
        const words = events.filter(event => event.type === 'text-delta').map(event => event.delta)
        assert(words.length > 1 && words.join('') === 'Test reply. [1]', 'Reviewed answer was not revealed progressively and exactly')
        assert(events.at(-1).type === 'finish', 'Missing completed reveal')
      } finally { release(); reviewGate = undefined }
    })
    await t.step('Groq reviews low-reasoning drafts with medium reasoning and normalizes citations', async () => {
      Deno.env.set('CHAT_PROVIDER', 'groq')
      try {
        const response = await handler(request('fresh-groq-token'))
        const stream = await response.text()
        const payload = JSON.parse(generatedPrompt)
        assert(payload.model === 'openai/gpt-oss-20b', 'Wrong Groq model')
        assert(groqDraftReasoning === 'low' && payload.reasoning_effort === 'medium', 'Draft and review reasoning settings are incorrect')
        assert(generatedPrompt.includes('Do not infer additional product features'), 'Grounding instruction missing')
        assert(response.headers.get('Server-Timing')?.includes('groq_draft;dur=') === true && response.headers.get('Server-Timing')?.includes('groq_review;dur=') === true, 'Missing separate Groq draft/review timings')
        assert(stream.includes('Grounded [1] reply.') && !stream.includes('【'), 'Citation normalization failed')
      } finally { Deno.env.set('CHAT_PROVIDER', 'google') }
    })
    await t.step('Groq draft/review availability failures use reviewed Gemini fallback', async () => {
      Deno.env.set('CHAT_PROVIDER', 'groq')
      try {
        for (const failure of ['429', '503', 'review-503']) {
          groqMode = failure
          const before = googleCalls
          const beforeBudget = databaseCalls
          const response = await handler(request(`fallback-${failure}`))
          const stream = await response.text()
          assert(response.status === 200 && googleCalls === before + 2, 'Fallback must generate and review with Gemini')
          assert(databaseCalls === beforeBudget + 1, 'Fallback must not bypass or consume a second site budget')
          assert(response.headers.get('X-Chat-Model') === 'gemini-3.1-flash-lite', 'Incorrect actual-model header')
          assert(response.headers.get('X-Chat-Fallback') === (failure === '429' ? 'rate_limit' : 'provider_failure'), 'Incorrect fallback reason')
          assert(stream.includes('Test reply.') && !stream.includes('UNSUPPORTED DRAFT'), 'Rejected draft leaked')
        }
        groqMode = '503'
        googleMode = 'reject'
        const response = await handler(request('both-rejected'))
        const body = await response.text()
        assert(response.status === 503 && !body.includes('UNSUPPORTED DRAFT') && !body.includes('Test reply.'), 'Unreviewed answer escaped on double failure')
      } finally { groqMode = 'good'; googleMode = 'good'; Deno.env.set('CHAT_PROVIDER', 'google') }
    })
    await t.step('grounding rejection corrects on Groq and never switches providers', async () => {
      Deno.env.set('CHAT_PROVIDER', 'groq')
      try {
        const before = googleCalls
        groqMode = 'repair'; groqDrafts = 0; correctionSeen = false
        const repaired = await handler(request('repair-on-groq'))
        const stream = await repaired.text()
        assert(repaired.status === 200 && groqDrafts === 2 && correctionSeen, 'Missing bounded Groq correction with feedback')
        assert(repaired.headers.get('X-Chat-Model') === 'openai/gpt-oss-20b' && googleCalls === before, 'Grounding correction switched provider')
        assert(!stream.includes('UNSUPPORTED DRAFT'), 'Rejected draft leaked')
        groqMode = 'reject'; groqDrafts = 0
        const rejected = await handler(request('reject-on-groq'))
        const body = await rejected.text()
        assert(rejected.status === 503 && groqDrafts === 2 && googleCalls === before && !body.includes('UNSUPPORTED DRAFT'), 'Repeated grounding failure must stop safely without Gemini')
      } finally { groqMode = 'good'; Deno.env.set('CHAT_PROVIDER', 'google') }
    })
    await t.step('backend failures log the failing stage without chat text or credentials', async () => {
      failEmbedding = true
      const originalError = console.error
      const logged: unknown[][] = []
      console.error = (...args: unknown[]) => { logged.push(args) }
      try {
        const response = await handler(request('fresh-failing-token'))
        assert(response.status === 503, 'Expected safe backend failure')
        const diagnostic = JSON.stringify(logged)
        assert(diagnostic.includes('embedding'), 'Failure stage was not recorded')
        assert(!diagnostic.includes('ByWay?') && !diagnostic.includes('private-test-placeholder'), 'Sensitive data entered diagnostic logs')
      } finally { console.error = originalError; failEmbedding = false }
    })
  } finally {
    Object.defineProperty(Deno, 'serve', { value: originalServe })
    globalThis.fetch = originalFetch
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) Deno.env.delete(key); else Deno.env.set(key, value) }
  }
})
