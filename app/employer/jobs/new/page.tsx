'use client'

import { PageHeader } from '@/components/layout/page-header'
import { JobForm } from '@/components/features/job-form'

export default function NewJob() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Post a Job" back="/employer/jobs" subtitle="Save a draft anytime. Publishing makes it visible to job seekers." />
      <JobForm />
    </div>
  )
}
