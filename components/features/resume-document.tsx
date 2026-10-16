import type { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-5 border-b border-[#e3e9f2] pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand">{children}</h3>
}

/** The rendered résumé (used for live preview, full preview, and print/PDF). */
export function ResumeDocument({ profile: p, className }: { profile: Profile; className?: string }) {
  const contact = [p.location, p.email, p.phone].filter(Boolean).join(' · ')
  return (
    <div className={cn('overflow-hidden rounded-[14px] bg-white text-[12px] leading-relaxed text-[#26354d] shadow-[var(--shadow-card)]', className)}>
      <div className="bg-navy px-6 py-5 text-white">
        <h2 className="text-[22px] font-bold uppercase tracking-wide">{p.firstName} {p.lastName}</h2>
        {p.headline && <p className="mt-0.5 text-[12px] font-semibold text-white/90">{p.headline}</p>}
        {contact && <p className="mt-1.5 text-[11px] text-white/75">{contact}</p>}
      </div>
      <div className="px-6 pb-6 pt-1">
        {p.summary && <><Heading>Professional Summary</Heading><p>{p.summary}</p></>}
        {p.education.length > 0 && (
          <><Heading>Education</Heading>
            {p.education.map((e) => <div key={e.id} className="mb-2"><p className="font-bold">{e.degree}</p><p className="text-[11px] text-[#728097]">{e.school} · {e.startYear} – {e.endYear}</p></div>)}</>
        )}
        {p.skills.length > 0 && (
          <><Heading>Skills</Heading>
            <div className="flex flex-wrap gap-1.5">{p.skills.map((s) => <span key={s.name} className="rounded-full bg-[#eef3fa] px-2.5 py-1 text-[11px] font-semibold">{s.name}<span className="font-normal text-[#728097]"> · {s.level}</span></span>)}</div></>
        )}
        {p.experience.length > 0 && (
          <><Heading>Experience</Heading>
            {p.experience.map((x) => (
              <div key={x.id} className="mb-2.5">
                <p className="font-bold">{x.title}</p>
                <p className="text-[11px] text-[#728097]">{x.company}{x.location && ` · ${x.location}`} · {x.start} – {x.end}</p>
                {x.description && <ul className="mt-1 list-disc pl-4">{x.description.split(/(?<=\.)\s+/).filter(Boolean).map((d, i) => <li key={i}>{d}</li>)}</ul>}
              </div>
            ))}</>
        )}
        {p.projects.length > 0 && (
          <><Heading>Projects</Heading>
            {p.projects.map((x) => <div key={x.id} className="mb-2"><p className="font-bold">{x.name}{x.link && <span className="font-normal text-brand"> · {x.link}</span>}</p><p>{x.description}</p></div>)}</>
        )}
        {p.certifications.length > 0 && (
          <><Heading>Training & Certifications</Heading>
            {p.certifications.map((c) => <p key={c.id}>{c.name} <span className="text-[#728097]">· {c.issuer}, {c.year}</span></p>)}</>
        )}
        {!p.summary && !p.education.length && !p.skills.length && !p.experience.length && (
          <p className="mt-6 text-center text-[#9aa6b8]">Your résumé will appear here as you add details.</p>
        )}
      </div>
    </div>
  )
}
