import { publicContactLinks } from '../../supabase/functions/_shared/public-links.ts'
import { additionalProjects, featuredProjects } from './portfolio.ts'

function canonicalUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null
    return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}`
  } catch { return null }
}

const publishedLinks = [
  ...Object.values(publicContactLinks).filter(url => url.startsWith('https:')),
  ...featuredProjects.flatMap(project => [project.live, project.github]),
  ...additionalProjects.map(project => project.github),
]
const allowedLinks = new Map(publishedLinks.map(url => [canonicalUrl(url), url]))

export function resolveChatLink(value: string): string | null {
  const href = value.trim()
  if (/^\/(?:#[a-z-]+|resume_rashin\.pdf)$/.test(href)) return href
  if (href === publicContactLinks.Email || href === publicContactLinks.Email.slice(7)) return publicContactLinks.Email
  const normalized = /^(?:www\.)?(?:linkedin|github|leetcode)\.com\//.test(href) ? `https://${href}` : href
  const key = canonicalUrl(normalized)
  return key ? allowedLinks.get(key) ?? null : null
}
