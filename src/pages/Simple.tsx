/** The smaller public pages: Experience, Labs, Achievements, GitHub, Contact. */
import { useMemo, useState } from 'react'
import { Briefcase, Code2, FlaskConical, Handshake, Mail, MessagesSquare, Search } from 'lucide-react'
import { usePortfolio } from '@/app/ContentProvider'
import { ContactForm } from '@/components/contact/ContactForm'
import { AchievementList, GithubUnavailable, LanguageBar, RepoCard, Timeline, useGithub } from '@/components/sections'
import { EmptyState, GithubIcon, LinkedinIcon, PageHeader, Reveal, SectionHeading } from '@/components/ui'
import { useSeo } from '@/hooks/useSeo'
import { ACHIEVEMENT_KINDS } from '@/types'
import { cn, isHttpUrl, timeAgo } from '@/utils'
import { ProjectBrowser } from './Projects'

/* -------------------------------------------------------------- Experience */

export function Experience() {
  const { experiences } = usePortfolio()
  useSeo({ title: 'Experience', description: 'Professional experience of Jeet Patel — e-commerce operations, product development and internships.' })
  return (
    <>
      <PageHeader
        eyebrow="Experience"
        title="Operations, products and the code in between."
        lead="Roles where I've built software, run the business side of it, or both."
      />
      <section className="wrap py-16 md:py-24">
        {experiences.length ? <Timeline items={experiences} detailed /> : <EmptyState title="No experience entries yet." />}
      </section>
    </>
  )
}

/* -------------------------------------------------------------------- Labs */

export function Labs() {
  const { labs } = usePortfolio()
  useSeo({ title: 'Labs & Experiments', description: 'Prototypes, academic projects, research and small tools from the RAGBOOMS lab.' })
  return (
    <>
      <PageHeader
        eyebrow="Labs & Experiments"
        title="The workbench."
        lead="Prototypes, academic projects, research and half-finished ideas. Not everything here is a product — each entry says exactly what stage it reached."
      />
      <section className="wrap py-14 md:py-20">
        <div className="mb-10 flex items-center gap-3 rounded-lg border border-line bg-bg2 px-4 py-3 font-mono text-xs text-mute">
          <FlaskConical className="size-4 shrink-0 text-hi" />
          <span>
            {labs.length} entries · {new Set(labs.map((l) => l.status)).size} stages ·{' '}
            {labs.filter((l) => isHttpUrl(l.github_url)).length} with public source
          </span>
        </div>
        {labs.length ? <ProjectBrowser projects={labs} defaultView="list" /> : <EmptyState title="No experiments published yet." />}
      </section>
    </>
  )
}

/* ------------------------------------------------------------ Achievements */

export function Achievements() {
  const { achievements } = usePortfolio()
  const [kind, setKind] = useState('')
  useSeo({ title: 'Achievements', description: 'Hackathons, competitions and leadership roles.' })
  const kinds = ACHIEVEMENT_KINDS.filter((k) => achievements.some((a) => a.kind === k))
  const shown = kind ? achievements.filter((a) => a.kind === kind) : achievements
  return (
    <>
      <PageHeader
        eyebrow="Achievements"
        title="Hackathons, competitions and leadership."
        lead="Building under a deadline, and helping other people do the same."
      />
      <section className="wrap py-14 md:py-20">
        {kinds.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Type">
            {['', ...kinds].map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                className={cn(
                  'rounded-full border px-3.5 py-1 text-sm transition-colors',
                  kind === k ? 'border-accent bg-brand/20 text-ink' : 'border-line text-mute hover:text-ink',
                )}
              >
                {k || 'All'}
              </button>
            ))}
          </div>
        )}
        {shown.length ? <AchievementList items={shown} /> : <EmptyState title="No achievements published yet." />}
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ GitHub */

