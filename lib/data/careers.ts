export interface CareerPath {
  id: string
  title: string
  family: string
  description: string
  skills: string[] // core skills, most important first
  categories: string[] // job categories that belong to this path
  salary: string
  color: string
  icon: string
}

export const CAREER_PATHS: CareerPath[] = [
  { id: 'web-dev', title: 'Web Developer', family: 'IT & Technology', description: 'Build websites and web apps used by Filipino businesses and communities.', skills: ['HTML/CSS', 'JavaScript', 'React', 'Git', 'SQL'], categories: ['Software Development'], salary: '₱25k–₱40k entry', color: '#E4EEFF', icon: 'code' },
  { id: 'it-support', title: 'IT Support Specialist', family: 'IT & Technology', description: 'Keep people and offices running by solving hardware, software, and network issues.', skills: ['Troubleshooting', 'Technical Support', 'Networking', 'Customer Service', 'Linux'], categories: ['IT Support'], salary: '₱18k–₱26k entry', color: '#E6F6EC', icon: 'wrench' },
  { id: 'data', title: 'Data Analyst', family: 'Business & Data', description: 'Turn numbers into insights that help businesses make better decisions.', skills: ['SQL', 'Excel', 'Data Analysis', 'Power BI', 'Python'], categories: ['Data'], salary: '₱25k–₱32k entry', color: '#FFF4DB', icon: 'chart' },
  { id: 'uiux', title: 'UI/UX Designer', family: 'Creative & Design', description: 'Design apps and websites that are easy and delightful to use.', skills: ['UI/UX Design', 'Figma', 'Communication', 'HTML/CSS'], categories: ['Design'], salary: '₱25k–₱35k entry', color: '#FDECEC', icon: 'palette' },
  { id: 'network', title: 'Network Technician', family: 'IT & Technology', description: 'Install and maintain the networks that connect offices, factories, and homes.', skills: ['Networking', 'Troubleshooting', 'Linux'], categories: ['Networking'], salary: '₱18k–₱28k entry', color: '#E0F4F7', icon: 'network' },
  { id: 'security', title: 'Cybersecurity Analyst', family: 'IT & Technology', description: 'Protect organizations from cyber threats as part of a security operations team.', skills: ['Cybersecurity', 'Networking', 'Linux'], categories: ['Cybersecurity'], salary: '₱30k–₱38k entry', color: '#EEE9FF', icon: 'shield' },
  { id: 'marketing', title: 'Digital Marketer', family: 'Business & Data', description: 'Grow brands online through social media, search, and content.', skills: ['Digital Marketing', 'SEO', 'Content Writing', 'Communication'], categories: ['Marketing'], salary: '₱15k–₱23k entry', color: '#FDECEC', icon: 'megaphone' },
]
