import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { seedContent } from '@/data/seed'
import { fetchSiteContent } from '@/services/content'
import type { SiteContent } from '@/types'

interface ContentState {
  content: SiteContent
  loading: boolean
  error: string | null
  /** 'seed' means Supabase is not configured and the bundled content is shown. */
  source: 'supabase' | 'seed'
  reload: () => Promise<void>
}

const Ctx = createContext<ContentState | null>(null)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(seedContent)
  const [source, setSource] = useState<'supabase' | 'seed'>('seed')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const res = await fetchSiteContent()
      setContent(res.content)
      setSource(res.source)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load content.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  // Apply CMS-controlled brand colours and favicon.
  useEffect(() => {
    const { colors, general } = content.settings
    const root = document.documentElement.style
    root.setProperty('--color-brand', colors.brand)
    root.setProperty('--color-accent', colors.accent)
    root.setProperty('--color-hi', colors.highlight)
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (icon && general.favicon_url) {
      icon.href = general.favicon_url
      if (!general.favicon_url.endsWith('.svg')) icon.removeAttribute('type')
    }
  }, [content.settings])

  const value = useMemo(() => ({ content, loading, error, source, reload }), [content, loading, error, source, reload])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useContent() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useContent must be used inside ContentProvider')
  return ctx
}

/** Convenience selectors used across pages. */
export function usePortfolio() {
  const { content } = useContent()
  return useMemo(() => {
    const main = content.projects.filter((p) => !p.is_lab)
    const labs = content.projects.filter((p) => p.is_lab)
    const categoryName = (slug: string) => content.categories.find((c) => c.slug === slug)?.name ?? slug
    const social = (platform: string) => content.socials.find((s) => s.platform === platform && s.url)?.url ?? null
    const email = content.profile.email || content.settings.general.contact_email || ''
    return { ...content, main, labs, featured: main.filter((p) => p.featured), categoryName, social, email }
  }, [content])
}
