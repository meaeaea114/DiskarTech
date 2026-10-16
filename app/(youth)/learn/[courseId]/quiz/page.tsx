'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AlertTriangle, Award, Check, RotateCcw, X } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useAction, useMe } from '@/hooks/use-app'
import { CourseService } from '@/lib/services'
import { QUIZ_PASS_SCORE } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { ProgressBar, ProgressRing } from '@/components/ui/kit'
import { PageHeader } from '@/components/layout/page-header'
import { Spinner } from '@/components/ui/sheet'

type Result = Awaited<ReturnType<typeof CourseService.submitQuiz>>

export default function QuizPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const db = useDB()
  const me = useMe()
  const router = useRouter()
  const [run, pending] = useAction()
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<Result | null>(null)
  const course = db.courses.find((c) => c.id === courseId)
  const enrollment = course && CourseService.enrollment(db, me.id, course.id)

  useEffect(() => { if (course && !enrollment) router.replace(`/learn/${course.id}`) }, [course, enrollment, router])
  if (!course || !enrollment) return <PageHeader title="Quiz" back="/learn" />

  const remaining = course.lessons.filter((l) => !enrollment.completedLessons.includes(l.id))
  const q = course.quiz[i]
  const isLast = i === course.quiz.length - 1

  const submit = async () => {
    const r = await run(() => CourseService.submitQuiz(course.id, answers))
    if (r.ok) setResult(r.data)
  }
  const retake = () => { setResult(null); setAnswers([]); setI(0) }

  if (result) {
    return (
      <div className="mx-auto max-w-xl pb-8">
        <PageHeader title="Quiz results" back={`/learn/${course.id}`} />
        <div className="card flex flex-col items-center p-6 text-center">
          <ProgressRing value={result.score} size={140}>
            <div><div className="text-[32px] font-bold">{result.score}%</div><div className="text-[12px] text-muted">{result.correct}/{course.quiz.length} correct</div></div>
          </ProgressRing>
          <h2 className="mt-5 text-[22px] font-bold">{result.passed ? (result.completed ? 'Course complete! 🎉' : 'You passed!') : 'Almost there!'}</h2>
          <p className="mt-1.5 text-[14px] text-muted">
            {result.passed
              ? result.completed ? `You earned a certificate and your ${course.skills.join(' & ')} skills were added to your profile.`
                : remaining.length ? `Finish the remaining ${remaining.length} lesson(s) to complete the course and earn your certificate.` : 'Great work!'
              : `You need ${QUIZ_PASS_SCORE}% to pass. Review the lessons and try again.`}
          </p>
          <div className="mt-6 grid w-full gap-3">
            {result.completed && result.certificateId && <Link href={`/learn/certificates/${result.certificateId}`} className="btn btn-primary"><Award size={18} />View certificate</Link>}
            {result.passed && !result.completed && remaining[0] && <Link href={`/learn/${course.id}/lesson/${remaining[0].id}`} className="btn btn-primary">Continue lessons</Link>}
            {!result.passed && <button className="btn btn-primary" onClick={retake}><RotateCcw size={17} />Retake quiz</button>}
            <Link href="/learn/progress" className="btn btn-secondary">View my progress</Link>
          </div>
        </div>
        <h3 className="mb-3 mt-7 text-[17px] font-bold">Review answers</h3>
        <div className="grid gap-3">
          {course.quiz.map((qq, qi) => {
            const ok = answers[qi] === qq.answer
            return (
              <div key={qi} className="card card-pad">
                <div className="flex gap-2.5"><span className={cn('grid size-6 shrink-0 place-items-center rounded-full', ok ? 'bg-success-50 text-success' : 'bg-danger-50 text-danger')}>{ok ? <Check size={14} /> : <X size={14} />}</span><p className="text-[14px] font-semibold">{qq.q}</p></div>
                {!ok && <p className="ml-8 mt-1.5 text-[13px] text-muted">Your answer: {qq.options[answers[qi]] ?? '—'} · <span className="font-semibold text-success">Correct: {qq.options[qq.answer]}</span></p>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl pb-8">
      <PageHeader back={`/learn/${course.id}`} eyebrow={course.title} title="Final quiz" />
      {remaining.length > 0 && (
        <div className="mb-4 flex gap-2.5 rounded-2xl bg-warn-50 p-3.5 text-[13px] text-[#8a6100]"><AlertTriangle size={17} className="shrink-0" />You can take the quiz now, but you’ll need to finish {remaining.length} more lesson(s) to get the certificate.</div>
      )}
      <div className="mb-2 flex justify-between text-[13px] font-semibold"><span>Question {i + 1} of {course.quiz.length}</span><span className="text-muted">Pass: {QUIZ_PASS_SCORE}%</span></div>
      <ProgressBar value={((i + (answers[i] !== undefined ? 1 : 0)) / course.quiz.length) * 100} />
      <div key={i} className="page-enter card mt-5 p-5">
        <h2 className="text-[18px] font-bold leading-snug">{q.q}</h2>
        <div className="mt-5 grid gap-2.5" role="radiogroup">
          {q.options.map((o, oi) => {
            const sel = answers[i] === oi
            return (
              <button key={oi} role="radio" aria-checked={sel} onClick={() => setAnswers((a) => { const n = [...a]; n[i] = oi; return n })}
                className={cn('flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-[15px] transition', sel ? 'border-brand bg-brand-50 font-semibold text-brand' : 'border-line bg-white hover:border-[#c9d6e8]')}>
                <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border-2 text-[12px] font-bold', sel ? 'border-brand bg-brand text-white' : 'border-[#cfd8e5] text-muted')}>{String.fromCharCode(65 + oi)}</span>{o}
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button className="btn btn-secondary" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        {isLast
          ? <button className="btn btn-primary" disabled={answers.filter((a) => a !== undefined).length < course.quiz.length || pending} onClick={submit}>{pending ? <><Spinner />Grading…</> : 'Submit quiz'}</button>
          : <button className="btn btn-primary" disabled={answers[i] === undefined} onClick={() => setI(i + 1)}>Next</button>}
      </div>
    </div>
  )
}
