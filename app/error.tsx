'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-full place-items-center px-6 text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-danger-50 text-danger"><AlertTriangle size={30} /></span>
        <h1 className="mt-5 text-[22px] font-bold">Something went wrong</h1>
        <p className="mt-2 text-[15px] text-muted">Please try again. If the problem continues, reset the demo data from Settings.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="btn btn-primary" onClick={reset}>Try again</button>
          <Link href="/" className="btn btn-secondary">Go home</Link>
        </div>
      </div>
    </div>
  )
}
