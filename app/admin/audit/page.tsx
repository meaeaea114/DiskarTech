'use client'

import { useState } from 'react'
import { Search, ScrollText } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import type { AuditEntry } from '@/lib/types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge, EmptyState } from '@/components/ui/kit'
import { PageHeader } from '@/components/layout/page-header'

const CATS: ('all' | AuditEntry['category'])[] = ['all', 'auth', 'user', 'employer', 'job', 'application', 'course']
const PAGE = 25

export default function Audit() {
  const db = useDB()
  const [cat, setCat] = useState<(typeof CATS)[number]>('all')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const list = db.audit.filter((a) => (cat === 'all' || a.category === cat) && `${a.action} ${a.target} ${a.actorName}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Audit Log" back="/admin" subtitle={`${db.audit.length} recorded events`} />
      <label className="card flex items-center gap-3 px-4"><Search size={18} className="text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actions, people, or targets" className="h-12 flex-1 bg-transparent text-[15px] outline-none" aria-label="Search audit log" /></label>
      <div className="scrollbar-none -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        {CATS.map((c) => <button key={c} onClick={() => setCat(c)} className={cn('chip capitalize', cat === c && 'chip-active')}>{c}</button>)}
      </div>
      <div className="mt-4">
        {list.length === 0 ? <EmptyState icon={ScrollText} title="No matching events" /> : (
          <div className="card divide-y divide-line">
            {list.slice(0, limit).map((a) => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2"><p className="text-[13px] font-bold">{a.action}</p><Badge className="shrink-0 px-2 py-0.5 text-[10px] capitalize">{a.actorRole}</Badge></div>
                <p className="mt-0.5 text-[12px] text-muted">{a.target}</p>
                <p className="mt-1 text-[10px] text-subtle">{a.actorName} · {formatDate(a.at, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
              </div>
            ))}
          </div>
        )}
        {limit < list.length && <div className="mt-4 text-center"><button className="btn btn-secondary btn-sm" onClick={() => setLimit(limit + PAGE)}>Load more</button></div>}
      </div>
    </div>
  )
}
