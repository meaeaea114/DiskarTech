import type { DB, UserSettings } from '../types'
import { store } from '../mock/store'
import { currentUser, latency } from './core'

export const NotificationService = {
  forUser: (db: DB, userId: string) =>
    db.notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  unreadCount: (db: DB, userId: string) => db.notifications.filter((n) => n.userId === userId && !n.read).length,

  markRead(id: string) {
    store.update((d) => {
      const n = d.notifications.find((x) => x.id === id)
      if (n) n.read = true
    })
  },

  markAllRead() {
    const me = currentUser()
    store.update((d) => d.notifications.forEach((n) => { if (n.userId === me.id) n.read = true }))
  },

  remove(id: string) {
    store.update((d) => { d.notifications = d.notifications.filter((n) => n.id !== id) })
  },
}

export const SettingsService = {
  async update(patch: Partial<UserSettings>) {
    await latency(250)
    const me = currentUser()
    store.update((d) => { d.settings[me.id] = { ...d.settings[me.id], ...patch } })
  },
}
