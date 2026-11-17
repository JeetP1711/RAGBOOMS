import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, GitFork, RefreshCw, Search, Star } from 'lucide-react'
import { useContent } from '@/app/ContentProvider'
import { Button, EmptyState, Spinner } from '@/components/ui'
import { listProjects, listRows, patchProject, saveProject } from '@/services/admin'
import { fetchGithub } from '@/services/github'
import { db } from '@/services/supabase'
import type { GithubData, GithubMeta, GithubRepo, GithubSyncLog, Project } from '@/types'
import { isHttpUrl, timeAgo } from '@/utils'
import { AdminPage, Panel, Pill, useFeedback } from '../ui'

const meta = (r: GithubRepo): GithubMeta => ({
  full_name: r.full_name,
  language: r.language,
  stars: r.stars,
  forks: r.forks,
  topics: r.topics,
  pushed_at: r.pushed_at,
  default_branch: r.default_branch,
  synced_at: new Date().toISOString(),
})
const humanize = (name: string) =>
  name
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
const sameRepo = (a: string | null, b: string) => !!a && a.replace(/\/$/, '').toLowerCase() === b.toLowerCase()

const log = (action: string, status: string, repo_count: number, details: Record<string, unknown>) =>
  db().from('github_sync_logs').insert({ action, status, repo_count, details })

