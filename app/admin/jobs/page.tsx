'use client'

import { useState } from 'react'
import { Check, ClipboardCheck, Eye, MapPin, X } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useAction } from '@/hooks/use-app'
import { JobService } from '@/lib/services'
import type { Job, JobStatus } from '@/lib/types'
import { salaryRange, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge, CompanyLogo, EmptyState, JobStatusBadge, TextArea } from '@/components/ui/kit'
import { ConfirmDialog, Sheet } from '@/components/ui/sheet'
import { PageHeader } from '@/components/layout/page-header'

type Decision = { job: Job; kind: 'approve' | 'reject' | 'takedown' }

export default function Moderation() {
  const db = useDB()
  const [run, pending] = useAction()
  const [tab, setTab] = useState<'pending' | JobStatus | 'all'>('pending')
  const [view, setView] = useState<Job | null>(null)
  const [decision, setDecision] = useState<Decision | null>(null)
  const [note, setNote] = useState('')
  const list = db.jobs.filter((j) => j.status !== 'draft' && (tab === 'all' || j.status === tab)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const decide = async () => {
    if (!decision) return
    const labels = { approve: 'Job approved — now visible in Job Discovery', reject: 'Job rejected — employer notified', takedown: 'Job taken down' }
    const r = await run(() => JobService.moderate(decision.job.id, decision.kind, note.trim()), { success: labels[decision.kind] })
    if (r.ok) { setDecision(null); setView(null); setNote('') }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Job Moderation" bell subtitle="Review job posts before they reach job seekers" />
      <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5">
        {(['pending', 'published', 'rejected', 'closed', 'all'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('chip capitalize', tab === t && 'chip-active')}>{t === 'pending' ? 'Pending review' : t} ({t === 'all' ? db.jobs.filter((j) => j.status !== 'draft').length : db.jobs.filter((j) => j.status === t).length})</button>
        ))}
      </div>
      <div className="mt-4 grid gap-3">
        {list.length === 0 && <EmptyState icon={ClipboardCheck} title={tab === 'pending' ? 'All caught up!' : 'No jobs here'} message={tab === 'pending' ? 'No job posts are waiting for review.' : undefined} />}
        {list.map((j) => {
          const e = db.employers.find((x) => x.id === j.employerId)!
          return (
            <div key={j.id} className="card p-4">
              <button className="flex w-full items-start gap-3 text-left" onClick={() => setView(j)}>
                <CompanyLogo initials={e.initials} color={e.color} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="text-[16px] font-bold">{j.title}</h3><JobStatusBadge status={j.status} /></div>
                  <p className="text-[13px] text-muted">{e.name} {e.verification !== 'verified' && <Badge tone="amber" className="ml-1 px-2 py-0.5 text-[10px]">Unverified</Badge>}</p>
                  <p className="mt-1 flex items-center gap-1 text-[12px] text-muted"><MapPin size={12} />{j.location} · {salaryRange(j.salaryMin, j.salaryMax)} · updated {timeAgo(j.updatedAt)}</p>
                </div>
              </button>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                <button className="btn btn-secondary btn-sm" onClick={() => setView(j)}><Eye size={15} />Review</button>
                {(j.status === 'pending' || j.status === 'rejected') && <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => setDecision({ job: j, kind: 'approve' })}><Check size={15} />Approve</button>}
                {j.status === 'pending' && <button className="btn btn-danger btn-sm" disabled={pending} onClick={() => setDecision({ job: j, kind: 'reject' })}><X size={15} />Reject</button>}
                {j.status === 'published' && <button className="btn btn-danger btn-sm" disabled={pending} onClick={() => setDecision({ job: j, kind: 'takedown' })}>Take down</button>}
              </div>
            </div>
          )
        })}
      </div>

      <Sheet open={!!view} onClose={() => setView(null)} title={view?.title} description={view ? db.employers.find((e) => e.id === view.employerId)?.name : undefined} size="lg"
        footer={view?.status === 'pending' && (
          <div className="grid grid-cols-2 gap-3">
            <button className="btn btn-danger" onClick={() => setDecision({ job: view, kind: 'reject' })}>Reject</button>
            <button className="btn btn-primary" onClick={() => setDecision({ job: view, kind: 'approve' })}>Approve</button>
          </div>
        )}>
        {view && (
          <div className="space-y-4 text-[14px]">
            <div className="flex flex-wrap gap-2"><JobStatusBadge status={view.status} /><Badge>{view.type}</Badge><Badge>{view.level}</Badge><Badge>{view.workSetup}</Badge><Badge>{view.location}</Badge></div>
            <p className="font-semibold">{salaryRange(view.salaryMin, view.salaryMax)} / month</p>
            <p className="leading-relaxed text-[#4a5b75]">{view.description}</p>
            <div><h4 className="mb-1 font-bold">Responsibilities</h4><ul className="list-disc pl-5 text-[#4a5b75]">{view.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul></div>
            <div><h4 className="mb-1 font-bold">Qualifications</h4><ul className="list-disc pl-5 text-[#4a5b75]">{view.qualifications.map((r) => <li key={r}>{r}</li>)}</ul></div>
            <div className="flex flex-wrap gap-1.5">{view.skills.map((s) => <Badge key={s} tone="blue">{s}</Badge>)}</div>
            <div className="rounded-2xl bg-brand-50 p-3 text-[13px] text-[#3e5677]">Checklist: realistic salary for the PH market ✓ · no fees charged to applicants ✓ · legitimate company details ✓</div>
          </div>
        )}
      </Sheet>

      <ConfirmDialog open={!!decision} onClose={() => setDecision(null)} busy={pending} onConfirm={decide} tone={decision?.kind === 'approve' ? 'primary' : 'danger'}
        title={decision?.kind === 'approve' ? 'Approve job post?' : decision?.kind === 'reject' ? 'Reject job post?' : 'Take down job post?'}
        confirmLabel={decision?.kind === 'approve' ? 'Approve' : decision?.kind === 'reject' ? 'Reject' : 'Take down'}
        message={<>
          <p>{decision?.kind === 'approve' ? `“${decision.job.title}” will become visible in Job Discovery and matching job seekers will be notified.` : 'The employer will be notified with your note.'}</p>
          {decision?.kind !== 'approve' && <TextArea className="mt-3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (shared with the employer)" />}
        </>} />
    </div>
  )
}
