import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock, Download, ExternalLink, PlayCircle, X } from 'lucide-react'
import { useContent, usePortfolio } from '@/app/ContentProvider'
import { ProjectCard, ProjectCover } from '@/components/projects/ProjectCard'
import { Button, Chip, GithubIcon, Reveal, StatusBadge } from '@/components/ui'
import { useSeo } from '@/hooks/useSeo'
import { SITE_URL } from '@/services/supabase'
import { formatDate, isHttpUrl, paragraphs } from '@/utils'
import NotFound from './NotFound'

export default function ProjectDetail() {
  const { slug } = useParams()
  const { loading } = useContent()
  const { projects, categoryName } = usePortfolio()
  const project = projects.find((p) => p.slug === slug)
  const [zoom, setZoom] = useState<string | null>(null)

  useSeo({
    title: project?.seo_title || project?.title,
    description: project?.seo_description || project?.short_description,
    image: project?.cover_url,
    jsonLd: project && {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: project.title,
      description: project.short_description,
      url: `${SITE_URL}/projects/${project.slug}`,
      ...(project.cover_url ? { image: project.cover_url } : {}),
      ...(isHttpUrl(project.github_url) ? { codeRepository: project.github_url } : {}),
    },
  })

  if (!project) return loading ? null : <NotFound />

  // Siblings: stay within the same shelf (projects vs labs).
  const shelf = projects.filter((p) => p.is_lab === project.is_lab)
  const idx = shelf.findIndex((p) => p.id === project.id)
  const prev = shelf[(idx - 1 + shelf.length) % shelf.length]
  const next = shelf[(idx + 1) % shelf.length]
  const related = projects
    .filter((p) => p.id !== project.id)
    .map((p) => ({
      p,
      score:
        p.categories.filter((c) => project.categories.includes(c)).length * 2 +
        p.technologies.filter((t) => project.technologies.includes(t)).length,
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.p)

  const dates = [formatDate(project.start_date), formatDate(project.end_date)].filter(Boolean).join(' – ')
  const back = project.is_lab ? { to: '/labs', label: 'Labs' } : { to: '/projects', label: 'Projects' }
  const hasLinks = [project.live_url, project.github_url, project.docs_url, project.download_url, project.video_url].some(isHttpUrl)

  const Prose = ({ title, text }: { title: string; text: string }) =>
    text ? (
      <Reveal>
        <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
        <div className="space-y-4 text-mute md:text-lg">
          {paragraphs(text).map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
      </Reveal>
    ) : null

  return (
    <article>
      <header className="relative overflow-hidden border-b border-line">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="glow pointer-events-none absolute -top-40 right-0 size-[520px] opacity-50" aria-hidden />
        <div className="wrap relative pb-12 pt-32 md:pt-40">
          <Link to={back.to} className="mb-8 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-mute hover:text-hi">
            <ArrowLeft className="size-3.5" /> {back.label}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={project.status} />
            {project.categories.map((c) => (
              <span key={c} className="font-mono text-[11px] uppercase tracking-wider text-dim">
                {categoryName(c)}
              </span>
            ))}
          </div>
          <h1 className="mt-5 text-5xl font-semibold md:text-7xl">{project.title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-mute md:text-xl">{project.short_description}</p>
          {hasLinks && (
            <div className="mt-8 flex flex-wrap gap-3">
              {isHttpUrl(project.live_url) && (
                <Button href={project.live_url} size="lg">
                  <ExternalLink className="size-4" /> Visit live
                </Button>
              )}
              {isHttpUrl(project.github_url) && (
                <Button href={project.github_url} size="lg" variant="secondary">
                  <GithubIcon className="size-4" /> Source code
                </Button>
              )}
              {isHttpUrl(project.download_url) && (
                <Button href={project.download_url} size="lg" variant="secondary">
                  <Download className="size-4" /> Download
                </Button>
              )}
              {isHttpUrl(project.docs_url) && (
                <Button href={project.docs_url} size="lg" variant="ghost">
                  <BookOpen className="size-4" /> Docs
                </Button>
              )}
              {isHttpUrl(project.video_url) && (
                <Button href={project.video_url} size="lg" variant="ghost">
                  <PlayCircle className="size-4" /> Demo video
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="wrap -mb-px pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="card aspect-[16/8] overflow-hidden"
        >
          <ProjectCover project={project} />
        </motion.div>
      </div>

      <div className="wrap grid gap-14 py-16 md:py-24 lg:grid-cols-[1fr_19rem]">
        <div className="space-y-14">
          <Prose title="Overview" text={project.description} />
          <Prose title="The problem" text={project.problem} />
          <Prose title="The solution" text={project.solution} />

          {project.features.length > 0 && (
            <Reveal>
              <h2 className="mb-5 text-2xl font-semibold">Features</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {project.features.map((f) => (
                  <li key={f} className="card flex gap-3 p-4 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-hi" /> {f}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
          {project.planned_features.length > 0 && (
            <Reveal>
              <h2 className="mb-2 text-2xl font-semibold">Planned</h2>
              <p className="mb-5 text-sm text-mute">On the roadmap — not built yet.</p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {project.planned_features.map((f) => (
                  <li key={f} className="flex gap-3 rounded-xl border border-dashed border-line p-4 text-sm text-mute">
                    <Clock className="mt-0.5 size-4 shrink-0 text-dim" /> {f}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          <Prose title="Architecture" text={project.architecture} />
          <Prose title="Challenges" text={project.challenges} />

          {project.gallery.length > 0 && (
            <Reveal>
              <h2 className="mb-5 text-2xl font-semibold">Gallery</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {project.gallery.map((g) => (
                  <figure key={g.url}>
                    <button onClick={() => setZoom(g.url)} className="card block w-full overflow-hidden hover:border-accent/60" aria-label="Enlarge image">
                      <img src={g.url} alt={g.caption || `${project.title} screenshot`} loading="lazy" className="w-full" />
                    </button>
                    {g.caption && <figcaption className="mt-2 text-sm text-mute">{g.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </Reveal>
          )}

          {project.changelog.length > 0 && (
            <Reveal>
              <h2 className="mb-5 text-2xl font-semibold">Changelog</h2>
              <ol className="ml-1 border-l border-line">
                {project.changelog.map((c, i) => (
                  <li key={i} className="relative pb-6 pl-6 last:pb-0">
                    <span className="absolute -left-[4px] top-2 size-[7px] rounded-full bg-accent" />
                    <p className="font-mono text-xs text-dim">
                      {c.date}
                      {c.version && ` · ${c.version}`}
                    </p>
                    <p className="mt-1 font-medium">{c.title}</p>
                    {c.notes && <p className="mt-1 text-sm text-mute">{c.notes}</p>}
                  </li>
                ))}
              </ol>
            </Reveal>
          )}

          {!project.description && !project.problem && project.features.length === 0 && (
            <p className="rounded-xl border border-dashed border-line p-6 text-mute">
              A full write-up for this {project.is_lab ? 'experiment' : 'project'} hasn't been added yet.
            </p>
          )}
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <dl className="card divide-y divide-line text-sm">
            <div className="flex items-center justify-between gap-4 p-4">
              <dt className="text-mute">Status</dt>
              <dd><StatusBadge status={project.status} /></dd>
            </div>
            {dates && (
              <div className="flex items-center justify-between gap-4 p-4">
                <dt className="text-mute">Timeline</dt>
                <dd>{dates}</dd>
              </div>
            )}
            {project.github_meta?.language && (
              <div className="flex items-center justify-between gap-4 p-4">
                <dt className="text-mute">Main language</dt>
                <dd>{project.github_meta.language}</dd>
              </div>
            )}
            {project.github_meta?.pushed_at && (
              <div className="flex items-center justify-between gap-4 p-4">
                <dt className="text-mute">Last commit</dt>
                <dd>{formatDate(project.github_meta.pushed_at, { day: 'numeric', month: 'short', year: 'numeric' })}</dd>
              </div>
            )}
          </dl>
          {project.technologies.length > 0 && (
            <div>
              <p className="eyebrow mb-3 !text-dim">Built with</p>
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.map((t) => (
                  <Link key={t} to={`/${project.is_lab ? 'labs' : 'projects'}?tech=${encodeURIComponent(t)}`}>
                    <Chip className="hover:border-accent/60 hover:text-ink">{t}</Chip>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="border-t border-line bg-bg2">
          <div className="wrap py-16 md:py-20">
            <h2 className="mb-8 text-2xl font-semibold">Related work</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {shelf.length > 1 && (
        <nav aria-label="More projects" className="wrap grid gap-4 border-t border-line py-10 sm:grid-cols-2">
          <Link to={`/projects/${prev.slug}`} className="card group p-6 transition-colors hover:border-accent/50">
            <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-dim">
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" /> Previous
            </span>
            <span className="mt-2 block font-display text-xl font-medium">{prev.title}</span>
          </Link>
          <Link to={`/projects/${next.slug}`} className="card group p-6 text-right transition-colors hover:border-accent/50">
            <span className="flex items-center justify-end gap-2 font-mono text-xs uppercase tracking-widest text-dim">
              Next <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="mt-2 block font-display text-xl font-medium">{next.title}</span>
          </Link>
        </nav>
      )}

      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
            className="fixed inset-0 z-50 grid place-items-center bg-bg/90 p-6 backdrop-blur"
          >
            <button aria-label="Close" className="absolute right-5 top-5 text-mute hover:text-ink">
              <X className="size-6" />
            </button>
            <img src={zoom} alt="" className="max-h-full max-w-full rounded-lg border border-line" />
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}
