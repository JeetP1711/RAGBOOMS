import { motion } from 'framer-motion'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { usePortfolio } from '@/app/ContentProvider'
import { ContactForm } from '@/components/contact/ContactForm'
import { Logo } from '@/components/layout/Logo'
import { ProjectCard } from '@/components/projects/ProjectCard'
import {
  AchievementList,
  GithubUnavailable,
  LanguageBar,
  RepoCard,
  SkillGroups,
  Timeline,
  useGithub,
} from '@/components/sections'
import { Button, Counter, GithubIcon, Reveal, SectionHeading, TextLink } from '@/components/ui'
import { useSeo } from '@/hooks/useSeo'
import { SITE_URL } from '@/services/supabase'
import { paragraphs } from '@/utils'

export default function Home() {
  const p = usePortfolio()
  const { profile, settings } = p
  const github = useGithub()

  useSeo({
    description: settings.general.description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: settings.general.title,
          url: SITE_URL,
          founder: { '@type': 'Person', name: profile.full_name },
        },
        {
          '@type': 'Person',
          name: profile.full_name,
          jobTitle: profile.headline,
          url: SITE_URL,
          address: profile.location,
          sameAs: p.socials.filter((s) => s.url).map((s) => s.url),
        },
      ],
    },
  })

  // Every number below is counted from stored content or the GitHub API — nothing is typed in.
  const stats = [
    { label: 'Projects', value: p.main.length },
    { label: 'Experiments', value: p.labs.length },
    { label: 'Technologies', value: p.technologies.filter((t) => t.visible).length },
    ...(github.data ? [{ label: 'Public repos', value: github.data.profile.public_repos }] : []),
  ]
  const featured = p.featured.length ? p.featured : p.main.slice(0, 4)
  const [lead, ...restFeatured] = featured

  return (
    <>
      {/* ------------------------------------------------------------ Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="glow pointer-events-none absolute -left-40 -top-40 size-[640px] animate-drift opacity-70" aria-hidden />
        <div className="glow pointer-events-none absolute -bottom-72 right-[-10%] size-[560px] animate-drift opacity-40 [animation-delay:-9s]" aria-hidden />

        <div className="wrap relative grid min-h-[92dvh] items-center gap-14 pb-20 pt-32 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.09 } } }}
          >
            {[
              <p key="e" className="eyebrow flex items-center gap-3">
                <span className="size-1.5 animate-pulse-dot rounded-full bg-hi" />
                {profile.hero_eyebrow}
              </p>,
              <h1 key="h" className="mt-6 text-[clamp(2.6rem,7vw,5rem)] font-semibold leading-[1.02]">
                {profile.hero_headline}
              </h1>,
              <p key="s" className="mt-7 max-w-xl text-lg text-mute">
                {profile.hero_subtext}
              </p>,
              <div key="b" className="mt-10 flex flex-wrap gap-3">
                <Button to="/projects" size="lg">
                  Explore My Work <ArrowRight className="size-4" />
                </Button>
                <Button to="/contact" size="lg" variant="secondary">
                  Let's Connect
                </Button>
              </div>,
            ].map((el) => (
              <motion.div
                key={el.key}
                variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {el}
              </motion.div>
            ))}
          </motion.div>

          {/* Brand plate: the logo, with live counts from the CMS. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="card relative overflow-hidden bg-card/70 backdrop-blur"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-dim">
              <span>ragbooms / studio</span>
              <span className="flex items-center gap-2 text-hi">
                <span className="size-1.5 animate-pulse-dot rounded-full bg-hi" /> building
              </span>
            </div>
            <div className="relative grid place-items-center px-6 py-14 sm:py-20">
              <div className="glow absolute inset-10 opacity-50" aria-hidden />
              <Logo width={340} className="relative max-w-full" />
              <p className="relative mt-6 text-center font-display text-lg text-mute">
                {profile.taglines[0] ?? settings.footer.statement}
              </p>
            </div>
            <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
              {stats.map((s, i) => (
                <div key={s.label} className={`px-5 py-4 ${i > 0 ? 'border-l border-line' : ''} ${i >= 2 ? 'border-t border-line sm:border-t-0' : ''} ${i === 2 ? 'border-l-0 sm:border-l' : ''}`}>
                  <dd className="font-display text-3xl font-semibold">
                    <Counter value={s.value} />
                  </dd>
                  <dt className="mt-1 font-mono text-[10px] uppercase tracking-widest text-dim">{s.label}</dt>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
        <a
          href="#work"
          aria-label="Scroll to featured work"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-dim transition-colors hover:text-hi lg:block"
        >
          <ArrowDown className="size-5 animate-bounce" />
        </a>
      </section>

      {/* ------------------------------------------------------- Featured */}
      <section id="work" className="wrap scroll-mt-20 py-24 md:py-32">
        <SectionHeading
          eyebrow="Selected work"
          title="Products and platforms in progress."
          lead="A few things I'm building under the RAGBOOMS name. Each one starts from a real problem."
          action={<TextLink to="/projects">All projects</TextLink>}
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lead && (
            <Reveal className="md:col-span-2 lg:col-span-3">
              <ProjectCard project={lead} wide />
            </Reveal>
          )}
          {restFeatured.map((project, i) => (
            <Reveal key={project.id} delay={i * 0.06}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- About */}
      <section className="border-y border-line bg-bg2">
        <div className="wrap grid gap-12 py-24 md:py-32 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow mb-6">Approach</p>
            <blockquote className="font-display text-3xl font-medium leading-tight md:text-[2.6rem]">
              {(profile.philosophy.split('. ')[0] || 'Start from the problem, not the stack').replace(/\.$/, '')}
              <span className="text-hi">.</span>
            </blockquote>
          </Reveal>
          <Reveal delay={0.1} className="space-y-5 text-mute md:text-lg">
            <p className="text-ink">{profile.intro}</p>
            {paragraphs(profile.bio)
              .slice(0, 1)
              .map((t) => (
                <p key={t}>{t}</p>
              ))}
            <TextLink to="/about">More about {profile.full_name.split(' ')[0]}</TextLink>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------------------------------------- Stack */}
      <section className="wrap py-24 md:py-32">
        <SectionHeading
          eyebrow="Toolbox"
          title="Technologies I work with."
          lead="Grouped by where they fit. Depth varies — the About page shows how well I know each one."
          action={<TextLink to="/about">Skills in detail</TextLink>}
        />
        <SkillGroups technologies={p.technologies} />
      </section>

      {/* ------------------------------------------------------ Experience */}
      {p.experiences.length > 0 && (
        <section className="border-y border-line bg-bg2">
          <div className="wrap grid gap-12 py-24 md:py-32 lg:grid-cols-[1fr_1.6fr]">
            <SectionHeading
              eyebrow="Experience"
              title="Where the work happens."
              action={<TextLink to="/experience">Full timeline</TextLink>}
            />
            <Timeline items={p.experiences.slice(0, 3)} />
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- GitHub */}
      <section className="wrap py-24 md:py-32">
        <SectionHeading
          eyebrow="Open source"
          title="Straight from GitHub."
          lead="Live data from my public profile."
          action={<TextLink to="/github">All repositories</TextLink>}
        />
        {github.data ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <Reveal className="card flex flex-col p-6">
              <div className="flex items-center gap-4">
                <img src={github.data.profile.avatar_url} alt="" className="size-14 rounded-full border border-line" />
                <div>
                  <p className="font-display text-lg font-medium">{github.data.profile.name ?? github.data.profile.login}</p>
                  <a href={github.data.profile.html_url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5 font-mono text-xs">
                    <GithubIcon className="size-3.5" />@{github.data.profile.login}
                  </a>
                </div>
              </div>
              <dl className="my-6 grid grid-cols-2 gap-4 border-y border-line py-5">
                <div>
                  <dd className="font-display text-2xl font-semibold">{github.data.profile.public_repos}</dd>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-dim">Public repos</dt>
                </div>
                <div>
                  <dd className="font-display text-2xl font-semibold">{github.data.profile.followers}</dd>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-dim">Followers</dt>
                </div>
              </dl>
              <LanguageBar data={github.data} />
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2">
              {github.data.repos
                .filter((r) => !r.fork)
                // Repositories that explain themselves first, then most recently pushed.
                .sort((a, b) => Number(!!b.description) - Number(!!a.description))
                .slice(0, 4)
                .map((r, i) => (
                  <Reveal key={r.id} delay={i * 0.05}>
                    <RepoCard repo={r} />
                  </Reveal>
                ))}
            </div>
          </div>
        ) : (
          <GithubUnavailable error={github.error} loading={github.loading} />
        )}
      </section>

      {/* ---------------------------------------------------- Achievements */}
      {p.achievements.length > 0 && (
        <section className="border-y border-line bg-bg2">
          <div className="wrap py-24 md:py-32">
            <SectionHeading
              eyebrow="Recognition"
              title="Hackathons and leadership."
              action={<TextLink to="/achievements">All achievements</TextLink>}
            />
            <AchievementList items={(p.achievements.some((a) => a.featured) ? p.achievements.filter((a) => a.featured) : p.achievements).slice(0, 4)} />
          </div>
        </section>
      )}

      {/* --------------------------------------------------------- Contact */}
      <section className="wrap grid gap-12 py-24 md:py-32 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <p className="eyebrow mb-5">Contact</p>
          <h2 className="text-4xl font-semibold md:text-5xl">Have an idea worth building?</h2>
          <p className="mt-5 max-w-md text-lg text-mute">
            Freelance work, product collaborations or a technical conversation — tell me what you're thinking about.
          </p>
          {p.email && (
            <a href={`mailto:${p.email}`} className="link mt-6 inline-block font-mono text-sm">
              {p.email}
            </a>
          )}
        </Reveal>
        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </section>
    </>
  )
}
