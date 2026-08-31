import type { TrainingPhilosophy, UserProfile } from './types'
import { getPhases, getPhilosophyLabel } from './philosophy-engine'
import { calculateMacros, calculateLBM, prescribeCarbCycle, recommendedSteps, determineActivityFactor } from './nutrition-engine'

export interface PrescribedStrategy {
  philosophy: TrainingPhilosophy
  philosophyLabel: string
  startingPhase: string
  goal: 'bulk' | 'cut' | 'maintain' | 'contest-prep'
  reasoning: string[]
  warnings: string[]
  macros: { calories: number; protein: number; carbs: number; fats: number; fiber: number }
  carbCyclePattern: string
  carbCycleReason: string
  stepsTarget: number
  trainingDaysPerWeek: number
  estimatedDuration: string
}

export function prescribeStrategy(
  age: number,
  sex: 'male' | 'female',
  heightCm: number,
  weightKg: number,
  bodyFatPercent: number,
  goal: 'bulk' | 'cut' | 'maintain' | 'contest-prep',
  occupation: 'sedentary' | 'light-active' | 'active' | 'very-active'
): PrescribedStrategy {
  const lbm = calculateLBM(weightKg, bodyFatPercent)
  const reasoning: string[] = []
  const warnings: string[] = []

  let philosophy: TrainingPhilosophy
  let startingPhase: string
  let trainingDaysPerWeek: number
  let estimatedDuration: string

  const isMale = sex === 'male'
  const isLean = isMale ? bodyFatPercent <= 12 : bodyFatPercent <= 20
  const isMidRange = isMale ? bodyFatPercent <= 15 : bodyFatPercent <= 23
  const isHighBF = !isMidRange

  // ─── Contest Prep ───
  if (goal === 'contest-prep') {
    philosophy = 'contest-prep'
    startingPhase = 'Early Prep (20+ weeks out)'
    trainingDaysPerWeek = 5

    const fatToLose = weightKg * ((bodyFatPercent - (isMale ? 5 : 10)) / 100)
    const totalLoss = fatToLose / 0.713
    const weeklyLoss = weightKg * 0.006
    const weeks = Math.ceil(totalLoss / weeklyLoss)
    estimatedDuration = `${weeks} weeks to stage (at 0.6% BW/week)`

    reasoning.push(`Contest prep selected — Norton/Baker evidence-based protocol`)
    reasoning.push(`Current BF ${bodyFatPercent}% → target ~${isMale ? '4-6' : '10-13'}% (stage lean)`)
    reasoning.push(`Estimated ${weeks} weeks at conservative loss rate to preserve maximum muscle`)
    reasoning.push(`Includes diet breaks every 4 weeks (MATADOR protocol) and strategic refeeds`)

    if (isHighBF) {
      warnings.push(`Starting above ${isMale ? '15' : '23'}% — consider a pre-prep cut first to avoid an excessively long prep`)
    }
  }

  // ─── Cut ───
  else if (goal === 'cut') {
    philosophy = 'incredible-bulk'

    if (isHighBF) {
      startingPhase = 'Reset'
      trainingDaysPerWeek = 5
      estimatedDuration = '6-10 weeks in Reset, then reassess'

      reasoning.push(`Body fat at ${bodyFatPercent}% — above the ${isMale ? '15' : '23'}% threshold`)
      reasoning.push(`Starting with Incredible Bulk Reset phase to restore insulin sensitivity and strip fat`)
      reasoning.push(`Higher protein (50/15/35 split), density-based training with NOS/NOS-X intensifiers`)
      reasoning.push(`HIIT cardio 3x/week to accelerate fat loss without burning muscle`)
      reasoning.push(`Once you're under ${isMale ? '12' : '20'}%, we switch to Growth phase for lean gains`)
    } else {
      startingPhase = 'Reset'
      trainingDaysPerWeek = 5
      estimatedDuration = '2-4 weeks Reset, then cycle into Growth'

      reasoning.push(`Body fat at ${bodyFatPercent}% — already in a good range`)
      reasoning.push(`Short Reset phase to sharpen up, then cycle into Growth for lean muscle`)
      reasoning.push(`The IB cyclical approach prevents metabolic adaptation from extended dieting`)
      reasoning.push(`Each cycle (Growth → Reset) you start and finish leaner than the last`)
    }
  }

  // ─── Bulk ───
  else if (goal === 'bulk') {
    philosophy = 'incredible-bulk'

    if (isLean) {
      startingPhase = 'Growth'
      trainingDaysPerWeek = 6
      estimatedDuration = '3-4 weeks Growth, then Transition + Reset, repeat'

      reasoning.push(`Body fat at ${bodyFatPercent}% — lean enough to maximise a growth phase`)
      reasoning.push(`Starting with Incredible Bulk Growth phase — caloric surplus, high carbs, high frequency training`)
      reasoning.push(`Macro split: 35P / 45C / 20F with +1000 cal surplus`)
      reasoning.push(`When BF reaches ~${isMale ? '14-15' : '22-23'}%, we cycle through Transition → Reset to strip the fat, then grow again`)
      reasoning.push(`Each cycle adds more lean mass with less fat — the IB cyclical advantage`)
    } else if (isMidRange) {
      startingPhase = 'Reset'
      trainingDaysPerWeek = 5
      estimatedDuration = '2-3 weeks Reset to lean out, then Growth'

      reasoning.push(`Body fat at ${bodyFatPercent}% — slightly above optimal for a bulk`)
      reasoning.push(`Short Reset first to get under ${isMale ? '12' : '20'}%, then Growth phase starts from a lean base`)
      reasoning.push(`Starting lean = better insulin sensitivity = more muscle, less fat during the bulk`)

      warnings.push(`Never bulk above ${isMale ? '15' : '23'}% — aromatase increases, nutrient partitioning worsens`)
    } else {
      startingPhase = 'Reset'
      trainingDaysPerWeek = 5
      estimatedDuration = '6-10 weeks Reset first, then Growth'

      reasoning.push(`Body fat at ${bodyFatPercent}% — too high to start bulking`)
      reasoning.push(`Must cut to ${isMale ? '10-12' : '18-20'}% before entering a Growth phase`)
      reasoning.push(`Reset phase: deficit, density training, HIIT cardio`)
      reasoning.push(`Once lean, the Growth phase will be far more effective — insulin sensitivity primed for muscle gain`)

      warnings.push(`Starting a bulk above ${isMale ? '15' : '23'}% leads to excess fat gain and hormonal issues`)
    }
  }

  // ─── Maintain ───
  else {
    if (isLean) {
      philosophy = 'phat'
      startingPhase = 'PHAT Block'
      trainingDaysPerWeek = 5
      estimatedDuration = '8-week blocks, ongoing'

      reasoning.push(`Maintenance at ${bodyFatPercent}% — you're in a great spot`)
      reasoning.push(`PHAT (Power Hypertrophy Adaptive Training) for strength + size maintenance`)
      reasoning.push(`2 power days (heavy compounds, 3-5 reps) + 3 hypertrophy days (8-15 reps)`)
      reasoning.push(`Maintenance calories with high carbs and leucine-threshold protein meals`)
    } else {
      philosophy = 'incredible-bulk'
      startingPhase = 'Reset'
      trainingDaysPerWeek = 5
      estimatedDuration = '4-6 weeks Reset, then reassess'

      reasoning.push(`Body fat at ${bodyFatPercent}% — a brief Reset will improve body composition at maintenance`)
      reasoning.push(`Once leaner, we can hold maintenance with better nutrient partitioning`)
    }
  }

  // Build the profile to calculate macros
  const activityFactor = determineActivityFactor(occupation, trainingDaysPerWeek, recommendedSteps(goal))
  const tempProfile: UserProfile = {
    name: '',
    age,
    sex,
    heightCm,
    weightKg,
    bodyFatPercent,
    activityFactor,
    goal,
    trainingPhilosophy: philosophy,
    currentPhase: startingPhase,
    weekNumber: 1,
    dailyStepTarget: recommendedSteps(goal),
    trainingDaysPerWeek,
    occupation,
  }

  const macros = calculateMacros(tempProfile)
  const carbCycle = prescribeCarbCycle(goal, philosophy, startingPhase, bodyFatPercent, sex)

  // Age-specific notes
  if (age > 40) {
    reasoning.push(`Age ${age} — protein targets increased to account for anabolic resistance (Norton age-adjusted formula)`)
  }

  return {
    philosophy,
    philosophyLabel: getPhilosophyLabel(philosophy),
    startingPhase,
    goal,
    reasoning,
    warnings,
    macros,
    carbCyclePattern: carbCycle.pattern,
    carbCycleReason: carbCycle.reason,
    stepsTarget: recommendedSteps(goal),
    trainingDaysPerWeek,
    estimatedDuration,
  }
}
