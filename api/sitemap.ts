/**
 * GET /sitemap.xml (rewritten to /api/sitemap) — static routes plus every
 * published project. Uses the public anon key, so RLS guarantees drafts are
 * never listed.
 */
import { createClient } from '@supabase/supabase-js'

const STATIC = ['/', '/about', '/projects', '/experience', '/labs', '/achievements', '/github', '/contact']

export async function GET(request: Request) {
  const site = (process.env.SITE_URL || process.env.VITE_SITE_URL || new URL(request.url).origin).replace(/\/$/, '')
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  let projects: { slug: string; updated_at: string }[] = []
  if (url && key) {
    const db = createClient(url, key, { auth: { persistSession: false } })
    const { data } = await db.from('projects').select('slug, updated_at').eq('visibility', 'published')
    projects = data ?? []
  }

  const entries = [
    ...STATIC.map((p) => `<url><loc>${site}${p}</loc></url>`),
    ...projects.map(
      (p) => `<url><loc>${site}/projects/${p.slug}</loc><lastmod>${p.updated_at.slice(0, 10)}</lastmod></url>`,
    ),
  ]
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`,
    { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, s-maxage=3600' } },
  )
}
