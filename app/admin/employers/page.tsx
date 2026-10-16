'use client'

import { useState } from 'react'
import { Building2, CheckCircle2, Globe, MapPin, ShieldCheck, XCircle } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useAction } from '@/hooks/use-app'
import { AdminService } from '@/lib/services'
import type { Employer, VerificationStatus } from '@/lib/types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge, CompanyLogo, EmptyState } from '@/components/ui/kit'
import { ConfirmDialog } from '@/components/ui/sheet'
import { PageHeader } from '@/components/layout/page-header'

const TONE = { verified: 'green', pending: 'amber', rejected: 'red' } as const

export default function AdminEmployers() {
  const db = useDB()
  const [run, pending] = useAction()
  const [tab, setTab] = useState<'all' | VerificationStatus>('pending')
  const [confirm, setConfirm] = useState<{ e: Employer; to: VerificationStatus } | null>(null)
  const list = db.employers.filter((e) => tab === 'all' || e.verification === tab).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const decide = async () => {
    if (!confirm) return
    const r = await run(() => AdminService.setVerification(confirm.e.id, confirm.to), { success: confirm.to === 'verified' ? `${confirm.e.name} verified` : `${confirm.e.name} verification rejected` })
    if (r.ok) setConfirm(null)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Employers" bell subtitle={`${db.employers.filter((e) => e.verification === 'verified').length} verified of ${db.employers.length}`} />
      <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5">
        {(['pending', 'verified', 'rejected', 'all'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={cn('chip capitalize', tab === t && 'chip-active')}>{t} ({t === 'all' ? db.employers.length : db.employers.filter((e) => e.verification === t).length})</button>)}
      </div>
      <div className="mt-4 grid gap-3">
        {list.length === 0 && <EmptyState icon={ShieldCheck} title={tab === 'pending' ? 'No employers waiting for verification' : 'No employers here'} message="New employer registrations will appear in Pending." />}
        {list.map((e) => {
          const jobs = db.jobs.filter((j) => j.employerId === e.id)
          return (
            <div key={e.id} className="card p-4">
              <div className="flex items-start gap-3">
                <CompanyLogo initials={e.initials} color={e.color} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="text-[16px] font-bold">{e.name}</h3><Badge tone={TONE[e.verification]}>{e.verification}</Badge></div>
                  <p className="text-[12px] text-muted">{e.industry} · {e.size}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
                    <span className="flex items-center gap-1"><MapPin size={12} />{e.location}</span>
                    {e.website && <span className="flex items-center gap-1"><Globe size={12} />{e.website}</span>}
                    <span className="flex items-center gap-1"><Building2 size={12} />{jobs.length} jobs · joined {formatDate(e.createdAt)}</span>
                  </div>
                  {e.about && <p className="mt-2 line-clamp-2 text-[13px] text-[#4a5b75]">{e.about}</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                {e.verification !== 'verified' && <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => setConfirm({ e, to: 'verified' })}><CheckCircle2 size={15} />Verify employer</button>}
                {e.verification === 'pending' && <button className="btn btn-danger btn-sm" disabled={pending} onClick={() => setConfirm({ e, to: 'rejected' })}><XCircle size={15} />Reject</button>}
                {e.verification === 'verified' && <button className="btn btn-secondary btn-sm" disabled={pending} onClick={() => setConfirm({ e, to: 'pending' })}>Revoke verification</button>}
              </div>
            </div>
          )
        })}
      </div>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} busy={pending} onConfirm={decide} tone={confirm?.to === 'verified' ? 'primary' : 'danger'}
        title={confirm?.to === 'verified' ? `Verify ${confirm?.e.name}?` : confirm?.to === 'rejected' ? `Reject ${confirm?.e.name}?` : `Revoke verification for ${confirm?.e.name}?`}
        confirmLabel={confirm?.to === 'verified' ? 'Verify' : confirm?.to === 'rejected' ? 'Reject' : 'Revoke'}
        message={confirm?.to === 'verified' ? 'Their future job posts will go live without review, and they’ll get a verified badge.' : 'Their job posts will require admin approval. The employer will be notified.'} />
    </div>
  )
}
