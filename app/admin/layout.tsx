import { RoleGuard } from '@/components/layout/guards'
import { Suspense } from 'react'
import { AppShell } from '@/components/layout/app-shell'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={['admin']}><Suspense><AppShell>{children}</AppShell></Suspense></RoleGuard>
}
