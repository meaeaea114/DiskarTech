import { AlertTriangle, Award, BookOpen, Briefcase, CalendarDays, Check, ShieldCheck, Star, UserPlus, X } from 'lucide-react'
import type { Notification } from '@/lib/types'

const MAP: Record<Notification['icon'], { icon: typeof Check; bg: string; fg: string }> = {
  check: { icon: Check, bg: '#E6F5ED', fg: '#33966A' },
  briefcase: { icon: Briefcase, bg: '#EAF3FF', fg: '#1877D4' },
  star: { icon: Star, bg: '#FFF1D7', fg: '#C38B29' },
  calendar: { icon: CalendarDays, bg: '#EEE9FF', fg: '#6E56CF' },
  book: { icon: BookOpen, bg: '#EAF3FF', fg: '#1877D4' },
  award: { icon: Award, bg: '#FFF1D7', fg: '#C38B29' },
  shield: { icon: ShieldCheck, bg: '#E6F5ED', fg: '#33966A' },
  alert: { icon: AlertTriangle, bg: '#F8E9E8', fg: '#AC5D60' },
  user: { icon: UserPlus, bg: '#EAF3FF', fg: '#1877D4' },
  x: { icon: X, bg: '#F8E9E8', fg: '#AC5D60' },
}

export function NotificationIcon({ icon, size = 40 }: { icon: Notification['icon']; size?: number }) {
  const m = MAP[icon] ?? MAP.check
  return (
    <span className="grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, background: m.bg, color: m.fg }}>
      <m.icon size={size * 0.45} strokeWidth={2.2} />
    </span>
  )
}
