import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { featuredProjects, additionalProjects, skillGroups } from '../src/data/portfolio.ts'

export function chunkContent(content, maxLength = 1200) {
  const words = content.trim().split(/\s+/)
  const chunks = []
  let chunk = ''
  for (const word of words) {
    if (word.length > maxLength) throw new Error('Knowledge contains an oversized word.')
    if (chunk && chunk.length + word.length + 1 > maxLength) {
      chunks.push(chunk)
      chunk = ''
    }
    chunk = chunk ? `${chunk} ${word}` : word
  }
  if (chunk) chunks.push(chunk)
  return chunks
}

export async function buildKnowledge() {
  const curated = JSON.parse(await readFile(new URL('../knowledge/profile.json', import.meta.url), 'utf8'))
  const generated = [
    ...featuredProjects.map(project => ({
      id: `project-${project.name.toLowerCase()}`,
      title: `${project.name}: portfolio project`, url: '/#projects',
      content: `${project.name} (${project.type}). ${project.description} ${project.highlights.join('. ')}. Stack: ${project.stack.join(', ')}. Public demo: ${project.live} Source code: ${project.github}`,
    })),
    ...additionalProjects.map((project, index) => ({
      id: `additional-project-${index + 1}`, title: project.name, url: '/#projects',
      content: `${project.name}: ${project.description} Source code: ${project.github}`,
    })),
    ...skillGroups.map((group, index) => ({
      id: `toolkit-${index + 1}`, title: `Portfolio toolkit: ${group.title}`, url: '/#about',
      content: `Rashin lists these tools under ${group.title}: ${group.skills.join(', ')}. Listing a tool does not establish proficiency level or duration of professional use.`,
    })),
  ]
  const ids = new Set()
  const documents = [...curated, ...generated].flatMap(doc => chunkContent(doc.content).map((content, index) => {
    const id = `${doc.id}-${index + 1}`
    if (ids.has(id)) throw new Error(`Duplicate knowledge ID: ${id}`)
    ids.add(id)
    return { id, title: doc.title, url: doc.url, content }
  }))
  const revision = createHash('sha256').update(JSON.stringify(documents)).digest('hex').slice(0, 12)
  return { revision, documents }
}
