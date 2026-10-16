'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Course, Enrollment } from '@/lib/types'
import { courseProgress, CourseService } from '@/lib/services'
import { Badge, IconTile, ProgressBar } from '@/components/ui/kit'

export function CourseRow({ course, enrollment, reason }: { course: Course; enrollment?: Enrollment; reason?: string }) {
  const progress = courseProgress(course, enrollment)
  return (
    <Link href={`/learn/${course.id}`} className="card tap flex items-center gap-3.5 p-4 hover:shadow-[0_8px_24px_rgba(38,59,87,0.11)]">
      <IconTile icon={course.icon} color={course.color} size={52} />
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-bold leading-snug">{course.title}</h3>
        <p className="mt-0.5 truncate text-[12px] text-muted">{reason ?? course.provider}</p>
        {enrollment ? (
          enrollment.completedAt
            ? <Badge tone="green" className="mt-2">Completed</Badge>
            : <div className="mt-2 flex items-center gap-2"><ProgressBar value={progress} className="flex-1" /><span className="text-[11px] font-semibold text-brand">{progress}%</span></div>
        ) : (
          <p className="mt-1.5 text-[12px] text-muted">{course.free ? 'Free' : 'Paid'} · {course.hours} hours · {course.level}</p>
        )}
      </div>
      <ChevronRight size={18} className="shrink-0 text-subtle" />
    </Link>
  )
}

export function ContinueCard({ course, enrollment }: { course: Course; enrollment: Enrollment }) {
  const progress = courseProgress(course, enrollment)
  const next = CourseService.nextLesson(course, enrollment)
  const lessonNo = next ? course.lessons.indexOf(next) + 1 : course.lessons.length
  return (
    <Link href={next ? `/learn/${course.id}/lesson/${next.id}` : `/learn/${course.id}/quiz`} className="card tap flex items-center gap-4 p-4 hover:shadow-[0_8px_24px_rgba(38,59,87,0.11)]">
      <IconTile icon={course.icon} color={course.color} size={64} className="rounded-2xl" />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-muted">{course.category}</p>
        <h3 className="truncate text-[16px] font-bold">{course.title}</h3>
        <p className="mt-0.5 text-[12px] text-muted">{next ? `Lesson ${lessonNo} of ${course.lessons.length}` : 'Final quiz ready'}</p>
        <div className="mt-2 flex items-center gap-2"><ProgressBar value={progress} className="flex-1" /><span className="text-[11px] font-semibold text-brand">{progress}%</span></div>
      </div>
    </Link>
  )
}
