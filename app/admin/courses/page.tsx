'use client'

import { useState } from 'react'
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useAction } from '@/hooks/use-app'
import { CourseService } from '@/lib/services'
import { uid } from '@/lib/services/core'
import { SKILL_CATALOG, SKILL_LEVELS } from '@/lib/constants'
import type { Course } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge, EmptyState, Field, IconTile, ListInput, Select, SkillPicker, TextArea, TextInput } from '@/components/ui/kit'
import { Sheet, Spinner } from '@/components/ui/sheet'
import { PageHeader } from '@/components/layout/page-header'

const BLANK = (): Course => ({
  id: uid('crs'), title: '', category: 'Software Development', level: 'Beginner', provider: 'DiskarTech Academy', hours: 1,
  description: '', outcomes: [], skills: [], color: '#E4EEFF', icon: 'book', status: 'draft', free: true,
  lessons: [{ id: 'l1', title: '', minutes: 20, summary: '', points: [] }],
  quiz: [{ q: '', options: ['', '', '', ''], answer: 0 }],
})

export default function AdminCourses() {
  const db = useDB()
  const [run, pending] = useAction()
  const [editing, setEditing] = useState<Course | null>(null)
  const [error, setError] = useState('')

  const save = async () => {
    if (!editing) return
    const c = { ...editing, lessons: editing.lessons.filter((l) => l.title.trim()), quiz: editing.quiz.filter((q) => q.q.trim() && q.options.every((o) => o.trim())) }
    if (!c.title.trim()) return setError('Course title is required')
    if (!c.lessons.length) return setError('Add at least one lesson with a title')
    if (!c.quiz.length) return setError('Add at least one complete quiz question (question + 4 options)')
    setError('')
    const r = await run(() => CourseService.saveCourse(c), { success: 'Course saved' })
    if (r.ok) setEditing(null)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Courses & Content" back="/admin" actions={<button className="btn btn-primary btn-sm" onClick={() => { setError(''); setEditing(BLANK()) }}><Plus size={16} />New course</button>} />
      <div className="grid gap-3">
        {db.courses.length === 0 && <EmptyState icon={BookOpen} title="No courses yet" />}
        {db.courses.map((c) => {
          const enrolled = db.enrollments.filter((e) => e.courseId === c.id)
          return (
            <div key={c.id} className="card p-4">
              <div className="flex items-start gap-3">
                <IconTile icon={c.icon} color={c.color} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2"><p className="text-[14px] font-bold leading-snug">{c.title}</p><Badge tone={c.status === 'published' ? 'green' : 'gray'}>{c.status}</Badge></div>
                  <p className="mt-0.5 text-[11px] text-muted">{c.category} · {c.level} · {c.lessons.length} lessons</p>
                  <p className="text-[11px] text-muted">{enrolled.length} enrolled · {enrolled.filter((e) => e.completedAt).length} completed</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 border-t border-line pt-3">
                <button className="btn btn-secondary btn-sm flex-1" onClick={() => { setError(''); setEditing(structuredClone(c)) }}><Pencil size={14} />Edit</button>
                <button className={cn('btn btn-sm flex-1', c.status === 'published' ? 'btn-secondary' : 'btn-primary')} disabled={pending}
                  onClick={() => run(() => CourseService.setCourseStatus(c.id, c.status === 'published' ? 'draft' : 'published'), { success: c.status === 'published' ? 'Course unpublished' : 'Course published — youth users notified' })}>
                  {c.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Sheet open={!!editing} onClose={() => !pending && setEditing(null)} size="lg" title={editing && db.courses.some((c) => c.id === editing.id) ? 'Edit course' : 'New course'}
        footer={<div>{error && <p className="mb-2 text-[13px] font-medium text-danger">{error}</p>}<button className="btn btn-primary w-full" onClick={save} disabled={pending}>{pending ? <Spinner /> : 'Save course'}</button></div>}>
        {editing && (
          <div className="space-y-4">
            <Field label="Title"><TextInput value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category" className="col-span-2"><TextInput value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></Field>
              <Field label="Level"><Select value={editing.level} onChange={(e) => setEditing({ ...editing, level: e.target.value as Course['level'] })}>{SKILL_LEVELS.map((l) => <option key={l}>{l}</option>)}</Select></Field>
              <Field label="Hours"><TextInput type="number" min={0.5} step={0.5} value={editing.hours} onChange={(e) => setEditing({ ...editing, hours: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Provider"><TextInput value={editing.provider} onChange={(e) => setEditing({ ...editing, provider: e.target.value })} /></Field>
            <Field label="Description"><TextArea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <Field group label="What learners will achieve"><ListInput value={editing.outcomes} onChange={(outcomes) => setEditing({ ...editing, outcomes })} placeholder="Add an outcome" /></Field>
            <Field group label="Skills granted on completion"><SkillPicker value={editing.skills} onChange={(skills) => setEditing({ ...editing, skills })} catalog={SKILL_CATALOG} /></Field>

            <h3 className="pt-2 text-[15px] font-bold">Lessons</h3>
            {editing.lessons.map((l, i) => (
              <div key={l.id} className="card space-y-2 p-3">
                <div className="flex gap-2">
                  <TextInput value={l.title} placeholder={`Lesson ${i + 1} title`} onChange={(e) => setEditing({ ...editing, lessons: editing.lessons.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                  <TextInput type="number" className="w-24" value={l.minutes} aria-label="Minutes" onChange={(e) => setEditing({ ...editing, lessons: editing.lessons.map((x, j) => (j === i ? { ...x, minutes: Number(e.target.value) } : x)) })} />
                  <button className="px-2 text-muted hover:text-danger" aria-label="Remove lesson" onClick={() => setEditing({ ...editing, lessons: editing.lessons.filter((_, j) => j !== i) })}><Trash2 size={16} /></button>
                </div>
                <TextInput value={l.summary} placeholder="Summary" onChange={(e) => setEditing({ ...editing, lessons: editing.lessons.map((x, j) => (j === i ? { ...x, summary: e.target.value } : x)) })} />
                <TextArea value={l.points.join('\n')} placeholder="Key points (one per line)" className="min-h-16" onChange={(e) => setEditing({ ...editing, lessons: editing.lessons.map((x, j) => (j === i ? { ...x, points: e.target.value.split('\n') } : x)) })} />
              </div>
            ))}
            <button className="btn btn-tinted btn-sm" onClick={() => setEditing({ ...editing, lessons: [...editing.lessons, { id: `l${Date.now().toString(36)}`, title: '', minutes: 20, summary: '', points: [] }] })}><Plus size={15} />Add lesson</button>

            <h3 className="pt-2 text-[15px] font-bold">Quiz</h3>
            {editing.quiz.map((q, i) => (
              <div key={i} className="card space-y-2 p-3">
                <div className="flex gap-2">
                  <TextInput value={q.q} placeholder={`Question ${i + 1}`} onChange={(e) => setEditing({ ...editing, quiz: editing.quiz.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} />
                  <button className="px-2 text-muted hover:text-danger" aria-label="Remove question" onClick={() => setEditing({ ...editing, quiz: editing.quiz.filter((_, j) => j !== i) })}><Trash2 size={16} /></button>
                </div>
                {q.options.map((o, oi) => (
                  <label key={oi} className="flex items-center gap-2">
                    <input type="radio" name={`ans-${i}`} checked={q.answer === oi} onChange={() => setEditing({ ...editing, quiz: editing.quiz.map((x, j) => (j === i ? { ...x, answer: oi } : x)) })} className="size-4 accent-[var(--color-success)]" aria-label={`Mark option ${oi + 1} correct`} />
                    <TextInput value={o} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="py-2"
                      onChange={(e) => setEditing({ ...editing, quiz: editing.quiz.map((x, j) => (j === i ? { ...x, options: x.options.map((y, k) => (k === oi ? e.target.value : y)) } : x)) })} />
                  </label>
                ))}
              </div>
            ))}
            <button className="btn btn-tinted btn-sm" onClick={() => setEditing({ ...editing, quiz: [...editing.quiz, { q: '', options: ['', '', '', ''], answer: 0 }] })}><Plus size={15} />Add question</button>
            <p className="text-[12px] text-muted">Select the radio button next to the correct answer. New courses are saved as drafts — publish them from the list.</p>
          </div>
        )}
      </Sheet>
    </div>
  )
}
