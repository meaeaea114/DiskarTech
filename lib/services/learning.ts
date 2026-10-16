import type { AssessmentResult, Course, DB, Enrollment, SkillLevel } from '../types'
import { store } from '../mock/store'
import { QUIZ_PASS_SCORE } from '../constants'
import { ASSESSMENT_AREAS, ASSESSMENT_QUESTIONS } from '../data/assessment'
import { currentUser, latency, nowISO, pushNotification, ServiceError, uid, writeAudit } from './core'

const LEVEL_RANK: Record<SkillLevel, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 }

export function courseProgress(course: Course, enrollment?: Enrollment) {
  if (!enrollment) return 0
  const steps = course.lessons.length + 1 // +1 for the quiz
  const done = enrollment.completedLessons.filter((id) => course.lessons.some((l) => l.id === id)).length + (enrollment.quizPassed ? 1 : 0)
  return Math.round((done / steps) * 100)
}

export const CourseService = {
  enrollment: (db: DB, userId: string, courseId: string) =>
    db.enrollments.find((e) => e.userId === userId && e.courseId === courseId),

  nextLesson(course: Course, enrollment?: Enrollment) {
    return course.lessons.find((l) => !enrollment?.completedLessons.includes(l.id))
  },

  async enroll(courseId: string) {
    await latency(500)
    const me = currentUser()
    store.update((d) => {
      if (d.enrollments.some((e) => e.userId === me.id && e.courseId === courseId)) return
      const course = d.courses.find((c) => c.id === courseId)
      if (!course || course.status !== 'published') throw new ServiceError('This course is not available.')
      d.enrollments.push({ userId: me.id, courseId, enrolledAt: nowISO(), completedLessons: [], quizScore: null, quizPassed: false, completedAt: null, lastActivityAt: nowISO() })
    })
  },

  async completeLesson(courseId: string, lessonId: string) {
    await latency(350)
    const me = currentUser()
    store.update((d) => {
      const e = d.enrollments.find((x) => x.userId === me.id && x.courseId === courseId)
      if (!e) throw new ServiceError('Enroll in this course first.')
      if (!e.completedLessons.includes(lessonId)) e.completedLessons.push(lessonId)
      e.lastActivityAt = nowISO()
    })
  },

  /** Grades the quiz. Passing after all lessons completes the course and issues a certificate. */
  async submitQuiz(courseId: string, answers: number[]): Promise<{ score: number; passed: boolean; correct: number; completed: boolean; certificateId?: string }> {
    await latency(700)
    const me = currentUser()
    const course = store.getDB().courses.find((c) => c.id === courseId)
    if (!course) throw new ServiceError('Course not found.')
    const correct = course.quiz.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0)
    const score = Math.round((correct / course.quiz.length) * 100)
    const passed = score >= QUIZ_PASS_SCORE
    let completed = false
    let certificateId: string | undefined
    store.update((d) => {
      const e = d.enrollments.find((x) => x.userId === me.id && x.courseId === courseId)
      if (!e) throw new ServiceError('Enroll in this course first.')
      e.quizScore = Math.max(e.quizScore ?? 0, score)
      e.quizPassed = e.quizPassed || passed
      e.lastActivityAt = nowISO()
      const allLessons = course.lessons.every((l) => e.completedLessons.includes(l.id))
      if (e.quizPassed && allLessons && !e.completedAt) {
        completed = true
        e.completedAt = nowISO()
        const existing = d.certificates.find((c) => c.userId === me.id && c.courseId === courseId)
        certificateId = existing?.id ?? uid('cert')
        if (!existing) {
          d.certificates.push({ id: certificateId, userId: me.id, courseId, issuedAt: nowISO(), code: `DT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}` })
        }
        const profile = d.profiles.find((p) => p.userId === me.id)
        if (profile) {
          // Completing a course raises the related skills to at least Intermediate.
          course.skills.forEach((name) => {
            const s = profile.skills.find((x) => x.name.toLowerCase() === name.toLowerCase())
            if (!s) profile.skills.push({ name, level: 'Intermediate', source: 'course' })
            else if (LEVEL_RANK[s.level] < 2) { s.level = 'Intermediate'; s.source = 'course' }
          })
          if (!profile.certifications.some((c) => c.courseId === courseId)) {
            profile.certifications.push({ id: uid('cert'), name: course.title, issuer: course.provider, year: String(new Date().getFullYear()), courseId })
          }
        }
        pushNotification(d, {
          userId: me.id, category: 'learning', icon: 'award', title: 'Course completed — certificate earned!',
          body: `${course.title} · Score ${score}%`, href: `/learn/certificates/${certificateId}`,
        }, 'learningReminders')
        writeAudit(d, me, 'Completed course', course.title, 'course')
      }
    })
    return { score, passed, correct, completed, certificateId }
  },

  // ---- Admin content management -----------------------------------------

  async saveCourse(course: Course) {
    await latency(500)
    const me = currentUser()
    if (!course.title.trim()) throw new ServiceError('Course title is required.')
    if (!course.lessons.length) throw new ServiceError('Add at least one lesson.')
    store.update((d) => {
      const idx = d.courses.findIndex((c) => c.id === course.id)
      if (idx >= 0) d.courses[idx] = course
      else d.courses.unshift(course)
      writeAudit(d, me, idx >= 0 ? 'Updated course' : 'Created course', course.title, 'course')
    })
  },

  async setCourseStatus(courseId: string, status: Course['status']) {
    await latency(350)
    const me = currentUser()
    store.update((d) => {
      const c = d.courses.find((x) => x.id === courseId)
      if (!c) throw new ServiceError('Course not found.')
      c.status = status
      writeAudit(d, me, status === 'published' ? 'Published course' : 'Unpublished course', c.title, 'course')
      if (status === 'published') {
        d.users.filter((u) => u.role === 'youth').forEach((u) => pushNotification(d, {
          userId: u.id, category: 'learning', icon: 'book', title: 'New course available',
          body: `${c.title} is ready to start`, href: `/learn/${c.id}`,
        }, 'learningReminders'))
      }
    })
  },
}

