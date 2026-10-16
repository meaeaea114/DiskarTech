'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Award, Briefcase, Check, FolderKanban, GraduationCap, Plus, Sparkles, X } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useAction, useMe, useQueryParam } from '@/hooks/use-app'
import { ProfileService } from '@/lib/services'
import { CAREER_PATHS } from '@/lib/data/careers'
import { LOCATIONS, SKILL_CATALOG, SKILL_LEVELS } from '@/lib/constants'
import type { Certification, Education, Experience, Profile, Project, SkillLevel } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge, ChipGroup, EmptyState, Field, IconTile, Select, TextArea, TextInput, Toggle } from '@/components/ui/kit'
import { Spinner } from '@/components/ui/sheet'
import { PageHeader } from '@/components/layout/page-header'
import { CollectionEditor } from '@/components/features/collection-editor'
import { SkillsEditor } from '@/components/features/skills-editor'

const TITLES: Record<string, string> = {
  personal: 'Personal Information', education: 'Education', skills: 'Skills', experience: 'Work Experience',
  certifications: 'Certifications', projects: 'Projects', interests: 'Career Interests',
}

export default function ProfileSection() {
  const { section } = useParams<{ section: string }>()
  const db = useDB()
  const me = useMe()
  const profile = ProfileService.get(db, me.id)
  if (!profile || !TITLES[section]) return <div><PageHeader title="Not found" back="/profile" /><EmptyState icon={X} title="Section not found" /></div>
  const save = (patch: Partial<Profile>) => ProfileService.update(patch)

  return (
    <div className="mx-auto max-w-2xl pb-6">
      <PageHeader title={TITLES[section]} back="/profile" />
      {section === 'personal' && <PersonalForm profile={profile} />}
      {section === 'education' && (
        <CollectionEditor<Education> items={profile.education} onSave={(education) => save({ education })} noun="Education" icon={GraduationCap}
          emptyMessage="Add your school or university so employers know your background."
          fields={[{ key: 'school', label: 'School', required: true, placeholder: 'e.g. Batangas State University' }, { key: 'degree', label: 'Degree / Strand', required: true, placeholder: 'e.g. BS Information Technology' }, { key: 'startYear', label: 'Start year', required: true, half: true, placeholder: '2022' }, { key: 'endYear', label: 'End year', required: true, half: true, placeholder: '2026 or Present' }]}
          render={(e) => <><p className="text-[15px] font-bold">{e.degree}</p><p className="text-[13px] text-muted">{e.school}</p><p className="text-[12px] text-subtle">{e.startYear} – {e.endYear}</p></>} />
      )}
      {section === 'experience' && (
        <CollectionEditor<Experience> items={profile.experience} onSave={(experience) => save({ experience })} noun="Experience" icon={Briefcase}
          emptyMessage="Internships, OJT, part-time jobs, and volunteer work all count!"
          fields={[{ key: 'title', label: 'Job title', required: true, placeholder: 'e.g. IT Support Intern' }, { key: 'company', label: 'Company / Organization', required: true }, { key: 'location', label: 'Location', placeholder: 'e.g. Batangas City' }, { key: 'start', label: 'Start', required: true, half: true, placeholder: '2024' }, { key: 'end', label: 'End', required: true, half: true, placeholder: 'Present' }, { key: 'description', label: 'What did you do?', multiline: true, placeholder: 'Describe your responsibilities and achievements' }]}
          render={(x) => <><p className="text-[15px] font-bold">{x.title}</p><p className="text-[13px] text-muted">{x.company}{x.location && ` · ${x.location}`}</p><p className="text-[12px] text-subtle">{x.start} – {x.end}</p>{x.description && <p className="mt-1.5 text-[13px] text-[#4a5b75]">{x.description}</p>}</>} />
      )}
      {section === 'certifications' && (
        <>
          <p className="mb-4 text-[13px] text-muted">Certificates from DiskarTech courses are added automatically. <Link href="/learn" className="font-semibold text-brand">Earn more</Link></p>
          <CollectionEditor<Certification> items={profile.certifications} onSave={(certifications) => save({ certifications })} noun="Certification" icon={Award}
            emptyMessage="Add TESDA NCs, online certificates, or trainings you completed."
            fields={[{ key: 'name', label: 'Certificate name', required: true, placeholder: 'e.g. Computer Systems Servicing NC II' }, { key: 'issuer', label: 'Issued by', required: true, placeholder: 'e.g. TESDA' }, { key: 'year', label: 'Year', required: true, half: true, placeholder: '2025' }]}
            render={(c) => <><p className="text-[15px] font-bold">{c.name}</p><p className="text-[13px] text-muted">{c.issuer} · {c.year}</p>{c.courseId && <Badge tone="blue" className="mt-1.5">DiskarTech verified</Badge>}</>} />
        </>
      )}
      {section === 'projects' && (
        <CollectionEditor<Project> items={profile.projects} onSave={(projects) => save({ projects })} noun="Project" icon={FolderKanban}
          emptyMessage="Capstone projects, school systems, and personal websites show employers what you can build."
          fields={[{ key: 'name', label: 'Project name', required: true, placeholder: 'e.g. Barangay Health Records System' }, { key: 'description', label: 'Description', required: true, multiline: true }, { key: 'link', label: 'Link', placeholder: 'https://github.com/…' }]}
          render={(x) => <><p className="text-[15px] font-bold">{x.name}</p><p className="mt-1 text-[13px] text-[#4a5b75]">{x.description}</p>{x.link && <p className="mt-1 truncate text-[12px] text-brand">{x.link}</p>}</>} />
      )}
      {section === 'skills' && <SkillsEditor profile={profile} />}
      {section === 'interests' && <InterestsEditor profile={profile} />}
    </div>
  )
}

