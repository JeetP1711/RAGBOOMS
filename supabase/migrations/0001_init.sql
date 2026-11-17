-- RAGBOOMS — database schema, Row Level Security and storage.
-- Run once in the Supabase SQL editor (or `supabase db push`). Safe to re-run.

-- ---------------------------------------------------------------- helpers

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Administrators. Rows are added manually from the SQL editor (see README);
-- nothing in the API can write to this table.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ----------------------------------------------------------------- tables

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '',
  headline text not null default '',
  intro text not null default '',
  bio text not null default '',
  journey text not null default '',
  what_i_build text not null default '',
  philosophy text not null default '',
  interests text[] not null default '{}',
  location text not null default '',
  avatar_url text,
  email text not null default '',
  resume_url text,
  hero_eyebrow text not null default '',
  hero_headline text not null default '',
  hero_subtext text not null default '',
  taglines text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.technologies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  group_name text,
  proficiency text check (proficiency in ('Familiar', 'Working Knowledge', 'Experienced', 'Advanced')),
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text not null default '',
  description text not null default '',
  problem text not null default '',
  solution text not null default '',
  features text[] not null default '{}',
  planned_features text[] not null default '{}',
  challenges text not null default '',
  architecture text not null default '',
  status text not null default 'Concept'
    check (status in ('Live', 'Completed', 'In Development', 'Prototype', 'Research', 'Concept', 'Archived')),
  visibility text not null default 'draft' check (visibility in ('draft', 'published')),
  featured boolean not null default false,
  is_lab boolean not null default false,
  sort_order int not null default 0,
  cover_url text,
  gallery jsonb not null default '[]',
  video_url text,
  github_url text,
  live_url text,
  docs_url text,
  download_url text,
  start_date date,
  end_date date,
  seo_title text,
  seo_description text,
  github_repo_id bigint unique,
  github_meta jsonb,
  changelog jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_public_idx on public.projects (visibility, is_lab, sort_order);
create index if not exists projects_featured_idx on public.projects (featured) where featured;

create table if not exists public.project_category_map (
  project_id uuid not null references public.projects (id) on delete cascade,
  category_id uuid not null references public.project_categories (id) on delete cascade,
  primary key (project_id, category_id)
);
create index if not exists project_category_map_category_idx on public.project_category_map (category_id);

create table if not exists public.project_technologies (
  project_id uuid not null references public.projects (id) on delete cascade,
  technology_id uuid not null references public.technologies (id) on delete cascade,
  primary key (project_id, technology_id)
);
create index if not exists project_technologies_technology_idx on public.project_technologies (technology_id);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  role text not null default '',
  employment_type text not null default '',
  date_label text not null default '',
  start_date date,
  end_date date,
  is_current boolean not null default false,
  location text not null default '',
  description text not null default '',
  responsibilities text[] not null default '{}',
  achievements text[] not null default '{}',
  technologies text[] not null default '{}',
  logo_url text,
  website_url text,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text not null default '',
  kind text not null default 'Milestone'
    check (kind in ('Hackathon', 'Award', 'Leadership', 'Certificate', 'Competition', 'Milestone')),
  date_label text not null default '',
  achieved_on date,
  description text not null default '',
  certificate_url text,
  verification_url text,
  project_id uuid references public.projects (id) on delete set null,
  featured boolean not null default false,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  institution text not null,
  degree text not null default '',
  field text not null default '',
  date_label text not null default '',
  description text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  label text not null default '',
  url text not null default '',
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path text not null unique,
  url text not null,
  mime_type text not null default '',
  size bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  inquiry_type text not null default '',
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists contact_submissions_created_idx on public.contact_submissions (created_at desc);
create index if not exists contact_submissions_ip_idx on public.contact_submissions (ip_hash, created_at desc);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.github_sync_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  status text not null default 'success',
  repo_count int not null default 0,
  details jsonb,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------- triggers

do $$
declare t text;
begin
  foreach t in array array['profiles', 'technologies', 'projects', 'experiences', 'achievements',
                           'education', 'social_links', 'site_settings']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ----------------------------------------------------------------- grants
-- RLS below is what actually protects the data; these grants only make the
-- tables reachable through the Data API.

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on
  public.profiles, public.project_categories, public.technologies, public.projects,
  public.project_category_map, public.project_technologies, public.experiences,
  public.achievements, public.education, public.social_links, public.site_settings
  to anon;
revoke insert, update, delete on public.admin_users from authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------- row level security

alter table public.admin_users enable row level security;
alter table public.profiles enable row level security;
alter table public.project_categories enable row level security;
alter table public.technologies enable row level security;
alter table public.projects enable row level security;
alter table public.project_category_map enable row level security;
alter table public.project_technologies enable row level security;
alter table public.experiences enable row level security;
alter table public.achievements enable row level security;
alter table public.education enable row level security;
alter table public.social_links enable row level security;
alter table public.media_assets enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.site_settings enable row level security;
alter table public.github_sync_logs enable row level security;

-- Drop-and-recreate keeps this file re-runnable.
do $$
declare p record;
begin
  for p in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- A signed-in user may only see their own admin row.
create policy "admin_users: read own" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- Public, always-readable reference content.
create policy "profiles: public read" on public.profiles for select using (true);
create policy "project_categories: public read" on public.project_categories for select using (true);
create policy "technologies: public read" on public.technologies for select using (true);
create policy "education: public read" on public.education for select using (true);
create policy "site_settings: public read" on public.site_settings for select using (true);

-- Content with a visibility switch.
create policy "projects: public read published" on public.projects
  for select using (visibility = 'published' or public.is_admin());
create policy "project_category_map: public read published" on public.project_category_map
  for select using (
    public.is_admin() or exists (
      select 1 from public.projects p where p.id = project_id and p.visibility = 'published'));
create policy "project_technologies: public read published" on public.project_technologies
  for select using (
    public.is_admin() or exists (
      select 1 from public.projects p where p.id = project_id and p.visibility = 'published'));
create policy "experiences: public read visible" on public.experiences
  for select using (visible or public.is_admin());
create policy "achievements: public read visible" on public.achievements
  for select using (visible or public.is_admin());
create policy "social_links: public read visible" on public.social_links
  for select using (visible or public.is_admin());

-- Admin-only reads.
create policy "media_assets: admin read" on public.media_assets
  for select to authenticated using (public.is_admin());
create policy "contact_submissions: admin read" on public.contact_submissions
  for select to authenticated using (public.is_admin());
create policy "github_sync_logs: admin read" on public.github_sync_logs
  for select to authenticated using (public.is_admin());

-- Admin-only writes on everything. Contact submissions are inserted only by
-- the /api/contact server function using the service-role key (bypasses RLS),
-- so there is deliberately no public insert policy.
do $$
declare t text;
begin
  foreach t in array array['profiles', 'project_categories', 'technologies', 'projects',
                           'project_category_map', 'project_technologies', 'experiences',
                           'achievements', 'education', 'social_links', 'media_assets',
                           'contact_submissions', 'site_settings', 'github_sync_logs']
  loop
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_admin())',
      t || ': admin insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || ': admin update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_admin())',
      t || ': admin delete', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- storage
-- One public bucket for portfolio media. Anyone can read; only admins write.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media: public read" on storage.objects;
drop policy if exists "media: admin insert" on storage.objects;
drop policy if exists "media: admin update" on storage.objects;
drop policy if exists "media: admin delete" on storage.objects;

create policy "media: public read" on storage.objects
  for select using (bucket_id = 'media');
create policy "media: admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "media: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
