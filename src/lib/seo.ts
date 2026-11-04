export const siteUrl = 'https://rashinkp.vercel.app'

export const routeMetadata = {
  home: {
    title: 'Rashin KP | Full-stack Product Engineer',
    description: 'Rashin K P, full-stack product engineer building AI-powered hiring workflows. Explore product modernization, reusable interfaces, and integrations at Offrolls.',
    url: `${siteUrl}/`,
    robots: 'index, follow',
  },
  chat: {
    title: 'Ask Rashin | Portfolio',
    description: 'Ask Rashin’s AI portfolio assistant about his work, projects, skills, and engineering experience.',
    url: `${siteUrl}/chat`,
    robots: 'noindex, follow',
  },
} as const

// History API navigation must update metadata too, including returning from a
// direct /chat visit. The static HTML still supplies these tags before JS runs.
export function updateRouteMetadata(isChatPage: boolean) {
  const metadata = isChatPage ? routeMetadata.chat : routeMetadata.home
  document.title = metadata.title
  const setMeta = (attribute: 'name' | 'property', key: string, content: string) => {
    let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
    if (!element) {
      element = document.createElement('meta')
      element.setAttribute(attribute, key)
      document.head.append(element)
    }
    element.content = content
  }
  setMeta('name', 'description', metadata.description)
  setMeta('name', 'robots', metadata.robots)
  setMeta('property', 'og:title', metadata.title)
  setMeta('property', 'og:description', metadata.description)
  setMeta('property', 'og:url', metadata.url)
  setMeta('name', 'twitter:title', metadata.title)
  setMeta('name', 'twitter:description', metadata.description)
  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (canonical) canonical.href = metadata.url
}
