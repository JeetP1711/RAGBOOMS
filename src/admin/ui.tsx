/** Admin UI kit: toasts, confirm dialog, modal and data-driven form fields. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, ImageIcon, X, XCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/utils'
import { MediaPicker } from './media/MediaAdmin'

/* ------------------------------------------------------- Toasts + Confirm */

interface Toast {
  id: number
  kind: 'success' | 'error'
  text: string
}
interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean
}
interface Feedback {
  success: (text: string) => void
  error: (err: unknown) => void
  confirm: (o: ConfirmOptions) => Promise<boolean>
  /** Runs an async action and reports the outcome. Returns true on success. */
  run: (fn: () => Promise<unknown>, successText?: string) => Promise<boolean>
}
const FeedbackCtx = createContext<Feedback | null>(null)
export const useFeedback = () => useContext(FeedbackCtx)!

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null)
  const seq = useRef(0)

  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = ++seq.current
    setToasts((t) => [...t, { id, kind, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 7000 : 3500)
  }, [])
  const success = useCallback((text: string) => push('success', text), [push])
  const error = useCallback(
    (err: unknown) => push('error', err instanceof Error ? err.message : String(err || 'Something went wrong.')),
    [push],
  )
  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ ...o, resolve })), [])
  const run = useCallback(
    async (fn: () => Promise<unknown>, successText?: string) => {
      try {
        await fn()
        if (successText) success(successText)
        return true
      } catch (e) {
        error(e)
        return false
      }
    },
    [success, error],
  )
  // Stable identity: consumers list this in effect dependencies.
  const value = useMemo(() => ({ success, error, confirm, run }), [success, error, confirm, run])
  const close = (v: boolean) => {
    dialog?.resolve(v)
    setDialog(null)
  }

  return (
    <FeedbackCtx.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[70] flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              role={t.kind === 'error' ? 'alert' : 'status'}
              className={cn(
                'card flex items-start gap-3 px-4 py-3 text-sm shadow-xl shadow-black/50',
                t.kind === 'error' ? 'border-danger/50' : 'border-accent/50',
              )}
            >
              {t.kind === 'error' ? <XCircle className="mt-0.5 size-4 shrink-0 text-danger" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-hi" />}
              <span className="break-words">{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <Modal open={!!dialog} onClose={() => close(false)} title={dialog?.title ?? ''} width="max-w-md">
        <div className="flex gap-3">
          {dialog?.danger && <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" />}
          <p className="text-sm text-mute">{dialog?.message}</p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button variant={dialog?.danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
            {dialog?.confirmLabel ?? 'Confirm'}
          </Button>
        </div>
      </Modal>
    </FeedbackCtx.Provider>
  )
}

/* ------------------------------------------------------------------- Modal */

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-2xl',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] overflow-y-auto bg-bg/80 p-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className={cn('card mx-auto my-[6vh] w-full shadow-2xl shadow-black/60', width)}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="font-display text-lg font-medium">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="text-mute hover:text-ink">
                <X className="size-5" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------- Page chrome */

export function AdminPage({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-mute">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

export const Panel = ({ title, hint, children, className }: { title?: string; hint?: string; children: ReactNode; className?: string }) => (
  <section className={cn('card p-5', className)}>
    {title && <h2 className="font-display text-base font-medium">{title}</h2>}
    {hint && <p className="mt-1 text-xs text-mute">{hint}</p>}
    <div className={title ? 'mt-4' : ''}>{children}</div>
  </section>
)

/* ------------------------------------------------------------------ Fields */

export interface FieldDef {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'list' | 'select' | 'toggle' | 'date' | 'url' | 'email' | 'image' | 'tags' | 'color' | 'number'
  options?: readonly string[]
  /** For `select`: value/label pairs (use instead of options). */
  choices?: { value: string; label: string }[]
  required?: boolean
  hint?: string
  placeholder?: string
  /** Suggestions for `tags`. */
  suggestions?: string[]
  /** Full-width in the two-column grid. */
  wide?: boolean
  rows?: number
}

type Values = Record<string, unknown>

/** Returns a map of field name → error message. Empty means valid. */
export function validate(fields: FieldDef[], values: Values): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of fields) {
    const v = values[f.name]
    const s = typeof v === 'string' ? v.trim() : ''
    if (f.required && (v === null || v === undefined || s === '' && typeof v === 'string')) errors[f.name] = `${f.label} is required.`
    else if ((f.type === 'url' || f.type === 'image') && s && !/^(https?:\/\/|\/)\S+$/i.test(s))
      errors[f.name] = 'Enter a full URL starting with https://'
    else if (f.type === 'email' && s && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) errors[f.name] = 'Enter a valid email address.'
  }
  return errors
}

export function FormFields({
  fields,
  values,
  onChange,
  errors = {},
}: {
  fields: FieldDef[]
  values: Values
  onChange: (patch: Values) => void
  errors?: Record<string, string>
}) {
  return (
    <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.name} className={cn((f.wide || ['textarea', 'list', 'image', 'tags'].includes(f.type ?? '')) && 'sm:col-span-2')}>
          <Field def={f} value={values[f.name]} onChange={(v) => onChange({ [f.name]: v })} error={errors[f.name]} />
        </div>
      ))}
    </div>
  )
}