export function Github() {
  const { data, error, loading } = useGithub()
  const [q, setQ] = useState('')
  const [lang, setLang] = useState('')
  const [forks, setForks] = useState(false)
  useSeo({ title: 'GitHub', description: 'Public repositories, languages and recent activity from GitHub.' })

  const langs = useMemo(() => [...new Set((data?.repos ?? []).map((r) => r.language).filter(Boolean))] as string[], [data])
  const repos = useMemo(
    () =>
      (data?.repos ?? []).filter(
        (r) =>
          (forks || !r.fork) &&
          (!lang || r.language === lang) &&
          (!q || `${r.name} ${r.description ?? ''}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [data, q, lang, forks],
  )

  return (
    <>
      <PageHeader eyebrow="GitHub" title="Public code." lead="Pulled live from the GitHub API — repositories, languages and recent public activity." />
      <section className="wrap py-14 md:py-20">
        {!data ? (
          <GithubUnavailable error={error} loading={loading} />
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
              <Reveal className="card p-6">
                <div className="flex items-center gap-4">
                  <img src={data.profile.avatar_url} alt="" className="size-16 rounded-full border border-line" />
                  <div>
                    <p className="font-display text-xl font-medium">{data.profile.name ?? data.profile.login}</p>
                    <a href={data.profile.html_url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5 font-mono text-xs">
                      <GithubIcon className="size-3.5" />@{data.profile.login}
                    </a>
                  </div>
                </div>
                {data.profile.bio && <p className="mt-4 text-sm text-mute">{data.profile.bio}</p>}
                <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5">
                  {[
                    ['Public repos', data.profile.public_repos],
                    ['Followers', data.profile.followers],
                    ['Following', data.profile.following],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dd className="font-display text-2xl font-semibold">{value}</dd>
                      <dt className="font-mono text-[10px] uppercase tracking-widest text-dim">{label}</dt>
                    </div>
                  ))}
                </dl>
              </Reveal>
              <Reveal delay={0.05} className="card p-6">
                <p className="eyebrow mb-5 !text-dim">Languages</p>
                <LanguageBar data={data} />
              </Reveal>
            </div>

            {data.events.length > 0 && (
              <div className="mt-14">
                <SectionHeading eyebrow="Activity" title="Recent public activity." />
                <ul className="card divide-y divide-line">
                  {data.events.slice(0, 8).map((e) => (
                    <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-3 text-sm">
                      <span>
                        {e.summary} <span className="text-dim">·</span>{' '}
                        <a href={`https://github.com/${e.repo}`} target="_blank" rel="noopener noreferrer" className="link font-mono text-xs">
                          {e.repo}
                        </a>
                      </span>
                      <span className="font-mono text-xs text-dim">{timeAgo(e.created_at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-14">
              <SectionHeading eyebrow="Repositories" title="Everything public." />
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <label className="relative min-w-56 flex-1">
                  <span className="sr-only">Search repositories</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search repositories" className="field h-10 pl-9" />
                </label>
                <select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value)} className="field h-10 w-auto">
                  <option value="">All languages</option>
                  {langs.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-mute">
                  <input type="checkbox" checked={forks} onChange={(e) => setForks(e.target.checked)} className="accent-[var(--color-accent)]" />
                  Include forks
                </label>
                <span className="font-mono text-xs text-dim">{repos.length} shown</span>
              </div>
              {repos.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {repos.map((r) => (
                    <RepoCard key={r.id} repo={r} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No repositories match." />
              )}
            </div>
          </>
        )}
      </section>
    </>
  )
}

/* ----------------------------------------------------------------- Contact */

const WAYS = [
  { icon: Briefcase, type: 'Freelance work', text: 'A defined piece of work — a site, an app, an internal tool — with a scope and a deadline.' },
  { icon: Code2, type: 'Software development', text: 'Custom software for your business: web, mobile, automation or AI integration.' },
  { icon: Handshake, type: 'Product collaboration', text: 'You have a product idea or an early product and want a technical partner to build it with.' },
  { icon: MessagesSquare, type: 'Technical discussion', text: 'Questions about something I built, an approach, or a technology we both care about.' },
]

export function Contact() {
  const { email, social } = usePortfolio()
  const [type, setType] = useState(WAYS[0].type)
  const github = social('github')
  const linkedin = social('linkedin')
  useSeo({ title: 'Contact', description: 'Get in touch about freelance work, software development, product collaborations or technical discussions.' })
  return (
    <>
      <PageHeader eyebrow="Contact" title="Let's work together." lead="Pick what fits best and tell me a little about it. I read everything that comes through here." />
      <section className="wrap grid gap-12 py-14 md:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <ul className="space-y-3">
            {WAYS.map((w) => (
              <li key={w.type}>
                <button
                  onClick={() => setType(w.type)}
                  aria-pressed={type === w.type}
                  className={cn(
                    'flex w-full gap-4 rounded-xl border p-5 text-left transition-colors',
                    type === w.type ? 'border-accent bg-brand/10' : 'border-line hover:border-mute',
                  )}
                >
                  <w.icon className={cn('mt-0.5 size-5 shrink-0', type === w.type ? 'text-hi' : 'text-mute')} />
                  <span>
                    <span className="block font-display font-medium">{w.type}</span>
                    <span className="mt-1 block text-sm text-mute">{w.text}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {email && (
              <a href={`mailto:${email}`} className="inline-flex items-center gap-2 text-mute hover:text-hi">
                <Mail className="size-4" /> {email}
              </a>
            )}
            {isHttpUrl(linkedin) && (
              <a href={linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-mute hover:text-hi">
                <LinkedinIcon className="size-4" /> LinkedIn
              </a>
            )}
            {isHttpUrl(github) && (
              <a href={github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-mute hover:text-hi">
                <GithubIcon className="size-4" /> GitHub
              </a>
            )}
          </div>
        </div>
        <ContactForm key={type} defaultType={type} />
      </section>
    </>
  )
}
