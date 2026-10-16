'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertTriangle, CheckCircle2, FileText, Mail, MapPin, Phone, Send } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useAction, useMe } from '@/hooks/use-app'
import { ApplicationService, JobService, ProfileService, Recommendations } from '@/lib/services'
import type { Application } from '@/lib/types'
import { salaryRange } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge, CompanyLogo, Field, ProgressBar, TextArea } from '@/components/ui/kit'
import { ConfirmDialog, Spinner } from '@/components/ui/sheet'
import { PageHeader } from '@/components/layout/page-header'

const STEPS = ['Review', 'Confirm', 'Submitted']

export default function Apply() {
  const { id } = useParams<{ id: string }>()
  const db = useDB()
  const me = useMe()
  const [run, pending] = useAction()
  const [note, setNote] = useState('')
  const [agree, setAgree] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [submitted, setSubmitted] = useState<Application | null>(null)
  const [touched, setTouched] = useState(false)

  const job = db.jobs.find((j) => j.id === id)
  const employer = db.employers.find((e) => e.id === job?.employerId)
  const profile = ProfileService.get(db, me.id)
  const completion = ProfileService.completion(profile)
  const existing = job && db.applications.find((a) => a.jobId === job.id && a.userId === me.id)

  if (!job || !employer || !profile) return <PageHeader title="Job not found" back="/jobs" />

  const step = submitted ? 2 : confirm ? 1 : 0

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg pt-10 text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-full bg-success-50 text-success"><CheckCircle2 size={42} /></span>
        <h1 className="mt-6 text-[26px] font-bold tracking-tight">Application submitted!</h1>
        <p className="mt-2 text-[15px] text-muted">{employer.name} has received your application for <b className="text-ink">{job.title}</b>. We’ll notify you as soon as your status changes.</p>
        <div className="card card-pad mt-6 text-left">
          <div className="flex items-center justify-between"><span className="text-[13px] text-muted">Current status</span><Badge>Submitted</Badge></div>
          <div className="mt-3 flex items-center justify-between"><span className="text-[13px] text-muted">Next step</span><span className="text-[13px] font-semibold">Employer review (usually 3–5 days)</span></div>
        </div>
        <div className="mt-6 grid gap-3">
          <Link href={`/applications/${submitted.id}`} className="btn btn-primary">Track my application</Link>
          <Link href="/jobs" className="btn btn-secondary">Keep exploring jobs</Link>
        </div>
      </div>
    )
  }

  if (existing) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Already applied" back={`/jobs/${job.id}`} />
        <div className="card card-pad text-center">
          <CheckCircle2 size={36} className="mx-auto text-success" />
          <p className="mt-3 text-[15px]">You already applied to <b>{job.title}</b>. Duplicate applications aren’t allowed.</p>
          <Link href={`/applications/${existing.id}`} className="btn btn-primary mt-5 w-full">View application status</Link>
        </div>
      </div>
    )
  }

  if (!JobService.isOpen(job)) {
    return <div className="mx-auto max-w-lg"><PageHeader title="Applications closed" back={`/jobs/${job.id}`} /><p className="card card-pad text-[15px] text-muted">This job is no longer accepting applications.</p></div>
  }

  const match = Recommendations.jobMatch(profile, job)
  const submit = async () => {
    const res = await run(() => ApplicationService.apply(job.id, note), { success: 'Application submitted successfully' })
    setConfirm(false)
    if (res.ok) setSubmitted(res.data)
  }

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <PageHeader title="Apply for this job" back={`/jobs/${job.id}`} />
      <ol className="mb-6 flex items-center gap-2" aria-label="Application steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span className={cn('grid size-6 place-items-center rounded-full text-[12px] font-bold', i <= step ? 'bg-brand text-white' : 'bg-[#e1e7f0] text-muted')}>{i + 1}</span>
            <span className={cn('text-[13px] font-semibold', i <= step ? 'text-ink' : 'text-muted')}>{s}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
          </li>
        ))}
      </ol>

      <div className="card flex items-center gap-3 p-4">
        <CompanyLogo initials={employer.initials} color={employer.color} />
        <div className="min-w-0 flex-1"><p className="text-[12px] text-muted">{employer.name}</p><p className="truncate text-[16px] font-bold">{job.title}</p><p className="text-[12px] text-muted">{salaryRange(job.salaryMin, job.salaryMax)} · {job.type}</p></div>
        <Badge tone={match.score >= 70 ? 'green' : 'blue'}>{match.score}% match</Badge>
      </div>

      <h2 className="mb-2.5 mt-6 text-[16px] font-bold">Your information</h2>
      <div className="card card-pad">
        <div className="flex items-start justify-between">
          <div><p className="text-[16px] font-bold">{ProfileService.fullName(profile)}</p><p className="text-[13px] text-muted">{profile.headline || 'No headline yet'}</p></div>
          <Link href="/profile/personal" className="link">Edit</Link>
        </div>
        <div className="mt-3 grid gap-1.5 text-[13px] text-[#4a5b75]">
          <span className="flex items-center gap-2"><Mail size={14} className="text-muted" />{profile.email}</span>
          <span className="flex items-center gap-2"><Phone size={14} className="text-muted" />{profile.phone || <i className="text-danger">No phone number</i>}</span>
          <span className="flex items-center gap-2"><MapPin size={14} className="text-muted" />{profile.location || <i className="text-danger">No location</i>}</span>
        </div>
      </div>

      <h2 className="mb-2.5 mt-6 text-[16px] font-bold">Résumé</h2>
      <Link href="/resume" className="card tap flex items-center gap-3 p-4">
        <span className="grid size-11 place-items-center rounded-xl bg-danger-50 text-danger"><FileText size={20} /></span>
        <div className="flex-1"><p className="text-[14px] font-semibold">{profile.firstName}-{profile.lastName}-Resume.pdf</p><p className="text-[12px] text-muted">Generated from your DiskarTech profile · {completion.percent}% complete</p></div>
        <span className="link">Preview</span>
      </Link>
      {completion.percent < 70 && (
        <div className="mt-3 flex gap-2.5 rounded-2xl bg-warn-50 p-3.5 text-[13px] text-[#8a6100]">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <span>Your profile is only {completion.percent}% complete. Employers are 3× more likely to respond to complete profiles. <Link href={completion.missing[0]?.href ?? '/profile'} className="font-semibold underline">{completion.missing[0]?.label}</Link></span>
        </div>
      )}
      <div className="mt-3"><p className="mb-1 text-[12px] text-muted">Profile strength</p><ProgressBar value={completion.percent} /></div>

      <Field label="Message to the employer (optional)" hint={`${note.length}/500 · Briefly say why you’re a great fit.`} className="mt-6">
        <TextArea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder={`Hi ${employer.name} team, I’m excited to apply because…`} />
      </Field>

      <label className="mt-5 flex items-start gap-3 text-[13px] text-muted">
        <input type="checkbox" className="mt-0.5 size-5 accent-[var(--color-brand)]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>I confirm my information is accurate and I allow {employer.name} to view my DiskarTech profile and résumé.
          {touched && !agree && <span className="mt-1 block font-medium text-danger">Please confirm to continue</span>}</span>
      </label>

      <button className="btn btn-primary mt-6 w-full" onClick={() => { setTouched(true); if (agree) setConfirm(true) }}>Review & Submit</button>

      <ConfirmDialog open={confirm} onClose={() => !pending && setConfirm(false)} onConfirm={submit} busy={pending}
        title="Submit application?" confirmLabel={pending ? 'Submitting…' : 'Submit'}
        message={<>You’re applying for <b className="text-ink">{job.title}</b> at <b className="text-ink">{employer.name}</b>. You can’t edit your application after submitting.</>} />
      {pending && <div className="fixed inset-0 z-[90] grid place-items-center bg-white/40"><Spinner className="size-8 text-brand" /></div>}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-subtle"><Send size={12} />Your application goes straight to the employer’s dashboard</div>
    </div>
  )
}
