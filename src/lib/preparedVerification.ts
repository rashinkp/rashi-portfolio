// Tokens stay in memory, are claimed once, and expire before Cloudflare's 5m limit.
// This only overlaps the browser challenge with reading/typing. The server still
// validates every token and atomically enforces replay protection and budgets.
export class PreparedVerification {
  private token: { value: string; createdAt: number } | null = null
  private running = false
  private pending: { resolve: (token: string) => void; reject: (error: Error) => void } | null = null
  private readonly execute: () => void
  private readonly reset: () => void
  private readonly now: () => number

  constructor(
    execute: () => void,
    reset: () => void,
    now: () => number = Date.now,
  ) { this.execute = execute; this.reset = reset; this.now = now }

  prepare() {
    if (this.running || this.pending || (this.token && this.now() - this.token.createdAt < 240000)) return
    this.token = null
    this.running = true
    try { this.reset(); this.execute() }
    catch { this.fail(new Error('Security check failed. Please retry your message.')) }
  }

  verify(signal?: AbortSignal | null): Promise<string> {
    if (signal?.aborted) return Promise.reject(new DOMException('Cancelled', 'AbortError'))
    if (this.pending) return Promise.reject(new Error('A security check is already running.'))
    if (this.token && this.now() - this.token.createdAt < 240000) {
      const token = this.token.value
      this.token = null
      return Promise.resolve(token)
    }
    return new Promise((resolve, reject) => {
      const finish = (token?: string, error?: Error) => {
        clearTimeout(timeout)
        signal?.removeEventListener('abort', abort)
        this.pending = null
        if (error) reject(error)
        else resolve(token!)
      }
      const abort = () => this.fail(new DOMException('Cancelled', 'AbortError'))
      const timeout = setTimeout(() => this.fail(new Error('Security check failed. Please retry your message.')), 60000)
      this.pending = { resolve: token => finish(token), reject: error => finish(undefined, error) }
      signal?.addEventListener('abort', abort, { once: true })
      // Reuse a challenge already in flight instead of resetting it on submit.
      if (!this.running) {
        this.token = null
        this.running = true
        try { this.reset(); this.execute() }
        catch { this.fail(new Error('Security check failed. Please retry your message.')) }
      }
    })
  }

  succeed(token: string) {
    // Ignore callbacks from a cancelled or disposed challenge.
    if (!this.running) return
    this.running = false
    if (this.pending) this.pending.resolve(token)
    else this.token = { value: token, createdAt: this.now() }
  }

  // An idle token expiring is routine, not a failed message. Ignore stale
  // expiry callbacks after the token was consumed or a new check started.
  expire(value?: string) {
    if (!this.token || (value && value !== this.token.value)) return false
    this.token = null
    return true
  }

  fail(error: Error) {
    this.running = false
    this.token = null
    this.pending?.reject(error)
    try { this.reset() } catch { /* The widget can already be gone during unmount. */ }
  }

  dispose() {
    this.fail(new DOMException('Cancelled', 'AbortError'))
  }
}
