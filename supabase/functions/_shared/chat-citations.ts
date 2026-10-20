// Normalize model citation spelling without buffering the answer. Only an
// unfinished numeric citation (at most 64 characters) waits for another chunk.
export function citationStream<T extends { type: string; id?: string; delta?: string }>(sourceCount: number) {
  const pending = new Map<string, string>()
  const normalize = (text: string, final: boolean): [string, string] => {
    let output = ''
    while (text) {
      const match = text.match(/^[[【]([\d,\s]+)[\]】]/)
      if (match) {
        output += normalizeCitations(match[0], sourceCount)
        text = text.slice(match[0].length)
      } else if (!final && text.length <= 64 && /^[[【]\s*(?:\d[\d,\s]*)?$/.test(text)) {
        return [output, text]
      } else {
        output += text[0]
        text = text.slice(1)
      }
    }
    return [output, '']
  }
  return new TransformStream<T, T>({
    transform(chunk, controller) {
      if (chunk.type === 'text-delta' && chunk.id && typeof chunk.delta === 'string') {
        const [delta, rest] = normalize((pending.get(chunk.id) ?? '') + chunk.delta, false)
        pending.set(chunk.id, rest)
        if (delta) controller.enqueue({ ...chunk, delta })
        return
      }
      if (chunk.type === 'text-end' || chunk.type === 'finish' || chunk.type === 'error') {
        for (const [id, text] of pending) {
          if (chunk.type === 'text-end' && chunk.id !== id) continue
          const [delta] = normalize(text, true)
          if (delta) controller.enqueue({ type: 'text-delta', id, delta } as T)
          pending.delete(id)
        }
      }
      controller.enqueue(chunk)
    },
  })
}
export function normalizeCitations(text: string, sourceCount: number) {
  return text.replace(/[[【]([\d,\s]+)[\]】]/g, (_match, values: string) =>
    [...new Set(values.split(',').map(value => Number(value.trim())))]
      .filter(n => Number.isInteger(n) && n >= 1 && n <= sourceCount).map(n => `[${n}]`).join(''))
}
