import type { UserProfile, WorkoutDay, MealPlan, WeeklyCheckIn, SupplementLog, TrainingBlock } from './types'
import type { HabitLog } from './habits'
import { syncProfileToSupabase, syncCheckInToSupabase } from './supabase-storage'

export const SCHEMA_VERSION = 2

const KEYS = {
  profile: 'elitept_profile',
  workouts: 'elitept_workouts',
  meals: 'elitept_meals',
  checkins: 'elitept_checkins',
  habits: 'elitept_habits',
  trainingBlocks: 'elitept_training_blocks',
} as const

function get<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

// ─── Profile ───
export function getProfile(): UserProfile | null {
  const raw = get<UserProfile>(KEYS.profile)
  if (!raw) return null

  // Schema migration: backfill fields absent in older stored data
  let dirty = false
  const migrated = { ...raw }

  if (migrated.occupation === undefined) { migrated.occupation = 'sedentary'; dirty = true }
  if (migrated.dailyStepTarget === undefined) { migrated.dailyStepTarget = 8000; dirty = true }
  if (migrated.trainingDaysPerWeek === undefined) { migrated.trainingDaysPerWeek = 5; dirty = true }
  if (!('programStartDate' in migrated)) { (migrated as Record<string, unknown>).programStartDate = undefined; dirty = true }
  if ((migrated as Record<string, unknown>).schemaVersion === undefined) {
    (migrated as Record<string, unknown>).schemaVersion = SCHEMA_VERSION
    dirty = true
  }

  if (dirty) set(KEYS.profile, migrated)
  return migrated
}

export function saveProfile(profile: UserProfile): void {
  set(KEYS.profile, profile)
  // localStorage is the source of truth and always wins; this just keeps the
  // coach-portal-facing copy in Supabase current. Fire-and-forget, but logged
  // (not silently swallowed) so a broken sync surfaces instead of quietly
  // leaving the coach portal empty, as previously happened.
  syncProfileToSupabase(profile).catch(err => console.error('Supabase profile sync failed:', err))
}

// Resets training progression to week 1 on a fresh block/phase, anchored to
// today. Local-only: this device's localStorage is the sole source of truth
// (Supabase only ever receives a one-way backup sync) — clears logged
// workouts and training-block history so old dates don't linger against a
// program that now says "week 1". Leaves check-ins, meals, and habits
// untouched — those are a separate history, not part of "starting over".
export function resetTrainingProgress(startingPhaseName: string): void {
  const profile = getProfile()
  if (!profile) return

  const today = new Date().toISOString().split('T')[0]
  saveProfile({
    ...profile,
    weekNumber: 1,
    currentPhase: startingPhaseName,
    programStartDate: today,
  })
  set(KEYS.workouts, [])
  set(KEYS.trainingBlocks, [])
}

// ─── Workouts ───
export function getWorkouts(): WorkoutDay[] {
  return get<WorkoutDay[]>(KEYS.workouts) ?? []
}

export function saveWorkout(workout: WorkoutDay): void {
  const all = getWorkouts()
  const idx = all.findIndex(w => w.id === workout.id)
  if (idx >= 0) {
    all[idx] = workout
  } else {
    all.push(workout)
  }
  set(KEYS.workouts, all)
}

export function getTodayWorkout(): WorkoutDay | undefined {
  const today = new Date().toISOString().split('T')[0]
  return getWorkouts().find(w => w.date === today)
}

// ─── Meals ───
export function getMealPlans(): MealPlan[] {
  return get<MealPlan[]>(KEYS.meals) ?? []
}

export function saveMealPlan(plan: MealPlan): void {
  const all = getMealPlans()
  // Replace by date (one plan per date), not by ID
  const idx = all.findIndex(m => m.date === plan.date)
  if (idx >= 0) {
    all[idx] = plan
  } else {
    all.push(plan)
  }
  set(KEYS.meals, all)
}

export function getTodayMealPlan(): MealPlan | undefined {
  const today = new Date().toISOString().split('T')[0]
  return getMealPlans().find(m => m.date === today)
}

export function getMealPlanByDate(date: string): MealPlan | undefined {
  return getMealPlans().find(m => m.date === date)
}

export function getWorkoutByDate(date: string): WorkoutDay | undefined {
  return getWorkouts().find(w => w.date === date)
}

export function clearWeekMealPlans(): void {
  const weekDates = getWeekDates()
  const all = getMealPlans().filter(m => !weekDates.includes(m.date))
  set(KEYS.meals, all)
}

const SUPP_LOGS_KEY = 'elitept_supp_logs'

export function getSupplementLogs(): SupplementLog[] {
  try { return JSON.parse(localStorage.getItem(SUPP_LOGS_KEY) || '[]') } catch { return [] }
}

