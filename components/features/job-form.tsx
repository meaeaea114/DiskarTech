'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Info } from 'lucide-react'
import { useAction } from '@/hooks/use-app'
import { JobService, validateJob, type JobInput } from '@/lib/services'
import { EXPERIENCE_LEVELS, JOB_CATEGORIES, JOB_TYPES, LOCATIONS, SKILL_CATALOG, WORK_SETUPS } from '@/lib/constants'
import type { Job } from '@/lib/types'
import { toDateInput } from '@/lib/format'
import { ChipGroup, Field, ListInput, Select, SkillPicker, TextArea, TextInput } from '@/components/ui/kit'
import { Spinner } from '@/components/ui/sheet'
import { useEmployerData } from './employer'

const EMPTY: JobInput = {
  title: '', category: JOB_CATEGORIES[0], location: '', workSetup: 'On-site', type: 'Full-time', level: 'Entry Level',
  salaryMin: 0, salaryMax: 0, description: '', responsibilities: [], qualifications: [], skills: [],
  benefits: ['Government-mandated benefits (SSS, PhilHealth, Pag-IBIG)', '13th month pay'],
  deadline: new Date(Date.now() + 30 * 86_400_000).toISOString(),
}

/** Create or edit a job post. Drafts need only a title; publishing validates everything. */
export function JobForm({ job }: { job?: Job }) {
  const router = useRouter()
  const { employer } = useEmployerData()
  const [run, pending] = useAction()
  const [action, setAction] = useState<'draft' | 'publish' | null>(null)
  const [f, setF] = useState<JobInput>(() => job ? {
    title: job.title, category: job.category, location: job.location, workSetup: job.workSetup, type: job.type, level: job.level,
    salaryMin: job.salaryMin, salaryMax: job.salaryMax, description: job.description, responsibilities: job.responsibilities,
    qualifications: job.qualifications, skills: job.skills, benefits: job.benefits, deadline: job.deadline,
  } : EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof JobInput>(k: K, v: JobInput[K]) => { setF({ ...f, [k]: v }); setErrors({ ...errors, [k]: '', salary: k.startsWith('salary') ? '' : errors.salary }) }
  const isLive = job && job.status !== 'draft'

  const submit = async (publish: boolean) => {
    const errs = validateJob(f, publish || !!isLive)
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setAction(publish ? 'publish' : 'draft')
    if (job) {
      const r = await run(() => JobService.update(job.id, f), { success: 'Job updated' })
      if (r.ok && publish && job.status === 'draft') {
        const p = await run(() => JobService.publish(job.id), { success: (s) => (s === 'published' ? 'Job published — it’s now live' : 'Submitted for admin review') })
        if (p.ok) router.push(`/employer/jobs/${job.id}`)
      } else if (r.ok) router.push(`/employer/jobs/${job.id}`)
    } else {
      const r = await run(() => JobService.create(f, publish), {
        success: (j) => (!publish ? 'Draft saved' : j.status === 'published' ? 'Job published — it’s now live' : 'Submitted for admin review'),
      })
      if (r.ok) router.push(`/employer/jobs/${r.data.id}`)
    }
    setAction(null)
  }

  return (
    <div className="space-y-5 pb-6">
      {employer.verification !== 'verified' && (
        <div className="flex gap-2.5 rounded-2xl bg-warn-50 p-3.5 text-[13px] text-[#8a6100]"><Info size={17} className="mt-0.5 shrink-0" />Your company isn’t verified yet, so published jobs go to admin review before they appear to job seekers.</div>
      )}
      <Section title="Basics">
        <Field label="Job title" error={errors.title}><TextInput value={f.title} invalid={!!errors.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Junior Web Developer" /></Field>
        <div className="grid gap-4">
          <Field label="Category"><Select value={f.category} onChange={(e) => set('category', e.target.value)}>{JOB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Location" error={errors.location}>
            <Select value={f.location} invalid={!!errors.location} onChange={(e) => set('location', e.target.value)}>
              <option value="">Select a city</option>
              {LOCATIONS.map((l) => <option key={l.city} value={l.city}>{l.city}, {l.region}</option>)}
            </Select>
          </Field>
        </div>
        <Field group label="Employment type"><ChipGroup value={f.type} onChange={(v: JobInput['type']) => set('type', v)} options={JOB_TYPES.map((t) => ({ value: t, label: t }))} /></Field>
        <Field group label="Experience level"><ChipGroup value={f.level} onChange={(v: JobInput['level']) => set('level', v)} options={EXPERIENCE_LEVELS.map((t) => ({ value: t, label: t }))} /></Field>
        <Field group label="Work setup"><ChipGroup value={f.workSetup} onChange={(v: JobInput['workSetup']) => set('workSetup', v)} options={WORK_SETUPS.map((t) => ({ value: t, label: t }))} /></Field>
      </Section>

      <Section title="Compensation & deadline">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min salary (₱/month)" error={errors.salary}><TextInput type="number" inputMode="numeric" min={0} step={500} value={f.salaryMin || ''} invalid={!!errors.salary} onChange={(e) => set('salaryMin', Number(e.target.value))} placeholder="20000" /></Field>
          <Field label="Max salary (₱/month)"><TextInput type="number" inputMode="numeric" min={0} step={500} value={f.salaryMax || ''} invalid={!!errors.salary} onChange={(e) => set('salaryMax', Number(e.target.value))} placeholder="28000" /></Field>
        </div>
        <Field label="Application deadline" error={errors.deadline}>
          <TextInput type="date" min={new Date().toISOString().slice(0, 10)} value={f.deadline ? toDateInput(f.deadline) : ''} invalid={!!errors.deadline}
            onChange={(e) => set('deadline', e.target.value ? new Date(`${e.target.value}T23:59:00`).toISOString() : '')} />
        </Field>
      </Section>

      <Section title="Details">
        <Field label="Description" error={errors.description} hint={`${f.description.length} characters`}><TextArea rows={5} value={f.description} invalid={!!errors.description} onChange={(e) => set('description', e.target.value)} placeholder="What will this person do, and why is it a great opportunity?" /></Field>
        <Field group label="Responsibilities" error={errors.responsibilities}><ListInput value={f.responsibilities} onChange={(v) => set('responsibilities', v)} placeholder="Add a responsibility and press Enter" invalid={!!errors.responsibilities} /></Field>
        <Field group label="Qualifications" error={errors.qualifications}><ListInput value={f.qualifications} onChange={(v) => set('qualifications', v)} placeholder="Add a qualification and press Enter" invalid={!!errors.qualifications} /></Field>
        <Field group label="Required skills" error={errors.skills}><SkillPicker value={f.skills} onChange={(v) => set('skills', v)} catalog={SKILL_CATALOG} invalid={!!errors.skills} /></Field>
        <Field group label="Benefits"><ListInput value={f.benefits} onChange={(v) => set('benefits', v)} placeholder="e.g. HMO coverage" /></Field>
      </Section>

      <div className="sticky bottom-[calc(78px+env(safe-area-inset-bottom))] z-10 grid grid-cols-2 gap-3 rounded-[20px] bg-canvas/90 py-2 backdrop-blur">
        {isLive ? (
          <button className="btn btn-primary col-span-2" onClick={() => submit(false)} disabled={pending}>{pending ? <><Spinner />Saving…</> : 'Save changes'}</button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={() => submit(false)} disabled={pending}>{action === 'draft' ? <Spinner /> : 'Save Draft'}</button>
            <button className="btn btn-primary" onClick={() => submit(true)} disabled={pending}>{action === 'publish' ? <Spinner /> : 'Publish Job'}</button>
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="card space-y-4 p-4"><h2 className="text-[16px] font-bold">{title}</h2>{children}</section>
}
