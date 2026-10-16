// Core domain models for the DiskarTech prototype.
// These mirror what a real API would return so the mock services can be swapped later.

export type Role = 'youth' | 'employer' | 'admin'

export interface User {
  id: string
  role: Role
  email: string
  password: string // mock only — never store plain passwords in a real system
  name: string
  status: 'active' | 'suspended'
  createdAt: string
  lastActiveAt: string
  employerId?: string
}

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export interface Skill {
  name: string
  level: SkillLevel
  source: 'self' | 'assessment' | 'course'
}

export interface Education {
  id: string
  school: string
  degree: string
  startYear: string
  endYear: string // "Present" allowed
}

export interface Experience {
  id: string
  title: string
  company: string
  location: string
  start: string
  end: string // "Present" allowed
  description: string
}

export interface Certification {
  id: string
  name: string
  issuer: string
  year: string
  courseId?: string
}

export interface Project {
  id: string
  name: string
  description: string
  link?: string
}

export interface Profile {
  userId: string
  firstName: string
  lastName: string
  headline: string
  location: string
  phone: string
  email: string
  summary: string
  openToWork: boolean
  avatarColor: string
  education: Education[]
  skills: Skill[]
  experience: Experience[]
  certifications: Certification[]
  projects: Project[]
  interests: string[] // career path ids
  preferredLocations: string[]
}

export type VerificationStatus = 'verified' | 'pending' | 'rejected'

export interface Employer {
  id: string
  name: string
  initials: string
  industry: string
  location: string
  size: string
  about: string
  website: string
  color: string
  verification: VerificationStatus
  createdAt: string
}

export type JobType = 'Full-time' | 'Part-time' | 'Internship' | 'Contract'
export type ExperienceLevel = 'Entry Level' | 'Junior' | 'Mid Level'
export type WorkSetup = 'On-site' | 'Hybrid' | 'Remote'
export type JobStatus = 'draft' | 'pending' | 'published' | 'closed' | 'rejected'

export interface Job {
  id: string
  employerId: string
  title: string
  category: string
  location: string // city, e.g. "Taguig"
  region: string // e.g. "Metro Manila"
  workSetup: WorkSetup
  type: JobType
  level: ExperienceLevel
  salaryMin: number
  salaryMax: number
  description: string
  responsibilities: string[]
  qualifications: string[]
  skills: string[]
  benefits: string[]
  postedAt: string
  deadline: string
  status: JobStatus
  views: number
  moderationNote?: string
  updatedAt: string
}

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'

export interface TimelineEntry {
  status: ApplicationStatus
  at: string
  note?: string
}

export interface Application {
  id: string
  jobId: string
  userId: string
  status: ApplicationStatus
  appliedAt: string
  updatedAt: string
  coverNote: string
  timeline: TimelineEntry[]
  employerNotes: string
}

export type InterviewType = 'Video call' | 'Phone call' | 'On-site'

export interface Interview {
  id: string
  applicationId: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  type: InterviewType
  location: string // link or address
  notes: string
  status: 'scheduled' | 'cancelled' | 'completed'
  createdAt: string
  updatedAt: string
}

export interface Lesson {
  id: string
  title: string
  minutes: number
  summary: string
  points: string[]
}

export interface QuizQuestion {
  q: string
  options: string[]
  answer: number
}

export interface Course {
  id: string
  title: string
  category: string
  level: SkillLevel
  provider: string
  hours: number
  description: string
  outcomes: string[]
  skills: string[] // skills granted/improved on completion
  color: string
  icon: string // lucide icon key
  lessons: Lesson[]
  quiz: QuizQuestion[]
  status: 'published' | 'draft'
  free: boolean
}

export interface Enrollment {
  userId: string
  courseId: string
  enrolledAt: string
  completedLessons: string[]
  quizScore: number | null
  quizPassed: boolean
  completedAt: string | null
  lastActivityAt: string
}

export interface Certificate {
  id: string
  userId: string
  courseId: string
  issuedAt: string
  code: string
}

export type NotificationCategory = 'jobs' | 'learning' | 'system'

export interface Notification {
  id: string
  userId: string
  category: NotificationCategory
  icon: 'check' | 'briefcase' | 'star' | 'calendar' | 'book' | 'award' | 'shield' | 'alert' | 'user' | 'x'
  title: string
  body: string
  href: string
  read: boolean
  createdAt: string
}

export interface AssessmentResult {
  id: string
  userId: string
  takenAt: string
  score: number // 0-100
  areas: { area: string; correct: number; total: number; level: SkillLevel }[]
}

export interface AuditEntry {
  id: string
  actorId: string
  actorName: string
  actorRole: Role | 'system'
  action: string
  target: string
  category: 'auth' | 'user' | 'employer' | 'job' | 'course' | 'application'
  at: string
}

export interface UserSettings {
  jobAlerts: boolean
  applicationUpdates: boolean
  learningReminders: boolean
  emailDigest: boolean
  profileVisible: boolean
}

export interface DB {
  version: number
  users: User[]
  profiles: Profile[]
  employers: Employer[]
  jobs: Job[]
  applications: Application[]
  interviews: Interview[]
  courses: Course[]
  enrollments: Enrollment[]
  certificates: Certificate[]
  notifications: Notification[]
  assessments: AssessmentResult[]
  audit: AuditEntry[]
  saved: Record<string, string[]> // userId -> jobIds
  settings: Record<string, UserSettings>
}
