'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarDays, MapPin, Pencil, Phone, Video } from 'lucide-react'
import { useAction } from '@/hooks/use-app'
import { ApplicationService, formatSlot } from '@/lib/services'
import type { Interview } from '@/lib/types'
import { Avatar, Badge, EmptyState, Segmented } from '@/components/ui/kit'
import { ConfirmDialog } from '@/components/ui/sheet'
import { PageHeader } from '@/components/layout/page-header'
import { InterviewSheet, applicantInfo, useEmployerData } from '@/components/features/employer'

export default function Interviews() {
  const { db, interviews } = useEmployerData()
  const [run, pending] = useAction()
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [editing, setEditing] = useState<Interview | null>(null)
  const [cancelling, setCancelling] = useState<Interview | null>(null)
  const now = Date.now()
  const isUpcoming = (i: Interview) => i.status === 'scheduled' && new Date(`${i.date}T${i.time}`).getTime() > now
  const list = interviews.filter((i) => (tab === 'upcoming' ? isUpcoming(i) : !isUpcoming(i)))
    .sort((a, b) => (tab === 'upcoming' ? 1 : -1) * `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Interviews" back="/employer/applicants" />
      <Segmented value={tab} onChange={setTab} options={[{ value: 'upcoming', label: 'Upcoming', count: interviews.filter(isUpcoming).length }, { value: 'past', label: 'Past & cancelled' }]} className="max-w-sm" />
      <div className="mt-5 grid gap-3">
        {list.length === 0 && <EmptyState icon={CalendarDays} title={tab === 'upcoming' ? 'No upcoming interviews' : 'No past interviews'} message="Schedule interviews from an applicant’s profile." action={<Link href="/employer/applicants" className="btn btn-primary btn-sm">View applicants</Link>} />}
        {list.map((iv) => {
          const app = db.applications.find((a) => a.id === iv.applicationId)!
          const { name, job, profile } = applicantInfo(db, app)
          const Icon = iv.type === 'Video call' ? Video : iv.type === 'Phone call' ? Phone : MapPin
          return (
            <div key={iv.id} className="card p-4">
              <div className="flex items-center gap-3">
                <Avatar name={name} color={profile?.avatarColor} size={42} />
                <Link href={`/employer/applicants/${app.id}`} className="min-w-0 flex-1"><p className="truncate text-[15px] font-bold hover:text-brand">{name}</p><p className="truncate text-[12px] text-muted">{job.title}</p></Link>
                <Badge tone={iv.status === 'scheduled' ? 'purple' : iv.status === 'completed' ? 'green' : 'red'}>{iv.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-canvas px-3 py-2.5 text-[13px]">
                <span className="flex items-center gap-1.5 font-semibold"><CalendarDays size={14} className="text-violet" />{formatSlot(iv.date, iv.time)}</span>
                <span className="flex items-center gap-1.5 text-muted"><Icon size={14} />{iv.type}</span>
                <span className="w-full truncate text-[12px] text-muted">{iv.location}</span>
              </div>
              {isUpcoming(iv) && (
                <div className="mt-3 flex gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(iv)}><Pencil size={14} />Reschedule</button>
                  <button className="btn btn-secondary btn-sm" disabled={pending} onClick={() => run(() => ApplicationService.setInterviewStatus(iv.id, 'completed'), { success: 'Marked as completed' })}>Mark done</button>
                  <button className="btn btn-danger btn-sm ml-auto" onClick={() => setCancelling(iv)}>Cancel</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {editing && <InterviewSheet open onClose={() => setEditing(null)} existing={editing} applicationId={editing.applicationId} applicantName={applicantInfo(db, db.applications.find((a) => a.id === editing.applicationId)!).name} />}
      <ConfirmDialog open={!!cancelling} onClose={() => setCancelling(null)} busy={pending} tone="danger" title="Cancel interview?" confirmLabel="Cancel interview" message="The applicant will be notified."
        onConfirm={async () => { const r = await run(() => ApplicationService.setInterviewStatus(cancelling!.id, 'cancelled'), { success: 'Interview cancelled' }); if (r.ok) setCancelling(null) }} />
    </div>
  )
}
