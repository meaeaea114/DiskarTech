'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart3, Check, Clock, FileCheck2, Sparkles, Star, Target } from 'lucide-react'
import { Logo } from '@/components/brand'
import { cn } from '@/lib/utils'

const SLIDES = [
  {
    eyebrow: 'Welcome to DiskarTech', title: 'Your Future Starts Here',
    body: 'Find job opportunities, build in-demand skills, and take your next step forward — all in one app.',
    art: (
      <div className="relative mx-auto flex h-48 items-end justify-center gap-4 rounded-[26px] bg-brand-50 pb-0">
        <div className="mb-0 h-28 w-24 rounded-t-full bg-brand" /><div className="h-24 w-24 rounded-t-full bg-gold" />
        <div className="absolute bottom-6 left-1/2 w-24 -translate-x-1/2 rounded-xl bg-white p-2.5 shadow-lg"><div className="h-1.5 w-14 rounded bg-brand/60" /><div className="mt-1.5 h-1.5 w-10 rounded bg-[#dbe4ef]" /></div>
      </div>
    ),
    features: [] as { icon: typeof Clock; title: string; body?: string }[],
  },
  {
    eyebrow: 'Learn', title: 'Build In-Demand Skills',
    body: 'Learn practical skills through free, bite-sized courses and earn certificates employers value.',
    art: (
      <div className="relative mx-auto grid h-40 place-items-center rounded-[26px] bg-[#fff6e0]">
        <div className="grid size-24 place-items-center rounded-full bg-gold/40"><div className="rounded-xl border-4 border-navy bg-white p-3"><div className="h-1.5 w-12 rounded bg-brand" /><div className="mt-1.5 h-1.5 w-8 rounded bg-[#c8d4e3]" /></div></div>
        <span className="absolute right-8 top-6 grid size-9 place-items-center rounded-full bg-white text-success shadow"><Check size={18} /></span>
      </div>
    ),
    features: [
      { icon: Clock, title: 'Learn at your own pace', body: 'Flexible, bite-sized lessons' },
      { icon: Star, title: 'Get certified', body: 'Share skills employers recognize' },
      { icon: BarChart3, title: 'Track your progress', body: 'See how far you’ve come' },
    ],
  },
  {
    eyebrow: 'Work', title: 'Find the Right Job for You',
    body: 'Discover entry-level and beginner-friendly roles matched to your skills and goals.',
    art: (
      <div className="relative mx-auto flex h-40 items-end justify-center rounded-[26px] bg-[#eaf3ff]">
        <div className="h-24 w-20 rounded-t-full bg-brand" />
        <div className="absolute right-6 top-6 rounded-xl bg-white px-3 py-2 text-left shadow-lg"><div className="text-[11px] font-bold">UI Designer</div><div className="text-[10px] text-brand">Quezon City</div><div className="text-[10px] font-semibold text-success">₱25k–₱35k</div></div>
      </div>
    ),
    features: [
      { icon: Target, title: 'Personalized job matching' },
      { icon: FileCheck2, title: 'Easy application process' },
      { icon: Sparkles, title: 'Track your applications' },
    ],
  },
]

export default function Welcome() {
  const [i, setI] = useState(0)
  const router = useRouter()
  const slide = SLIDES[i]
  const finish = (to: string) => {
    try { localStorage.setItem('diskartech:onboarded', '1') } catch { /* ignore */ }
    router.push(to)
  }
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-6 pb-8 pt-6">
      <div className="flex items-center justify-between">
        <Link href="/" aria-label="DiskarTech home"><Logo /></Link>
        {i < SLIDES.length - 1
          ? <button onClick={() => finish('/login')} className="text-[14px] font-medium text-muted">Skip</button>
          : <span className="text-[13px] text-muted">{i + 1} of {SLIDES.length}</span>}
      </div>
      <div key={i} className="page-enter mt-8 flex-1">
        {slide.art}
        <p className="eyebrow mt-8">{slide.eyebrow}</p>
        <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight">{slide.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{slide.body}</p>
        {slide.features.length > 0 && (
          <div className="mt-6 space-y-3">
            {slide.features.map((f) => (
              <div key={f.title} className="card flex items-center gap-3 px-4 py-3.5">
                <span className="grid size-10 place-items-center rounded-full bg-brand-50 text-brand"><f.icon size={19} /></span>
                <div className="flex-1"><div className="text-[15px] font-semibold">{f.title}</div>{f.body && <div className="text-[12px] text-muted">{f.body}</div>}</div>
                <Check size={17} className="text-success" />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-8 flex justify-center gap-2" aria-hidden>
        {SLIDES.map((_, j) => <span key={j} className={cn('h-2 rounded-full transition-all', j === i ? 'w-6 bg-brand' : 'w-2 bg-[#cdd6e3]')} />)}
      </div>
      <button className="btn btn-primary mt-6 w-full" onClick={() => (i < SLIDES.length - 1 ? setI(i + 1) : finish('/register'))}>
        {i === 0 ? 'Get Started' : i < SLIDES.length - 1 ? 'Next' : 'Create my account'}
      </button>
      <p className="mt-4 text-center text-[14px] text-muted">Already have an account? <Link href="/login" onClick={() => finish('/login')} className="font-semibold text-brand">Log In</Link></p>
    </div>
  )
}
