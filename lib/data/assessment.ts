// Rule-based skills assessment. Each area maps to a skill in the profile.

export interface AssessmentQuestion {
  id: string
  area: string
  q: string
  options: string[]
  answer: number
}

export const ASSESSMENT_AREAS = ['HTML/CSS', 'JavaScript', 'SQL', 'Networking', 'UI/UX Design', 'Cybersecurity'] as const

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 'q1', area: 'HTML/CSS', q: 'Which HTML element is most appropriate for the main navigation links?', options: ['<div>', '<nav>', '<span>', '<section>'], answer: 1 },
  { id: 'q2', area: 'HTML/CSS', q: 'Which CSS property makes a container lay out its children in a row or column?', options: ['float: left', 'display: flex', 'position: absolute', 'overflow: auto'], answer: 1 },
  { id: 'q3', area: 'HTML/CSS', q: 'A class selector in CSS starts with…', options: ['#', '.', '@', '&'], answer: 1 },
  { id: 'q4', area: 'JavaScript', q: 'What does [1, 2, 3].map(n => n * 2) return?', options: ['[1, 2, 3]', '6', '[2, 4, 6]', 'undefined'], answer: 2 },
  { id: 'q5', area: 'JavaScript', q: 'What is the result of typeof null?', options: ['"null"', '"undefined"', '"object"', '"number"'], answer: 2 },
  { id: 'q6', area: 'JavaScript', q: 'Which keyword waits for a promise inside an async function?', options: ['yield', 'await', 'then', 'defer'], answer: 1 },
  { id: 'q7', area: 'SQL', q: 'Which statement retrieves data from a table?', options: ['GET', 'SELECT', 'FETCH', 'PULL'], answer: 1 },
  { id: 'q8', area: 'SQL', q: 'To count orders per customer you would use…', options: ['ORDER BY', 'GROUP BY', 'LIMIT', 'DISTINCT'], answer: 1 },
  { id: 'q9', area: 'SQL', q: 'Which JOIN returns only rows with matches in both tables?', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'], answer: 2 },
  { id: 'q10', area: 'Networking', q: 'Which of these is a private IPv4 address?', options: ['8.8.8.8', '192.168.1.20', '203.177.10.5', '1.1.1.1'], answer: 1 },
  { id: 'q11', area: 'Networking', q: 'What does DHCP do?', options: ['Resolves domain names', 'Assigns IP addresses automatically', 'Encrypts Wi-Fi', 'Blocks malware'], answer: 1 },
  { id: 'q12', area: 'Networking', q: 'A user can reach 8.8.8.8 but not google.com. The likely issue is…', options: ['Broken cable', 'DNS', 'Monitor settings', 'Low battery'], answer: 1 },
  { id: 'q13', area: 'UI/UX Design', q: 'What is the main purpose of a wireframe?', options: ['Final visual polish', 'Plan layout and structure', 'Write code', 'Pick brand colors'], answer: 1 },
  { id: 'q14', area: 'UI/UX Design', q: 'A usability test is best done with…', options: ['Your teammates only', 'Real target users', 'Investors', 'Nobody — trust your gut'], answer: 1 },
  { id: 'q15', area: 'UI/UX Design', q: 'Which principle says related items should be placed close together?', options: ['Proximity', 'Contrast', 'Repetition', 'Alignment'], answer: 0 },
  { id: 'q16', area: 'Cybersecurity', q: 'An email from “GCash Support” asks you to log in via a shortened link. You should…', options: ['Log in quickly', 'Forward it to friends', 'Verify through the official app and report it', 'Reply with your OTP'], answer: 2 },
  { id: 'q17', area: 'Cybersecurity', q: 'What does MFA add to a login?', options: ['A longer username', 'A second proof of identity', 'Faster speed', 'Free storage'], answer: 1 },
  { id: 'q18', area: 'Cybersecurity', q: 'Ransomware typically…', options: ['Speeds up your PC', 'Encrypts files and demands payment', 'Cleans viruses', 'Updates drivers'], answer: 1 },
]
