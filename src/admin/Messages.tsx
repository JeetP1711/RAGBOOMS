import { useCallback, useEffect, useState } from 'react'
import { Archive, CheckCheck, Mail, MailOpen, Reply, Trash2 } from 'lucide-react'
import { Button, EmptyState, Spinner } from '@/components/ui'
import { deleteRow, listRows, saveRow } from '@/services/admin'
import { CONTACT_STATUSES, type ContactStatus, type ContactSubmission } from '@/types'
import { cn, formatDate } from '@/utils'
import { AdminPage, Pill, useFeedback } from './ui'

const tone = { new: 'hi', read: 'mute', replied: 'mute', archived: 'mute' } as const

export default function Messages() {
  const fb = useFeedback()
  const [rows, setRows] = useState<ContactSubmission[] | null>(null)
  const [filter, setFilter] = useState<ContactStatus | 'inbox'>('inbox')
  const [openId, setOpenId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setRows(await listRows<ContactSubmission>('contact_submissions', 'created_at', false))
    } catch (e) {
      fb.error(e)
      setRows([])
    }
  }, [fb])
  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setStatus = async (m: ContactSubmission, status: ContactStatus, message?: string) => {
    if (await fb.run(() => saveRow('contact_submissions', { id: m.id, status }), message)) await load()
  }
  const toggle = (m: ContactSubmission) => {
    setOpenId(openId === m.id ? null : m.id)
    if (m.status === 'new' && openId !== m.id) void setStatus(m, 'read')
  }
  const remove = async (m: ContactSubmission) => {
    const ok = await fb.confirm({ title: 'Delete this message?', message: `The message from ${m.name} will be permanently deleted.`, confirmLabel: 'Delete', danger: true })
    if (ok && (await fb.run(() => deleteRow('contact_submissions', m.id), 'Message deleted.'))) await load()
  }

  const shown = (rows ?? []).filter((m) => (filter === 'inbox' ? m.status !== 'archived' : m.status === filter))

  return (
    <AdminPage title="Messages" description="Submissions from the contact form. Only administrators can read these.">
      <div className="mb-5 flex flex-wrap gap-1 rounded-lg border border-line p-1 sm:w-fit" role="tablist">
        {(['inbox', ...CONTACT_STATUSES] as const).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={cn('rounded-md px-3 py-1 text-sm capitalize', filter === f ? 'bg-card text-ink' : 'text-mute hover:text-ink')}>
            {f}
            {rows && f !== 'inbox' && <span className="ml-1.5 font-mono text-xs text-dim">{rows.filter((m) => m.status === f).length}</span>}
          </button>
        ))}
      </div>

      {rows === null ? (
        <div className="flex justify-center py-20"><Spinner className="text-hi" /></div>
      ) : shown.length === 0 ? (
        <EmptyState title="No messages here." hint={rows.length ? undefined : 'When someone uses the contact form, their message appears here.'} />
      ) : (
        <ul className="card divide-y divide-line">
          {shown.map((m) => (
            <li key={m.id}>
              <button onClick={() => toggle(m)} aria-expanded={openId === m.id} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-bg2">
                {m.status === 'new' ? <Mail className="size-4 shrink-0 text-hi" /> : <MailOpen className="size-4 shrink-0 text-dim" />}
                <span className={cn('w-36 shrink-0 truncate text-sm', m.status === 'new' && 'font-semibold')}>{m.name}</span>
                <span className="hidden shrink-0 font-mono text-[11px] text-dim sm:block">{m.inquiry_type}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-mute">{m.message}</span>
                <Pill tone={tone[m.status]}>{m.status}</Pill>
                <span className="hidden shrink-0 font-mono text-xs text-dim md:block">{formatDate(m.created_at, { day: 'numeric', month: 'short' })}</span>
              </button>
              {openId === m.id && (
                <div className="border-t border-line bg-bg2 px-4 py-4">
                  <p className="font-mono text-xs text-dim">
                    {m.email} · {formatDate(m.created_at, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm">{m.message}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.inquiry_type}`)}`} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-[13px] font-medium text-white hover:bg-accent">
                      <Reply className="size-4" /> Reply by email
                    </a>
                    {m.status !== 'replied' && <Button size="sm" variant="secondary" onClick={() => void setStatus(m, 'replied', 'Marked as replied.')}><CheckCheck className="size-4" /> Mark replied</Button>}
                    {m.status !== 'new' && m.status !== 'archived' && <Button size="sm" variant="ghost" onClick={() => void setStatus(m, 'new')}>Mark unread</Button>}
                    {m.status !== 'archived' && <Button size="sm" variant="ghost" onClick={() => void setStatus(m, 'archived', 'Archived.')}><Archive className="size-4" /> Archive</Button>}
                    <Button size="sm" variant="danger" onClick={() => void remove(m)}><Trash2 className="size-4" /> Delete</Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  )
}
