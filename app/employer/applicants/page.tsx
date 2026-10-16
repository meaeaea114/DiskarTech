'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpDown, ChevronRight, Columns3, List, Search, UserX } from 'lucide-react'
import { useAction, useQueryParam, useSimulatedLoad } from '@/hooks/use-app'
import { ApplicationService } from '@/lib/services'
import { APPLICATION_STATUSES, PIPELINE, STATUS_META } from '@/lib/constants'
import type { ApplicationStatus } from '@/lib/types'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Avatar, Badge, CardSkeleton, EmptyState, Segmented, Select } from '@/components/ui/kit'
import { PageHeader } from '@/components/layout/page-header'
import { ApplicantRow, applicantInfo, useEmployerData } from '@/components/features/employer'

type Sort = 'newest' | 'oldest' | 'match' | 'name'

export default function Applicants() {
  const { db, jobs, apps } = useEmployerData()
  const [run, pending] = useAction()
  const [view, setView] = useState<'list' | 'pipeline'>(useQueryParam('job') ? 'pipeline' : 'list')
  const [q, setQ] = useState(useQueryParam('q') ?? '')
  const [jobId, setJobId] = useState(useQueryParam('job') ?? 'all')
  const [status, setStatus] = useState<'all' | ApplicationStatus>((useQueryParam('status') as ApplicationStatus) ?? 'all')
  const [sort, setSort] = useState<Sort>('newest')
  const loading = useSimulatedLoad(view, 300)

  const rows = useMemo(() => apps
    .map((a) => ({ app: a, ...applicantInfo(db, a) }))
    .filter((r) => (jobId === 'all' || r.app.jobId === jobId) && (status === 'all' || view === 'pipeline' || r.app.status === status))
    .filter((r) => !q || `${r.name} ${r.profile?.headline} ${r.profile?.skills.map((s) => s.name).join(' ')} ${r.job.title}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === 'newest' ? b.app.appliedAt.localeCompare(a.app.appliedAt) : sort === 'oldest' ? a.app.appliedAt.localeCompare(b.app.appliedAt)
      : sort === 'match' ? b.match.score - a.match.score : a.name.localeCompare(b.name)), [apps, db, jobId, status, q, sort, view])

  const move = (appId: string, to: ApplicationStatus, name: string) =>
    run(() => ApplicationService.updateStatus(appId, to), { success: `${name} moved to ${STATUS_META[to].label}` })

  return (
    <div>
      <PageHeader title="Applicants" bell actions={<Link href="/employer/interviews" className="btn btn-secondary btn-sm hidden">Interviews</Link>} />
      <div className="grid gap-2.5">
        <label className="card flex items-center gap-3 px-4"><Search size={18} className="text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, skill, or job" className="h-12 flex-1 bg-transparent text-[15px] outline-none" aria-label="Search applicants" /></label>
        <Select value={jobId} onChange={(e) => setJobId(e.target.value)} aria-label="Filter by job" className="h-12">
          <option value="all">All jobs ({apps.length})</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} ({apps.filter((a) => a.jobId === j.id).length})</option>)}
        </Select>
        <Segmented value={view} onChange={setView} options={[{ value: 'list', label: 'List' }, { value: 'pipeline', label: 'Pipeline' }]} className="" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {view === 'list' && (
          <div className="scrollbar-none -mx-5 flex basis-full gap-2 overflow-x-auto px-5">
            {(['all', ...APPLICATION_STATUSES] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={cn('chip', status === s && 'chip-active')}>
                {s === 'all' ? 'All' : STATUS_META[s].label} ({s === 'all' ? apps.filter((a) => jobId === 'all' || a.jobId === jobId).length : apps.filter((a) => a.status === s && (jobId === 'all' || a.jobId === jobId)).length})
              </button>
            ))}
          </div>
        )}
        <label className="ml-auto flex items-center gap-1.5 text-[13px] font-semibold"><ArrowUpDown size={14} className="text-muted" />
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="bg-transparent outline-none" aria-label="Sort applicants">
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="match">Best match</option><option value="name">Name A–Z</option>
          </select>
        </label>
      </div>

      <div className="mt-4">
        {loading ? <CardSkeleton rows={4} /> : rows.length === 0 && view === 'list' ? (
          <EmptyState icon={UserX} title="No applicants found" message={apps.length ? 'Try a different search or filter.' : 'Applicants appear here as soon as job seekers apply.'} />
        ) : view === 'list' ? (
          <div className="card divide-y divide-line">{rows.map((r) => <ApplicantRow key={r.app.id} app={r.app} />)}</div>
        ) : (
          <div className="scrollbar-none -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-4">
            {[...PIPELINE, 'rejected' as const].map((stage) => {
              const col = rows.filter((r) => r.app.status === stage)
              const next = stage === 'rejected' || stage === 'hired' ? null : PIPELINE[PIPELINE.indexOf(stage) + 1]
              return (
                <section key={stage} className="w-[260px] shrink-0 snap-start rounded-[18px] bg-[#e9eef5] p-2.5" aria-label={`${STATUS_META[stage].stage} column`}>
                  <h2 className="flex items-center justify-between px-1.5 pb-2 text-[13px] font-bold">{STATUS_META[stage].stage}<Badge tone={STATUS_META[stage].tone}>{col.length}</Badge></h2>
                  <div className="grid gap-2">
                    {col.map((r) => (
                      <div key={r.app.id} className="card p-3">
                        <Link href={`/employer/applicants/${r.app.id}`} className="flex items-center gap-2.5">
                          <Avatar name={r.name} color={r.profile?.avatarColor} size={34} />
                          <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold">{r.name}</p><p className="truncate text-[11px] text-muted">{r.job.title}</p></div>
                        </Link>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                          <span>{r.match.score}% match · {timeAgo(r.app.appliedAt)}</span>
                        </div>
                        {next && (
                          <div className="mt-2 flex gap-1.5">
                            <button disabled={pending} onClick={() => move(r.app.id, next, r.name)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-50 py-1.5 text-[11px] font-semibold text-brand hover:bg-brand-100">
                              {STATUS_META[next].stage}<ChevronRight size={12} />
                            </button>
                            <button disabled={pending} onClick={() => move(r.app.id, 'rejected', r.name)} className="rounded-lg bg-danger-50 px-2 py-1.5 text-[11px] font-semibold text-danger" aria-label={`Reject ${r.name}`}>Reject</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {!col.length && <p className="px-1.5 py-4 text-center text-[12px] text-subtle">No applicants</p>}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
      {view === 'pipeline' && <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted"><Columns3 size={13} />Move applicants forward from each card, or open a profile for more options.</p>}
      {view === 'list' && rows.length > 0 && <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted"><List size={13} />{rows.length} applicant(s)</p>}
    </div>
  )
}
