import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { useContent } from '@/app/ContentProvider'
import { Button, Spinner } from '@/components/ui'
import { getProject, listRows, saveProject } from '@/services/admin'
import { PROJECT_STATUSES, type Category, type ChangelogEntry, type GalleryItem, type Project, type Technology } from '@/types'
import { cn, slugify } from '@/utils'
import { MediaPicker } from '../media/MediaAdmin'
import { AdminPage, FormFields, Panel, useFeedback, validate, type FieldDef } from '../ui'

const BLANK: Partial<Project> = {
  title: '',
  slug: '',
  short_description: '',
  description: '',
  problem: '',
  solution: '',
  features: [],
  planned_features: [],
  challenges: '',
  architecture: '',
  status: 'In Development',
  visibility: 'draft',
  featured: false,
  is_lab: false,
  sort_order: 0,
  cover_url: null,
  gallery: [],
  video_url: null,
  github_url: null,
  live_url: null,
  docs_url: null,
  download_url: null,
  start_date: null,
  end_date: null,
  seo_title: null,
  seo_description: null,
  changelog: [],
  categories: [],
  technologies: [],
}

const basics: FieldDef[] = [
  { name: 'title', label: 'Title', required: true },
  { name: 'slug', label: 'Slug', hint: 'The page address: /projects/your-slug. Leave empty to generate from the title.' },
  { name: 'short_description', label: 'Short description', type: 'textarea', rows: 2, required: true, hint: 'One or two sentences, shown on cards.' },
  { name: 'status', label: 'Project status', type: 'select', options: PROJECT_STATUSES, required: true },
  { name: 'start_date', label: 'Start date', type: 'date' },
  { name: 'end_date', label: 'Completion date', type: 'date' },
]
const story: FieldDef[] = [
  { name: 'description', label: 'Overview', type: 'textarea', rows: 6, hint: 'Leave a blank line between paragraphs.' },
  { name: 'problem', label: 'Problem statement', type: 'textarea' },
  { name: 'solution', label: 'Solution', type: 'textarea' },
  { name: 'features', label: 'Features (built)', type: 'list', hint: 'Only what is actually implemented.' },
  { name: 'planned_features', label: 'Planned features', type: 'list', hint: 'Shown separately as “Planned — not built yet”.' },
  { name: 'architecture', label: 'Architecture', type: 'textarea' },
  { name: 'challenges', label: 'Development challenges', type: 'textarea' },
]
const links: FieldDef[] = [
  { name: 'github_url', label: 'GitHub repository', type: 'url' },
  { name: 'live_url', label: 'Live demo', type: 'url' },
  { name: 'docs_url', label: 'Documentation', type: 'url' },
  { name: 'download_url', label: 'App download', type: 'url' },
  { name: 'video_url', label: 'Video / demo link', type: 'url', wide: true },
]
const seo: FieldDef[] = [
  { name: 'seo_title', label: 'SEO title', hint: 'Defaults to the project title.' },
  { name: 'seo_description', label: 'SEO description', type: 'textarea', rows: 2, hint: 'Defaults to the short description.' },
]

