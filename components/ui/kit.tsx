'use client'

import { useState, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, BarChart3, BookOpen, Braces, ChevronDown, Code2, Database, GitBranch, Headset, Laptop, Megaphone, MessageCircle,
  Network, Palette, Plus, Shield, Wrench, X, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tone } from '@/lib/constants'
import { STATUS_META, JOB_STATUS_META } from '@/lib/constants'
import type { ApplicationStatus, JobStatus } from '@/lib/types'
import { initials } from '@/lib/format'

// ---- Identity ---------------------------------------------------------------

export function Avatar({ name, color = '#E4EEFF', size = 40, className }: { name: string; color?: string; size?: number; className?: string }) {
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-full font-bold text-brand', className)}
      style={{ width: size, height: size, background: color, fontSize: Math.max(11, size * 0.32) }} aria-hidden>
      {initials(name)}
    </span>
  )
}

export function CompanyLogo({ initials: text, color, size = 44 }: { initials: string; color: string; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-[14px] font-bold text-navy"
      style={{ width: size, height: size, background: color, fontSize: Math.max(11, size * 0.3) }} aria-hidden>
      {text}
    </span>
  )
}

const ICONS: Record<string, LucideIcon> = {
  code: Code2, braces: Braces, headset: Headset, database: Database, network: Network, palette: Palette, shield: Shield,
  laptop: Laptop, chart: BarChart3, message: MessageCircle, git: GitBranch, wrench: Wrench, megaphone: Megaphone, book: BookOpen,
}

export function IconTile({ icon, color, size = 48, className }: { icon: string; color: string; size?: number; className?: string }) {
  const Icon = ICONS[icon] ?? BookOpen
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-[14px] text-navy', className)} style={{ width: size, height: size, background: color }}>
      <Icon size={size * 0.44} strokeWidth={1.9} />
    </span>
  )
}

// ---- Status -----------------------------------------------------------------

const TONES: Record<Tone, string> = {
  gray: 'bg-[#eef1f5] text-[#5b6b82]',
  blue: 'bg-brand-50 text-brand',
  green: 'bg-success-50 text-success',
  amber: 'bg-warn-50 text-warn',
  red: 'bg-danger-50 text-danger',
  purple: 'bg-violet-50 text-violet',
  gold: 'bg-[#fff2d3] text-[#a87500]',
}

export function Badge({ tone = 'gray', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold', TONES[tone], className)}>{children}</span>
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const m = STATUS_META[status]
  return <Badge tone={m.tone}>{m.label}</Badge>
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const m = JOB_STATUS_META[status]
  return <Badge tone={m.tone}>{m.label}</Badge>
}

// ---- Progress ---------------------------------------------------------------

export function ProgressBar({ value, className, tone = 'brand' }: { value: number; className?: string; tone?: 'brand' | 'success' | 'white' }) {
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full', tone === 'white' ? 'bg-white/30' : 'bg-[#e6eaed]', className)}
      role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-[width] duration-500', tone === 'brand' && 'bg-brand', tone === 'success' && 'bg-success', tone === 'white' && 'bg-white')}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function ProgressRing({ value, size = 120, stroke = 10, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e6eaed" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-brand)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, value) / 100)} style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

// ---- Layout helpers ----------------------------------------------------------

export function SectionHeader({ title, href, action, actionLabel = 'See all' }: { title: string; href?: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="mb-3 mt-7 flex items-center justify-between">
      <h2 className="section-title">{title}</h2>
      {href && <Link href={href} className="link">{actionLabel}</Link>}
      {action && <button onClick={action} className="link">{actionLabel}</button>}
    </div>
  )
}

export function Segmented<T extends string>({ value, onChange, options, className }: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; count?: number }[]
  className?: string
}) {
  return (
    <div className={cn('flex rounded-[14px] bg-[#ecebe6] p-1', className)} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cn('flex-1 rounded-[11px] px-2 py-2 text-[12px] font-bold transition',
            value === o.value ? 'bg-white text-brand shadow-[0_2px_8px_rgba(23,38,61,0.08)]' : 'text-muted hover:text-ink')}>
          {o.label}{o.count !== undefined && <span className="ml-1 opacity-70">({o.count})</span>}
        </button>
      ))}
    </div>
  )
}

export function ChipGroup<T extends string>({ value, onChange, options, multi }: {
  value: T | T[]
  onChange: (v: any) => void
  options: { value: T; label: string }[]
  multi?: boolean
}) {
  const selected = Array.isArray(value) ? value : [value]
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o.value)
        return (
          <button key={o.value} type="button" aria-pressed={active}
            onClick={() => multi ? onChange(active ? selected.filter((v) => v !== o.value) : [...selected, o.value]) : onChange(o.value)}
            className={cn('chip', active && 'chip-active')}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card card-pad flex gap-3">
          <Skeleton className="size-11 shrink-0 rounded-[14px]" />
          <div className="flex-1 space-y-2.5 py-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, message, action }: { icon: LucideIcon; title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-brand-50 text-brand"><Icon size={26} /></span>
      <h3 className="mt-4 font-serif text-[18px] font-medium">{title}</h3>
      {message && <p className="mt-1.5 max-w-xs text-[12px] leading-relaxed text-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-danger-50 text-danger"><AlertTriangle size={26} /></span>
      <p className="mt-4 text-[15px] font-semibold">{message}</p>
      {onRetry && <button className="btn btn-secondary btn-sm mt-4" onClick={onRetry}>Try again</button>}
    </div>
  )
}

