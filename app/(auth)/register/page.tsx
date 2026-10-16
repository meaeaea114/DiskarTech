'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { Logo } from '@/components/brand'
import { Field, Segmented, Select, TextInput } from '@/components/ui/kit'
import { Spinner } from '@/components/ui/sheet'
import { AuthService } from '@/lib/services'
import { useQueryParam } from '@/hooks/use-app'
import { LOCATIONS, ROLE_HOME } from '@/lib/constants'

type Form = { firstName: string; lastName: string; email: string; password: string; confirm: string; companyName: string; location: string; terms: boolean }

export default function Register() {
  const router = useRouter()
  const [role, setRole] = useState<'youth' | 'employer'>(useQueryParam('role') === 'employer' ? 'employer' : 'youth')
  const [f, setF] = useState<Form>({ firstName: '', lastName: '', email: '', password: '', confirm: '', companyName: '', location: '', terms: false })
  const [errors, setErrors] = useState<Partial<Record<keyof Form | 'form', string>>>({})
  const [pending, setPending] = useState(false)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined, form: undefined })) }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!f.firstName.trim()) errs.firstName = 'Required'
    if (!f.lastName.trim()) errs.lastName = 'Required'
    if (!AuthService.validateEmail(f.email)) errs.email = 'Enter a valid email address'
    if (f.password.length < 8) errs.password = 'Use at least 8 characters'
    if (f.confirm !== f.password) errs.confirm = 'Passwords do not match'
    if (role === 'employer' && !f.companyName.trim()) errs.companyName = 'Company name is required'
    if (!f.terms) errs.terms = 'Please accept the terms to continue'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setPending(true)
    try {
      const user = await AuthService.register({ role, ...f })
      router.replace(user.role === 'youth' ? '/profile/interests?onboarding=1' : ROLE_HOME[user.role])
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong. Please try again.' })
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-8">
      <Link href="/" aria-label="DiskarTech home"><Logo /></Link>
      <h1 className="mt-8 text-[30px] font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-[15px] text-muted">Free for job seekers and employers.</p>

      <Segmented className="mt-6" value={role} onChange={setRole} options={[{ value: 'youth', label: 'I’m looking for work' }, { value: 'employer', label: 'I’m hiring' }]} />

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {errors.form && <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-danger-50 px-4 py-3 text-[14px] text-danger"><AlertCircle size={18} className="mt-0.5 shrink-0" />{errors.form}</div>}
        {role === 'employer' && (
          <Field label="Company name" error={errors.companyName} hint="New companies are reviewed by our team before jobs go live automatically.">
            <TextInput value={f.companyName} invalid={!!errors.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="e.g. Kapitbahay Tech Inc." />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={errors.firstName}><TextInput value={f.firstName} invalid={!!errors.firstName} onChange={(e) => set('firstName', e.target.value)} autoComplete="given-name" /></Field>
          <Field label="Last name" error={errors.lastName}><TextInput value={f.lastName} invalid={!!errors.lastName} onChange={(e) => set('lastName', e.target.value)} autoComplete="family-name" /></Field>
        </div>
        <Field label="Email" error={errors.email}><TextInput type="email" value={f.email} invalid={!!errors.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" placeholder="you@example.com" /></Field>
        <Field label="Location">
          <Select value={f.location} onChange={(e) => set('location', e.target.value)}>
            <option value="">Select your city</option>
            {LOCATIONS.map((l) => <option key={l.city} value={`${l.city}, ${l.region}`}>{l.city}, {l.region}</option>)}
          </Select>
        </Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters"><TextInput type="password" value={f.password} invalid={!!errors.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" /></Field>
        <Field label="Confirm password" error={errors.confirm}><TextInput type="password" value={f.confirm} invalid={!!errors.confirm} onChange={(e) => set('confirm', e.target.value)} autoComplete="new-password" /></Field>
        <label className="flex items-start gap-3 text-[13px] text-muted">
          <input type="checkbox" className="mt-0.5 size-5 accent-[var(--color-brand)]" checked={f.terms} onChange={(e) => set('terms', e.target.checked)} />
          <span>I agree to the DiskarTech Terms of Service and Privacy Policy, in line with the Data Privacy Act of 2012.{errors.terms && <span className="mt-1 block font-medium text-danger">{errors.terms}</span>}</span>
        </label>
        <button type="submit" className="btn btn-primary w-full" disabled={pending}>{pending ? <><Spinner /> Creating account…</> : 'Create account'}</button>
      </form>
      <p className="mt-5 text-center text-[14px] text-muted">Already have an account? <Link href="/login" className="font-semibold text-brand">Log In</Link></p>
    </div>
  )
}
