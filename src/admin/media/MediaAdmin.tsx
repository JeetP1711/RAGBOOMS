import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { Copy, FileText, Search, Trash2, Upload } from 'lucide-react'
import { Button, EmptyState, Spinner } from '@/components/ui'
import { deleteMedia, listRows, mediaUsage, saveRow, uploadMedia } from '@/services/admin'
import type { MediaAsset } from '@/types'
import { cn, formatBytes, formatDate } from '@/utils'
import { AdminPage, Modal, useFeedback } from '../ui'

const isImage = (a: MediaAsset) => a.mime_type.startsWith('image/')

function useMedia() {
  const fb = useFeedback()
  const [assets, setAssets] = useState<MediaAsset[] | null>(null)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    try {
      setAssets(await listRows<MediaAsset>('media_assets', 'created_at', false))
    } catch (e) {
      fb.error(e)
      setAssets([])
    }
  }, [fb])

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = [...files]
      if (!list.length) return [] as MediaAsset[]
      setUploading(true)
      const done: MediaAsset[] = []
      for (const file of list) {
        try {
          done.push(await uploadMedia(file))
        } catch (e) {
          fb.error(e)
        }
      }
      setUploading(false)
      if (done.length) fb.success(`${done.length} file${done.length > 1 ? 's' : ''} uploaded.`)
      await load()
      return done
    },
    [fb, load],
  )
  return { assets, uploading, load, upload }
}

function Dropzone({ onFiles, uploading, compact }: { onFiles: (f: FileList) => void; uploading: boolean; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files)
  }
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        'flex flex-wrap items-center justify-center gap-3 rounded-xl border border-dashed text-sm text-mute transition-colors',
        compact ? 'p-4' : 'p-8',
        over ? 'border-accent bg-brand/10' : 'border-line',
      )}
    >
      {uploading ? <Spinner className="text-hi" /> : <Upload className="size-5" />}
      <span>{uploading ? 'Uploading…' : 'Drop images or PDFs here, or'}</span>
      <Button size="sm" variant="secondary" onClick={() => input.current?.click()} disabled={uploading}>
        Browse files
      </Button>
      <span className="w-full text-center text-xs text-dim">PNG, JPG, WebP, GIF, SVG, AVIF or PDF · up to 10 MB each</span>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        accept="image/*,application/pdf"
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

function Thumb({ asset }: { asset: MediaAsset }) {
  return isImage(asset) ? (
    <img src={asset.url} alt={asset.name} loading="lazy" className="size-full object-cover" />
  ) : (
    <span className="grid size-full place-items-center text-mute">
      <FileText className="size-8" />
    </span>
  )
}

