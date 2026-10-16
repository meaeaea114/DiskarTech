import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="grid min-h-full place-items-center px-6 text-center">
      <div>
        <p className="text-[64px] font-bold text-brand">404</p>
        <h1 className="text-[22px] font-bold">Page not found</h1>
        <p className="mt-2 text-[15px] text-muted">The page you’re looking for doesn’t exist or has moved.</p>
        <Link href="/" className="btn btn-primary mt-6">Back to DiskarTech</Link>
      </div>
    </div>
  )
}
