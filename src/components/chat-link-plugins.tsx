import type { MarkdownInlinePlugin } from '@astryxdesign/core/Markdown'
import { ChatReplyLink } from './ChatReplyLink'

// Also link scheme-less profile URLs in existing replies. GFM covers full URLs and emails.
export const chatProfileLinks: MarkdownInlinePlugin[] = [{
  pattern: /\b(?:linkedin|github|leetcode)\.com\/[a-zA-Z0-9/_%?=&+.-]+/g,
  getEndIndex: (_text, match) => match.index! + match[0].replace(/[.,]+$/, '').length,
  render: (match, key) => {
    const url = match[0].replace(/[.,]+$/, '')
    return <ChatReplyLink key={key} href={url}>{url}</ChatReplyLink>
  },
}]
