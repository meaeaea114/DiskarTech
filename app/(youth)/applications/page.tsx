'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bookmark, CalendarDays, ChevronRight, ClipboardList, Video } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useMe, useQueryParam, useSimulatedLoad } from '@/hooks/use-app'
import { ApplicationService, formatSlot } from '@/lib/services'
import { shortDate } from '@/lib/format'
import { CardSkeleton, CompanyLogo, EmptyState, Segmented, StatusBadge } from '@/components/ui/kit'
import { PageHeader } from '@/components/layout/page-header'
import { JobCard } from '@/components/features/jobs'

type Tab = 'active' | 'saved' | 'interviews' | 'closed'

export default function Applications() {
  const db = useDB()
  const me = useMe()
  const initial = useQueryParam('tab') as Tab | null
  const [tab, setTab] = useState<Tab>(initial && ['active', 'saved', 'interviews', 'closed'].includes(initial) ? initial : 'active')
  const loading = useSimulatedLoad(tab, 350)

  const { active, closed, saved, interviews } = useMemo(() => {
    const apps = ApplicationService.forUser(db, me.id)
    return {
      active: apps.filter((a) => !['hired', 'rejected'].includes(a.status)),
      closed: apps.filter((a) => ['hired', 'rejected'].includes(a.status)),
      saved: (db.saved[me.id] ?? []).map((id) => db.jobs.find((j) => j.id === id)).filter((j) => !!j),
      interviews: ApplicationService.upcomingInterviews(db, apps.map((a) => a.id)),
    }
  }, [db, me.id])

  const list = tab === 'active' ? active : closed

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My Applications" bell />
      <Segmented value={tab} onChange={setTab} options={[
        { value: 'active', label: 'Active', count: active.length },
        { value: 'saved', label: 'Saved', count: saved.length },
        { value: 'interviews', label: 'Interviews', count: interviews.length },
        { value: 'closed', label: 'Closed', count: closed.length },
      ]} className="[&>button]:px-1 [&>button]:text-[12px]" />

      <div className="mt-5">
        {loading ? <CardSkeleton rows={3} /> : tab === 'saved' ? (
          saved.length ? <div className="grid gap-3">{saved.map((j) => <JobCard key={j.id} job={j} />)}</div>
            : <EmptyState icon={Bookmark} title="No saved jobs yet" message="Tap the bookmark on any job to save it for later." action={<Link href="/jobs" className="btn btn-primary btn-sm">Browse jobs</Link>} />
        ) : tab === 'interviews' ? (
          interviews.length ? (
            <div className="grid gap-3">
              {interviews.map((iv) => {
                const app = db.applications.find((a) => a.id === iv.applicationId)!
                const job = db.jobs.find((j) => j.id === app.jobId)!
                const emp = db.employers.find((e) => e.id === job.employerId)!
                return (
                  <Link key={iv.id} href={`/applications/${app.id}`} className="card tap flex items-center gap-3.5 p-4">
                    <span className="grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet">{iv.type === 'Video call' ? <Video size={21} /> : <CalendarDays size={21} />}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold">{formatSlot(iv.date, iv.time)}</p>
                      <p className="truncate text-[13px] text-muted">{job.title} · {emp.name}</p>
                      <p className="text-[12px] text-muted">{iv.type}</p>
                    </div>
                    <ChevronRight size={18} className="text-subtle" />
                  </Link>
                )
              })}
            </div>
          ) : <EmptyState icon={CalendarDays} title="No upcoming interviews" message="When an employer schedules an interview, it will show up here." />
        ) : list.length ? (
          <div className="grid gap-3">
            {list.map((a) => {
              const job = db.jobs.find((j) => j.id === a.jobId)
              const emp = db.employers.find((e) => e.id === job?.employerId)
              if (!job || !emp) return null
              return (
                <Link key={a.id} href={`/applications/${a.id}`} className="card tap flex items-start gap-3.5 p-4 hover:shadow-[0_8px_24px_rgba(38,59,87,0.11)]">
                  <CompanyLogo initials={emp.initials} color={emp.color} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-bold leading-snug">{job.title}</p>
                    <p className="text-[13px] text-muted">{emp.name}</p>
                    <div className="mt-2"><StatusBadge status={a.status} /></div>
                    <p className="mt-2 text-[12px] text-muted">Applied {shortDate(a.appliedAt)} · {job.location}</p>
                  </div>
                  <ChevronRight size={18} className="mt-1 text-subtle" />
                </Link>
              )
            })}
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title={tab === 'active' ? 'You haven’t applied to any jobs yet' : 'No closed applications'}
            message={tab === 'active' ? 'Find a role that fits your skills and apply in minutes.' : 'Applications that end in a hire or rejection appear here.'}
            action={tab === 'active' ? <Link href="/jobs" className="btn btn-primary btn-sm">Find jobs</Link> : undefined} />
        )}
      </div>
    </div>
  )
}
