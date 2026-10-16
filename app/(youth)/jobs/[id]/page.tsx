'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Briefcase, Building2, CalendarClock, Check, CheckCircle2, Eye, Gift, MapPin, SearchX, Share2, Users } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useMe } from '@/hooks/use-app'
import { ApplicationService, JobService, ProfileService, Recommendations } from '@/lib/services'
import { deadlineLabel, formatDate, salaryRange, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge, CompanyLogo, EmptyState, ProgressBar } from '@/components/ui/kit'
import { BackButton } from '@/components/layout/page-header'
import { SaveJobButton } from '@/components/features/jobs'
import { toast } from '@/components/ui/toast'

export default function JobDetails() {
  const { id } = useParams<{ id: string }>()
  const db = useDB()
  const me = useMe()
  const viewed = useRef(false)
  const job = db.jobs.find((j) => j.id === id)
  const visible = job && (job.status === 'published' || job.status === 'closed')

  useEffect(() => {
    if (visible && !viewed.current) { viewed.current = true; JobService.recordView(id) }
  }, [id, visible])

  if (!job || !visible) {
    return <div className="pt-4"><BackButton href="/jobs" /><div className="mt-6"><EmptyState icon={SearchX} title="Job not found" message="This job may have been removed or is no longer available." action={<Link href="/jobs" className="btn btn-primary btn-sm">Browse jobs</Link>} /></div></div>
  }

  const employer = db.employers.find((e) => e.id === job.employerId)!
  const profile = ProfileService.get(db, me.id)
  const match = Recommendations.jobMatch(profile, job)
  const application = db.applications.find((a) => a.jobId === job.id && a.userId === me.id)
  const open = JobService.isOpen(job)
  const applicants = JobService.applicantCount(db, job.id)

  const share = async () => {
    const url = window.location.href
    try { await navigator.clipboard.writeText(url); toast.success('Job link copied to clipboard') } catch { toast.info(url) }
  }

  return (
    <div className="-mx-5 -mt-4">
      <div className="relative bg-gradient-to-b from-brand-50 to-canvas px-5 pb-6 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <BackButton />
          <div className="flex gap-2">
            <button onClick={share} className="grid size-10 place-items-center rounded-full bg-white text-navy shadow-[var(--shadow-card)]" aria-label="Share job"><Share2 size={18} /></button>
            <SaveJobButton jobId={job.id} className="size-10 bg-white shadow-[var(--shadow-card)]" />
          </div>
        </div>
        <div className="mx-auto mt-4 max-w-3xl">
          <div className="card relative p-5 pt-12 text-center">
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-full bg-white p-2.5 shadow-[var(--shadow-card)]">
              <CompanyLogo initials={employer.initials} color={employer.color} size={56} />
            </div>
            <p className="text-[13px] text-muted">{employer.name}{employer.verification === 'verified' && <CheckCircle2 size={13} className="ml-1 inline text-brand" aria-label="Verified employer" />}</p>
            <h1 className="mt-1 text-[24px] font-bold leading-tight tracking-tight">{job.title}</h1>
            <p className="mt-2 flex items-center justify-center gap-1 text-[13px] text-muted"><MapPin size={14} />{JobService.locationLabel(job)} · {job.workSetup}</p>
            <p className="mt-2 text-[18px] font-bold">{salaryRange(job.salaryMin, job.salaryMax)} <span className="text-[14px] font-medium text-muted">/ month</span></p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Badge tone="blue">{job.type}</Badge><Badge tone="blue">{job.level}</Badge><Badge>{job.category}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-3xl gap-5 px-5 pb-32">
        <div className="grid grid-cols-3 gap-2.5">
          <Fact icon={Users} label="Applicants" value={String(applicants)} />
          <Fact icon={CalendarClock} label="Deadline" value={open ? deadlineLabel(job.deadline) : 'Closed'} />
          <Fact icon={Eye} label="Views" value={job.views.toLocaleString()} />
        </div>

        <section className="card card-pad">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold">Your match</h2>
            <span className={cn('text-[15px] font-bold', match.score >= 70 ? 'text-success' : 'text-brand')}>{match.score}%</span>
          </div>
          <ProgressBar value={match.score} tone={match.score >= 70 ? 'success' : 'brand'} className="mt-2" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skills.map((s) => {
              const has = match.matched.includes(s)
              return <span key={s} className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold', has ? 'bg-success-50 text-success' : 'bg-[#eef1f5] text-muted')}>{has && <Check size={12} />}{s}</span>
            })}
          </div>
          {match.missing.length > 0 && <p className="mt-3 text-[12px] text-muted">Build {match.missing.slice(0, 2).join(' and ')} to improve your match. <Link href="/learn" className="font-semibold text-brand">Find courses</Link></p>}
        </section>

        <Section title="Job Description"><p className="text-[14px] leading-relaxed text-[#4a5b75]">{job.description}</p></Section>
        <Section title="Responsibilities"><Bullets items={job.responsibilities} /></Section>
        <Section title="Qualifications"><Bullets items={job.qualifications} check /></Section>
        <Section title="Benefits"><Bullets items={job.benefits} icon={<Gift size={15} className="mt-0.5 shrink-0 text-gold" />} /></Section>

        <section className="card card-pad">
          <div className="flex items-center gap-3">
            <CompanyLogo initials={employer.initials} color={employer.color} />
            <div><h2 className="text-[15px] font-bold">{employer.name}</h2><p className="text-[12px] text-muted">{employer.industry} · {employer.size}</p></div>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-[#4a5b75]">{employer.about}</p>
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted"><Building2 size={13} />{employer.location}</p>
        </section>
        <p className="text-center text-[12px] text-subtle">Posted {timeAgo(job.postedAt)} · Apply by {formatDate(job.deadline)}</p>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(70px+env(safe-area-inset-bottom))] z-20 border-t border-line bg-white/90 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl gap-3">
          <SaveJobButton jobId={job.id} withLabel className="hidden shrink-0" />
          {application ? (
            <Link href={`/applications/${application.id}`} className="btn btn-success flex-1"><CheckCircle2 size={19} />Application Submitted · View status</Link>
          ) : open ? (
            <Link href={`/jobs/${job.id}/apply`} className="btn btn-primary flex-1"><Briefcase size={18} />Apply Now</Link>
          ) : (
            <button disabled className="btn btn-secondary flex-1">No longer accepting applications</button>
          )}
        </div>
      </div>
    </div>
  )
}

function Fact({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="card px-3 py-3 text-center">
      <Icon size={17} className="mx-auto text-brand" />
      <div className="mt-1.5 truncate text-[13px] font-bold">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-2.5 text-[18px] font-bold">{title}</h2>{children}</section>
}

function Bullets({ items, check, icon }: { items: string[]; check?: boolean; icon?: React.ReactNode }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5 text-[14px] leading-relaxed text-[#4a5b75]">
          {icon ?? (check ? <Check size={16} className="mt-0.5 shrink-0 text-success" /> : <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />)}
          {t}
        </li>
      ))}
    </ul>
  )
}
