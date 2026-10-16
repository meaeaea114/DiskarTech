'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Award, BookOpen, Check, ChevronRight, Target } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useMe } from '@/hooks/use-app'
import { courseProgress, Recommendations } from '@/lib/services'
import { formatDate, shortDate } from '@/lib/format'
import { Badge, EmptyState, IconTile, ProgressBar, ProgressRing, Segmented, SectionHeader } from '@/components/ui/kit'
import { PageHeader } from '@/components/layout/page-header'

/** Consecutive days (ending today or yesterday) with learning activity. */
function streak(dates: string[]) {
  const days = new Set(dates.map((d) => new Date(d).toDateString()))
  let n = 0
  const cursor = new Date()
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1)
  while (days.has(cursor.toDateString())) { n++; cursor.setDate(cursor.getDate() - 1) }
  return n
}

export default function Progress() {
  const db = useDB()
  const me = useMe()
  const [tab, setTab] = useState<'learning' | 'assessments'>('learning')
  const enrollments = db.enrollments.filter((e) => e.userId === me.id)
  const completed = enrollments.filter((e) => e.completedAt)
  const certs = db.certificates.filter((c) => c.userId === me.id)
  const current = enrollments.filter((e) => !e.completedAt).sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))
  const assessments = db.assessments.filter((a) => a.userId === me.id).sort((a, b) => b.takenAt.localeCompare(a.takenAt))
  const dayStreak = useMemo(() => streak(enrollments.map((e) => e.lastActivityAt)), [enrollments])
  const latest = Recommendations.latestAssessment(db, me.id)

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My Progress" back="/learn" />
      <Segmented value={tab} onChange={setTab} options={[{ value: 'learning', label: 'Learning' }, { value: 'assessments', label: 'Assessments', count: assessments.length }]} className="max-w-xs" />

      {tab === 'learning' ? (
        <>
          <div className="card mt-5 p-5">
            <p className="text-[15px] font-semibold">Your learning journey</p>
            <div className="mt-3 flex justify-center">
              <ProgressRing value={enrollments.length ? (completed.length / enrollments.length) * 100 : 0} size={150} stroke={12}>
                <div><div className="text-[30px] font-bold">{completed.length}/{enrollments.length}</div><div className="text-[12px] text-muted">courses</div></div>
              </ProgressRing>
            </div>
            <div className="mt-5 grid grid-cols-3 text-center">
              {[[enrollments.length, 'Courses enrolled', 'text-brand'], [certs.length, 'Certificates', 'text-warn'], [dayStreak, 'Day streak', 'text-success']].map(([v, l, c]) => (
                <div key={l as string}><div className={`mx-auto grid size-10 place-items-center rounded-full bg-canvas text-[16px] font-bold ${c}`}>{v}</div><div className="mt-1.5 text-[12px] text-muted">{l}</div></div>
              ))}
            </div>
          </div>

          <SectionHeader title="Current Courses" href="/learn?tab=mine" />
          {current.length ? (
            <div className="grid gap-3">
              {current.map((e) => {
                const c = db.courses.find((x) => x.id === e.courseId)
                if (!c) return null
                const p = courseProgress(c, e)
                return (
                  <Link key={c.id} href={`/learn/${c.id}`} className="card tap p-4">
                    <div className="flex items-center gap-3">
                      <IconTile icon={c.icon} color={c.color} size={44} />
                      <div className="flex-1"><p className="text-[15px] font-bold">{c.title}</p><p className="text-[12px] text-muted">{e.completedLessons.length} of {c.lessons.length} lessons{e.quizScore != null && ` · quiz ${e.quizScore}%`}</p></div>
                      <span className="text-[13px] font-bold text-brand">{p}%</span>
                    </div>
                    <ProgressBar value={p} className="mt-3" />
                  </Link>
                )
              })}
            </div>
          ) : <EmptyState icon={BookOpen} title="No courses in progress" action={<Link href="/learn" className="btn btn-primary btn-sm">Browse courses</Link>} />}

          <SectionHeader title="Certificates" />
          {certs.length ? (
            <div className="grid gap-3">
              {certs.map((cert) => {
                const c = db.courses.find((x) => x.id === cert.courseId)
                return (
                  <Link key={cert.id} href={`/learn/certificates/${cert.id}`} className="card tap flex items-center gap-3 p-4">
                    <span className="grid size-11 place-items-center rounded-full bg-success-50 text-success"><Check size={20} /></span>
                    <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-bold">{c?.title}</p><p className="text-[12px] text-muted">Completed {shortDate(cert.issuedAt)} · Certificate earned</p><p className="mt-0.5 text-[12px] font-semibold text-brand">View certificate →</p></div>
                  </Link>
                )
              })}
            </div>
          ) : <EmptyState icon={Award} title="No certificates yet" message="Complete all lessons and pass the quiz to earn one." />}
        </>
      ) : (
        <div className="mt-5">
          {latest ? (
            <>
              <Link href="/assessment/results" className="card tap flex items-center gap-4 p-5">
                <ProgressRing value={latest.score} size={72} stroke={7}><span className="text-[16px] font-bold">{latest.score}%</span></ProgressRing>
                <div className="flex-1"><p className="text-[16px] font-bold">Latest skills assessment</p><p className="text-[13px] text-muted">Taken {formatDate(latest.takenAt)}</p><p className="mt-1 text-[13px] font-semibold text-brand">View skill gaps →</p></div>
              </Link>
              <SectionHeader title="History" />
              <div className="card divide-y divide-line">
                {assessments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3"><span className="text-[14px]">{formatDate(a.takenAt, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span><Badge tone={a.score >= 70 ? 'green' : 'blue'}>{a.score}%</Badge></div>
                ))}
              </div>
              <Link href="/assessment" className="btn btn-secondary mt-4 w-full"><Target size={17} />Retake assessment</Link>
            </>
          ) : <EmptyState icon={Target} title="No assessments yet" message="Discover your strengths and skill gaps in about 5 minutes." action={<Link href="/assessment" className="btn btn-primary btn-sm">Start assessment <ChevronRight size={16} /></Link>} />}
        </div>
      )}
    </div>
  )
}
