'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Lightbulb } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useAction, useMe } from '@/hooks/use-app'
import { CourseService, courseProgress } from '@/lib/services'
import { ProgressBar } from '@/components/ui/kit'
import { PageHeader } from '@/components/layout/page-header'
import { Spinner } from '@/components/ui/sheet'

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const db = useDB()
  const me = useMe()
  const router = useRouter()
  const [run, pending] = useAction()
  const course = db.courses.find((c) => c.id === courseId)
  const enrollment = course && CourseService.enrollment(db, me.id, course.id)

  useEffect(() => {
    if (course && !enrollment) router.replace(`/learn/${course.id}`)
  }, [course, enrollment, router])

  if (!course || !enrollment) return <PageHeader title="Lesson" back="/learn" />
  const idx = course.lessons.findIndex((l) => l.id === lessonId)
  const lesson = course.lessons[idx]
  if (!lesson) return <PageHeader title="Lesson not found" back={`/learn/${course.id}`} />

  const done = enrollment.completedLessons.includes(lesson.id)
  const prev = course.lessons[idx - 1]
  const next = course.lessons[idx + 1]
  const nextHref = next ? `/learn/${course.id}/lesson/${next.id}` : `/learn/${course.id}/quiz`

  const complete = async () => {
    if (!done) {
      const r = await run(() => CourseService.completeLesson(course.id, lesson.id), { success: `Lesson ${idx + 1} complete` })
      if (!r.ok) return
    }
    router.push(nextHref)
  }

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <PageHeader back={`/learn/${course.id}`} eyebrow={`${course.title} · Lesson ${idx + 1} of ${course.lessons.length}`} title={lesson.title} />
      <ProgressBar value={courseProgress(course, enrollment)} />
      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted"><Clock size={13} />{lesson.minutes} min read{done && <><span>·</span><CheckCircle2 size={13} className="text-success" /><span className="text-success">Completed</span></>}</p>

      <article className="card mt-5 p-5">
        <p className="text-[17px] font-semibold leading-relaxed">{lesson.summary}</p>
        <h2 className="mb-3 mt-6 text-[13px] font-bold uppercase tracking-wider text-brand">Key points</h2>
        <ol className="space-y-4">
          {lesson.points.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-[13px] font-bold text-brand">{i + 1}</span>
              <p className="pt-0.5 text-[15px] leading-relaxed text-[#36475f]">{p}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex gap-3 rounded-2xl bg-[#fff8e6] p-4 text-[14px] text-[#7a5a00]">
          <Lightbulb size={19} className="shrink-0" />
          <span>Try it: write down one way you could use “{lesson.title.toLowerCase()}” in a job you want. Employers love concrete examples in interviews.</span>
        </div>
      </article>

      <div className="mt-6 grid grid-cols-[auto_1fr] gap-3">
        {prev ? <Link href={`/learn/${course.id}/lesson/${prev.id}`} className="btn btn-secondary px-4" aria-label="Previous lesson"><ChevronLeft size={19} /></Link> : <span />}
        <button className="btn btn-primary" onClick={complete} disabled={pending}>
          {pending ? <Spinner /> : null}{done ? (next ? 'Next lesson' : 'Go to final quiz') : next ? 'Mark complete & continue' : 'Mark complete & take quiz'}<ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
