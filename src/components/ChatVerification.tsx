import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { Turnstile, type TurnstileInstance, type TurnstileProps } from '@marsidev/react-turnstile'
import { VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Button } from '@astryxdesign/core/Button'
import { PreparedVerification } from '../lib/preparedVerification'

export interface ChatVerificationHandle {
  verify: (signal?: AbortSignal | null) => Promise<string>
  prepare: () => void
}

const options: TurnstileProps['options'] = {
  action: 'portfolio_chat', execution: 'execute', appearance: 'interaction-only',
  size: 'flexible', theme: 'auto', retry: 'never',
  refreshExpired: 'manual', refreshTimeout: 'manual', responseField: false,
}
const verificationFailed = 'Security check failed. Please retry your message.'

export function ChatVerification({ siteKey, ref, onReadyChange }: { siteKey: string; ref: Ref<ChatVerificationHandle>; onReadyChange: (ready: boolean) => void }) {
  const widget = useRef<TurnstileInstance | undefined>(undefined)
  const ready = useRef(false)
  // Callbacks read the live widget only when a challenge starts or resets.
  // oxlint-disable-next-line react/refs
  const [session] = useState(() => new PreparedVerification(
    () => { widget.current!.execute() },
    () => { widget.current?.reset() },
  ))
  // Routine initialization must not add/remove a status row at the animation
  // handoff. Explicit verification progress and failures remain visible.
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const [interactive, setInteractive] = useState(false)

  function fail(message: string) {
    onReadyChange(ready.current)
    setInteractive(false)
    setMessage(message)
    setFailed(true)
    session.fail(new Error(message))
  }

  useImperativeHandle(ref, () => ({
    prepare() { if (ready.current) session.prepare() },
    async verify(signal) {
      if (!ready.current || !widget.current) return Promise.reject(new Error('Security check is loading. Please retry shortly.'))
      setFailed(false)
      setMessage('')
      try {
        const token = await session.verify(signal)
        setMessage('')
        return token
      } catch (error) {
        setMessage(error instanceof Error && error.name !== 'AbortError' ? error.message : '')
        throw error
      }
    },
  }), [session])

  useEffect(() => {
    const unavailable = () => {
      if (!ready.current) { onReadyChange(false); setMessage('Security check could not load. Reload this page to retry.') }
    }
    const scriptError = (event: Event) => {
      if (event.target instanceof HTMLScriptElement && event.target.id === 'cf-turnstile-script') unavailable()
    }
    // Observe script failure without replacing the wrapper's onload callback.
    const refresh = () => { if (ready.current && document.visibilityState === 'visible') session.prepare() }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    document.addEventListener('error', scriptError, true)
    const deadline = setTimeout(unavailable, 15000)
    return () => {
      clearTimeout(deadline)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      document.removeEventListener('error', scriptError, true)
      ready.current = false
      session.dispose()
    }
  }, [session, onReadyChange])

  return <VStack gap={1} hAlign="center" width="100%" className="[&>div]:max-w-full">
    <VStack width="100%" className={interactive ? '[&>div]:max-w-full' : 'hidden'}>
      <Turnstile ref={widget} siteKey={siteKey} options={options}
        onWidgetLoad={() => { ready.current = true; onReadyChange(true); setMessage(''); session.prepare() }}
        onBeforeInteractive={() => { setInteractive(true); setMessage('Complete the security check to send your message.') }}
        onAfterInteractive={() => setInteractive(false)}
        onSuccess={token => { session.succeed(token); setInteractive(false); setMessage(''); setFailed(false); onReadyChange(true) }}
        onError={() => fail(verificationFailed)}
        onTimeout={() => fail(verificationFailed)}
        onExpire={token => { if (session.expire(token) && document.visibilityState === 'visible') session.prepare() }}
        onUnsupported={() => { ready.current = false; fail('Your browser does not support the security check. Please try another browser.') }}
      />
    </VStack>
    {message && <Text role="status" type="supporting" color="secondary" justify="center">{message}</Text>}
    {failed && <Button label="Retry security check" variant="ghost" size="sm" onClick={() => { setFailed(false); setMessage(''); setInteractive(false); session.prepare() }} />}
  </VStack>
}
