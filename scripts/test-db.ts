/**
 * Runs the migration and seed against an in-memory Postgres (PGlite) with a
 * minimal stand-in for Supabase's auth/storage schemas, then checks that the
 * Row Level Security policies behave as intended.
 *   npm run test:db
 */
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite()
let failed = 0
const check = (name: string, ok: boolean, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}
const count = async (sql: string) => Number((await db.query<{ n: number }>(sql)).rows[0].n)
const fails = async (sql: string) => {
  try {
    const r = await db.query(sql)
    return (r.affectedRows ?? 0) === 0 // RLS silently filters updates/deletes
  } catch {
    return true
  }
}
const as = async (role: 'anon' | 'authenticated', uid = '') => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role ${role};`)
}

// --- Supabase stand-ins -----------------------------------------------------
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant all on storage.objects to anon, authenticated;
`)

const migration = fs.readFileSync('supabase/migrations/0001_init.sql', 'utf8')
await db.exec(migration)
check('migration applies', true)
await db.exec(migration)
check('migration is re-runnable', true)

const seed = fs.readFileSync('supabase/seed.sql', 'utf8')
await db.exec(seed)
await db.exec(seed)
check('seed applies and is re-runnable', true)

const ADMIN = '11111111-1111-4111-8111-111111111111'
const USER = '22222222-2222-4222-8222-222222222222'
await db.exec(`
  insert into auth.users values ('${ADMIN}', 'admin@example.com'), ('${USER}', 'user@example.com');
  insert into public.admin_users (user_id) values ('${ADMIN}');
  update public.projects set visibility = 'draft' where slug = 'nivaas';
  insert into public.contact_submissions (name, email, message) values ('A', 'a@example.com', 'hello');
`)
const total = await count('select count(*) n from public.projects')

// --- anonymous visitor -------------------------------------------------------
await as('anon')
check('anon sees only published projects', (await count('select count(*) n from public.projects')) === total - 1)
check('anon cannot see draft project', (await count(`select count(*) n from public.projects where slug='nivaas'`)) === 0)
check(
  'anon cannot see draft project technologies/categories',
  (await count(
    `select count(*) n from public.project_category_map m where m.project_id = (select id from public.projects where slug='nivaas')`,
  )) === 0,
)
check('anon can read profile and settings', (await count('select count(*) n from public.profiles')) === 1 && (await count('select count(*) n from public.site_settings')) > 0)
check('anon cannot read contact submissions', await fails('select * from public.contact_submissions'))
check('anon cannot insert contact submissions directly', await fails(`insert into public.contact_submissions (name,email,message) values ('x','x@x.co','x')`))
check('anon cannot read admin_users', await fails('select * from public.admin_users'))
check('anon cannot insert a project', await fails(`insert into public.projects (slug,title) values ('x','x')`))
check('anon cannot update a project', await fails(`update public.projects set title='hacked'`))
check('anon cannot delete a project', await fails(`delete from public.projects`))
check('anon cannot change settings', await fails(`update public.site_settings set value='{}'`))
check('anon cannot upload to storage', await fails(`insert into storage.objects (bucket_id,name) values ('media','x.png')`))

// --- signed-in, but not an admin --------------------------------------------
await as('authenticated', USER)
check('non-admin sees only published projects', (await count('select count(*) n from public.projects')) === total - 1)
check('non-admin cannot insert a project', await fails(`insert into public.projects (slug,title) values ('x','x')`))
check('non-admin cannot update a project', await fails(`update public.projects set title='hacked'`))
check('non-admin cannot read contact submissions', (await count('select count(*) n from public.contact_submissions')) === 0)
check('non-admin cannot make themselves admin', await fails(`insert into public.admin_users (user_id) values ('${USER}')`))
check('non-admin cannot upload to storage', await fails(`insert into storage.objects (bucket_id,name) values ('media','x.png')`))

// --- admin --------------------------------------------------------------------
await as('authenticated', ADMIN)
check('admin sees drafts', (await count('select count(*) n from public.projects')) === total)
check('admin can insert a project', !(await fails(`insert into public.projects (slug,title) values ('new-one','New one')`)))
check('admin can update a project', !(await fails(`update public.projects set title='Renamed' where slug='new-one'`)))
check('admin can delete a project', !(await fails(`delete from public.projects where slug='new-one'`)))
check('admin can read contact submissions', (await count('select count(*) n from public.contact_submissions')) === 1)
check('admin can update settings', !(await fails(`update public.site_settings set value = value where key='general'`)))
check('admin can upload to storage', !(await fails(`insert into storage.objects (bucket_id,name) values ('media','x.png')`)))
check('duplicate slugs are rejected', await fails(`insert into public.projects (slug,title) values ('vyavastha','dupe')`))

await db.exec('reset role')
console.log(failed ? `\n${failed} check(s) failed` : '\nAll database checks passed')
process.exit(failed ? 1 : 0)
