'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Award, Briefcase, CalendarDays, Check, CheckCircle2, FileText, FolderKanban, GraduationCap, Mail, MapPin, Phone, Pencil, SearchX, Star, UserCheck, X, XCircle } from 'lucide-react'
import { useAction } from '@/hooks/use-app'
import { ApplicationService, formatSlot } from '@/lib/services'
import { PIPELINE, STATUS_META } from '@/lib/constants'
import type { ApplicationStatus } from '@/lib/types'
import { formatDate, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Avatar, Badge, EmptyState, ProgressBar, SectionHeader, StatusBadge, TextArea } from '@/components/ui/kit'
import { ConfirmDialog, Sheet, Spinner } from '@/components/ui/sheet'
import { PageHeader } from '@/components/layout/page-header'
import { InterviewSheet, applicantInfo, useEmployerData } from '@/components/features/employer'
import { ResumeDocument } from '@/components/features/resume-document'

export default function ApplicantDetail() {
  const { id } = useParams<{ id: string }>()
  const { db, apps } = useEmployerData()
  const [run, pending] = useAction()
  const [showResume, setShowResume] = useState(false)
  const [interviewSheet, setInterviewSheet] = useState<'new' | 'edit' | null>(null)
  const [confirm, setConfirm] = useState<{ to: ApplicationStatus; title: string } | null>(null)
  const [cancelIv, setCancelIv] = useState(false)
  const [note, setNote] = useState('')
  const app = apps.find((a) => a.id === id)
  const [notes, setNotes] = useState(app?.employerNotes ?? '')

  if (!app) return <div><PageHeader title="Applicant" back="/employer/applicants" /><EmptyState icon={SearchX} title="Applicant not found" /></div>
  const { profile, user, job, match, name } = applicantInfo(db, app)
  const interview = ApplicationService.interviewFor(db, app.id)
  const closed = app.status === 'hired' || app.status === 'rejected'
  const idx = PIPELINE.indexOf(app.status)

  const move = async (to: ApplicationStatus, msg?: string) => {
    const r = await run(() => ApplicationService.updateStatus(app.id, to, note), { success: msg ?? `Moved to ${STATUS_META[to].label} — ${name.split(' ')[0]} was notified` })
    if (r.ok) { setConfirm(null); setNote('') }
  }

  return (
    <div className="mx-auto max-w-5xl pb-6">
      <PageHeader title="Applicant" back="/employer/applicants" />

      <div className="grid gap-5">
        <div className="contents [&>*]:order-3">
          <section className="card !order-1 p-5">
            <div className="flex items-start gap-4">
              <Avatar name={name} color={profile?.avatarColor} size={64} />
              <div className="min-w-0 flex-1">
                <h1 className="text-[22px] font-bold leading-tight">{name}</h1>
                <p className="text-[14px] text-muted">{profile?.headline}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
                  {profile?.location && <span className="flex items-center gap-1"><MapPin size={12} />{profile.location}</span>}
                  <a href={`mailto:${user?.email}`} className="flex items-center gap-1 hover:text-brand"><Mail size={12} />{user?.email}</a>
                  {profile?.phone && <span className="flex items-center gap-1"><Phone size={12} />{profile.phone}</span>}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-canvas p-3.5">
              <div className="flex items-center justify-between text-[13px]"><span>Applied for <b>{job.title}</b> · {timeAgo(app.appliedAt)}</span><StatusBadge status={app.status} /></div>
              <div className="mt-2.5 flex items-center gap-2"><ProgressBar value={match.score} tone={match.score >= 70 ? 'success' : 'brand'} className="flex-1" /><span className="text-[12px] font-bold">{match.score}% skill match</span></div>
            </div>
            {app.coverNote && <blockquote className="mt-4 border-l-4 border-brand-100 pl-3 text-[14px] italic text-[#4a5b75]">“{app.coverNote}”</blockquote>}
            <button className="btn btn-secondary btn-sm mt-4" onClick={() => setShowResume(true)}><FileText size={16} />View résumé</button>
          </section>

          <section>
            <SectionHeader title="Skills" />
            <div className="flex flex-wrap gap-2">
              {job.skills.map((s) => {
                const has = profile?.skills.find((x) => x.name.toLowerCase() === s.toLowerCase())
                return <span key={s} className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold', has ? 'bg-success-50 text-success' : 'bg-danger-50 text-danger')}>{has ? <Check size={12} /> : <X size={12} />}{s}{has && <span className="font-normal opacity-80">· {has.level}</span>}</span>
              })}
              {profile?.skills.filter((s) => !job.skills.some((j) => j.toLowerCase() === s.name.toLowerCase())).map((s) => <Badge key={s.name}>{s.name} · {s.level}</Badge>)}
            </div>
          </section>

          <InfoList title="Education" icon={GraduationCap} items={profile?.education.map((e) => ({ id: e.id, title: e.degree, sub: `${e.school} · ${e.startYear} – ${e.endYear}` })) ?? []} />
          <InfoList title="Experience" icon={Briefcase} items={profile?.experience.map((x) => ({ id: x.id, title: `${x.title} — ${x.company}`, sub: `${x.start} – ${x.end}`, body: x.description })) ?? []} />
          <InfoList title="Certifications" icon={Award} items={profile?.certifications.map((c) => ({ id: c.id, title: c.name, sub: `${c.issuer} · ${c.year}` })) ?? []} />
          <InfoList title="Projects" icon={FolderKanban} items={profile?.projects.map((p) => ({ id: p.id, title: p.name, sub: p.link ?? '', body: p.description })) ?? []} />
        </div>

        <aside className="contents [&>*]:order-2">
          <section className="card p-4">
            <h2 className="text-[15px] font-bold">Hiring stage</h2>
            <ol className="mt-3 space-y-1">
              {PIPELINE.map((s, i) => {
                const current = app.status === s
                const done = !closed ? i < idx : app.timeline.some((t) => t.status === s)
                return (
                  <li key={s}>
                    <button disabled={pending || current || app.status === 'hired'} onClick={() => (s === 'hired' ? setConfirm({ to: 'hired', title: `Mark ${name} as hired?` }) : move(s))}
                      className={cn('flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[14px] transition', current ? 'bg-brand-50 font-bold text-brand' : 'hover:bg-canvas disabled:hover:bg-transparent')}>
                      <span className={cn('grid size-6 place-items-center rounded-full text-[11px] font-bold', current ? 'bg-brand text-white' : done ? 'bg-success-50 text-success' : 'bg-[#eef1f5] text-muted')}>{done && !current ? <Check size={13} /> : i + 1}</span>
                      {STATUS_META[s].stage}
                      {current && <span className="ml-auto text-[11px] font-semibold">Current</span>}
                    </button>
                  </li>
                )
              })}
            </ol>
            {app.status === 'rejected' && <p className="mt-2 rounded-xl bg-danger-50 px-3 py-2 text-[13px] font-medium text-danger">Not selected · {timeAgo(app.updatedAt)}</p>}
            {app.status === 'hired' && <p className="mt-2 flex items-center gap-1.5 rounded-xl bg-success-50 px-3 py-2 text-[13px] font-semibold text-success"><CheckCircle2 size={15} />Hired {timeAgo(app.updatedAt)}</p>}

            {!closed && (
              <div className="mt-4 grid gap-2">
                {idx < PIPELINE.indexOf('shortlisted') && <button className="btn btn-primary" disabled={pending} onClick={() => move('shortlisted', `${name} shortlisted`)}><Star size={17} />Shortlist</button>}
                {!interview && <button className="btn btn-tinted" disabled={pending} onClick={() => setInterviewSheet('new')}><CalendarDays size={17} />Schedule interview</button>}
                {idx >= PIPELINE.indexOf('interview') && app.status !== 'offer' && <button className="btn btn-tinted" disabled={pending} onClick={() => move('offer', `Offer sent to ${name}`)}>Make an offer</button>}
                <button className="btn btn-success" disabled={pending} onClick={() => setConfirm({ to: 'hired', title: `Mark ${name} as hired?` })}><UserCheck size={17} />Mark as hired</button>
                <button className="btn btn-danger" disabled={pending} onClick={() => setConfirm({ to: 'rejected', title: `Reject ${name}?` })}><XCircle size={17} />Reject</button>
              </div>
            )}
            {app.status === 'rejected' && <button className="btn btn-secondary mt-3 w-full" disabled={pending} onClick={() => move('under_review', `${name} moved back to review`)}>Reconsider applicant</button>}
          </section>

          {interview && (
            <section className="card p-4">
              <h2 className="flex items-center gap-2 text-[15px] font-bold"><CalendarDays size={17} className="text-violet" />Interview</h2>
              <p className="mt-2 text-[17px] font-bold">{formatSlot(interview.date, interview.time)}</p>
              <p className="text-[13px] text-muted">{interview.type} · <Badge tone={interview.status === 'completed' ? 'green' : 'purple'}>{interview.status}</Badge></p>
              <p className="mt-2 break-all text-[13px]">{interview.location}</p>
              {interview.notes && <p className="mt-1 text-[12px] text-muted">{interview.notes}</p>}
              {interview.status === 'scheduled' && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={() => setInterviewSheet('edit')}><Pencil size={14} />Edit</button>
                  <button className="btn btn-secondary btn-sm" disabled={pending} onClick={() => run(() => ApplicationService.setInterviewStatus(interview.id, 'completed'), { success: 'Interview marked completed' })}>Done</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setCancelIv(true)}>Cancel</button>
                </div>
              )}
              {interview.status === 'completed' && !closed && <button className="btn btn-tinted btn-sm mt-3 w-full" onClick={() => setInterviewSheet('new')}>Schedule another round</button>}
            </section>
          )}

          <section className="card p-4">
            <h2 className="text-[15px] font-bold">Private notes</h2>
            <p className="text-[12px] text-muted">Only your hiring team can see these.</p>
            <TextArea className="mt-2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Impressions, interview feedback…" />
            <button className="btn btn-secondary btn-sm mt-2 w-full" disabled={pending || notes === app.employerNotes} onClick={() => run(() => ApplicationService.saveNotes(app.id, notes), { success: 'Notes saved' })}>Save notes</button>
          </section>

          <section className="card p-4">
            <h2 className="mb-2 text-[15px] font-bold">Activity</h2>
            <ol className="space-y-2">
              {[...app.timeline].reverse().map((t, i) => <li key={i} className="flex justify-between gap-2 text-[13px]"><span>{STATUS_META[t.status].label}</span><span className="text-muted">{formatDate(t.at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></li>)}
            </ol>
          </section>
        </aside>
      </div>

      <Sheet open={showResume} onClose={() => setShowResume(false)} title={`${name} — Résumé`} size="lg">{profile && <ResumeDocument profile={profile} />}</Sheet>
      {interviewSheet && (
        <InterviewSheet open onClose={() => setInterviewSheet(null)} applicationId={app.id} applicantName={name} existing={interviewSheet === 'edit' ? interview : undefined} />
      )}
      <ConfirmDialog open={cancelIv} onClose={() => setCancelIv(false)} busy={pending} tone="danger" title="Cancel interview?" confirmLabel="Cancel interview"
        message={`${name} will be notified that the interview was cancelled.`}
        onConfirm={async () => { const r = await run(() => ApplicationService.setInterviewStatus(interview!.id, 'cancelled'), { success: 'Interview cancelled' }); if (r.ok) setCancelIv(false) }} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} busy={pending} title={confirm?.title ?? ''} tone={confirm?.to === 'rejected' ? 'danger' : 'primary'}
        confirmLabel={confirm?.to === 'rejected' ? 'Reject' : 'Mark as hired'} onConfirm={() => confirm && move(confirm.to)}
        message={<>
          <p>{confirm?.to === 'rejected' ? 'The applicant will be notified kindly that they were not selected.' : `${name} will be notified and the job’s hire count updated.`}</p>
          <TextArea className="mt-3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note (visible in the application timeline)" />
          {pending && <Spinner className="mt-2 text-brand" />}
        </>} />
    </div>
  )
}

function InfoList({ title, icon: Icon, items }: { title: string; icon: typeof Award; items: { id: string; title: string; sub: string; body?: string }[] }) {
  return (
    <section>
      <SectionHeader title={title} />
      {items.length ? (
        <div className="card divide-y divide-line">
          {items.map((it) => (
            <div key={it.id} className="flex gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand"><Icon size={16} /></span>
              <div><p className="text-[14px] font-semibold">{it.title}</p><p className="text-[12px] text-muted">{it.sub}</p>{it.body && <p className="mt-1 text-[13px] text-[#4a5b75]">{it.body}</p>}</div>
            </div>
          ))}
        </div>
      ) : <p className="text-[13px] text-muted">None listed.</p>}
    </section>
  )
}
