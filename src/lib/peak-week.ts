import type { UserProfile, MealPlan, MacroTargets } from './types'
import { peakWeekMacros, type PeakWeekDayTargets } from './nutrition-engine'
import { generateMealPlan } from './meal-generator'

export interface PeakWeekDay {
  daysOut: number
  label: string // "D-10" … "D-1", "SHOW DAY"
  targets: PeakWeekDayTargets
  mealPlan: MealPlan
}

// Builds the full 11-checkpoint (D-10 → Show Day) Norton peak week protocol,
// reusing the same meal-generation engine every other day in the app uses —
// each day's foods are scaled to that day's Norton-adjusted macro targets.
export function buildPeakWeekProtocol(profile: UserProfile, normalMacros: MacroTargets): PeakWeekDay[] {
  const days: PeakWeekDay[] = []

  for (let daysOut = 10; daysOut >= 0; daysOut--) {
    const targets = peakWeekMacros(normalMacros, daysOut)
    const mealPlan = generateMealPlan(
      targets,
      'contest-prep',
      profile.trainingPhilosophy,
      profile.currentPhase,
      true // peak week days all carry some training/cardio stimulus per the Norton protocol
    )

    days.push({
      daysOut,
      label: daysOut === 0 ? 'SHOW DAY' : `D-${daysOut}`,
      targets,
      mealPlan,
    })
  }

  return days
}
