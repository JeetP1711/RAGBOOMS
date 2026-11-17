import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutGrid, List, Search, X } from 'lucide-react'
import { usePortfolio } from '@/app/ContentProvider'
import { ProjectCard, ProjectRow } from '@/components/projects/ProjectCard'
import { EmptyState, PageHeader } from '@/components/ui'
import { useSeo } from '@/hooks/useSeo'
import type { Project } from '@/types'
import { cn } from '@/utils'

type Sort = 'featured' | 'newest' | 'az'

/** Search + category / technology / status filters, shared by Projects and Labs. */
export function ProjectBrowser({ projects, defaultView = 'grid' }: { projects: Project[]; defaultView?: 'grid' | 'list' }) {
  const { categories } = usePortfolio()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState(defaultView)
  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const tech = params.get('tech') ?? ''
  const status = params.get('status') ?? ''
  const sort = (params.get('sort') as Sort) || 'featured'

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  // Only offer filter values that actually occur in this list.
  const options = useMemo(() => {
    const cats = new Set(projects.flatMap((p) => p.categories))
    return {
      categories: categories.filter((c) => cats.has(c.slug)),
      techs: [...new Set(projects.flatMap((p) => p.technologies))].sort((a, b) => a.localeCompare(b)),
      statuses: [...new Set(projects.map((p) => p.status))],
    }
  }, [projects, categories])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = projects.filter(
      (p) =>
        (!category || p.categories.includes(category)) &&
        (!tech || p.technologies.includes(tech)) &&
        (!status || p.status === status) &&
        (!term ||
          [p.title, p.short_description, p.description, ...p.technologies].join(' ').toLowerCase().includes(term)),
    )
    if (sort === 'az') return [...list].sort((a, b) => a.title.localeCompare(b.title))
    if (sort === 'newest')
      return [...list].sort((a, b) => (b.start_date ?? b.created_at).localeCompare(a.start_date ?? a.created_at))
    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort_order - b.sort_order)
  }, [projects, q, category, tech, status, sort])

  const active = Boolean(q || category || tech || status)

  return (
    <div>
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-56 flex-1">
            <span className="sr-only">Search projects</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" />
            <input
              value={q}
              onChange={(e) => set('q', e.target.value)}
              placeholder="Search by name, description or technology"
              className="field h-10 pl-9"
            />
          </label>
          <select aria-label="Technology" value={tech} onChange={(e) => set('tech', e.target.value)} className="field h-10 w-auto">
            <option value="">All technologies</option>
            {options.techs.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select aria-label="Status" value={status} onChange={(e) => set('status', e.target.value)} className="field h-10 w-auto">
            <option value="">Any status</option>
            {options.statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select aria-label="Sort" value={sort} onChange={(e) => set('sort', e.target.value === 'featured' ? '' : e.target.value)} className="field h-10 w-auto">
            <option value="featured">Featured first</option>
            <option value="newest">Newest</option>
            <option value="az">A – Z</option>
          </select>
          <div className="flex rounded-md border border-line p-0.5" role="group" aria-label="Layout">
            {(['grid', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-label={`${v} view`}
                aria-pressed={view === v}
                className={cn('grid size-8 place-items-center rounded', view === v ? 'bg-card text-hi' : 'text-dim hover:text-ink')}
              >
                {v === 'grid' ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
          {[{ slug: '', name: 'All' }, ...options.categories].map((c) => (
            <button
              key={c.slug}
              onClick={() => set('category', c.slug)}
              aria-pressed={category === c.slug}
              className={cn(
                'rounded-full border px-3.5 py-1 text-sm transition-colors',
                category === c.slug ? 'border-accent bg-brand/20 text-ink' : 'border-line text-mute hover:border-mute hover:text-ink',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between font-mono text-xs text-dim">
          <span aria-live="polite">
            {filtered.length} of {projects.length}
          </span>
          {active && (
            <button onClick={() => setParams({}, { replace: true })} className="inline-flex items-center gap-1 hover:text-hi">
              <X className="size-3" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nothing matches those filters." hint="Try a different search term or clear the filters." />
      ) : view === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
              >
                <ProjectCard project={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="border-t border-line">
          {filtered.map((p, i) => (
            <ProjectRow key={p.id} project={p} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Projects() {
  const { main } = usePortfolio()
  useSeo({ title: 'Projects', description: 'Products, platforms and client-oriented software built by Jeet Patel under RAGBOOMS.' })
  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Things I've built and am building."
        lead="Every project carries an honest status — live, in development, prototype or concept."
      />
      <section className="wrap py-14 md:py-20">
        <ProjectBrowser projects={main} />
      </section>
    </>
  )
}
