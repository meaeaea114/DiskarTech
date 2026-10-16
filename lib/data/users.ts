import type { ApplicationStatus, Profile, Skill, SkillLevel } from '../types'

export const DEMO_YOUTH_ID = 'usr-maria'
export const DEMO_EMPLOYER_USER_ID = 'usr-brightpath'
export const DEMO_ADMIN_ID = 'usr-admin'

export const AVATAR_COLORS = ['#E4EEFF', '#E6F6EC', '#FFF4DB', '#EEE9FF', '#FDECEC', '#E0F4F7']

const s = (name: string, level: SkillLevel, source: Skill['source'] = 'self'): Skill => ({ name, level, source })

export const MARIA_PROFILE: Profile = {
  userId: DEMO_YOUTH_ID,
  firstName: 'Maria',
  lastName: 'Santos',
  headline: 'BSIT Student · Aspiring Web Developer',
  location: 'Batangas City, Batangas',
  phone: '0917 555 0142',
  email: 'demo@diskartech.ph',
  summary: 'IT student with a strong foundation in web development, customer support, and digital tools. Curious, adaptable, and eager to grow with a team that builds useful products for Filipinos.',
  openToWork: true,
  avatarColor: '#E4EEFF',
  education: [
    { id: 'edu-1', school: 'Batangas State University', degree: 'BS Information Technology', startYear: '2022', endYear: 'Present' },
    { id: 'edu-2', school: 'Batangas National High School', degree: 'Senior High School · ICT Strand', startYear: '2020', endYear: '2022' },
  ],
  skills: [
    s('HTML/CSS', 'Intermediate'), s('JavaScript', 'Intermediate'), s('Communication', 'Advanced'),
    s('Customer Service', 'Intermediate'), s('Teamwork', 'Advanced'), s('Troubleshooting', 'Intermediate'),
    s('Excel', 'Intermediate', 'course'), s('Figma', 'Beginner'),
  ],
  experience: [
    {
      id: 'exp-1', title: 'Student IT Support Assistant', company: 'BatStateU Campus Technology Lab', location: 'Batangas City',
      start: '2024', end: 'Present',
      description: 'Helped students troubleshoot common device and account issues. Supported basic lab setup and documentation.',
    },
  ],
  certifications: [
    { id: 'cert-seed-1', name: 'Digital Literacy & Workplace Tools', issuer: 'DiskarTech Academy', year: '2026', courseId: 'crs-digital' },
  ],
  projects: [],
  interests: ['web-dev', 'it-support'],
  preferredLocations: ['Batangas City', 'Taguig', 'Remote'],
}

// Seeded job seekers who apply to employer jobs. Kept compact; expanded in seed.ts.
export interface PersonSeed {
  id: string
  first: string
  last: string
  city: string
  school: string
  degree: string
  gradYear: string
  headline: string
  skills: [string, SkillLevel][]
  experience?: { title: string; company: string; start: string; end: string; description: string }
  joinedDaysAgo: number
}

