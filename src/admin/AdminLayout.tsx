import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Award,
  Briefcase,
  ExternalLink,
  FolderKanban,
  Image,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldAlert,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Button, GithubIcon, Spinner } from '@/components/ui'
import { useSeo } from '@/hooks/useSeo'
import { isSupabaseConfigured } from '@/services/supabase'
import { cn } from '@/utils'
import { AuthProvider, useAuth } from './auth'
import { FeedbackProvider } from './ui'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/experience', label: 'Experience', icon: Briefcase },
  { to: '/admin/skills', label: 'Skills', icon: Sparkles },
  { to: '/admin/achievements', label: 'Achievements', icon: Award },
  { to: '/admin/profile', label: 'Profile & About', icon: UserRound },
  { to: '/admin/media', label: 'Media', icon: Image },
  { to: '/admin/messages', label: 'Messages', icon: Inbox },
  { to: '/admin/github', label: 'GitHub', icon: GithubIcon },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

/** Wraps every /admin route with auth + feedback providers. */
export function AdminRoot() {
  useSeo({ title: 'Admin', noindex: true })
  return (
    <AuthProvider>
      <FeedbackProvider>
        <Outlet />
      </FeedbackProvider>
    </AuthProvider>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh place-items-center px-5 py-10">
      <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  )
}

function SetupNeeded() {
  return (
    <Centered>
      <div className="card p-7">
        <Logo width={150} />
        <h1 className="mt-6 text-2xl font-semibold">Connect Supabase to use the admin panel</h1>
        <p className="mt-3 text-sm text-mute">
          The public site is currently showing the bundled starter content. The admin panel needs a database to write
          to.
        </p>
        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-ink/90">
          <li>Create a Supabase project.</li>
          <li>
            Run <code className="font-mono text-hi">supabase/migrations/0001_init.sql</code>, then{' '}
            <code className="font-mono text-hi">supabase/seed.sql</code> in the SQL editor.
          </li>
          <li>
            Copy <code className="font-mono text-hi">.env.example</code> to <code className="font-mono text-hi">.env</code> and
            fill in the keys.
          </li>
          <li>Create your user and add it to <code className="font-mono text-hi">admin_users</code>.</li>
        </ol>
        <p className="mt-5 text-sm text-mute">Full steps are in README.md.</p>
        <Button to="/" variant="secondary" className="mt-6">
          Back to site
        </Button>
      </div>
    </Centered>
  )
}

export function Login() {
  const { session, isAdmin, loading, signIn, signOut } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/admin'

  if (!isSupabaseConfigured) return <SetupNeeded />
  if (session && isAdmin) return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await signIn(String(data.get('email')), String(data.get('password')))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Centered>
      <div className="card p-7">
        <Logo width={160} />
        <h1 className="mt-6 text-2xl font-semibold">Admin sign in</h1>
        <p className="mt-1.5 text-sm text-mute">Private area. Authorised administrators only.</p>

        {loading || (session && isAdmin === null) ? (
          <div className="mt-8 flex justify-center"><Spinner className="text-hi" /></div>
        ) : session && isAdmin === false ? (
          <div className="mt-6 rounded-md border border-danger/40 bg-danger/10 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-danger">
              <ShieldAlert className="size-4" /> Not authorised
            </p>
            <p className="mt-2 text-mute">
              {session.user.email} is signed in but is not an administrator of this site.
            </p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" name="email" type="email" required autoComplete="username" className="field" />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
            </div>
            {error && (
              <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <Button type="submit" loading={busy} className="w-full">
              Sign in
            </Button>
          </form>
        )}
        <Link to="/" className="mt-6 inline-block text-xs text-dim hover:text-mute">
          ← Back to site
        </Link>
      </div>
    </Centered>
  )
}

/** Guarded shell for all admin pages. */
export function AdminLayout() {
  const { session, isAdmin, loading, signOut } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [pathname])

  if (!isSupabaseConfigured) return <SetupNeeded />
  if (loading || (session && isAdmin === null))
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="size-6 text-hi" />
      </div>
    )
  if (!session || !isAdmin) return <Navigate to="/admin/login" replace state={{ from: pathname }} />

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur lg:hidden">
        <Logo width={110} />
        <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open} className="grid size-9 place-items-center">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-line bg-bg2 pt-14 transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 lg:pt-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="hidden h-16 items-center px-5 lg:flex">
          <Link to="/admin" aria-label="Admin dashboard"><Logo width={120} /></Link>
        </div>
        <nav aria-label="Admin" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-brand/20 text-ink' : 'text-mute hover:bg-card hover:text-ink',
                )
              }
            >
              <n.icon className="size-4 shrink-0" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line p-3">
          <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-mute hover:bg-card hover:text-ink">
            <ExternalLink className="size-4" /> View site
          </a>
          <button
            onClick={() => void signOut().then(() => navigate('/admin/login'))}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-mute hover:bg-card hover:text-ink"
          >
            <LogOut className="size-4" /> Sign out
          </button>
          <p className="truncate px-3 pt-1 font-mono text-[10px] text-dim">{session.user.email}</p>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-10 bg-bg/70 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
