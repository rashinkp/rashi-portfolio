import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@astryxdesign/core/Button'
import { ChatComposer, ChatLayout, ChatMessage, ChatMessageBubble, ChatMessageList } from '@astryxdesign/core/Chat'
import { useMediaQuery } from '@astryxdesign/core/hooks'
import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { Link } from '@astryxdesign/core/Link'
import { Markdown, type MarkdownSource } from '@astryxdesign/core/Markdown'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { RobotPet } from './RobotPet'
import { ChatVerification, type ChatVerificationHandle } from './ChatVerification'
import { ChatSources } from './ChatSources'
import { ChatScrollButton } from './ChatScrollButton'
import { ChatReplyLink } from './ChatReplyLink'
import { chatProfileLinks } from './chat-link-plugins'
import { recentChatHistory } from '../../supabase/functions/_shared/chat-input'
import { readChatSession, saveChatSession } from '../data/chat-session'
import { trackEvent } from '../lib/analytics'

const projectUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
const configured = Boolean(projectUrl && publicKey && turnstileSiteKey)
const suggestions = ['What did Rashin build at Offrolls?', 'Tell me about ByWay.', 'What payment integrations has he built?']
const headerButtonClass = "h-10! w-10! p-0! rounded-lg! text-primary! bg-transparent! bg-none! cursor-pointer! transition-colors hover:bg-neutral! hover:bg-none! focus-visible:bg-neutral!"
const safeSource = (url: string) => /^\/(?:#[a-z-]+|resume_rashin\.pdf)$/.test(url)

export default function PortfolioChat({ hasArrived = true, isActive = true, onBack }: { hasArrived?: boolean; isActive?: boolean; onBack?: (event: MouseEvent<HTMLElement>) => void }) {
  const compactWelcome = useMediaQuery('(min-width: 480px) and (max-height: 500px)')
  const [input, setInput] = useState('')
  const [validation, setValidation] = useState('')
  const [savedMessages] = useState(readChatSession)
  const verification = useRef<ChatVerificationHandle>(null)
  useEffect(() => { if (isActive) document.title = 'Ask Rashin | Portfolio' }, [isActive])
  useEffect(() => {
    if (hasArrived) document.querySelector<HTMLElement>('[data-chat-heading]')?.focus({ preventScroll: true })
  }, [hasArrived])
  const verifiedFetch: typeof fetch = useCallback(async (url, options) => {
    if (!verification.current) throw new Error('Security check is loading. Please retry shortly.')
    const turnstileToken = await verification.current.verify(options?.signal)
    const response = await fetch(url, { ...options, body: JSON.stringify({ ...JSON.parse(String(options?.body)), turnstileToken }) })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(typeof data.error === 'string' ? data.error : 'The assistant is unavailable. Please try again later.')
    }
    trackEvent('chat_message_sent')
    return response
  }, [])
  // Transport stores this callback; verification refs are read only on send.
  // oxlint-disable-next-line react/refs
  const transport = useMemo(() => new DefaultChatTransport({
    api: `${projectUrl ?? ''}/functions/v1/chat`,
    headers: publicKey ? { apikey: publicKey } : {},
    // Send only recent text. Source metadata and other UI parts never become prompts.
    prepareSendMessagesRequest: ({ messages }) => {
      const recent = recentChatHistory(messages.map(({ id, role, parts }) => ({
        id, role, content: parts.filter(part => part.type === 'text').map(part => part.text).join('\n').trim(),
      })).filter(message => message.content))
      const payload = { messages: recent.map(({ id, role, content }) => ({ id, role, parts: [{ type: 'text', text: content }] })) }
      // Keep room for JSON overhead and verification even with multibyte text.
      while (payload.messages.length > 1 && new TextEncoder().encode(JSON.stringify(payload)).length > 35000) payload.messages.shift()
      return { body: payload }
    },
    fetch: verifiedFetch,
  }), [verifiedFetch])
  const { messages, sendMessage, status, error, clearError, stop, setMessages, regenerate } = useChat({ transport, messages: savedMessages })
  useEffect(() => {
    // Debounce streaming writes to keep low-end phones responsive. Flush on
    // reload/navigation so the latest partial reply is not lost.
    const save = () => saveChatSession(messages)
    const timer = window.setTimeout(save, 300)
    window.addEventListener('pagehide', save)
    return () => { window.clearTimeout(timer); window.removeEventListener('pagehide', save) }
  }, [messages])
  const busy = status === 'submitted' || status === 'streaming'
  useEffect(() => { if (!isActive) void stop() }, [isActive, stop])

  function submit(value: string) {
    const question = value.trim()
    if (!configured || busy || !question) return
    if (question.length > 2000) {
      setValidation('Please keep your question under 2,000 characters.')
      return
    }
    setValidation('')
    clearError()
    setInput('')
    void sendMessage({ text: question })
  }

  return (
    <VStack as="main" gap={0} height="100dvh" width="100%" className="overflow-hidden bg-surface text-primary font-sans antialiased">
      <HStack as="header" gap={3} paddingInline={4} paddingBlock={2} hAlign="between" vAlign="center" className="shrink-0 border-b border-border">
        <Button label="Back to portfolio" tooltip="Back to portfolio" href="/" onClick={onBack} variant="ghost" className={headerButtonClass}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m12 5-7 7 7 7M5 12h14" /></svg>
        </Button>
        <HStack gap={2} vAlign="center" hAlign="center" className="min-w-0 flex-1">
          <RobotPet isChatWelcome compact greetOnArrival={hasArrived} />
          <Heading level={1} data-chat-heading="true" tabIndex={-1} justify="center" className="font-sans! text-base! focus:outline-none">Ask Rashin</Heading>
        </HStack>
        <Button label="New chat" tooltip="New chat" variant="ghost" className={headerButtonClass} onClick={() => { void stop(); setMessages([]); saveChatSession([]); clearError(); setValidation(''); setInput('') }}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 3a2.12 2.12 0 0 1 3 3l-8 8-4 1 1-4 8-8Z" /></svg>
        </Button>
      </HStack>
      <VStack gap={0} width="100%" className="min-h-0 flex-1">
          <ChatLayout
            className="[&>div:first-child]:pb-2! [&>div:last-child>div:last-child]:pb-1!"
            density="spacious"
            scrollButton={messages.length === 0 ? null : <ChatScrollButton />}
            emptyState={
              <VStack gap={compactWelcome ? 2 : 3} padding={compactWelcome ? 2 : 3} hAlign="center" className={compactWelcome ? "w-full" : "w-full sm:gap-5 sm:p-5"}>
                <VStack gap={compactWelcome ? 1 : 2} hAlign="center">
                  <Heading level={2} justify="center" textWrap="balance" className={compactWelcome ? "text-base! leading-tight!" : "text-xl! sm:text-2xl!"}>What would you like to know?</Heading>
                  {!compactWelcome && <Text color="secondary" justify="center">Ask about my work, projects, or experience.</Text>}
                </VStack>
                <Grid columns={compactWelcome ? 3 : 1} gap={2} width="100%" maxWidth={compactWelcome ? 720 : 440}>
                  {suggestions.map(question => <Button key={question} label={question} variant="secondary" size="sm" className={compactWelcome ? "h-auto! min-h-10! whitespace-normal! justify-start! text-left! text-sm! leading-snug! px-2! py-1!" : "h-auto! min-h-10! whitespace-normal! justify-start! text-left!"} width="100%" isDisabled={!configured} onClick={() => submit(question)} />)}
                </Grid>
                {!configured && <Text role="status" color="secondary">The assistant will be available soon.</Text>}
              </VStack>
            }
            composer={
              <VStack gap={1} paddingBlock={0}>
                {configured && isActive && <ChatVerification ref={verification} siteKey={turnstileSiteKey!} />}
                {error && <VStack gap={2} role="alert">
                  <Text color="secondary">{error.message}</Text>
                  <Button label="Retry answer" variant="secondary" isDisabled={busy} onClick={() => { clearError(); void regenerate() }} />
                </VStack>}
                <ChatComposer
                  className="[&>div:has([contenteditable])]:flex-row! [&>div:has([contenteditable])]:items-center! [&>div:has([contenteditable])]:rounded-2xl! [&>div:has([contenteditable])>div:first-child]:flex-1! [&>div:has([contenteditable])>div:first-child]:min-w-0! [&_.astryx-chat-composer-input]:min-h-8! [&_[contenteditable]]:min-h-8! [&_.astryx-chat-composer-input>[aria-hidden]]:inset-y-0! [&_.astryx-chat-composer-input>[aria-hidden]]:flex! [&_.astryx-chat-composer-input>[aria-hidden]]:items-center!"
                  value={input}
                  onChange={value => { setInput(value); if (validation) setValidation('') }}
                  onSubmit={submit}
                  onStop={() => { void stop() }}
                  isStopShown={busy}
                  isDisabled={!configured}
                  placeholder={configured ? 'Ask a question…' : 'The assistant will be available soon…'}
                  status={validation ? { type: 'error', message: validation } : undefined}
                  elevation="none"
                  density="compact"
                />
                <Text type="supporting" color="secondary" justify="center">AI can err. Avoid private info.</Text>
              </VStack>
            }>
            {messages.length > 0 ? (
              <ChatMessageList density="compact" gap={6} align="top" isStreaming={busy} className="py-3 [&>div]:px-0!">
                {messages.map(message => {
                  const sources: Record<string, MarkdownSource> = {}
                  for (const part of message.parts) {
                    if (part.type === 'source-url' && safeSource(part.url)) sources[part.sourceId] = { title: part.title, url: part.url }
                  }
                  const text = message.parts.filter(part => part.type === 'text').map(part => part.text).join('\n')
                  return (
                    <ChatMessage key={message.id} sender={message.role}>
                      <ChatMessageBubble variant={message.role === 'user' ? 'filled' : 'ghost'} width={message.role === 'assistant' ? '100%' : undefined} className={message.role === 'assistant' ? 'px-0!' : undefined}>
                        {message.role === 'user' ? <Text className="whitespace-pre-wrap wrap-anywhere">{text}</Text> : (
                          <VStack gap={3} className="min-w-0 wrap-anywhere">
                            <Markdown density="compact" contentWidth="100%" className="text-secondary! [&_.astryx-markdown-paragraph]:text-secondary! [&_.astryx-list-item]:text-secondary! [&_strong]:text-primary! [&_li::marker]:text-secondary! [&_.astryx-markdown-paragraph]:leading-normal! [&_.astryx-markdown-paragraph]:my-3! [&_.astryx-markdown-list]:my-2! [&_ul]:my-0! [&_ol]:my-0! [&_ul]:pl-6! [&_ol]:pl-6! [&_li]:leading-normal! [&_li]:my-0! [&_li]:py-1! [&_li]:pl-1! [&_li_.astryx-markdown-paragraph]:my-0! [&_li>ul]:my-2! [&_li>ol]:my-2! [&_h3]:text-lg! [&_h4]:text-base! [&_h3]:font-sans! [&_h4]:font-sans! [&_h3]:mt-5! [&_h3]:mb-2! [&_h4]:mt-4! [&_h4]:mb-2! [&>:first-child]:mt-0! [&>:last-child]:mb-0! [&_table]:text-sm!" headingLevelStart={3} sources={sources} citationStyle="number" isStreaming={status === 'streaming' && message.id === messages.at(-1)?.id}
                              autolink="gfm" inlinePlugins={chatProfileLinks}
                              components={{ image: () => null, link: ChatReplyLink, citation: ({ source, number }) => <Link href={source.url ?? '/'} target="_blank" rel="noopener noreferrer" tooltip={source.title}>{`[${Object.keys(sources).find(id => sources[id].title === source.title && sources[id].url === source.url) ?? number}]`}</Link> }}>
                              {text || (busy ? 'Looking through my notes…' : 'No answer was returned. Please retry.')}
                            </Markdown>
                            <ChatSources sources={sources} />
                          </VStack>
                        )}
                      </ChatMessageBubble>
                    </ChatMessage>
                  )
                })}
                {status === 'submitted' && <ChatMessage sender="assistant"><ChatMessageBubble variant="ghost" width="100%" className="px-0!"><Text role="status">Looking through my notes…</Text></ChatMessageBubble></ChatMessage>}
              </ChatMessageList>
            ) : null}
          </ChatLayout>
      </VStack>
    </VStack>
  )
}
