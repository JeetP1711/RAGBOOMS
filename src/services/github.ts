import type { GithubData } from '@/types'

let inflight: Promise<GithubData> | null = null

/** Public GitHub data via the cached server proxy (/api/github). */
export function fetchGithub(fresh = false): Promise<GithubData> {
  if (inflight && !fresh) return inflight
  const p = fetch(`/api/github${fresh ? '?fresh=1' : ''}`).then(async (res) => {
    const data = await res.json().catch(() => null)
    if (!res.ok || !data || data.error) throw new Error(data?.error ?? 'Could not load GitHub data.')
    return data as GithubData
  })
  inflight = p
  p.catch(() => {
    if (inflight === p) inflight = null
  })
  return p
}

/** Share of public, non-fork repositories by primary language. */
export function languageShare(data: GithubData) {
  const counts = new Map<string, number>()
  for (const r of data.repos) if (!r.fork && r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1)
  const total = [...counts.values()].reduce((a, b) => a + b, 0)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([language, count]) => ({ language, count, pct: total ? (count / total) * 100 : 0 }))
}