export function StatTile({ label, value, sub, href, accent }: { label: string; value: ReactNode; sub?: ReactNode; href?: string; accent?: string }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] text-muted">{label}</span>
        {accent && <span className="mt-1 size-2.5 rounded-full" style={{ background: accent }} />}
      </div>
      <div className="mt-1 font-serif text-[22px] tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] font-bold text-success">{sub}</div>}
    </>
  )
  return href
    ? <Link href={href} className="card card-pad tap block hover:shadow-[0_6px_20px_rgba(38,59,87,0.12)]">{body}</Link>
    : <div className="card card-pad">{body}</div>
}

// ---- Form fields ------------------------------------------------------------

/** Labeled form field. Use `group` when the control is several buttons (chips, lists) rather than one input. */
export function Field({ label, error, hint, children, className, group }: { label?: string; error?: string; hint?: string; children: ReactNode; className?: string; group?: boolean }) {
  const Tag = group ? 'div' : 'label'
  return (
    <Tag className={cn('block', className)} {...(group ? { role: 'group', 'aria-label': label } : {})}>
      {label && <span className="label">{label}</span>}
      {children}
      {error ? <span className="mt-1.5 block text-[12px] font-medium text-danger">{error}</span>
        : hint ? <span className="mt-1.5 block text-[12px] text-muted">{hint}</span> : null}
    </Tag>
  )
}

export function TextInput({ invalid, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn('input', invalid && 'input-error', className)} aria-invalid={invalid || undefined} {...props} />
}

export function TextArea({ invalid, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={cn('input min-h-24 resize-y leading-relaxed', invalid && 'input-error', className)} aria-invalid={invalid || undefined} {...props} />
}

export function Select({ invalid, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <span className="relative block">
      <select className={cn('input appearance-none pr-9', invalid && 'input-error', className)} {...props}>{children}</select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
    </span>
  )
}

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-3">
      <span className="flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-[12px] text-muted">{description}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={cn('relative h-[31px] w-[51px] shrink-0 rounded-full transition', checked ? 'bg-success' : 'bg-[#dfe4ec]')}>
        <span className={cn('absolute top-[2px] size-[27px] rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-[2px]')} />
      </button>
    </label>
  )
}

/** Editable list of short text items (responsibilities, benefits, etc.). */
export function ListInput({ value, onChange, placeholder, invalid }: { value: string[]; onChange: (v: string[]) => void; placeholder: string; invalid?: boolean }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim()
    if (!t) return
    onChange([...value, t])
    setDraft('')
  }
  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {value.map((item, i) => (
            <li key={i} className="flex items-start gap-2 rounded-xl bg-white px-3 py-2 text-[14px] ring-1 ring-line">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
              <span className="flex-1">{item}</span>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove ${item}`} className="text-subtle hover:text-danger"><X size={16} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input className={cn('input', invalid && 'input-error')} value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button type="button" onClick={add} className="btn btn-tinted shrink-0 px-4" aria-label="Add item"><Plus size={18} /></button>
      </div>
    </div>
  )
}

/** Pick skills from the catalog or type a custom one. */
export function SkillPicker({ value, onChange, catalog, invalid }: { value: string[]; onChange: (v: string[]) => void; catalog: string[]; invalid?: boolean }) {
  const [q, setQ] = useState('')
  const suggestions = catalog.filter((s) => !value.includes(s) && s.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
  const add = (s: string) => { if (s.trim() && !value.includes(s.trim())) onChange([...value, s.trim()]); setQ('') }
  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1.5 pl-3 pr-1.5 text-[13px] font-semibold text-brand">
              {s}<button type="button" onClick={() => onChange(value.filter((x) => x !== s))} aria-label={`Remove ${s}`} className="grid size-5 place-items-center rounded-full hover:bg-brand-100"><X size={13} /></button>
            </span>
          ))}
        </div>
      )}
      <input className={cn('input', invalid && 'input-error')} placeholder="Search or type a skill, then press Enter" value={q}
        onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(suggestions[0] && q ? suggestions[0] : q) } }} />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button type="button" key={s} onClick={() => add(s)} className="rounded-full border border-dashed border-[#c9d3e1] px-2.5 py-1 text-[12px] text-muted hover:border-brand hover:text-brand">+ {s}</button>
        ))}
      </div>
    </div>
  )
}
