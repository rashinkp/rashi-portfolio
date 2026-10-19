import type { UIMessage } from 'ai'

const key = 'portfolio-chat-v1'

export function readChatSession(): UIMessage[] {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw || raw.length > 250000) return []
    const saved: unknown = JSON.parse(raw)
    if (!Array.isArray(saved) || saved.length > 100) return []
    return saved.filter((message): message is UIMessage => {
      if (!message || typeof message !== 'object') return false
      const { id, role, parts } = message
      return typeof id === 'string' && ['user', 'assistant'].includes(role)
        && Array.isArray(parts) && parts.every(part => part && typeof part === 'object' && (
          (part.type === 'text' && typeof part.text === 'string') ||
          (part.type === 'source-url' && typeof part.sourceId === 'string' && typeof part.url === 'string' && (part.title === undefined || typeof part.title === 'string'))
        )) && parts.some(part => part.type === 'text' && part.text.trim())
    })
  } catch { return [] }
}

export function saveChatSession(messages: UIMessage[]) {
  try {
    if (!messages.length) { sessionStorage.removeItem(key); return }
    // Persist display content only, never verification tokens or transport state.
    const saved = messages.slice(-100).map(({ id, role, parts }) => ({
      id, role, parts: parts.filter(part => part.type === 'text' || part.type === 'source-url'),
    }))
    while (saved.length && JSON.stringify(saved).length > 250000) saved.shift()
    sessionStorage.setItem(key, JSON.stringify(saved))
  } catch { /* Chat still works when browser storage is unavailable or full. */ }
}
