export const analyticsOptOutKey = 'portfolio-analytics-opt-out'
export const sections = new Set(['top', 'about', 'skills', 'experience', 'projects', 'contact'])
export type AnalyticsEvent = '$pageview' | 'section_viewed' | 'navigation_clicked' | 'project_link_clicked' | 'social_link_clicked' | 'resume_downloaded' | 'chat_opened' | 'chat_message_sent' | 'contact_draft_opened'
const allowedEvents = new Set<AnalyticsEvent>(['$pageview', 'section_viewed', 'navigation_clicked', 'project_link_clicked', 'social_link_clicked', 'resume_downloaded', 'chat_opened', 'chat_message_sent', 'contact_draft_opened'])

export function analyticsAllowed(hostname: string, optedOut: boolean, automated: boolean) {
  return hostname === 'rashinkp.vercel.app' && !optedOut && !automated
}

export function eventProperties(event: AnalyticsEvent, value?: string) {
  if (!allowedEvents.has(event)) return null
  if (event === 'section_viewed' || event === 'navigation_clicked') return sections.has(value ?? '') ? { section: value } : null
  if (event === 'social_link_clicked') return ['github', 'linkedin', 'leetcode', 'instagram', 'email'].includes(value ?? '') ? { profile: value } : null
  if (event === 'project_link_clicked') return /^(byway|mobilify|linkup|delivery-management|adhaar-ocr|student-management-system):(demo|code)$/.test(value ?? '') ? { project_link: value } : null
  return {}
}
