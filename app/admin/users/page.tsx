'use client'

import { useMemo, useState } from 'react'
import { Search, UserX } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useAction, useMe, useQueryParam, useSimulatedLoad } from '@/hooks/use-app'
import { AdminService, ProfileService } from '@/lib/services'
import type { Role, User } from '@/lib/types'
import { formatDate, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Avatar, Badge, CardSkeleton, EmptyState, ProgressBar } from '@/components/ui/kit'
import { ConfirmDialog, Sheet } from '@/components/ui/sheet'
import { PageHeader } from '@/components/layout/page-header'

const PAGE = 10

export default function AdminUsers() {
  const db = useDB()
  const me = useMe()
  const [run, pending] = useAction()
  const [q, setQ] = useState(useQueryParam('q') ?? '')
  const [role, setRole] = useState<'all' | Role>('all')
  const [status, setStatus] = useState<'all' | User['status']>((useQueryParam('status') as User['status']) ?? 'all')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<User | null>(null)
  const [confirm, setConfirm] = useState<User | null>(null)
  const loading = useSimulatedLoad(`${role}${status}`, 300)

  const list = useMemo(() => db.users
    .filter((u) => (role === 'all' || u.role === role) && (status === 'all' || u.status === status) && `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [db.users, role, status, q])
  const pages = Math.max(1, Math.ceil(list.length / PAGE))
  const current = Math.min(page, pages - 1)
  const fresh = selected && db.users.find((u) => u.id === selected.id)

  const toggle = async (u: User) => {
    const next = u.status === 'active' ? 'suspended' : 'active'
    const r = await run(() => AdminService.setUserStatus(u.id, next), { success: `${u.name} ${next === 'suspended' ? 'suspended' : 'reactivated'}` })
    if (r.ok) setConfirm(null)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Users" bell subtitle={`${db.users.length} accounts · ${db.users.filter((u) => u.status === 'suspended').length} suspended`} />
      <label className="card flex items-center gap-3 px-4"><Search size={18} className="text-muted" /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Search name or email" className="h-12 flex-1 bg-transparent text-[15px] outline-none" aria-label="Search users" /></label>
      <div className="scrollbar-none -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        {(['all', 'youth', 'employer', 'admin'] as const).map((r) => <button key={r} onClick={() => { setRole(r); setPage(0) }} className={cn('chip', role === r && 'chip-active')}>{r === 'all' ? 'All roles' : r === 'youth' ? 'Job seekers' : r === 'employer' ? 'Employers' : 'Admins'}</button>)}
        <span className="mx-1 w-px shrink-0 bg-line" />
        {(['all', 'active', 'suspended'] as const).map((s) => <button key={s} onClick={() => { setStatus(s); setPage(0) }} className={cn('chip', status === s && 'chip-active')}>{s === 'all' ? 'Any status' : s[0].toUpperCase() + s.slice(1)}</button>)}
      </div>

      <div className="mt-4">
        {loading ? <CardSkeleton rows={4} /> : list.length === 0 ? <EmptyState icon={UserX} title="No users found" message="Try a different search or filter." /> : (
          <>
            <div className="card divide-y divide-line">
              {list.slice(current * PAGE, current * PAGE + PAGE).map((u) => (
                <button key={u.id} onClick={() => setSelected(u)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-canvas/60">
                  <Avatar name={u.name} color={db.profiles.find((p) => p.userId === u.id)?.avatarColor ?? db.employers.find((e) => e.id === u.employerId)?.color} size={40} />
                  <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-semibold">{u.name}</p><p className="truncate text-[12px] text-muted">{u.email}</p></div>
                  <Badge tone={u.role === 'admin' ? 'purple' : u.role === 'employer' ? 'gold' : 'blue'} className="hidden">{u.role === 'youth' ? 'Job seeker' : u.role}</Badge>
                  <Badge tone={u.status === 'active' ? 'green' : 'red'}>{u.status}</Badge>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-[13px]">
              <span className="text-muted">{current * PAGE + 1}–{Math.min(list.length, (current + 1) * PAGE)} of {list.length}</span>
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button>
                <button className="btn btn-secondary btn-sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      <Sheet open={!!fresh} onClose={() => setSelected(null)} title={fresh?.name} description={fresh?.email}>
        {fresh && (() => {
          const profile = db.profiles.find((p) => p.userId === fresh.id)
          const employer = db.employers.find((e) => e.id === fresh.employerId)
          const apps = db.applications.filter((a) => a.userId === fresh.id)
          return (
            <div className="space-y-3">
              <div className="card divide-y divide-line px-4 text-[14px]">
                <Row k="Role" v={fresh.role === 'youth' ? 'Job seeker' : fresh.role} />
                <Row k="Status" v={<Badge tone={fresh.status === 'active' ? 'green' : 'red'}>{fresh.status}</Badge>} />
                <Row k="Joined" v={formatDate(fresh.createdAt)} />
                <Row k="Last active" v={timeAgo(fresh.lastActiveAt)} />
                {employer && <Row k="Company" v={employer.name} />}
                {profile && <Row k="Location" v={profile.location || '—'} />}
                {profile && <Row k="Applications" v={apps.length} />}
                {profile && <Row k="Courses completed" v={db.enrollments.filter((e) => e.userId === fresh.id && e.completedAt).length} />}
              </div>
              {profile && <div className="card card-pad"><div className="mb-1.5 flex justify-between text-[13px]"><span>Profile completion</span><b>{ProfileService.completion(profile).percent}%</b></div><ProgressBar value={ProfileService.completion(profile).percent} /></div>}
              {fresh.id !== me.id && (
                <button className={cn('btn w-full', fresh.status === 'active' ? 'btn-danger' : 'btn-primary')} disabled={pending} onClick={() => setConfirm(fresh)}>
                  {fresh.status === 'active' ? 'Suspend account' : 'Reactivate account'}
                </button>
              )}
            </div>
          )
        })()}
      </Sheet>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} busy={pending} tone={confirm?.status === 'active' ? 'danger' : 'primary'}
        title={confirm?.status === 'active' ? `Suspend ${confirm?.name}?` : `Reactivate ${confirm?.name}?`}
        message={confirm?.status === 'active' ? 'They will be signed out and unable to log in until reactivated.' : 'They will be able to log in again.'}
        confirmLabel={confirm?.status === 'active' ? 'Suspend' : 'Reactivate'} onConfirm={() => confirm && toggle(confirm)} />
    </div>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 py-3"><span className="text-muted">{k}</span><span className="font-medium capitalize">{v}</span></div>
}
