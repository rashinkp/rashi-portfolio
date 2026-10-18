import { database, embed, HttpError, readJson, requiredEnv } from '../_shared/runtime.ts'

Deno.serve(async request => {
  const headers = { 'Cache-Control': 'no-store' }
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers })
  try {
    const secret = requiredEnv('INGEST_SECRET')
    const received = request.headers.get('x-ingest-secret') ?? ''
    // Compare fixed-size digests instead of leaking a matching secret prefix.
    const digest = (value: string) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
    const [expectedHash, receivedHash] = await Promise.all([digest(secret), digest(received)])
    const expected = new Uint8Array(expectedHash)
    const actual = new Uint8Array(receivedHash)
    if (expected.reduce((diff, byte, index) => diff | (byte ^ actual[index]), 0) !== 0) {
      return new Response('Unauthorized', { status: 401, headers })
    }
    const body = await readJson(request, 1000000) as { action?: unknown; documents?: unknown }
    if (body?.action !== 'embed' && body?.action !== 'commit') throw new HttpError(400, 'Expected embed or commit action.')
    if (!Array.isArray(body?.documents) || body.documents.length < 1 || body.documents.length > 100) throw new HttpError(400, 'Expected 1 to 100 documents.')
    const ids = new Set<string>()
    const documents = body.documents.map((doc: unknown) => {
      if (!doc || typeof doc !== 'object') throw new HttpError(400, 'Invalid document.')
      const { id, title, url, content, embedding } = doc as Record<string, unknown>
      if (typeof id !== 'string' || !/^[a-z0-9-]{1,100}$/.test(id) || ids.has(id) || typeof title !== 'string' || !title || title.length > 160 || typeof content !== 'string' || !content.trim() || content.length > 1800 || typeof url !== 'string' || !/^\/(?:#[a-z-]+|resume_rashin\.pdf)$/.test(url)) {
        throw new HttpError(400, 'Invalid document fields or duplicate ID.')
      }
      ids.add(id)
      if (body.action === 'commit' && (!Array.isArray(embedding) || embedding.length !== 384 || embedding.some(value => typeof value !== 'number' || !Number.isFinite(value)))) {
        throw new HttpError(400, 'Expected a finite 384-dimensional embedding.')
      }
      return { id, title, url, content, ...(body.action === 'commit' ? { embedding } : {}) }
    })
    // Supabase Free has a small per-request CPU budget. Embed one chunk per
    // invocation; commit the completed dataset in a separate atomic transaction.
    if (body.action === 'embed') {
      if (documents.length !== 1) throw new HttpError(400, 'Embed exactly one document per request.')
      const doc = documents[0]
      return Response.json({ document: { ...doc, embedding: await embed(`${doc.title}\n${doc.content}`) } }, { headers })
    }
    const result = await database().rpc('replace_portfolio_documents', { documents })
    if (result.error) throw new Error(`Knowledge update failed: ${result.error.message}`)
    return Response.json({ documents: documents.length }, { headers })
  } catch (error) {
    console.error('Knowledge upload failed:', error instanceof Error ? error.message : 'Unknown error')
    return Response.json({ error: error instanceof HttpError ? error.message : 'Knowledge update failed; previous content was preserved.' }, { status: error instanceof HttpError ? error.status : 503, headers })
  }
})