export function toggleSupplementLog(date: string, itemName: string): void {
  const logs = getSupplementLogs()
  const existing = logs.find(l => l.date === date && l.itemName === itemName)
  if (existing) {
    existing.taken = !existing.taken
  } else {
    logs.push({ date, itemName, taken: true })
  }
  localStorage.setItem(SUPP_LOGS_KEY, JSON.stringify(logs))
}

export function getWeekDates(programStartDate?: string): string[] {
  // Use program start date from profile if available, otherwise next Monday
  const profile = programStartDate ? null : get<UserProfile>(KEYS.profile)
  const startStr = programStartDate ?? profile?.programStartDate

  let weekStart: Date

  if (startStr) {
    // Calculate which week we're in based on program start date
    const programStart = new Date(startStr + 'T12:00:00')
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const daysSinceStart = Math.floor((today.getTime() - programStart.getTime()) / (24 * 60 * 60 * 1000))
    const currentWeekOffset = Math.max(0, Math.floor(daysSinceStart / 7)) * 7
    weekStart = new Date(programStart)
    weekStart.setDate(programStart.getDate() + currentWeekOffset)
  } else {
    // Fallback: next Monday from today
    const today = new Date()
    const dow = today.getDay()
    const offset = dow === 0 ? -6 : 1 - dow
    weekStart = new Date(today)
    weekStart.setDate(today.getDate() + offset)
  }

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

// ─── Week number (derived from programStartDate, not stored) ───
export function getCurrentWeekNumber(profile: UserProfile): number {
  if (!profile.programStartDate) return profile.weekNumber
  const start = new Date(profile.programStartDate + 'T12:00:00')
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const days = Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  return Math.max(1, Math.floor(days / 7) + 1)
}

// ─── Training Blocks (bodybuilding program builder) ───
// Written by the Stage 2 block generator; the plumbing lands now so
// Stage 3's macrocycle coverage check has history to read.
export function getTrainingBlockHistory(): TrainingBlock[] {
  return get<TrainingBlock[]>(KEYS.trainingBlocks) ?? []
}

export function saveTrainingBlock(block: TrainingBlock): void {
  const all = getTrainingBlockHistory()
  const idx = all.findIndex(b => b.id === block.id)
  if (idx >= 0) all[idx] = block
  else all.push(block)
  set(KEYS.trainingBlocks, all)
}

// ─── Habits ───
export function getHabitLogs(): HabitLog[] {
  return get<HabitLog[]>(KEYS.habits) ?? []
}

export function getHabitLogForDate(date: string): HabitLog | undefined {
  return getHabitLogs().find(h => h.date === date)
}

export function saveHabitLog(log: HabitLog): void {
  const all = getHabitLogs()
  const idx = all.findIndex(h => h.date === log.date)
  if (idx >= 0) all[idx] = log
  else all.push(log)
  set(KEYS.habits, all)
}

// ─── Check-ins ───
export function getCheckIns(): WeeklyCheckIn[] {
  return get<WeeklyCheckIn[]>(KEYS.checkins) ?? []
}

// ─── Export ───
export function exportAllData(): string {
  return JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    profile: getProfile(),
    workouts: getWorkouts(),
    meals: getMealPlans(),
    checkins: getCheckIns(),
    habits: getHabitLogs(),
  }, null, 2)
}

// ─── Rolling competency score (21-day / last 3 check-ins) ───
export function getRollingCompetencyScore(): number | null {
  const checkins = getCheckIns()
  const sorted = [...checkins].sort((a, b) => b.weekNumber - a.weekNumber)
  const recent = sorted.slice(0, 3).filter(c => c.competencyScores)
  if (recent.length < 2) return null
  const totals = recent.map(c => {
    const s = c.competencyScores!
    return s.nutrition + s.training + s.recovery + s.mindset + s.consistency
  })
  return totals.reduce((a, b) => a + b, 0) / totals.length
}

// ─── 12-week Goal Review trigger (SOP-04) ───
export function isGoalReviewDue(): boolean {
  const profile = getProfile()
  if (!profile || !profile.weekNumber) return false
  if (profile.weekNumber <= 0 || profile.weekNumber % 12 !== 0) return false
  const dismissed = Number(localStorage.getItem('ao_goal_review_dismissed_week') || 0)
  return profile.weekNumber !== dismissed
}

export function saveCheckIn(checkin: WeeklyCheckIn): void {
  const all = getCheckIns()
  const idx = all.findIndex(c => c.id === checkin.id)
  if (idx >= 0) {
    all[idx] = checkin
  } else {
    all.push(checkin)
  }
  set(KEYS.checkins, all)
  syncCheckInToSupabase(checkin).catch(err => console.error('Supabase check-in sync failed:', err))
}
