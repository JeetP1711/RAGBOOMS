import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, X } from 'lucide-react'
import { usePortfolio } from '@/app/ContentProvider'
import { Button, GithubIcon, StatusBadge } from '@/components/ui'
import { cn } from '@/utils'
import { Logo } from './Logo'

export function Header() {
  const { settings, social } = usePortfolio()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const github = social('github')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => setMenu(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = menu || search ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menu, search])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearch((s) => !s)
      }
      if (e.key === 'Escape') {
        setSearch(false)
        setMenu(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300',
          scrolled || menu ? 'border-b border-line bg-bg/80 backdrop-blur-xl' : 'border-b border-transparent',
        )}
      >
        <div className="wrap flex h-16 items-center justify-between gap-6">
          <Link to="/" aria-label="RAGBOOMS — home" className="shrink-0">
            <Logo width={126} />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {settings.navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative rounded-md px-3 py-1.5 text-sm transition-colors',
                    isActive ? 'text-ink' : 'text-mute hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-3 -bottom-[13px] h-px bg-hi"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearch(true)}
              aria-label="Search (Ctrl+K)"
              className="grid size-9 place-items-center rounded-md text-mute transition-colors hover:bg-card hover:text-ink"
            >
              <Search className="size-[18px]" />
            </button>
            {github && (
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
                className="grid size-9 place-items-center rounded-md text-mute transition-colors hover:bg-card hover:text-ink"
              >
                <GithubIcon className="size-[18px]" />
              </a>
            )}
            <Button to="/contact" size="sm" className="ml-2 max-sm:hidden">
              {settings.footer.cta_label || "Let's Work Together"}
            </Button>
            <button
              onClick={() => setMenu((m) => !m)}
              aria-label={menu ? 'Close menu' : 'Open menu'}
              aria-expanded={menu}
              className="ml-1 grid size-9 place-items-center rounded-md text-ink hover:bg-card lg:hidden"
            >
              {menu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-bg pt-20 lg:hidden"
          >
            <nav aria-label="Mobile" className="wrap flex h-full flex-col pb-10">
              {settings.navigation.map((item, i) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-baseline gap-4 border-b border-line py-4 font-display text-2xl',
                        isActive ? 'text-hi' : 'text-ink',
                      )
                    }
                  >
                    <span className="font-mono text-xs text-dim">{String(i + 1).padStart(2, '0')}</span>
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}
              <Button to="/contact" size="lg" className="mt-8">
                {settings.footer.cta_label || "Let's Work Together"}
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{search && <SearchDialog onClose={() => setSearch(false)} />}</AnimatePresence>
    </>
  )
}

/** Global search across projects, experiments and skills. */
function SearchDialog({ onClose }: { onClose: () => void }) {
  const { projects, technologies } = usePortfolio()
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => input.current?.focus(), [])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return { projects: projects.filter((p) => p.featured).slice(0, 5), skills: [] }
    return {
      projects: projects
        .filter((p) =>
          [p.title, p.short_description, p.status, ...p.technologies].join(' ').toLowerCase().includes(term),
        )
        .slice(0, 8),
      skills: technologies.filter((t) => t.visible && t.name.toLowerCase().includes(term)).slice(0, 6),
    }
  }, [q, projects, technologies])

  const go = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-bg/80 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -12, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="card mx-auto max-w-xl overflow-hidden shadow-2xl shadow-black/60"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 text-mute" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects, experiments and skills…"
            className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-dim"
          />
          <kbd className="rounded border border-line px-1.5 font-mono text-[10px] text-dim">ESC</kbd>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {results.projects.length === 0 && results.skills.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-mute">Nothing matches “{q}”.</p>
          )}
          {results.projects.length > 0 && (
            <p className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-dim">
              {q ? 'Projects' : 'Featured'}
            </p>
          )}
          {results.projects.map((p) => (
            <button
              key={p.id}
              onClick={() => go(`/projects/${p.slug}`)}
              className="flex w-full items-center justify-between gap-4 rounded-md px-3 py-2.5 text-left hover:bg-bg2"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{p.title}</span>
                <span className="block truncate text-xs text-mute">{p.short_description}</span>
              </span>
              <StatusBadge status={p.status} />
            </button>
          ))}
          {results.skills.length > 0 && (
            <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-widest text-dim">Skills</p>
          )}
          {results.skills.map((t) => (
            <button
              key={t.id}
              onClick={() => go(`/projects?tech=${encodeURIComponent(t.name)}`)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-bg2"
            >
              {t.name}
              <span className="text-xs text-dim">{t.group_name}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
