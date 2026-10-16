'use client'

import Link from 'next/link'
import { Download, FileDown, Pencil } from 'lucide-react'
import { useDB } from '@/lib/mock/store'
import { useMe } from '@/hooks/use-app'
import { ProfileService, ResumeService } from '@/lib/services'
import { PageHeader } from '@/components/layout/page-header'
import { ResumeDocument } from '@/components/features/resume-document'
import { toast } from '@/components/ui/toast'

export default function ResumePreview() {
  const db = useDB()
  const me = useMe()
  const profile = ProfileService.get(db, me.id)!
  return (
    <div className="mx-auto max-w-2xl pb-6">
      <PageHeader title="Résumé Preview" back="/resume" actions={<button onClick={() => { ResumeService.downloadDoc(profile); toast.success('Résumé downloaded') }} className="grid size-10 place-items-center rounded-full bg-white text-navy shadow-[var(--shadow-card)]" aria-label="Download Word document"><FileDown size={18} /></button>} />
      <div className="print-area"><ResumeDocument profile={profile} /></div>
      <div className="mt-5 grid grid-cols-[auto_1fr] gap-3">
        <Link href="/resume" className="btn btn-secondary"><Pencil size={17} />Edit</Link>
        <button className="btn btn-primary" onClick={ResumeService.printPDF}><Download size={18} />Download PDF</button>
      </div>
      <p className="mt-3 text-center text-[12px] text-muted">Tip: in the print dialog, choose “Save as PDF”.</p>
    </div>
  )
}
