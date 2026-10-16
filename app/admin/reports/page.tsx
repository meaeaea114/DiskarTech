'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, Download, ScrollText } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { PIPELINE, STATUS_META } from '@/lib/constants'
import { SectionHeader, StatTile } from '@/components/ui/kit'
import { BarChart, HBars, perDay } from '@/components/ui/charts'
import { PageHeader } from '@/components/layout/page-header'
import { toast } from '@/components/ui/toast'

export default function Reports() {
  const db = useDB()
  const r = useMemo(() => {
    const byCategory = new Map<string, number>()
    db.jobs.filter((j) => j.status === 'published').forEach((j) => byCategory.set(j.category, (byCategory.get(j.category) ?? 0) + 1))
    const byCity = new Map<string, number>()
    db.applications.forEach((a) => { const j = db.jobs.find((x) => x.id === a.jobId); if (j) byCity.set(j.location, (byCity.get(j.location) ?? 0) + 1) })
    const skillDemand = new Map<string, number>()
    db.jobs.filter((j) => j.status === 'published').forEach((j) => j.skills.forEach((s) => skillDemand.set(s, (skillDemand.get(s) ?? 0) + 1)))
    const sorted = (m: Map<string, number>, n = 6) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }))
    const hired = db.applications.filter((a) => a.status === 'hired').length
    const completions = db.enrollments.filter((e) => e.completedAt).length
    return {
      categories: sorted(byCategory), cities: sorted(byCity), skills: sorted(skillDemand, 8), hired, completions,
      placement: db.applications.length ? ((hired / db.applications.length) * 100).toFixed(1) : '0',
      completionRate: db.enrollments.length ? Math.round((completions / db.enrollments.length) * 100) : 0,
    }
  }, [db])

  const exportCsv = () => {
    const rows = [['Job', 'Employer', 'Location', 'Status', 'Views', 'Applicants', 'Hired'],
      ...db.jobs.map((j) => [j.title, db.employers.find((e) => e.id === j.employerId)?.name ?? '', j.location, j.status, j.views,
        db.applications.filter((a) => a.jobId === j.id).length, db.applications.filter((a) => a.jobId === j.id && a.status === 'hired').length])]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    Object.assign(document.createElement('a'), { href: url, download: `diskartech-jobs-report-${new Date().toISOString().slice(0, 10)}.csv` }).click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success('Report exported')
  }

  return (
    <div className="mx-auto max-w-5xl pb-6">
      <PageHeader title="Reports" bell actions={<button className="btn btn-secondary btn-sm" onClick={exportCsv}><Download size={15} />Export CSV</button>} />
      <div className="mb-2 grid grid-cols-2 gap-3">
        <Link href="/admin/courses" className="card tap flex items-center gap-2 p-3.5 text-[14px] font-semibold"><BookOpen size={18} className="text-brand" />Courses</Link>
        <Link href="/admin/audit" className="card tap flex items-center gap-2 p-3.5 text-[14px] font-semibold"><ScrollText size={18} className="text-brand" />Audit log</Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Placement rate" value={`${r.placement}%`} sub={`${r.hired} hires`} />
        <StatTile label="Course completion" value={`${r.completionRate}%`} sub={`${r.completions} completed`} />
        <StatTile label="Certificates issued" value={db.certificates.length} />
        <StatTile label="Avg. applications / job" value={(db.applications.length / Math.max(1, db.jobs.filter((j) => j.status !== 'draft').length)).toFixed(1)} />
      </div>
      <div className="grid gap-x-8">
        <div>
          <SectionHeader title="Applications · last 30 days" />
          <div className="card card-pad"><BarChart label="Applications per day, last 30 days" data={perDay(db.applications.map((a) => a.appliedAt), 30)} height={170} /></div>
          <SectionHeader title="Platform hiring funnel" />
          <div className="card card-pad"><HBars label="Applications currently at each stage" data={[...PIPELINE, 'rejected' as const].map((s) => ({ label: STATUS_META[s].label, value: db.applications.filter((a) => a.status === s).length }))} /></div>
        </div>
        <div>
          <SectionHeader title="Most in-demand skills" />
          <div className="card card-pad"><HBars label="Open jobs requiring each skill" data={r.skills} format={(n) => `${n} jobs`} /></div>
          <SectionHeader title="Applications by city" />
          <div className="card card-pad"><HBars label="Applications by job location" data={r.cities} /></div>
          <SectionHeader title="Open jobs by category" />
          <div className="card card-pad"><HBars label="Published jobs per category" data={r.categories} /></div>
        </div>
      </div>
    </div>
  )
}
