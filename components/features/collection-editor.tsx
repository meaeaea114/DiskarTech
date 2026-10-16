'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2, type LucideIcon } from 'lucide-react'
import { useAction } from '@/hooks/use-app'
import { uid } from '@/lib/services/core'
import { EmptyState, Field, TextArea, TextInput } from '@/components/ui/kit'
import { ConfirmDialog, Sheet, Spinner } from '@/components/ui/sheet'

export interface FieldDef<T> {
  key: keyof T & string
  label: string
  placeholder?: string
  required?: boolean
  multiline?: boolean
  half?: boolean
}

/** Add / edit / remove items of a profile list (education, experience, ...). Saves on every change. */
export function CollectionEditor<T extends { id: string }>({ items, onSave, fields, noun, icon, render, emptyMessage }: {
  items: T[]
  onSave: (next: T[]) => Promise<unknown>
  fields: FieldDef<T>[]
  noun: string
  icon: LucideIcon
  render: (item: T) => React.ReactNode
  emptyMessage: string
}) {
  const [run, pending] = useAction()
  const [editing, setEditing] = useState<Partial<T> | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [removing, setRemoving] = useState<T | null>(null)

  const open = (item?: T) => { setErrors({}); setEditing(item ? { ...item } : ({} as Partial<T>)) }
  const save = async () => {
    if (!editing) return
    const errs: Record<string, string> = {}
    fields.forEach((f) => { if (f.required && !String(editing[f.key] ?? '').trim()) errs[f.key] = `${f.label} is required` })
    setErrors(errs)
    if (Object.keys(errs).length) return
    const isNew = !editing.id
    const item = { ...editing, id: editing.id ?? uid(noun.toLowerCase().slice(0, 4)) } as T
    const next = isNew ? [...items, item] : items.map((x) => (x.id === item.id ? item : x))
    const r = await run(() => onSave(next), { success: `${noun} ${isNew ? 'added' : 'updated'}` })
    if (r.ok) setEditing(null)
  }
  const remove = async () => {
    if (!removing) return
    const r = await run(() => onSave(items.filter((x) => x.id !== removing.id)), { success: `${noun} removed` })
    if (r.ok) setRemoving(null)
  }

  return (
    <>
      {items.length === 0 ? (
        <EmptyState icon={icon} title={`No ${noun.toLowerCase()} added yet`} message={emptyMessage} action={<button className="btn btn-primary btn-sm" onClick={() => open()}><Plus size={16} />Add {noun.toLowerCase()}</button>} />
      ) : (
        <>
          <div className="grid gap-3">
            {items.map((item) => (
              <div key={item.id} className="card flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">{render(item)}</div>
                <button onClick={() => open(item)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-brand-50 hover:text-brand" aria-label={`Edit ${noun.toLowerCase()}`}><Pencil size={16} /></button>
                <button onClick={() => setRemoving(item)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-danger-50 hover:text-danger" aria-label={`Remove ${noun.toLowerCase()}`}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <button className="btn btn-tinted mt-4 w-full" onClick={() => open()}><Plus size={18} />Add {noun.toLowerCase()}</button>
        </>
      )}

      <Sheet open={!!editing} onClose={() => !pending && setEditing(null)} title={editing?.id ? `Edit ${noun.toLowerCase()}` : `Add ${noun.toLowerCase()}`}
        footer={<button className="btn btn-primary w-full" onClick={save} disabled={pending}>{pending ? <><Spinner />Saving…</> : 'Save'}</button>}>
        <div className="grid grid-cols-2 gap-4">
          {editing && fields.map((f) => (
            <Field key={f.key} label={f.label + (f.required ? '' : ' (optional)')} error={errors[f.key]} className={f.half ? '' : 'col-span-2'}>
              {f.multiline
                ? <TextArea value={String(editing[f.key] ?? '')} placeholder={f.placeholder} invalid={!!errors[f.key]} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                : <TextInput value={String(editing[f.key] ?? '')} placeholder={f.placeholder} invalid={!!errors[f.key]} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />}
            </Field>
          ))}
        </div>
      </Sheet>

      <ConfirmDialog open={!!removing} onClose={() => setRemoving(null)} onConfirm={remove} busy={pending} tone="danger" confirmLabel="Remove"
        title={`Remove this ${noun.toLowerCase()}?`} message="This will also remove it from your résumé." />
    </>
  )
}
