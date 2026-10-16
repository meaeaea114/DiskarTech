'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, FlaskConical, GraduationCap, LogOut, RotateCcw, ShieldCheck } from 'lucide-react'
import { store, useDB, usePrefs } from '@/lib/mock/store'
import { useAction, useMe } from '@/hooks/use-app'
import { AuthService, SettingsService } from '@/lib/services'
import { DEFAULT_SETTINGS } from '@/lib/mock/seed'
import { DEMO_ACCOUNTS, DEMO_MODE, ROLE_HOME } from '@/lib/constants'
import type { UserSettings } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Field, TextInput, Toggle } from '@/components/ui/kit'
import { ConfirmDialog, Spinner } from '@/components/ui/sheet'
import { PageHeader } from '@/components/layout/page-header'
import { toast } from '@/components/ui/toast'

const ROLE_ICONS = { youth: GraduationCap, employer: Building2, admin: ShieldCheck }

export default function SettingsPage() {
  const db = useDB()
  const me = useMe()
  const prefs = usePrefs()
  const router = useRouter()
  const [run, pending] = useAction()
  const settings = db.settings[me.id] ?? DEFAULT_SETTINGS
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [confirm, setConfirm] = useState<'logout' | 'reset' | null>(null)
  const [switching, setSwitching] = useState<string | null>(null)

  const set = (k: keyof UserSettings) => (v: boolean) => run(() => SettingsService.update({ [k]: v }), { success: 'Preferences saved' })

  const changePw = async () => {
    setPwError('')
    if (pw.next !== pw.confirm) return setPwError('New passwords do not match')
    const r = await run(() => AuthService.changePassword(pw.current, pw.next), { success: 'Password updated' })
    if (r.ok) setPw({ current: '', next: '', confirm: '' })
  }

  const switchTo = async (email: string) => {
    setSwitching(email)
    try {
      const u = await AuthService.loginAsDemo(email)
      toast.success(`Switched to ${u.name}`)
      router.replace(ROLE_HOME[u.role])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not switch accounts')
      setSwitching(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl pb-6">
      <PageHeader title="Settings" back />

      <Group title="Account">
        <Row label="Name" value={me.name} />
        <Row label="Email" value={me.email} />
        <Row label="Account type" value={me.role === 'youth' ? 'Job seeker' : me.role === 'employer' ? 'Employer' : 'Administrator'} />
      </Group>

      <Group title="Notifications">
        {me.role === 'youth' && <Toggle checked={settings.jobAlerts} onChange={set('jobAlerts')} label="New job matches" description="Get notified when a job fits your skills" />}
        <Toggle checked={settings.applicationUpdates} onChange={set('applicationUpdates')} label="Application updates" description={me.role === 'youth' ? 'Status changes and interview invitations' : 'Applicant activity on your jobs'} />
        {me.role === 'youth' && <Toggle checked={settings.learningReminders} onChange={set('learningReminders')} label="Learning reminders" description="New courses and certificate updates" />}
        <Toggle checked={settings.emailDigest} onChange={set('emailDigest')} label="Weekly email digest" description="A summary of your activity every Monday" />
      </Group>

      {me.role === 'youth' && (
        <Group title="Privacy">
          <Toggle checked={settings.profileVisible} onChange={set('profileVisible')} label="Profile visible to employers" description="Employers can view your profile when you apply" />
        </Group>
      )}

      <Group title="Change password">
        <div className="space-y-3 py-3">
          <Field label="Current password"><TextInput type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" /></Field>
          <Field label="New password" hint="At least 8 characters"><TextInput type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" /></Field>
          <Field label="Confirm new password" error={pwError}><TextInput type="password" value={pw.confirm} invalid={!!pwError} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" /></Field>
          <button className="btn btn-secondary w-full" disabled={pending || !pw.current || !pw.next} onClick={changePw}>{pending ? <Spinner /> : 'Update password'}</button>
        </div>
      </Group>

      {DEMO_MODE && (
        <Group title="Prototype demo tools" icon={<FlaskConical size={15} />}>
          <p className="pb-1 pt-3 text-[12px] text-muted">These controls exist only in the prototype’s demo mode (disable with NEXT_PUBLIC_DEMO_MODE=false).</p>
          <div className="grid gap-2 py-3">
            {DEMO_ACCOUNTS.map((a) => {
              const Icon = ROLE_ICONS[a.role]
              const current = a.email === me.email
              return (
                <button key={a.role} disabled={current || !!switching} onClick={() => switchTo(a.email)}
                  className={cn('flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-semibold', current ? 'border-brand bg-brand-50 text-brand' : 'border-line bg-white hover:border-brand')}>
                  {switching === a.email ? <Spinner /> : <Icon size={16} />}{a.label}{current && ' (you)'}
                </button>
              )
            })}
          </div>
          <Toggle checked={prefs.simulateErrors} onChange={(v) => { store.setPrefs({ simulateErrors: v }); toast.info(v ? 'Network errors will be simulated' : 'Network error simulation off') }} label="Simulate network errors" description="Every save fails, so you can see error states" />
          <button className="flex w-full items-center gap-2 py-3.5 text-[15px] font-medium text-danger" onClick={() => setConfirm('reset')}><RotateCcw size={17} />Reset all demo data</button>
        </Group>
      )}

      <button className="btn btn-danger mt-6 w-full" onClick={() => setConfirm('logout')}><LogOut size={18} />Log out</button>

      <ConfirmDialog open={confirm === 'logout'} onClose={() => setConfirm(null)} title="Log out?" message="You’ll need to sign in again to continue." confirmLabel="Log out" tone="danger"
        onConfirm={() => { AuthService.logout(); router.replace('/login') }} />
      <ConfirmDialog open={confirm === 'reset'} onClose={() => setConfirm(null)} title="Reset demo data?" tone="danger" confirmLabel="Reset"
        message="All jobs, applications, profiles, and progress will return to the original sample data. Accounts you registered will be removed."
        onConfirm={() => { store.reset(); setConfirm(null); toast.success('Demo data reset'); if (!store.getDB().users.some((u) => u.id === me.id)) { AuthService.logout(); router.replace('/login') } }} />
    </div>
  )
}

function Group({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-6 first-of-type:mt-0">
      <h2 className="mb-2 flex items-center gap-1.5 px-1 text-[12px] font-semibold uppercase tracking-wider text-subtle">{icon}{title}</h2>
      <div className="card divide-y divide-line px-4">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 py-3.5"><span className="text-[15px]">{label}</span><span className="truncate text-[14px] text-muted">{value}</span></div>
}
