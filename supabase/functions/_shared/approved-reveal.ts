// Call only after grounding review succeeds. No draft is accepted here.
export async function revealApprovedAnswer(options: {
  answer: string
  write: (text: string) => void
  signal: AbortSignal
  reducedMotion?: boolean
}) {
  const { answer, write, signal } = options
  signal.throwIfAborted()
  if (options.reducedMotion) { write(answer); return }
  const words = answer.match(/\s*\S+\s*/gu) ?? [answer]
  const interval = Math.min(22, 1800 / Math.max(1, words.length - 1))
  const started = performance.now()
  for (const [index, word] of words.entries()) {
    signal.throwIfAborted()
    const delay = started + index * interval - performance.now()
    if (index && delay > 0) await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(signal.reason) }
      const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, delay)
      signal.addEventListener('abort', abort, { once: true })
    })
    signal.throwIfAborted()
    write(word)
  }
}
