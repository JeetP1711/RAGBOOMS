/** Profile & About manager and the site-wide Settings page. */
import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useContent } from '@/app/ContentProvider'
import { Button, Spinner } from '@/components/ui'
import { listProjects, listRows, patchProject, saveRow, saveSettings } from '@/services/admin'
import { mergeSettings } from '@/services/content'
import type { NavItem, Profile, Project, SiteSettings } from '@/types'
import { ResourceManager } from '../ResourceManager'
import { categoryConfig, educationConfig, socialConfig } from '../resources'
import { AdminPage, FormFields, IconButton, Panel, useFeedback, validate, type FieldDef } from '../ui'

/* ----------------------------------------------------------------- Profile */

const identity: FieldDef[] = [
  { name: 'full_name', label: 'Name', required: true },
  { name: 'location', label: 'Location', hint: 'City and country only.' },
  { name: 'headline', label: 'Professional headline', wide: true },
  { name: 'email', label: 'Public email', type: 'email', hint: 'Shown on the site. Leave empty to hide.' },
  { name: 'resume_url', label: 'Résumé URL', type: 'url', hint: 'Upload a PDF in Media and paste its URL here.' },
  { name: 'avatar_url', label: 'Profile photograph', type: 'image' },
]
const hero: FieldDef[] = [
  { name: 'hero_eyebrow', label: 'Eyebrow', wide: true },
  { name: 'hero_headline', label: 'Headline', type: 'textarea', rows: 2 },
  { name: 'hero_subtext', label: 'Supporting text', type: 'textarea', rows: 3 },
  { name: 'taglines', label: 'Taglines', type: 'list', rows: 3, hint: 'The first one appears next to the logo on the homepage.' },
]
const about: FieldDef[] = [
  { name: 'intro', label: 'Introduction', type: 'textarea', rows: 3, hint: 'Short. Used on the homepage and at the top of About.' },
  { name: 'bio', label: 'Biography', type: 'textarea', rows: 6 },
  { name: 'journey', label: 'My journey into technology', type: 'textarea', rows: 5 },
  { name: 'what_i_build', label: 'What I build', type: 'textarea' },
  { name: 'philosophy', label: 'Professional philosophy', type: 'textarea', hint: 'The first sentence is used as the pull-quote on the homepage.' },
  { name: 'interests', label: 'Areas of interest', type: 'list' },
]

