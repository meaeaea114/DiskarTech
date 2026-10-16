'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PIPELINE, STATUS_META } from '@/lib/constants'
import { SectionHeader, Segmented, StatTile } from '@/components/ui/kit'
import { BarChart, HBars, perDay } from '@/components/ui/charts'
import { PageHeader } from '@/components/layout/page-header'
import { useEmployerData } from '@/components/features/employer'

export default function Analytics() {
  const { jobs, apps } = useEmployerData()
  const [range, setRange] = useState<'14' | '30'>('14')
  const days = Number(range)
  const since = Date.now() - days * 86_400_000
  const inRange = apps.filter((a) => new Date(a.appliedAt).getTime() >= since)
  const reached = (s: (typeof PIPELINE)[number]) => apps.filter((a) => a.timeline.some((t) => t.status === s)).length
  const hired = apps.filter((a) => a.status === 'hired')
  const avgDaysToHire = hired.length
    ? Math.round(hired.reduce((n, a) => n + (new Date(a.timeline.find((t) => t.status === 'hired')!.at).getTime() - new Date(a.appliedAt).getTime()) / 86_400_000, 0) / hired.length)
    : null
  const views = jobs.reduce((n, j) => n + j.views, 0)
  const interviewRate = apps.length ? Math.round((reached('interview') / apps.length) * 100) : 0

  return (
    <div className="mx-auto max-w-5xl pb-6">
      <PageHeader title="Hiring Analytics" back="/employer" actions={<Segmented value={range} onChange={setRange} options={[{ value: '14', label: '14 days' }, { value: '30', label: '30 days' }]} className="w-40" />} />
      <div className="grid grid-cols-2 gap-3">
        <StatTile label={`Applications · ${days}d`} value={inRange.length} />
        <StatTile label="Total job views" value={views.toLocaleString()} />
        <StatTile label="Reached interview" value={`${interviewRate}%`} />
        <StatTile label="Avg. days to hire" value={avgDaysToHire ?? '—'} />
      </div>

      <div className="grid gap-x-8">
        <div>
          <SectionHeader title="Applications over time" />
          <div className="card card-pad"><BarChart label={`Applications per day, last ${days} days`} data={perDay(apps.map((a) => a.appliedAt), days)} height={180} /></div>
        </div>
        <div>
          <SectionHeader title="Hiring funnel" />
          <div className="card card-pad">
            <HBars label="Applicants reaching each stage" data={PIPELINE.map((s, i) => {
              const v = reached(s)
              const prev = i ? reached(PIPELINE[i - 1]) : 0
              return { label: STATUS_META[s].stage, value: v, sub: i && prev ? `${Math.round((v / prev) * 100)}% of previous` : undefined }
            })} />
          </div>
        </div>
      </div>

      <SectionHeader title="Job performance" />
      <div className="grid gap-2.5">
        {jobs.filter((j) => j.status !== 'draft').map((j) => {
          const ja = apps.filter((a) => a.jobId === j.id)
          const stats = [
            ['Views', j.views.toLocaleString()],
            ['Applied', String(ja.length)],
            ['Apply rate', `${j.views ? ((ja.length / j.views) * 100).toFixed(1) : '0.0'}%`],
            ['Shortlisted+', String(ja.filter((a) => a.timeline.some((t) => t.status === 'shortlisted')).length)],
            ['Hired', String(ja.filter((a) => a.status === 'hired').length)],
          ]
          return (
            <Link key={j.id} href={`/employer/jobs/${j.id}`} className="card tap block p-4">
              <div className="flex items-center justify-between gap-2"><b className="truncate text-[13px]">{j.title}</b><span className="text-[10px] capitalize text-muted">{j.status}</span></div>
              <div className="mt-3 grid grid-cols-5 gap-1 text-center">
                {stats.map(([k, v]) => <div key={k}><div className="font-serif text-[16px] tabular-nums">{v}</div><div className="text-[9px] leading-tight text-muted">{k}</div></div>)}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
