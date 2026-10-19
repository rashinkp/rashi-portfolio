export class VerificationError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

// Siteverify consumes each token once. Never accept a client-side success flag.
export async function verifyTurnstile(
  token: unknown,
  origin: string,
  secret: string,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  if (typeof token !== 'string' || !token.trim() || token.length > 2048) {
    throw new VerificationError(403, 'Please complete the security check and retry.')
  }
  // Cloudflare's public test credentials must never become a production bypass.
  if (!secret || /^[123]x0{10,}/.test(secret)) {
    throw new VerificationError(503, 'Chat verification is not configured. Please contact Rashin.')
  }
  let response: Response
  try {
    response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    throw new VerificationError(503, 'Security check is unavailable. Please retry shortly.')
  }
  if (!response.ok) throw new VerificationError(503, 'Security check is unavailable. Please retry shortly.')
  let result: { success?: boolean; hostname?: string; action?: string }
  try { result = await response.json() }
  catch { throw new VerificationError(503, 'Security check is unavailable. Please retry shortly.') }
  if (!result || result.success !== true || result.action !== 'portfolio_chat' || result.hostname !== new URL(origin).hostname) {
    throw new VerificationError(403, 'Security check expired or failed. Please retry.')
  }
}

// A small per-worker guard bounds verification calls during bursts. Distributed
// AI budgets below remain authoritative; this is not a network-level DDoS shield.
export function verificationBurstGuard(limit = 30, windowMs = 60000) {
  let start = 0
  let requests = 0
  return (now = Date.now()) => {
    if (now - start >= windowMs) { start = now; requests = 0 }
    if (requests >= limit) return false
    requests += 1
    return true
  }
}
