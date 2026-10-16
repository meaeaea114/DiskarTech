'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useAction, useMe } from '@/hooks/use-app'
import { ApplicationService, ProfileService, Recommendations, type InterviewInput } from '@/lib/services'
import { INTERVIEW_TYPES } from '@/lib/constants'
import type { Application, DB, Interview } from '@/lib/types'
import { timeAgo } from '@/lib/format'
import { Avatar, Badge, ChipGroup, Field, StatusBadge, TextArea, TextInput } from '@/components/ui/kit'
import { Sheet, Spinner } from '@/components/ui/sheet'

/** Everything an employer screen needs, derived from the store. */
export function useEmployerData() {
  const db = useDB()
  const me = useMe()
  return useMemo(() => {
    const employer = db.employers.find((e) => e.id === me.employerId)!
    const jobs = db.jobs.filter((j) => j.employerId === me.employerId)
    const apps = ApplicationService.forEmployer(db, me.employerId!)
    const appIds = apps.map((a) => a.id)
    const interviews = db.interviews.filter((i) => appIds.includes(i.applicationId))
    return { db, me, employer, jobs, apps, interviews }
  }, [db, me])
}

export function applicantInfo(db: DB, app: Application) {
  const user = db.users.find((u) => u.id === app.userId)
  const profile = db.profiles.find((p) => p.userId === app.userId)
  const job = db.jobs.find((j) => j.id === app.jobId)!
  const match = Recommendations.jobMatch(profile, job)
  return { user, profile, job, match, name: profile ? ProfileService.fullName(profile) : user?.name ?? 'Applicant' }
}

export function ApplicantRow({ app, showJob = true }: { app: Application; showJob?: boolean }) {
  const db = useDB()
  const { profile, job, match, name } = applicantInfo(db, app)
  return (
    <Link href={`/employer/applicants/${app.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-canvas/60">
      <Avatar name={name} color={profile?.avatarColor} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{name}</p>
        <p className="truncate text-[12px] text-muted">{showJob ? job.title : profile?.headline} · {timeAgo(app.appliedAt)}</p>
      </div>
      <Badge tone={match.score >= 70 ? 'green' : 'gray'} className="hidden">{match.score}%</Badge>
      <StatusBadge status={app.status} />
      <ChevronRight size={16} className="text-subtle" />
    </Link>
  )
}

const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)

/** Schedule a new interview, or edit an existing one. */
export function InterviewSheet({ open, onClose, applicationId, existing, applicantName }: {
  open: boolean
  onClose: () => void
  applicationId: string
  existing?: Interview
  applicantName: string
}) {
  const [run, pending] = useAction()
  const employerAddress = useEmployerData().employer.location
  const [f, setF] = useState<InterviewInput>(() => existing
    ? { date: existing.date, time: existing.time, type: existing.type, location: existing.location, notes: existing.notes }
    : { date: tomorrow(), time: '10:00', type: 'Video call', location: 'https://meet.example.ph/diskartech-' + Math.floor(1000 + Math.random() * 8999), notes: 'Please prepare a short self-introduction and bring a copy of your résumé.' })
  const [error, setError] = useState('')

  const submit = async () => {
    const err = ApplicationService.validateInterview(f)
    setError(err ?? '')
    if (err) return
    const r = await run(
      () => existing ? ApplicationService.updateInterview(existing.id, f) : ApplicationService.scheduleInterview(applicationId, f),
      { success: existing ? 'Interview updated — applicant notified' : `Interview scheduled with ${applicantName}` },
    )
    if (r.ok) onClose()
  }

  return (
    <Sheet open={open} onClose={() => !pending && onClose()} title={existing ? 'Edit interview' : 'Schedule interview'} description={applicantName}
      footer={<button className="btn btn-primary w-full" onClick={submit} disabled={pending}>{pending ? <><Spinner />Saving…</> : existing ? 'Save changes' : 'Confirm & notify applicant'}</button>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><TextInput type="date" min={new Date().toISOString().slice(0, 10)} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Time"><TextInput type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
        </div>
        <Field group label="Interview type">
          <ChipGroup value={f.type} options={INTERVIEW_TYPES.map((t) => ({ value: t, label: t }))}
            onChange={(type: InterviewInput['type']) => setF({ ...f, type, location: type === 'On-site' ? employerAddress : type === 'Phone call' ? '0917 555 0100' : f.location.startsWith('http') ? f.location : 'https://meet.example.ph/diskartech-' + Math.floor(1000 + Math.random() * 8999) })} />
        </Field>
        <Field label={f.type === 'On-site' ? 'Address' : f.type === 'Phone call' ? 'Phone number we’ll call from' : 'Meeting link'}>
          <TextInput value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
        </Field>
        <Field label="Notes for the applicant"><TextArea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-[13px] font-medium text-danger">{error}</p>}
      </div>
    </Sheet>
  )
}
