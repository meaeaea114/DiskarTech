'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CalendarDays, CalendarPlus, Check, Clock, ExternalLink, MapPin, MessageSquareText, Phone, SearchX, Video, XCircle } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useMe } from '@/hooks/use-app'
import { ApplicationService, formatSlot } from '@/lib/services'
import { PIPELINE, STATUS_META } from '@/lib/constants'
import type { Interview } from '@/lib/types'
import { formatDate, salaryRange, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge, CompanyLogo, EmptyState, StatusBadge } from '@/components/ui/kit'
import { PageHeader } from '@/components/layout/page-header'

const HINTS: Record<string, string> = {
  submitted: 'Your application was delivered. Employers usually review within 3–5 days.',
  under_review: 'The hiring team is reviewing your profile and résumé.',
  shortlisted: 'Great news — you’re on the shortlist! Expect an interview invitation soon.',
  interview: 'Prepare for your interview: research the company and practice your introduction.',
  offer: 'You received an offer! Check your email for the details from the employer.',
  hired: 'Congratulations on your new job! 🎉',
  rejected: 'This one didn’t work out, but every application is practice. Keep going!',
}

function downloadIcs(iv: Interview, title: string, company: string) {
  const start = new Date(`${iv.date}T${iv.time}`)
  const end = new Date(start.getTime() + 60 * 60000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DiskarTech//EN', 'BEGIN:VEVENT', `UID:${iv.id}@diskartech.ph`, `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `SUMMARY:Interview — ${title} (${company})`, `LOCATION:${iv.location}`, `DESCRIPTION:${iv.notes.replace(/\n/g, ' ')}`,
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'diskartech-interview.ics' })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const db = useDB()
  const me = useMe()
  const app = db.applications.find((a) => a.id === id && a.userId === me.id)
  if (!app) return <div><PageHeader title="Application" back="/applications" /><EmptyState icon={SearchX} title="Application not found" /></div>

  const job = db.jobs.find((j) => j.id === app.jobId)!
  const emp = db.employers.find((e) => e.id === job.employerId)!
  const interview = ApplicationService.interviewFor(db, app.id)
  const cancelled = db.interviews.filter((i) => i.applicationId === app.id && i.status === 'cancelled').length
  const rejected = app.status === 'rejected'
  const reached = rejected ? PIPELINE.indexOf(app.timeline.filter((t) => t.status !== 'rejected').at(-1)?.status ?? 'submitted') : PIPELINE.indexOf(app.status)

  return (
    <div className="mx-auto max-w-2xl pb-6">
      <PageHeader title="Application" back="/applications" />

      <Link href={`/jobs/${job.id}`} className="card tap flex items-center gap-3.5 p-4">
        <CompanyLogo initials={emp.initials} color={emp.color} size={52} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-muted">{emp.name}</p>
          <p className="text-[17px] font-bold leading-snug">{job.title}</p>
          <p className="text-[12px] text-muted">{job.location} · {salaryRange(job.salaryMin, job.salaryMax)}</p>
        </div>
        <ExternalLink size={17} className="text-subtle" />
      </Link>

      <section className="card card-pad mt-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted">Current status</span>
          <StatusBadge status={app.status} />
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-[#4a5b75]">{HINTS[app.status]}</p>

        {/* Pipeline tracker */}
        <ol className="mt-5 flex items-start" aria-label="Hiring stages">
          {PIPELINE.map((s, i) => {
            const done = i <= reached
            const failedHere = rejected && i === reached + 1
            return (
              <li key={s} className="flex flex-1 flex-col items-center text-center">
                <div className="flex w-full items-center">
                  <span className={cn('h-0.5 flex-1', i === 0 ? 'opacity-0' : done ? 'bg-brand' : 'bg-line')} />
                  <span className={cn('grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                    failedHere ? 'bg-danger text-white' : done ? 'bg-brand text-white' : 'bg-[#e6ebf2] text-muted')}>
                    {failedHere ? <XCircle size={15} /> : done ? <Check size={14} /> : i + 1}
                  </span>
                  <span className={cn('h-0.5 flex-1', i === PIPELINE.length - 1 ? 'opacity-0' : i < reached ? 'bg-brand' : 'bg-line')} />
                </div>
                <span className={cn('mt-1.5 text-[10px] font-semibold leading-tight ', done ? 'text-ink' : 'text-muted')}>{STATUS_META[s].stage}</span>
              </li>
            )
          })}
        </ol>
      </section>

      {interview && interview.status === 'scheduled' && (
        <section className="mt-4 overflow-hidden rounded-[18px] bg-hero p-5 text-white shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-white/70"><CalendarDays size={15} />Interview scheduled</div>
          <p className="mt-2 text-[22px] font-bold">{formatSlot(interview.date, interview.time)}</p>
          <div className="mt-3 grid gap-2 text-[14px] text-white/90">
            <span className="flex items-center gap-2">{interview.type === 'Video call' ? <Video size={16} /> : interview.type === 'Phone call' ? <Phone size={16} /> : <MapPin size={16} />}{interview.type}</span>
            <span className="flex items-start gap-2 break-all"><MapPin size={16} className="mt-0.5 shrink-0" />{interview.location}</span>
            {interview.notes && <span className="flex items-start gap-2"><MessageSquareText size={16} className="mt-0.5 shrink-0" />{interview.notes}</span>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => downloadIcs(interview, job.title, emp.name)} className="btn btn-sm bg-white text-navy"><CalendarPlus size={16} />Add to calendar</button>
            {interview.location.startsWith('http') && <a href={interview.location} target="_blank" rel="noreferrer" className="btn btn-sm bg-white/15 text-white"><Video size={16} />Join link</a>}
          </div>
          <p className="mt-3 text-[11px] text-white/60">Last updated {timeAgo(interview.updatedAt)}</p>
        </section>
      )}
      {interview && interview.status === 'completed' && (
        <div className="card card-pad mt-4 flex items-center gap-3"><Check size={18} className="text-success" /><span className="text-[14px]">Interview completed on {formatSlot(interview.date, interview.time)}</span></div>
      )}
      {!interview && cancelled > 0 && app.status === 'interview' && (
        <div className="mt-4 rounded-2xl bg-warn-50 p-4 text-[14px] text-[#8a6100]">Your interview was cancelled. The employer may reschedule — we’ll notify you.</div>
      )}

      <h2 className="mb-3 mt-7 text-[18px] font-bold">Timeline</h2>
      <ol className="card card-pad">
        {[...app.timeline].reverse().map((t, i) => (
          <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
            {i < app.timeline.length - 1 && <span className="absolute left-[9px] top-6 h-[calc(100%-16px)] w-0.5 bg-line" />}
            <span className={cn('mt-0.5 size-5 shrink-0 rounded-full border-4', i === 0 ? 'border-brand-100 bg-brand' : 'border-[#eef1f5] bg-subtle')} />
            <div>
              <p className="text-[14px] font-semibold">{STATUS_META[t.status].label}</p>
              <p className="flex items-center gap-1 text-[12px] text-muted"><Clock size={12} />{formatDate(t.at, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
              {t.note && <p className="mt-1 text-[13px] text-[#4a5b75]">{t.note}</p>}
            </div>
          </li>
        ))}
      </ol>

      {app.coverNote && (
        <>
          <h2 className="mb-3 mt-7 text-[18px] font-bold">Your message</h2>
          <p className="card card-pad text-[14px] leading-relaxed text-[#4a5b75]">{app.coverNote}</p>
        </>
      )}
      <div className="mt-6 flex flex-wrap gap-2 text-[12px] text-muted"><Badge>Applied {formatDate(app.appliedAt)}</Badge><Badge>Updated {timeAgo(app.updatedAt)}</Badge></div>
    </div>
  )
}
