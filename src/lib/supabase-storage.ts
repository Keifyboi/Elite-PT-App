// src/lib/supabase-storage.ts
// Supabase-backed versions of the same functions in storage.ts
// All functions are async and scoped to the authenticated user

import { getSupabaseClient } from './supabase'
import type { UserProfile, WeeklyCheckIn, MealPlan } from './types'
import type { HabitLog } from './habits'

// ─── Workout log shape for Supabase ───
export interface WorkoutLog {
  date: string
  data: Record<string, unknown>
}

// ─── Auth helper ───
async function getUserId(): Promise<string | null> {
  const { data: { user } } = await getSupabaseClient().auth.getUser()
  return user?.id ?? null
}

// ─── Profile ───

export async function syncProfileToSupabase(profile: UserProfile): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  const row = {
    user_id: userId,
    name: profile.name,
    age: profile.age,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    sex: profile.sex,
    body_fat_percent: profile.bodyFatPercent,
    activity_factor: profile.activityFactor,
    goal: profile.goal,
    training_philosophy: profile.trainingPhilosophy,
    current_phase: profile.currentPhase,
    week_number: profile.weekNumber,
    daily_step_target: profile.dailyStepTarget,
    training_days_per_week: profile.trainingDaysPerWeek,
    occupation: profile.occupation,
    program_start_date: profile.programStartDate ?? null,
    diet_break_active: profile.dietBreakActive ?? false,
    diet_break_start_date: profile.dietBreakStartDate ?? null,
    contest_date: profile.contestDate ?? null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await getSupabaseClient()
    .from('client_profiles')
    .upsert(row, { onConflict: 'user_id' })

  if (error) throw error
}

export async function fetchProfileFromSupabase(): Promise<UserProfile | null> {
  const userId = await getUserId()
  if (!userId) return null

  const { data, error } = await getSupabaseClient()
    .from('client_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  return {
    name: data.name,
    age: data.age,
    heightCm: data.height_cm,
    weightKg: data.weight_kg,
    sex: data.sex,
    bodyFatPercent: data.body_fat_percent,
    activityFactor: data.activity_factor,
    goal: data.goal,
    trainingPhilosophy: data.training_philosophy,
    currentPhase: data.current_phase,
    weekNumber: data.week_number,
    dailyStepTarget: data.daily_step_target,
    trainingDaysPerWeek: data.training_days_per_week,
    occupation: data.occupation,
    programStartDate: data.program_start_date ?? undefined,
    dietBreakActive: data.diet_break_active ?? undefined,
    dietBreakStartDate: data.diet_break_start_date ?? undefined,
  } as UserProfile
}

// ─── Check-ins ───

export async function syncCheckInToSupabase(checkIn: WeeklyCheckIn): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  // check_ins' columns are snake_case and don't line up 1:1 with WeeklyCheckIn's
  // camelCase fields — map explicitly rather than spreading, so a mismatched key
  // doesn't silently make PostgREST reject the whole upsert.
  const row = {
    id: checkIn.id,
    user_id: userId,
    week_number: checkIn.weekNumber,
    date: checkIn.date,
    weight_kg: checkIn.weightKg,
    body_fat_percent: checkIn.bodyFatPercent,
    measurements: checkIn.measurements,
    photos: checkIn.photos,
    subjective: checkIn.subjective,
    macro_adherence: checkIn.macroAdherence,
    training_adherence: checkIn.trainingAdherence,
    meals_per_day: checkIn.mealsPerDay ?? null,
    hunger_rating: checkIn.hungerRating ?? null,
    cravings_level: checkIn.cravingsLevel ?? null,
    alcohol_sessions: checkIn.alcoholSessions ?? null,
    meal_prep_done: checkIn.mealPrepDone ?? null,
    hours_of_sleep: checkIn.hoursOfSleep ?? null,
    injury_niggle: checkIn.injuryNiggle ?? null,
    stretching_done: checkIn.stretchingDone ?? null,
    execution_quality: checkIn.executionQuality ?? null,
    competency_scores: checkIn.competencyScores ?? null,
  }

  const { error } = await getSupabaseClient()
    .from('check_ins')
    .upsert(row, { onConflict: 'id' })

  if (error) throw error
}

export async function fetchCheckInsFromSupabase(): Promise<WeeklyCheckIn[]> {
  const userId = await getUserId()
  if (!userId) return []

  const { data, error } = await getSupabaseClient()
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('week_number', { ascending: false })

  if (error || !data) return []

  // Map snake_case DB columns → camelCase WeeklyCheckIn fields
  return data.map((row) => ({
    id: row.id,
    weekNumber: row.week_number,
    date: row.date,
    weightKg: row.weight_kg,
    bodyFatPercent: row.body_fat_percent,
    measurements: row.measurements ?? {},
    photos: row.photos ?? [],
    subjective: row.subjective ?? { energy: 0, strength: 0, hunger: 0, mood: 0, stress: 0, sleep: 0 },
    macroAdherence: row.macro_adherence ?? 0,
    trainingAdherence: row.training_adherence ?? 0,
    mealsPerDay: row.meals_per_day ?? undefined,
    hungerRating: row.hunger_rating ?? undefined,
    cravingsLevel: row.cravings_level ?? undefined,
    alcoholSessions: row.alcohol_sessions ?? undefined,
    mealPrepDone: row.meal_prep_done ?? undefined,
    hoursOfSleep: row.hours_of_sleep ?? undefined,
    injuryNiggle: row.injury_niggle ?? undefined,
    stretchingDone: row.stretching_done ?? undefined,
    executionQuality: row.execution_quality ?? undefined,
    competencyScores: row.competency_scores ?? undefined,
  } as WeeklyCheckIn))
}

// ─── Workout logs ───

export async function syncWorkoutToSupabase(log: WorkoutLog): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  await getSupabaseClient()
    .from('workout_logs')
    .upsert(
      { user_id: userId, date: log.date, data: log.data, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
}

export async function fetchWorkoutsFromSupabase(): Promise<WorkoutLog[]> {
  const userId = await getUserId()
  if (!userId) return []

  const { data, error } = await getSupabaseClient()
    .from('workout_logs')
    .select('date, data')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error || !data) return []
  return data as WorkoutLog[]
}

// ─── Meal plans ───

export async function syncMealPlanToSupabase(date: string, meals: MealPlan[]): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  await getSupabaseClient()
    .from('meal_plans')
    .upsert(
      { user_id: userId, date, meals, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
}

// ─── Habit logs ───

export async function syncHabitLogToSupabase(date: string, log: HabitLog): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  await getSupabaseClient()
    .from('habit_logs')
    .upsert(
      { user_id: userId, date, completed_ids: log.completedIds, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
}

// ─── Supplement logs ───

export async function syncSupplementLogToSupabase(date: string, itemName: string, taken: boolean): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  await getSupabaseClient()
    .from('supplement_logs')
    .upsert(
      { user_id: userId, date, item_name: itemName, taken, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date,item_name' }
    )
}
