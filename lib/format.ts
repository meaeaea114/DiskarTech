export const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`

export const pesoK = (n: number) => (n >= 1000 ? `₱${Math.round(n / 100) / 10}k` : peso(n))

export const salaryRange = (min: number, max: number) => `${peso(min)} – ${peso(max)}`

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase()

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d ago`
  return formatDate(iso)
}

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('en-PH', opts)

export const shortDate = (iso: string) => formatDate(iso, { month: 'short', day: 'numeric' })

export function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

export function deadlineLabel(iso: string) {
  const d = daysUntil(iso)
  if (d < 0) return 'Closed'
  if (d === 0) return 'Closes today'
  if (d === 1) return 'Closes tomorrow'
  return d <= 7 ? `${d} days left` : `Apply by ${shortDate(iso)}`
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Magandang umaga'
  if (h < 18) return 'Magandang hapon'
  return 'Magandang gabi'
}

export const toDateInput = (iso: string) => new Date(iso).toISOString().slice(0, 10)
