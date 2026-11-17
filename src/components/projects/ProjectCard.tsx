import { Link } from 'react-router-dom'
import { ArrowUpRight, ExternalLink } from 'lucide-react'
import { usePortfolio } from '@/app/ContentProvider'
import { Chip, GithubIcon, StatusBadge } from '@/components/ui'
import type { Project } from '@/types'
import { cn, isHttpUrl } from '@/utils'

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

/**
 * Project cover. Shows the uploaded cover when there is one; otherwise an
 * abstract generated panel that is obviously a placeholder (never a fake
 * screenshot). Replace it by uploading a cover in Admin → Projects.
 */
export function ProjectCover({ project, className }: { project: Project; className?: string }) {
  if (project.cover_url)
    return (
      <img
        src={project.cover_url}
        alt={`${project.title} cover`}
        loading="lazy"
        className={cn('size-full object-cover', className)}
      />
    )
  const h = hash(project.slug)
  const x = 15 + (h % 70)
  const y = 10 + ((h >> 4) % 60)
  const angle = (h >> 8) % 180
  return (
    <div
      role="img"
      aria-label={`${project.title} — no cover image yet`}
      className={cn('relative size-full overflow-hidden bg-bg2', className)}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${x}% ${y}%, color-mix(in srgb, var(--color-brand) 55%, transparent), transparent 55%), linear-gradient(${angle}deg, var(--color-card), var(--color-bg))`,
        }}
      />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--color-line) 1px, transparent 1px), linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: `radial-gradient(circle at ${x}% ${y}%, #000, transparent 70%)`,
        }}
      />
      <span aria-hidden className="absolute -bottom-[0.18em] left-4 select-none font-display text-[clamp(5rem,16vw,9rem)] font-bold leading-none tracking-tighter text-ink/[0.07]">
        {project.title.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
      </span>
      <span className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-widest text-dim">
        {project.is_lab ? 'Lab' : 'Project'} / {String((h % 89) + 10)}
      </span>
    </div>
  )
}

export function ProjectLinks({ project, size = 'sm' }: { project: Project; size?: 'sm' | 'md' }) {
  const cls = cn(
    'inline-flex items-center gap-1.5 text-mute transition-colors hover:text-hi',
    size === 'sm' ? 'text-xs' : 'text-sm',
  )
  return (
    <>
      {isHttpUrl(project.github_url) && (
        <a href={project.github_url} target="_blank" rel="noopener noreferrer" className={cls}>
          <GithubIcon className="size-3.5" /> Code
        </a>
      )}
      {isHttpUrl(project.live_url) && (
        <a href={project.live_url} target="_blank" rel="noopener noreferrer" className={cls}>
          <ExternalLink className="size-3.5" /> Live
        </a>
      )}
    </>
  )
}

export function ProjectCard({ project, wide }: { project: Project; wide?: boolean }) {
  const { categoryName } = usePortfolio()
  const to = `/projects/${project.slug}`
  return (
    <article
      className={cn(
        'card group relative flex h-full flex-col overflow-hidden transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-accent/50',
        wide && 'md:flex-row',
      )}
    >
      <Link
        to={to}
        tabIndex={-1}
        aria-hidden
        className={cn('block overflow-hidden', wide ? 'aspect-[16/10] md:aspect-auto md:w-[55%]' : 'aspect-[16/10]')}
      >
        <div className="size-full transition-transform duration-500 group-hover:scale-[1.03]">
          <ProjectCover project={project} />
        </div>
      </Link>
      <div className={cn('flex flex-1 flex-col p-5', wide && 'md:justify-center md:p-9')}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          {project.categories[0] && (
            <span className="font-mono text-[11px] uppercase tracking-wider text-dim">
              {categoryName(project.categories[0])}
            </span>
          )}
        </div>
        <h3 className={cn('font-semibold', wide ? 'text-2xl md:text-3xl' : 'text-xl')}>
          <Link to={to} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </h3>
        <p className={cn('mt-2 text-sm text-mute', wide ? 'md:text-base' : 'line-clamp-3')}>
          {project.short_description}
        </p>
        {project.technologies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, wide ? 7 : 4).map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
            {project.technologies.length > (wide ? 7 : 4) && (
              <Chip>+{project.technologies.length - (wide ? 7 : 4)}</Chip>
            )}
          </div>
        )}
        <div className="relative z-10 mt-auto flex items-center gap-4 pt-5">
          <Link to={to} className="inline-flex items-center gap-1 text-sm font-medium text-hi">
            View project
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
          <span className="ml-auto flex items-center gap-4">
            <ProjectLinks project={project} />
          </span>
        </div>
      </div>
    </article>
  )
}

/** Compact row used in list view and on the Labs page. */
export function ProjectRow({ project, index }: { project: Project; index?: number }) {
  return (
    <article className="group relative grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-1 border-b border-line py-5 transition-colors hover:bg-card/40 md:grid-cols-[3rem_17rem_1fr_13rem] md:px-3">
      <span className="font-mono text-xs text-dim">{index !== undefined ? String(index + 1).padStart(2, '0') : '—'}</span>
      <h3 className="font-display text-lg font-medium">
        <Link to={`/projects/${project.slug}`} className="after:absolute after:inset-0 group-hover:text-hi">
          {project.title}
        </Link>
      </h3>
      <p className="col-start-2 text-sm text-mute md:col-start-3">{project.short_description}</p>
      <div className="relative z-10 col-start-2 mt-2 flex flex-wrap items-center gap-3 md:col-start-4 md:mt-0 md:justify-end">
        <ProjectLinks project={project} />
        <StatusBadge status={project.status} />
      </div>
    </article>
  )
}
