'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

export const SCROLL_ID = 'app-scroll'
export const PORTAL_ID = 'app-portal'

/**
 * Renders the app as a mobile screen: full-screen on phones, a centered
 * phone-sized shell on larger screens. All scrolling happens inside the frame,
 * and fixed elements (tab bar, sheets, toasts) are positioned relative to it.
 */
export function PhoneFrame({ children, overlay }: { children: ReactNode; overlay?: ReactNode }) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)
  // A new screen always starts at the top, like a native navigation push.
  useEffect(() => { ref.current?.scrollTo({ top: 0 }) }, [pathname])
  return (
    <div className="app-shell">
      <div className="phone-frame">
        <div id={SCROLL_ID} ref={ref} className="app-scroll">{children}</div>
        {overlay}
        <div id={PORTAL_ID} />
      </div>
    </div>
  )
}
