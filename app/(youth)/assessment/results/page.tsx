'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, RotateCcw, Target } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useMe } from '@/hooks/use-app'
import { Recommendations } from '@/lib/services'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge, EmptyState, ProgressBar, ProgressRing, SectionHeader } from '@/components/ui/kit'
import { PageHeader } from '@/components/layout/page-header'
import { CourseRow } from '@/components/features/learning'
import { JobCard } from '@/components/features/jobs'

export default function AssessmentResults() {
  const db = useDB()
  const me = useMe()
  const result = Recommendations.latestAssessment(db, me.id)
  const recs = useMemo(() => ({
    gaps: Recommendations.skillGaps(db, me.id),
    courses: Recommendations.recommendedCourses(db, me.id, 3),
    jobs: Recommendations.recommendedJobs(db, me.id, 2),
  }), [db, me.id])

  if (!result) {
    return <div className="mx-auto max-w-xl"><PageHeader title="Assessment results" back="/learn" /><EmptyState icon={Target} title="No results yet" message="Take the skills assessment to see your strengths and gaps." action={<Link href="/assessment" className="btn btn-primary btn-sm">Start assessment</Link>} /></div>
  }
  const strengths = result.areas.filter((a) => a.level === 'Advanced' || (a.level === 'Intermediate' && a.correct >= 2))
  const weaknesses = result.areas.filter((a) => a.level === 'Beginner')

  return (
    <div className="mx-auto max-w-3xl pb-6">
      <PageHeader title="Your Skill Profile" back="/learn" subtitle={`Assessment taken ${formatDate(result.takenAt)}`} />
      <div className="grid gap-4">
        <div className="card flex flex-col items-center p-5 text-center">
          <ProgressRing value={result.score} size={130}>
            <div><div className="text-[30px] font-bold">{result.score}%</div><div className="text-[12px] text-muted">overall</div></div>
          </ProgressRing>
          <p className="mt-3 text-[14px] text-muted">{result.score >= 75 ? 'Excellent! You’re job-ready in several areas.' : result.score >= 50 ? 'Solid foundation — a few gaps to close.' : 'Great start! Focus on the recommended courses below.'}</p>
          <Link href="/assessment" className="btn btn-secondary btn-sm mt-4"><RotateCcw size={15} />Retake</Link>
        </div>
        <div className="card card-pad">
          <h2 className="mb-3 text-[15px] font-bold">Results by skill</h2>
          {result.areas.map((a) => (
            <div key={a.area} className="mb-3.5 last:mb-0">
              <div className="mb-1.5 flex items-center justify-between text-[14px]">
                <span className="font-semibold">{a.area}</span>
                <span className="flex items-center gap-2"><span className="text-[12px] text-muted">{a.correct}/{a.total}</span><Badge tone={a.level === 'Advanced' ? 'green' : a.level === 'Intermediate' ? 'blue' : 'amber'}>{a.level}</Badge></span>
              </div>
              <ProgressBar value={(a.correct / a.total) * 100} tone={a.level === 'Advanced' ? 'success' : 'brand'} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="card card-pad">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-success"><ArrowUpRight size={18} />Strengths</h3>
          <div className="mt-3 flex flex-wrap gap-2">{strengths.length ? strengths.map((s) => <Badge key={s.area} tone="green">{s.area}</Badge>) : <span className="text-[13px] text-muted">Keep practicing — strengths will show here.</span>}</div>
        </div>
        <div className="card card-pad">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-warn"><ArrowDownRight size={18} />Areas to improve</h3>
          <div className="mt-3 flex flex-wrap gap-2">{weaknesses.length ? weaknesses.map((s) => <Badge key={s.area} tone="amber">{s.area}</Badge>) : <span className="text-[13px] text-muted">No weak areas — impressive!</span>}</div>
        </div>
      </div>

      <SectionHeader title="Skill Gaps for Your Career Goals" href="/career" actionLabel="Career paths" />
      <div className="card divide-y divide-line">
        {recs.gaps.length ? recs.gaps.map((g) => (
          <div key={g.skill} className="flex items-center gap-3 px-4 py-3">
            <span className={cn('size-2.5 rounded-full', g.current ? 'bg-warn' : 'bg-danger')} />
            <div className="flex-1"><p className="text-[14px] font-semibold">{g.skill}</p><p className="text-[12px] text-muted">{g.reason}</p></div>
            <Badge tone={g.current ? 'amber' : 'red'}>{g.current ?? 'Missing'}</Badge>
          </div>
        )) : <p className="p-4 text-[14px] text-muted">No gaps found for your top career paths. 🎉</p>}
      </div>

      <SectionHeader title="Recommended Courses" href="/learn" />
      <div className="grid gap-3">{recs.courses.map(({ course, reason }) => <CourseRow key={course.id} course={course} reason={reason} enrollment={db.enrollments.find((e) => e.userId === me.id && e.courseId === course.id)} />)}</div>

      <SectionHeader title="Jobs That Match Your Strengths" href="/jobs" />
      <div className="grid gap-3">{recs.jobs.map(({ job, match }) => <JobCard key={job.id} job={job} match={match.score} />)}</div>
    </div>
  )
}
