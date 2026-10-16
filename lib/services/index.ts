// Service layer. UI talks to these instead of touching mock data directly,
// so each one can be replaced with a real API client later.
export { AuthService } from './auth'
export { JobService, EMPTY_FILTERS, validateJob, type JobFilters, type JobInput } from './jobs'
export { ApplicationService, formatSlot, type InterviewInput } from './applications'
export { CourseService, AssessmentService, courseProgress } from './learning'
export { ProfileService } from './profile'
export { NotificationService, SettingsService } from './notifications'
export { EmployerService, AdminService } from './admin'
export { ResumeService } from './resume'
export * as Recommendations from './recommendations'
export { ServiceError } from './core'
