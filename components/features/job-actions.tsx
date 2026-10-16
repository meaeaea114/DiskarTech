'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Copy, Eye, EyeOff, Lock, MoreHorizontal, Pencil, Send, Trash2, Users } from 'lucide-react'
import { useAction } from '@/hooks/use-app'
import { JobService } from '@/lib/services'
import type { Job } from '@/lib/types'
import { ConfirmDialog, Sheet } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type Confirm = 'close' | 'unpublish' | 'delete' | null

/** "⋯" button opening every action available for a job in its current status. */
export function JobActions({ job, applicants, className }: { job: Job; applicants: number; className?: string }) {
  const router = useRouter()
  const [run, pending] = useAction()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<Confirm>(null)

  const act = async (fn: () => Promise<unknown>, success: string | ((r: any) => string), after?: (r: any) => void) => {
    const r = await run(fn, { success })
    setOpen(false)
    setConfirm(null)
    if (r.ok) after?.(r.data)
  }

  const item = (icon: React.ReactNode, label: string, onClick: () => void, tone?: 'danger') => (
    <button key={label} onClick={onClick} disabled={pending} className={cn('flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] font-medium hover:bg-canvas', tone === 'danger' && 'text-danger')}>{icon}{label}</button>
  )

  return (
    // Sheets render in a portal, but React events still bubble to ancestors (e.g. a card <Link>), so stop them here.
    <span className="contents" onClick={(e) => e.stopPropagation()}>
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }} className={cn('grid size-9 place-items-center rounded-full text-muted hover:bg-brand-50 hover:text-brand', className)} aria-label={`Actions for ${job.title}`}><MoreHorizontal size={20} /></button>
      <Sheet open={open} onClose={() => setOpen(false)} title={job.title} size="sm">
        <div className="card -mx-1 divide-y divide-line overflow-hidden">
          {item(<Users size={18} className="text-brand" />, `View applicants (${applicants})`, () => router.push(`/employer/applicants?job=${job.id}`))}
          {item(<Pencil size={18} className="text-brand" />, 'Edit job', () => router.push(`/employer/jobs/${job.id}/edit`))}
          {(job.status === 'draft' || job.status === 'rejected') && item(<Send size={18} className="text-brand" />, job.status === 'rejected' ? 'Resubmit for review' : 'Publish', () => act(() => JobService.publish(job.id), (s) => (s === 'published' ? 'Job published — it’s now live' : 'Submitted for admin review')))}
          {job.status === 'closed' && item(<Eye size={18} className="text-brand" />, 'Reopen (republish)', () => act(() => JobService.publish(job.id), (s) => (s === 'published' ? 'Job reopened' : 'Submitted for admin review')))}
          {(job.status === 'published' || job.status === 'pending') && item(<EyeOff size={18} className="text-muted" />, 'Unpublish (move to drafts)', () => { setOpen(false); setConfirm('unpublish') })}
          {job.status === 'published' && item(<Lock size={18} className="text-muted" />, 'Close applications', () => { setOpen(false); setConfirm('close') })}
          {item(<Copy size={18} className="text-muted" />, 'Duplicate', () => act(() => JobService.duplicate(job.id), 'Job duplicated as a draft', (copy) => router.push(`/employer/jobs/${copy.id}/edit`)))}
          {job.status === 'draft' && applicants === 0 && item(<Trash2 size={18} />, 'Delete draft', () => { setOpen(false); setConfirm('delete') }, 'danger')}
        </div>
        <Link href={`/employer/jobs/${job.id}`} className="mt-3 block text-center text-[13px] font-semibold text-brand" onClick={() => setOpen(false)}>Open job overview</Link>
      </Sheet>
      <ConfirmDialog open={confirm === 'close'} onClose={() => setConfirm(null)} busy={pending} title="Close this job?" confirmLabel="Close job" tone="danger"
        message="Job seekers will no longer be able to apply. Existing applicants stay in your pipeline." onConfirm={() => act(() => JobService.setStatus(job.id, 'closed'), 'Job closed')} />
      <ConfirmDialog open={confirm === 'unpublish'} onClose={() => setConfirm(null)} busy={pending} title="Unpublish this job?" confirmLabel="Unpublish"
        message="It will be hidden from Job Discovery and moved back to drafts." onConfirm={() => act(() => JobService.setStatus(job.id, 'draft'), 'Job unpublished')} />
      <ConfirmDialog open={confirm === 'delete'} onClose={() => setConfirm(null)} busy={pending} title="Delete draft?" confirmLabel="Delete" tone="danger"
        message="This can’t be undone." onConfirm={() => act(() => JobService.remove(job.id), 'Draft deleted', () => router.push('/employer/jobs'))} />
    </span>
  )
}
