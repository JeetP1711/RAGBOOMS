/** Field configurations for every table managed through ResourceManager. */
import { ACHIEVEMENT_KINDS, PROFICIENCIES } from '@/types'
import { useMemo } from 'react'
import { useContent } from '@/app/ContentProvider'
import { slugify } from '@/utils'
import { ResourceManager, type ResourceConfig } from './ResourceManager'
import { AdminPage } from './ui'

const s = (v: unknown) => (v === null || v === undefined ? '' : String(v))

export const experienceConfig: ResourceConfig = {
  table: 'experiences',
  noun: 'experience',
  defaults: { company: '', role: '', employment_type: '', date_label: '', is_current: false, location: '', description: '', responsibilities: [], achievements: [], technologies: [], logo_url: null, website_url: null, visible: true },
  primary: (r) => `${s(r.role) || 'Untitled role'} · ${s(r.company)}`,
  secondary: (r) => [s(r.date_label), s(r.employment_type)].filter(Boolean).join(' · ') || 'No dates set',
  fields: [
    { name: 'company', label: 'Company', required: true },
    { name: 'role', label: 'Job title' },
    { name: 'employment_type', label: 'Employment type', placeholder: 'Full-time, Internship, Founder…' },
    { name: 'date_label', label: 'Dates (as shown)', placeholder: 'Jun 2024 – Present', hint: 'Free text, shown exactly as typed.' },
    { name: 'start_date', label: 'Start date', type: 'date' },
    { name: 'end_date', label: 'End date', type: 'date' },
    { name: 'location', label: 'Location' },
    { name: 'website_url', label: 'Company website', type: 'url' },
    { name: 'is_current', label: 'Current role', type: 'toggle', hint: 'Highlights the entry on the timeline.' },
    { name: 'visible', label: 'Visible on site', type: 'toggle' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'responsibilities', label: 'Responsibilities', type: 'list' },
    { name: 'achievements', label: 'Achievements', type: 'list', hint: 'Only real, verifiable outcomes.' },
    { name: 'technologies', label: 'Technologies', type: 'tags' },
    { name: 'logo_url', label: 'Company logo', type: 'image' },
  ],
}

export const skillConfig: ResourceConfig = {
  table: 'technologies',
  noun: 'skill',
  groupBy: 'group_name',
  defaults: { name: '', group_name: '', proficiency: 'Familiar', visible: true },
  primary: (r) => s(r.name),
  secondary: (r) => s(r.proficiency) || 'No proficiency set',
  prepare: (r) => ({ ...r, slug: slugify(s(r.name)), group_name: s(r.group_name).trim() || null }),
  fields: [
    { name: 'name', label: 'Name', required: true },
    { name: 'group_name', label: 'Group', placeholder: 'Frontend, Backend, Mobile…', hint: 'Skills with the same group are shown together.' },
    { name: 'proficiency', label: 'Proficiency', type: 'select', options: PROFICIENCIES },
    { name: 'visible', label: 'Show in the skills list', type: 'toggle', hint: 'Hidden skills can still be used as project technologies.' },
  ],
}

export const achievementConfig: ResourceConfig = {
  table: 'achievements',
  noun: 'achievement',
  defaults: { title: '', organization: '', kind: 'Hackathon', date_label: '', achieved_on: null, description: '', certificate_url: null, verification_url: null, project_id: null, featured: false, visible: true },
  primary: (r) => s(r.title),
  secondary: (r) => [s(r.kind), s(r.organization), s(r.date_label)].filter(Boolean).join(' · '),
  fields: [
    { name: 'title', label: 'Title', required: true, wide: true },
    { name: 'kind', label: 'Type', type: 'select', options: ACHIEVEMENT_KINDS, required: true },
    { name: 'organization', label: 'Organisation' },
    { name: 'date_label', label: 'Date (as shown)', placeholder: 'March 2025' },
    { name: 'achieved_on', label: 'Exact date', type: 'date' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'verification_url', label: 'Verification link', type: 'url', wide: true },
    { name: 'certificate_url', label: 'Certificate image', type: 'image' },
    { name: 'featured', label: 'Feature on homepage', type: 'toggle' },
    { name: 'visible', label: 'Visible on site', type: 'toggle' },
  ],
}

export const educationConfig: ResourceConfig = {
  table: 'education',
  noun: 'education entry',
  defaults: { institution: '', degree: '', field: '', date_label: '', description: '' },
  primary: (r) => `${s(r.degree)}${r.field ? ` — ${s(r.field)}` : ''}`,
  secondary: (r) => [s(r.institution), s(r.date_label)].filter(Boolean).join(' · '),
  fields: [
    { name: 'institution', label: 'Institution', required: true },
    { name: 'degree', label: 'Degree' },
    { name: 'field', label: 'Field / specialisation' },
    { name: 'date_label', label: 'Dates (as shown)' },
    { name: 'description', label: 'Notes', type: 'textarea' },
  ],
}

export const socialConfig: ResourceConfig = {
  table: 'social_links',
  noun: 'link',
  defaults: { platform: 'linkedin', label: '', url: '', visible: true },
  primary: (r) => s(r.label) || s(r.platform),
  secondary: (r) => s(r.url) || 'No URL yet — not shown on the site',
  fields: [
    { name: 'platform', label: 'Platform', type: 'select', options: ['github', 'linkedin', 'x', 'instagram', 'youtube', 'website', 'other'], required: true, hint: 'GitHub and LinkedIn are used in the header, footer and contact page.' },
    { name: 'label', label: 'Label' },
    { name: 'url', label: 'URL', type: 'url', wide: true },
    { name: 'visible', label: 'Visible on site', type: 'toggle' },
  ],
}

export const categoryConfig: ResourceConfig = {
  table: 'project_categories',
  noun: 'category',
  defaults: { name: '' },
  primary: (r) => s(r.name),
  secondary: (r) => `/${s(r.slug)}`,
  prepare: (r) => ({ ...r, slug: s(r.slug) || slugify(s(r.name)) }),
  fields: [{ name: 'name', label: 'Name', required: true, wide: true }],
}

export const ExperienceAdmin = () => (
  <AdminPage title="Experience" description="Jobs, internships and your own ventures. Shown as a timeline on the Experience page.">
    <ResourceManager config={experienceConfig} />
  </AdminPage>
)
export const SkillsAdmin = () => (
  <AdminPage title="Skills" description="Technologies grouped by area, each with an honest proficiency label. Order here is the order on the site.">
    <ResourceManager config={skillConfig} />
  </AdminPage>
)
export function AchievementsAdmin() {
  const { projects } = useContent().content
  const config = useMemo<ResourceConfig>(
    () => ({
      ...achievementConfig,
      fields: [
        ...achievementConfig.fields,
        {
          name: 'project_id',
          label: 'Related project',
          type: 'select',
          wide: true,
          choices: projects.map((p) => ({ value: p.id, label: p.title })),
          hint: 'Optional. Links the achievement to a published project.',
        },
      ],
    }),
    [projects],
  )
  return (
    <AdminPage title="Achievements" description="Hackathons, awards, certificates and leadership roles.">
      <ResourceManager config={config} />
    </AdminPage>
  )
}