export default function ProjectEditor() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const fb = useFeedback()
  const { reload } = useContent()
  const [p, setP] = useState<Partial<Project> | null>(isNew ? BLANK : null)
  const [categories, setCategories] = useState<Category[]>([])
  const [techs, setTechs] = useState<Technology[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<'' | 'draft' | 'published'>('')
  const [dirty, setDirty] = useState(false)
  const [picker, setPicker] = useState(false)

  useEffect(() => {
    void Promise.all([listRows<Category>('project_categories'), listRows<Technology>('technologies')])
      .then(([c, t]) => {
        setCategories(c)
        setTechs(t)
      })
      .catch(fb.error)
    if (id)
      getProject(id)
        .then((proj) => (proj ? setP(proj) : navigate('/admin/projects', { replace: true })))
        .catch(fb.error)
    else setP(BLANK)
    setDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const techFields = useMemo<FieldDef[]>(
    () => [{ name: 'technologies', label: 'Technologies', type: 'tags', suggestions: techs.map((t) => t.name), hint: 'New names are added to Skills as hidden entries.' }],
    [techs],
  )
  if (!p) return <div className="flex justify-center py-32"><Spinner className="text-hi" /></div>

  const patch = (v: Record<string, unknown>) => {
    setP((cur) => ({ ...cur, ...v }))
    setDirty(true)
  }
  const gallery = p.gallery ?? []
  const changelog = p.changelog ?? []
  const setGallery = (g: GalleryItem[]) => patch({ gallery: g })
  const setChangelog = (c: ChangelogEntry[]) => patch({ changelog: c })

  async function save(visibility: 'draft' | 'published') {
    const errs = validate([...basics, ...links, ...story, ...seo], p as Record<string, unknown>)
    if (p!.slug && slugify(p!.slug) !== p!.slug) errs.slug = 'Use lowercase letters, numbers and hyphens only.'
    setErrors(errs)
    if (Object.keys(errs).length) return fb.error('Please fix the highlighted fields.')
    setSaving(visibility)
    try {
      const saved = await saveProject({
        ...(p as Project),
        visibility,
        gallery: gallery.filter((g) => g.url),
        changelog: changelog.filter((c) => c.title.trim()),
      })
      setP(saved)
      setDirty(false)
      void reload()
      fb.success(visibility === 'published' ? 'Saved and published.' : 'Saved as draft.')
      if (isNew) navigate(`/admin/projects/${saved.id}`, { replace: true })
    } catch (e) {
      fb.error(e)
    } finally {
      setSaving('')
    }
  }

  const live = p.visibility === 'published'
  return (
    <AdminPage
      title={isNew ? 'New project' : p.title || 'Untitled project'}
      description={isNew ? 'Starts as a draft. Nothing is public until you publish.' : live ? 'Published — changes go live when you save.' : 'Draft — not visible to visitors.'}
      actions={
        <>
          {!isNew && live && (
            <Button href={`/projects/${p.slug}`} variant="ghost">
              <ExternalLink className="size-4" /> View
            </Button>
          )}
          <Button variant="secondary" loading={saving === 'draft'} disabled={!!saving} onClick={() => void save('draft')}>
            {live ? 'Unpublish & save' : 'Save draft'}
          </Button>
          <Button loading={saving === 'published'} disabled={!!saving} onClick={() => void save('published')}>
            {live ? 'Save changes' : 'Publish'}
          </Button>
        </>
      }
    >
      <Link to="/admin/projects" className="-mt-4 mb-6 inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink">
        <ArrowLeft className="size-4" /> All projects
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel title="Basics">
            <FormFields fields={basics} values={p} errors={errors} onChange={patch} />
          </Panel>
          <Panel title="Story" hint="Empty sections are simply left off the project page.">
            <FormFields fields={story} values={p} errors={errors} onChange={patch} />
          </Panel>
          <Panel title="Links" hint="Only real, working URLs. Empty links are not shown.">
            <FormFields fields={links} values={p} errors={errors} onChange={patch} />
          </Panel>

          <Panel title="Gallery" hint="Real screenshots only. Click an image on the project page to enlarge it.">
            {gallery.length > 0 && (
              <ul className="mb-4 space-y-3">
                {gallery.map((g, i) => (
                  <li key={`${g.url}-${i}`} className="flex items-center gap-3">
                    <img src={g.url} alt="" className="h-14 w-20 shrink-0 rounded border border-line object-cover" />
                    <input
                      value={g.caption ?? ''}
                      onChange={(e) => setGallery(gallery.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))}
                      placeholder="Caption (optional)"
                      aria-label={`Caption for image ${i + 1}`}
                      className="field"
                    />
                    <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => setGallery(gallery.map((x, j) => (j === i - 1 ? g : j === i ? gallery[i - 1] : x)))}>
                      Up
                    </Button>
                    <button type="button" aria-label="Remove image" onClick={() => setGallery(gallery.filter((_, j) => j !== i))} className="text-mute hover:text-danger">
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="secondary" size="sm" onClick={() => setPicker(true)}>
              <Plus className="size-4" /> Add image
            </Button>
            <MediaPicker
              open={picker}
              onClose={() => setPicker(false)}
              onPick={(url) => {
                if (!gallery.some((g) => g.url === url)) setGallery([...gallery, { url }])
                setPicker(false)
              }}
            />
          </Panel>

          <Panel title="Changelog" hint="Releases, new features and technical changes. Newest first.">
            {changelog.length > 0 && (
              <ul className="mb-4 space-y-4">
                {changelog.map((c, i) => {
                  const upd = (v: Partial<ChangelogEntry>) => setChangelog(changelog.map((x, j) => (j === i ? { ...x, ...v } : x)))
                  return (
                    <li key={i} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[9rem_7rem_1fr_auto]">
                      <input type="date" value={c.date} onChange={(e) => upd({ date: e.target.value })} aria-label="Date" className="field" />
                      <input value={c.version ?? ''} onChange={(e) => upd({ version: e.target.value })} placeholder="v1.0" aria-label="Version" className="field" />
                      <input value={c.title} onChange={(e) => upd({ title: e.target.value })} placeholder="What changed" aria-label="Title" className="field" />
                      <button type="button" aria-label="Remove entry" onClick={() => setChangelog(changelog.filter((_, j) => j !== i))} className="px-2 text-mute hover:text-danger">
                        <Trash2 className="size-4" />
                      </button>
                      <textarea value={c.notes ?? ''} onChange={(e) => upd({ notes: e.target.value })} placeholder="Notes (optional)" aria-label="Notes" rows={2} className="field sm:col-span-4" />
                    </li>
                  )
                })}
              </ul>
            )}
            <Button variant="secondary" size="sm" onClick={() => setChangelog([{ date: new Date().toISOString().slice(0, 10), title: '' }, ...changelog])}>
              <Plus className="size-4" /> Add entry
            </Button>
          </Panel>

          <Panel title="Search engines">
            <FormFields fields={seo} values={p} errors={errors} onChange={patch} />
          </Panel>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <Panel title="Placement">
            <div className="space-y-1">
              <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-line p-1 text-sm" role="group" aria-label="Shelf">
                {[
                  { lab: false, label: 'Projects' },
                  { lab: true, label: 'Labs' },
                ].map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    aria-pressed={!!p.is_lab === o.lab}
                    onClick={() => patch({ is_lab: o.lab })}
                    className={cn('rounded-md py-1.5', !!p.is_lab === o.lab ? 'bg-brand/25 text-ink' : 'text-mute hover:text-ink')}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <FormFields
                fields={[{ name: 'featured', label: 'Featured on homepage', type: 'toggle', hint: 'Applies to published projects.' }]}
                values={p}
                onChange={patch}
              />
            </div>
          </Panel>
          <Panel title="Cover image">
            <FormFields fields={[{ name: 'cover_url', label: 'Cover', type: 'image' }]} values={p} errors={errors} onChange={patch} />
          </Panel>
          <Panel title="Categories">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const on = p.categories?.includes(c.slug)
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => patch({ categories: on ? p.categories!.filter((s) => s !== c.slug) : [...(p.categories ?? []), c.slug] })}
                    className={cn('rounded-full border px-3 py-1 text-xs', on ? 'border-accent bg-brand/20 text-ink' : 'border-line text-mute hover:text-ink')}
                  >
                    {c.name}
                  </button>
                )
              })}
              {categories.length === 0 && <p className="text-sm text-mute">Add categories in Settings.</p>}
            </div>
          </Panel>
          <Panel title="Technologies">
            <FormFields fields={techFields} values={p} onChange={patch} />
          </Panel>
          {p.github_meta && (
            <Panel title="GitHub" hint="Imported data. Refresh it from the GitHub page.">
              <dl className="space-y-1.5 font-mono text-xs text-mute">
                <div className="flex justify-between"><dt>Repository</dt><dd>{p.github_meta.full_name}</dd></div>
                <div className="flex justify-between"><dt>Language</dt><dd>{p.github_meta.language ?? '—'}</dd></div>
                <div className="flex justify-between"><dt>Stars / forks</dt><dd>{p.github_meta.stars ?? 0} / {p.github_meta.forks ?? 0}</dd></div>
              </dl>
            </Panel>
          )}
        </div>
      </div>
    </AdminPage>
  )
}
