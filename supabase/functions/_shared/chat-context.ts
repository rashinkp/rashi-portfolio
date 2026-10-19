import type { ChatTurn } from './chat-input.ts'

export interface KnowledgeDocument {
  id: string
  title: string
  url: string
  content: string
}

// The catalog is fetched by document ID, never by vector rank. A top-k search
// can find useful details, but cannot establish a complete project inventory.
export function combineChatDocuments(catalog: KnowledgeDocument[], matches: KnowledgeDocument[]) {
  return [...new Map([...catalog, ...matches].map(doc => [doc.id, doc])).values()]
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

export const projectContextRules = `The project inventory references below contain the full published portfolio project list. When asked for all projects, list every project in that inventory, including smaller projects, with a brief description each. Do not substitute Offrolls work features for independent portfolio projects; mention professional work separately if relevant.
Use the conversation to resolve follow-ups such as "that project", "other than that", or "list once more". For "other projects", exclude projects already discussed when the history establishes them. For "all projects", include the entire inventory again, regardless of earlier exclusions.
Earlier assistant replies may be incomplete or incorrect and their citation numbers belong to earlier replies. Use the current trusted references to verify facts and cite only current source numbers. Missing detail in search results is not evidence that a project does not exist. If an unspecified project is ambiguous, ask which project the visitor means.`
