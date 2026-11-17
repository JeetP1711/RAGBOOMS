/** Content blocks shared between the homepage and the dedicated pages. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Award, ExternalLink, GitFork, Star } from 'lucide-react'
import { usePortfolio } from '@/app/ContentProvider'
import { Chip, GithubIcon, Reveal, Spinner } from '@/components/ui'
import { fetchGithub, languageShare } from '@/services/github'
import type { Achievement, Experience, GithubData, Technology } from '@/types'
import { cn, isHttpUrl, timeAgo } from '@/utils'

/* ------------------------------------------------------------------ Skills */

export function SkillGroups({ technologies, showLevel = false }: { technologies: Technology[]; showLevel?: boolean }) {
  const groups = new Map<string, Technology[]>()
  for (const t of technologies) {
    if (!t.visible) continue
    const g = t.group_name || 'Other'
    groups.set(g, [...(groups.get(g) ?? []), t])
  }
  return (
    <dl className="border-t border-line">
      {[...groups.entries()].map(([group, items], i) => (
        <Reveal key={group} delay={i * 0.04}>
          <div className="grid gap-3 border-b border-line py-6 md:grid-cols-[15rem_1fr] md:gap-8">
            <dt className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-dim">{String(i + 1).padStart(2, '0')}</span>
              <span className="font-display text-lg font-medium">{group}</span>
            </dt>
            <dd className="flex flex-wrap gap-2">
              {items.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-card px-3 py-1.5 text-sm transition-colors hover:border-accent/50"
                >
                  {t.name}
                  {showLevel && t.proficiency && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-dim">{t.proficiency}</span>
                  )}
                </span>
              ))}
            </dd>
          </div>
        </Reveal>
      ))}
    </dl>
  )
}

/* ---------------------------------------------------------------- Timeline */

