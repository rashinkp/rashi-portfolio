import { mkdir, writeFile } from 'node:fs/promises'
import { buildKnowledge } from './knowledge.mjs'
const knowledge = await buildKnowledge()
const directory = new URL('../.knowledge/', import.meta.url)
await mkdir(directory, { recursive: true })
await writeFile(new URL('documents.json', directory), JSON.stringify(knowledge, null, 2) + '\n')
console.log(`Prepared ${knowledge.documents.length} chunks (revision ${knowledge.revision}). Review .knowledge/documents.json before ingesting.`)