export const SEED_PEOPLE: PersonSeed[] = [
  { id: 'usr-juan', first: 'Juan', last: 'Dela Cruz', city: 'Quezon City', school: 'Polytechnic University of the Philippines', degree: 'BS Computer Science', gradYear: '2025', headline: 'Fresh CS graduate · React enthusiast', skills: [['JavaScript', 'Advanced'], ['React', 'Intermediate'], ['HTML/CSS', 'Advanced'], ['Git', 'Intermediate'], ['SQL', 'Beginner']], experience: { title: 'Web Development Intern', company: 'Pixel Bayan Studio', start: '2024', end: '2025', description: 'Built landing pages and fixed UI bugs for client websites.' }, joinedDaysAgo: 60 },
  { id: 'usr-ana', first: 'Ana', last: 'Reyes', city: 'Pasig', school: 'Rizal Technological University', degree: 'BS Information Technology', gradYear: '2025', headline: 'IT graduate · Help desk experience', skills: [['Troubleshooting', 'Advanced'], ['Technical Support', 'Advanced'], ['Networking', 'Intermediate'], ['Customer Service', 'Advanced']], experience: { title: 'Help Desk Intern', company: 'Pasig City Hall MIS Office', start: '2024', end: '2025', description: 'Handled 20+ IT tickets daily for city hall employees.' }, joinedDaysAgo: 45 },
  { id: 'usr-mark', first: 'Mark', last: 'Villanueva', city: 'Taguig', school: 'Technological Institute of the Philippines', degree: 'BS Computer Engineering', gradYear: '2024', headline: 'Junior developer · Laravel & JavaScript', skills: [['JavaScript', 'Intermediate'], ['PHP', 'Advanced'], ['SQL', 'Intermediate'], ['Git', 'Intermediate'], ['HTML/CSS', 'Intermediate']], experience: { title: 'Freelance Web Developer', company: 'Self-employed', start: '2024', end: 'Present', description: 'Built websites for small businesses in Taguig and Pateros.' }, joinedDaysAgo: 90 },
  { id: 'usr-liza', first: 'Liza', last: 'Mendoza', city: 'Makati', school: 'University of Makati', degree: 'BS Information Technology', gradYear: '2025', headline: 'Support specialist · Calm under pressure', skills: [['Customer Service', 'Advanced'], ['Communication', 'Advanced'], ['Troubleshooting', 'Intermediate']], experience: { title: 'Customer Service Associate', company: 'Global Contact Solutions', start: '2023', end: '2025', description: 'Resolved billing and technical inquiries for a US telco account.' }, joinedDaysAgo: 120 },
  { id: 'usr-paolo', first: 'Paolo', last: 'Garcia', city: 'Calamba', school: 'Laguna State Polytechnic University', degree: 'BS Information Technology', gradYear: '2026', headline: 'IT student · Network enthusiast', skills: [['Networking', 'Advanced'], ['Linux', 'Intermediate'], ['Troubleshooting', 'Intermediate']], joinedDaysAgo: 30 },
  { id: 'usr-bea', first: 'Bea', last: 'Ramos', city: 'Manila', school: 'University of Santo Tomas', degree: 'BS Information Systems', gradYear: '2025', headline: 'Data-minded IS graduate', skills: [['SQL', 'Advanced'], ['Excel', 'Advanced'], ['Data Analysis', 'Intermediate'], ['Power BI', 'Beginner']], experience: { title: 'Research Assistant', company: 'UST Research Center', start: '2024', end: '2025', description: 'Cleaned survey data and prepared statistical summaries.' }, joinedDaysAgo: 40 },
  { id: 'usr-carlo', first: 'Carlo', last: 'Mercado', city: 'Lipa', school: 'De La Salle Lipa', degree: 'BS Computer Science', gradYear: '2026', headline: 'CS student · Aspiring full-stack dev', skills: [['JavaScript', 'Intermediate'], ['React', 'Beginner'], ['Python', 'Intermediate'], ['SQL', 'Intermediate']], joinedDaysAgo: 25 },
  { id: 'usr-jessa', first: 'Jessa', last: 'Bautista', city: 'Dasmariñas', school: 'Cavite State University', degree: 'BS Information Technology', gradYear: '2025', headline: 'Front-end developer · Design-minded', skills: [['HTML/CSS', 'Advanced'], ['JavaScript', 'Intermediate'], ['Figma', 'Intermediate'], ['UI/UX Design', 'Intermediate']], experience: { title: 'Front-end Intern', company: 'Kabite Web Co.', start: '2024', end: '2025', description: 'Converted Figma mockups into responsive pages.' }, joinedDaysAgo: 75 },
  { id: 'usr-miguel', first: 'Miguel', last: 'Torres', city: 'Santa Rosa', school: 'Mapúa University', degree: 'BS Information Technology', gradYear: '2025', headline: 'IT graduate · Security-curious', skills: [['Cybersecurity', 'Intermediate'], ['Networking', 'Intermediate'], ['Linux', 'Advanced']], joinedDaysAgo: 55 },
  { id: 'usr-kristine', first: 'Kristine', last: 'Aquino', city: 'Cebu City', school: 'University of San Carlos', degree: 'BS Computer Science', gradYear: '2024', headline: 'Developer · PHP and JavaScript', skills: [['PHP', 'Intermediate'], ['JavaScript', 'Intermediate'], ['SQL', 'Advanced'], ['Git', 'Advanced']], experience: { title: 'Junior Developer', company: 'Sugbo Systems', start: '2024', end: '2025', description: 'Maintained PHP-based school management systems.' }, joinedDaysAgo: 150 },
  { id: 'usr-renz', first: 'Renz', last: 'Castillo', city: 'Davao City', school: 'University of Mindanao', degree: 'BS Information Technology', gradYear: '2025', headline: 'IT graduate · Fiber network technician', skills: [['Networking', 'Advanced'], ['Troubleshooting', 'Advanced'], ['Linux', 'Beginner']], joinedDaysAgo: 35 },
  { id: 'usr-angelica', first: 'Angelica', last: 'Navarro', city: 'Quezon City', school: 'Ateneo de Manila University', degree: 'BS Management Information Systems', gradYear: '2025', headline: 'UX designer · User research', skills: [['UI/UX Design', 'Advanced'], ['Figma', 'Advanced'], ['Communication', 'Advanced']], experience: { title: 'UX Design Intern', company: 'Tindahan App', start: '2024', end: '2025', description: 'Ran usability tests with sari-sari store owners.' }, joinedDaysAgo: 80 },
]

