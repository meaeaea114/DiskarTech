'use client'

import Link from 'next/link'
import { Bookmark, Clock, MapPin, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDB } from '@/lib/mock/store'
import { useAction, useMe } from '@/hooks/use-app'
import { ApplicationService, JobService } from '@/lib/services'
import type { Job } from '@/lib/types'
import { deadlineLabel, salaryRange, timeAgo } from '@/lib/format'
import { Badge, CompanyLogo } from '@/components/ui/kit'

export function SaveJobButton({ jobId, className, withLabel }: { jobId: string; className?: string; withLabel?: boolean }) {
  const db = useDB()
  const me = useMe()
  const [run, pending] = useAction()
  const saved = JobService.isSaved(db, me.id, jobId)
  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    run(() => JobService.toggleSave(jobId), { success: (now) => (now ? 'Job saved' : 'Removed from saved jobs') })
  }
  return (
    <button onClick={toggle} disabled={pending} aria-pressed={saved} aria-label={saved ? 'Unsave job' : 'Save job'}
      className={cn('inline-flex items-center justify-center gap-1.5 rounded-full transition', withLabel ? 'btn btn-secondary' : 'size-9 hover:bg-brand-50',
        saved ? 'text-rose' : 'text-[#919ba8]', pending && 'opacity-60', className)}>
      <Bookmark size={withLabel ? 18 : 20} fill={saved ? 'currentColor' : 'none'} strokeWidth={2} />
      {withLabel && (saved ? 'Saved' : 'Save Job')}
    </button>
  )
}

export function JobCard({ job, match, compact }: { job: Job; match?: number; compact?: boolean }) {
  const db = useDB()
  const me = useMe()
  const employer = db.employers.find((e) => e.id === job.employerId)
  const applied = ApplicationService.hasApplied(db, me.id, job.id)
  return (
    <Link href={`/jobs/${job.id}`} className="tap block rounded-[17px] border border-[#e9ecee] bg-white p-4 shadow-[0_4px_13px_rgba(36,56,78,0.03)]">
      <div className="flex items-start justify-between">
        <CompanyLogo initials={employer?.initials ?? '?'} color={employer?.color ?? '#E4EEFF'} size={38} />
        <SaveJobButton jobId={job.id} className="-mr-2 -mt-1" />
      </div>
      <h3 className="mb-1 mt-[13px] text-[15px] font-bold leading-snug">{job.title}</h3>
      <p className="text-[12px] text-[#566476]">{employer?.name}</p>
      <div className="mb-[11px] mt-[14px] flex justify-between gap-2.5 text-[11px] text-[#6f7b89]">
        <span className="flex min-w-0 items-center gap-1"><MapPin size={13} className="shrink-0" /><span className="truncate">{job.location} · {job.workSetup}</span></span>
        <span className="shrink-0 font-semibold text-ink">{salaryRange(job.salaryMin, job.salaryMax).replace(/,000/g, 'k')}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="flex gap-1.5">
          <span className="rounded-[20px] bg-[#f0f3f6] px-[9px] py-[5px] text-[10px] text-[#596a7d]">{job.type}</span>
          {!compact && <span className="rounded-[20px] bg-[#f0f3f6] px-[9px] py-[5px] text-[10px] text-[#596a7d]">{job.level}</span>}
        </span>
        {applied ? <Badge tone="green" className="text-[10px]">Applied</Badge>
          : match !== undefined ? <span className={cn('text-[10px] font-bold', match >= 70 ? 'text-success' : 'text-brand')}>{match}% match</span>
          : <span className="text-[10px] text-[#a3aab3]">{timeAgo(job.postedAt)}</span>}
      </div>
      {!compact && (
        <div className="mt-2.5 flex items-center gap-3 border-t border-[#eff1f2] pt-2.5 text-[10px] text-[#a3aab3]">
          <span className="flex items-center gap-1"><Clock size={12} />Posted {timeAgo(job.postedAt)}</span>
          <span className="flex items-center gap-1"><Users size={12} />{JobService.applicantCount(db, job.id)} applicants</span>
          <span className="ml-auto">{deadlineLabel(job.deadline)}</span>
        </div>
      )}
    </Link>
  )
}
