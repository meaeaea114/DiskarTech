'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, Eye, MapPin, Plus, Search, Users } from 'lucide-react'
import { useSimulatedLoad } from '@/hooks/use-app'
import type { JobStatus } from '@/lib/types'
import { deadlineLabel, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CardSkeleton, EmptyState, JobStatusBadge } from '@/components/ui/kit'
import { PageHeader } from '@/components/layout/page-header'
import { useEmployerData } from '@/components/features/employer'
import { JobActions } from '@/components/features/job-actions'

const TABS: { id: 'all' | JobStatus; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'published', label: 'Published' }, { id: 'draft', label: 'Drafts' },
  { id: 'pending', label: 'In review' }, { id: 'closed', label: 'Closed' }, { id: 'rejected', label: 'Rejected' },
]

export default function EmployerJobs() {
  const { jobs, apps } = useEmployerData()
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all')
  const [q, setQ] = useState('')
  const loading = useSimulatedLoad(tab, 300)
  const list = jobs.filter((j) => (tab === 'all' || j.status === tab) && j.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Job Posts" bell actions={<Link href="/employer/jobs/new" className="btn btn-primary btn-sm"><Plus size={16} />New job</Link>} />
      <label className="card flex items-center gap-3 px-4"><Search size={18} className="text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your job posts" className="h-12 flex-1 bg-transparent text-[15px] outline-none" aria-label="Search job posts" /></label>
      <div className="scrollbar-none -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        {TABS.map((t) => {
          const n = t.id === 'all' ? jobs.length : jobs.filter((j) => j.status === t.id).length
          return <button key={t.id} onClick={() => setTab(t.id)} className={cn('chip', tab === t.id && 'chip-active')}>{t.label} ({n})</button>
        })}
      </div>
      <div className="mt-4">
        {loading ? <CardSkeleton rows={3} /> : list.length === 0 ? (
          <EmptyState icon={Briefcase} title={tab === 'all' ? 'No job posts yet' : 'Nothing here'} message="Create a job post to start receiving applicants." action={<Link href="/employer/jobs/new" className="btn btn-primary btn-sm"><Plus size={16} />Post a job</Link>} />
        ) : (
          <div className="grid gap-3">
            {list.map((j) => {
              const n = apps.filter((a) => a.jobId === j.id).length
              return (
                <Link key={j.id} href={`/employer/jobs/${j.id}`} className="card tap block p-4 hover:shadow-[0_8px_24px_rgba(38,59,87,0.11)]">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="text-[16px] font-bold">{j.title}</h3><JobStatusBadge status={j.status} /></div>
                      <p className="mt-1 flex items-center gap-1 text-[12px] text-muted"><MapPin size={12} />{j.location} · {j.type} · {j.workSetup}</p>
                      {j.moderationNote && <p className="mt-1.5 text-[12px] text-danger">Admin note: {j.moderationNote}</p>}
                    </div>
                    <JobActions job={j} applicants={n} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 border-t border-line pt-3 text-[12px] text-muted">
                    <span className="flex items-center gap-1"><Users size={13} /><b className="text-ink">{n}</b> applicants</span>
                    <span className="flex items-center gap-1"><Eye size={13} />{j.views.toLocaleString()} views</span>
                    <span>{j.status === 'published' ? deadlineLabel(j.deadline) : `Updated ${timeAgo(j.updatedAt)}`}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
