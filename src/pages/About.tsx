import { FileDown, MapPin } from 'lucide-react'
import { usePortfolio } from '@/app/ContentProvider'
import { ProjectRow } from '@/components/projects/ProjectCard'
import { SkillGroups, Timeline } from '@/components/sections'
import { Button, PageHeader, Reveal, SectionHeading, TextLink } from '@/components/ui'
import { useSeo } from '@/hooks/useSeo'
import { paragraphs } from '@/utils'

export default function About() {
  const p = usePortfolio()
  const { profile } = p
  useSeo({ title: 'About', description: profile.intro })
  const current = p.experiences.filter((e) => e.is_current)

  const Block = ({ title, text }: { title: string; text: string }) =>
    text ? (
      <Reveal className="grid gap-4 border-t border-line py-10 md:grid-cols-[15rem_1fr] md:gap-8">
        <h2 className="font-display text-xl font-medium">{title}</h2>
        <div className="max-w-2xl space-y-4 text-mute md:text-lg">
          {paragraphs(text).map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
      </Reveal>
    ) : null

  return (
    <>
      <PageHeader eyebrow="About" title={profile.headline} lead={profile.intro} />

      <section className="wrap grid gap-12 py-16 md:py-24 lg:grid-cols-[1fr_20rem]">
        <div>
          <Block title="Introduction" text={profile.bio} />
          <Block title="How I got here" text={profile.journey} />
          <Block title="What I build" text={profile.what_i_build} />
          <Block title="How I work" text={profile.philosophy} />
          {profile.interests.length > 0 && (
            <Reveal className="grid gap-4 border-y border-line py-10 md:grid-cols-[15rem_1fr] md:gap-8">
              <h2 className="font-display text-xl font-medium">Areas of interest</h2>
              <ul className="flex max-w-2xl flex-wrap gap-2">
                {profile.interests.map((i) => (
                  <li key={i} className="rounded-full border border-line px-3.5 py-1.5 text-sm text-ink/90">
                    {i}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            {profile.avatar_url && <img src={profile.avatar_url} alt={profile.full_name} className="aspect-square w-full object-cover" />}
            <div className="p-5">
              <p className="font-display text-xl font-semibold">{profile.full_name}</p>
              {profile.location && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-mute">
                  <MapPin className="size-3.5" /> {profile.location}
                </p>
              )}
              <div className="mt-5 flex flex-col gap-2">
                <Button to="/contact">Get in touch</Button>
                {profile.resume_url && (
                  <Button href={profile.resume_url} variant="secondary">
                    <FileDown className="size-4" /> Résumé
                  </Button>
                )}
              </div>
            </div>
          </div>
          {p.education.map((e) => (
            <div key={e.id} className="card p-5">
              <p className="eyebrow mb-3 !text-dim">Education</p>
              <p className="font-display font-medium">{e.degree}</p>
              {e.field && <p className="text-sm text-ink/90">{e.field}</p>}
              <p className="mt-2 text-sm text-mute">{e.institution}</p>
              {e.date_label && <p className="mt-1 font-mono text-xs text-dim">{e.date_label}</p>}
              {e.description && <p className="mt-3 text-sm text-mute">{e.description}</p>}
            </div>
          ))}
        </aside>
      </section>

      <section className="border-y border-line bg-bg2">
        <div className="wrap py-20 md:py-28">
          <SectionHeading
            eyebrow="Skills"
            title="What I work with, and how well."
            lead="Labels are deliberately conservative: Familiar means I have used it, Working Knowledge means I can build with it unaided."
          />
          <SkillGroups technologies={p.technologies} showLevel />
        </div>
      </section>

      {current.length > 0 && (
        <section className="wrap py-20 md:py-28">
          <SectionHeading eyebrow="Now" title="What I'm doing currently." action={<TextLink to="/experience">Full experience</TextLink>} />
          <Timeline items={current} />
        </section>
      )}

      <section className="wrap pb-10">
        <SectionHeading eyebrow="Work" title="Projects." action={<TextLink to="/projects">Browse all</TextLink>} />
        <div className="border-t border-line">
          {p.main.slice(0, 6).map((project, i) => (
            <ProjectRow key={project.id} project={project} index={i} />
          ))}
        </div>
      </section>
    </>
  )
}
