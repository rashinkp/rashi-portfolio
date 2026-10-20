import { createGoogleGenerativeAI } from 'npm:@ai-sdk/google@3.0.135'
import { createGroq } from 'npm:@ai-sdk/groq@3.0.77'
import { createUIMessageStream, createUIMessageStreamResponse, generateText, Output, jsonSchema } from 'npm:ai@6.0.309'
import { corsHeaders, database, embed, HttpError, readJson, requiredEnv } from '../_shared/runtime.ts'
import { parseChatInput } from '../_shared/chat-input.ts'
import { verificationBurstGuard, VerificationError, verifyTurnstile } from '../_shared/turnstile.ts'
import { buildChatSystem } from '../_shared/chat-prompt.ts'
import { FallbackFailure, reviewedFallback } from '../_shared/chat-fallback.ts'
import { groundedAnswer, groundingReviewSystem } from '../_shared/grounded-answer.ts'
import { buildRetrievalQuery, combineChatDocuments, type KnowledgeDocument } from '../_shared/chat-context.ts'

const allowVerification = verificationBurstGuard()

Deno.serve(async request => {
  const started = performance.now()
  const requestId = crypto.randomUUID()
  let stage = 'input'
  let stageStarted = started
  const timings: string[] = []
  const mark = (name: string) => {
    const now = performance.now()
    timings.push(`${name};dur=${(now - stageStarted).toFixed(1)}`)
    stageStarted = now
  }
  let headers: Record<string, string>
  try { headers = corsHeaders(request) }
  catch { return new Response('Forbidden', { status: 403 }) }
  headers['X-Chat-Request-Id'] = requestId
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405, headers })

  try {
    const origin = request.headers.get('origin')
    if (!origin) throw new HttpError(403, 'Open the chat from Rashin’s portfolio.')
    const body = await readJson(request, 40000)
    let turns
    try { turns = parseChatInput(body) }
    catch (error) { throw new HttpError(400, (error as Error).message) }
    const token = (body as Record<string, unknown>).turnstileToken
    if (typeof token !== 'string' || !token.trim() || token.length > 2048) throw new HttpError(403, 'Please complete the security check and retry.')
    if (!allowVerification()) return Response.json({ error: 'Chat is busy. Please retry in a minute.' }, { status: 429, headers: { ...headers, 'Retry-After': '60' } })
    mark('input')
    stage = 'verification'
    await verifyTurnstile(token, origin, requiredEnv('TURNSTILE_SECRET_KEY'))
    mark('verification')
    stage = 'budget'
    const db = database()
    // Hash the gateway-provided client address; raw IPs and chat text are not stored.
    const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${requiredEnv('RATE_LIMIT_SALT')}:${address}`))
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    const verificationDigest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
    const verificationHash = Array.from(new Uint8Array(verificationDigest), byte => byte.toString(16).padStart(2, '0')).join('')
    const budget = await db.rpc('consume_verified_portfolio_chat_budget', { client_hash: hash, verification_hash: verificationHash })
    if (budget.error) throw new Error('Budget check failed')
    if (!budget.data) return Response.json({ error: 'Chat limit reached. Please try again later or email Rashin.' }, { status: 429, headers: { ...headers, 'Retry-After': '60' } })
    mark('budget')
    stage = 'catalog'

    // Pin the complete published project inventory independently of semantic rank.
    const catalogResult = await db.from('portfolio_documents').select('id,title,url,content')
      .or('id.like.project-%,id.like.additional-project-%').order('id').limit(100)
    if (catalogResult.error) throw new Error('Project inventory lookup failed')
    const catalog = catalogResult.data as KnowledgeDocument[]
    mark('catalog')
    stage = 'embedding'
    const embedding = await embed(buildRetrievalQuery(turns, catalog))
    mark('embedding')
    stage = 'retrieval'
    const matches = await db.rpc('match_portfolio_documents', { query_embedding: embedding, match_count: 5 })
    if (matches.error) throw new Error('Knowledge search failed')
    mark('retrieval')
    stage = 'generation'
    const documents = combineChatDocuments(catalog, (matches.data as (KnowledgeDocument & { similarity: number })[]).filter(doc => doc.similarity >= 0.25), turns)
    const inventoryIds = new Set(catalog.map(doc => doc.id))
    const context = documents.map((doc, index) => `[${index + 1}] ${inventoryIds.has(doc.id) ? 'Project inventory: ' : ''}${doc.title}\n${doc.content}`).join('\n\n')
    const abortSignal = AbortSignal.any([request.signal, AbortSignal.timeout(45000)])
    const geminiName = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.1-flash-lite'
    const preference = Deno.env.get('CHAT_PROVIDER') ?? 'google'
    if (preference !== 'google' && preference !== 'groq') throw new Error('Unsupported chat provider')
    const system = buildChatSystem(context)
    const generate = async (provider: 'google' | 'groq', signal: AbortSignal) => {
      const isGroq = provider === 'groq'
      const model = isGroq
        ? createGroq({ apiKey: requiredEnv('GROQ_API_KEY') })('openai/gpt-oss-20b')
        : createGoogleGenerativeAI({ apiKey: requiredEnv('GEMINI_API_KEY') })(geminiName)
      const settings = { model, temperature: 0.2, maxRetries: 0, abortSignal: signal }
      const providerOptions: NonNullable<Parameters<typeof generateText>[0]['providerOptions']> = isGroq ? { groq: { reasoningEffort: 'low' } } : { google: { thinkingConfig: { thinkingLevel: 'minimal' } } }
      return await groundedAnswer({
        sourceCount: documents.length, references: context, attempts: 1,
        draft: async () => (await generateText({ ...settings, providerOptions, maxOutputTokens: 600,
          system: `${system}\nFINAL ANSWER REQUIREMENTS: Use only explicitly stated facts. Cite every factual paragraph or list item with its supplied source number. Do not describe unprovided implementation steps. Say when requested details are not provided.`,
          messages: turns,
        })).text,
        review: async answer => {
          const result = await generateText({ ...settings, maxOutputTokens: 1400,
            ...(!isGroq ? { output: Output.object({ schema: jsonSchema<{ supported: boolean; issues: string[] }>({ type: 'object', properties: { supported: { type: 'boolean' }, issues: { type: 'array', items: { type: 'string' } } }, required: ['supported', 'issues'], additionalProperties: false }) }) } : {}),
            providerOptions: isGroq ? { groq: { reasoningEffort: 'medium' } } : providerOptions,
            system: groundingReviewSystem,
            prompt: JSON.stringify({ trustedReferences: system, question: turns.at(-1)!.content, draft: answer }),
          })
          return isGroq ? result.text : JSON.stringify(result.output)
        },
      })
    }
    // Complete generation and review before creating any answer-text events.
    // Site verification and budgets above apply once, before either provider.
    let provider: 'google' | 'groq' = preference
    let reason: string | undefined
    let answer = 'I couldn’t find that in Rashin’s résumé or portfolio. Try asking about his projects, experience, or skills, or contact him at rashinkp001@gmail.com.'
    if (documents.length) {
      if (preference === 'groq') {
        const result = await reviewedFallback({ signal: abortSignal,
          primary: signal => generate('groq', signal), fallback: signal => generate('google', signal),
        })
        answer = result.value
        provider = result.provider
        reason = result.reason
      } else { answer = await generate('google', abortSignal) }
    }
    const modelName = provider === 'groq' ? 'openai/gpt-oss-20b' : geminiName
    mark('generation')
    headers['X-Chat-Model'] = modelName
    headers['X-Chat-Fallback'] = reason ?? 'none'
    headers['Server-Timing'] = timings.join(', ')
    console.info('portfolio_chat_answer', { requestId, provider, model: modelName, fallback: reason ?? 'none', totalMs: Math.round(performance.now() - started) })
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: 'start' })
        documents.forEach((doc, index) => writer.write({ type: 'source-url', sourceId: String(index + 1), url: doc.url, title: doc.title }))
        writer.write({ type: 'text-start', id: 'answer' })
        writer.write({ type: 'text-delta', id: 'answer', delta: answer })
        writer.write({ type: 'text-end', id: 'answer' })
        writer.write({ type: 'finish' })
      },
      onError: () => 'The assistant couldn’t finish this reply. Please retry in a moment or contact Rashin.',
    })
    return createUIMessageStreamResponse({ stream, headers })
  } catch (error) {
    const known = error instanceof HttpError || error instanceof VerificationError
    const status = known ? error.status : 503
    headers['Server-Timing'] = [...timings, `${stage};dur=${(performance.now() - stageStarted).toFixed(1)}`].join(', ')
    if (error instanceof FallbackFailure) headers['X-Chat-Fallback'] = error.primaryReason
    if (!known) console.error('portfolio_chat_failure', { requestId, stage, durationMs: Math.round(performance.now() - started), ...(error instanceof FallbackFailure ? { primaryReason: error.primaryReason, secondaryReason: error.secondaryReason, secondaryStatus: error.secondaryStatus, secondaryType: error.secondaryType } : {}) })
    return Response.json({ error: known ? error.message : 'The assistant is temporarily unavailable. Please try again later.' }, { status, headers })
  }
})
