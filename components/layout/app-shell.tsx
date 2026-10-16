'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight, BarChart3, Bell, Briefcase, Building2, ClipboardCheck, GraduationCap, Home, LayoutDashboard, Search,
  ShieldCheck, User, Users, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDB } from '@/lib/mock/store'
import { useMe } from '@/hooks/use-app'
import { NotificationService } from '@/lib/services'
import type { Role } from '@/lib/types'
import { Logo } from '@/components/brand'
import { Sheet } from '@/components/ui/sheet'

interface NavItem { href: string; label: string; icon: LucideIcon; match?: string[]; exact?: boolean }

// Bottom tabs per role. Secondary screens are reached from within these tabs.
const TABS: Record<Role, NavItem[]> = {
  youth: [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/jobs', label: 'Jobs', icon: Briefcase, match: ['/jobs', '/applications'] },
    { href: '/learn', label: 'Learn', icon: GraduationCap, match: ['/learn', '/assessment', '/career'] },
    { href: '/profile', label: 'Profile', icon: User, match: ['/profile', '/resume', '/settings'] },
  ],
  employer: [
    { href: '/employer', label: 'Dashboard', icon: LayoutDashboard, exact: true, match: ['/employer/analytics'] },
    { href: '/employer/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/employer/applicants', label: 'Applicants', icon: Users, match: ['/employer/applicants', '/employer/interviews'] },
    { href: '/employer/company', label: 'Company', icon: Building2, match: ['/employer/company', '/settings'] },
  ],
  admin: [
    { href: '/admin', label: 'Overview', icon: Home, exact: true, match: ['/admin/courses', '/admin/audit'] },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/employers', label: 'Employers', icon: ShieldCheck },
    { href: '/admin/jobs', label: 'Moderation', icon: ClipboardCheck },
    { href: '/admin/reports', label: 'Reports', icon: BarChart3, match: ['/admin/reports', '/settings'] },
  ],
}

const SEARCH: Record<Role, { href: string; title: string; placeholder: string; suggestions: string[] }> = {
  youth: { href: '/jobs', title: 'What are you looking for?', placeholder: 'Jobs, skills, companies…', suggestions: ['Web developer', 'IT support', 'Remote', 'Data analyst', 'Internship'] },
  employer: { href: '/employer/applicants', title: 'Find an applicant', placeholder: 'Name, skill, or job…', suggestions: ['JavaScript', 'Customer Service', 'Networking'] },
  admin: { href: '/admin/users', title: 'Find a user', placeholder: 'Name or email…', suggestions: ['BrightPath', 'Santos', 'Reyes'] },
}

function isActive(pathname: string, item: NavItem) {
  if (item.exact && pathname === item.href) return true
  const prefixes = item.exact ? item.match ?? [] : item.match ?? [item.href]
  return prefixes.some((m) => pathname === m || pathname.startsWith(m + '/'))
}

export function AppShell({ children }: { children: ReactNode }) {
  const me = useMe()
  const db = useDB()
  const pathname = usePathname()
  const params = useSearchParams()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const tabs = TABS[me.role]
  const search = SEARCH[me.role]
  const unread = NotificationService.unreadCount(db, me.id)

  const runSearch = (term: string) => {
    setSearchOpen(false)
    setQ('')
    router.push(term.trim() ? `${search.href}?q=${encodeURIComponent(term.trim())}` : search.href)
  }

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-[64px] items-center justify-between bg-canvas/95 px-5 pt-[env(safe-area-inset-top)] backdrop-blur">
        <Link href={tabs[0].href} aria-label="DiskarTech home"><Logo size={30} /></Link>
        <div className="flex items-center gap-4 text-[#30435b]">
          <button onClick={() => setSearchOpen(true)} aria-label="Search" className="grid size-8 place-items-center"><Search size={19} /></button>
          <Link href="/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative grid size-8 place-items-center">
            <Bell size={19} />
            {unread > 0 && <i className="absolute right-[5px] top-[4px] size-[7px] rounded-full border border-canvas bg-[#d86259]" />}
          </Link>
        </div>
      </header>

      {/* Screen content — key includes the query so a new search re-opens the screen fresh */}
      <main key={`${pathname}?${params.toString()}`} className="page-enter px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-2">
        {children}
      </main>

      {/* Bottom tab bar, fixed to the bottom of the phone screen */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#ececec] bg-[#fffdfb] pb-[env(safe-area-inset-bottom)]" aria-label="Main">
        <div className="flex h-[70px] items-center justify-around">
          {tabs.map((item) => {
            const active = isActive(pathname, item)
            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}
                className={cn('relative flex h-full min-w-[58px] flex-col items-center justify-center gap-[5px] text-[10px]', active ? 'text-brand' : 'text-[#9aa3ad]')}>
                {active && <span className="absolute top-[-1px] h-[2px] w-[30px] bg-brand" />}
                <item.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <Sheet open={searchOpen} onClose={() => setSearchOpen(false)}>
        <p className="eyebrow mt-2">Explore opportunities</p>
        <h2 className="mb-4 mt-1 font-serif text-[27px] font-medium leading-tight">{search.title}</h2>
        <form onSubmit={(e) => { e.preventDefault(); runSearch(q) }} className="flex items-center gap-2.5 rounded-[13px] border border-[#e8ebee] bg-white px-3.5 py-3 text-[#8d99a5]">
          <Search size={18} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={search.placeholder} className="w-full bg-transparent text-[14px] text-ink outline-none" aria-label="Search" />
        </form>
        <div className="mb-6 mt-3 flex flex-wrap gap-2">
          {search.suggestions.map((s) => <button key={s} onClick={() => runSearch(s)} className="rounded-[20px] bg-[#f0f3f6] px-3 py-2 text-[11px] text-[#647486] hover:text-brand">{s}</button>)}
        </div>
        <button className="btn btn-primary w-full" onClick={() => runSearch(q)}>Search <ArrowRight size={17} /></button>
      </Sheet>
    </div>
  )
}
