'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PORTAL_ID, SCROLL_ID } from '@/components/layout/phone-frame'

/** iOS-style bottom sheet on phones, centered dialog on larger screens. */
export function Sheet({ open, onClose, title, description, children, footer, size = 'md' }: {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const scroller = document.getElementById(SCROLL_ID)
    const prev = scroller?.style.overflowY ?? ''
    if (scroller) scroller.style.overflowY = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); if (scroller) scroller.style.overflowY = prev }
  }, [open, onClose])
  if (!open || !mounted) return null
  const target = document.getElementById(PORTAL_ID) ?? document.body
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="animate-fade absolute inset-0 bg-navy-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn(
        'animate-sheet relative flex max-h-[92%] w-full flex-col rounded-t-[26px] bg-canvas shadow-[var(--shadow-float)] ',
        size === 'sm' && '', size === 'md' && '', size === 'lg' && '',
      )}>
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[#d5dbe5]" />
        {(title || description) && (
          <div className="flex items-start gap-3 px-5 pb-2 pt-4">
            <div className="flex-1">
              {title && <h2 className="font-serif text-[22px] font-medium leading-tight tracking-tight">{title}</h2>}
              {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
            </div>
            <button onClick={onClose} aria-label="Close" className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e5e9f0] text-muted hover:text-ink"><X size={17} /></button>
          </div>
        )}
        <div className="overflow-y-auto px-5 pb-5 pt-2">{children}</div>
        {footer && <div className="border-t border-line bg-white/70 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    target,
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', tone = 'primary', busy }: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message?: ReactNode
  confirmLabel?: string
  tone?: 'primary' | 'danger'
  busy?: boolean
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title} size="sm">
      {message && <div className="text-[14px] leading-relaxed text-muted">{message}</div>}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button className={cn('btn', tone === 'danger' ? 'btn-danger' : 'btn-primary')} onClick={onConfirm} disabled={busy}>
          {busy ? <Spinner /> : confirmLabel}
        </button>
      </div>
    </Sheet>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn('inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent', className)} aria-label="Loading" />
}
