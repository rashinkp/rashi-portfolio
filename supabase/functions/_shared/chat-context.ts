import type { ChatTurn } from './chat-input.ts'

export interface KnowledgeDocument {
  id: string
  title: string
  url: string
  content: string
}

// The catalog is fetched by document ID, never by vector rank. A top-k search
// can find useful details, but cannot establish a complete project inventory.
export function combineChatDocuments(catalog: KnowledgeDocument[], matches: (KnowledgeDocument & { similarity?: number })[], turns: ChatTurn[]) {
  const question = turns.at(-1)!.content
  const unique = (docs: KnowledgeDocument[]) => [...new Map(docs.map(doc => [doc.id, doc])).values()]
  const candidates = unique([...catalog, ...matches])
  // Match published subject names, not arbitrary words in retrieved content.
  const subjects = candidates.map(doc => doc.title.split(':')[0].toLowerCase())
    .filter(name => catalog.some(doc => doc.title.toLowerCase().startsWith(name)) || name === 'offrolls')
  const named = (text: string) => subjects.filter(name => text.toLowerCase().includes(name))
  const explicit = named(question)
  // A list request must not inherit a single project from earlier conversation.
  const inventory = /\bprojects\b/i.test(question) && !explicit.length
    || /\b(all|every)\b.*\bprojects\b|\b(all|every|list)\b.*\b(them|those|ones)\b|\b(other|more)\b.*\b(projects|ones)\b|\blist\b.*\b(again|more)\b/i.test(question)
  if (inventory) return unique(catalog)
  const followUp = /\b(it|its|that|those|them|ones?|other|more|again)\b|^(?:now|and|what about)\b/i.test(question)
  const inherited = followUp ? turns.slice(0, -1).filter(turn => turn.role === 'user').reverse().map(turn => named(turn.content)).find(names => names.length) ?? [] : []
  const selectedNames = explicit.length ? explicit : inherited
  if (selectedNames.length) {
    return candidates.filter(doc => selectedNames.some(name => doc.title.toLowerCase().startsWith(name)))
  }
  // For general questions keep the strongest semantic evidence, not the entire
  // catalog or weak matches that happened to fill the search's top-five slots.
  const ranked = [...matches].sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
  const cutoff = Math.max(0.25, (ranked[0]?.similarity ?? 0.25) - 0.08)
  return unique(ranked.filter(doc => (doc.similarity ?? 1) >= cutoff).slice(0, 3))
}

export function buildRetrievalQuery(turns: ChatTurn[], catalog: KnowledgeDocument[]) {
  const question = turns.at(-1)!.content
  const names = catalog.map(doc => doc.title.replace(/: portfolio project$/, '').toLowerCase())
  const namesProject = names.some(name => question.toLowerCase().includes(name))
  const isFollowUp = /\b(it|its|that|those|them|ones?|other|more|again)\b|^(?:now|and|what about)\b/i.test(question)
  // Explicit project switches should not keep searching the previous project.
  if (namesProject || !isFollowUp) return question
  const earlierQuestions = turns.slice(0, -1).filter(turn => turn.role === 'user').slice(-2)
  const previousAnswer = turns.slice(0, -1).findLast(turn => turn.role === 'assistant')
  return [
    `Current question: ${question}`,
    ...earlierQuestions.map(turn => `Earlier question: ${turn.content.slice(0, 500)}`),
    ...(previousAnswer ? [`Previous answer (conversation context only): ${previousAnswer.content.slice(0, 800)}`] : []),
  ].join('\n').slice(0, 4000)
}

export const projectContextRules = `References marked "Project inventory" describe published portfolio projects. For project-list questions the complete inventory is supplied: list every project in that inventory, including smaller projects, with a brief description each. Focused questions receive only relevant references. Do not substitute Offrolls work features for independent portfolio projects; mention professional work separately if relevant.
Use the conversation to resolve follow-ups such as "that project", "other than that", or "list once more". For "other projects", exclude projects already discussed when the history establishes them. For "all projects", include the entire inventory again, regardless of earlier exclusions.
Earlier assistant replies may be incomplete or incorrect and their citation numbers belong to earlier replies. Use the current trusted references to verify facts and cite only current source numbers. Missing detail in search results is not evidence that a project does not exist. If an unspecified project is ambiguous, ask which project the visitor means.`