export default function GithubAdmin() {
  const fb = useFeedback()
  const { reload } = useContent()
  const [data, setData] = useState<GithubData | null>(null)
  const [error, setError] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [logs, setLogs] = useState<GithubSyncLog[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [q, setQ] = useState('')
  const [hideForks, setHideForks] = useState(true)
  const [busy, setBusy] = useState<'' | 'fetch' | 'import' | 'sync'>('fetch')

  const loadLocal = useCallback(async () => {
    const [p, l] = await Promise.all([listProjects(), listRows<GithubSyncLog>('github_sync_logs', 'created_at', false)])
    setProjects(p)
    setLogs(l.slice(0, 8))
  }, [])

  const fetchRepos = useCallback(async (fresh: boolean) => {
    setBusy('fetch')
    setError('')
    try {
      setData(await fetchGithub(fresh))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach GitHub.')
    } finally {
      setBusy('')
    }
  }, [])

  useEffect(() => {
    void fetchRepos(false)
    loadLocal().catch(fb.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** repo id → project already linked to it (by id, or by matching GitHub URL). */
  const linked = useMemo(() => {
    const map = new Map<number, Project>()
    for (const r of data?.repos ?? []) {
      const p = projects.find((x) => x.github_repo_id === r.id) ?? projects.find((x) => sameRepo(x.github_url, r.html_url))
      if (p) map.set(r.id, p)
    }
    return map
  }, [data, projects])

  const shown = useMemo(
    () =>
      (data?.repos ?? []).filter(
        (r) => (!hideForks || !r.fork) && (!q || `${r.name} ${r.description ?? ''} ${r.language ?? ''}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [data, q, hideForks],
  )
  const toggle = (id: number) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  async function importSelected() {
    if (!data) return
    const repos = data.repos.filter((r) => selected.has(r.id) && !linked.has(r.id))
    if (!repos.length) return
    setBusy('import')
    const done: string[] = []
    const failed: string[] = []
    for (const r of repos) {
      try {
        await saveProject({
          title: humanize(r.name),
          slug: r.name,
          short_description: r.description ?? '',
          status: r.archived ? 'Archived' : 'Prototype',
          visibility: 'draft', // never published automatically
          is_lab: true,
          featured: false,
          sort_order: 999,
          github_url: r.html_url,
          live_url: isHttpUrl(r.homepage) ? r.homepage : null,
          github_repo_id: r.id,
          github_meta: meta(r),
          technologies: r.language ? [r.language] : [],
          categories: [],
        })
        done.push(r.name)
      } catch (e) {
        failed.push(`${r.name}: ${e instanceof Error ? e.message : 'failed'}`)
      }
    }
    await log('import', failed.length ? 'partial' : 'success', done.length, { imported: done, failed })
    setSelected(new Set())
    await loadLocal().catch(fb.error)
    void reload()
    setBusy('')
    if (done.length) fb.success(`${done.length} repositor${done.length > 1 ? 'ies' : 'y'} imported as draft${done.length > 1 ? 's' : ''}.`)
    if (failed.length) fb.error(failed.join(' · '))
  }

  /** Refreshes stars, forks, language and last-commit date on linked projects. Never touches your written content. */
  async function sync() {
    setBusy('sync')
    try {
      const fresh = await fetchGithub(true)
      setData(fresh)
      const current = await listProjects()
      let updated = 0
      const missing: string[] = []
      for (const p of current) {
        const repo = fresh.repos.find((r) => r.id === p.github_repo_id) ?? fresh.repos.find((r) => sameRepo(p.github_url, r.html_url))
        if (repo) {
          await patchProject(p.id, { github_repo_id: repo.id, github_meta: meta(repo) })
          updated++
        } else if (p.github_repo_id) missing.push(p.title)
      }
      await log('sync', 'success', updated, { missing })
      await loadLocal()
      void reload()
      fb.success(`${updated} project${updated === 1 ? '' : 's'} synchronised with GitHub.`)
      if (missing.length) fb.error(`No longer public on GitHub: ${missing.join(', ')}. Consider unpublishing.`)
    } catch (e) {
      await log('sync', 'error', 0, { error: e instanceof Error ? e.message : String(e) })
      fb.error(e)
    } finally {
      setBusy('')
    }
  }

  const importable = [...selected].filter((id) => !linked.has(id)).length

  return (
    <AdminPage
      title="GitHub"
      description="Bring public repositories into the portfolio as drafts, and keep their GitHub stats up to date."
      actions={
        <>
          <Button variant="secondary" loading={busy === 'sync'} disabled={!!busy} onClick={() => void sync()}>
            <RefreshCw className="size-4" /> Sync linked projects
          </Button>
          <Button loading={busy === 'import'} disabled={!!busy || importable === 0} onClick={() => void importSelected()}>
            <Download className="size-4" /> Import {importable || ''} as draft{importable === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <Panel className="mb-6">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
          {data ? (
            <>
              <span className="flex items-center gap-3">
                <img src={data.profile.avatar_url} alt="" className="size-9 rounded-full border border-line" />
                <span>
                  <span className="block font-medium">@{data.profile.login}</span>
                  <span className="block text-xs text-mute">{data.profile.public_repos} public repositories · fetched {timeAgo(data.fetched_at)}</span>
                </span>
              </span>
              <span className="text-xs text-mute">{linked.size} linked to portfolio projects</span>
            </>
          ) : (
            <span className="text-mute">{busy === 'fetch' ? 'Contacting GitHub…' : error}</span>
          )}
          <Button size="sm" variant="ghost" className="ml-auto" disabled={!!busy} onClick={() => void fetchRepos(true)}>
            <RefreshCw className="size-4" /> Refresh list
          </Button>
        </div>
        <p className="mt-4 border-t border-line pt-3 text-xs text-dim">
          The account is set with the <code className="font-mono">GITHUB_USERNAME</code> environment variable on the server. Only public
          repositories are ever requested, so private ones cannot appear here. An optional <code className="font-mono">GITHUB_TOKEN</code>{' '}
          raises the rate limit and never reaches the browser.
        </p>
      </Panel>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative w-full max-w-sm">
          <span className="sr-only">Search repositories</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search repositories" className="field h-9 pl-9" />
        </label>
        <label className="flex items-center gap-2 text-sm text-mute">
          <input type="checkbox" checked={hideForks} onChange={(e) => setHideForks(e.target.checked)} className="accent-[var(--color-accent)]" /> Hide forks
        </label>
        <span className="font-mono text-xs text-dim">{shown.length} shown · {selected.size} selected</span>
      </div>

      {!data ? (
        busy === 'fetch' ? (
          <div className="flex justify-center py-20"><Spinner className="text-hi" /></div>
        ) : (
          <EmptyState title="GitHub could not be reached." hint={error}>
            <Button onClick={() => void fetchRepos(true)}>Try again</Button>
          </EmptyState>
        )
      ) : shown.length === 0 ? (
        <EmptyState title="No repositories match." />
      ) : (
        <ul className="card divide-y divide-line">
          {shown.map((r) => {
            const project = linked.get(r.id)
            return (
              <li key={r.id}>
                <label className={`flex items-center gap-4 px-4 py-3 ${project ? '' : 'cursor-pointer hover:bg-bg2'}`}>
                  <input
                    type="checkbox"
                    disabled={!!project}
                    checked={selected.has(r.id) && !project}
                    onChange={() => toggle(r.id)}
                    aria-label={`Select ${r.name}`}
                    className="size-4 accent-[var(--color-accent)] disabled:opacity-30"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium">{r.name}</span>
                      {r.fork && <Pill>Fork</Pill>}
                      {r.archived && <Pill>Archived</Pill>}
                      {project && (
                        <Link to={`/admin/projects/${project.id}`} onClick={(e) => e.stopPropagation()}>
                          <Pill tone={project.visibility === 'published' ? 'hi' : 'warn'}>
                            In portfolio · {project.visibility}
                          </Pill>
                        </Link>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-mute">{r.description || 'No description'}</span>
                  </span>
                  <span className="hidden shrink-0 items-center gap-4 font-mono text-[11px] text-dim sm:flex">
                    {r.language && <span className="text-mute">{r.language}</span>}
                    <span className="inline-flex items-center gap-1"><Star className="size-3" />{r.stars}</span>
                    <span className="inline-flex items-center gap-1"><GitFork className="size-3" />{r.forks}</span>
                    <span className="w-24 text-right">{timeAgo(r.pushed_at)}</span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      )}

      <Panel title="Sync history" className="mt-8">
        {logs.length ? (
          <ul className="divide-y divide-line text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center gap-4 py-2">
                <Pill tone={l.status === 'success' ? 'hi' : l.status === 'error' ? 'danger' : 'warn'}>{l.status}</Pill>
                <span className="capitalize">{l.action}</span>
                <span className="text-mute">{l.repo_count} repositor{l.repo_count === 1 ? 'y' : 'ies'}</span>
                <span className="ml-auto font-mono text-xs text-dim">{timeAgo(l.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-mute">No imports or syncs yet.</p>
        )}
      </Panel>
    </AdminPage>
  )
}