export function Timeline({ items, detailed = false }: { items: Experience[]; detailed?: boolean }) {
  return (
    <ol className="relative ml-2 border-l border-line">
      {items.map((e, i) => (
        <li key={e.id} className="relative pb-12 pl-8 last:pb-0 md:pl-12">
          <span
            className={cn(
              'absolute -left-[5px] top-2 size-[9px] rounded-full border',
              e.is_current ? 'border-hi bg-hi shadow-[0_0_12px_var(--color-hi)]' : 'border-mute bg-bg',
            )}
            aria-hidden
          />
          <Reveal delay={i * 0.05}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-wider text-dim">
              {e.date_label && <span className={e.is_current ? 'text-hi' : ''}>{e.date_label}</span>}
              {e.employment_type && <span>· {e.employment_type}</span>}
              {e.location && <span>· {e.location}</span>}
            </div>
            <div className="mt-2 flex items-center gap-4">
              {e.logo_url && (
                <img src={e.logo_url} alt="" className="size-10 rounded-md border border-line bg-white object-contain p-1" />
              )}
              <div>
                <h3 className="text-xl font-semibold md:text-2xl">{e.role || e.company}</h3>
                {e.role &&
                  (isHttpUrl(e.website_url) ? (
                    <a href={e.website_url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1 text-sm">
                      {e.company} <ArrowUpRight className="size-3.5" />
                    </a>
                  ) : (
                    <p className="text-sm text-mute">{e.company}</p>
                  ))}
              </div>
            </div>
            {e.description && <p className="mt-4 max-w-3xl text-mute">{e.description}</p>}
            {detailed && e.responsibilities.length > 0 && (
              <ul className="mt-5 grid max-w-3xl gap-x-8 gap-y-2 text-sm text-ink/90 sm:grid-cols-2">
                {e.responsibilities.map((r) => (
                  <li key={r} className="flex gap-2.5">
                    <span className="mt-[0.6em] size-1 shrink-0 rounded-full bg-accent" />
                    {r}
                  </li>
                ))}
              </ul>
            )}
            {detailed && e.achievements.length > 0 && (
              <div className="mt-5 max-w-3xl">
                <p className="eyebrow mb-2 !text-dim">Highlights</p>
                <ul className="space-y-1.5 text-sm">
                  {e.achievements.map((a) => (
                    <li key={a} className="flex gap-2.5">
                      <Award className="mt-0.5 size-4 shrink-0 text-hi" /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detailed && e.technologies.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {e.technologies.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>
            )}
          </Reveal>
        </li>
      ))}
    </ol>
  )
}

/* ------------------------------------------------------------ Achievements */

export function AchievementList({ items }: { items: Achievement[] }) {
  const { projects } = usePortfolio()
  return (
    <ul className="border-t border-line">
      {items.map((a, i) => {
        const related = projects.find((p) => p.id === a.project_id)
        return (
          <Reveal key={a.id} delay={i * 0.04}>
            <li className="grid gap-x-8 gap-y-3 border-b border-line py-7 md:grid-cols-[4rem_1fr_auto]">
              <span className="font-display text-3xl font-semibold text-line md:text-4xl" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wider">
                  <span className="text-hi">{a.kind}</span>
                  {a.organization && <span className="text-dim">{a.organization}</span>}
                  {a.date_label && <span className="text-dim">· {a.date_label}</span>}
                </div>
                <h3 className="text-xl font-semibold md:text-2xl">{a.title}</h3>
                {a.description && <p className="mt-2 max-w-2xl text-mute">{a.description}</p>}
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {isHttpUrl(a.verification_url) && (
                    <a href={a.verification_url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
                      Verify <ExternalLink className="size-3.5" />
                    </a>
                  )}
                  {related && (
                    <Link to={`/projects/${related.slug}`} className="link">
                      Related project: {related.title}
                    </Link>
                  )}
                </div>
              </div>
              {a.certificate_url && (
                <a href={a.certificate_url} target="_blank" rel="noopener noreferrer" className="block w-40 shrink-0 self-start">
                  <img
                    src={a.certificate_url}
                    alt={`Certificate: ${a.title}`}
                    loading="lazy"
                    className="rounded-md border border-line transition-colors hover:border-accent"
                  />
                </a>
              )}
            </li>
          </Reveal>
        )
      })}
    </ul>
  )
}

/* ------------------------------------------------------------------ GitHub */

export function useGithub() {
  const [data, setData] = useState<GithubData | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    fetchGithub()
      .then((d) => alive && setData(d))
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [])
  return { data, error, loading: !data && !error }
}

const LANG_COLORS = ['#18c995', '#0ead78', '#4fb3d9', '#e0b354', '#a78bfa', '#f0735f', '#9aafa3']

export function LanguageBar({ data }: { data: GithubData }) {
  const all = languageShare(data)
  const top = all.slice(0, 6)
  const rest = all.slice(6).reduce((a, b) => a + b.pct, 0)
  const rows = rest > 0 ? [...top, { language: 'Other', pct: rest, count: 0 }] : top
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-bg2" role="img" aria-label="Languages across public repositories">
        {rows.map((l, i) => (
          <span key={l.language} style={{ width: `${l.pct}%`, background: LANG_COLORS[i] }} />
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
        {rows.map((l, i) => (
          <li key={l.language} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: LANG_COLORS[i] }} />
            {l.language} <span className="font-mono text-xs text-dim">{l.pct.toFixed(0)}%</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-dim">By primary language of public, non-fork repositories.</p>
    </div>
  )
}

export function RepoCard({ repo }: { repo: GithubData['repos'][number] }) {
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="card group flex h-full flex-col p-5 transition-colors hover:border-accent/50"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="break-all font-mono text-sm font-medium text-ink group-hover:text-hi">{repo.name}</h3>
        <ArrowUpRight className="size-4 shrink-0 text-dim group-hover:text-hi" />
      </div>
      <p className="mt-2 line-clamp-2 flex-1 text-sm text-mute">{repo.description || 'No description on GitHub.'}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-dim">
        {repo.language && <span className="text-mute">{repo.language}</span>}
        <span className="inline-flex items-center gap-1">
          <Star className="size-3" /> {repo.stars}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork className="size-3" /> {repo.forks}
        </span>
        <span className="ml-auto">{timeAgo(repo.pushed_at)}</span>
      </div>
    </a>
  )
}

export function GithubUnavailable({ error, loading }: { error: string | null; loading: boolean }) {
  const { social } = usePortfolio()
  const url = social('github')
  if (loading)
    return (
      <div className="card flex items-center justify-center gap-3 p-10 text-mute">
        <Spinner /> Loading GitHub data…
      </div>
    )
  return (
    <div className="card p-8 text-center">
      <GithubIcon className="mx-auto size-8 text-mute" />
      <p className="mt-4 text-mute">{error ?? 'GitHub data is unavailable right now.'}</p>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="link mt-3 inline-block text-sm">
          View the profile on GitHub
        </a>
      )}
    </div>
  )
}
