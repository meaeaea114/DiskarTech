'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Award, BarChart3, BookOpen, ChevronRight, Search, SearchX, Target, X } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useMe, useQueryParam, useSimulatedLoad } from '@/hooks/use-app'
import { Recommendations } from '@/lib/services'
import { SKILL_LEVELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { CardSkeleton, EmptyState, Segmented, SectionHeader } from '@/components/ui/kit'
import { PageHeader } from '@/components/layout/page-header'
import { ContinueCard, CourseRow } from '@/components/features/learning'

type Tab = 'recommended' | 'mine' | 'all'

export default function Learn() {
  const db = useDB()
  const me = useMe()
  const initial = useQueryParam('tab') as Tab | null
  const [tab, setTab] = useState<Tab>(initial ?? 'recommended')
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('All')
  const [level, setLevel] = useState('Any level')
  const loading = useSimulatedLoad(tab, 350)

  const published = db.courses.filter((c) => c.status === 'published')
  const enrollments = db.enrollments.filter((e) => e.userId === me.id)
  const inProgress = enrollments.filter((e) => !e.completedAt).sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))
  const completed = enrollments.filter((e) => e.completedAt)
  const recommended = useMemo(() => Recommendations.recommendedCourses(db, me.id, 4), [db, me.id])
  const categories = ['All', ...new Set(published.map((c) => c.category))]

  const filtered = published.filter((c) =>
    (!q || `${c.title} ${c.description} ${c.skills.join(' ')} ${c.category}`.toLowerCase().includes(q.toLowerCase())) &&
    (category === 'All' || c.category === category) && (level === 'Any level' || c.level === level))

  const enrollmentFor = (id: string) => enrollments.find((e) => e.courseId === id)
  const current = inProgress[0] && db.courses.find((c) => c.id === inProgress[0].courseId)

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Skills & Training" bell actions={<Link href="/learn/progress" className="grid size-10 place-items-center rounded-full bg-white text-navy shadow-[var(--shadow-card)]" aria-label="My progress"><BarChart3 size={19} /></Link>} />
      <Segmented value={tab} onChange={setTab} options={[{ value: 'recommended', label: 'Recommended' }, { value: 'mine', label: 'My Courses', count: enrollments.length }, { value: 'all', label: 'All' }]} />

      {loading ? <div className="mt-6"><CardSkeleton rows={3} /></div> : tab === 'recommended' ? (
        <div className="mt-6">
          {current && inProgress[0] && <><SectionHeader title="Continue Learning" /><ContinueCard course={current} enrollment={inProgress[0]} /></>}
          <Link href="/assessment" className="tap mt-5 flex items-center gap-3 rounded-[18px] bg-brand-50 p-4">
            <span className="grid size-11 place-items-center rounded-full bg-white text-brand"><Target size={20} /></span>
            <div className="flex-1"><p className="text-[15px] font-bold">Find your skill gaps</p><p className="text-[12px] text-[#3e5677]">Take a 5-minute assessment for smarter recommendations</p></div>
            <ChevronRight size={18} className="text-brand" />
          </Link>
          <SectionHeader title="Recommended for You" action={() => setTab('all')} />
          <div className="grid gap-3">{recommended.map(({ course, reason }) => <CourseRow key={course.id} course={course} reason={reason} enrollment={enrollmentFor(course.id)} />)}</div>
        </div>
      ) : tab === 'mine' ? (
        <div className="mt-6">
          {enrollments.length === 0 ? (
            <EmptyState icon={BookOpen} title="No courses yet" message="Enroll in a free course to start building in-demand skills." action={<button className="btn btn-primary btn-sm" onClick={() => setTab('recommended')}>Explore courses</button>} />
          ) : (
            <>
              {inProgress.length > 0 && <><SectionHeader title="In Progress" /><div className="grid gap-3">{inProgress.map((e) => { const c = db.courses.find((x) => x.id === e.courseId); return c ? <CourseRow key={c.id} course={c} enrollment={e} /> : null })}</div></>}
              {completed.length > 0 && (
                <>
                  <SectionHeader title="Completed" href="/learn/progress" actionLabel="View certificates" />
                  <div className="grid gap-3">{completed.map((e) => {
                    const c = db.courses.find((x) => x.id === e.courseId)
                    const cert = db.certificates.find((x) => x.userId === me.id && x.courseId === e.courseId)
                    return c ? (
                      <div key={c.id} className="relative">
                        <CourseRow course={c} enrollment={e} />
                        {cert && <Link href={`/learn/certificates/${cert.id}`} className="absolute bottom-4 right-11 flex items-center gap-1 text-[12px] font-semibold text-brand"><Award size={14} />Certificate</Link>}
                      </div>
                    ) : null
                  })}</div>
                </>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="mt-6">
          <label className="card flex items-center gap-3 px-4">
            <Search size={18} className="text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses or skills" className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" aria-label="Search courses" />
            {q && <button onClick={() => setQ('')} aria-label="Clear"><X size={16} className="text-subtle" /></button>}
          </label>
          <div className="scrollbar-none -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
            {categories.map((c) => <button key={c} onClick={() => setCategory(c)} className={cn('chip', category === c && 'chip-active')}>{c}</button>)}
          </div>
          <div className="mt-2 flex gap-2">
            {['Any level', ...SKILL_LEVELS].map((l) => <button key={l} onClick={() => setLevel(l)} className={cn('rounded-full px-3 py-1.5 text-[12px] font-semibold', level === l ? 'bg-navy text-white' : 'text-muted')}>{l}</button>)}
          </div>
          <p className="mb-3 mt-4 text-[13px] text-muted">{filtered.length} courses</p>
          {filtered.length ? <div className="grid gap-3">{filtered.map((c) => <CourseRow key={c.id} course={c} enrollment={enrollmentFor(c.id)} />)}</div>
            : <EmptyState icon={SearchX} title="No courses found" message="Try another keyword or category." action={<button className="btn btn-secondary btn-sm" onClick={() => { setQ(''); setCategory('All'); setLevel('Any level') }}>Clear filters</button>} />}
        </div>
      )}
    </div>
  )
}
