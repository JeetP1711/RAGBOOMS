export const PROJECT_STATUSES = [
  'Live',
  'Completed',
  'In Development',
  'Prototype',
  'Research',
  'Concept',
  'Archived',
] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PROFICIENCIES = ['Familiar', 'Working Knowledge', 'Experienced', 'Advanced'] as const
export type Proficiency = (typeof PROFICIENCIES)[number]

export const ACHIEVEMENT_KINDS = [
  'Hackathon',
  'Award',
  'Leadership',
  'Certificate',
  'Competition',
  'Milestone',
] as const
export type AchievementKind = (typeof ACHIEVEMENT_KINDS)[number]

export const CONTACT_STATUSES = ['new', 'read', 'replied', 'archived'] as const
export type ContactStatus = (typeof CONTACT_STATUSES)[number]

export const INQUIRY_TYPES = [
  'Freelance work',
  'Software development',
  'Product collaboration',
  'Technical discussion',
  'Other',
] as const

export interface GalleryItem {
  url: string
  caption?: string
}
export interface ChangelogEntry {
  date: string
  version?: string
  title: string
  notes?: string
}
export interface GithubMeta {
  full_name?: string
  language?: string | null
  stars?: number
  forks?: number
  topics?: string[]
  pushed_at?: string
  default_branch?: string
  synced_at?: string
}

export interface Project {
  id: string
  slug: string
  title: string
  short_description: string
  description: string
  problem: string
  solution: string
  features: string[]
  planned_features: string[]
  challenges: string
  architecture: string
  status: ProjectStatus
  visibility: 'draft' | 'published'
  featured: boolean
  is_lab: boolean
  sort_order: number
  cover_url: string | null
  gallery: GalleryItem[]
  video_url: string | null
  github_url: string | null
  live_url: string | null
  docs_url: string | null
  download_url: string | null
  start_date: string | null
  end_date: string | null
  seo_title: string | null
  seo_description: string | null
  github_repo_id: number | null
  github_meta: GithubMeta | null
  changelog: ChangelogEntry[]
  /** category slugs */
  categories: string[]
  /** technology names */
  technologies: string[]
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  sort_order: number
}

export interface Technology {
  id: string
  name: string
  slug: string
  group_name: string | null
  proficiency: Proficiency | null
  visible: boolean
  sort_order: number
}

export interface Experience {
  id: string
  company: string
  role: string
  employment_type: string
  date_label: string
  start_date: string | null
  end_date: string | null
  is_current: boolean
  location: string
  description: string
  responsibilities: string[]
  achievements: string[]
  technologies: string[]
  logo_url: string | null
  website_url: string | null
  visible: boolean
  sort_order: number
}

export interface Achievement {
  id: string
  title: string
  organization: string
  kind: AchievementKind
  date_label: string
  achieved_on: string | null
  description: string
  certificate_url: string | null
  verification_url: string | null
  project_id: string | null
  featured: boolean
  visible: boolean
  sort_order: number
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  date_label: string
  description: string
  sort_order: number
}

export interface SocialLink {
  id: string
  platform: string
  label: string
  url: string
  visible: boolean
  sort_order: number
}

export interface Profile {
  id: string
  full_name: string
  headline: string
  intro: string
  bio: string
  journey: string
  what_i_build: string
  philosophy: string
  interests: string[]
  location: string
  avatar_url: string | null
  email: string
  resume_url: string | null
  hero_eyebrow: string
  hero_headline: string
  hero_subtext: string
  taglines: string[]
}

export interface NavItem {
  label: string
  path: string
}

export interface SiteSettings {
  general: {
    title: string
    description: string
    logo_url: string
    favicon_url: string
    og_image_url: string
    contact_email: string
  }
  colors: { brand: string; accent: string; highlight: string }
  navigation: NavItem[]
  footer: { statement: string; cta_label: string }
  announcement: { enabled: boolean; text: string; link: string }
  maintenance: { enabled: boolean; message: string }
}

export interface MediaAsset {
  id: string
  name: string
  path: string
  url: string
  mime_type: string
  size: number
  created_at: string
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  inquiry_type: string
  message: string
  status: ContactStatus
  created_at: string
}

export interface GithubSyncLog {
  id: string
  action: string
  status: string
  repo_count: number
  details: Record<string, unknown> | null
  created_at: string
}

export interface SiteContent {
  profile: Profile
  settings: SiteSettings
  projects: Project[]
  categories: Category[]
  technologies: Technology[]
  experiences: Experience[]
  achievements: Achievement[]
  education: Education[]
  socials: SocialLink[]
}

export interface GithubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stars: number
  forks: number
  topics: string[]
  default_branch: string
  pushed_at: string
  updated_at: string
  fork: boolean
  archived: boolean
}
export interface GithubEvent {
  id: string
  type: string
  repo: string
  created_at: string
  summary: string
}
export interface GithubData {
  profile: {
    login: string
    name: string | null
    avatar_url: string
    html_url: string
    bio: string | null
    public_repos: number
    followers: number
    following: number
  }
  repos: GithubRepo[]
  events: GithubEvent[]
  fetched_at: string
}