export function Field({ def, value, onChange, error }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void; error?: string }) {
  const id = useId()
  const type = def.type ?? 'text'
  const str = (value as string | null) ?? ''
  const describedBy = error ? `${id}-err` : def.hint ? `${id}-hint` : undefined
  const common = { id, 'aria-invalid': !!error, 'aria-describedby': describedBy, placeholder: def.placeholder }
  const fieldCls = cn('field', error && '!border-danger')

  let control: ReactNode
  if (type === 'toggle')
    return (
      <label className="flex cursor-pointer items-start gap-3 py-1.5">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-4 accent-[var(--color-accent)]"
        />
        <span>
          <span className="block text-sm">{def.label}</span>
          {def.hint && <span className="block text-xs text-mute">{def.hint}</span>}
        </span>
      </label>
    )
  if (type === 'textarea')
    control = <textarea {...common} rows={def.rows ?? 4} value={str} onChange={(e) => onChange(e.target.value)} className={cn(fieldCls, 'resize-y')} />
  else if (type === 'list')
    control = (
      <textarea
        {...common}
        rows={def.rows ?? 5}
        value={((value as string[]) ?? []).join('\n')}
        onChange={(e) => onChange(e.target.value.split('\n'))}
        onBlur={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
        className={cn(fieldCls, 'resize-y')}
      />
    )
  else if (type === 'select')
    control = (
      <select {...common} value={str} onChange={(e) => onChange(e.target.value || null)} className={fieldCls}>
        {!def.required && <option value="">—</option>}
        {def.options?.map((o) => (
          <option key={o}>{o}</option>
        ))}
        {def.choices?.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
    )
  else if (type === 'tags') control = <TagInput id={id} value={(value as string[]) ?? []} onChange={onChange} suggestions={def.suggestions} placeholder={def.placeholder} />
  else if (type === 'image') control = <ImageInput id={id} value={str} onChange={onChange} invalid={!!error} />
  else if (type === 'color')
    control = (
      <div className="flex gap-2">
        <input type="color" value={str || '#000000'} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 rounded border border-line bg-bg2" aria-label={def.label} />
        <input {...common} value={str} onChange={(e) => onChange(e.target.value)} className={cn(fieldCls, 'font-mono')} />
      </div>
    )
  else
    control = (
      <input
        {...common}
        type={type === 'date' ? 'date' : type === 'number' ? 'number' : type === 'email' ? 'email' : 'text'}
        inputMode={type === 'url' ? 'url' : undefined}
        value={type === 'number' ? ((value as number) ?? '') : str}
        onChange={(e) =>
          onChange(type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : type === 'date' ? e.target.value || null : e.target.value)
        }
        className={fieldCls}
      />
    )

  return (
    <div>
      <label htmlFor={id} className="label">
        {def.label}
        {def.required && <span className="text-hi"> *</span>}
      </label>
      {control}
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-xs text-danger">{error}</p>
      ) : (
        def.hint && <p id={`${id}-hint`} className="mt-1 text-xs text-dim">{def.hint}{type === 'list' ? ' One per line.' : ''}</p>
      )}
      {!error && !def.hint && type === 'list' && <p className="mt-1 text-xs text-dim">One per line.</p>}
    </div>
  )
}

export function TagInput({
  id,
  value,
  onChange,
  suggestions = [],
  placeholder,
}: {
  id?: string
  value: string[]
  onChange: (v: string[]) => void
  suggestions?: string[]
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')
  const listId = useId()
  const add = (raw: string) => {
    const tags = raw.split(',').map((t) => t.trim()).filter(Boolean)
    if (!tags.length) return
    // Reuse the canonical spelling when a suggestion matches case-insensitively.
    const canon = tags.map((t) => suggestions.find((s) => s.toLowerCase() === t.toLowerCase()) ?? t)
    onChange([...new Set([...value, ...canon])])
    setDraft('')
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
  }
  return (
    <div className="field flex flex-wrap gap-1.5 !p-1.5">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded bg-card px-2 py-1 font-mono text-xs">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="text-dim hover:text-danger">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        list={listId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => add(draft)}
        placeholder={value.length ? '' : (placeholder ?? 'Type and press Enter')}
        className="min-w-32 flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-dim"
      />
      <datalist id={listId}>
        {suggestions.filter((s) => !value.includes(s)).map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  )
}

export function ImageInput({ id, value, onChange, invalid }: { id?: string; value: string; onChange: (v: string | null) => void; invalid?: boolean }) {
  const [picker, setPicker] = useState(false)
  return (
    <div className="flex items-start gap-3">
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-bg2">
        {value ? <img src={value} alt="" className="size-full object-cover" /> : <ImageIcon className="size-5 text-dim" />}
      </div>
      <div className="flex-1 space-y-2">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://… or choose from the media library"
          className={cn('field', invalid && '!border-danger')}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPicker(true)}>
            Choose from media
          </Button>
          {value && (
            <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <MediaPicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={(url) => {
          onChange(url)
          setPicker(false)
        }}
      />
    </div>
  )
}

export const Pill = ({ tone = 'mute', children }: { tone?: 'hi' | 'warn' | 'mute' | 'danger'; children: ReactNode }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
      tone === 'hi' && 'border-hi/40 bg-hi/10 text-hi',
      tone === 'warn' && 'border-warn/40 bg-warn/10 text-warn',
      tone === 'danger' && 'border-danger/40 bg-danger/10 text-danger',
      tone === 'mute' && 'border-line text-mute',
    )}
  >
    {children}
  </span>
)

export const IconButton = ({
  label,
  onClick,
  children,
  disabled,
  danger,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  disabled?: boolean
  danger?: boolean
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'grid size-8 place-items-center rounded-md text-mute transition-colors hover:bg-bg2 disabled:opacity-30',
      danger ? 'hover:text-danger' : 'hover:text-ink',
    )}
  >
    {children}
  </button>
)
