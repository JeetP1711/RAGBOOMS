import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { animate, motion, useInView, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { ProjectStatus } from '@/types'
import { cn } from '@/utils'

/* ------------------------------------------------------------------ Button */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-accent border border-transparent shadow-[0_0_0_1px_rgba(24,201,149,0.25)_inset]',
  secondary: 'border border-line bg-card/60 text-ink hover:border-accent/60 hover:bg-card',
  ghost: 'border border-transparent text-mute hover:text-ink hover:bg-card',
  danger: 'border border-danger/40 text-danger hover:bg-danger/10',
}
const sizes = { sm: 'h-8 px-3 text-[13px] gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-6 text-[15px] gap-2' }

interface ButtonProps {
  variant?: Variant
  size?: keyof typeof sizes
  to?: string
  href?: string
  loading?: boolean
  children: ReactNode
  className?: string
}
export function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  loading,
  className,
  children,
  ...rest
}: ButtonProps & Omit<ComponentProps<'button'>, 'className' | 'children'>) {
  const cls = cn(
    'inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors duration-150 disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  )
  if (to) return <Link to={to} className={cls}>{children}</Link>
  if (href)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    )
  return (
    <button type="button" {...rest} disabled={rest.disabled || loading} className={cls}>
      {loading && <Spinner />}
      {children}
    </button>
  )
}

export const Spinner = ({ className }: { className?: string }) => (
  <span
    role="status"
    aria-label="Loading"
    className={cn('inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent', className)}
  />
)

/* ------------------------------------------------------------------ Reveal */

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ----------------------------------------------------------------- Section */

export function SectionHeading({
  eyebrow,
  title,
  lead,
  action,
}: {
  eyebrow?: string
  title: string
  lead?: string
  action?: ReactNode
}) {
  return (
    <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-4 md:mb-14">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h2 className="text-3xl font-semibold md:text-[2.6rem]">{title}</h2>
        {lead && <p className="mt-4 text-mute md:text-lg">{lead}</p>}
      </div>
      {action}
    </Reveal>
  )
}

export function PageHeader({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <header className="relative overflow-hidden border-b border-line">
      <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="glow pointer-events-none absolute -top-40 left-1/4 size-[520px] opacity-60" aria-hidden />
      <div className="wrap relative pb-14 pt-36 md:pb-20 md:pt-44">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="eyebrow mb-5">{eyebrow}</p>
          <h1 className="max-w-4xl text-4xl font-semibold sm:text-5xl md:text-6xl">{title}</h1>
          {lead && <p className="mt-6 max-w-2xl text-lg text-mute">{lead}</p>}
        </motion.div>
      </div>
    </header>
  )
}

export const TextLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="group inline-flex items-center gap-1.5 text-sm font-medium text-hi">
    <span className="underline-offset-4 group-hover:underline">{children}</span>
    <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
  </Link>
)

/* ------------------------------------------------------------------ Badges */

const statusTone: Record<ProjectStatus, string> = {
  Live: 'text-hi border-hi/40 bg-hi/10',
  Completed: 'text-accent border-accent/40 bg-accent/10',
  'In Development': 'text-warn border-warn/40 bg-warn/10',
  Prototype: 'text-sky-300 border-sky-300/30 bg-sky-300/10',
  Research: 'text-violet-300 border-violet-300/30 bg-violet-300/10',
  Concept: 'text-mute border-line bg-bg2',
  Archived: 'text-dim border-line bg-bg2',
}
export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider',
        statusTone[status],
      )}
    >
      {status === 'Live' && <span className="size-1.5 animate-pulse-dot rounded-full bg-current" />}
      {status}
    </span>
  )
}

export const Chip = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('rounded border border-line bg-bg2 px-2 py-0.5 font-mono text-[11px] text-mute', className)}>
    {children}
  </span>
)

/* ----------------------------------------------------------------- Counter */

export function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    if (reduce) return setN(value)
    const controls = animate(0, value, { duration: 1.2, ease: 'easeOut', onUpdate: (v) => setN(Math.round(v)) })
    return () => controls.stop()
  }, [inView, value, reduce])
  return (
    <span ref={ref} className="tabular-nums">
      {n}
    </span>
  )
}

/* ------------------------------------------------------------- Brand icons */
/* lucide no longer ships brand marks, so these two are inlined. */

export const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
)
export const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
)

export function EmptyState({ title, hint, children }: { title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-6 py-14 text-center">
      <p className="font-display text-lg">{title}</p>
      {hint && <p className="mx-auto mt-2 max-w-md text-sm text-mute">{hint}</p>}
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </div>
  )
}
