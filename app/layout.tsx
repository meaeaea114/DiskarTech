import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { ClientGate } from '@/components/layout/guards'
import { Toaster } from '@/components/ui/toast'
import { PhoneFrame } from '@/components/layout/phone-frame'
import './globals.css'

export const metadata: Metadata = {
  title: 'DiskarTech — Skills Today. Opportunities Tomorrow.',
  description: 'A career companion for Filipino youth to discover jobs, build skills, and grow with confidence.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F8F7F3',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PhoneFrame overlay={<Toaster />}>
          <ClientGate>{children}</ClientGate>
        </PhoneFrame>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
