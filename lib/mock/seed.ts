import type { Application, ApplicationStatus, AuditEntry, DB, Interview, Notification, Profile, User, UserSettings } from '../types'
import { PIPELINE } from '../constants'
import { SEED_EMPLOYERS } from '../data/employers'
import { SEED_JOBS } from '../data/jobs'
import { SEED_COURSES } from '../data/courses'
import {
  AVATAR_COLORS, DEMO_ADMIN_ID, DEMO_EMPLOYER_USER_ID, DEMO_YOUTH_ID, MARIA_PROFILE, SEED_APPLICATIONS, SEED_PEOPLE,
} from '../data/users'

export const DB_VERSION = 3

export const DEFAULT_SETTINGS: UserSettings = {
  jobAlerts: true,
  applicationUpdates: true,
  learningReminders: true,
  emailDigest: false,
  profileVisible: true,
}

const DAY = 86_400_000

export function buildSeed(nowMs = Date.now()): DB {
  const ago = (days: number, hours = 0) => new Date(nowMs - days * DAY - hours * 3_600_000).toISOString()
  const ahead = (days: number) => new Date(nowMs + days * DAY).toISOString()
  const dateOnly = (days: number) => new Date(nowMs + days * DAY).toISOString().slice(0, 10)

  // ---- Users -------------------------------------------------------------
  const users: User[] = [
    { id: DEMO_YOUTH_ID, role: 'youth', email: 'demo@diskartech.ph', password: 'demo1234', name: 'Maria Santos', status: 'active', createdAt: ago(95), lastActiveAt: ago(0, 1) },
    { id: DEMO_ADMIN_ID, role: 'admin', email: 'admin@diskartech.ph', password: 'demo1234', name: 'Admin Reyes', status: 'active', createdAt: ago(500), lastActiveAt: ago(0, 2) },
  ]
  SEED_EMPLOYERS.forEach((e) => {
    const isDemo = e.id === 'emp-brightpath'
    users.push({
      id: isDemo ? DEMO_EMPLOYER_USER_ID : `usr-${e.id.replace('emp-', '')}`,
      role: 'employer',
      email: isDemo ? 'employer@diskartech.ph' : `hr@${e.website}`,
      password: 'demo1234',
      name: isDemo ? 'Carla Lim' : `${e.name} HR`,
      status: 'active',
      createdAt: ago(e.createdDaysAgo),
      lastActiveAt: ago(Math.min(e.createdDaysAgo, 3)),
      employerId: e.id,
    })
  })
  SEED_PEOPLE.forEach((p, i) => {
    users.push({
      id: p.id, role: 'youth', email: `${p.first}.${p.last}`.toLowerCase().replace(/\s+/g, '') + '@mail.example.ph',
      password: 'demo1234', name: `${p.first} ${p.last}`, status: i === 10 ? 'suspended' : 'active',
      createdAt: ago(p.joinedDaysAgo), lastActiveAt: ago(i % 9),
    })
  })

  // ---- Profiles ----------------------------------------------------------
  const profiles: Profile[] = [structuredClone(MARIA_PROFILE)]
  SEED_PEOPLE.forEach((p, i) => {
    profiles.push({
      userId: p.id, firstName: p.first, lastName: p.last, headline: p.headline,
      location: p.city, phone: `0918 555 ${String(1000 + i * 37).slice(0, 4)}`,
      email: users.find((u) => u.id === p.id)!.email,
      summary: `${p.headline}. Graduate of ${p.school} looking to grow in a supportive team.`,
      openToWork: true, avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
      education: [{ id: `edu-${p.id}`, school: p.school, degree: p.degree, startYear: String(Number(p.gradYear) - 4), endYear: Number(p.gradYear) > 2025 ? 'Present' : p.gradYear }],
      skills: p.skills.map(([name, level]) => ({ name, level, source: 'self' as const })),
      experience: p.experience ? [{ id: `exp-${p.id}`, location: p.city, ...p.experience }] : [],
      certifications: [], projects: [], interests: [], preferredLocations: [p.city],
    })
  })

  // ---- Employers & jobs --------------------------------------------------
  const employers = SEED_EMPLOYERS.map(({ createdDaysAgo, ...e }) => ({ ...e, createdAt: ago(createdDaysAgo) }))
  const jobs = SEED_JOBS.map(({ postedDaysAgo, deadlineInDays, ...j }) => ({
    ...j, postedAt: ago(postedDaysAgo, 3), deadline: ahead(deadlineInDays), updatedAt: ago(postedDaysAgo, 3),
  }))

  // ---- Applications & interviews ----------------------------------------
  const applications: Application[] = []
  const interviews: Interview[] = []
  SEED_APPLICATIONS.forEach(([userId, jobId, status, daysAgo], i) => {
    const id = `app-${i + 1}`
    const steps: ApplicationStatus[] = status === 'rejected'
      ? ['submitted', 'under_review', 'rejected']
      : PIPELINE.slice(0, PIPELINE.indexOf(status) + 1)
    const span = Math.max(daysAgo, 0.5)
    const timeline = steps.map((s, idx) => ({
      status: s,
      at: new Date(nowMs - span * DAY + (idx / Math.max(steps.length, 1)) * span * DAY * 0.9).toISOString(),
    }))
    applications.push({
      id, jobId, userId, status, appliedAt: timeline[0].at, updatedAt: timeline[timeline.length - 1].at,
      coverNote: userId === DEMO_YOUTH_ID ? 'I am excited to apply and would love to contribute while learning from your team.' : '',
      timeline, employerNotes: '',
    })
    if (['interview', 'offer', 'hired'].includes(status)) {
      const upcoming = status === 'interview'
      const dayOffset = upcoming ? (userId === DEMO_YOUTH_ID ? 3 : 2 + (i % 4)) : -Math.max(1, Math.floor(daysAgo / 2))
      interviews.push({
        id: `int-${i + 1}`, applicationId: id, date: dateOnly(dayOffset), time: ['10:00', '14:00', '09:30', '15:30'][i % 4],
        type: (['Video call', 'On-site', 'Phone call'] as const)[i % 3],
        location: i % 3 === 1 ? '12F BrightPath Tower, 5th Ave, BGC, Taguig' : 'https://meet.example.ph/diskartech-' + (1000 + i),
        notes: 'Please prepare a short introduction and examples of past projects.',
        status: upcoming ? 'scheduled' : 'completed', createdAt: ago(Math.max(daysAgo - 1, 0)), updatedAt: ago(Math.max(daysAgo - 1, 0)),
      })
    }
  })

  // ---- Learning ----------------------------------------------------------
  const enrollments = [
    { userId: DEMO_YOUTH_ID, courseId: 'crs-cs', enrolledAt: ago(9), completedLessons: ['l1', 'l2'], quizScore: null, quizPassed: false, completedAt: null, lastActivityAt: ago(1) },
    { userId: DEMO_YOUTH_ID, courseId: 'crs-digital', enrolledAt: ago(40), completedLessons: ['l1', 'l2', 'l3'], quizScore: 100, quizPassed: true, completedAt: ago(30), lastActivityAt: ago(30) },
    { userId: 'usr-juan', courseId: 'crs-webdev', enrolledAt: ago(50), completedLessons: ['l1', 'l2', 'l3', 'l4', 'l5'], quizScore: 80, quizPassed: true, completedAt: ago(45), lastActivityAt: ago(45) },
    { userId: 'usr-bea', courseId: 'crs-sql', enrolledAt: ago(20), completedLessons: ['l1', 'l2'], quizScore: null, quizPassed: false, completedAt: null, lastActivityAt: ago(4) },
  ]
  const certificates = [
    { id: 'cert-1', userId: DEMO_YOUTH_ID, courseId: 'crs-digital', issuedAt: ago(30), code: 'DT-2026-48213' },
    { id: 'cert-2', userId: 'usr-juan', courseId: 'crs-webdev', issuedAt: ago(45), code: 'DT-2026-31877' },
  ]

  // ---- Notifications -----------------------------------------------------
  const n = (userId: string, hoursAgo: number, read: boolean, x: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>): Notification =>
    ({ id: `ntf-${userId}-${hoursAgo}`, userId, read, createdAt: ago(0, hoursAgo), ...x })
  const mariaInterviewApp = applications.find((a) => a.userId === DEMO_YOUTH_ID && a.status === 'interview')!
  const mariaShortlist = applications.find((a) => a.userId === DEMO_YOUTH_ID && a.status === 'shortlisted')!
  const mariaSubmitted = applications.find((a) => a.userId === DEMO_YOUTH_ID && a.status === 'submitted')!
  const notifications: Notification[] = [
    n(DEMO_YOUTH_ID, 2, false, { category: 'jobs', icon: 'check', title: 'Your application was received', body: 'Batangas Bay Logistics · IT Support Associate', href: `/applications/${mariaSubmitted.id}` }),
    n(DEMO_YOUTH_ID, 5, false, { category: 'learning', icon: 'book', title: 'Continue where you left off', body: 'Customer Service Excellence · Lesson 3 is ready', href: '/learn/crs-cs' }),
    n(DEMO_YOUTH_ID, 26, false, { category: 'jobs', icon: 'calendar', title: 'Interview invitation', body: 'Mabuhay Data Analytics · Junior Data Analyst', href: `/applications/${mariaInterviewApp.id}` }),
    n(DEMO_YOUTH_ID, 30, true, { category: 'jobs', icon: 'star', title: 'You have been shortlisted!', body: 'BrightPath Technologies · IT Support Specialist', href: `/applications/${mariaShortlist.id}` }),
    n(DEMO_YOUTH_ID, 72, true, { category: 'learning', icon: 'award', title: 'You earned a certificate!', body: 'Digital Literacy & Workplace Tools', href: '/learn/certificates/cert-1' }),
    n(DEMO_YOUTH_ID, 200, true, { category: 'system', icon: 'shield', title: 'Welcome to DiskarTech', body: 'Take the skills assessment to get better job matches.', href: '/assessment' }),
    n(DEMO_EMPLOYER_USER_ID, 1, false, { category: 'jobs', icon: 'user', title: 'New applicant', body: 'Kristine Aquino applied for Junior Web Developer', href: '/employer/applicants' }),
    n(DEMO_EMPLOYER_USER_ID, 20, false, { category: 'jobs', icon: 'user', title: 'New applicant', body: 'Paolo Garcia applied for Software Developer Intern', href: '/employer/applicants' }),
    n(DEMO_EMPLOYER_USER_ID, 300, true, { category: 'system', icon: 'shield', title: 'Company verified', body: 'BrightPath Technologies is now a verified employer.', href: '/employer/company' }),
    n(DEMO_ADMIN_ID, 3, false, { category: 'system', icon: 'shield', title: 'Employer awaiting verification', body: 'Habi Creative Co. submitted verification documents', href: '/admin/employers' }),
    n(DEMO_ADMIN_ID, 20, false, { category: 'jobs', icon: 'alert', title: '2 job posts pending review', body: 'Review new posts before they go live', href: '/admin/jobs' }),
  ]

  // ---- Audit log ---------------------------------------------------------
  const audit: AuditEntry[] = [
    { id: 'aud-1', actorId: 'system', actorName: 'System', actorRole: 'system', action: 'New employer registered', target: 'Habi Creative Co.', category: 'employer', at: ago(3) },
    { id: 'aud-2', actorId: 'usr-habi', actorName: 'Habi Creative Co. HR', actorRole: 'employer', action: 'Submitted job for review', target: 'Junior Graphic & UI Designer', category: 'job', at: ago(0, 6) },
    { id: 'aud-3', actorId: 'usr-silangan', actorName: 'Silangan Digital Marketing HR', actorRole: 'employer', action: 'Submitted job for review', target: 'Digital Marketing Assistant', category: 'job', at: ago(1) },
    { id: 'aud-4', actorId: DEMO_ADMIN_ID, actorName: 'Admin Reyes', actorRole: 'admin', action: 'Approved job post', target: 'Junior Web Developer · BrightPath Technologies', category: 'job', at: ago(2) },
    { id: 'aud-5', actorId: DEMO_ADMIN_ID, actorName: 'Admin Reyes', actorRole: 'admin', action: 'Suspended user', target: 'Renz Castillo', category: 'user', at: ago(4) },
    { id: 'aud-6', actorId: DEMO_ADMIN_ID, actorName: 'Admin Reyes', actorRole: 'admin', action: 'Saved course as draft', target: 'Git & GitHub for Beginners', category: 'course', at: ago(5) },
    { id: 'aud-7', actorId: 'usr-juan', actorName: 'Juan Dela Cruz', actorRole: 'youth', action: 'New user registered', target: 'Juan Dela Cruz', category: 'user', at: ago(60) },
  ]

  return {
    version: DB_VERSION,
    users, profiles, employers, jobs, applications, interviews,
    courses: structuredClone(SEED_COURSES),
    enrollments, certificates, notifications,
    assessments: [], audit,
    saved: { [DEMO_YOUTH_ID]: ['job-bd-frontend', 'job-tc-cyber'] },
    settings: Object.fromEntries(users.map((u) => [u.id, { ...DEFAULT_SETTINGS }])),
  }
}
