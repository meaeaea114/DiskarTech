import type { Role, User } from '../types'
import { store } from '../mock/store'
import { DEFAULT_SETTINGS } from '../mock/seed'
import { AVATAR_COLORS } from '../data/users'
import { latency, nowISO, pushNotification, ServiceError, uid, writeAudit, adminUserIds, currentUser } from './core'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface RegisterInput {
  role: Extract<Role, 'youth' | 'employer'>
  firstName: string
  lastName: string
  email: string
  password: string
  companyName?: string
  location?: string
}

export const AuthService = {
  validateEmail: (email: string) => EMAIL_RE.test(email.trim()),

  async login(email: string, password: string): Promise<User> {
    await latency(650)
    const db = store.getDB()
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user || user.password !== password) throw new ServiceError('Incorrect email or password.')
    if (user.status === 'suspended') throw new ServiceError('This account has been suspended. Please contact support@diskartech.ph.')
    store.update((d) => {
      const u = d.users.find((x) => x.id === user.id)!
      u.lastActiveAt = nowISO()
      writeAudit(d, u, 'Signed in', u.email, 'auth')
    })
    store.setSession({ userId: user.id, at: nowISO() })
    return user
  },

  /** Instant switch between seeded demo accounts (demo mode only). */
  async loginAsDemo(email: string) {
    const db = store.getDB()
    const user = db.users.find((u) => u.email === email)
    if (!user) throw new ServiceError('Demo account not found. Try resetting demo data.')
    return AuthService.login(email, user.password)
  },

  logout() {
    store.setSession(null)
  },

  async register(input: RegisterInput): Promise<User> {
    await latency(800)
    const email = input.email.trim().toLowerCase()
    if (!EMAIL_RE.test(email)) throw new ServiceError('Please enter a valid email address.')
    if (input.password.length < 8) throw new ServiceError('Password must be at least 8 characters.')
    if (store.getDB().users.some((u) => u.email.toLowerCase() === email)) {
      throw new ServiceError('An account with this email already exists.')
    }
    const userId = uid('usr')
    const name = `${input.firstName.trim()} ${input.lastName.trim()}`
    let created!: User
    store.update((d) => {
      let employerId: string | undefined
      if (input.role === 'employer') {
        const company = (input.companyName ?? '').trim()
        employerId = uid('emp')
        d.employers.push({
          id: employerId, name: company, initials: company.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
          industry: 'Not specified', location: input.location || 'Philippines', size: '1–10 employees', about: '', website: '',
          color: AVATAR_COLORS[d.employers.length % AVATAR_COLORS.length], verification: 'pending', createdAt: nowISO(),
        })
        adminUserIds(d).forEach((adminId) => pushNotification(d, {
          userId: adminId, category: 'system', icon: 'shield', title: 'Employer awaiting verification',
          body: `${company} just registered`, href: '/admin/employers',
        }))
      }
      created = { id: userId, role: input.role, email, password: input.password, name, status: 'active', createdAt: nowISO(), lastActiveAt: nowISO(), employerId }
      d.users.push(created)
      d.settings[userId] = { ...DEFAULT_SETTINGS }
      if (input.role === 'youth') {
        d.profiles.push({
          userId, firstName: input.firstName.trim(), lastName: input.lastName.trim(), headline: '', location: input.location || '',
          phone: '', email, summary: '', openToWork: true, avatarColor: AVATAR_COLORS[d.profiles.length % AVATAR_COLORS.length],
          education: [], skills: [], experience: [], certifications: [], projects: [], interests: [], preferredLocations: [],
        })
        pushNotification(d, {
          userId, category: 'system', icon: 'shield', title: `Welcome to DiskarTech, ${input.firstName.trim()}!`,
          body: 'Take the skills assessment to unlock personalized job matches.', href: '/assessment',
        })
      } else {
        pushNotification(d, {
          userId, category: 'system', icon: 'shield', title: 'Verification in progress',
          body: 'Our team is reviewing your company. Job posts will need approval until you are verified.', href: '/employer/company',
        })
      }
      writeAudit(d, created, 'New user registered', `${name} (${input.role})`, 'user')
    })
    store.setSession({ userId, at: nowISO() })
    return created
  },

  async changePassword(current: string, next: string) {
    await latency()
    const me = currentUser()
    if (me.password !== current) throw new ServiceError('Your current password is incorrect.')
    if (next.length < 8) throw new ServiceError('New password must be at least 8 characters.')
    store.update((d) => {
      d.users.find((u) => u.id === me.id)!.password = next
      writeAudit(d, me, 'Changed password', me.email, 'auth')
    })
  },
}
