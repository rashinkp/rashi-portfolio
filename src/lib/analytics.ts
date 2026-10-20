import { analyticsConfig } from '../data/analytics-config'
import { analyticsAllowed, analyticsOptOutKey, eventProperties, sections, type AnalyticsEvent } from './analytics-policy'
import { additionalProjects, featuredProjects } from '../data/portfolio'

let enabled = false
let visitorId = ''
let sessionId = ''
let lastPage = ''
let refreshSections = () => {}
const queue: object[] = []
let timer: ReturnType<typeof setTimeout> | undefined

function allowedNow() {
  try { return enabled && analyticsAllowed(location.hostname, localStorage.getItem(analyticsOptOutKey) === 'true', navigator.webdriver) }
  catch { return false }
}

function flush() {
  clearTimeout(timer)
  timer = undefined
  if (!allowedNow()) { queue.length = 0; return }
  if (!queue.length) return
  const body = JSON.stringify({ api_key: analyticsConfig.token, batch: queue.splice(0) })
  // Explicit events only: no DOM, inputs, chat messages, URLs with queries,
  // user identification, session recordings or third-party SDK to download.
  void fetch(`${analyticsConfig.host}/batch/`, {
    method: 'POST', body, headers: { 'Content-Type': 'text/plain' },
    credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
  }).catch(() => {})
}

export function trackEvent(event: AnalyticsEvent, value?: string) {
  if (!allowedNow()) return
  const safe = eventProperties(event, value)
  if (!safe) return
  const path = location.pathname.replace(/\/$/, '') === '/chat' ? '/chat' : '/'
  const ua = navigator.userAgent
  queue.push({ event, distinct_id: visitorId, timestamp: new Date().toISOString(), properties: {
    ...safe, $process_person_profile: false, $geoip_disable: true,
    $current_url: `https://rashinkp.vercel.app${path}`, $pathname: path,
    $host: 'rashinkp.vercel.app', $session_id: sessionId,
    $device_type: /Mobi|Android/i.test(ua) ? 'Mobile' : 'Desktop',
    $browser: /Edg\//.test(ua) ? 'Microsoft Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other',
  } })
  if (queue.length >= 10) flush()
  else timer ??= setTimeout(flush, 1500)
}

export function trackPage(path: string) {
  if (lastPage === path || !allowedNow()) return
  lastPage = path
  trackEvent('$pageview')
  refreshSections()
}

export function installAnalytics() {
  try {
    const url = new URL(location.href)
    if (url.searchParams.get('analytics') === 'off') {
      localStorage.setItem(analyticsOptOutKey, 'true')
      url.searchParams.delete('analytics')
      history.replaceState(history.state, '', url.pathname + url.search + url.hash)
    }
    if (!import.meta.env.PROD || !analyticsAllowed(location.hostname, localStorage.getItem(analyticsOptOutKey) === 'true', navigator.webdriver)) return
    visitorId = localStorage.getItem('portfolio-visitor-id') ?? crypto.randomUUID()
    sessionId = sessionStorage.getItem('portfolio-analytics-session') ?? crypto.randomUUID()
    localStorage.setItem('portfolio-visitor-id', visitorId)
    sessionStorage.setItem('portfolio-analytics-session', sessionId)
    enabled = true
  } catch { return }
  const projects = new Map<string, string>()
  for (const p of [...featuredProjects, ...additionalProjects]) {
    const slug = p.github.split('/').at(-1)!.toLowerCase()
    projects.set(p.github.replace(/\/$/, ''), `${slug}:code`)
    if ('live' in p && typeof p.live === 'string') projects.set(p.live.replace(/\/$/, ''), `${slug}:demo`)
  }
  const social = new Map([
    ['https://github.com/rashinkp', 'github'], ['https://www.linkedin.com/in/rashinkp', 'linkedin'],
    ['https://leetcode.com/u/rashinkp', 'leetcode'], ['https://www.instagram.com/rash.e_', 'instagram'],
  ])
  document.addEventListener('click', event => {
    const a = event.target instanceof Element ? event.target.closest('a') : null
    if (!a) return
    const href = a.getAttribute('href') ?? ''
    if (href === '/chat') trackEvent('chat_opened')
    else if (href === '/resume_rashin.pdf') trackEvent('resume_downloaded')
    else if (href.startsWith('#') && sections.has(href.slice(1))) trackEvent('navigation_clicked', href.slice(1))
    else {
      const destination = href.replace(/\/$/, '')
      if (projects.has(destination)) trackEvent('project_link_clicked', projects.get(destination))
      else if (social.has(destination)) trackEvent('social_link_clicked', social.get(destination))
      else if (destination === 'mailto:rashinkp001@gmail.com') trackEvent('social_link_clicked', 'email')
    }
  }, { passive: true })
  const seen = new Set<string>()
  if ('IntersectionObserver' in window) {
    const observed = new Set<Element>()
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const id = entry.target.id
        if (entry.isIntersecting && !entry.target.closest('[aria-hidden="true"]') && !seen.has(id)) { seen.add(id); trackEvent('section_viewed', id) }
      }
    }, { root: document.querySelector('[data-portfolio-scroll]'), threshold: 0.2 })
    const register = () => {
      for (const id of sections) {
        const element = document.getElementById(id)
        if (element && id !== 'top' && !element.closest('[aria-hidden="true"]') && !observed.has(element)) {
          observed.add(element)
          observer.observe(element)
        }
      }
    }
    // The portfolio can mount lazily when visitors land directly in chat.
    const mutations = new MutationObserver(register)
    mutations.observe(document.getElementById('root')!, { childList: true, subtree: true })
    refreshSections = () => { observer.disconnect(); observed.clear(); register() }
    register()
  }
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush() })
}
