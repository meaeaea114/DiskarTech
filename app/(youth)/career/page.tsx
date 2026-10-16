'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Check, ChevronRight, Heart } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useAction, useMe } from '@/hooks/use-app'
import { ProfileService, Recommendations } from '@/lib/services'
import { cn } from '@/lib/utils'
import { Badge, IconTile, ProgressBar, SectionHeader } from '@/components/ui/kit'
import { Sheet } from '@/components/ui/sheet'
import { PageHeader } from '@/components/layout/page-header'
import { CourseRow } from '@/components/features/learning'
import { JobCard } from '@/components/features/jobs'

export default function Career() {
  const db = useDB()
  const me = useMe()
  const [run] = useAction()
  const profile = ProfileService.get(db, me.id)
  const paths = useMemo(() => Recommendations.careerPathMatches(profile), [profile])
  const [openId, setOpenId] = useState<string | null>(null)
  const open = paths.find((p) => p.path.id === openId)
  const gaps = useMemo(() => Recommendations.skillGaps(db, me.id), [db, me.id])
  const courses = useMemo(() => Recommendations.recommendedCourses(db, me.id, 3), [db, me.id])
  const jobs = useMemo(() => Recommendations.recommendedJobs(db, me.id, 4), [db, me.id])
  const top = paths[0]

  const toggleInterest = (id: string) => {
    if (!profile) return
    const has = profile.interests.includes(id)
    run(() => ProfileService.update({ interests: has ? profile.interests.filter((x) => x !== id) : [...profile.interests, id] }),
      { success: has ? 'Removed from your career interests' : 'Added to your career interests' })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Career Guidance" bell />

      <div className="relative overflow-hidden rounded-[22px] bg-brand-50 p-5">
        <p className="text-[12px] font-bold uppercase tracking-wider text-brand">Your best match</p>
        <h2 className="mt-1 text-[24px] font-bold">{top.path.title}</h2>
        <p className="mt-1 max-w-md text-[14px] text-[#3e5677]">{top.path.description}</p>
        <div className="mt-4 flex max-w-sm items-center gap-2"><ProgressBar value={top.score} className="flex-1 bg-white/60" /><span className="text-[13px] font-bold text-brand">{top.score}% match</span></div>
        <button onClick={() => setOpenId(top.path.id)} className="btn btn-primary btn-sm mt-4">Explore this path <ArrowUpRight size={16} /></button>
      </div>
      <p className="mt-3 text-[12px] text-muted">Based on your skills, assessment results, completed courses, and career interests. Update your <Link href="/profile/skills" className="font-semibold text-brand">skills</Link> or take the <Link href="/assessment" className="font-semibold text-brand">assessment</Link> to refine these.</p>

      <SectionHeader title="Suggested Career Paths" />
      <div className="grid gap-3">
        {paths.map(({ path, score }) => (
          <button key={path.id} onClick={() => setOpenId(path.id)} className="card tap flex items-center gap-3 p-4 text-left">
            <IconTile icon={path.icon} color={path.color} size={46} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5"><p className="truncate text-[15px] font-bold">{path.title}</p>{profile?.interests.includes(path.id) && <Heart size={13} className="shrink-0 fill-danger text-danger" />}</div>
              <p className="text-[12px] text-muted">{path.family} · {path.salary}</p>
              <div className="mt-1.5 flex items-center gap-2"><ProgressBar value={score} className="flex-1" /><span className="text-[11px] font-bold text-brand">{score}%</span></div>
            </div>
            <ChevronRight size={18} className="text-subtle" />
          </button>
        ))}
      </div>

      <SectionHeader title="Skills to Improve" href="/assessment/results" actionLabel="Skill gaps" />
      <div className="flex flex-wrap gap-2">
        {gaps.map((g) => <span key={g.skill} className="rounded-full bg-white px-3 py-2 text-[13px] font-semibold shadow-[var(--shadow-card)]">{g.skill} <span className="font-normal text-muted">· {g.current ?? 'new'}</span></span>)}
        {!gaps.length && <p className="text-[14px] text-muted">You have the core skills for your top paths!</p>}
      </div>

      <SectionHeader title="Recommended Courses" href="/learn" />
      <div className="grid gap-3">{courses.map(({ course, reason }) => <CourseRow key={course.id} course={course} reason={reason} enrollment={db.enrollments.find((e) => e.userId === me.id && e.courseId === course.id)} />)}</div>

      <SectionHeader title="Recommended Jobs" href="/jobs" />
      <div className="grid gap-3">{jobs.map(({ job, match }) => <JobCard key={job.id} job={job} match={match.score} />)}</div>

      <Sheet open={!!open} onClose={() => setOpenId(null)} title={open?.path.title} description={open ? `${open.path.family} · ${open.path.salary}` : undefined}
        footer={open && (
          <div className="grid grid-cols-2 gap-3">
            <button className={cn('btn', profile?.interests.includes(open.path.id) ? 'btn-secondary' : 'btn-tinted')} onClick={() => toggleInterest(open.path.id)}>
              <Heart size={17} className={profile?.interests.includes(open.path.id) ? 'fill-danger text-danger' : ''} />{profile?.interests.includes(open.path.id) ? 'Interested' : 'I’m interested'}
            </button>
            <Link href={`/jobs?q=${encodeURIComponent(open.path.categories[0])}`} className="btn btn-primary">See jobs</Link>
          </div>
        )}>
        {open && (
          <>
            <p className="text-[14px] leading-relaxed text-[#4a5b75]">{open.path.description}</p>
            <div className="card card-pad mt-4">
              <div className="mb-2 flex justify-between text-[14px]"><span className="font-semibold">Your match</span><span className="font-bold text-brand">{open.score}%</span></div>
              <ProgressBar value={open.score} />
            </div>
            <h4 className="mb-2 mt-5 text-[14px] font-bold">Core skills</h4>
            <div className="grid gap-2">
              {open.path.skills.map((s) => {
                const lvl = profile?.skills.find((x) => x.name.toLowerCase() === s.toLowerCase())?.level
                return (
                  <div key={s} className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 text-[14px]">
                    <span className="flex items-center gap-2">{lvl ? <Check size={16} className="text-success" /> : <span className="size-4 rounded-full border-2 border-[#cfd8e5]" />}{s}</span>
                    <Badge tone={lvl === 'Advanced' ? 'green' : lvl ? 'blue' : 'gray'}>{lvl ?? 'To learn'}</Badge>
                  </div>
                )
              })}
            </div>
            <h4 className="mb-2 mt-5 text-[14px] font-bold">Courses for this path</h4>
            <div className="grid gap-2">
              {db.courses.filter((c) => c.status === 'published' && c.skills.some((s) => open.path.skills.includes(s))).slice(0, 3).map((c) => (
                <Link key={c.id} href={`/learn/${c.id}`} className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-2.5 text-[14px] font-semibold hover:text-brand"><IconTile icon={c.icon} color={c.color} size={32} />{c.title}<ChevronRight size={16} className="ml-auto text-subtle" /></Link>
              ))}
            </div>
          </>
        )}
      </Sheet>
    </div>
  )
}
