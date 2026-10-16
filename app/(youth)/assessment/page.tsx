'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, ListChecks, Sparkles, Target } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useAction, useMe } from '@/hooks/use-app'
import { AssessmentService, Recommendations } from '@/lib/services'
import { ASSESSMENT_AREAS } from '@/lib/data/assessment'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge, ProgressBar } from '@/components/ui/kit'
import { ConfirmDialog, Spinner } from '@/components/ui/sheet'
import { PageHeader } from '@/components/layout/page-header'

export default function Assessment() {
  const db = useDB()
  const me = useMe()
  const router = useRouter()
  const [run, pending] = useAction()
  const [started, setStarted] = useState(false)
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [quit, setQuit] = useState(false)
  const qs = AssessmentService.questions
  const latest = Recommendations.latestAssessment(db, me.id)

  if (!started) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title="Skills Assessment" back />
        <div className="rounded-[22px] bg-hero p-6 text-white">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/15"><Target size={24} /></span>
          <h2 className="mt-4 text-[22px] font-bold">Discover your strengths</h2>
          <p className="mt-2 text-[14px] text-white/80">Answer {qs.length} quick questions across {ASSESSMENT_AREAS.length} skill areas. We’ll update your skill profile and recommend jobs and courses that fit.</p>
          <div className="mt-4 flex gap-4 text-[13px] text-white/85"><span className="flex items-center gap-1.5"><Clock size={15} />About 5 minutes</span><span className="flex items-center gap-1.5"><ListChecks size={15} />{qs.length} questions</span></div>
        </div>
        <h3 className="mb-2.5 mt-6 text-[15px] font-bold">Skill areas</h3>
        <div className="flex flex-wrap gap-2">{ASSESSMENT_AREAS.map((a) => <Badge key={a} tone="blue">{a}</Badge>)}</div>
        {latest && (
          <Link href="/assessment/results" className="card tap mt-6 flex items-center justify-between p-4">
            <div><p className="text-[14px] font-semibold">Previous result: {latest.score}%</p><p className="text-[12px] text-muted">Taken {formatDate(latest.takenAt)}</p></div>
            <span className="link">View results</span>
          </Link>
        )}
        <button className="btn btn-primary mt-6 w-full" onClick={() => setStarted(true)}><Sparkles size={18} />{latest ? 'Retake assessment' : 'Start assessment'}</button>
        <p className="mt-3 text-center text-[12px] text-muted">There’s no pass or fail — answer honestly for the best recommendations.</p>
      </div>
    )
  }

  const q = qs[i]
  const answered = Object.keys(answers).length
  const submit = async () => {
    const r = await run(() => AssessmentService.submit(answers), { success: 'Assessment complete — your skill profile was updated' })
    if (r.ok) router.push('/assessment/results')
  }

  return (
    <div className="mx-auto max-w-xl pb-8">
      <PageHeader title="Skills Assessment" eyebrow={<Badge tone="blue">{q.area}</Badge>} actions={<button className="link" onClick={() => setQuit(true)}>Exit</button>} />
      <div className="mb-2 flex justify-between text-[13px] font-semibold"><span>Question {i + 1} of {qs.length}</span><span className="text-muted">{answered} answered</span></div>
      <ProgressBar value={(answered / qs.length) * 100} />
      <div key={q.id} className="page-enter card mt-5 p-5">
        <h2 className="text-[18px] font-bold leading-snug">{q.q}</h2>
        <div className="mt-5 grid gap-2.5" role="radiogroup">
          {q.options.map((o, oi) => {
            const sel = answers[q.id] === oi
            return (
              <button key={oi} role="radio" aria-checked={sel}
                onClick={() => { setAnswers({ ...answers, [q.id]: oi }); if (i < qs.length - 1) setTimeout(() => setI((x) => Math.min(x + 1, qs.length - 1)), 220) }}
                className={cn('rounded-2xl border-2 px-4 py-3.5 text-left text-[15px] transition', sel ? 'border-brand bg-brand-50 font-semibold text-brand' : 'border-line bg-white hover:border-[#c9d6e8]')}>
                {o}
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button className="btn btn-secondary" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        {i < qs.length - 1
          ? <button className="btn btn-secondary" onClick={() => setI(i + 1)}>{answers[q.id] === undefined ? 'Skip' : 'Next'}</button>
          : <button className="btn btn-primary" disabled={pending || answered === 0} onClick={submit}>{pending ? <><Spinner />Analyzing…</> : 'See my results'}</button>}
      </div>
      {i === qs.length - 1 && answered < qs.length && <p className="mt-3 text-center text-[12px] text-muted">{qs.length - answered} unanswered question(s) will count as incorrect.</p>}
      <ConfirmDialog open={quit} onClose={() => setQuit(false)} onConfirm={() => router.back()} title="Exit assessment?" message="Your answers won’t be saved." confirmLabel="Exit" tone="danger" />
    </div>
  )
}