function PersonalForm({ profile }: { profile: Profile }) {
  const [run, pending] = useAction()
  const [f, setF] = useState({ firstName: profile.firstName, lastName: profile.lastName, headline: profile.headline, location: profile.location, phone: profile.phone, email: profile.email, summary: profile.summary, openToWork: profile.openToWork, preferredLocations: profile.preferredLocations })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const dirty = JSON.stringify(f) !== JSON.stringify({ firstName: profile.firstName, lastName: profile.lastName, headline: profile.headline, location: profile.location, phone: profile.phone, email: profile.email, summary: profile.summary, openToWork: profile.openToWork, preferredLocations: profile.preferredLocations })
  const set = (k: keyof typeof f, v: unknown) => { setF({ ...f, [k]: v }); setErrors({ ...errors, [k]: '' }) }

  const submit = async () => {
    const e: Record<string, string> = {}
    if (!f.firstName.trim()) e.firstName = 'Required'
    if (!f.lastName.trim()) e.lastName = 'Required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email'
    if (f.phone && !/^[0-9+\s-]{10,16}$/.test(f.phone)) e.phone = 'Use a valid PH number, e.g. 0917 123 4567'
    setErrors(e)
    if (Object.keys(e).length) return
    await run(() => ProfileService.update(f), { success: 'Profile updated' })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" error={errors.firstName}><TextInput value={f.firstName} invalid={!!errors.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
        <Field label="Last name" error={errors.lastName}><TextInput value={f.lastName} invalid={!!errors.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
      </div>
      <Field label="Headline" hint="e.g. BSIT Student · Aspiring Web Developer"><TextInput value={f.headline} maxLength={80} onChange={(e) => set('headline', e.target.value)} /></Field>
      <Field label="Location">
        <Select value={f.location} onChange={(e) => set('location', e.target.value)}>
          <option value="">Select your city</option>
          {!LOCATIONS.some((l) => `${l.city}, ${l.region}` === f.location) && f.location && <option value={f.location}>{f.location}</option>}
          {LOCATIONS.map((l) => <option key={l.city} value={`${l.city}, ${l.region}`}>{l.city}, {l.region}</option>)}
        </Select>
      </Field>
      <div className="grid gap-3">
        <Field label="Mobile number" error={errors.phone}><TextInput inputMode="tel" value={f.phone} invalid={!!errors.phone} placeholder="0917 123 4567" onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Email" error={errors.email}><TextInput type="email" value={f.email} invalid={!!errors.email} onChange={(e) => set('email', e.target.value)} /></Field>
      </div>
      <Field label="Professional summary" hint={`${f.summary.length}/400 · 2–3 sentences about who you are and what you’re looking for`}><TextArea value={f.summary} maxLength={400} onChange={(e) => set('summary', e.target.value)} /></Field>
      <Field group label="Preferred work locations">
        <ChipGroup multi value={f.preferredLocations} onChange={(v: string[]) => set('preferredLocations', v)} options={['Remote', ...LOCATIONS.map((l) => l.city)].map((c) => ({ value: c, label: c }))} />
      </Field>
      <div className="card px-4"><Toggle checked={f.openToWork} onChange={(v) => set('openToWork', v)} label="Open to work" description="Let employers know you’re actively looking" /></div>
      <button className="btn btn-primary w-full" onClick={submit} disabled={!dirty || pending}>{pending ? <><Spinner />Saving…</> : dirty ? 'Save changes' : <><Check size={18} />Saved</>}</button>
    </div>
  )
}

function InterestsEditor({ profile }: { profile: Profile }) {
  const router = useRouter()
  const onboarding = useQueryParam('onboarding') === '1'
  const [run, pending] = useAction()
  const [selected, setSelected] = useState(profile.interests)
  const save = async () => {
    const r = await run(() => ProfileService.update({ interests: selected }), { success: 'Career interests saved' })
    if (r.ok && onboarding) router.replace('/home')
  }
  return (
    <>
      <p className="mb-4 text-[14px] text-muted">{onboarding ? 'Welcome! Pick the career paths that interest you — we’ll personalize your jobs and courses.' : 'Choose the paths you want to grow in. Your recommendations update instantly.'}</p>
      <div className="grid gap-2.5">
        {CAREER_PATHS.map((p) => {
          const on = selected.includes(p.id)
          return (
            <button key={p.id} onClick={() => setSelected(on ? selected.filter((x) => x !== p.id) : [...selected, p.id])} aria-pressed={on}
              className={cn('card tap flex items-center gap-3 p-4 text-left ring-2 transition', on ? 'ring-brand' : 'ring-transparent')}>
              <IconTile icon={p.icon} color={p.color} size={44} />
              <div className="flex-1"><p className="text-[15px] font-bold">{p.title}</p><p className="text-[12px] text-muted">{p.description}</p></div>
              <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border-2', on ? 'border-brand bg-brand text-white' : 'border-[#cfd8e5]')}>{on && <Check size={14} />}</span>
            </button>
          )
        })}
      </div>
      <button className="btn btn-primary mt-6 w-full" onClick={save} disabled={pending}>{pending ? <Spinner /> : onboarding ? 'Continue to my dashboard' : 'Save interests'}</button>
      {onboarding && <button className="mt-3 w-full text-center text-[14px] font-medium text-muted" onClick={() => router.replace('/home')}>Skip for now</button>}
    </>
  )
}
