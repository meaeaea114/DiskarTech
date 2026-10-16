'use client'

import { useParams } from 'next/navigation'
import { SearchX } from 'lucide-react'
import { EmptyState, JobStatusBadge } from '@/components/ui/kit'
import { PageHeader } from '@/components/layout/page-header'
import { JobForm } from '@/components/features/job-form'
import { useEmployerData } from '@/components/features/employer'

export default function EditJob() {
  const { id } = useParams<{ id: string }>()
  const { jobs } = useEmployerData()
  const job = jobs.find((j) => j.id === id)
  if (!job) return <div><PageHeader title="Edit job" back="/employer/jobs" /><EmptyState icon={SearchX} title="Job not found" /></div>
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit Job" back={`/employer/jobs/${job.id}`} subtitle={<span className="flex items-center gap-2">Status: <JobStatusBadge status={job.status} /></span>} />
      <JobForm key={job.id} job={job} />
    </div>
  )
}
