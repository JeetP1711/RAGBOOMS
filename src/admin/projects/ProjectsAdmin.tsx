import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Archive, ArrowDown, ArrowUp, Copy, Eye, EyeOff, FlaskConical, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { useContent } from '@/app/ContentProvider'
import { ProjectCover } from '@/components/projects/ProjectCard'
import { Button, EmptyState, Spinner, StatusBadge } from '@/components/ui'
import { deleteRow, duplicateProject, listProjects, patchProject, reorderRows } from '@/services/admin'
import type { Project } from '@/types'
import { cn } from '@/utils'
import { AdminPage, IconButton, Pill, useFeedback } from '../ui'

const TABS = ['All', 'Published', 'Drafts', 'Projects', 'Labs', 'Archived'] as const

export default function ProjectsAdmin() {
  const fb = useFeedback()
  const navigate = useNavigate()
  const { reload } = useContent()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    try {
      setProjects(await listProjects())
    } catch (e) {
      fb.error(e)
      setProjects([])
    }
  }, [fb])
  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shown = useMemo(
    () =>
      (projects ?? []).filter(
        (p) =>
          (tab === 'All' ||
            (tab === 'Published' && p.visibility === 'published') ||
            (tab === 'Drafts' && p.visibility === 'draft') ||
            (tab === 'Projects' && !p.is_lab) ||
            (tab === 'Labs' && p.is_lab) ||
            (tab === 'Archived' && p.status === 'Archived')) &&
          (!q || p.title.toLowerCase().includes(q.toLowerCase())),
      ),
    [projects, tab, q],
  )
  const reorderable = tab === 'All' && !q

  const act = async (fn: () => Promise<unknown>, message: string) => {
    if (await fb.run(fn, message)) {
      await load()
      void reload()
    }
  }

  async function move(i: number, dir: -1 | 1) {
    if (!projects) return
    const next = [...projects]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    setProjects(next)
    if (await fb.run(() => reorderRows('projects', next.map((p) => p.id)))) void reload()
    else void load()
  }

  async function remove(p: Project) {
    const ok = await fb.confirm({
      title: `Delete “${p.title}”?`,
      message: 'This permanently deletes the project and its page. To take it off the site but keep it, unpublish or archive it instead.',
      confirmLabel: 'Delete project',
      danger: true,
    })
    if (ok) await act(() => deleteRow('projects', p.id), 'Project deleted.')
  }

  return (
    <AdminPage
      title="Projects"
      description="Everything in the portfolio and the lab. Drafts are never visible to visitors."
      actions={
        <Button to="/admin/projects/new">
          <Plus className="size-4" /> New project
        </Button>
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-line p-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn('rounded-md px-3 py-1 text-sm', tab === t ? 'bg-card text-ink' : 'text-mute hover:text-ink')}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="relative ml-auto w-full max-w-xs">
          <span className="sr-only">Search projects</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="field h-9 pl-9" />
        </label>
      </div>

      {projects === null ? (
        <div className="flex justify-center py-20"><Spinner className="text-hi" /></div>
      ) : shown.length === 0 ? (
        <EmptyState
          title={projects.length ? 'No projects match.' : 'No projects yet.'}
          hint={projects.length ? undefined : 'Create your first project, or import repositories from the GitHub page.'}
        >
          {!projects.length && <Button to="/admin/projects/new"><Plus className="size-4" /> New project</Button>}
        </EmptyState>
      ) : (
        <ul className="card divide-y divide-line">
          {shown.map((p) => {
            const i = projects.indexOf(p)
            const live = p.visibility === 'published'
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3">
                {reorderable && (
                  <div className="flex flex-col">
                    <IconButton label="Move up" onClick={() => void move(i, -1)} disabled={i === 0}><ArrowUp className="size-3.5" /></IconButton>
                    <IconButton label="Move down" onClick={() => void move(i, 1)} disabled={i === projects.length - 1}><ArrowDown className="size-3.5" /></IconButton>
                  </div>
                )}
                <Link to={`/admin/projects/${p.id}`} className="hidden h-12 w-20 shrink-0 overflow-hidden rounded border border-line sm:block [&_span]:hidden">
                  <ProjectCover project={p} />
                </Link>
                <Link to={`/admin/projects/${p.id}`} className="min-w-40 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {p.title}
                    {p.is_lab && <FlaskConical className="size-3.5 text-dim" aria-label="Lab" />}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    <Pill tone={live ? 'hi' : 'warn'}>{live ? 'Published' : 'Draft'}</Pill>
                    <StatusBadge status={p.status} />
                  </span>
                </Link>
                <div className="flex items-center">
                  <IconButton label={p.featured ? 'Remove from featured' : 'Feature on homepage'} onClick={() => void act(() => patchProject(p.id, { featured: !p.featured }), p.featured ? 'Removed from featured.' : 'Featured on the homepage.')}>
                    <Star className={cn('size-4', p.featured && 'fill-warn text-warn')} />
                  </IconButton>
                  <IconButton label={live ? 'Unpublish' : 'Publish'} onClick={() => void act(() => patchProject(p.id, { visibility: live ? 'draft' : 'published' }), live ? 'Unpublished — now a draft.' : 'Published.')}>
                    {live ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </IconButton>
                  <IconButton label="Edit" onClick={() => navigate(`/admin/projects/${p.id}`)}><Pencil className="size-4" /></IconButton>
                  <IconButton label="Duplicate" onClick={() => void act(() => duplicateProject(p), 'Duplicated as a draft.')}><Copy className="size-4" /></IconButton>
                  <IconButton
                    label={p.status === 'Archived' ? 'Already archived' : 'Archive'}
                    disabled={p.status === 'Archived'}
                    onClick={() => void act(() => patchProject(p.id, { status: 'Archived', featured: false }), 'Archived.')}
                  >
                    <Archive className="size-4" />
                  </IconButton>
                  <IconButton label="Delete" danger onClick={() => void remove(p)}><Trash2 className="size-4" /></IconButton>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {!reorderable && projects && projects.length > 0 && (
        <p className="mt-3 text-xs text-dim">Switch to “All” with no search to change the display order.</p>
      )}
    </AdminPage>
  )
}
