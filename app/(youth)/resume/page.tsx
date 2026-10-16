'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Award, Briefcase, Check, ChevronDown, Download, Eye, FileDown, FolderKanban, GraduationCap } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useAction, useMe } from '@/hooks/use-app'
import { ProfileService, ResumeService } from '@/lib/services'
import type { Certification, Education, Experience, Project } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Field, ProgressBar, Segmented, TextArea, TextInput } from '@/components/ui/kit'
import { Spinner } from '@/components/ui/sheet'
import { PageHeader } from '@/components/layout/page-header'
import { CollectionEditor } from '@/components/features/collection-editor'
import { SkillsEditor } from '@/components/features/skills-editor'
import { ResumeDocument } from '@/components/features/resume-document'
import { toast } from '@/components/ui/toast'

type Section = 'personal' | 'summary' | 'education' | 'skills' | 'experience' | 'projects' | 'certifications'

export default function ResumeBuilder() {
  const db = useDB()
  const me = useMe()
  const profile = ProfileService.get(db, me.id)!
  const [run, pending] = useAction()
  const [view, setView] = useState<'edit' | 'preview'>('edit')
  const [open, setOpen] = useState<Section | null>('personal')
  const base = { firstName: profile.firstName, lastName: profile.lastName, headline: profile.headline, location: profile.location, email: profile.email, phone: profile.phone, summary: profile.summary }
  const [draft, setDraft] = useState(base)
  const dirty = JSON.stringify(draft) !== JSON.stringify(base)
  const live = { ...profile, ...draft } // live preview reflects unsaved typing
  const completion = ProfileService.completion(profile)

  const saveDraft = () => run(() => ProfileService.update(draft), { success: 'Résumé saved' })
  const download = (kind: 'pdf' | 'doc') => {
    if (dirty) { toast.info('Save your changes first so the download is up to date.'); return }
    if (kind === 'pdf') { setView('preview'); setTimeout(ResumeService.printPDF, 150) } else { ResumeService.downloadDoc(profile); toast.success('Résumé downloaded') }
  }

  const sections: { id: Section; title: string; icon?: typeof Award; body: React.ReactNode; count?: number }[] = [
    {
      id: 'personal', title: 'Personal information', body: (
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name"><TextInput value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></Field>
          <Field label="Last name"><TextInput value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></Field>
          <Field label="Professional title" className="col-span-2"><TextInput value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} placeholder="e.g. Junior Web Developer" /></Field>
          <Field label="Location" className="col-span-2"><TextInput value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} /></Field>
          <Field label="Email"><TextInput value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
          <Field label="Phone"><TextInput value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field>
        </div>
      ),
    },
    { id: 'summary', title: 'Professional summary', body: <Field hint={`${draft.summary.length}/400`}><TextArea value={draft.summary} maxLength={400} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} placeholder="2–3 sentences about your strengths and goals" /></Field> },
    {
      id: 'education', title: 'Education', count: profile.education.length, body: (
        <CollectionEditor<Education> items={profile.education} onSave={(education) => ProfileService.update({ education })} noun="Education" icon={GraduationCap} emptyMessage="Add your school."
          fields={[{ key: 'school', label: 'School', required: true }, { key: 'degree', label: 'Degree / Strand', required: true }, { key: 'startYear', label: 'Start year', required: true, half: true }, { key: 'endYear', label: 'End year', required: true, half: true }]}
          render={(e) => <><p className="text-[14px] font-bold">{e.degree}</p><p className="text-[12px] text-muted">{e.school} · {e.startYear} – {e.endYear}</p></>} />
      ),
    },
    { id: 'skills', title: 'Skills', count: profile.skills.length, body: <SkillsEditor profile={profile} /> },
    {
      id: 'experience', title: 'Experience', count: profile.experience.length, body: (
        <CollectionEditor<Experience> items={profile.experience} onSave={(experience) => ProfileService.update({ experience })} noun="Experience" icon={Briefcase} emptyMessage="Internships and OJT count!"
          fields={[{ key: 'title', label: 'Job title', required: true }, { key: 'company', label: 'Company', required: true }, { key: 'location', label: 'Location' }, { key: 'start', label: 'Start', required: true, half: true }, { key: 'end', label: 'End', required: true, half: true }, { key: 'description', label: 'Description', multiline: true }]}
          render={(x) => <><p className="text-[14px] font-bold">{x.title}</p><p className="text-[12px] text-muted">{x.company} · {x.start} – {x.end}</p></>} />
      ),
    },
    {
      id: 'projects', title: 'Projects', count: profile.projects.length, body: (
        <CollectionEditor<Project> items={profile.projects} onSave={(projects) => ProfileService.update({ projects })} noun="Project" icon={FolderKanban} emptyMessage="Showcase your capstone or personal projects."
          fields={[{ key: 'name', label: 'Project name', required: true }, { key: 'description', label: 'Description', required: true, multiline: true }, { key: 'link', label: 'Link' }]}
          render={(x) => <><p className="text-[14px] font-bold">{x.name}</p><p className="line-clamp-2 text-[12px] text-muted">{x.description}</p></>} />
      ),
    },
    {
      id: 'certifications', title: 'Certifications', count: profile.certifications.length, body: (
        <CollectionEditor<Certification> items={profile.certifications} onSave={(certifications) => ProfileService.update({ certifications })} noun="Certification" icon={Award} emptyMessage="Add certificates and trainings."
          fields={[{ key: 'name', label: 'Name', required: true }, { key: 'issuer', label: 'Issuer', required: true }, { key: 'year', label: 'Year', required: true, half: true }]}
          render={(c) => <><p className="text-[14px] font-bold">{c.name}</p><p className="text-[12px] text-muted">{c.issuer} · {c.year}</p></>} />
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Résumé Builder" back="/profile" actions={<Link href="/resume/preview" className="btn btn-secondary btn-sm"><Eye size={16} />Full preview</Link>} />
      <div className="mb-4 flex items-center gap-3"><ProgressBar value={completion.percent} className="flex-1" /><span className="text-[12px] font-semibold text-brand">{completion.percent}% complete</span></div>
      <Segmented className="mb-4" value={view} onChange={setView} options={[{ value: 'edit', label: 'Edit' }, { value: 'preview', label: 'Live preview' }]} />

      <div className="grid gap-6">
        <div className={cn('space-y-3', view === 'preview' && 'hidden ')}>
          {sections.map((s) => (
            <section key={s.id} className="card overflow-hidden">
              <button onClick={() => setOpen(open === s.id ? null : s.id)} className="flex w-full items-center gap-3 px-4 py-4 text-left" aria-expanded={open === s.id}>
                <span className="flex-1 text-[15px] font-semibold">{s.title}</span>
                {s.count !== undefined && <span className={cn('text-[12px] font-medium', s.count ? 'text-success' : 'text-muted')}>{s.count ? `${s.count} added` : 'Empty'}</span>}
                <ChevronDown size={18} className={cn('text-muted transition', open === s.id && 'rotate-180')} />
              </button>
              {open === s.id && <div className="border-t border-line bg-canvas/50 p-4">{s.body}</div>}
            </section>
          ))}
          <button className="btn btn-primary w-full" onClick={saveDraft} disabled={!dirty || pending}>{pending ? <><Spinner />Saving…</> : dirty ? 'Save changes' : <><Check size={18} />All changes saved</>}</button>
        </div>

        <div className={cn(view === 'edit' && 'hidden ')}>
          <div className="">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-subtle">Live preview{dirty && ' · unsaved changes'}</p>
            <div className="print-area"><ResumeDocument profile={live} /></div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="btn btn-primary" onClick={() => download('pdf')}><Download size={18} />PDF</button>
              <button className="btn btn-secondary" onClick={() => download('doc')}><FileDown size={18} />Word</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
