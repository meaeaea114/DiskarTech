'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BellOff, Trash2 } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useMe, useSimulatedLoad } from '@/hooks/use-app'
import { NotificationService } from '@/lib/services'
import type { Notification } from '@/lib/types'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CardSkeleton, ChipGroup, EmptyState } from '@/components/ui/kit'
import { PageHeader } from '@/components/layout/page-header'
import { NotificationIcon } from '@/components/features/notifications'
import { toast } from '@/components/ui/toast'

type Filter = 'all' | 'unread' | Notification['category']

function bucket(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(Date.now() - 86_400_000)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return 'Earlier'
}

export default function NotificationsPage() {
  const db = useDB()
  const me = useMe()
  const router = useRouter()
  const loading = useSimulatedLoad()
  const [filter, setFilter] = useState<Filter>('all')
  const all = NotificationService.forUser(db, me.id)
  const unread = all.filter((n) => !n.read).length

  const groups = useMemo(() => {
    const list = all.filter((n) => filter === 'all' || (filter === 'unread' ? !n.read : n.category === filter))
    const g = new Map<string, Notification[]>()
    list.forEach((n) => { const k = bucket(n.createdAt); g.set(k, [...(g.get(k) ?? []), n]) })
    return [...g.entries()]
  }, [all, filter])

  const open = (n: Notification) => {
    NotificationService.markRead(n.id)
    router.push(n.href)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Notifications" back subtitle={unread ? `${unread} unread` : 'You’re all caught up'} />
      <div className="scrollbar-none -mx-5 overflow-x-auto px-5">
        <ChipGroup value={filter} onChange={setFilter} options={[
          { value: 'all', label: 'All' }, { value: 'unread', label: `Unread${unread ? ` (${unread})` : ''}` },
          { value: 'jobs', label: 'Jobs' }, { value: 'learning', label: 'Learning' }, { value: 'system', label: 'System' },
        ]} />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-subtle">{groups[0]?.[0] ?? ''}</span>
        {unread > 0 && <button className="link" onClick={() => { NotificationService.markAllRead(); toast.success('All notifications marked as read') }}>Mark all as read</button>}
      </div>

      {loading ? <div className="mt-3"><CardSkeleton rows={4} /></div> : groups.length === 0 ? (
        <div className="mt-3"><EmptyState icon={BellOff} title="No notifications" message={filter === 'all' ? 'Updates about your activity will appear here.' : 'Nothing in this category yet.'} /></div>
      ) : groups.map(([label, items], gi) => (
        <section key={label} className="mt-3">
          {gi > 0 && <h2 className="mb-2 mt-6 text-[12px] font-semibold uppercase tracking-wider text-subtle">{label}</h2>}
          <div className="grid gap-2.5">
            {items.map((n) => (
              <div key={n.id} className={cn('card group flex items-start gap-3 p-4 transition', !n.read && 'ring-1 ring-brand/15')}>
                <button onClick={() => open(n)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                  <NotificationIcon icon={n.icon} />
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-[15px]', n.read ? 'font-medium' : 'font-bold')}>{n.title}</p>
                    <p className="mt-0.5 text-[13px] text-muted">{n.body}</p>
                    <p className="mt-1.5 text-[12px] text-subtle">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
                <div className="flex flex-col items-center gap-2">
                  {!n.read && <span className="mt-1 size-2.5 rounded-full bg-brand" aria-label="Unread" />}
                  <button onClick={() => { NotificationService.remove(n.id); toast.info('Notification removed') }} className="text-subtle opacity-60 hover:text-danger hover:opacity-100" aria-label="Delete notification"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
