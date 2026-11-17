import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { useContent } from '@/app/ContentProvider'
import { Button, EmptyState, Spinner } from '@/components/ui'
import { deleteRow, listRows, reorderRows, saveRow } from '@/services/admin'
import { FormFields, IconButton, Modal, useFeedback, validate, type FieldDef } from './ui'

type Row = { id: string; sort_order?: number; visible?: boolean } & Record<string, unknown>

export interface ResourceConfig {
  table: string
  /** Singular noun, e.g. "experience". */
  noun: string
  fields: FieldDef[]
  defaults: Record<string, unknown>
  primary: (row: Row) => ReactNode
  secondary?: (row: Row) => ReactNode
  /** Optional transform before saving (e.g. derive a slug). */
  prepare?: (row: Record<string, unknown>) => Record<string, unknown>
  /** Group rows under headings by this key. */
  groupBy?: string
}

/**
 * A complete list + create/edit/delete/reorder/visibility manager for one
 * table, driven entirely by a field configuration.
 */
export function ResourceManager({ config, embedded }: { config: ResourceConfig; embedded?: boolean }) {
  const { reload } = useContent()
  const fb = useFeedback()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const hasVisible = config.fields.some((f) => f.name === 'visible')

  const load = useCallback(async () => {
    try {
      setRows(await listRows<Row>(config.table))
    } catch (e) {
      fb.error(e)
      setRows([])
    }
  }, [config.table, fb])
  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.table])

  const afterChange = async () => {
    await load()
    void reload()
  }

  async function save() {
    if (!editing) return
    const errs = validate(config.fields, editing)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    const isNew = !editing.id
    const payload = config.prepare ? config.prepare(editing) : editing
    if (isNew && rows) payload.sort_order = rows.length ? Math.max(...rows.map((r) => r.sort_order ?? 0)) + 1 : 0
    const ok = await fb.run(() => saveRow(config.table, payload), `${cap(config.noun)} ${isNew ? 'added' : 'saved'}.`)
    setSaving(false)
    if (ok) {
      setEditing(null)
      await afterChange()
    }
  }

  async function remove(row: Row) {
    const ok = await fb.confirm({
      title: `Delete this ${config.noun}?`,
      message: 'This permanently removes it from the site. It cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (ok && (await fb.run(() => deleteRow(config.table, row.id), `${cap(config.noun)} deleted.`))) await afterChange()
  }

  async function move(index: number, dir: -1 | 1) {
    if (!rows) return
    const next = [...rows]
    const j = index + dir
    if (j < 0 || j >= next.length) return
    ;[next[index], next[j]] = [next[j], next[index]]
    setRows(next)
    if (await fb.run(() => reorderRows(config.table, next.map((r) => r.id)))) void reload()
    else void load()
  }

  async function toggleVisible(row: Row) {
    if (await fb.run(() => saveRow(config.table, { id: row.id, visible: !row.visible }), row.visible ? 'Hidden from the site.' : 'Visible on the site.'))
      await afterChange()
  }

  const open = (row?: Row) => {
    setErrors({})
    setEditing(row ? { ...row } : { ...config.defaults })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-mono text-xs text-dim">{rows ? `${rows.length} ${rows.length === 1 ? config.noun : `${config.noun}s`}` : ''}</p>
        <Button size={embedded ? 'sm' : 'md'} onClick={() => open()}>
          <Plus className="size-4" /> Add {config.noun}
        </Button>
      </div>

      {rows === null ? (
        <div className="flex justify-center py-16"><Spinner className="text-hi" /></div>
      ) : rows.length === 0 ? (
        <EmptyState title={`No ${config.noun}s yet.`} hint="Add the first one — it appears on the site as soon as you save.">
          <Button onClick={() => open()}>
            <Plus className="size-4" /> Add {config.noun}
          </Button>
        </EmptyState>
      ) : (
        <ul className="card divide-y divide-line">
          {rows.map((row, i) => {
            const group = config.groupBy ? String(row[config.groupBy] ?? 'Ungrouped') : null
            const prevGroup = config.groupBy && i > 0 ? String(rows[i - 1][config.groupBy] ?? 'Ungrouped') : null
            return (
              <li key={row.id}>
                {group !== null && group !== prevGroup && (
                  <p className="border-b border-line bg-bg2 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-dim">{group}</p>
                )}
                <div className={`flex items-center gap-3 px-4 py-3 ${row.visible === false ? 'opacity-55' : ''}`}>
                  <div className="flex flex-col">
                    <IconButton label="Move up" onClick={() => void move(i, -1)} disabled={i === 0}>
                      <ArrowUp className="size-3.5" />
                    </IconButton>
                    <IconButton label="Move down" onClick={() => void move(i, 1)} disabled={i === rows.length - 1}>
                      <ArrowDown className="size-3.5" />
                    </IconButton>
                  </div>
                  <button className="min-w-0 flex-1 text-left" onClick={() => open(row)}>
                    <span className="block truncate text-sm font-medium">{config.primary(row)}</span>
                    {config.secondary && <span className="block truncate text-xs text-mute">{config.secondary(row)}</span>}
                  </button>
                  {hasVisible && (
                    <IconButton label={row.visible ? 'Hide from site' : 'Show on site'} onClick={() => void toggleVisible(row)}>
                      {row.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </IconButton>
                  )}
                  <IconButton label="Edit" onClick={() => open(row)}>
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton label="Delete" danger onClick={() => void remove(row)}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`${editing?.id ? 'Edit' : 'Add'} ${config.noun}`}>
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void save()
            }}
          >
            <FormFields fields={config.fields} values={editing} errors={errors} onChange={(patch) => setEditing((v) => ({ ...v, ...patch }))} />
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
