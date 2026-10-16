// Rule-based recommendation engine (stand-in for a future ML/AI service).
// Inputs: profile skills (self-reported, assessment, and course-earned), career interests,
// preferred locations, completed courses, and application history.

import type { Course, DB, Job, Profile, SkillLevel } from '../types'
import { CAREER_PATHS, type CareerPath } from '../data/careers'

const LEVEL_WEIGHT: Record<SkillLevel, number> = { Beginner: 0.5, Intermediate: 0.8, Advanced: 1 }
const norm = (s: string) => s.trim().toLowerCase()

function skillMap(profile: Profile | undefined) {
  return new Map((profile?.skills ?? []).map((s) => [norm(s.name), s.level]))
}

export interface JobMatch { score: number; matched: string[]; missing: string[] }

export function jobMatch(profile: Profile | undefined, job: Job): JobMatch {
  const skills = skillMap(profile)
  const matched: string[] = []
  const missing: string[] = []
  let points = 0
  job.skills.forEach((s) => {
    const level = skills.get(norm(s))
    if (level) { points += LEVEL_WEIGHT[level]; matched.push(s) } else missing.push(s)
  })
  const skillScore = job.skills.length ? points / job.skills.length : 0
  const interestPaths = CAREER_PATHS.filter((p) => profile?.interests.includes(p.id))
  const interestBonus = interestPaths.some((p) => p.categories.includes(job.category)) ? 0.12 : 0
  const prefs = (profile?.preferredLocations ?? []).map(norm)
  const locBonus = prefs.includes(norm(job.location)) || (job.workSetup === 'Remote' && prefs.includes('remote'))
    || norm(profile?.location ?? '').includes(norm(job.location)) ? 0.06 : 0
  const score = Math.round(Math.min(0.98, 0.12 + skillScore * 0.7 + interestBonus + locBonus) * 100)
  return { score, matched, missing }
}

export interface PathMatch { path: CareerPath; score: number; have: string[]; gaps: string[] }

export function careerPathMatches(profile: Profile | undefined): PathMatch[] {
  const skills = skillMap(profile)
  return CAREER_PATHS.map((path) => {
    // Earlier skills in the list matter more.
    let total = 0
    let earned = 0
    const have: string[] = []
    const gaps: string[] = []
    path.skills.forEach((s, i) => {
      const w = 1 / (1 + i * 0.25)
      total += w
      const lvl = skills.get(norm(s))
      if (lvl) { earned += w * LEVEL_WEIGHT[lvl]; have.push(s) }
      if (!lvl || lvl === 'Beginner') gaps.push(s)
    })
    const interest = profile?.interests.includes(path.id) ? 0.1 : 0
    return { path, score: Math.round(Math.min(0.97, (earned / total) * 0.85 + interest + 0.05) * 100), have, gaps }
  }).sort((a, b) => b.score - a.score)
}

export interface SkillGap { skill: string; current: SkillLevel | null; reason: string }

export function skillGaps(db: DB, userId: string): SkillGap[] {
  const profile = db.profiles.find((p) => p.userId === userId)
  const skills = skillMap(profile)
  const paths = careerPathMatches(profile)
  // Focus on chosen interests first, then best-matching paths.
  const focus = [
    ...paths.filter((p) => profile?.interests.includes(p.path.id)),
    ...paths.filter((p) => !profile?.interests.includes(p.path.id)),
  ].slice(0, 2)
  const gaps = new Map<string, SkillGap>()
  focus.forEach(({ path, gaps: g }) => g.forEach((skill) => {
    if (!gaps.has(skill)) gaps.set(skill, { skill, current: skills.get(norm(skill)) ?? null, reason: `Needed for ${path.title}` })
  }))
  // Weak assessment areas are gaps too.
  const latest = latestAssessment(db, userId)
  latest?.areas.filter((a) => a.level === 'Beginner').forEach((a) => {
    if (!gaps.has(a.area)) gaps.set(a.area, { skill: a.area, current: skills.get(norm(a.area)) ?? null, reason: 'Low score in your skills assessment' })
  })
  return [...gaps.values()].slice(0, 6)
}

export function latestAssessment(db: DB, userId: string) {
  return db.assessments.filter((a) => a.userId === userId).sort((a, b) => b.takenAt.localeCompare(a.takenAt))[0]
}

export function recommendedJobs(db: DB, userId: string, limit = 5) {
  const profile = db.profiles.find((p) => p.userId === userId)
  const applied = new Set(db.applications.filter((a) => a.userId === userId).map((a) => a.jobId))
  return db.jobs
    .filter((j) => j.status === 'published' && !applied.has(j.id) && new Date(j.deadline) > new Date())
    .map((job) => ({ job, match: jobMatch(profile, job) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit)
}

export function recommendedCourses(db: DB, userId: string, limit = 4): { course: Course; reason: string }[] {
  const gaps = skillGaps(db, userId)
  const done = new Set(db.enrollments.filter((e) => e.userId === userId && e.completedAt).map((e) => e.courseId))
  return db.courses
    .filter((c) => c.status === 'published' && !done.has(c.id))
    .map((course) => {
      const covered = course.skills.filter((s) => gaps.some((g) => norm(g.skill) === norm(s)))
      return { course, covered, reason: covered.length ? `Builds ${covered.join(' & ')}` : `Popular in ${course.category}` }
    })
    .sort((a, b) => b.covered.length - a.covered.length)
    .slice(0, limit)
    .map(({ course, reason }) => ({ course, reason }))
}
