'use client'

import Link from 'next/link'
import { BookOpen, ClipboardCheck, ScrollText, Settings, ShieldCheck, Users } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useMe } from '@/hooks/use-app'
import { timeAgo } from '@/lib/format'
import { Avatar, SectionHeader, StatTile } from '@/components/ui/kit'
import { BarChart, perDay } from '@/components/ui/charts'

export default function AdminDashboard() {
  const db = useDB()
  const me = useMe()
  const weekAgo = Date.now() - 7 * 86_400_000
  const youth = db.users.filter((u) => u.role === 'youth')
  const activeUsers = db.users.filter((u) => u.status === 'active' && new Date(u.lastActiveAt).getTime() > weekAgo).length
  const pendingJobs = db.jobs.filter((j) => j.status === 'pending')
  const pendingEmployers = db.employers.filter((e) => e.verification === 'pending')

  return (
    <div>
      <section className="mb-[22px] mt-1 flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-[7px]">Admin dashboard</p>
          <h1 className="mb-2 text-[27px] leading-[1.08]">Platform overview</h1>
          <p className="text-[12px] text-muted">Good day, {me.name.split(' ')[0]}. Here’s what needs your attention.</p>
        </div>
        <Link href="/settings" className="grid size-[38px] shrink-0 place-items-center rounded-full border border-[#ebedf0] bg-white text-[#30435b]" aria-label="Settings"><Settings size={18} /></Link>
      </section>

      <div className="bg-hero rounded-[19px] p-5 text-white shadow-[var(--shadow-hero)]">
        <span className="text-[10px] font-bold uppercase tracking-[1.35px] text-[#c5dcf2]">Needs review</span>
        <h3 className="mb-3 mt-[7px] font-serif text-[19px] font-medium">{pendingJobs.length + pendingEmployers.length ? `${pendingJobs.length + pendingEmployers.length} item(s) waiting` : 'All caught up'}</h3>
        <div className="flex flex-wrap gap-2 text-[12px]">
          <Link href="/admin/jobs" className="rounded-full bg-white px-3 py-1.5 font-bold text-navy">{pendingJobs.length} job post(s)</Link>
          <Link href="/admin/employers" className="rounded-full bg-white/15 px-3 py-1.5 font-bold">{pendingEmployers.length} employer(s)</Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <StatTile label="Total users" value={db.users.length} href="/admin/users" accent="#1877D4" sub={`${youth.length} job seekers`} />
        <StatTile label="Active users (7d)" value={activeUsers} href="/admin/users" accent="#1877D4" />
        <StatTile label="Employers" value={db.employers.length} href="/admin/employers" accent="#C98A0B" sub={`${db.employers.filter((e) => e.verification === 'verified').length} verified`} />
        <StatTile label="Active jobs" value={db.jobs.filter((j) => j.status === 'published').length} href="/admin/jobs" accent="#1E9E5A" sub={`${pendingJobs.length} pending`} />
        <StatTile label="Applications" value={db.applications.length} href="/admin/reports" accent="#6E56CF" sub={`${db.applications.filter((a) => a.status === 'hired').length} hires`} />
        <StatTile label="Training courses" value={db.courses.filter((c) => c.status === 'published').length} href="/admin/courses" accent="#6E56CF" sub={`${db.enrollments.length} enrollments`} />
        <StatTile label="Certificates issued" value={db.certificates.length} href="/admin/reports" />
        <StatTile label="Assessments taken" value={db.assessments.length} href="/admin/reports" />
        <StatTile label="Pending verifications" value={pendingEmployers.length} href="/admin/employers" />
        <StatTile label="Suspended users" value={db.users.filter((u) => u.status === 'suspended').length} href="/admin/users?status=suspended" />
      </div>

      <SectionHeader title="Management" />
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { href: '/admin/users', icon: Users, label: 'Users' },
          { href: '/admin/jobs', icon: ClipboardCheck, label: 'Moderation' },
          { href: '/admin/courses', icon: BookOpen, label: 'Content' },
          { href: '/admin/audit', icon: ScrollText, label: 'Audit log' },
        ].map((t) => (
          <Link key={t.href} href={t.href} className="card tap flex flex-col items-center gap-2 py-4">
            <span className="grid size-10 place-items-center rounded-full bg-brand-50 text-brand"><t.icon size={19} /></span>
            <span className="text-[12px] font-medium">{t.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-x-8">
        <div>
          <SectionHeader title="Platform activity" href="/admin/reports" actionLabel="Reports" />
          <div className="card card-pad"><p className="mb-3 text-[13px] text-muted">Applications submitted · last 14 days</p><BarChart label="Applications per day, last 14 days" data={perDay(db.applications.map((a) => a.appliedAt), 14)} /></div>
        </div>
        <div>
          <SectionHeader title="Recent Activity" href="/admin/audit" />
          <div className="card divide-y divide-line">
            {db.audit.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />
                <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold">{a.action}</p><p className="truncate text-[12px] text-muted">{a.target} · {a.actorName} · {timeAgo(a.at)}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
