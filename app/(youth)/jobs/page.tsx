'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpDown, ClipboardList, MapPin, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useMe, useQueryParam } from '@/hooks/use-app'
import { EMPTY_FILTERS, JobService, type JobFilters } from '@/lib/services'
import { EXPERIENCE_LEVELS, JOB_TYPES, SALARY_RANGES, SKILL_CATALOG, SORT_OPTIONS, WORK_SETUPS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { CardSkeleton, ChipGroup, EmptyState } from '@/components/ui/kit'
import { Sheet } from '@/components/ui/sheet'
import { PageHeader } from '@/components/layout/page-header'
import { JobCard } from '@/components/features/jobs'

const PAGE = 6
const QUICK = [
  { id: 'all', label: 'All' },
  { id: 'entry', label: 'Entry Level' },
  { id: 'full', label: 'Full-Time' },
  { id: 'part', label: 'Part-Time' },
  { id: 'intern', label: 'Internship' },
  { id: 'remote', label: 'Remote' },
] as const

export default function JobsPage() {
  const db = useDB()
  const me = useMe()
  const initialQ = useQueryParam('q') ?? ''
  const [keyword, setKeyword] = useState(initialQ)
  const [location, setLocation] = useState('')
  const [filters, setFilters] = useState<JobFilters>({ ...EMPTY_FILTERS, keyword: initialQ })
  const [sheet, setSheet] = useState(false)
  const [draft, setDraft] = useState<JobFilters>(filters)
  const [limit, setLimit] = useState(PAGE)
  const [loading, setLoading] = useState(true)

  // Debounce typing into the applied filters, and show a short"fetching" state.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, keyword, location })), 300)
    return () => clearTimeout(t)
  }, [keyword, location])
  useEffect(() => {
    setLoading(true)
    setLimit(PAGE)
    const t = setTimeout(() => setLoading(false), 380)
    return () => clearTimeout(t)
  }, [filters])

  const results = useMemo(() => JobService.search(db, filters, me.id), [db, filters, me.id])
  const activeCount = filters.types.length + filters.levels.length + filters.setups.length + filters.skills.length + (filters.minSalary ? 1 : 0)

  const quick = (id: (typeof QUICK)[number]['id']) => {
    const base = { ...filters, types: [], levels: [], setups: [] } as JobFilters
    if (id === 'entry') base.levels = ['Entry Level']
    if (id === 'full') base.types = ['Full-time']
    if (id === 'part') base.types = ['Part-time']
    if (id === 'intern') base.types = ['Internship']
    if (id === 'remote') base.setups = ['Remote']
    setFilters(base)
  }
  const quickActive = (() => {
    const { types, levels, setups } = filters
    const n = types.length + levels.length + setups.length
    if (n === 0) return 'all'
    if (n !== 1) return null
    if (levels[0] === 'Entry Level') return 'entry'
    if (types[0] === 'Full-time') return 'full'
    if (types[0] === 'Part-time') return 'part'
    if (types[0] === 'Internship') return 'intern'
    if (setups[0] === 'Remote') return 'remote'
    return null
  })()

  const clearAll = () => { setKeyword(''); setLocation(''); setFilters({ ...EMPTY_FILTERS, sort: filters.sort }) }

  return (
    <div>
      <PageHeader title="Jobs" bell actions={<Link href="/applications" className="btn btn-secondary btn-sm hidden"><ClipboardList size={16} />My applications</Link>} />

      <div className="grid gap-2.5">
        <label className="card flex items-center gap-3 px-4">
          <Search size={18} className="text-muted" />
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Job title, skill, or company" className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" aria-label="Search by keyword" />
          {keyword && <button onClick={() => setKeyword('')} aria-label="Clear search" className="text-subtle"><X size={16} /></button>}
        </label>
        <label className="card flex items-center gap-3 px-4">
          <MapPin size={18} className="text-muted" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} list="job-locations" placeholder="City or “Remote”" className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" aria-label="Search by location" />
          <datalist id="job-locations">{[...new Set(db.jobs.map((j) => j.location)), 'Remote'].map((l) => <option key={l} value={l} />)}</datalist>
        </label>
        <button onClick={() => { setDraft(filters); setSheet(true) }} className="card tap relative hidden items-center gap-2 px-4 text-[14px] font-semibold text-brand">
          <SlidersHorizontal size={18} />Filters{activeCount > 0 && <span className="rounded-full bg-brand px-1.5 text-[11px] leading-5 text-white">{activeCount}</span>}
        </button>
      </div>

      <div className="scrollbar-none -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
        <button onClick={() => { setDraft(filters); setSheet(true) }} className={cn('chip ', activeCount > 0 && 'border-brand text-brand')} aria-label="Open filters">
          <SlidersHorizontal size={15} />{activeCount > 0 ? activeCount : 'Filters'}
        </button>
        {QUICK.map((c) => <button key={c.id} onClick={() => quick(c.id)} className={cn('chip', quickActive === c.id && 'chip-active')}>{c.label}</button>)}
      </div>

      <div className="mb-3 mt-5 flex items-center justify-between">
        <p className="text-[13px] text-muted" aria-live="polite">{loading ? 'Searching…' : `${results.length} ${results.length === 1 ? 'job' : 'jobs'} found`}</p>
        <label className="flex items-center gap-1.5 text-[13px] font-semibold">
          <ArrowUpDown size={14} className="text-muted" />
          <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value as JobFilters['sort'] })} className="bg-transparent font-semibold outline-none" aria-label="Sort jobs">
            {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
      </div>

      {loading ? <CardSkeleton rows={3} /> : results.length === 0 ? (
        db.jobs.some(JobService.isOpen)
          ? <EmptyState icon={SearchX} title="No jobs match your search" message="Try a different keyword, location, or remove some filters." action={<button className="btn btn-secondary btn-sm" onClick={clearAll}>Clear all filters</button>} />
          : <EmptyState icon={SearchX} title="No open jobs right now" message="New opportunities are posted every day. Check back soon!" />
      ) : (
        <>
          <div className="grid gap-3">
            {results.slice(0, limit).map(({ job, match }) => <JobCard key={job.id} job={job} match={match.score} />)}
          </div>
          <div className="mt-5 text-center">
            <p className="text-[12px] text-muted">Showing {Math.min(limit, results.length)} of {results.length} jobs</p>
            {limit < results.length && <button className="btn btn-secondary btn-sm mt-3" onClick={() => setLimit(limit + PAGE)}>Load more jobs</button>}
          </div>
        </>
      )}

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Filter jobs" size="md"
        footer={<div className="grid grid-cols-[auto_1fr] gap-3">
          <button className="btn btn-secondary" onClick={() => setDraft({ ...EMPTY_FILTERS, keyword: filters.keyword, location: filters.location, sort: filters.sort })}>Reset</button>
          <button className="btn btn-primary" onClick={() => { setFilters(draft); setSheet(false) }}>Show {JobService.search(db, draft, me.id).length} jobs</button>
        </div>}>
        <FilterGroup title="Job type"><ChipGroup multi value={draft.types} onChange={(types) => setDraft({ ...draft, types })} options={JOB_TYPES.map((t) => ({ value: t, label: t }))} /></FilterGroup>
        <FilterGroup title="Experience level"><ChipGroup multi value={draft.levels} onChange={(levels) => setDraft({ ...draft, levels })} options={EXPERIENCE_LEVELS.map((t) => ({ value: t, label: t }))} /></FilterGroup>
        <FilterGroup title="Work setup"><ChipGroup multi value={draft.setups} onChange={(setups) => setDraft({ ...draft, setups })} options={WORK_SETUPS.map((t) => ({ value: t, label: t }))} /></FilterGroup>
        <FilterGroup title="Monthly salary"><ChipGroup value={String(draft.minSalary)} onChange={(v: string) => setDraft({ ...draft, minSalary: Number(v) })} options={SALARY_RANGES.map((s) => ({ value: String(s.min), label: s.label }))} /></FilterGroup>
        <FilterGroup title="Skills"><ChipGroup multi value={draft.skills} onChange={(skills) => setDraft({ ...draft, skills })} options={SKILL_CATALOG.filter((s) => db.jobs.some((j) => j.skills.includes(s))).map((s) => ({ value: s, label: s }))} /></FilterGroup>
      </Sheet>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mb-5"><h3 className="mb-2.5 text-[14px] font-bold">{title}</h3>{children}</div>
}
