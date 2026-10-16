'use client'

import { useParams } from 'next/navigation'
import { Download, SearchX } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useMe } from '@/hooks/use-app'
import { ProfileService, ResumeService } from '@/lib/services'
import { formatDate } from '@/lib/format'
import { EmptyState } from '@/components/ui/kit'
import { PageHeader } from '@/components/layout/page-header'
import { LogoMark } from '@/components/brand'

export default function CertificatePage() {
  const { id } = useParams<{ id: string }>()
  const db = useDB()
  const me = useMe()
  const cert = db.certificates.find((c) => c.id === id && c.userId === me.id)
  const course = cert && db.courses.find((c) => c.id === cert.courseId)
  const profile = ProfileService.get(db, me.id)
  if (!cert || !course || !profile) return <div><PageHeader title="Certificate" back="/learn/progress" /><EmptyState icon={SearchX} title="Certificate not found" /></div>

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Certificate" back="/learn/progress" actions={<button className="btn btn-primary btn-sm" onClick={ResumeService.printPDF}><Download size={16} />Download PDF</button>} />
      <div className="print-area relative overflow-hidden rounded-[22px] bg-white p-8 text-center shadow-[var(--shadow-card)] ring-8 ring-inset ring-[#f5efe0]">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-navy via-brand to-gold" />
        <div className="flex justify-center"><LogoMark size={56} /></div>
        <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.3em] text-brand">Certificate of Completion</p>
        <p className="mt-6 text-[14px] text-muted">This certifies that</p>
        <h1 className="mt-2 font-serif text-[34px] font-semibold text-navy">{ProfileService.fullName(profile)}</h1>
        <p className="mt-3 text-[14px] text-muted">has successfully completed the course</p>
        <h2 className="mt-2 text-[22px] font-bold">{course.title}</h2>
        <p className="mt-2 text-[13px] text-muted">{course.lessons.length} lessons · {course.hours} hours · Skills: {course.skills.join(', ')}</p>
        <div className="mx-auto mt-10 grid max-w-md grid-cols-2 gap-8 text-[12px]">
          <div><div className="border-t border-navy/30 pt-2 font-semibold">{formatDate(cert.issuedAt)}</div><div className="text-muted">Date issued</div></div>
          <div><div className="border-t border-navy/30 pt-2 font-semibold">{course.provider}</div><div className="text-muted">Issued by</div></div>
        </div>
        <p className="mt-8 text-[11px] text-subtle">Credential ID {cert.code} · Verify at diskartech.ph/verify</p>
      </div>
    </div>
  )
}
