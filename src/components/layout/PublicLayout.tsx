import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Mail } from 'lucide-react'
import { useContent, usePortfolio } from '@/app/ContentProvider'
import { GithubIcon, LinkedinIcon, Spinner } from '@/components/ui'
import { isHttpUrl } from '@/utils'
import { Header } from './Header'
import { Logo } from './Logo'

export function PublicLayout() {
  const { pathname } = useLocation()
  const { loading, source, error } = useContent()
  const { settings } = usePortfolio()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Branded loading screen while the first content request is in flight.
  if (loading && source === 'seed')
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="flex flex-col items-center gap-6">
          <Logo width={200} />
          <Spinner className="text-hi" />
        </div>
      </div>
    )

  if (settings.maintenance.enabled)
    return (
      <div className="relative grid min-h-dvh place-items-center px-6 text-center">
        <div className="grid-bg absolute inset-0" aria-hidden />
        <div className="relative">
          <Logo width={220} className="mx-auto" />
          <p className="eyebrow mt-10">Maintenance</p>
          <p className="mx-auto mt-4 max-w-md text-lg text-mute">{settings.maintenance.message}</p>
        </div>
      </div>
    )

  const { announcement } = settings
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-brand focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Header />
      {announcement.enabled && announcement.text && (
        <div className="relative z-20 mt-16 border-b border-line bg-brand/15 px-4 py-2 text-center text-sm">
          {announcement.text}
          {announcement.link && (
            <a href={announcement.link} className="link ml-2 font-medium">
              Learn more
            </a>
          )}
        </div>
      )}
      {error && (
        <div className="relative z-20 mt-16 border-b border-danger/30 bg-danger/10 px-4 py-2 text-center text-sm text-danger">
          Live content could not be loaded ({error}). Showing the bundled copy.
        </div>
      )}
      <motion.main
        id="main"
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex-1"
      >
        <Outlet />
      </motion.main>
      <Footer />
    </div>
  )
}

function Footer() {
  const { settings, profile, social, email } = usePortfolio()
  const github = social('github')
  const linkedin = social('linkedin')
  return (
    <footer className="mt-24 border-t border-line bg-bg2">
      <div className="wrap grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo width={150} />
          <p className="mt-5 max-w-xs text-sm text-mute">{settings.footer.statement}</p>
        </div>
        <nav aria-label="Footer">
          <p className="eyebrow mb-4 !text-dim">Explore</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[...settings.navigation, { label: 'GitHub', path: '/github' }].map((n) => (
              <li key={n.path}>
                <Link to={n.path} className="text-mute transition-colors hover:text-ink">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="eyebrow mb-4 !text-dim">Connect</p>
          <ul className="space-y-2 text-sm">
            {isHttpUrl(github) && (
              <li>
                <a href={github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-mute hover:text-ink">
                  <GithubIcon className="size-4" /> GitHub <ArrowUpRight className="size-3.5" />
                </a>
              </li>
            )}
            {isHttpUrl(linkedin) && (
              <li>
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-mute hover:text-ink">
                  <LinkedinIcon className="size-4" /> LinkedIn <ArrowUpRight className="size-3.5" />
                </a>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email}`} className="inline-flex items-center gap-2 text-mute hover:text-ink">
                  <Mail className="size-4" /> {email}
                </a>
              </li>
            )}
            <li>
              <Link to="/contact" className="link">
                Send a message
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="wrap flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-dim">
          <p>
            © {new Date().getFullYear()} {settings.general.title}. Built by {profile.full_name}.
          </p>
          <Link to="/admin/login" className="transition-colors hover:text-mute">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  )
}