/** Modal used by image fields to reuse or upload a file. */
export function MediaPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (url: string) => void }) {
  const { assets, uploading, load, upload } = useMedia()
  const [q, setQ] = useState('')
  useEffect(() => {
    if (open) void load()
  }, [open, load])
  const shown = (assets ?? []).filter((a) => a.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <Modal open={open} onClose={onClose} title="Media library" width="max-w-3xl">
      <Dropzone
        compact
        uploading={uploading}
        onFiles={(f) =>
          void upload(f).then((done) => {
            if (done.length === 1) onPick(done[0].url)
          })
        }
      />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by file name" aria-label="Search media" className="field mt-4" />
      {assets === null ? (
        <div className="flex justify-center py-10"><Spinner className="text-hi" /></div>
      ) : shown.length === 0 ? (
        <p className="py-10 text-center text-sm text-mute">No files{q ? ' match' : ' uploaded yet'}.</p>
      ) : (
        <ul className="mt-4 grid max-h-[50vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
          {shown.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onPick(a.url)}
                title={a.name}
                className="block aspect-square w-full overflow-hidden rounded-md border border-line bg-bg2 hover:border-accent"
              >
                <Thumb asset={a} />
              </button>
              <p className="mt-1 truncate text-[11px] text-dim">{a.name}</p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

export default function MediaAdmin() {
  const fb = useFeedback()
  const { assets, uploading, load, upload } = useMedia()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<MediaAsset | null>(null)
  const [name, setName] = useState('')
  const [usage, setUsage] = useState<string[] | null>(null)

  useEffect(() => {
    void load()
  }, [load])
  useEffect(() => {
    setName(selected?.name ?? '')
    setUsage(null)
    if (selected) void mediaUsage(selected.url).then(setUsage).catch(() => setUsage([]))
  }, [selected])

  const shown = (assets ?? []).filter((a) => a.name.toLowerCase().includes(q.toLowerCase()))

  async function rename() {
    if (!selected || !name.trim() || name === selected.name) return
    if (await fb.run(() => saveRow('media_assets', { id: selected.id, name: name.trim() }), 'Renamed.')) {
      setSelected({ ...selected, name: name.trim() })
      void load()
    }
  }
  async function remove() {
    if (!selected) return
    const used = usage ?? []
    const ok = await fb.confirm({
      title: 'Delete this file?',
      message: used.length
        ? `It is still used by: ${used.join(', ')}. Those places will show a broken image until you replace it.`
        : 'The file is not used anywhere. This permanently deletes it from storage.',
      confirmLabel: 'Delete file',
      danger: true,
    })
    if (ok && (await fb.run(() => deleteMedia(selected), 'File deleted.'))) {
      setSelected(null)
      void load()
    }
  }

  return (
    <AdminPage title="Media" description="Screenshots, covers, logos and certificates. Upload once and reuse anywhere.">
      <Dropzone uploading={uploading} onFiles={(f) => void upload(f)} />
      <label className="relative mt-6 block max-w-sm">
        <span className="sr-only">Search media</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by file name" className="field pl-9" />
      </label>

      {assets === null ? (
        <div className="flex justify-center py-16"><Spinner className="text-hi" /></div>
      ) : shown.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={q ? 'No files match.' : 'The library is empty.'} hint={q ? undefined : 'Upload a project cover or screenshot to get started.'} />
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {shown.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => setSelected(a)}
                className="block aspect-square w-full overflow-hidden rounded-lg border border-line bg-bg2 transition-colors hover:border-accent"
              >
                <Thumb asset={a} />
              </button>
              <p className="mt-1.5 truncate text-xs text-mute" title={a.name}>{a.name}</p>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="File details" width="max-w-3xl">
        {selected && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid min-h-48 place-items-center overflow-hidden rounded-lg border border-line bg-bg2">
              {isImage(selected) ? <img src={selected.url} alt={selected.name} className="max-h-80" /> : <FileText className="size-12 text-mute" />}
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <label className="label" htmlFor="media-name">Name</label>
                <div className="flex gap-2">
                  <input id="media-name" value={name} onChange={(e) => setName(e.target.value)} className="field" />
                  <Button variant="secondary" onClick={() => void rename()} disabled={!name.trim() || name === selected.name}>
                    Rename
                  </Button>
                </div>
              </div>
              <p className="font-mono text-xs text-dim">
                {selected.mime_type} · {formatBytes(selected.size)} · {formatDate(selected.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <div>
                <p className="label">Used in</p>
                {usage === null ? (
                  <Spinner className="size-3" />
                ) : usage.length ? (
                  <ul className="list-disc pl-5 text-mute">{usage.map((u) => <li key={u}>{u}</li>)}</ul>
                ) : (
                  <p className="text-mute">Not used anywhere — safe to delete.</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="secondary" onClick={() => void navigator.clipboard.writeText(selected.url).then(() => fb.success('URL copied.'))}>
                  <Copy className="size-4" /> Copy URL
                </Button>
                <Button href={selected.url} variant="ghost">Open</Button>
                <Button variant="danger" onClick={() => void remove()}>
                  <Trash2 className="size-4" /> Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AdminPage>
  )
}
