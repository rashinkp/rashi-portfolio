import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { Turnstile, type TurnstileInstance, type TurnstileProps } from '@marsidev/react-turnstile'
import { VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { PreparedVerification } from '../lib/preparedVerification'

export interface ChatVerificationHandle {
  verify: (signal?: AbortSignal | null) => Promise<string>
  prepare: () => void
}

const options: TurnstileProps['options'] = {
  action: 'portfolio_chat', execution: 'execute', appearance: 'interaction-only',
  size: 'compact', theme: 'auto', retry: 'never',
  refreshExpired: 'manual', refreshTimeout: 'manual', responseField: false,
}
const verificationFailed = 'Security check failed. Please retry your message.'

export function ChatVerification({ siteKey, ref }: { siteKey: string; ref: Ref<ChatVerificationHandle> }) {
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

  function fail(message: string) {
    session.fail(new Error(message))
  }

  useImperativeHandle(ref, () => ({
    prepare() { if (ready.current) session.prepare() },
    async verify(signal) {
      if (!ready.current || !widget.current) return Promise.reject(new Error('Security check is loading. Please retry shortly.'))
      setMessage('Checking your browser…')
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
      if (!ready.current) setMessage('Security check could not load. Check your connection and reload this page.')
    }
    const scriptError = (event: Event) => {
      if (event.target instanceof HTMLScriptElement && event.target.id === 'cf-turnstile-script') unavailable()
    }
    // Observe script failure without replacing the wrapper's onload callback.
    document.addEventListener('error', scriptError, true)
    const deadline = setTimeout(unavailable, 15000)
    return () => {
      clearTimeout(deadline)
      document.removeEventListener('error', scriptError, true)
      ready.current = false
      session.dispose()
    }
  }, [session])

  return <VStack gap={1} hAlign="center" width="100%">
    <Turnstile ref={widget} siteKey={siteKey} options={options}
      onWidgetLoad={() => { ready.current = true; setMessage(''); session.prepare() }}
      onSuccess={token => session.succeed(token)}
      onError={() => fail(verificationFailed)}
      onTimeout={() => fail(verificationFailed)}
      onExpire={() => fail('Security check expired. Please retry your message.')}
      onUnsupported={() => fail('Your browser does not support the security check. Please try another browser.')}
    />
    {message && <Text role="status" type="supporting" color="secondary" justify="center">{message}</Text>}
  </VStack>
}
