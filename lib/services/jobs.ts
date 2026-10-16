import type { DB, ExperienceLevel, Job, JobType, WorkSetup } from '../types'
import { store } from '../mock/store'
import { LOCATIONS } from '../constants'
import { jobMatch } from './recommendations'
import { adminUserIds, currentUser, employerUserIds, latency, nowISO, pushNotification, ServiceError, uid, writeAudit } from './core'

export interface JobFilters {
  keyword: string
  location: string
  types: JobType[]
  levels: ExperienceLevel[]
  setups: WorkSetup[]
  minSalary: number
  skills: string[]
  sort: 'relevance' | 'newest' | 'salary' | 'deadline'
}

export const EMPTY_FILTERS: JobFilters = { keyword: '', location: '', types: [], levels: [], setups: [], minSalary: 0, skills: [], sort: 'relevance' }

export type JobInput = Pick<Job,
  'title' | 'category' | 'location' | 'workSetup' | 'type' | 'level' | 'salaryMin' | 'salaryMax' |
  'description' | 'responsibilities' | 'qualifications' | 'skills' | 'benefits'> & { deadline: string }

const isOpen = (j: Job) => j.status === 'published' && new Date(j.deadline).getTime() > Date.now()

export function validateJob(input: JobInput, forPublish: boolean): Record<string, string> {
  const e: Record<string, string> = {}
  if (!input.title.trim()) e.title = 'Job title is required'
  if (forPublish) {
    if (input.description.trim().length < 30) e.description = 'Add a description of at least 30 characters'
    if (!input.responsibilities.length) e.responsibilities = 'Add at least one responsibility'
    if (!input.qualifications.length) e.qualifications = 'Add at least one qualification'
    if (!input.skills.length) e.skills = 'Add at least one required skill'
    if (!input.location) e.location = 'Choose a location'
    if (!input.salaryMin || !input.salaryMax) e.salary = 'Enter a salary range'
    if (!input.deadline) e.deadline = 'Choose an application deadline'
    else if (new Date(input.deadline).getTime() < Date.now()) e.deadline = 'Deadline must be in the future'
  }
  if (input.salaryMin && input.salaryMax && input.salaryMin > input.salaryMax) e.salary = 'Minimum salary cannot exceed maximum'
  return e
}

function notifyMatchingSeekers(d: DB, job: Job) {
  const employer = d.employers.find((e) => e.id === job.employerId)
  d.profiles.forEach((p) => {
    if (jobMatch(p, job).score >= 60) {
      pushNotification(d, {
        userId: p.userId, category: 'jobs', icon: 'briefcase', title: 'New recommended job',
        body: `${job.title} · ${employer?.name ?? ''}`, href: `/jobs/${job.id}`,
      }, 'jobAlerts')
    }
  })
}

/** Publishing goes live immediately for verified employers; otherwise it waits for admin review. */
function applyPublish(d: DB, job: Job) {
  const employer = d.employers.find((e) => e.id === job.employerId)!
  job.updatedAt = nowISO()
  if (employer.verification === 'verified') {
    job.status = 'published'
    job.postedAt = nowISO()
    notifyMatchingSeekers(d, job)
  } else {
    job.status = 'pending'
    adminUserIds(d).forEach((id) => pushNotification(d, {
      userId: id, category: 'jobs', icon: 'alert', title: 'Job post pending review',
      body: `${job.title} · ${employer.name}`, href: '/admin/jobs',
    }))
  }
}

