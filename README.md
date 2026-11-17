# RAGBOOMS

Personal brand + technology studio website for Jeet Patel, with a dynamic project portfolio and a private admin CMS.

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide
- **Backend:** Supabase (Postgres, Auth, Storage, Row Level Security)
- **Server functions:** Vercel functions in `/api` (contact form, GitHub proxy, sitemap)
- **Hosting:** Vercel

---

## 1. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

Without any configuration the public site runs in **preview mode**: it renders the starter content bundled in
`src/data/seed.ts`, the GitHub sections load live from the GitHub API, the contact form reports that it is not
connected, and `/admin` shows setup instructions. Nothing is faked — connect Supabase (below) to make everything
editable.

## 2. Add the logo

Save the official RAGBOOMS logo as:

```
public/brand/logo.png
```

Use a PNG with a **transparent background** (the site is dark). The header, footer, hero, loading screen and admin
login all read this file. Until it exists a plain text wordmark is shown as a stand-in. Later you can swap the logo
and favicon from **Admin → Settings** without touching code.

`public/brand/favicon.svg` is a temporary mark in the brand green — replace it with one cut from the real logo.

## 3. Set up Supabase

1. Create a project at https://supabase.com.
2. **SQL Editor → New query**: paste and run `supabase/migrations/0001_init.sql`.
   This creates every table, the indexes, the Row Level Security policies and the public `media` storage bucket.
3. Run `supabase/seed.sql` the same way. This loads the starter content (profile, projects, skills, experience,
   achievements). It is safe to re-run: existing rows are never overwritten.
4. **Project Settings → API**: copy the Project URL, the `anon` key and the `service_role` key.
5. Copy `.env.example` to `.env` and fill it in:

   | Variable | Where it is used | Notes |
   |---|---|---|
   | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Browser | Public by design; RLS protects the data |
   | `VITE_SITE_URL`, `SITE_URL` | Canonical URLs, sitemap | Your production domain, no trailing slash |
   | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `/api/contact` only | **Server only. Never prefix with `VITE_`.** |
   | `GITHUB_USERNAME` | `/api/github` | Defaults to `JeetP1711` |
   | `GITHUB_TOKEN` | `/api/github` | Optional; raises the rate limit from 60 to 5000 requests/hour |
   | `CONTACT_IP_SALT` | `/api/contact` | Any long random string |
   | `RESEND_API_KEY`, `CONTACT_NOTIFY_TO`, `CONTACT_NOTIFY_FROM` | `/api/contact` | Optional email notification |

6. Restart `npm run dev`.

## 4. Create the admin account

There is no public sign-up and no password in the code. You create one user and authorise it in the database.

1. Supabase → **Authentication → Users → Add user**. Enter your email and a strong password, tick *Auto confirm*.
2. Supabase → **Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up".
3. SQL Editor — make that user an administrator (use your own email):

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

4. Go to `/admin/login` and sign in.

Signing in is not enough on its own: every write is checked in the database against `admin_users`, so a signed-in
user who is not in that table can read only what the public can read. To reset your password, use
Authentication → Users in the Supabase dashboard.

## 5. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Vercel → **Add New → Project** → import the repository. The framework is detected as Vite; `vercel.json`
   already sets the build command, output folder, SPA rewrites and security headers.
3. **Settings → Environment Variables**: add every variable from your `.env` (Production and Preview).
4. Deploy, then:
   - set `VITE_SITE_URL` and `SITE_URL` to the final domain and redeploy,
   - update the `Sitemap:` line in `public/robots.txt`,
   - in Supabase → Authentication → URL Configuration, set the Site URL to your domain.
5. Optional: enable **Web Analytics** on the Vercel project for visitor numbers (the admin dashboard does not
   show analytics until a provider is wired in).

## 6. Managing the site (no code)

Everything is at `/admin` (there is a discreet "Admin" link in the footer).

| Section | What you can do |
|---|---|
| **Dashboard** | Live counts, a content-status checklist, recent updates, recent messages |
| **Projects** | Create, edit, duplicate, publish/unpublish, feature, archive, delete, reorder |
| **Experience / Skills / Achievements** | Add, edit, delete, reorder, show/hide |
| **Profile & About** | Name, headline, hero text, taglines, biography, education, social links, résumé |
| **Media** | Upload images/PDFs, rename, copy URL, see where a file is used, delete |
| **Messages** | Contact form inbox: read, mark replied, archive, delete |
| **GitHub** | Browse public repositories, import them as drafts, sync stats |
| **Settings** | Title, logo, favicon, colours, navigation, footer, SEO, banner, maintenance mode, categories |

### Adding a project

1. **Projects → New project**. Fill in the title, short description and status. Choose the shelf:
   **Projects** (main portfolio) or **Labs** (experiments).
2. Add categories, technologies, a cover image and gallery screenshots (uploaded once to Media, reusable anywhere).
3. Write the Overview / Problem / Solution. List only what is built under **Features**; put the rest under
   **Planned features** — the project page labels those "not built yet".
4. **Save draft** keeps it private. **Publish** makes it live at `/projects/<slug>`.
5. Tick **Featured on homepage** to show it in the homepage selection.

### Importing from GitHub

**GitHub** → tick repositories → **Import as drafts**. Each becomes a draft in Labs with its name, description,
URL, main language and stats filled in. Nothing is published automatically — open the draft, add the story and a
cover, then publish. **Sync linked projects** refreshes stars, forks, language and last-commit date; it never
touches text you wrote. Only GitHub's public endpoints are called, so private repositories cannot appear.

### Statuses

`Live` · `Completed` · `In Development` · `Prototype` · `Research` · `Concept` · `Archived`

## 7. Project structure

```
api/                    Vercel functions: contact.ts, github.ts, sitemap.ts
public/brand/           logo.png (add yours), favicon.svg
scripts/                generate-seed.ts, test-db.ts
supabase/
  migrations/0001_init.sql   schema + RLS + storage
  seed.sql                   generated starter content
src/
  app/                  App routes, ContentProvider (loads all public content)
  components/           layout/, projects/, contact/, ui/, sections.tsx
  pages/                Home, About, Projects, ProjectDetail, Experience, Labs, Achievements, GitHub, Contact
  admin/                auth, layout, ResourceManager, dashboard/, projects/, media/, github/, settings/
  services/             supabase client, content (public reads), admin (writes), github
  data/seed.ts          single source of the starter content
  hooks/ types/ utils/ styles/
```

## 8. Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server. Also serves `/api/*` locally through a small Vite plugin |
| `npm run build` | Type-check and build to `dist/` |
| `npm run seed:sql` | Regenerate `supabase/seed.sql` from `src/data/seed.ts` |
| `npm run test:db` | Apply the migration + seed to an in-memory Postgres and verify the RLS policies |

## 9. Security model

- **Public visitors** can read only published projects and visible experience / achievements / links.
- **Administrators** (rows in `admin_users`) can create, update and delete content and upload media.
- **Contact submissions** are written only by `/api/contact` using the service-role key, and are readable only by
  administrators. The endpoint has a honeypot, a minimum fill time, validation, a link limit and per-IP and global
  hourly rate limits.
- The **service-role key** and **GitHub token** exist only in server environment variables.
- `npm run test:db` checks these rules (anonymous, signed-in non-admin, admin).

## 10. Known limits

- This is a client-rendered single-page app. Titles, descriptions, canonical URLs, Open Graph tags and JSON-LD
  are set per page in the browser, which Google handles; social-network link previews (which do not run
  JavaScript) show the default tags from `index.html`.
- Not built yet: blog / engineering journal, newsletter, light mode, analytics display.
