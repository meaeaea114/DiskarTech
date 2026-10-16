'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CalendarClock, Eye, MapPin, Pencil, SearchX, Users } from 'lucide-react'
import { PIPELINE, STATUS_META } from '@/lib/constants'
import { deadlineLabel, formatDate, salaryRange } from '@/lib/format'
import { Badge, EmptyState, JobStatusBadge, SectionHeader } from '@/components/ui/kit'
import { HBars } from '@/components/ui/charts'
import { PageHeader } from '@/components/layout/page-header'
import { ApplicantRow, useEmployerData } from '@/components/features/employer'
import { JobActions } from '@/components/features/job-actions'

export default function EmployerJobDetail() {
  const { id } = useParams<{ id: string }>()
  const { jobs, apps } = useEmployerData()
  const job = jobs.find((j) => j.id === id)
  if (!job) return <div><PageHeader title="Job" back="/employer/jobs" /><EmptyState icon={SearchX} title="Job not found" /></div>
  const jobApps = apps.filter((a) => a.jobId === job.id).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))

  return (
    <div className="mx-auto max-w-4xl pb-6">
      <PageHeader back="/employer/jobs" title={job.title} actions={<><Link href={`/employer/jobs/${job.id}/edit`} className="btn btn-secondary btn-sm"><Pencil size={15} />Edit</Link><JobActions job={job} applicants={jobApps.length} className="bg-white shadow-[var(--shadow-card)]" /></>}
        subtitle={<span className="flex flex-wrap items-center gap-2"><JobStatusBadge status={job.status} /><span className="flex items-center gap-1"><MapPin size={13} />{job.location} · {job.type} · {salaryRange(job.salaryMin, job.salaryMax)}</span></span>} />
      {job.status === 'pending' && <p className="mb-4 rounded-2xl bg-warn-50 p-3.5 text-[13px] text-[#8a6100]">This job is waiting for admin approval. It will appear in Job Discovery once approved.</p>}
      {job.moderationNote && <p className="mb-4 rounded-2xl bg-danger-50 p-3.5 text-[13px] text-danger">Admin note: {job.moderationNote}</p>}

      <div className="grid grid-cols-3 gap-3">
        <div className="card card-pad"><Users size={17} className="text-brand" /><p className="mt-1.5 text-[22px] font-bold">{jobApps.length}</p><p className="text-[12px] text-muted">Applicants</p></div>
        <div className="card card-pad"><Eye size={17} className="text-brand" /><p className="mt-1.5 text-[22px] font-bold">{job.views.toLocaleString()}</p><p className="text-[12px] text-muted">Views</p></div>
        <div className="card card-pad"><CalendarClock size={17} className="text-brand" /><p className="mt-1.5 text-[15px] font-bold leading-7">{job.status === 'published' ? deadlineLabel(job.deadline) : formatDate(job.deadline)}</p><p className="text-[12px] text-muted">Deadline</p></div>
      </div>

      <div className="grid gap-x-8">
        <div>
          <SectionHeader title={`Applicants (${jobApps.length})`} href={`/employer/applicants?job=${job.id}`} actionLabel="Open pipeline" />
          <div className="card divide-y divide-line">
            {jobApps.length ? jobApps.map((a) => <ApplicantRow key={a.id} app={a} showJob={false} />) : <p className="p-4 text-[14px] text-muted">{job.status === 'published' ? 'No applicants yet — check back soon.' : 'Publish this job to start receiving applicants.'}</p>}
          </div>
        </div>
        <div>
          <SectionHeader title="Pipeline" />
          <div className="card card-pad"><HBars label="Applicants currently at each stage" data={[...PIPELINE, 'rejected' as const].map((s) => ({ label: STATUS_META[s].stage, value: jobApps.filter((a) => a.status === s).length }))} /></div>
          <SectionHeader title="Required skills" />
          <div className="flex flex-wrap gap-1.5">{job.skills.map((s) => <Badge key={s} tone="blue">{s}</Badge>)}</div>
          <SectionHeader title="Description" />
          <p className="text-[14px] leading-relaxed text-[#4a5b75]">{job.description || <i>No description yet.</i>}</p>
        </div>
      </div>
    </div>
  )
}
