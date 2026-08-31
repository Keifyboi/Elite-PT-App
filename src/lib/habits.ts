import type { UserProfile } from './types'
import { calculateMacros } from './nutrition-engine'

export interface HabitDefinition {
  id: string
  label: string
  description: string
  icon: string
}

export interface HabitLog {
  date: string          // YYYY-MM-DD
  completedIds: string[]
}

export function prescribeHabits(profile: UserProfile): HabitDefinition[] {
  const macros = calculateMacros(profile)
  const waterL = profile.goal === 'bulk' ? 4 : 3

  const habits: HabitDefinition[] = [
    {
      id: 'water',
      label: 'Water',
      description: `Drink ${waterL}L today`,
      icon: '💧',
    },
    {
      id: 'steps',
      label: 'Steps',
      description: `${profile.dailyStepTarget.toLocaleString()} steps`,
      icon: '👟',
    },
    {
      id: 'protein',
      label: 'Protein',
      description: `Hit ${macros.protein}g`,
      icon: '🥩',
    },
    {
      id: 'sleep',
      label: 'Sleep 7–9h',
      description: 'Quality sleep tonight',
      icon: '😴',
    },
  ]

  if (profile.goal === 'contest-prep') {
    habits.push({
      id: 'cardio',
      label: 'Cardio',
      description: 'Complete cardio session',
      icon: '🏃',
    })
    habits.push({
      id: 'posing',
      label: 'Posing',
      description: '10 min practice',
      icon: '🏆',
    })
  }

  return habits
}

export function calculateStreak(logs: HabitLog[], habitCount: number): number {
  if (habitCount === 0 || logs.length === 0) return 0

  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const threshold = Math.ceil(habitCount * 0.8)

  const todayLog = logs.find(l => l.date === todayStr)
  const todayComplete = todayLog && todayLog.completedIds.length >= threshold

  let streak = todayComplete ? 1 : 0
  const d = new Date(today)
  d.setDate(d.getDate() - 1)

  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().split('T')[0]
    const log = logs.find(l => l.date === dateStr)
    if (!log || log.completedIds.length < threshold) break
    streak++
    d.setDate(d.getDate() - 1)
  }

  return streak
}
