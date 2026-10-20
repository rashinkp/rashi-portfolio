export type FallbackReason = 'rate_limit' | 'timeout' | 'grounding' | 'provider_failure'

export class FallbackFailure extends Error {
  readonly primaryReason: FallbackReason
  readonly secondaryReason: FallbackReason
  readonly secondaryStatus?: number
  readonly secondaryType?: string
  constructor(primaryReason: FallbackReason, secondaryReason: FallbackReason, secondary?: unknown) {
    super('Both providers failed')
    this.primaryReason = primaryReason
    this.secondaryReason = secondaryReason
    if (secondary && typeof secondary === 'object') {
      if ('statusCode' in secondary && typeof secondary.statusCode === 'number') this.secondaryStatus = secondary.statusCode
      if ('name' in secondary && typeof secondary.name === 'string' && /^[A-Za-z_]{1,80}$/.test(secondary.name)) this.secondaryType = secondary.name
    }
  }
}

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
    try {
      return { value: await bounded(options.fallback, options.signal, options.fallbackTimeout ?? 32000), provider: 'google' as const, reason }
    } catch (secondary) {
      options.signal.throwIfAborted()
      throw new FallbackFailure(reason, fallbackReason(secondary), secondary)
    }
  }
}
