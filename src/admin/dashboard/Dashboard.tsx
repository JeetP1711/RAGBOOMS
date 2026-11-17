import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { listProjects, listRows } from '@/services/admin'
import { fetchGithub } from '@/services/github'
import type { Achievement, ContactSubmission, Experience, MediaAsset, Profile, Project, SocialLink } from '@/types'
import { timeAgo } from '@/utils'
import { AdminPage, Panel, Pill, useFeedback } from '../ui'

interface Data {
  projects: Project[]
  experiences: (Experience & { updated_at: string })[]
  achievements: (Achievement & { updated_at: string })[]
  messages: ContactSubmission[]
  media: MediaAsset[]
  profile: Profile | null
  socials: SocialLink[]
}

/** Every figure on this page is read from the database or the GitHub API. */
export default function Dashboard() {
  const fb = useFeedback()
  const [d, setD] = useState<Data | null>(null)
  const [repos, setRepos] = useState<number | null | 'error'>(null)

  useEffect(() => {
    Promise.all([
      listProjects(),
      listRows<Data['experiences'][number]>('experiences'),
      listRows<Data['achievements'][number]>('achievements'),
      listRows<ContactSubmission>('contact_submissions', 'created_at', false),
      listRows<MediaAsset>('media_assets', 'created_at', false),
      listRows<Profile>('profiles', 'created_at'),
      listRows<SocialLink>('social_links'),
    ])
      .then(([projects, experiences, achievements, messages, media, profiles, socials]) =>
        setD({ projects, experiences, achievements, messages, media, profile: profiles[0] ?? null, socials }),
      )
      .catch(fb.error)
    fetchGithub()
      .then((g) => setRepos(g.profile.public_repos))
      .catch(() => setRepos('error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!d) return <div className="flex justify-center py-32"><Spinner className="text-hi" /></div>

  const published = d.projects.filter((p) => p.visibility === 'published')
  const unread = d.messages.filter((m) => m.status === 'new')
  const stats: [string, number | string, string][] = [
    ['Total projects', d.projects.length, '/admin/projects'],
    ['Published', published.length, '/admin/projects'],
    ['Drafts', d.projects.length - published.length, '/admin/projects'],
    ['Experience entries', d.experiences.length, '/admin/experience'],
    ['Achievements', d.achievements.length, '/admin/achievements'],
    ['GitHub repositories', repos === null ? '…' : repos === 'error' ? 'n/a' : repos, '/admin/github'],
    ['Media files', d.media.length, '/admin/media'],
    ['Unread messages', unread.length, '/admin/messages'],
  ]

  const recent = [
    ...d.projects.map((p) => ({ at: p.updated_at, label: p.title, kind: 'Project', to: `/admin/projects/${p.id}` })),
    ...d.experiences.map((e) => ({ at: e.updated_at, label: `${e.role} · ${e.company}`, kind: 'Experience', to: '/admin/experience' })),
    ...d.achievements.map((a) => ({ at: a.updated_at, label: a.title, kind: 'Achievement', to: '/admin/achievements' })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 7)

  const noCover = published.filter((p) => !p.cover_url).length
  const noStory = published.filter((p) => !p.description).length
  const checks: [boolean, string, string][] = [
    [!!d.profile?.email, 'Contact email is set', '/admin/profile'],
    [d.socials.some((s) => s.platform === 'linkedin' && s.url), 'LinkedIn link is set', '/admin/profile'],
    [!!d.profile?.resume_url, 'Résumé is uploaded', '/admin/profile'],
    [!!d.profile?.avatar_url, 'Profile photograph is set', '/admin/profile'],
    [noCover === 0, noCover ? `${noCover} published project${noCover > 1 ? 's have' : ' has'} no cover image` : 'All published projects have a cover', '/admin/projects'],
    [noStory === 0, noStory ? `${noStory} published project${noStory > 1 ? 's have' : ' has'} no overview text` : 'All published projects have an overview', '/admin/projects'],
    [d.experiences.every((e) => e.date_label), 'Every experience entry has dates', '/admin/experience'],
    [d.achievements.every((a) => a.date_label), 'Every achievement has a date', '/admin/achievements'],
  ]

  return (
    <AdminPage title="Dashboard" description="A live summary of what's in the portfolio.">
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([label, value, to]) => (
          <Link key={label} to={to} className="card p-4 transition-colors hover:border-accent/50">
            <dd className="font-display text-3xl font-semibold tabular-nums">{value}</dd>
            <dt className="mt-1 text-xs text-mute">{label}</dt>
          </Link>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Content status" hint="Things a visitor would notice are missing.">
          <ul className="space-y-2 text-sm">
            {checks.map(([ok, text, to]) => (
              <li key={text} className="flex items-start gap-2.5">
                {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-hi" /> : <AlertCircle className="mt-0.5 size-4 shrink-0 text-warn" />}
                {ok ? <span className="text-mute">{text}</span> : <Link to={to} className="hover:text-hi">{text}</Link>}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent updates">
          {recent.length ? (
            <ul className="divide-y divide-line text-sm">
              {recent.map((r) => (
                <li key={r.kind + r.label + r.at}>
                  <Link to={r.to} className="flex items-center justify-between gap-4 py-2 hover:text-hi">
                    <span className="min-w-0 truncate">
                      <span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-dim">{r.kind}</span>
                      {r.label}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-dim">{timeAgo(r.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mute">Nothing yet.</p>
          )}
        </Panel>

        <Panel title="Recent messages" className="lg:col-span-2">
          {d.messages.length ? (
            <ul className="divide-y divide-line text-sm">
              {d.messages.slice(0, 5).map((m) => (
                <li key={m.id}>
                  <Link to="/admin/messages" className="flex items-center gap-4 py-2.5 hover:text-hi">
                    <span className="w-40 shrink-0 truncate font-medium">{m.name}</span>
                    <span className="min-w-0 flex-1 truncate text-mute">{m.message}</span>
                    {m.status === 'new' && <Pill tone="hi">New</Pill>}
                    <span className="shrink-0 font-mono text-xs text-dim">{timeAgo(m.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mute">No contact form submissions yet.</p>
          )}
        </Panel>

        <Panel title="Visitor analytics" className="lg:col-span-2">
          <p className="text-sm text-mute">
            No analytics provider is configured, so no visitor numbers are shown. To add them, enable Web Analytics for
            the project in the Vercel dashboard — see the README.
          </p>
        </Panel>
      </div>
    </AdminPage>
  )
}
