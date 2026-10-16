'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Sparkles, X } from 'lucide-react'
import { useAction } from '@/hooks/use-app'
import { ProfileService } from '@/lib/services'
import { SKILL_CATALOG, SKILL_LEVELS } from '@/lib/constants'
import type { Profile, SkillLevel } from '@/lib/types'
import { cn } from '@/lib/utils'
import { EmptyState, TextInput } from '@/components/ui/kit'

export function SkillsEditor({ profile }: { profile: Profile }) {
  const [run, pending] = useAction()
  const [name, setName] = useState('')
  const [level, setLevel] = useState<SkillLevel>('Beginner')
  const update = (skills: Profile['skills'], msg: string) => run(() => ProfileService.update({ skills }), { success: msg })
  const add = (n = name) => {
    const s = n.trim()
    if (!s) return
    if (profile.skills.some((x) => x.name.toLowerCase() === s.toLowerCase())) return update(profile.skills, `${s} is already in your skills`)
    update([...profile.skills, { name: s, level, source: 'self' }], `${s} added`)
    setName('')
  }
  const suggestions = SKILL_CATALOG.filter((s) => !profile.skills.some((x) => x.name === s) && s.toLowerCase().includes(name.toLowerCase())).slice(0, 10)

  return (
    <>
      <div className="card card-pad">
        <h2 className="text-[15px] font-bold">Add a skill</h2>
        <div className="mt-3 flex gap-2">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. JavaScript" onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button className="btn btn-primary shrink-0 px-4" onClick={() => add()} disabled={pending} aria-label="Add skill"><Plus size={18} /></button>
        </div>
        <div className="mt-3 flex gap-1.5">{SKILL_LEVELS.map((l) => <button key={l} onClick={() => setLevel(l)} className={cn('rounded-full px-3 py-1.5 text-[12px] font-semibold', level === l ? 'bg-navy text-white' : 'bg-canvas text-muted')}>{l}</button>)}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">{suggestions.map((s) => <button key={s} onClick={() => add(s)} className="rounded-full border border-dashed border-[#c9d3e1] px-2.5 py-1 text-[12px] text-muted hover:border-brand hover:text-brand">+ {s}</button>)}</div>
      </div>
      <h2 className="mb-3 mt-6 text-[16px] font-bold">Your skills ({profile.skills.length})</h2>
      {profile.skills.length === 0 ? <EmptyState icon={Sparkles} title="No skills yet" message="Add skills above or take the skills assessment." action={<Link href="/assessment" className="btn btn-secondary btn-sm">Take assessment</Link>} /> : (
        <div className="card divide-y divide-line">
          {profile.skills.map((s) => (
            <div key={s.name} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-32 flex-1"><p className="text-[15px] font-semibold">{s.name}</p><p className="text-[11px] text-muted">{s.source === 'assessment' ? 'Verified by assessment' : s.source === 'course' ? 'Earned from a course' : 'Self-reported'}</p></div>
              <select value={s.level} onChange={(e) => update(profile.skills.map((x) => (x.name === s.name ? { ...x, level: e.target.value as SkillLevel, source: 'self' } : x)), `${s.name} set to ${e.target.value}`)}
                className="rounded-xl border border-line bg-white px-2.5 py-1.5 text-[13px] font-semibold" aria-label={`${s.name} level`}>
                {SKILL_LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
              <button onClick={() => update(profile.skills.filter((x) => x.name !== s.name), `${s.name} removed`)} className="grid size-8 place-items-center rounded-full text-muted hover:bg-danger-50 hover:text-danger" aria-label={`Remove ${s.name}`}><X size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
