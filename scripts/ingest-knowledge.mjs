import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { buildKnowledge } from './knowledge.mjs'
const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
const secret = process.env.INGEST_SECRET
if (!url || !secret) throw new Error('Set SUPABASE_URL and INGEST_SECRET in .env.ingest.local first.')
if (!url.startsWith('https://') && !/^http:\/\/(localhost|127\.0\.0\.1):/.test(url)) throw new Error('Use HTTPS for hosted ingestion.')
const { revision, documents } = await buildKnowledge()
async function invoke(body) {
  const response = await fetch(`${url}/functions/v1/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-ingest-secret': secret },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  })
  if (!response.ok) throw new Error(`Ingestion failed (${response.status}). Check the function configuration and logs.`)
  return response.json()
}
const cacheDirectory = new URL('../.knowledge/', import.meta.url)
const cacheFile = new URL(`embeddings-${revision}.json`, cacheDirectory)
let embedded = []
try {
  const cached = JSON.parse(await readFile(cacheFile, 'utf8'))
  if (cached.source === url && cached.revision === revision && cached.documents.length === documents.length) embedded = cached.documents
} catch { /* No complete cache yet. */ }
if (embedded.length) console.log(`Reusing ${embedded.length} cached embeddings.`)
for (const doc of documents.slice(embedded.length)) {
  const result = await invoke({ action: 'embed', documents: [doc] })
  const candidate = result.document
  if (!candidate || candidate.id !== doc.id || !Array.isArray(candidate.embedding) || candidate.embedding.length !== 384 || candidate.embedding.some(value => !Number.isFinite(value))) {
    throw new Error('Invalid embedding response; previous knowledge was preserved.')
  }
  embedded.push({ ...doc, embedding: candidate.embedding })
  console.log(`Embedded ${embedded.length}/${documents.length} chunks.`)
}
await mkdir(cacheDirectory, { recursive: true })
await writeFile(cacheFile, JSON.stringify({ source: url, revision, documents: embedded }))
const result = await invoke({ action: 'commit', documents: embedded })
console.log(`Updated ${result.documents} knowledge chunks (revision ${revision}).`)
