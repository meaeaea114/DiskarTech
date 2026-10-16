'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Building2, Check, ChevronDown, ChevronRight, FileText, GraduationCap, MapPin, Search, ShieldCheck, Target,
} from 'lucide-react'
import { Splash } from '@/components/layout/guards'
import { Logo } from '@/components/brand'
import { CompanyLogo, IconTile } from '@/components/ui/kit'
import { useCurrentUser } from '@/hooks/use-app'
import { useDB } from '@/lib/mock/store'
import { JobService } from '@/lib/services'
import { ROLE_HOME, TAGLINE } from '@/lib/constants'
import { salaryRange } from '@/lib/format'
import { cn } from '@/lib/utils'

const FEATURES = [
  { icon: Search, tone: 'bg-[#e6f1ff] text-[#2675be]', title: 'Find jobs', body: 'Entry-level roles matched to your skills' },
  { icon: Target, tone: 'bg-[#fff1d7] text-[#c38b29]', title: 'Career guide', body: 'Discover paths that fit your strengths' },
  { icon: GraduationCap, tone: 'bg-[#e6f5ed] text-[#33966a]', title: 'Learn skills', body: 'Free courses with certificates' },
  { icon: FileText, tone: 'bg-[#f8e9e8] text-[#ac5d60]', title: 'Build resume', body: 'A polished résumé in minutes' },
]

const STEPS = [
  { title: 'Create your free profile', body: 'Add your education, skills, and the careers you’re curious about.' },
  { title: 'Find your strengths', body: 'Take a 5-minute skills assessment and close gaps with free courses.' },
  { title: 'Apply and track', body: 'Apply in a few taps and follow every update, from review to hired.' },
]

const FAQ = [
  { q: 'Is DiskarTech free?', a: 'Yes. Creating a profile, applying to jobs, and taking courses are free for job seekers.' },
  { q: 'Who can use DiskarTech?', a: 'Students, fresh graduates, and young Filipinos looking for their first or next job — no experience required.' },
  { q: 'Are employers verified?', a: 'Our team reviews every employer. Jobs from unverified companies are checked before they go live.' },
  { q: 'How is my data protected?', a: 'Your profile is only shared with employers you apply to, in line with the Data Privacy Act of 2012.' },
]

