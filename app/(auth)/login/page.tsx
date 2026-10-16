'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Building2, Eye, EyeOff, GraduationCap, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/brand'
import { Field, TextInput } from '@/components/ui/kit'
import { Spinner } from '@/components/ui/sheet'
import { useCurrentUser, useQueryParam } from '@/hooks/use-app'
import { AuthService } from '@/lib/services'
import { DEMO_ACCOUNTS, DEMO_MODE, ROLE_HOME, TAGLINE } from '@/lib/constants'
import type { Role, User } from '@/lib/types'

const ROLE_ICONS = { youth: GraduationCap, employer: Building2, admin: ShieldCheck }
const ROLE_PREFIX: Record<Role, string[]> = { youth: ['/home', '/jobs', '/applications', '/learn', '/assessment', '/career', '/profile', '/resume'], employer: ['/employer'], admin: ['/admin'] }

export default function Login() {
  const router = useRouter()
  const me = useCurrentUser()
  const next = useQueryParam('next')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [pending, setPending] = useState<string | null>(null)

  const destination = (u: User) => {
    const shared = next && ['/notifications', '/settings'].includes(next)
    const allowed = next && (shared || ROLE_PREFIX[u.role].some((p) => next.startsWith(p)))
    return allowed ? next! : ROLE_HOME[u.role]
  }

  useEffect(() => {
    if (me && !pending) router.replace(ROLE_HOME[me.role])
  }, [me, pending, router])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!email.trim()) errs.email = 'Email is required'
    else if (!AuthService.validateEmail(email)) errs.email = 'Enter a valid email address'
    if (!password) errs.password = 'Password is required'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setPending('form')
    try {
      const user = await AuthService.login(email, password)
      router.replace(destination(user))
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong. Please try again.' })
      setPending(null)
    }
  }

  const demo = async (acct: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(acct.email)
    setPassword(acct.password)
    setErrors({})
    setPending(acct.role)
    try {
      const user = await AuthService.loginAsDemo(acct.email)
      router.replace(destination(user))
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong.' })
      setPending(null)
    }
  }

  return (
    <div className="min-h-full">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-navy to-navy-900 p-12 text-white">
        <Logo className="[&>span:last-child]:text-white" />
        <div>
          <h2 className="max-w-md text-[40px] font-bold leading-tight tracking-tight">Build skills. Find opportunity.</h2>
          <p className="mt-4 max-w-md text-[16px] text-white/75">DiskarTech connects Filipino youth with entry-level jobs, free skills training, and career guidance.</p>
        </div>
        <p className="text-[13px] text-white/60">{TAGLINE}</p>
        <div className="absolute -bottom-24 -right-10 h-64 w-[140%] -rotate-6 rounded-[50%] bg-gold/90" />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-10">
        <Link href="/" aria-label="DiskarTech home"><Logo /></Link>
        <h1 className="mt-8 text-[30px] font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-[15px] text-muted">Log in to continue your journey.</p>

        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
          {errors.form && (
            <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-danger-50 px-4 py-3 text-[14px] text-danger">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />{errors.form}
            </div>
          )}
          <Field label="Email" error={errors.email}>
            <TextInput type="email" autoComplete="email" placeholder="you@example.com" value={email} invalid={!!errors.email}
              onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined, form: undefined })) }} />
          </Field>
          <Field label="Password" error={errors.password}>
            <div className="relative">
              <TextInput type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} invalid={!!errors.password} className="pr-12"
                onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: undefined, form: undefined })) }} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </Field>
          <button type="submit" className="btn btn-primary w-full" disabled={!!pending}>
            {pending === 'form' ? <><Spinner /> Signing in…</> : 'Log In'}
          </button>
        </form>

        <p className="mt-5 text-center text-[14px] text-muted">New to DiskarTech? <Link href="/register" className="font-semibold text-brand">Create an account</Link></p>

        {DEMO_MODE && (
          <section className="mt-8" aria-label="Demo accounts">
            <div className="mb-3 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-wider text-subtle">
              <span className="h-px flex-1 bg-line" />Prototype demo accounts<span className="h-px flex-1 bg-line" />
            </div>
            <div className="grid gap-2.5">
              {DEMO_ACCOUNTS.map((a) => {
                const Icon = ROLE_ICONS[a.role]
                return (
                  <button key={a.role} onClick={() => demo(a)} disabled={!!pending} className="card tap flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left hover:ring-1 hover:ring-brand/30">
                    <span className="grid size-10 place-items-center rounded-full bg-brand-50 text-brand"><Icon size={19} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">{a.label} account</span>
                      <span className="block truncate text-[12px] text-muted">{a.email} · {a.description}</span>
                    </span>
                    {pending === a.role ? <Spinner className="text-brand" /> : <span className="text-[13px] font-semibold text-brand">Use</span>}
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-center text-[12px] text-subtle">All demo passwords: <code className="font-semibold">demo1234</code></p>
          </section>
        )}
      </div>
    </div>
  )
}
