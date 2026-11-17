import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useContent } from '@/app/ContentProvider'
import { SITE_URL } from '@/services/supabase'

interface Seo {
  title?: string
  description?: string
  image?: string | null
  /** JSON-LD structured data for this page. */
  jsonLd?: Record<string, unknown>
  noindex?: boolean
}

const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!value) return el?.remove()
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = value
}

/** Sets the page title, description, canonical URL, Open Graph tags and structured data. */
export function useSeo({ title, description, image, jsonLd, noindex }: Seo) {
  const { pathname } = useLocation()
  const { settings } = useContent().content
  const site = settings.general.title || 'RAGBOOMS'
  const desc = description || settings.general.description
  const img = image || settings.general.og_image_url
  const ld = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    const full = title ? `${title} — ${site}` : `${site} — Independent Technology Studio`
    document.title = full
    const url = `${SITE_URL}${pathname === '/' ? '' : pathname}`
    const abs = img ? (img.startsWith('http') ? img : `${SITE_URL}${img}`) : ''

    setMeta('name', 'description', desc)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : '')
    setMeta('property', 'og:title', full)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', abs)
    setMeta('name', 'twitter:card', abs ? 'summary_large_image' : 'summary')

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url

    document.getElementById('page-jsonld')?.remove()
    if (ld) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = 'page-jsonld'
      script.textContent = ld
      document.head.appendChild(script)
    }
  }, [title, site, desc, img, ld, noindex, pathname])
}
