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

export function ChatVerification({ siteKey, ref, onReadyChange, onInteractionChange }: { siteKey: string; ref: Ref<ChatVerificationHandle>; onReadyChange: (ready: boolean) => void; onInteractionChange: (interactive: boolean) => void }) {
  const widget = useRef<TurnstileInstance | undefined>(undefined)
  const ready = useRef(false)
  // Callbacks read the live widget only when a challenge starts or resets.
  // oxlint-disable-next-line react/refs
  const [session] = useState(() => new PreparedVerification(
    () => { onReadyChange(false); setFailed(false); setMessage('Checking your browser… You can type while you wait.'); widget.current!.execute() },
    () => { widget.current?.reset() },
    Date.now,
    error => { onReadyChange(false); onInteractionChange(false); setInteractive(false); setMessage(error.message); setFailed(true) },
  ))
  const [message, setMessage] = useState('Loading security check… You can type while you wait.')
  const [failed, setFailed] = useState(false)
  const [interactive, setInteractive] = useState(false)

  function fail(message: string) {
    onReadyChange(false)
    onInteractionChange(false)
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
        const cancelled = error instanceof Error && error.name === 'AbortError'
        onReadyChange(false)
        onInteractionChange(false)
        setInteractive(false)
        setMessage(!cancelled && error instanceof Error ? error.message : '')
        setFailed(!cancelled)
        if (cancelled) session.prepare()
        throw error
      }
    },
  }), [session, onReadyChange, onInteractionChange])

  useEffect(() => {
    const unavailable = () => {
      if (!ready.current) { onReadyChange(false); setMessage('Security check could not load. Please retry.'); setFailed(true) }
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
    <VStack width="100%" className={interactive ? '[&>div]:max-w-full' : '[&>div]:max-w-full [&>div]:h-0! overflow-hidden'}>
      <Turnstile ref={widget} siteKey={siteKey} options={options}
        onWidgetLoad={() => { ready.current = true; onReadyChange(false); setMessage(''); session.prepare() }}
        onBeforeInteractive={() => { session.setInteractive(true); onReadyChange(false); onInteractionChange(true); setInteractive(true); setMessage('Click “Verify you are human” to continue.') }}
        onAfterInteractive={() => { session.setInteractive(false); onInteractionChange(false); setInteractive(false) }}
        onSuccess={token => { const result = session.succeed(token); if (!result) return; onInteractionChange(false); setInteractive(false); setMessage(''); setFailed(false); onReadyChange(result === 'cached') }}
        onError={() => fail(verificationFailed)}
        onTimeout={() => fail(verificationFailed)}
        onExpire={token => { if (session.expire(token) && document.visibilityState === 'visible') session.prepare() }}
        onUnsupported={() => { ready.current = false; fail('Your browser does not support the security check. Please try another browser.') }}
      />
    </VStack>
    {message && <Text role="status" type="supporting" color="secondary" justify="center">{message}</Text>}
    {failed && <Button label="Retry security check" variant="ghost" size="sm" onClick={() => { if (!ready.current) { window.location.reload(); return } setFailed(false); setMessage(''); onReadyChange(false); onInteractionChange(false); setInteractive(false); session.prepare() }} />}
  </VStack>
}
