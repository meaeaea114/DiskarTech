import type { DB, Profile } from '../types'
import { store } from '../mock/store'
import { currentUser, latency, ServiceError, writeAudit } from './core'

export interface Completion { percent: number; missing: { label: string; href: string }[] }

const CHECKS: { label: string; href: string; ok: (p: Profile) => boolean }[] = [
  { label: 'Add your headline and location', href: '/profile/personal', ok: (p) => !!p.headline && !!p.location },
  { label: 'Add a contact number', href: '/profile/personal', ok: (p) => !!p.phone },
  { label: 'Write a professional summary', href: '/profile/personal', ok: (p) => p.summary.length >= 40 },
  { label: 'Add your education', href: '/profile/education', ok: (p) => p.education.length > 0 },
  { label: 'Add at least 3 skills', href: '/profile/skills', ok: (p) => p.skills.length >= 3 },
  { label: 'Add work or OJT experience', href: '/profile/experience', ok: (p) => p.experience.length > 0 },
  { label: 'Add a certification', href: '/profile/certifications', ok: (p) => p.certifications.length > 0 },
  { label: 'Add a project to showcase your work', href: '/profile/projects', ok: (p) => p.projects.length > 0 },
  { label: 'Choose your career interests', href: '/profile/interests', ok: (p) => p.interests.length > 0 },
]

export const ProfileService = {
  get: (db: DB, userId: string) => db.profiles.find((p) => p.userId === userId),

  completion(profile: Profile | undefined): Completion {
    if (!profile) return { percent: 0, missing: [] }
    const missing = CHECKS.filter((c) => !c.ok(profile)).map(({ label, href }) => ({ label, href }))
    return { percent: Math.round(((CHECKS.length - missing.length) / CHECKS.length) * 100), missing }
  },

  fullName: (p: Pick<Profile, 'firstName' | 'lastName'>) => `${p.firstName} ${p.lastName}`.trim(),

  /** Save a partial update to the signed-in user's profile. */
  async update(patch: Partial<Omit<Profile, 'userId'>>) {
    await latency(450)
    const me = currentUser()
    if (patch.firstName !== undefined && !patch.firstName.trim()) throw new ServiceError('First name is required.')
    if (patch.lastName !== undefined && !patch.lastName.trim()) throw new ServiceError('Last name is required.')
    store.update((d) => {
      const p = d.profiles.find((x) => x.userId === me.id)
      if (!p) throw new ServiceError('Profile not found.')
      Object.assign(p, structuredClone(patch))
      const u = d.users.find((x) => x.id === me.id)!
      u.name = `${p.firstName} ${p.lastName}`.trim()
      if (patch.email) p.email = patch.email
      writeAudit(d, me, 'Updated profile', Object.keys(patch).join(', '), 'user')
    })
  },
}
