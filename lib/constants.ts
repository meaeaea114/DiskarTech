import type { ApplicationStatus, ExperienceLevel, JobStatus, JobType, Role, SkillLevel, WorkSetup, InterviewType } from './types'

export const APP_NAME = 'DiskarTech'
export const TAGLINE = 'Skills Today. Opportunities Tomorrow.'

// Demo mode exposes one-tap demo accounts and data reset tools.
// Set NEXT_PUBLIC_DEMO_MODE=false for a build that hides them.
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false'

export const DEMO_ACCOUNTS: { role: Role; label: string; email: string; password: string; description: string }[] = [
  { role: 'youth', label: 'Youth', email: 'demo@diskartech.ph', password: 'demo1234', description: 'Maria Santos · BSIT student' },
  { role: 'employer', label: 'Employer', email: 'employer@diskartech.ph', password: 'demo1234', description: 'BrightPath Technologies' },
  { role: 'admin', label: 'Admin', email: 'admin@diskartech.ph', password: 'demo1234', description: 'Platform administrator' },
]

export const ROLE_HOME: Record<Role, string> = {
  youth: '/home',
  employer: '/employer',
  admin: '/admin',
}

export const JOB_TYPES: JobType[] = ['Full-time', 'Part-time', 'Internship', 'Contract']
export const EXPERIENCE_LEVELS: ExperienceLevel[] = ['Entry Level', 'Junior', 'Mid Level']
export const WORK_SETUPS: WorkSetup[] = ['On-site', 'Hybrid', 'Remote']
export const INTERVIEW_TYPES: InterviewType[] = ['Video call', 'Phone call', 'On-site']
export const SKILL_LEVELS: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced']

export const JOB_CATEGORIES = [
  'Software Development',
  'IT Support',
  'Design',
  'Data',
  'Networking',
  'Cybersecurity',
  'Marketing',
]

export const LOCATIONS: { city: string; region: string }[] = [
  { city: 'Manila', region: 'Metro Manila' },
  { city: 'Makati', region: 'Metro Manila' },
  { city: 'Quezon City', region: 'Metro Manila' },
  { city: 'Pasig', region: 'Metro Manila' },
  { city: 'Taguig', region: 'Metro Manila' },
  { city: 'Batangas City', region: 'Batangas' },
  { city: 'Lipa', region: 'Batangas' },
  { city: 'Santa Rosa', region: 'Laguna' },
  { city: 'Calamba', region: 'Laguna' },
  { city: 'Dasmariñas', region: 'Cavite' },
  { city: 'Cebu City', region: 'Cebu' },
  { city: 'Davao City', region: 'Davao del Sur' },
]

export const SKILL_CATALOG = [
  'HTML/CSS', 'JavaScript', 'React', 'TypeScript', 'PHP', 'Java', 'Python', 'SQL', 'Git',
  'UI/UX Design', 'Figma', 'Networking', 'Linux', 'Troubleshooting', 'Technical Support',
  'Cybersecurity', 'Data Analysis', 'Excel', 'Power BI', 'Digital Marketing', 'SEO',
  'Content Writing', 'Communication', 'Customer Service', 'Teamwork', 'Problem Solving',
]

export const SALARY_RANGES = [
  { id: 'any', label: 'Any salary', min: 0 },
  { id: '15', label: '₱15k+', min: 15000 },
  { id: '20', label: '₱20k+', min: 20000 },
  { id: '25', label: '₱25k+', min: 25000 },
  { id: '30', label: '₱30k+', min: 30000 },
]

export const SORT_OPTIONS = [
  { id: 'relevance', label: 'Best match' },
  { id: 'newest', label: 'Newest' },
  { id: 'salary', label: 'Highest salary' },
  { id: 'deadline', label: 'Closing soon' },
] as const

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'submitted', 'under_review', 'shortlisted', 'interview', 'offer', 'hired', 'rejected',
]

// The hiring pipeline, in order (rejected sits outside the pipeline).
export const PIPELINE: ApplicationStatus[] = ['submitted', 'under_review', 'shortlisted', 'interview', 'offer', 'hired']

export const STATUS_META: Record<ApplicationStatus, { label: string; stage: string; tone: Tone }> = {
  submitted: { label: 'Submitted', stage: 'Applied', tone: 'gray' },
  under_review: { label: 'Under Review', stage: 'Review', tone: 'blue' },
  shortlisted: { label: 'Shortlisted', stage: 'Shortlisted', tone: 'green' },
  interview: { label: 'Interview', stage: 'Interview', tone: 'amber' },
  offer: { label: 'Offer', stage: 'Offer', tone: 'purple' },
  hired: { label: 'Hired', stage: 'Hired', tone: 'green' },
  rejected: { label: 'Not Selected', stage: 'Rejected', tone: 'red' },
}

export const JOB_STATUS_META: Record<JobStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'gray' },
  pending: { label: 'Pending review', tone: 'amber' },
  published: { label: 'Published', tone: 'green' },
  closed: { label: 'Closed', tone: 'gray' },
  rejected: { label: 'Rejected', tone: 'red' },
}

export type Tone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gold'

export const QUIZ_PASS_SCORE = 70
