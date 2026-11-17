import type { MediaAsset, Project, SiteSettings } from '@/types'
import { slugify } from '@/utils'
import { mapProject, PROJECT_SELECT } from './content'
import { db } from './supabase'

const must = <T,>(res: { data: T; error: { message: string } | null }): T => {
  if (res.error) throw new Error(res.error.message)
  return res.data
}

/* ------------------------------------------------------------ generic CRUD */

export async function listRows<T>(table: string, orderBy = 'sort_order', ascending = true): Promise<T[]> {
  return must(await db().from(table).select('*').order(orderBy, { ascending })) as T[]
}
export async function saveRow<T extends { id?: string }>(table: string, row: T): Promise<T> {
  const { id, ...rest } = row as Record<string, unknown>
  const q = id ? db().from(table).update(rest).eq('id', id) : db().from(table).insert(rest)
  return must(await q.select().single()) as T
}
export async function deleteRow(table: string, id: string) {
  must(await db().from(table).delete().eq('id', id))
}
export async function reorderRows(table: string, ids: string[]) {
  await Promise.all(ids.map((id, i) => db().from(table).update({ sort_order: i }).eq('id', id).then(must)))
}
export async function countRows(table: string, filter?: Record<string, unknown>): Promise<number> {
  let q = db().from(table).select('id', { count: 'exact', head: true })
  for (const [k, v] of Object.entries(filter ?? {})) q = q.eq(k, v)
  const res = await q
  if (res.error) throw new Error(res.error.message)
  return res.count ?? 0
}

/* ---------------------------------------------------------------- projects */

export async function listProjects(): Promise<Project[]> {
  return (must(await db().from('projects').select(PROJECT_SELECT).order('sort_order')) as unknown[]).map(mapProject)
}
export async function getProject(id: string): Promise<Project | null> {
  const row = must(await db().from('projects').select(PROJECT_SELECT).eq('id', id).maybeSingle())
  return row ? mapProject(row) : null
}

/** Finds a slug that is not used by another project. */
async function uniqueSlug(base: string, selfId?: string): Promise<string> {
  const root = slugify(base) || 'project'
  const rows = must(await db().from('projects').select('id, slug').like('slug', `${root}%`)) as {
    id: string
    slug: string
  }[]
  const taken = new Set(rows.filter((r) => r.id !== selfId).map((r) => r.slug))
  if (!taken.has(root)) return root
  for (let i = 2; ; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`
}

/** Creates or updates a project together with its category and technology links. */
export async function saveProject(p: Partial<Project> & { title: string }): Promise<Project> {
  const { id, categories = [], technologies = [], created_at: _c, updated_at: _u, ...fields } = p
  const row = { ...fields, slug: await uniqueSlug(fields.slug || p.title, id) }
  const saved = must(
    await (id ? db().from('projects').update(row).eq('id', id) : db().from('projects').insert(row)).select('id').single(),
  ) as { id: string }

  // Categories (by slug)
  const cats = categories.length
    ? (must(await db().from('project_categories').select('id, slug').in('slug', categories)) as { id: string }[])
    : []
  must(await db().from('project_category_map').delete().eq('project_id', saved.id))
  if (cats.length)
    must(await db().from('project_category_map').insert(cats.map((c) => ({ project_id: saved.id, category_id: c.id }))))

  // Technologies (by name) — unknown names are created as hidden skills.
  const names = [...new Set(technologies.map((t) => t.trim()).filter(Boolean))]
  const all = must(await db().from('technologies').select('id, name')) as { id: string; name: string }[]
  const byName = new Map(all.map((t) => [t.name.toLowerCase(), t.id]))
  const missing = names.filter((n) => !byName.has(n.toLowerCase()))
  if (missing.length) {
    const created = must(
      await db()
        .from('technologies')
        .insert(missing.map((name) => ({ name, slug: slugify(name), visible: false, sort_order: 999 })))
        .select('id, name'),
    ) as { id: string; name: string }[]
    for (const t of created) byName.set(t.name.toLowerCase(), t.id)
  }
  must(await db().from('project_technologies').delete().eq('project_id', saved.id))
  if (names.length)
    must(
      await db()
        .from('project_technologies')
        .insert(names.map((n) => ({ project_id: saved.id, technology_id: byName.get(n.toLowerCase())! }))),
    )

  return (await getProject(saved.id))!
}

export async function patchProject(id: string, patch: Partial<Project>) {
  must(await db().from('projects').update(patch).eq('id', id))
}

export async function duplicateProject(p: Project): Promise<Project> {
  const { id: _id, github_repo_id: _g, ...rest } = p
  return saveProject({
    ...rest,
    title: `${p.title} (copy)`,
    slug: `${p.slug}-copy`,
    visibility: 'draft',
    featured: false,
    sort_order: p.sort_order + 1,
  })
}

/* ---------------------------------------------------------------- settings */

export async function saveSettings(settings: SiteSettings) {
  must(
    await db()
      .from('site_settings')
      .upsert(Object.entries(settings).map(([key, value]) => ({ key, value }))),
  )
}

/* ------------------------------------------------------------------- media */

const BUCKET = 'media'
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ALLOWED = /^(image\/(png|jpeg|webp|gif|svg\+xml|avif|x-icon|vnd\.microsoft\.icon)|application\/pdf)$/

export async function uploadMedia(file: File): Promise<MediaAsset> {
  if (!ALLOWED.test(file.type)) throw new Error(`${file.name}: only images and PDFs can be uploaded.`)
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name}: files must be under 10 MB.`)
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin'
  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'file'
  const path = `${new Date().toISOString().slice(0, 7)}/${base}-${crypto.randomUUID().slice(0, 8)}.${ext}`
  const up = await db().storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  if (up.error) throw new Error(up.error.message)
  const url = db().storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  return must(
    await db()
      .from('media_assets')
      .insert({ name: file.name, path, url, mime_type: file.type, size: file.size })
      .select()
      .single(),
  ) as MediaAsset
}

export async function deleteMedia(asset: MediaAsset) {
  const rm = await db().storage.from(BUCKET).remove([asset.path])
  if (rm.error) throw new Error(rm.error.message)
  await deleteRow('media_assets', asset.id)
}

/** Lists where a media URL is referenced, so "unused" is never a guess. */
export async function mediaUsage(url: string): Promise<string[]> {
  const [projects, experiences, achievements, profiles, settings] = await Promise.all([
    db().from('projects').select('title, cover_url, gallery'),
    db().from('experiences').select('company, logo_url'),
    db().from('achievements').select('title, certificate_url'),
    db().from('profiles').select('avatar_url, resume_url'),
    db().from('site_settings').select('key, value'),
  ])
  const used: string[] = []
  for (const p of projects.data ?? [])
    if (p.cover_url === url || JSON.stringify(p.gallery ?? []).includes(url)) used.push(`Project: ${p.title}`)
  for (const e of experiences.data ?? []) if (e.logo_url === url) used.push(`Experience: ${e.company}`)
  for (const a of achievements.data ?? []) if (a.certificate_url === url) used.push(`Achievement: ${a.title}`)
  for (const p of profiles.data ?? []) if (p.avatar_url === url || p.resume_url === url) used.push('Profile')
  for (const s of settings.data ?? []) if (JSON.stringify(s.value).includes(url)) used.push(`Settings: ${s.key}`)
  return used
}
