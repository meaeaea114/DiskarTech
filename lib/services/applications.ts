import type { Application, ApplicationStatus, DB, Interview, InterviewType } from '../types'
import { store } from '../mock/store'
import { STATUS_META } from '../constants'
import { currentUser, employerUserIds, latency, nowISO, pushNotification, ServiceError, uid, writeAudit } from './core'
import { JobService } from './jobs'

const STATUS_NOTIFICATIONS: Partial<Record<ApplicationStatus, { title: string; icon: 'check' | 'star' | 'calendar' | 'award' | 'x' | 'briefcase' }>> = {
  under_review: { title: 'Your application is under review', icon: 'briefcase' },
  shortlisted: { title: 'You have been shortlisted!', icon: 'star' },
  interview: { title: 'You have been moved to the interview stage', icon: 'calendar' },
  offer: { title: 'You received a job offer! 🎉', icon: 'award' },
  hired: { title: 'Congratulations, you’re hired! 🎉', icon: 'award' },
  rejected: { title: 'Application update', icon: 'x' },
}

export interface InterviewInput {
  date: string
  time: string
  type: InterviewType
  location: string
  notes: string
}

export const ApplicationService = {
  forUser: (db: DB, userId: string) =>
    db.applications.filter((a) => a.userId === userId).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)),

  forEmployer: (db: DB, employerId: string) => {
    const jobIds = new Set(db.jobs.filter((j) => j.employerId === employerId).map((j) => j.id))
    return db.applications.filter((a) => jobIds.has(a.jobId))
  },

  hasApplied: (db: DB, userId: string, jobId: string) => db.applications.some((a) => a.userId === userId && a.jobId === jobId),

  interviewFor: (db: DB, applicationId: string): Interview | undefined =>
    db.interviews.filter((i) => i.applicationId === applicationId && i.status !== 'cancelled')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],

  upcomingInterviews(db: DB, applicationIds: string[]) {
    const ids = new Set(applicationIds)
    const today = new Date().toISOString().slice(0, 10)
    return db.interviews
      .filter((i) => ids.has(i.applicationId) && i.status === 'scheduled' && i.date >= today)
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  },

  async apply(jobId: string, coverNote: string): Promise<Application> {
    await latency(900)
    const me = currentUser()
    if (me.role !== 'youth') throw new ServiceError('Only job seekers can apply to jobs.')
    const db = store.getDB()
    const job = db.jobs.find((j) => j.id === jobId)
    if (!job || !JobService.isOpen(job)) throw new ServiceError('This job is no longer accepting applications.')
    if (ApplicationService.hasApplied(db, me.id, jobId)) throw new ServiceError('You have already applied to this job.')
    let app!: Application
    store.update((d) => {
      const at = nowISO()
      app = { id: uid('app'), jobId, userId: me.id, status: 'submitted', appliedAt: at, updatedAt: at, coverNote: coverNote.trim(), timeline: [{ status: 'submitted', at }], employerNotes: '' }
      d.applications.push(app)
      const employer = d.employers.find((e) => e.id === job.employerId)
      pushNotification(d, {
        userId: me.id, category: 'jobs', icon: 'check', title: 'Application submitted',
        body: `${employer?.name} · ${job.title}`, href: `/applications/${app.id}`,
      }, 'applicationUpdates')
      employerUserIds(d, job.employerId).forEach((id) => pushNotification(d, {
        userId: id, category: 'jobs', icon: 'user', title: 'New applicant',
        body: `${me.name} applied for ${job.title}`, href: `/employer/applicants/${app.id}`,
      }))
      writeAudit(d, me, 'Applied to job', `${job.title} · ${employer?.name}`, 'application')
    })
    return app
  },

  async updateStatus(applicationId: string, status: ApplicationStatus, note = ''): Promise<void> {
    await latency(450)
    const me = currentUser()
    store.update((d) => {
      const app = d.applications.find((a) => a.id === applicationId)
      const job = app && d.jobs.find((j) => j.id === app.jobId)
      if (!app || !job || job.employerId !== me.employerId) throw new ServiceError('Application not found.')
      if (app.status === status) return
      app.status = status
      app.updatedAt = nowISO()
      app.timeline.push({ status, at: nowISO(), note: note || undefined })
      // Moving away from the interview stage cancels any pending interview.
      if (status === 'rejected') {
        d.interviews.filter((i) => i.applicationId === app.id && i.status === 'scheduled').forEach((i) => { i.status = 'cancelled'; i.updatedAt = nowISO() })
      }
      const employer = d.employers.find((e) => e.id === job.employerId)
      const meta = STATUS_NOTIFICATIONS[status]
      if (meta) {
        pushNotification(d, {
          userId: app.userId, category: 'jobs', icon: meta.icon, title: meta.title,
          body: status === 'rejected'
            ? `${employer?.name} decided to move forward with other candidates for ${job.title}.`
            : `${employer?.name} · ${job.title}`,
          href: `/applications/${app.id}`,
        }, 'applicationUpdates')
      }
      const applicant = d.users.find((u) => u.id === app.userId)
      writeAudit(d, me, `Moved applicant to ${STATUS_META[status].label}`, `${applicant?.name} · ${job.title}`, 'application')
    })
  },

  async saveNotes(applicationId: string, notes: string) {
    await latency(300)
    store.update((d) => {
      const app = d.applications.find((a) => a.id === applicationId)
      if (app) app.employerNotes = notes
    })
  },

  // ---- Interviews ---------------------------------------------------------

  validateInterview(input: InterviewInput): string | null {
    if (!input.date) return 'Choose an interview date'
    if (!input.time) return 'Choose an interview time'
    if (new Date(`${input.date}T${input.time}`).getTime() < Date.now()) return 'Interview must be scheduled in the future'
    if (!input.location.trim()) return input.type === 'On-site' ? 'Add the interview address' : 'Add a meeting link or phone number'
    return null
  },

  async scheduleInterview(applicationId: string, input: InterviewInput): Promise<void> {
    await latency(600)
    const me = currentUser()
    const err = ApplicationService.validateInterview(input)
    if (err) throw new ServiceError(err)
    store.update((d) => {
      const app = d.applications.find((a) => a.id === applicationId)
      const job = app && d.jobs.find((j) => j.id === app.jobId)
      if (!app || !job || job.employerId !== me.employerId) throw new ServiceError('Application not found.')
      if (app.status === 'rejected' || app.status === 'hired') throw new ServiceError('This applicant is no longer in the pipeline.')
      d.interviews.filter((i) => i.applicationId === app.id && i.status === 'scheduled').forEach((i) => { i.status = 'cancelled' })
      d.interviews.push({ id: uid('int'), applicationId, ...input, status: 'scheduled', createdAt: nowISO(), updatedAt: nowISO() })
      if (app.status !== 'interview' && app.status !== 'offer') {
        app.status = 'interview'
        app.timeline.push({ status: 'interview', at: nowISO() })
      }
      app.updatedAt = nowISO()
      const employer = d.employers.find((e) => e.id === job.employerId)
      pushNotification(d, {
        userId: app.userId, category: 'jobs', icon: 'calendar', title: 'Interview scheduled',
        body: `${employer?.name} · ${job.title} · ${formatSlot(input.date, input.time)}`, href: `/applications/${app.id}`,
      }, 'applicationUpdates')
      const applicant = d.users.find((u) => u.id === app.userId)
      writeAudit(d, me, 'Scheduled interview', `${applicant?.name} · ${job.title}`, 'application')
    })
  },

  async updateInterview(interviewId: string, input: InterviewInput): Promise<void> {
    await latency(500)
    const me = currentUser()
    const err = ApplicationService.validateInterview(input)
    if (err) throw new ServiceError(err)
    store.update((d) => {
      const iv = d.interviews.find((i) => i.id === interviewId)
      const app = iv && d.applications.find((a) => a.id === iv.applicationId)
      const job = app && d.jobs.find((j) => j.id === app.jobId)
      if (!iv || !app || !job || job.employerId !== me.employerId) throw new ServiceError('Interview not found.')
      Object.assign(iv, input, { updatedAt: nowISO() })
      const employer = d.employers.find((e) => e.id === job.employerId)
      pushNotification(d, {
        userId: app.userId, category: 'jobs', icon: 'calendar', title: 'Interview updated',
        body: `${employer?.name} · now ${formatSlot(input.date, input.time)} (${input.type})`, href: `/applications/${app.id}`,
      }, 'applicationUpdates')
      writeAudit(d, me, 'Rescheduled interview', job.title, 'application')
    })
  },

  async setInterviewStatus(interviewId: string, status: 'cancelled' | 'completed'): Promise<void> {
    await latency(400)
    const me = currentUser()
    store.update((d) => {
      const iv = d.interviews.find((i) => i.id === interviewId)
      const app = iv && d.applications.find((a) => a.id === iv.applicationId)
      const job = app && d.jobs.find((j) => j.id === app.jobId)
      if (!iv || !app || !job || job.employerId !== me.employerId) throw new ServiceError('Interview not found.')
      iv.status = status
      iv.updatedAt = nowISO()
      if (status === 'cancelled') {
        const employer = d.employers.find((e) => e.id === job.employerId)
        pushNotification(d, {
          userId: app.userId, category: 'jobs', icon: 'x', title: 'Interview cancelled',
          body: `${employer?.name} cancelled the interview for ${job.title}. They may reschedule soon.`, href: `/applications/${app.id}`,
        }, 'applicationUpdates')
      }
      writeAudit(d, me, status === 'cancelled' ? 'Cancelled interview' : 'Marked interview completed', job.title, 'application')
    })
  },
}

export function formatSlot(date: string, time: string) {
  const d = new Date(`${date}T${time}`)
  return d.toLocaleString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
