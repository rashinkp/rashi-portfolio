import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

export function requiredEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing configuration: ${name}`)
  return value
}

export function database() {
  return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function corsHeaders(request: Request): Record<string, string> {
  const allowed = requiredEnv('ALLOWED_ORIGINS').split(',').map(value => value.trim())
  const origin = request.headers.get('origin')
  if (origin && !allowed.includes(origin)) throw new Error('Origin not allowed')
  return {
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'content-type, apikey, x-ingest-secret, authorization, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Expose-Headers': 'retry-after, server-timing, x-chat-request-id, x-chat-model',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export async function readJson(request: Request, limit: number): Promise<unknown> {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    throw new HttpError(415, 'Expected a JSON request.')
  }
  const reader = request.body?.getReader()
  if (!reader) throw new HttpError(400, 'Missing request body.')
  const parts: Uint8Array[] = []
  let size = 0
  let timedOut = false
  const deadline = setTimeout(() => {
    timedOut = true
    void reader.cancel().catch(() => {})
  }, 10000)
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (timedOut) throw new HttpError(408, 'Request took too long. Please retry.')
      if (done) break
      size += value.byteLength
      if (size > limit) {
        await reader.cancel()
        throw new HttpError(413, 'Request is too large.')
      }
      parts.push(value)
    }
  } finally { clearTimeout(deadline); reader.releaseLock() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength }
  try { return JSON.parse(new TextDecoder().decode(bytes)) }
  catch { throw new HttpError(400, 'Invalid JSON.') }
}

// The hosted Edge Runtime supplies this global (it is absent from plain Deno).
declare const Supabase: {
  ai: { Session: new (model: 'gte-small') => {
    run(text: string, options: { mean_pool: true; normalize: true }): Promise<number[]>
  } }
}

// Shared model and settings ensure document and query embeddings are compatible.
let session: InstanceType<typeof Supabase.ai.Session> | undefined
export async function embed(text: string): Promise<number[]> {
  // Invalid chat tokens and unauthorized ingestion never initialize the model.
  session ??= new Supabase.ai.Session('gte-small')
  const result = await session.run(text, { mean_pool: true, normalize: true })
  const vector = Array.from(result) as number[]
  if (vector.length !== 384 || vector.some(value => !Number.isFinite(value))) {
    throw new Error('Invalid embedding result')
  }
  return vector
}
