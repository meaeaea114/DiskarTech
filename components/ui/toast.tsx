'use client'

import { useSyncExternalStore } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem { id: number; kind: ToastKind; message: string }

let toasts: ToastItem[] = []
let seq = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function push(kind: ToastKind, message: string) {
  const id = ++seq
  toasts = [...toasts.slice(-2), { id, kind, message }]
  emit()
  setTimeout(() => dismiss(id), kind === 'error' ? 4500 : 3000)
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export const toast = {
  success: (m: string) => push('success', m),
  error: (m: string) => push('error', m),
  info: (m: string) => push('info', m),
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
const snapshot = () => toasts

export function Toaster() {
  const items = useSyncExternalStore(subscribe, snapshot, snapshot)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {items.map((t) => {
        const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertCircle : Info
        return (
          <div key={t.id} role="status" className="animate-toast pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-navy px-4 py-3 text-[14px] text-white shadow-[var(--shadow-float)]">
            <Icon size={19} className={cn('shrink-0', t.kind === 'success' && 'text-[#5fd68f]', t.kind === 'error' && 'text-[#ff8a8a]', t.kind === 'info' && 'text-[#8cc4ff]')} />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-white/60 hover:text-white"><X size={16} /></button>
          </div>
        )
      })}
    </div>
  )
}
