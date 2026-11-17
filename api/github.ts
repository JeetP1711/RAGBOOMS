/**
 * GET /api/github — public GitHub data for the configured account.
 *
 * Only ever calls GitHub's *public* endpoints for the user, so private
 * repositories can never be returned, with or without a token. The optional
 * GITHUB_TOKEN stays on the server and only raises the rate limit.
 * Responses are cached in memory and at the CDN to respect GitHub's limits.
 */
const TTL_MS = 30 * 60 * 1000
let cache: { at: number; body: string } | null = null

const gh = async (path: string) => {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'portfolio-site',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch(`https://api.github.com${path}`, { headers })
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}`)
  return res.json()
}

const summarize = (e: any): string => {
  const p = e.payload ?? {}
  switch (e.type) {
    case 'PushEvent':
      return `Pushed to ${String(p.ref ?? '').replace('refs/heads/', '') || 'a branch'}`
    case 'CreateEvent':
      return `Created ${p.ref_type ?? 'something'}${p.ref ? ` ${p.ref}` : ''}`
    case 'DeleteEvent':
      return `Deleted ${p.ref_type ?? 'something'}${p.ref ? ` ${p.ref}` : ''}`
    case 'PullRequestEvent':
      return `${cap(p.action ?? 'updated')} a pull request`
    case 'IssuesEvent':
      return `${cap(p.action ?? 'updated')} an issue`
    case 'IssueCommentEvent':
      return 'Commented on an issue'
    case 'WatchEvent':
      return 'Starred the repository'
    case 'ForkEvent':
      return 'Forked the repository'
    case 'ReleaseEvent':
      return `Published a release${p.release?.tag_name ? ` ${p.release.tag_name}` : ''}`
    case 'PublicEvent':
      return 'Made the repository public'
    default:
      return String(e.type ?? 'Activity').replace(/Event$/, '')
  }
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const json = (body: string, status = 200, cacheable = true) =>
  new Response(body, {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cacheable ? 'public, s-maxage=1800, stale-while-revalidate=86400' : 'no-store',
    },
  })

export async function GET(request: Request) {
  const user = process.env.GITHUB_USERNAME || 'JeetP1711'
  const fresh = new URL(request.url).searchParams.get('fresh') === '1'
  if (cache && !fresh && Date.now() - cache.at < TTL_MS) return json(cache.body)

  try {
    const profile = await gh(`/users/${user}`)
    const repos: any[] = []
    for (let page = 1; page <= 5; page++) {
      const batch = await gh(`/users/${user}/repos?type=owner&sort=pushed&per_page=100&page=${page}`)
      repos.push(...batch)
      if (batch.length < 100) break
    }
    const events = await gh(`/users/${user}/events/public?per_page=30`).catch(() => [])

    const body = JSON.stringify({
      profile: {
        login: profile.login,
        name: profile.name,
        avatar_url: profile.avatar_url,
        html_url: profile.html_url,
        bio: profile.bio,
        public_repos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
      },
      repos: repos
        .filter((r) => r.private === false)
        .map((r) => ({
          id: r.id,
          name: r.name,
          full_name: r.full_name,
          description: r.description,
          html_url: r.html_url,
          homepage: r.homepage || null,
          language: r.language,
          stars: r.stargazers_count,
          forks: r.forks_count,
          topics: r.topics ?? [],
          default_branch: r.default_branch,
          pushed_at: r.pushed_at,
          updated_at: r.updated_at,
          fork: r.fork,
          archived: r.archived,
        })),
      events: (events as any[]).map((e) => ({
        id: e.id,
        type: e.type,
        repo: e.repo?.name ?? '',
        created_at: e.created_at,
        summary: summarize(e),
      })),
      fetched_at: new Date().toISOString(),
    })
    cache = { at: Date.now(), body }
    return json(body)
  } catch (err) {
    // Serve stale data rather than nothing when GitHub is rate-limiting us.
    if (cache) return json(cache.body)
    return json(JSON.stringify({ error: 'GitHub is unavailable right now.' }), 502, false)
  }
}
