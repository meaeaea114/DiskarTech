import type { AuditEntry, DB, Notification, User } from '../types'
import { store } from '../mock/store'

export class ServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ServiceError'
  }
}

export const nowISO = () => new Date().toISOString()

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** Simulated network latency. Throws when "simulate errors" is enabled in demo tools. */
export async function latency(ms = 450) {
  await new Promise((r) => setTimeout(r, ms + Math.random() * 200))
  if (store.getPrefs().simulateErrors) {
    throw new ServiceError('Something went wrong. Please try again.')
  }
}

export function requireUser(db: DB, userId: string | undefined): User {
  const user = db.users.find((u) => u.id === userId)
  if (!user) throw new ServiceError('Your session has expired. Please log in again.')
  return user
}

export function currentUser(): User {
  const session = store.getSession()
  return requireUser(store.getDB(), session?.userId)
}

/** Push an in-app notification inside a store.update mutator, respecting user settings. */
export function pushNotification(
  draft: DB,
  n: Omit<Notification, 'id' | 'read' | 'createdAt'>,
  setting?: 'jobAlerts' | 'applicationUpdates' | 'learningReminders',
) {
  if (setting && draft.settings[n.userId] && draft.settings[n.userId][setting] === false) return
  draft.notifications.unshift({ ...n, id: uid('ntf'), read: false, createdAt: nowISO() })
}

export function writeAudit(draft: DB, actor: User | 'system', action: string, target: string, category: AuditEntry['category']) {
  draft.audit.unshift({
    id: uid('aud'),
    actorId: actor === 'system' ? 'system' : actor.id,
    actorName: actor === 'system' ? 'System' : actor.name,
    actorRole: actor === 'system' ? 'system' : actor.role,
    action, target, category, at: nowISO(),
  })
}

export const employerUserIds = (db: DB, employerId: string) =>
  db.users.filter((u) => u.role === 'employer' && u.employerId === employerId).map((u) => u.id)

export const adminUserIds = (db: DB) => db.users.filter((u) => u.role === 'admin').map((u) => u.id)
