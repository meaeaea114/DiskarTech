'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart3, CalendarDays, Check, Clock, Settings, ShieldCheck, XCircle } from 'lucide-react'
import { useAction } from '@/hooks/use-app'
import { EmployerService } from '@/lib/services'
import { formatDate } from '@/lib/format'
import { CompanyLogo, Field, Select, TextArea, TextInput } from '@/components/ui/kit'
import { Spinner } from '@/components/ui/sheet'
import { PageHeader } from '@/components/layout/page-header'
import { useEmployerData } from '@/components/features/employer'

const SIZES = ['1–10 employees', '11–50 employees', '51–200 employees', '201–500 employees', '500+ employees']

export default function Company() {
  const { employer } = useEmployerData()
  const [run, pending] = useAction()
  const base = { name: employer.name, industry: employer.industry, location: employer.location, size: employer.size, website: employer.website, about: employer.about }
  const [f, setF] = useState(base)
  const [error, setError] = useState('')
  const dirty = JSON.stringify(f) !== JSON.stringify(base)

  const V = {
    verified: { icon: ShieldCheck, cls: 'bg-success-50 text-success', title: 'Verified employer', body: 'Your job posts go live immediately and show a verified badge.' },
    pending: { icon: Clock, cls: 'bg-warn-50 text-[#8a6100]', title: 'Verification pending', body: 'Our team is reviewing your company. Until then, job posts need admin approval.' },
    rejected: { icon: XCircle, cls: 'bg-danger-50 text-danger', title: 'Verification not approved', body: 'Please complete your company details and website, then contact support@diskartech.ph.' },
  }[employer.verification]

  return (
    <div className="mx-auto max-w-2xl pb-6">
      <PageHeader title="Company Profile" bell actions={<Link href="/settings" className="grid size-10 place-items-center rounded-full bg-white text-navy shadow-[var(--shadow-card)]" aria-label="Settings"><Settings size={18} /></Link>} />
      <div className="grid grid-cols-2 gap-3">
        <Link href="/employer/analytics" className="card tap flex items-center gap-2 p-3.5 text-[14px] font-semibold"><BarChart3 size={18} className="text-brand" />Analytics</Link>
        <Link href="/employer/interviews" className="card tap flex items-center gap-2 p-3.5 text-[14px] font-semibold"><CalendarDays size={18} className="text-brand" />Interviews</Link>
      </div>

      <div className="card mt-4 flex items-center gap-4 p-5">
        <CompanyLogo initials={employer.initials} color={employer.color} size={60} />
        <div><h2 className="text-[20px] font-bold">{employer.name}</h2><p className="text-[13px] text-muted">Member since {formatDate(employer.createdAt)}</p></div>
      </div>
      <div className={`mt-3 flex gap-3 rounded-2xl p-4 ${V.cls}`}><V.icon size={20} className="shrink-0" /><div><p className="text-[14px] font-bold">{V.title}</p><p className="text-[13px] opacity-90">{V.body}</p></div></div>

      <div className="card mt-5 space-y-4 p-5">
        <Field label="Company name" error={error}><TextInput value={f.name} invalid={!!error} onChange={(e) => { setF({ ...f, name: e.target.value }); setError('') }} /></Field>
        <div className="grid gap-4">
          <Field label="Industry"><TextInput value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} /></Field>
          <Field label="Company size"><Select value={f.size} onChange={(e) => setF({ ...f, size: e.target.value })}>{SIZES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
        </div>
        <Field label="Office address"><TextInput value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
        <Field label="Website"><TextInput value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="yourcompany.ph" /></Field>
        <Field label="About the company" hint="Shown on every job post"><TextArea rows={4} value={f.about} onChange={(e) => setF({ ...f, about: e.target.value })} /></Field>
        <button className="btn btn-primary w-full" disabled={!dirty || pending}
          onClick={() => { if (!f.name.trim()) return setError('Company name is required'); run(() => EmployerService.updateCompany(f), { success: 'Company profile updated' }) }}>
          {pending ? <><Spinner />Saving…</> : dirty ? 'Save changes' : <><Check size={18} />Saved</>}
        </button>
      </div>
    </div>
  )
}
