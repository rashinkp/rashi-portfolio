import { createContext, use, type ReactNode } from 'react'
import { Link } from '@astryxdesign/core/Link'
import { resolveChatLink } from '../data/chat-links'

const InsideReplyLink = createContext(false)

export function ChatReplyLink({ href, children }: { href: string; children: ReactNode }) {
  const insideLink = use(InsideReplyLink)
  const destination = resolveChatLink(href)
  if (!destination || insideLink) return <>{children}</>
  return <InsideReplyLink value={true}><Link href={destination} target={destination.startsWith('https:') ? '_blank' : undefined} rel="noopener noreferrer">{children}</Link></InsideReplyLink>
}

