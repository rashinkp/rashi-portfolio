import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { Turnstile, type TurnstileInstance, type TurnstileProps } from '@marsidev/react-turnstile'
import { VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'

export interface ChatVerificationHandle {
  verify: (signal?: AbortSignal | null) => Promise<string>
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
  const pending = useRef<{ resolve: (token: string) => void; reject: (error: Error) => void } | null>(null)
  // Routine initialization must not add/remove a status row at the animation
  // handoff. Explicit verification progress and failures remain visible.
  const [message, setMessage] = useState('')

  function fail(message: string) {
    pending.current?.reject(new Error(message))
    setMessage(message)
  }

  useImperativeHandle(ref, () => ({
    verify(signal) {
      if (signal?.aborted) return Promise.reject(new DOMException('Cancelled', 'AbortError'))
      if (!ready.current || !widget.current) return Promise.reject(new Error('Security check is loading. Please retry shortly.'))
      if (pending.current) return Promise.reject(new Error('A security check is already running.'))
      setMessage('Checking your browser…')
      return new Promise<string>((resolve, reject) => {
        const finish = (token?: string, error?: Error) => {
          clearTimeout(timeout)
          signal?.removeEventListener('abort', abort)
          pending.current = null
          if (error) { widget.current?.reset(); reject(error) }
          else { setMessage(''); resolve(token!) }
        }
        const abort = () => { setMessage(''); finish(undefined, new DOMException('Cancelled', 'AbortError')) }
        const timeout = setTimeout(() => {
          setMessage(verificationFailed)
          finish(undefined, new Error(verificationFailed))
        }, 60000)
        pending.current = { resolve: token => finish(token), reject: error => finish(undefined, error) }
        signal?.addEventListener('abort', abort, { once: true })
        try { widget.current!.reset(); widget.current!.execute() }
        catch { pending.current.reject(new Error(verificationFailed)) }
      })
    },
  }), [])

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
      pending.current?.reject(new DOMException('Cancelled', 'AbortError'))
    }
  }, [])

  return <VStack gap={1} hAlign="center" width="100%">
    <Turnstile ref={widget} siteKey={siteKey} options={options}
      onWidgetLoad={() => { ready.current = true; setMessage('') }}
      onSuccess={token => pending.current?.resolve(token)}
      onError={() => fail(verificationFailed)}
      onTimeout={() => fail(verificationFailed)}
      onExpire={() => { if (pending.current) fail('Security check expired. Please retry your message.') }}
      onUnsupported={() => fail('Your browser does not support the security check. Please try another browser.')}
    />
    {message && <Text role="status" type="supporting" color="secondary" justify="center">{message}</Text>}
  </VStack>
}
