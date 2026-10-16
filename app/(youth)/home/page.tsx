'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { CalendarDays, ChevronRight, FileText, GraduationCap, Search, Target } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useMe, useSimulatedLoad } from '@/hooks/use-app'
import { ApplicationService, JobService, NotificationService, ProfileService, Recommendations, formatSlot } from '@/lib/services'
import { timeAgo } from '@/lib/format'
import { Avatar, CardSkeleton, StatusBadge } from '@/components/ui/kit'
import { JobCard } from '@/components/features/jobs'
import { ContinueCard, CourseRow } from '@/components/features/learning'
import { NotificationIcon } from '@/components/features/notifications'

const englishGreeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Home() {
  const db = useDB()
  const me = useMe()
  const loading = useSimulatedLoad()
  const profile = ProfileService.get(db, me.id)
  const completion = ProfileService.completion(profile)

  const data = useMemo(() => {
    const apps = ApplicationService.forUser(db, me.id)
    const enrollments = db.enrollments.filter((e) => e.userId === me.id)
    return {
      apps,
      active: apps.filter((a) => !['hired', 'rejected'].includes(a.status)),
      interviews: ApplicationService.upcomingInterviews(db, apps.map((a) => a.id)),
      inProgress: enrollments.filter((e) => !e.completedAt).sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)),
      openJobs: db.jobs.filter(JobService.isOpen).length,
      jobs: Recommendations.recommendedJobs(db, me.id, 3),
      courses: Recommendations.recommendedCourses(db, me.id, 1),
      topPath: Recommendations.careerPathMatches(profile)[0],
      notifications: NotificationService.forUser(db, me.id).slice(0, 2),
    }
  }, [db, me.id, profile])

  const firstName = profile?.firstName ?? me.name.split(' ')[0]
  const nextInterview = data.interviews[0]
  const nextApp = nextInterview && db.applications.find((a) => a.id === nextInterview.applicationId)
  const nextJob = nextApp && db.jobs.find((j) => j.id === nextApp.jobId)
  const continueCourse = data.inProgress[0] && db.courses.find((c) => c.id === data.inProgress[0].courseId)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const quick = [
    { href: '/jobs', icon: Search, tone: 'bg-[#e6f1ff] text-[#2675be]', title: 'Find jobs', sub: `${data.openJobs} open matches` },
    { href: '/career', icon: Target, tone: 'bg-[#fff1d7] text-[#c38b29]', title: 'Career guide', sub: data.topPath ? `${data.topPath.path.title} · ${data.topPath.score}%` : 'For your next step' },
    { href: '/learn', icon: GraduationCap, tone: 'bg-[#e6f5ed] text-[#33966a]', title: 'Learn skills', sub: continueCourse ? 'Continue learning' : 'Free courses' },
    { href: '/resume', icon: FileText, tone: 'bg-[#f8e9e8] text-[#ac5d60]', title: 'Build resume', sub: completion.percent >= 80 ? 'Looks great so far' : `${completion.percent}% complete` },
  ]

  return (
    <div className="pt-1">
      {/* Greeting */}
      <section className="mb-[22px] mt-1 flex items-start justify-between">
        <div>
          <p className="eyebrow mb-[7px]">{today}</p>
          <h1 className="mb-2 text-[27px] leading-[1.08]">{englishGreeting()}, {firstName}</h1>
          <p className="text-[12px] leading-[1.45] text-muted">Your next opportunity is closer than you think.</p>
        </div>
        <Link href="/profile" aria-label="Your profile"><Avatar name={me.name} color="#bed7f1" size={38} className="text-[#175e9e]" /></Link>
      </section>

      {/* Career profile card */}
      <Link href={completion.missing[0]?.href ?? '/profile'} className="bg-hero tap flex items-center justify-between gap-3 rounded-[19px] p-5 text-white shadow-[var(--shadow-hero)]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[1.35px] text-[#c5dcf2]">Your career profile</span>
          <h3 className="mb-1.5 mt-[7px] font-serif text-[19px] font-medium">{completion.percent < 100 ? 'Make your profile stand out' : 'Your profile is complete'}</h3>
          <p className="max-w-[210px] text-[12px] text-[#cfe3f8]">{completion.percent < 100 ? 'Complete your profile to unlock better matches.' : 'Employers can see your full story.'}</p>
        </div>
        <ProfileRing value={completion.percent} />
      </Link>

      {/* Quick actions */}
      <SectionHead title="Quick actions" />
      <div className="grid grid-cols-2 gap-2.5">
        {quick.map((q) => (
          <Link key={q.href} href={q.href} className="tap rounded-[15px] border border-[#edf0f2] bg-white p-[13px] shadow-[0_3px_10px_rgba(32,53,75,0.03)]">
            <span className={`grid size-[35px] place-items-center rounded-[11px] ${q.tone}`}><q.icon size={20} /></span>
            <b className="mb-1 mt-2.5 block text-[13px]">{q.title}</b>
            <small className="block truncate text-[10px] text-muted">{q.sub}</small>
          </Link>
        ))}
      </div>

      {/* Upcoming interview */}
      {nextInterview && nextJob && nextApp && (
        <Link href={`/applications/${nextApp.id}`} className="tap mt-[22px] flex items-center gap-3 rounded-[15px] border border-[#e5ebef] bg-white p-[15px] text-[#43779c]">
          <CalendarDays size={19} />
          <span className="min-w-0 flex-1">
            <b className="block truncate text-[13px] text-ink">Interview · {nextJob.title}</b>
            <small className="mt-1 block text-[10px] text-muted">{formatSlot(nextInterview.date, nextInterview.time)} · {nextInterview.type}</small>
          </span>
          <ChevronRight size={17} />
        </Link>
      )}

      {/* Jobs for you */}
      <SectionHead title="Jobs for you" href="/jobs" action="See all" />
      {loading ? <CardSkeleton rows={2} /> : data.jobs.length ? (
        <div className="grid gap-[11px]">{data.jobs.map(({ job, match }) => <JobCard key={job.id} job={job} match={match.score} />)}</div>
      ) : <p className="card card-pad text-[12px] text-muted">You’ve applied to every open match. New jobs are posted daily!</p>}

      {/* Applications */}
      {data.apps.length > 0 && (
        <>
          <SectionHead title="Your applications" href="/applications" action={`${data.active.length} active`} />
          <div className="card divide-y divide-[#eff1f2]">
            {data.apps.slice(0, 3).map((a) => {
              const job = db.jobs.find((j) => j.id === a.jobId)
              const emp = db.employers.find((e) => e.id === job?.employerId)
              return (
                <Link key={a.id} href={`/applications/${a.id}`} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1"><b className="block truncate text-[13px]">{job?.title}</b><p className="mt-1 truncate text-[11px] text-muted">{emp?.name}</p></div>
                  <StatusBadge status={a.status} />
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* Learning */}
      <SectionHead title="Pick up where you left off" href="/learn" action="View all" />
      {continueCourse && data.inProgress[0]
        ? <ContinueCard course={continueCourse} enrollment={data.inProgress[0]} />
        : data.courses[0] && <CourseRow course={data.courses[0].course} reason={data.courses[0].reason} />}

      {/* Updates */}
      {data.notifications.length > 0 && (
        <>
          <SectionHead title="Latest updates" href="/notifications" action="See all" />
          <div className="card divide-y divide-[#eff1f2]">
            {data.notifications.map((n) => (
              <Link key={n.id} href={n.href} onClick={() => NotificationService.markRead(n.id)} className="flex items-center gap-3 px-4 py-3">
                <NotificationIcon icon={n.icon} size={32} />
                <div className="min-w-0 flex-1"><b className="block truncate text-[13px]">{n.title}</b><p className="mt-0.5 text-[10px] text-muted">{timeAgo(n.createdAt)}</p></div>
                {!n.read && <span className="size-2 rounded-full bg-brand" />}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SectionHead({ title, href, action }: { title: string; href?: string; action?: string }) {
  return (
    <div className="mb-3 mt-[25px] flex items-center justify-between">
      <h2 className="section-title">{title}</h2>
      {href && <Link href={href} className="flex items-center gap-[3px] text-[12px] text-brand">{action}<ChevronRight size={15} /></Link>}
    </div>
  )
}

/** Circular profile-completion indicator from the reference (white arc on a light-blue track). */
function ProfileRing({ value }: { value: number }) {
  const r = 27
  const c = 2 * Math.PI * r
  return (
    <span className="relative grid size-16 shrink-0 place-items-center" role="img" aria-label={`Profile ${value}% complete`}>
      <svg width="64" height="64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#9bc8ed" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <strong className="text-[13px]">{value}%</strong>
    </span>
  )
}
