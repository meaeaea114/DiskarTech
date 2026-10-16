'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/use-app'
import { ROLE_HOME, TAGLINE } from '@/lib/constants'
import type { Role } from '@/lib/types'
import { LogoMark } from '@/components/brand'
import { toast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/sheet'

export function Splash() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-gradient-to-b from-navy to-navy-900 text-white">
      <div className="flex flex-col items-center">
        <div className="grid size-40 place-items-center rounded-full bg-white/5 ring-[28px] ring-white/[0.03]">
          <LogoMark size={92} className="rounded-[22px] ring-0" />
        </div>
        <h1 className="mt-8 text-[32px] font-bold tracking-tight">DiskarTech</h1>
        <p className="mt-2 text-[14px] text-white/80">{TAGLINE}</p>
        <Spinner className="mt-8 size-5 text-white/60" />
      </div>
    </div>
  )
}

/**
 * All app state lives in the browser (localStorage), so screens render only
 * after mount. This avoids hydration mismatches and shows the splash meanwhile.
 */
export function ClientGate({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? <>{children}</> : <Splash />
}

/** Protects a route: requires login and (optionally) one of the given roles. */
export function RoleGuard({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const me = useCurrentUser()
  const router = useRouter()
  const pathname = usePathname()
  const allowed = !!me && me.status === 'active' && (!roles || roles.includes(me.role))

  useEffect(() => {
    if (!me) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    } else if (me.status !== 'active') {
      router.replace('/login')
    } else if (roles && !roles.includes(me.role)) {
      toast.error('You don’t have access to that page.')
      router.replace(ROLE_HOME[me.role])
    }
  }, [me, roles, router, pathname])

  if (!allowed) {
    return <div className="grid min-h-full place-items-center"><Spinner className="size-6 text-brand" /></div>
  }
  return <>{children}</>
}
