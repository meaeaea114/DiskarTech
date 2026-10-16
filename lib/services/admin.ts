import type { DB, Employer, VerificationStatus } from '../types'
import { store } from '../mock/store'
import { currentUser, employerUserIds, latency, pushNotification, ServiceError, writeAudit } from './core'

export const EmployerService = {
  get: (db: DB, employerId: string | undefined) => db.employers.find((e) => e.id === employerId),

  async updateCompany(patch: Partial<Pick<Employer, 'name' | 'industry' | 'location' | 'size' | 'about' | 'website'>>) {
    await latency(450)
    const me = currentUser()
    if (patch.name !== undefined && !patch.name.trim()) throw new ServiceError('Company name is required.')
    store.update((d) => {
      const e = d.employers.find((x) => x.id === me.employerId)
      if (!e) throw new ServiceError('Company not found.')
      Object.assign(e, patch)
      if (patch.name) e.initials = patch.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
      writeAudit(d, me, 'Updated company profile', e.name, 'employer')
    })
  },
}

export const AdminService = {
  async setUserStatus(userId: string, status: 'active' | 'suspended') {
    await latency(400)
    const me = currentUser()
    if (userId === me.id) throw new ServiceError('You cannot suspend your own account.')
    store.update((d) => {
      const u = d.users.find((x) => x.id === userId)
      if (!u) throw new ServiceError('User not found.')
      u.status = status
      writeAudit(d, me, status === 'suspended' ? 'Suspended user' : 'Reactivated user', u.name, 'user')
    })
  },

  async setVerification(employerId: string, verification: VerificationStatus) {
    await latency(500)
    const me = currentUser()
    store.update((d) => {
      const e = d.employers.find((x) => x.id === employerId)
      if (!e) throw new ServiceError('Employer not found.')
      e.verification = verification
      employerUserIds(d, e.id).forEach((id) => pushNotification(d, {
        userId: id, category: 'system', icon: verification === 'verified' ? 'shield' : 'alert',
        title: verification === 'verified' ? 'Employer verification completed' : 'Verification not approved',
        body: verification === 'verified'
          ? `${e.name} is now verified. New job posts go live immediately.`
          : `We couldn't verify ${e.name}. Please update your company details.`,
        href: '/employer/company',
      }))
      writeAudit(d, me, verification === 'verified' ? 'Verified employer' : verification === 'rejected' ? 'Rejected employer verification' : 'Reset employer verification', e.name, 'employer')
    })
  },
}
