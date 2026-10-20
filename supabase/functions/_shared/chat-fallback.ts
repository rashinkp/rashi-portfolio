export type FallbackReason = 'rate_limit' | 'timeout' | 'grounding' | 'provider_failure'

export function fallbackReason(error: unknown): FallbackReason {
  if (error && typeof error === 'object') {
    if ('statusCode' in error && error.statusCode === 429) return 'rate_limit'
    if ('name' in error && (error.name === 'TimeoutError' || error.name === 'AbortError')) return 'timeout'
    if ('message' in error && typeof error.message === 'string' && /grounding review|Empty draft/.test(error.message)) return 'grounding'
  }
  return 'provider_failure'
}

async function bounded<T>(run: (signal: AbortSignal) => Promise<T>, parent: AbortSignal, timeout: number) {
  const signal = AbortSignal.any([parent, AbortSignal.timeout(timeout)])
  signal.throwIfAborted()
  let abort: () => void = () => {}
  const cancelled = new Promise<never>((_resolve, reject) => {
    abort = () => reject(signal.reason)
    signal.addEventListener('abort', abort, { once: true })
  })
  try { return await Promise.race([run(signal), cancelled]) }
  finally { signal.removeEventListener('abort', abort) }
}

export async function reviewedFallback<T>(options: {
  primary: (signal: AbortSignal) => Promise<T>
  fallback: (signal: AbortSignal) => Promise<T>
  signal: AbortSignal
  primaryTimeout?: number
  fallbackTimeout?: number
}) {
  try {
    return { value: await bounded(options.primary, options.signal, options.primaryTimeout ?? 12000), provider: 'groq' as const, reason: undefined }
  } catch (error) {
    // A visitor cancelling or the overall deadline expiring must not start a
    // second provider call. Only provider/grounding failures trigger fallback.
    options.signal.throwIfAborted()
    const reason = fallbackReason(error)
    return { value: await bounded(options.fallback, options.signal, options.fallbackTimeout ?? 32000), provider: 'google' as const, reason }
  }
}
