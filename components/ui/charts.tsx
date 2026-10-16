'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/** Single-series vertical bar chart (e.g. applications per day) with hover tooltip and an sr-only table. */
export function BarChart({ data, label, height = 140 }: { data: { label: string; value: number }[]; label: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const ticks = [max, Math.round(max / 2), 0]
  return (
    <figure aria-label={label}>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between pb-5 text-right text-[10px] tabular-nums text-subtle" style={{ height }}>{ticks.map((t, i) => <span key={i}>{t}</span>)}</div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: height - 20 }} aria-hidden>
            {ticks.map((_, i) => <span key={i} className="border-t border-dashed border-[#e8edf4]" />)}
          </div>
          <div className="relative flex items-end gap-[2px]" style={{ height: height - 20 }}>
            {data.map((d, i) => (
              <div key={i} className="group relative flex h-full flex-1 items-end justify-center" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}>
                <div className={cn('w-full max-w-[22px] rounded-t-[4px] transition-colors', hover === i ? 'bg-brand-600' : 'bg-brand')} style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 3 : 0 }} />
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg bg-navy px-2 py-1 text-[11px] text-white shadow-lg">
                    <b className="tabular-nums">{d.value}</b> · {d.label}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-[2px] text-[10px] text-subtle" aria-hidden>
            {data.map((d, i) => {
              const step = Math.ceil(data.length / 4)
              const show = (data.length - 1 - i) % step === 0 // always label the most recent day
              return <span key={i} className="relative h-3 flex-1">{show && <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{d.label}</span>}</span>
            })}
          </div>
        </div>
      </div>
      <table className="sr-only"><caption>{label}</caption><tbody>{data.map((d, i) => <tr key={i}><th>{d.label}</th><td>{d.value}</td></tr>)}</tbody></table>
    </figure>
  )
}

/** Horizontal bars for ranked/ordered stages (hiring funnel, top items). Labels in ink, values beside. */
export function HBars({ data, label, format = (n) => String(n) }: { data: { label: string; value: number; sub?: string }[]; label: string; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <figure aria-label={label} className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} title={`${d.label}: ${format(d.value)}`}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
            <span className="font-medium">{d.label}</span>
            <span className="tabular-nums text-muted"><b className="text-ink">{format(d.value)}</b>{d.sub && <span className="ml-1.5 text-[11px]">{d.sub}</span>}</span>
          </div>
          <div className="h-2 rounded-full bg-[#eef2f7]"><div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${(d.value / max) * 100}%`, minWidth: d.value ? 6 : 0 }} /></div>
        </div>
      ))}
    </figure>
  )
}

/** Bucket ISO timestamps into the last `days` days. */
export function perDay(dates: string[], days: number) {
  const out: { label: string; value: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000)
    const key = d.toDateString()
    out.push({ label: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }), value: dates.filter((x) => new Date(x).toDateString() === key).length })
  }
  return out
}
