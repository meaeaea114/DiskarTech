'use client'

// Centralized client-side "database" for the prototype.
// Every screen reads from this store and every mutation goes through the
// service layer (lib/services), so a change in one place shows up everywhere.
// Data persists in localStorage and syncs across browser tabs.

import { useSyncExternalStore } from 'react'
import type { DB } from '../types'
import { buildSeed, DB_VERSION } from './seed'

const DB_KEY = 'diskartech:db'
const SESSION_KEY = 'diskartech:session'
const PREFS_KEY = 'diskartech:prefs'

export interface Session { userId: string; at: string }
export interface DevPrefs { simulateErrors: boolean }

interface State { db: DB; session: Session | null; prefs: DevPrefs }

let state: State | null = null
const listeners = new Set<() => void>()

function safeRead<T>(storage: Storage | undefined, key: string): T | null {
  try {
    const raw = storage?.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function safeWrite(storage: Storage | undefined, key: string, value: unknown) {
  try {
    if (value === null) storage?.removeItem(key)
    else storage?.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked — keep working in memory */
  }
}

function init(): State {
  if (state) return state
  const ls = typeof window !== 'undefined' ? window.localStorage : undefined
  const ss = typeof window !== 'undefined' ? window.sessionStorage : undefined
  let db = safeRead<DB>(ls, DB_KEY)
  if (!db || db.version !== DB_VERSION) {
    db = buildSeed()
    safeWrite(ls, DB_KEY, db)
  }
  // A per-tab session (sessionStorage) lets you keep e.g. a youth tab and an employer tab
  // open side by side; localStorage remembers the most recent login for new tabs.
  const session = safeRead<Session>(ss, SESSION_KEY) ?? safeRead<Session>(ls, SESSION_KEY)
  const prefs = safeRead<DevPrefs>(ls, PREFS_KEY) ?? { simulateErrors: false }
  state = { db, session, prefs }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === DB_KEY && e.newValue && state) {
        try {
          state = { ...state, db: JSON.parse(e.newValue) }
          emit()
        } catch { /* ignore malformed */ }
      }
    })
  }
  return state
}

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const store = {
  getDB: () => init().db,
  getSession: () => init().session,
  getPrefs: () => init().prefs,

  /** Apply a mutation to a copy of the DB, persist it, and notify subscribers. */
  update(mutator: (draft: DB) => void) {
    const s = init()
    const draft = structuredClone(s.db)
    mutator(draft)
    state = { ...s, db: draft }
    safeWrite(window.localStorage, DB_KEY, draft)
    emit()
  },

  setSession(session: Session | null) {
    state = { ...init(), session }
    safeWrite(window.sessionStorage, SESSION_KEY, session)
    safeWrite(window.localStorage, SESSION_KEY, session)
    emit()
  },

  setPrefs(prefs: Partial<DevPrefs>) {
    const s = init()
    state = { ...s, prefs: { ...s.prefs, ...prefs } }
    safeWrite(window.localStorage, PREFS_KEY, state.prefs)
    emit()
  },

  reset() {
    const db = buildSeed()
    state = { ...init(), db }
    safeWrite(window.localStorage, DB_KEY, db)
    emit()
  },

  subscribe,
}

const getDBSnapshot = () => init().db
const getSessionSnapshot = () => init().session
const getPrefsSnapshot = () => init().prefs

/** The whole DB. Derive what you need with useMemo — the reference only changes on mutation. */
export function useDB(): DB {
  return useSyncExternalStore(subscribe, getDBSnapshot, getDBSnapshot)
}

export function useSessionState(): Session | null {
  return useSyncExternalStore(subscribe, getSessionSnapshot, getSessionSnapshot)
}

export function usePrefs(): DevPrefs {
  return useSyncExternalStore(subscribe, getPrefsSnapshot, getPrefsSnapshot)
}
