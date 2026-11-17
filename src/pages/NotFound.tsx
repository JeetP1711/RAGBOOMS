import { Button } from '@/components/ui'
import { useSeo } from '@/hooks/useSeo'

export default function NotFound() {
  useSeo({ title: 'Page not found', noindex: true })
  return (
    <section className="wrap grid min-h-[70dvh] place-items-center pt-24 text-center">
      <div>
        <p className="font-mono text-sm text-hi">404</p>
        <h1 className="mt-4 text-4xl font-semibold md:text-5xl">This page doesn't exist.</h1>
        <p className="mt-4 text-mute">It may have been moved, renamed or unpublished.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button to="/">Back home</Button>
          <Button to="/projects" variant="secondary">
            Browse projects
          </Button>
        </div>
      </div>
    </section>
  )
}
