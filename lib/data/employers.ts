import type { Employer } from '../types'

// Fictional Philippine companies (any resemblance to real businesses is coincidental).
export const SEED_EMPLOYERS: (Omit<Employer, 'createdAt'> & { createdDaysAgo: number })[] = [
  {
    id: 'emp-brightpath', name: 'BrightPath Technologies', initials: 'BP', industry: 'IT Services & Consulting',
    location: 'Taguig, Metro Manila', size: '201–500 employees', website: 'brightpath.example.ph', color: '#E4EEFF',
    about: 'BrightPath builds software and managed IT services for Philippine SMEs and LGUs. We hire fresh graduates and train them through our 12-week BrightStart program.',
    verification: 'verified', createdDaysAgo: 420,
  },
  {
    id: 'emp-kalye', name: 'Kalye Labs', initials: 'KL', industry: 'Product Design Studio',
    location: 'Makati, Metro Manila', size: '11–50 employees', website: 'kalyelabs.example.ph', color: '#FDECEC',
    about: 'A small product studio designing mobile apps for Filipino startups — from sari-sari store POS apps to jeepney route planners.',
    verification: 'verified', createdDaysAgo: 300,
  },
  {
    id: 'emp-bayanihan', name: 'Bayanihan Digital Solutions', initials: 'BD', industry: 'Software Development',
    location: 'Quezon City, Metro Manila', size: '51–200 employees', website: 'bayanihandigital.example.ph', color: '#E6F6EC',
    about: 'We build e-commerce and fintech platforms for community cooperatives across Luzon, with a remote-first engineering team.',
    verification: 'verified', createdDaysAgo: 365,
  },
  {
    id: 'emp-mabuhay', name: 'Mabuhay Data Analytics', initials: 'MD', industry: 'Data & Analytics',
    location: 'Pasig, Metro Manila', size: '51–200 employees', website: 'mabuhaydata.example.ph', color: '#FFF4DB',
    about: 'Mabuhay Data helps retail and logistics companies make sense of their numbers through dashboards, forecasting, and analytics consulting.',
    verification: 'verified', createdDaysAgo: 250,
  },
  {
    id: 'emp-tanglaw', name: 'Tanglaw Cyber Defense', initials: 'TC', industry: 'Cybersecurity',
    location: 'Makati, Metro Manila', size: '51–200 employees', website: 'tanglawcyber.example.ph', color: '#EEE9FF',
    about: 'Tanglaw runs a 24/7 security operations center protecting banks, hospitals, and government agencies across the Philippines.',
    verification: 'verified', createdDaysAgo: 200,
  },
  {
    id: 'emp-isla', name: 'Isla Software Studio', initials: 'IS', industry: 'Software Development',
    location: 'Cebu City, Cebu', size: '11–50 employees', website: 'islasoftware.example.ph', color: '#E0F4F7',
    about: 'A Cebu-based studio building web apps for tourism and hospitality businesses in the Visayas.',
    verification: 'verified', createdDaysAgo: 190,
  },
  {
    id: 'emp-batangasbay', name: 'Batangas Bay Logistics', initials: 'BB', industry: 'Logistics',
    location: 'Batangas City, Batangas', size: '201–500 employees', website: 'batangasbay.example.ph', color: '#E4EEFF',
    about: 'Port-side logistics and warehousing serving the Batangas International Port and CALABARZON manufacturers.',
    verification: 'verified', createdDaysAgo: 160,
  },
  {
    id: 'emp-lagunatech', name: 'Laguna Techno Park Services', initials: 'LT', industry: 'Facilities & IT Infrastructure',
    location: 'Santa Rosa, Laguna', size: '51–200 employees', website: 'lagunatps.example.ph', color: '#E6F6EC',
    about: 'Network and facilities support for manufacturing locators inside the Laguna Technopark.',
    verification: 'verified', createdDaysAgo: 140,
  },
  {
    id: 'emp-davaonet', name: 'Davao NetWorks Inc.', initials: 'DN', industry: 'Telecommunications',
    location: 'Davao City, Davao del Sur', size: '51–200 employees', website: 'davaonetworks.example.ph', color: '#FFF4DB',
    about: 'Fiber internet provider for homes and businesses in Davao City, Panabo, and Tagum.',
    verification: 'verified', createdDaysAgo: 120,
  },
  {
    id: 'emp-silangan', name: 'Silangan Digital Marketing', initials: 'SD', industry: 'Marketing & Advertising',
    location: 'Dasmariñas, Cavite', size: '11–50 employees', website: 'silangandigital.example.ph', color: '#FDECEC',
    about: 'A growing agency running social media and search campaigns for Cavite and Laguna businesses.',
    verification: 'pending', createdDaysAgo: 6,
  },
  {
    id: 'emp-habi', name: 'Habi Creative Co.', initials: 'HC', industry: 'Creative Agency',
    location: 'Quezon City, Metro Manila', size: '1–10 employees', website: 'habicreative.example.ph', color: '#EEE9FF',
    about: 'Brand and digital design for Filipino-made products, inspired by traditional weaving patterns.',
    verification: 'pending', createdDaysAgo: 3,
  },
]
