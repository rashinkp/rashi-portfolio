export interface ChatTurn { role: 'user' | 'assistant'; content: string }

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
  // Only the recent context is sent to Gemini, regardless of the displayed history.
  return turns.slice(-6)
}