/** Public landing page. Signed-in users go straight to their dashboard. */
export default function Landing() {
  const me = useCurrentUser()
  const router = useRouter()
  const db = useDB()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => { if (me) router.replace(ROLE_HOME[me.role]) }, [me, router])

  const stats = useMemo(() => ({
    jobs: db.jobs.filter(JobService.isOpen),
    courses: db.courses.filter((c) => c.status === 'published'),
    employers: db.employers.filter((e) => e.verification === 'verified').length,
  }), [db])

  if (me) return <Splash />

  const featuredJobs = [...stats.jobs].sort((a, b) => b.postedAt.localeCompare(a.postedAt)).slice(0, 3)
  const loginTo = (path: string) => `/login?next=${encodeURIComponent(path)}`

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-[64px] items-center justify-between bg-canvas/95 px-5 backdrop-blur">
        <Logo />
        <Link href="/login" className="text-[13px] font-bold text-brand">Log in</Link>
      </header>

      <main className="page-enter px-5 pb-10">
        {/* Hero */}
        <section className="pt-4">
          <p className="eyebrow mb-[7px]">For Filipino youth</p>
          <h1 className="text-[34px] leading-[1.05]">Skills today.<br />Opportunities tomorrow.</h1>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">Find entry-level jobs, build in-demand skills with free courses, and get career guidance made for young Filipinos.</p>
          <div className="mt-5 grid gap-2.5">
            <Link href="/welcome" className="btn btn-primary">Get started — it’s free <ArrowRight size={17} /></Link>
            <Link href="/login" className="btn btn-secondary">I already have an account</Link>
          </div>
        </section>

        {/* Live numbers */}
        <section className="bg-hero mt-6 rounded-[19px] p-5 text-white shadow-[var(--shadow-hero)]">
          <span className="text-[10px] font-bold uppercase tracking-[1.35px] text-[#c5dcf2]">On DiskarTech right now</span>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[[stats.jobs.length, 'open jobs'], [stats.courses.length, 'free courses'], [stats.employers, 'verified employers']].map(([n, l]) => (
              <div key={l as string} className="rounded-[14px] bg-white/10 px-1 py-3">
                <b className="block font-serif text-[24px] font-normal">{n}</b>
                <small className="text-[10px] text-[#cfe3f8]">{l}</small>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[#cfe3f8]">From Manila and Cebu to Batangas, Laguna, and Davao.</p>
        </section>

        {/* What you can do */}
        <SectionHead title="Everything in one app" />
        <div className="grid grid-cols-2 gap-2.5">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-[15px] border border-[#edf0f2] bg-white p-[13px] shadow-[0_3px_10px_rgba(32,53,75,0.03)]">
              <span className={`grid size-[35px] place-items-center rounded-[11px] ${f.tone}`}><f.icon size={20} /></span>
              <b className="mb-1 mt-2.5 block text-[13px]">{f.title}</b>
              <small className="block text-[10px] leading-snug text-muted">{f.body}</small>
            </div>
          ))}
        </div>

        {/* Jobs hiring now */}
        <SectionHead title="Hiring now" href={loginTo('/jobs')} action="See all" />
        <div className="grid gap-[11px]">
          {featuredJobs.map((job) => {
            const emp = db.employers.find((e) => e.id === job.employerId)
            return (
              <Link key={job.id} href={loginTo(`/jobs/${job.id}`)} className="tap flex items-center gap-3 rounded-[17px] border border-[#e9ecee] bg-white p-4 shadow-[0_4px_13px_rgba(36,56,78,0.03)]">
                <CompanyLogo initials={emp?.initials ?? '?'} color={emp?.color ?? '#E4EEFF'} size={38} />
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-[14px]">{job.title}</b>
                  <p className="truncate text-[11px] text-[#566476]">{emp?.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-[#6f7b89]"><MapPin size={11} />{job.location} · {salaryRange(job.salaryMin, job.salaryMax).replace(/,000/g, 'k')}</p>
                </div>
                <ChevronRight size={17} className="text-subtle" />
              </Link>
            )
          })}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">Log in or sign up to see details and apply.</p>

        {/* How it works */}
        <SectionHead title="How it works" />
        <div className="grid gap-2.5">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex items-start gap-3 rounded-[16px] border border-[#e8ecef] bg-white p-[14px]">
              <span className="grid size-[27px] shrink-0 place-items-center rounded-full bg-[#e5f0fc] text-[12px] font-bold text-brand">{i + 1}</span>
              <div><b className="text-[13px]">{s.title}</b><p className="mt-1 text-[11px] leading-relaxed text-muted">{s.body}</p></div>
            </div>
          ))}
        </div>

        {/* Courses */}
        <SectionHead title="Popular free courses" href={loginTo('/learn')} action="Browse" />
        <div className="grid gap-2.5">
          {stats.courses.slice(0, 3).map((c) => (
            <Link key={c.id} href={loginTo(`/learn/${c.id}`)} className="tap flex items-center gap-3 rounded-[16px] border border-[#ebedef] bg-white p-3">
              <IconTile icon={c.icon} color={c.color} size={48} />
              <div className="min-w-0 flex-1">
                <b className="block truncate text-[13px]">{c.title}</b>
                <p className="mt-0.5 text-[10px] text-muted">{c.lessons.length} lessons · {c.hours} hours · {c.level}</p>
                <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-success"><Check size={11} />Certificate included</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Employers */}
        <section className="mt-[25px] rounded-[19px] border border-[#e5ebef] bg-brand-50 p-5">
          <span className="grid size-[38px] place-items-center rounded-[12px] bg-white text-brand"><Building2 size={20} /></span>
          <h2 className="mt-3 font-serif text-[21px] font-medium leading-tight">Hiring young talent?</h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#4a5b75]">Post jobs, review matched applicants, schedule interviews, and track your hiring pipeline — all from your phone.</p>
          <Link href="/register?role=employer" className="btn btn-primary btn-sm mt-4">Post a job <ArrowRight size={15} /></Link>
        </section>

        {/* FAQ */}
        <SectionHead title="Common questions" />
        <div className="overflow-hidden rounded-[17px] border border-[#e8ecef] bg-white">
          {FAQ.map((f, i) => (
            <div key={f.q} className="border-b border-[#eff1f2] last:border-0">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} className="flex w-full items-center gap-3 px-4 py-[15px] text-left">
                <b className="flex-1 text-[13px]">{f.q}</b>
                <ChevronDown size={17} className={cn('text-muted transition', openFaq === i && 'rotate-180')} />
              </button>
              {openFaq === i && <p className="animate-fade px-4 pb-4 text-[12px] leading-relaxed text-muted">{f.a}</p>}
            </div>
          ))}
        </div>

        {/* Final call to action */}
        <section className="mt-8 text-center">
          <h2 className="font-serif text-[24px] font-medium leading-tight">Your next chapter starts here</h2>
          <p className="mt-2 text-[12px] text-muted">Join DiskarTech and take your first step today.</p>
          <Link href="/welcome" className="btn btn-primary mt-4 w-full">Create my free account</Link>
        </section>

        <footer className="mt-10 border-t border-line pt-6 text-center">
          <Logo size={26} className="justify-center" />
          <p className="mt-2 text-[11px] text-muted">{TAGLINE}</p>
          <div className="mt-4 flex justify-center gap-4 text-[11px] font-semibold text-brand">
            <Link href="/login">Log in</Link><Link href="/welcome">Sign up</Link><Link href="/register?role=employer">For employers</Link>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1 text-[10px] text-subtle"><ShieldCheck size={12} />Protected under the Data Privacy Act of 2012</p>
          <p className="mt-1 text-[10px] text-subtle">© {new Date().getFullYear()} DiskarTech · Prototype with sample data</p>
        </footer>
      </main>
    </div>
  )
}

function SectionHead({ title, href, action }: { title: string; href?: string; action?: string }) {
  return (
    <div className="mb-3 mt-[25px] flex items-center justify-between">
      <h2 className="section-title">{title}</h2>
      {href && <Link href={href} className="flex items-center gap-[3px] text-[12px] text-brand">{action}<ChevronRight size={15} /></Link>}
    </div>
  )
}
