'use client'

import Link from 'next/link'
import { Award, Bookmark, Briefcase, ChevronRight, ClipboardList, FileText, FolderKanban, GraduationCap, Heart, MapPin, Settings, Sparkles, User } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useAction, useMe } from '@/hooks/use-app'
import { ProfileService } from '@/lib/services'
import { cn } from '@/lib/utils'
import { Avatar, ProgressBar, SectionHeader } from '@/components/ui/kit'
import { PageHeader } from '@/components/layout/page-header'

export default function ProfilePage() {
  const db = useDB()
  const me = useMe()
  const [run, pending] = useAction()
  const p = ProfileService.get(db, me.id)
  if (!p) return null
  const completion = ProfileService.completion(p)
  const apps = db.applications.filter((a) => a.userId === me.id && !['hired', 'rejected'].includes(a.status)).length
  const saved = (db.saved[me.id] ?? []).length

  const status = (n: number, unit: string) => (n ? { text: `${n} ${unit}${n === 1 ? '' : 's'} added`, ok: true } : { text: 'Add details', ok: false })
  const sections = [
    { href: '/profile/personal', icon: User, title: 'Personal Information', s: p.headline && p.phone && p.summary ? { text: 'Complete', ok: true } : { text: 'Incomplete', ok: false } },
    { href: '/profile/education', icon: GraduationCap, title: 'Education', s: status(p.education.length, 'school') },
    { href: '/profile/skills', icon: Sparkles, title: 'Skills', s: status(p.skills.length, 'skill') },
    { href: '/profile/experience', icon: Briefcase, title: 'Work Experience', s: status(p.experience.length, 'role') },
    { href: '/profile/certifications', icon: Award, title: 'Certifications', s: status(p.certifications.length, 'certificate') },
    { href: '/profile/projects', icon: FolderKanban, title: 'Projects', s: status(p.projects.length, 'project') },
    { href: '/profile/interests', icon: Heart, title: 'Career Interests', s: status(p.interests.length, 'interest') },
    { href: '/resume', icon: FileText, title: 'Résumé', s: { text: completion.percent >= 70 ? 'Ready to preview' : 'Needs more details', ok: completion.percent >= 70 } },
  ]

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Profile" actions={<Link href="/settings" className="grid size-10 place-items-center rounded-full bg-white text-navy shadow-[var(--shadow-card)]" aria-label="Settings"><Settings size={19} /></Link>} bell />

      <div className="card p-5">
        <div className="flex items-center gap-4">
          <Avatar name={ProfileService.fullName(p)} color={p.avatarColor} size={64} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[20px] font-bold">{ProfileService.fullName(p)}</h2>
            <p className="truncate text-[13px] text-muted">{p.headline || 'Add a headline'}</p>
            {p.location && <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted"><MapPin size={12} />{p.location}</p>}
          </div>
        </div>
        <button disabled={pending} onClick={() => run(() => ProfileService.update({ openToWork: !p.openToWork }), { success: p.openToWork ? 'Hidden from employer searches' : 'Employers can now see you’re open to work' })}
          className={cn('mt-3 rounded-full px-3 py-1.5 text-[12px] font-semibold transition', p.openToWork ? 'bg-success-50 text-success' : 'bg-[#eef1f5] text-muted')}>
          {p.openToWork ? '● Open to work' : '○ Not looking right now'}
        </button>
        <div className="mt-4 flex justify-between text-[13px]"><span className="text-muted">Profile completion</span><span className="font-bold text-brand">{completion.percent}%</span></div>
        <ProgressBar value={completion.percent} className="mt-1.5" />
        {completion.missing.length > 0 && (
          <div className="mt-3 space-y-1">
            {completion.missing.slice(0, 2).map((m) => <Link key={m.label} href={m.href} className="flex items-center gap-1 text-[13px] font-medium text-brand">+ {m.label}</Link>)}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href="/applications" className="card tap flex items-center gap-3 p-4"><ClipboardList size={20} className="text-brand" /><div><p className="text-[18px] font-bold">{apps}</p><p className="text-[12px] text-muted">Active applications</p></div></Link>
        <Link href="/applications?tab=saved" className="card tap flex items-center gap-3 p-4"><Bookmark size={20} className="text-brand" /><div><p className="text-[18px] font-bold">{saved}</p><p className="text-[12px] text-muted">Saved jobs</p></div></Link>
      </div>

      <SectionHeader title="Build your profile" />
      <div className="grid gap-2.5">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="card tap flex items-center gap-3.5 p-4">
            <span className="grid size-10 place-items-center rounded-full bg-brand-50 text-brand"><s.icon size={18} /></span>
            <div className="flex-1"><p className="text-[15px] font-semibold">{s.title}</p><p className={cn('text-[12px] font-medium', s.s.ok ? 'text-success' : 'text-muted')}>{s.s.text}</p></div>
            <ChevronRight size={18} className="text-subtle" />
          </Link>
        ))}
      </div>
      <Link href="/resume" className="btn btn-primary mt-6 w-full">View My Résumé</Link>
    </div>
  )
}
