import { useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import { usePortfolio } from '@/app/ContentProvider'
import { Button } from '@/components/ui'
import { INQUIRY_TYPES } from '@/types'

type State = { kind: 'idle' | 'sending' | 'sent' } | { kind: 'error'; message: string }

export function ContactForm({ defaultType }: { defaultType?: string }) {
  const { email } = usePortfolio()
  const [state, setState] = useState<State>({ kind: 'idle' })
  const openedAt = useRef(Date.now())

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>
    setState({ kind: 'sending' })
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...data, elapsed_ms: Date.now() - openedAt.current }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok && body.ok) {
        form.reset()
        return setState({ kind: 'sent' })
      }
      const message =
        body.error === 'not_configured' || res.status === 404
          ? `The contact form is not connected yet.${email ? ` Please email ${email} instead.` : ''}`
          : body.error || 'Something went wrong. Please try again.'
      setState({ kind: 'error', message })
    } catch {
      setState({ kind: 'error', message: 'Network error. Please check your connection and try again.' })
    }
  }

  if (state.kind === 'sent')
    return (
      <div className="card flex flex-col items-start gap-4 p-8" role="status">
        <CheckCircle2 className="size-8 text-hi" />
        <h3 className="text-2xl font-semibold">Message received.</h3>
        <p className="text-mute">Thanks for reaching out — I'll get back to you soon.</p>
        <Button variant="secondary" onClick={() => setState({ kind: 'idle' })}>
          Send another
        </Button>
      </div>
    )

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6 md:p-8" noValidate={false}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="cf-name">Name</label>
          <input id="cf-name" name="name" required minLength={2} maxLength={100} autoComplete="name" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="cf-email">Email</label>
          <input id="cf-email" name="email" type="email" required maxLength={200} autoComplete="email" className="field" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="cf-type">What is this about?</label>
        <select id="cf-type" name="inquiry_type" defaultValue={defaultType ?? INQUIRY_TYPES[0]} className="field">
          {INQUIRY_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="cf-message">Message</label>
        <textarea
          id="cf-message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          placeholder="Tell me a little about what you have in mind."
          className="field resize-y"
        />
      </div>
      {/* Honeypot: hidden from people, tempting for bots. */}
      <div className="absolute -left-[9999px]" aria-hidden>
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.kind === 'error' && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.message}
        </p>
      )}
      <Button type="submit" size="lg" loading={state.kind === 'sending'}>
        {state.kind === 'sending' ? 'Sending…' : 'Send message'} <Send className="size-4" />
      </Button>
    </form>
  )
}
