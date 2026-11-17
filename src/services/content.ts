import { seedContent } from '@/data/seed'
import type { Project, SiteContent, SiteSettings } from '@/types'
import { isSupabaseConfigured, supabase } from './supabase'

export const PROJECT_SELECT =
  '*, project_category_map(project_categories(slug)), project_technologies(technologies(name))'

/** Flattens the joined rows Supabase returns into the app's Project shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapProject = (row: any): Project => {
  const { project_category_map, project_technologies, ...rest } = row
  return {
    ...rest,
    features: rest.features ?? [],
    planned_features: rest.planned_features ?? [],
    gallery: rest.gallery ?? [],
    changelog: rest.changelog ?? [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories: (project_category_map ?? []).map((m: any) => m.project_categories?.slug).filter(Boolean),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    technologies: (project_technologies ?? []).map((m: any) => m.technologies?.name).filter(Boolean),
  }
}

export const mergeSettings = (rows: { key: string; value: unknown }[]): SiteSettings => {
  const out = structuredClone(seedContent.settings) as unknown as Record<string, unknown>
  for (const { key, value } of rows) {
    if (!(key in out)) continue
    out[key] = Array.isArray(value) ? value : { ...(out[key] as object), ...(value as object) }
  }
  return out as unknown as SiteSettings
}

/**
 * Loads everything the public site needs in one round of parallel queries.
 * RLS guarantees that only published / visible rows come back for visitors.
 */
export async function fetchSiteContent(): Promise<{ content: SiteContent; source: 'supabase' | 'seed' }> {
  if (!isSupabaseConfigured || !supabase) return { content: seedContent, source: 'seed' }

  const [profile, settings, projects, categories, technologies, experiences, achievements, education, socials] =
    await Promise.all([
      supabase.from('profiles').select('*').order('created_at').limit(1).maybeSingle(),
      supabase.from('site_settings').select('key, value'),
      supabase.from('projects').select(PROJECT_SELECT).eq('visibility', 'published').order('sort_order'),
      supabase.from('project_categories').select('*').order('sort_order'),
      supabase.from('technologies').select('*').order('sort_order'),
      supabase.from('experiences').select('*').eq('visible', true).order('sort_order'),
      supabase.from('achievements').select('*').eq('visible', true).order('sort_order'),
      supabase.from('education').select('*').order('sort_order'),
      supabase.from('social_links').select('*').eq('visible', true).order('sort_order'),
    ])

  const failed = [profile, settings, projects, categories, technologies, experiences, achievements, education, socials].find(
    (r) => r.error,
  )
  if (failed?.error) throw new Error(failed.error.message)

  return {
    source: 'supabase',
    content: {
      profile: profile.data ?? seedContent.profile,
      settings: mergeSettings(settings.data ?? []),
      projects: (projects.data ?? []).map(mapProject),
      categories: categories.data ?? [],
      technologies: technologies.data ?? [],
      experiences: experiences.data ?? [],
      achievements: achievements.data ?? [],
      education: education.data ?? [],
      socials: socials.data ?? [],
    },
  }
}