export const AssessmentService = {
  questions: ASSESSMENT_QUESTIONS,

  async submit(answers: Record<string, number>): Promise<AssessmentResult> {
    await latency(1200)
    const me = currentUser()
    const areas = ASSESSMENT_AREAS.map((area) => {
      const qs = ASSESSMENT_QUESTIONS.filter((q) => q.area === area)
      const correct = qs.filter((q) => answers[q.id] === q.answer).length
      const ratio = correct / qs.length
      const level: SkillLevel = ratio >= 0.99 ? 'Advanced' : ratio >= 0.66 ? 'Intermediate' : 'Beginner'
      return { area, correct, total: qs.length, level }
    })
    const total = areas.reduce((n, a) => n + a.correct, 0)
    const result: AssessmentResult = { id: uid('asm'), userId: me.id, takenAt: nowISO(), score: Math.round((total / ASSESSMENT_QUESTIONS.length) * 100), areas }
    store.update((d) => {
      d.assessments.push(result)
      const profile = d.profiles.find((p) => p.userId === me.id)
      if (profile) {
        areas.forEach(({ area, correct, level }) => {
          const existing = profile.skills.find((s) => s.name.toLowerCase() === area.toLowerCase())
          if (correct === 0) {
            // Remove assessment-based skills the user no longer demonstrates.
            if (existing?.source === 'assessment') profile.skills = profile.skills.filter((s) => s !== existing)
            return
          }
          if (existing) { existing.level = level; existing.source = 'assessment' }
          else profile.skills.push({ name: area, level, source: 'assessment' })
        })
      }
      pushNotification(d, {
        userId: me.id, category: 'learning', icon: 'star', title: 'Skills assessment complete',
        body: `You scored ${result.score}%. Your skill profile and recommendations were updated.`, href: '/assessment/results',
      })
    })
    return result
  },
}
