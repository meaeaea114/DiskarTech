'use client'

import Link from 'next/link'
import { BarChart3, CalendarDays, CheckCircle2, Clock, Plus, Settings, Users } from 'lucide-react'
import { PIPELINE, STATUS_META } from '@/lib/constants'
import { formatSlot } from '@/lib/services'
import { Avatar, Badge, CompanyLogo, SectionHeader, StatTile } from '@/components/ui/kit'
import { BarChart, HBars, perDay } from '@/components/ui/charts'
import { ApplicantRow, applicantInfo, useEmployerData } from '@/components/features/employer'

export default function EmployerDashboard() {
  const { db, me, employer, jobs, apps, interviews } = useEmployerData()
  const weekAgo = Date.now() - 7 * 86_400_000
  const active = jobs.filter((j) => j.status === 'published')
  const reached = (s: (typeof PIPELINE)[number]) => apps.filter((a) => a.timeline.some((t) => t.status === s)).length
  const upcoming = interviews.filter((i) => i.status === 'scheduled' && new Date(`${i.date}T${i.time}`).getTime() > Date.now())
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const hiredThisMonth = apps.filter((a) => a.status === 'hired' && new Date(a.updatedAt).getMonth() === new Date().getMonth()).length
  const recent = [...apps].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)).slice(0, 5)

  return (
    <div>
      <section className="mb-[22px] mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-[7px]">Hiring hub</p>
          <h1 className="mb-2 text-[27px] leading-[1.08]">Welcome back, {me.name.split(' ')[0]}</h1>
          <p className="flex items-center gap-1 text-[12px] text-muted">{employer.name}{employer.verification === 'verified' ? <CheckCircle2 size={13} className="text-brand" /> : <Badge tone="amber" className="ml-1 px-2 py-0.5 text-[10px]">Pending verification</Badge>}</p>
        </div>
        <Link href="/settings" className="grid size-[38px] shrink-0 place-items-center rounded-full border border-[#ebedf0] bg-white text-[#30435b]" aria-label="Settings"><Settings size={18} /></Link>
      </section>

      <Link href="/employer/jobs" className="bg-hero tap flex items-center justify-between gap-3 rounded-[19px] p-5 text-white shadow-[var(--shadow-hero)]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[1.35px] text-[#c5dcf2]">Open roles</span>
          <h3 className="mb-1.5 mt-[7px] font-serif text-[19px] font-medium">{active.length} active job{active.length === 1 ? '' : 's'}</h3>
          <p className="max-w-[220px] text-[12px] text-[#cfe3f8]">Reach talented Filipino candidates. {apps.filter((a) => a.status === 'submitted').length} new applicants to review.</p>
        </div>
        <CompanyLogo initials={employer.initials} color={employer.color} size={52} />
      </Link>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Active jobs', value: active.length, href: '/employer/jobs' },
          { label: 'Applicants', value: apps.length, href: '/employer/applicants' },
          { label: 'Shortlisted', value: apps.filter((a) => a.status === 'shortlisted').length, href: '/employer/applicants?status=shortlisted' },
          { label: 'Interviews', value: upcoming.length, href: '/employer/interviews' },
          { label: 'Offers', value: apps.filter((a) => a.status === 'offer').length, href: '/employer/applicants?status=offer' },
          { label: 'Hired', value: apps.filter((a) => a.status === 'hired').length, href: '/employer/applicants?status=hired' },
        ].map((t) => (
          <Link key={t.label} href={t.href} className="tap rounded-[14px] border border-line bg-white px-3 py-3.5">
            <b className="block font-serif text-[20px] font-normal tabular-nums">{t.value}</b>
            <small className="mt-1 block text-[10px] text-muted">{t.label}</small>
          </Link>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted">{jobs.filter((j) => j.status === 'draft').length} draft{jobs.filter((j) => j.status === 'draft').length === 1 ? '' : 's'} · +{apps.filter((a) => new Date(a.appliedAt).getTime() > weekAgo).length} applicants this week · {hiredThisMonth} hired this month</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href="/employer/jobs/new" className="btn btn-primary"><Plus size={18} />Post a Job</Link>
        <Link href="/employer/applicants" className="btn btn-secondary"><Users size={18} />Applicants</Link>
      </div>

      <div className="mt-2 grid gap-x-8">
        <div>
          <SectionHeader title="Recent Applicants" href="/employer/applicants" />
          <div className="card divide-y divide-line">
            {recent.length ? recent.map((a) => <ApplicantRow key={a.id} app={a} />) : <p className="p-4 text-[14px] text-muted">No applicants yet. Publish a job to start receiving applications.</p>}
          </div>

          <SectionHeader title="Upcoming Interviews" href="/employer/interviews" />
          <div className="card divide-y divide-line">
            {upcoming.slice(0, 3).map((iv) => {
              const app = db.applications.find((a) => a.id === iv.applicationId)!
              const { name, job, profile } = applicantInfo(db, app)
              return (
                <Link key={iv.id} href={`/employer/applicants/${app.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-canvas/60">
                  <Avatar name={name} color={profile?.avatarColor} size={38} />
                  <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold">{name}</p><p className="truncate text-[12px] text-muted">{job.title} · {iv.type}</p></div>
                  <span className="flex items-center gap-1 text-[12px] font-semibold text-violet"><CalendarDays size={13} />{formatSlot(iv.date, iv.time)}</span>
                </Link>
              )
            })}
            {!upcoming.length && <p className="flex items-center gap-2 p-4 text-[14px] text-muted"><Clock size={16} />No upcoming interviews</p>}
          </div>
        </div>

        <div>
          <SectionHeader title="Hiring Funnel" href="/employer/analytics" actionLabel="Analytics" />
          <div className="card card-pad">
            <HBars label="Applicants who reached each hiring stage" data={PIPELINE.map((s) => ({ label: STATUS_META[s].stage, value: reached(s) }))} />
          </div>

          <SectionHeader title="Application Activity" />
          <div className="card card-pad">
            <p className="mb-3 text-[13px] text-muted">Applications received · last 14 days</p>
            <BarChart label="Applications per day, last 14 days" data={perDay(apps.map((a) => a.appliedAt), 14)} />
          </div>

          <SectionHeader title="Job Performance" href="/employer/jobs" />
          <div className="card divide-y divide-line">
            {active.map((j) => {
              const n = apps.filter((a) => a.jobId === j.id).length
              return (
                <Link key={j.id} href={`/employer/jobs/${j.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-canvas/60">
                  <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold">{j.title}</p><p className="text-[12px] text-muted">{j.views.toLocaleString()} views · {j.views ? ((n / j.views) * 100).toFixed(1) : 0}% apply rate</p></div>
                  <span className="text-right"><b className="block text-[16px] tabular-nums">{n}</b><span className="text-[11px] text-muted">applicants</span></span>
                </Link>
              )
            })}
            {!active.length && <p className="p-4 text-[14px] text-muted">No active job posts.</p>}
          </div>
          <Link href="/employer/analytics" className="btn btn-tinted mt-4 w-full"><BarChart3 size={17} />View full analytics</Link>
        </div>
      </div>
    </div>
  )
}
