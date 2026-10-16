'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, ChevronLeft } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useMe } from '@/hooks/use-app'
import { NotificationService } from '@/lib/services'
import { cn } from '@/lib/utils'

export function BellButton() {
  const db = useDB()
  const me = useMe()
  const unread = NotificationService.unreadCount(db, me.id)
  return (
    <Link href="/notifications" className="relative grid size-10 place-items-center rounded-full bg-white text-navy shadow-[var(--shadow-card)]" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
      <Bell size={19} />
      {unread > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full border-2 border-canvas bg-danger px-1 text-center text-[10px] font-bold leading-[14px] text-white">{unread}</span>}
    </Link>
  )
}

export function BackButton({ href }: { href?: string }) {
  const router = useRouter()
  const cls = 'grid size-[38px] shrink-0 place-items-center rounded-full border border-[#ebedf0] bg-white text-[#30435b] hover:bg-brand-50'
  if (href) return <Link href={href} className={cls} aria-label="Back"><ChevronLeft size={21} /></Link>
  return <button onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))} className={cls} aria-label="Back"><ChevronLeft size={21} /></button>
}

/** Screen title (serif, as in the original theme) with optional back button and trailing actions.
 *  `bell` is accepted for compatibility; the notification bell lives in the app top bar. */
export function PageHeader({ title, eyebrow, subtitle, back, actions, bell, className }: {
  title: ReactNode
  eyebrow?: ReactNode
  subtitle?: ReactNode
  back?: boolean | string
  actions?: ReactNode
  bell?: boolean
  className?: string
}) {
  return (
    <header className={cn('mb-5', className)}>
      {back && (
        <div className="mb-4 flex items-center justify-between">
          <BackButton href={typeof back === 'string' ? back : undefined} />
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="mt-1 text-[12px] leading-relaxed text-muted">{subtitle}</p>}
        </div>
        {!back && actions && <div className="flex shrink-0 items-center gap-2 pt-1">{actions}</div>}
      </div>
    </header>
  )
}