export function ProfileAdmin() {
  const fb = useFeedback()
  const { reload } = useContent()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listRows<Profile>('profiles', 'created_at')
      .then((rows) => setProfile(rows[0] ?? ({ full_name: '' } as Profile)))
      .catch(fb.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!profile) return <div className="flex justify-center py-32"><Spinner className="text-hi" /></div>
  const patch = (v: Record<string, unknown>) => setProfile((p) => ({ ...p!, ...v }))

  async function save() {
    const errs = validate([...identity, ...hero, ...about], profile as unknown as Record<string, unknown>)
    setErrors(errs)
    if (Object.keys(errs).length) return fb.error('Please fix the highlighted fields.')
    setSaving(true)
    try {
      setProfile(await saveRow('profiles', profile!))
      void reload()
      fb.success('Profile saved.')
    } catch (e) {
      fb.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminPage
      title="Profile & About"
      description="Who you are, the homepage hero, and everything on the About page."
      actions={<Button loading={saving} onClick={() => void save()}>Save profile</Button>}
    >
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Panel title="Identity"><FormFields fields={identity} values={profile as never} errors={errors} onChange={patch} /></Panel>
          <Panel title="Homepage hero"><FormFields fields={hero} values={profile as never} errors={errors} onChange={patch} /></Panel>
        </div>
        <Panel title="About page"><FormFields fields={about} values={profile as never} errors={errors} onChange={patch} /></Panel>
        <Panel title="Education" hint="Saved immediately — separate from the Save button above.">
          <ResourceManager config={educationConfig} embedded />
        </Panel>
        <Panel title="Social links" hint="Links without a URL are not shown on the site.">
          <ResourceManager config={socialConfig} embedded />
        </Panel>
      </div>
    </AdminPage>
  )
}

/* ---------------------------------------------------------------- Settings */

const general: FieldDef[] = [
  { name: 'title', label: 'Website title', required: true },
  { name: 'contact_email', label: 'Contact email', type: 'email', hint: 'Fallback when the profile has no public email.' },
  { name: 'description', label: 'Default meta description', type: 'textarea', rows: 2 },
  { name: 'logo_url', label: 'Logo', type: 'image' },
  { name: 'favicon_url', label: 'Favicon', type: 'image' },
  { name: 'og_image_url', label: 'Default share image (Open Graph)', type: 'image' },
]
const colors: FieldDef[] = [
  { name: 'brand', label: 'Primary brand green', type: 'color' },
  { name: 'accent', label: 'Accent green', type: 'color' },
  { name: 'highlight', label: 'Bright highlight', type: 'color', wide: true },
]

export function SettingsAdmin() {
  const fb = useFeedback()
  const { reload } = useContent()
  const [s, setS] = useState<SiteSettings | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    listRows<{ key: string; value: unknown }>('site_settings', 'key')
      .then((rows) => setS(mergeSettings(rows)))
      .catch(fb.error)
    listProjects().then(setProjects).catch(fb.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!s) return <div className="flex justify-center py-32"><Spinner className="text-hi" /></div>
  const set = <K extends keyof SiteSettings>(key: K, v: Partial<SiteSettings[K]>) =>
    setS((cur) => ({ ...cur!, [key]: Array.isArray(v) ? v : { ...(cur![key] as object), ...v } }))
  const nav = s.navigation
  const setNav = (n: NavItem[]) => setS((cur) => ({ ...cur!, navigation: n }))

  async function save() {
    const errs = validate(general, s!.general as never)
    setErrors(errs)
    const badNav = nav.some((n) => !n.label.trim() || !n.path.startsWith('/'))
    if (Object.keys(errs).length || badNav)
      return fb.error(badNav ? 'Every navigation item needs a label and a path starting with “/”.' : 'Please fix the highlighted fields.')
    if (s!.maintenance.enabled && !(await fb.confirm({ title: 'Turn on maintenance mode?', message: 'Visitors will see only the maintenance message until you turn it off. The admin panel stays available.', confirmLabel: 'Save and enable' })))
      return
    setSaving(true)
    if (await fb.run(() => saveSettings(s!), 'Settings saved.')) void reload()
    setSaving(false)
  }

  async function toggleFeatured(p: Project) {
    if (await fb.run(() => patchProject(p.id, { featured: !p.featured }))) {
      setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, featured: !x.featured } : x)))
      void reload()
    }
  }

  return (
    <AdminPage
      title="Settings"
      description="Site-wide configuration. Changes apply to every page."
      actions={<Button loading={saving} onClick={() => void save()}>Save settings</Button>}
    >
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel title="General & SEO">
          <FormFields fields={general} values={s.general as never} errors={errors} onChange={(v) => set('general', v as never)} />
        </Panel>

        <div className="space-y-6">
          <Panel title="Brand colours" hint="Applied across the site as soon as you save.">
            <FormFields fields={colors} values={s.colors as never} onChange={(v) => set('colors', v as never)} />
            <Button size="sm" variant="ghost" className="mt-3" onClick={() => set('colors', { brand: '#087F5B', accent: '#0EAD78', highlight: '#18C995' })}>
              Reset to RAGBOOMS greens
            </Button>
          </Panel>
          <Panel title="Footer">
            <FormFields
              fields={[
                { name: 'statement', label: 'Brand statement', type: 'textarea', rows: 2 },
                { name: 'cta_label', label: 'Call-to-action button label', wide: true },
              ]}
              values={s.footer as never}
              onChange={(v) => set('footer', v as never)}
            />
          </Panel>
          <Panel title="Announcement banner">
            <FormFields
              fields={[
                { name: 'enabled', label: 'Show banner', type: 'toggle' },
                { name: 'text', label: 'Text', wide: true },
                { name: 'link', label: 'Link (optional)', type: 'url', wide: true },
              ]}
              values={s.announcement as never}
              onChange={(v) => set('announcement', v as never)}
            />
          </Panel>
          <Panel title="Maintenance mode">
            <FormFields
              fields={[
                { name: 'enabled', label: 'Enable maintenance mode', type: 'toggle', hint: 'Replaces the public site with the message below.' },
                { name: 'message', label: 'Message', type: 'textarea', rows: 2 },
              ]}
              values={s.maintenance as never}
              onChange={(v) => set('maintenance', v as never)}
            />
          </Panel>
        </div>

        <Panel title="Navigation" hint="Header and footer links, in order.">
          <ul className="space-y-2">
            {nav.map((n, i) => (
              <li key={i} className="flex items-center gap-2">
                <input value={n.label} onChange={(e) => setNav(nav.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} aria-label="Label" placeholder="Label" className="field" />
                <input value={n.path} onChange={(e) => setNav(nav.map((x, j) => (j === i ? { ...x, path: e.target.value } : x)))} aria-label="Path" placeholder="/path" className="field font-mono" />
                <IconButton label="Move up" disabled={i === 0} onClick={() => setNav(nav.map((x, j) => (j === i - 1 ? n : j === i ? nav[i - 1] : x)))}><ArrowUp className="size-4" /></IconButton>
                <IconButton label="Move down" disabled={i === nav.length - 1} onClick={() => setNav(nav.map((x, j) => (j === i + 1 ? n : j === i ? nav[i + 1] : x)))}><ArrowDown className="size-4" /></IconButton>
                <IconButton label="Remove" danger onClick={() => setNav(nav.filter((_, j) => j !== i))}><Trash2 className="size-4" /></IconButton>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => setNav([...nav, { label: '', path: '/' }])}>
            <Plus className="size-4" /> Add link
          </Button>
        </Panel>

        <Panel title="Homepage featured projects" hint="Saved immediately. Only published, non-lab projects can be featured.">
          <ul className="space-y-1">
            {projects.filter((p) => p.visibility === 'published' && !p.is_lab).map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-bg2">
                  <input type="checkbox" checked={p.featured} onChange={() => void toggleFeatured(p)} className="size-4 accent-[var(--color-accent)]" />
                  {p.title}
                </label>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Project categories" hint="Saved immediately." className="lg:col-span-2">
          <ResourceManager config={categoryConfig} embedded />
        </Panel>
      </div>
    </AdminPage>
  )
}
