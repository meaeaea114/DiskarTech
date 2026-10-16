import type { Profile } from '../types'

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

/** Generates a standalone résumé document (opens in Word/Google Docs). */
function toHTML(p: Profile) {
  const section = (title: string, body: string) => (body ? `<h2>${title}</h2>${body}` : '')
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(p.firstName)} ${esc(p.lastName)} — Résumé</title>
<style>body{font-family:Calibri,Arial,sans-serif;color:#142D57;max-width:720px;margin:32px auto;line-height:1.45}
h1{margin:0;font-size:28px}h2{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#007AFF;border-bottom:1px solid #DDE3EC;padding-bottom:4px;margin-top:22px}
.muted{color:#5B6B82;font-size:13px}p{margin:4px 0}</style></head><body>
<h1>${esc(p.firstName)} ${esc(p.lastName)}</h1>
<p><b>${esc(p.headline)}</b></p>
<p class="muted">${[p.location, p.email, p.phone].filter(Boolean).map(esc).join(' · ')}</p>
${section('Professional Summary', p.summary ? `<p>${esc(p.summary)}</p>` : '')}
${section('Education', p.education.map((e) => `<p><b>${esc(e.degree)}</b><br><span class="muted">${esc(e.school)} · ${esc(e.startYear)} – ${esc(e.endYear)}</span></p>`).join(''))}
${section('Skills', p.skills.length ? `<p>${p.skills.map((s) => `${esc(s.name)} (${s.level})`).join(' · ')}</p>` : '')}
${section('Experience', p.experience.map((x) => `<p><b>${esc(x.title)}</b> — ${esc(x.company)}<br><span class="muted">${esc(x.location)} · ${esc(x.start)} – ${esc(x.end)}</span><br>${esc(x.description)}</p>`).join(''))}
${section('Projects', p.projects.map((x) => `<p><b>${esc(x.name)}</b>${x.link ? ` · ${esc(x.link)}` : ''}<br>${esc(x.description)}</p>`).join(''))}
${section('Certifications & Training', p.certifications.map((c) => `<p>${esc(c.name)} · <span class="muted">${esc(c.issuer)}, ${esc(c.year)}</span></p>`).join(''))}
</body></html>`
}

export const ResumeService = {
  toHTML,

  downloadDoc(profile: Profile) {
    const blob = new Blob(['﻿', toHTML(profile)], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${profile.firstName}-${profile.lastName}-Resume.doc`.replace(/\s+/g, '-')
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },

  /** Uses the browser's print dialog — choose "Save as PDF" to download a PDF. */
  printPDF() {
    window.print()
  },
}
