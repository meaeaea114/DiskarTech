'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Award, Check, CheckCircle2, Clock, HelpCircle, PlayCircle, SearchX, Share2 } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useAction, useMe } from '@/hooks/use-app'
import { CourseService, courseProgress } from '@/lib/services'
import { QUIZ_PASS_SCORE } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Badge, EmptyState, IconTile, ProgressBar } from '@/components/ui/kit'
import { BackButton, PageHeader } from '@/components/layout/page-header'
import { Spinner } from '@/components/ui/sheet'
import { toast } from '@/components/ui/toast'

export default function CourseDetails() {
  const { courseId } = useParams<{ courseId: string }>()
  const db = useDB()
  const me = useMe()
  const router = useRouter()
  const [run, pending] = useAction()
  const course = db.courses.find((c) => c.id === courseId && c.status === 'published')
  if (!course) return <div><PageHeader title="Course" back="/learn" /><EmptyState icon={SearchX} title="Course not available" message="This course may have been unpublished." /></div>

  const enrollment = CourseService.enrollment(db, me.id, course.id)
  const progress = courseProgress(course, enrollment)
  const next = CourseService.nextLesson(course, enrollment)
  const cert = db.certificates.find((c) => c.userId === me.id && c.courseId === course.id)
  const totalMin = course.lessons.reduce((n, l) => n + l.minutes, 0)

  const primary = async () => {
    if (!enrollment) {
      const res = await run(() => CourseService.enroll(course.id), { success: `Enrolled in ${course.title}` })
      if (res.ok) router.push(`/learn/${course.id}/lesson/${course.lessons[0].id}`)
      return
    }
    if (enrollment.completedAt && cert) return router.push(`/learn/certificates/${cert.id}`)
    router.push(next ? `/learn/${course.id}/lesson/${next.id}` : `/learn/${course.id}/quiz`)
  }
  const label = !enrollment ? 'Enroll & Start Course' : enrollment.completedAt ? 'View Certificate' : next ? (enrollment.completedLessons.length ? 'Continue Course' : 'Start Course') : 'Take Final Quiz'

  return (
    <div className="-mx-5 -mt-4">
      <div className="relative bg-navy px-5 pb-10 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="flex justify-between">
          <BackButton href="/learn" />
          <button onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); toast.success('Course link copied') } catch { toast.info(window.location.href) } }} className="grid size-10 place-items-center rounded-full bg-white text-navy" aria-label="Share course"><Share2 size={18} /></button>
        </div>
        <div className="mx-auto mt-5 flex max-w-sm items-center justify-center rounded-[20px] bg-[#1e3d70] p-6">
          <IconTile icon={course.icon} color={course.color} size={84} className="rounded-[22px]" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-32">
        <div className="card relative -mt-6 p-5">
          <h1 className="text-[24px] font-bold leading-tight tracking-tight">{course.title}</h1>
          <p className="mt-1 text-[13px] text-muted">{course.provider}</p>
          <div className="mt-3 flex flex-wrap gap-2"><Badge tone="blue">{course.level}</Badge><Badge><Clock size={12} />{course.hours} hours</Badge><Badge tone="green">{course.free ? 'Free' : 'Paid'} · Online</Badge></div>
          {enrollment && (
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-[13px]"><span className="font-semibold">{enrollment.completedAt ? 'Completed' : 'Your progress'}</span><span className="font-bold text-brand">{progress}%</span></div>
              <ProgressBar value={progress} tone={enrollment.completedAt ? 'success' : 'brand'} />
            </div>
          )}
        </div>

        <h2 className="mb-2 mt-7 text-[18px] font-bold">About This Course</h2>
        <p className="text-[14px] leading-relaxed text-[#4a5b75]">{course.description}</p>

        <h2 className="mb-3 mt-7 text-[18px] font-bold">What You’ll Learn</h2>
        <ul className="space-y-2.5">{course.outcomes.map((o) => <li key={o} className="flex gap-2.5 text-[14px] text-[#4a5b75]"><Check size={17} className="mt-0.5 shrink-0 text-success" />{o}</li>)}</ul>
        <div className="mt-4 flex flex-wrap gap-1.5">{course.skills.map((s) => <Badge key={s} tone="blue">+ {s}</Badge>)}</div>

        <h2 className="mb-3 mt-7 text-[18px] font-bold">Lessons <span className="text-[13px] font-medium text-muted">· {course.lessons.length} lessons · {totalMin} min</span></h2>
        <div className="card divide-y divide-line">
          {course.lessons.map((l, i) => {
            const done = enrollment?.completedLessons.includes(l.id)
            const content = (
              <>
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold', done ? 'bg-success-50 text-success' : 'bg-brand-50 text-brand')}>{done ? <Check size={17} /> : i + 1}</span>
                <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold">{l.title}</p><p className="text-[12px] text-muted">{l.minutes} min</p></div>
                {enrollment && <PlayCircle size={20} className={done ? 'text-subtle' : 'text-brand'} />}
              </>
            )
            return enrollment
              ? <Link key={l.id} href={`/learn/${course.id}/lesson/${l.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-canvas/60">{content}</Link>
              : <div key={l.id} className="flex items-center gap-3 px-4 py-3.5 opacity-80">{content}</div>
          })}
          {(() => {
            const content = (
              <>
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', enrollment?.quizPassed ? 'bg-success-50 text-success' : 'bg-warn-50 text-warn')}>{enrollment?.quizPassed ? <CheckCircle2 size={18} /> : <HelpCircle size={18} />}</span>
                <div className="flex-1"><p className="text-[14px] font-semibold">Final quiz</p><p className="text-[12px] text-muted">{course.quiz.length} questions · pass with {QUIZ_PASS_SCORE}%{enrollment?.quizScore != null && ` · best score ${enrollment.quizScore}%`}</p></div>
                {enrollment?.completedAt && <Award size={20} className="text-gold" />}
              </>
            )
            return enrollment
              ? <Link href={`/learn/${course.id}/quiz`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-canvas/60">{content}</Link>
              : <div className="flex items-center gap-3 px-4 py-3.5 opacity-80">{content}</div>
          })()}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(70px+env(safe-area-inset-bottom))] z-20 border-t border-line bg-white/90 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl"><button className="btn btn-primary w-full" onClick={primary} disabled={pending}>{pending ? <><Spinner />Enrolling…</> : label}</button></div>
      </div>
    </div>
  )
}
