import { getWorkouts } from './storage'
import type { WorkoutSet } from './types'

export interface ExerciseRecord {
  date: string
  exerciseName: string
  sets: { weight?: number; reps?: number; rpe?: number }[]
  bestSet: { weight: number; reps: number }
  totalVolume: number
}

export interface OverloadSuggestion {
  lastWeight: number
  lastReps: number
  lastRPE?: number
  suggestedWeight: number
  suggestedReps: string
  reason: string
}

export function getExerciseHistory(exerciseName: string): ExerciseRecord[] {
  const workouts = getWorkouts().filter(w => w.completed)
  const records: ExerciseRecord[] = []

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      if (exercise.name.toLowerCase() !== exerciseName.toLowerCase()) continue

      const completedSets = exercise.sets.filter(s => s.completed && s.weight && s.actualReps)
      if (completedSets.length === 0) continue

      const sets = completedSets.map(s => ({
        weight: s.weight,
        reps: s.actualReps,
        rpe: s.rpe,
      }))

      let bestWeight = 0
      let bestReps = 0
      let totalVolume = 0

      for (const s of completedSets) {
        const w = s.weight ?? 0
        const r = s.actualReps ?? 0
        totalVolume += w * r
        if (w > bestWeight || (w === bestWeight && r > bestReps)) {
          bestWeight = w
          bestReps = r
        }
      }

      records.push({
        date: workout.date,
        exerciseName: exercise.name,
        sets,
        bestSet: { weight: bestWeight, reps: bestReps },
        totalVolume,
      })
    }
  }

  return records.sort((a, b) => b.date.localeCompare(a.date))
}

export function getLastSession(exerciseName: string): ExerciseRecord | null {
  const history = getExerciseHistory(exerciseName)
  return history[0] ?? null
}

export function suggestOverload(exerciseName: string): OverloadSuggestion | null {
  const last = getLastSession(exerciseName)
  if (!last || last.bestSet.weight === 0) return null

  const { weight, reps } = last.bestSet
  const avgRPE = last.sets.reduce((s, set) => s + (set.rpe ?? 8), 0) / last.sets.length

  // Progressive overload rules:
  // If RPE was ≤7 (had reps in reserve): increase weight by 2.5kg
  // If RPE was 8 (1-2 RIR): try for 1 more rep at same weight
  // If RPE was 9-10 (near/at failure): hold weight, match reps
  // If reps exceeded target range top end: increase weight, drop to bottom of range

  if (avgRPE <= 7) {
    return {
      lastWeight: weight,
      lastReps: reps,
      lastRPE: Math.round(avgRPE),
      suggestedWeight: weight + 2.5,
      suggestedReps: `${reps}`,
      reason: 'RPE was low — increase weight 2.5kg',
    }
  }

  if (avgRPE <= 8) {
    return {
      lastWeight: weight,
      lastReps: reps,
      lastRPE: Math.round(avgRPE),
      suggestedWeight: weight,
      suggestedReps: `${reps + 1}`,
      reason: 'Good effort — aim for 1 more rep',
    }
  }

  if (reps >= 12) {
    return {
      lastWeight: weight,
      lastReps: reps,
      lastRPE: Math.round(avgRPE),
      suggestedWeight: weight + 2.5,
      suggestedReps: `${reps - 2}-${reps}`,
      reason: 'Hit top of range — increase weight, reset reps',
    }
  }

  return {
    lastWeight: weight,
    lastReps: reps,
    lastRPE: Math.round(avgRPE),
    suggestedWeight: weight,
    suggestedReps: `${reps}`,
    reason: 'Match last session — build consistency',
  }
}

export function getPersonalBest(exerciseName: string): { weight: number; reps: number; date: string } | null {
  const history = getExerciseHistory(exerciseName)
  if (history.length === 0) return null

  let best = { weight: 0, reps: 0, date: '' }
  for (const record of history) {
    if (record.bestSet.weight > best.weight ||
      (record.bestSet.weight === best.weight && record.bestSet.reps > best.reps)) {
      best = { ...record.bestSet, date: record.date }
    }
  }

  return best.weight > 0 ? best : null
}
