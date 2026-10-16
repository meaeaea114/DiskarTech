'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDB, useSessionState } from '@/lib/mock/store'
import { toast } from '@/components/ui/toast'
import type { User } from '@/lib/types'

/** The signed-in user (or null). */
export function useCurrentUser(): User | null {
  const db = useDB()
  const session = useSessionState()
  return useMemo(() => db.users.find((u) => u.id === session?.userId) ?? null, [db.users, session?.userId])
}

/** Like useCurrentUser, for screens already behind a RoleGuard. */
export function useMe(): User {
  const me = useCurrentUser()
  if (!me) throw new Error('useMe() used outside of an authenticated route')
  return me
}

/**
 * Runs an async service call with pending state and toast feedback.
 * Resolves to { ok: true, data } or { ok: false } (the error is shown as a toast).
 */
export function useAction() {
  const [pending, setPending] = useState(false)
  const run = useCallback(async <T,>(fn: () => Promise<T>, opts: { success?: string | ((r: T) => string); error?: string } = {}): Promise<{ ok: true; data: T } | { ok: false; data?: undefined }> => {
    setPending(true)
    try {
      const data = await fn()
      if (opts.success) toast.success(typeof opts.success === 'function' ? opts.success(data) : opts.success)
      return { ok: true, data }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : opts.error ?? 'Something went wrong. Please try again.')
      return { ok: false }
    } finally {
      setPending(false)
    }
  }, [])
  return [run, pending] as const
}

/** Simulates an initial network fetch so screens show their loading skeletons. Re-runs when `key` changes. */
export function useSimulatedLoad(key: unknown = 'once', ms = 450) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(t)
  }, [key, ms])
  return loading
}

/**
 * Reads a query-string value when the screen mounts (e.g. ?q=, ?tab=).
 * Uses the router's params so client-side navigations see the new URL immediately.
 */
export function useQueryParam(name: string): string | null {
  const params = useSearchParams()
  const [value] = useState(() => params.get(name))
  return value
}