export const JobService = {
  isOpen,

  locationLabel(job: Pick<Job, 'location' | 'region'>) {
    return job.region && job.region !== job.location ? `${job.location}, ${job.region}` : job.location
  },

  /** Jobs visible to job seekers, with search/filter/sort applied. */
  search(db: DB, filters: JobFilters, userId?: string) {
    const profile = db.profiles.find((p) => p.userId === userId)
    const kw = filters.keyword.trim().toLowerCase()
    const loc = filters.location.trim().toLowerCase()
    const results = db.jobs.filter(isOpen).map((job) => ({ job, match: jobMatch(profile, job) })).filter(({ job }) => {
      const employer = db.employers.find((e) => e.id === job.employerId)
      if (kw) {
        const hay = [job.title, job.category, employer?.name, ...job.skills].join(' ').toLowerCase()
        if (!kw.split(/\s+/).every((w) => hay.includes(w))) return false
      }
      if (loc) {
        const hay = `${job.location} ${job.region} ${job.workSetup}`.toLowerCase()
        if (!hay.includes(loc)) return false
      }
      if (filters.types.length && !filters.types.includes(job.type)) return false
      if (filters.levels.length && !filters.levels.includes(job.level)) return false
      if (filters.setups.length && !filters.setups.includes(job.workSetup)) return false
      if (filters.minSalary && job.salaryMax < filters.minSalary) return false
      if (filters.skills.length && !filters.skills.some((s) => job.skills.includes(s))) return false
      return true
    })
    const sorters: Record<JobFilters['sort'], (a: typeof results[number], b: typeof results[number]) => number> = {
      relevance: (a, b) => b.match.score - a.match.score,
      newest: (a, b) => b.job.postedAt.localeCompare(a.job.postedAt),
      salary: (a, b) => b.job.salaryMax - a.job.salaryMax,
      deadline: (a, b) => a.job.deadline.localeCompare(b.job.deadline),
    }
    return results.sort(sorters[filters.sort])
  },

  applicantCount: (db: DB, jobId: string) => db.applications.filter((a) => a.jobId === jobId).length,

  isSaved: (db: DB, userId: string, jobId: string) => (db.saved[userId] ?? []).includes(jobId),

  async toggleSave(jobId: string): Promise<boolean> {
    await latency(250)
    const me = currentUser()
    let nowSaved = false
    store.update((d) => {
      const list = d.saved[me.id] ?? []
      nowSaved = !list.includes(jobId)
      d.saved[me.id] = nowSaved ? [jobId, ...list] : list.filter((id) => id !== jobId)
    })
    return nowSaved
  },

  recordView(jobId: string) {
    store.update((d) => {
      const job = d.jobs.find((j) => j.id === jobId)
      if (job) job.views += 1
    })
  },

  // ---- Employer -----------------------------------------------------------

  async create(input: JobInput, publish: boolean): Promise<Job> {
    await latency(600)
    const me = currentUser()
    if (!me.employerId) throw new ServiceError('Only employers can post jobs.')
    const errors = validateJob(input, publish)
    if (Object.keys(errors).length) throw new ServiceError(Object.values(errors)[0])
    let job!: Job
    store.update((d) => {
      const region = LOCATIONS.find((l) => l.city === input.location)?.region ?? input.location
      job = {
        ...input, id: uid('job'), employerId: me.employerId!, region, deadline: new Date(input.deadline).toISOString(),
        status: 'draft', views: 0, postedAt: nowISO(), updatedAt: nowISO(),
      }
      d.jobs.unshift(job)
      if (publish) applyPublish(d, job)
      writeAudit(d, me, publish ? 'Published job' : 'Saved job draft', job.title, 'job')
      job = structuredClone(job)
    })
    return job
  },

  async update(jobId: string, input: JobInput): Promise<void> {
    await latency(500)
    const me = currentUser()
    const existing = store.getDB().jobs.find((j) => j.id === jobId)
    if (!existing || existing.employerId !== me.employerId) throw new ServiceError('Job not found.')
    const errors = validateJob(input, existing.status !== 'draft')
    if (Object.keys(errors).length) throw new ServiceError(Object.values(errors)[0])
    store.update((d) => {
      const job = d.jobs.find((j) => j.id === jobId)!
      const region = LOCATIONS.find((l) => l.city === input.location)?.region ?? input.location
      Object.assign(job, input, { region, deadline: new Date(input.deadline).toISOString(), updatedAt: nowISO() })
      writeAudit(d, me, 'Edited job', job.title, 'job')
    })
  },

  async publish(jobId: string): Promise<Job['status']> {
    await latency(500)
    const me = currentUser()
    const job = store.getDB().jobs.find((j) => j.id === jobId)
    if (!job || job.employerId !== me.employerId) throw new ServiceError('Job not found.')
    const errors = validateJob({ ...job, deadline: job.deadline }, true)
    if (Object.keys(errors).length) throw new ServiceError(`Complete the job post first: ${Object.values(errors)[0].toLowerCase()}`)
    let status: Job['status'] = 'draft'
    store.update((d) => {
      const j = d.jobs.find((x) => x.id === jobId)!
      applyPublish(d, j)
      status = j.status
      writeAudit(d, me, status === 'published' ? 'Published job' : 'Submitted job for review', j.title, 'job')
    })
    return status
  },

  async setStatus(jobId: string, status: 'draft' | 'closed'): Promise<void> {
    await latency(400)
    const me = currentUser()
    store.update((d) => {
      const job = d.jobs.find((j) => j.id === jobId)
      if (!job || (me.role === 'employer' && job.employerId !== me.employerId)) throw new ServiceError('Job not found.')
      job.status = status
      job.updatedAt = nowISO()
      writeAudit(d, me, status === 'closed' ? 'Closed job' : 'Unpublished job', job.title, 'job')
    })
  },

  async duplicate(jobId: string): Promise<Job> {
    await latency(400)
    const me = currentUser()
    let copy!: Job
    store.update((d) => {
      const job = d.jobs.find((j) => j.id === jobId && j.employerId === me.employerId)
      if (!job) throw new ServiceError('Job not found.')
      copy = { ...structuredClone(job), id: uid('job'), title: `${job.title} (Copy)`, status: 'draft', views: 0, postedAt: nowISO(), updatedAt: nowISO(), moderationNote: undefined }
      if (new Date(copy.deadline).getTime() < Date.now()) copy.deadline = new Date(Date.now() + 30 * 86_400_000).toISOString()
      d.jobs.unshift(copy)
      writeAudit(d, me, 'Duplicated job', job.title, 'job')
    })
    return copy
  },

  async remove(jobId: string): Promise<void> {
    await latency(400)
    const me = currentUser()
    store.update((d) => {
      const job = d.jobs.find((j) => j.id === jobId && j.employerId === me.employerId)
      if (!job) throw new ServiceError('Job not found.')
      if (d.applications.some((a) => a.jobId === jobId)) throw new ServiceError('Jobs with applicants cannot be deleted. Close it instead.')
      d.jobs = d.jobs.filter((j) => j.id !== jobId)
      writeAudit(d, me, 'Deleted draft job', job.title, 'job')
    })
  },

  // ---- Admin moderation ---------------------------------------------------

  async moderate(jobId: string, decision: 'approve' | 'reject' | 'takedown', note = ''): Promise<void> {
    await latency(500)
    const me = currentUser()
    if (me.role !== 'admin') throw new ServiceError('Only admins can moderate jobs.')
    store.update((d) => {
      const job = d.jobs.find((j) => j.id === jobId)
      if (!job) throw new ServiceError('Job not found.')
      const employer = d.employers.find((e) => e.id === job.employerId)
      job.updatedAt = nowISO()
      job.moderationNote = note || undefined
      if (decision === 'approve') {
        job.status = 'published'
        job.postedAt = nowISO()
        notifyMatchingSeekers(d, job)
      } else {
        job.status = decision === 'reject' ? 'rejected' : 'closed'
      }
      const titles = { approve: 'Job post approved', reject: 'Job post rejected', takedown: 'Job post taken down' }
      employerUserIds(d, job.employerId).forEach((id) => pushNotification(d, {
        userId: id, category: 'jobs', icon: decision === 'approve' ? 'check' : 'alert', title: titles[decision],
        body: note ? `${job.title} — ${note}` : `${job.title} is ${decision === 'approve' ? 'now live in Job Discovery' : 'no longer visible to job seekers'}.`,
        href: `/employer/jobs/${job.id}`,
      }))
      writeAudit(d, me, titles[decision], `${job.title} · ${employer?.name ?? ''}`, 'job')
    })
  },
}