// [userId, jobId, status, appliedDaysAgo]
export const SEED_APPLICATIONS: [string, string, ApplicationStatus, number][] = [
  // Maria (demo youth)
  [DEMO_YOUTH_ID, 'job-kl-uiux', 'under_review', 4],
  [DEMO_YOUTH_ID, 'job-md-analyst', 'interview', 6],
  [DEMO_YOUTH_ID, 'job-bp-itsupport', 'shortlisted', 5],
  [DEMO_YOUTH_ID, 'job-bb-it', 'submitted', 2],
  // BrightPath — Junior Web Developer
  ['usr-juan', 'job-bp-webdev', 'shortlisted', 2],
  ['usr-mark', 'job-bp-webdev', 'interview', 2],
  ['usr-jessa', 'job-bp-webdev', 'under_review', 1],
  ['usr-carlo', 'job-bp-webdev', 'submitted', 1],
  ['usr-kristine', 'job-bp-webdev', 'submitted', 0],
  // BrightPath — IT Support Specialist
  ['usr-ana', 'job-bp-itsupport', 'offer', 5],
  ['usr-liza', 'job-bp-itsupport', 'under_review', 4],
  ['usr-paolo', 'job-bp-itsupport', 'submitted', 3],
  ['usr-renz', 'job-bp-itsupport', 'rejected', 5],
  // BrightPath — Software Developer Intern
  ['usr-carlo', 'job-bp-intern', 'under_review', 1],
  ['usr-paolo', 'job-bp-intern', 'submitted', 0],
  ['usr-bea', 'job-bp-intern', 'submitted', 1],
  // BrightPath — closed TSR role
  ['usr-liza', 'job-bp-tsr', 'hired', 40],
  ['usr-ana', 'job-bp-tsr', 'rejected', 42],
  ['usr-renz', 'job-bp-tsr', 'rejected', 41],
  // Other employers
  ['usr-angelica', 'job-kl-uiux', 'interview', 3],
  ['usr-jessa', 'job-kl-uiux', 'shortlisted', 3],
  ['usr-juan', 'job-bd-frontend', 'interview', 3],
  ['usr-jessa', 'job-bd-frontend', 'under_review', 2],
  ['usr-bea', 'job-md-analyst', 'shortlisted', 5],
  ['usr-miguel', 'job-tc-cyber', 'under_review', 6],
  ['usr-kristine', 'job-is-php', 'offer', 8],
  ['usr-mark', 'job-is-php', 'under_review', 7],
  ['usr-paolo', 'job-lt-network', 'shortlisted', 3],
  ['usr-renz', 'job-dn-network', 'hired', 11],
  ['usr-miguel', 'job-lt-network', 'submitted', 2],
]
