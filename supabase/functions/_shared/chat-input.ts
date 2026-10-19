export interface ChatTurn { role: 'user' | 'assistant'; content: string }

export function recentChatHistory<T extends { role: string; content: string }>(turns: T[]): T[] {
  const recent: T[] = []
  let characters = 0
  for (const turn of turns.slice(-20).reverse()) {
    if (characters + turn.content.length > 12000) break
    recent.unshift(turn)
    characters += turn.content.length
  }
  while (recent[0]?.role === 'assistant') recent.shift()
  return recent
}

// Discard client-supplied metadata, source parts, tools, and system instructions.
export function parseChatInput(body: unknown): ChatTurn[] {
  if (!body || typeof body !== 'object' || !('messages' in body) || !Array.isArray(body.messages)) {
    throw new Error('Expected messages.')
  }
  if (body.messages.length < 1 || body.messages.length > 40) throw new Error('Start a new chat to continue.')
  const turns: ChatTurn[] = []
  for (const message of body.messages) {
    if (!message || typeof message !== 'object' || !['user', 'assistant'].includes(message.role) || !Array.isArray(message.parts)) {
      throw new Error('Invalid message.')
    }
    const content = message.parts.filter((part: unknown) => part && typeof part === 'object' && 'type' in part && part.type === 'text')
      .map((part: { text?: unknown }) => {
        if (typeof part.text !== 'string') throw new Error('Invalid message text.')
        return part.text
      }).join('\n').trim()
    const limit = message.role === 'user' ? 2000 : 6000
    if (!content || content.length > limit) throw new Error(`Messages must contain 1–${limit} characters.`)
    turns.push({ role: message.role, content })
  }
  if (turns.at(-1)?.role !== 'user') throw new Error('Expected a question.')
  // Keep up to ten exchanges, with a character budget to bound model cost.
  // Preserve whole turns rather than truncating a question or answer mid-sentence.
  return recentChatHistory(turns)
}
