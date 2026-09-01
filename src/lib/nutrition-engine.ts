import type { UserProfile, MacroTargets, CarbCycleDay, CompetitionDivision } from './types'
import { DIVISIONS } from './data/divisions'

// ─── BMR Formulas ───

export function bmrMifflinStJeor(weightKg: number, heightCm: number, age: number, sex: 'male' | 'female'): number {
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age)
  return sex === 'male' ? base + 5 : base - 161
}

export function bmrKatchMcArdle(lbmKg: number): number {
  return 21.6 * lbmKg + 370
}

export function bmrMuller(lbmKg: number, fatMassKg: number, age: number, sex: 'male' | 'female'): number {
  const sexVal = sex === 'male' ? 1 : 0
  return (13.587 * lbmKg) + (9.613 * fatMassKg) + (198 * sexVal) - (3.351 * age) + 674
}

// ─── Body Composition ───

export function calculateLBM(weightKg: number, bodyFatPercent: number): number {
  return weightKg * (1 - bodyFatPercent / 100)
}

export function calculateFatMass(weightKg: number, bodyFatPercent: number): number {
  return weightKg * (bodyFatPercent / 100)
}

// ─── TDEE ───

export function calculateTDEE(bmr: number, activityFactor: number): number {
  return bmr * activityFactor
}

// ─── Deficit / Surplus ───

export function weeklyDeficitFromWeightLoss(weeklyLossKg: number): number {
  return weeklyLossKg * 7700
}

export function dailyDeficit(weeklyLossKg: number): number {
  return weeklyLossKg * 1100
}

// ─── Protein Targets (Norton age-adjusted) ───

export function proteinTarget(lbmKg: number, age: number, inDeficit: boolean): number {
  let basePer = 1.8
  if (age > 30) basePer += (age - 30) * 0.015
  if (age > 60) basePer = Math.min(basePer, 3.2)
  if (inDeficit) basePer += 0.4
  return Math.round(lbmKg * basePer)
}

// ─── Activity Level Determination ───

export function determineActivityFactor(
  occupation: 'sedentary' | 'light-active' | 'active' | 'very-active',
  trainingDaysPerWeek: number,
  dailySteps: number
): 1.2 | 1.375 | 1.55 | 1.725 | 1.9 {
  const occupationScore: Record<string, number> = {
    'sedentary': 0, 'light-active': 1, 'active': 2, 'very-active': 3,
  }
  const stepScore = dailySteps < 5000 ? 0 : dailySteps < 8000 ? 1 : dailySteps < 12000 ? 2 : 3
  const trainingScore = trainingDaysPerWeek <= 2 ? 0 : trainingDaysPerWeek <= 4 ? 1 : trainingDaysPerWeek <= 5 ? 2 : 3
  const total = occupationScore[occupation] + stepScore + trainingScore
  if (total <= 1) return 1.2
  if (total <= 3) return 1.375
  if (total <= 5) return 1.55
  if (total <= 7) return 1.725
  return 1.9
}

export function stepsToCalories(steps: number, weightKg: number): number {
  return Math.round(steps * 0.04 * weightKg / 80)
}

export function recommendedSteps(goal: 'bulk' | 'cut' | 'maintain' | 'contest-prep'): number {
  switch (goal) {
    case 'bulk': return 8000
    case 'cut': return 10000
    case 'contest-prep': return 12000
    default: return 8000
  }
}

// ─── Macro Calculator ───

export function calculateMacros(profile: UserProfile): MacroTargets {
  const lbm = calculateLBM(profile.weightKg, profile.bodyFatPercent)
  const fatMass = calculateFatMass(profile.weightKg, profile.bodyFatPercent)
  const bmr = bmrMuller(lbm, fatMass, profile.age, profile.sex)

  const activityFactor = profile.occupation
    ? determineActivityFactor(profile.occupation, profile.trainingDaysPerWeek ?? 5, profile.dailyStepTarget ?? 8000)
    : profile.activityFactor

  const tdee = calculateTDEE(bmr, activityFactor)

  const inDeficit = profile.goal === 'cut' || profile.goal === 'contest-prep'
  const protein = proteinTarget(lbm, profile.age, inDeficit)
  const proteinCals = protein * 4

  let targetCals: number
  switch (profile.goal) {
    case 'bulk':
      targetCals = tdee + 500
      break
    case 'cut':
      targetCals = tdee - dailyDeficit(profile.weightKg * 0.006)
      break
    case 'contest-prep':
      targetCals = tdee - dailyDeficit(profile.weightKg * 0.007)
      break
    default:
      targetCals = tdee
  }

  const remainingCals = targetCals - proteinCals
  const carbRatio = inDeficit ? 0.5 : 0.6
  const fatRatio = 1 - carbRatio

  const carbCals = remainingCals * carbRatio
  const fatCals = remainingCals * fatRatio

  const carbs = Math.round(carbCals / 4)
  const fats = Math.round(fatCals / 9)
  const fiber = Math.round((targetCals / 1000) * 12)

  const finalCarbs = Math.max(carbs, 30)
  const finalFats = Math.max(fats, Math.round(targetCals * 0.2 / 9))
  const finalCalories = protein * 4 + finalCarbs * 4 + finalFats * 9

  return {
    calories: finalCalories,
    protein,
    carbs: finalCarbs,
    fats: finalFats,
    fiber,
  }
}

// ─── Incredible Bulk Phase Macros ───

export function incredibleBulkMacros(
  lbmLbs: number,
  phase: 'growth' | 'transition' | 'reset',
  metabolism: 'slow' | 'average' | 'fast'
): MacroTargets {
  const calPerLb: Record<string, Record<string, number>> = {
    growth: { slow: 18, average: 21, fast: 24 },
    reset: { slow: 14, average: 16, fast: 18 },
    transition: { slow: 14, average: 16, fast: 18 },
  }

  const calsPerLbm = calPerLb[phase][metabolism]
  let totalCals = lbmLbs * calsPerLbm

  if (phase === 'growth') totalCals += 1000

  const splits: Record<string, { p: number; c: number; f: number }> = {
    growth: { p: 0.35, c: 0.45, f: 0.20 },
    transition: { p: 0.40, c: 0.00, f: 0.60 },
    reset: { p: 0.50, c: 0.15, f: 0.35 },
  }

  const s = splits[phase]
  const protein = Math.round((totalCals * s.p) / 4)
  const carbs = Math.round((totalCals * s.c) / 4)
  const fats = Math.round((totalCals * s.f) / 9)
  return {
    calories: protein * 4 + carbs * 4 + fats * 9,
    protein,
    carbs,
    fats,
    fiber: Math.round((totalCals / 1000) * 12),
  }
}

// ─── Carb Cycling ───

export type CarbCyclePattern =
  | 'none'
  | 'high-low'           // alternating high/low around training days
  | 'high-med-low'       // 3-tier rotation
  | 'refeed-weekly'      // 6 low + 1 refeed (Norton protocol)
  | 'refeed-biweekly'    // 3 low + 1 refeed repeating
  | 'contest-prep'       // deficit days + strategic refeeds
  | 'ib-transition'      // IB 2-day fat load (zero carb)

function buildDay(protein: number, carbs: number, fats: number, fiber: number, dayType: CarbCycleDay['dayType']): CarbCycleDay {
  const calories = protein * 4 + carbs * 4 + fats * 9
  return { dayType, macros: { calories, protein, carbs, fats, fiber }, mealDistribution: {} }
}

export function generateCarbCycle(
  baseMacros: MacroTargets,
  pattern: CarbCyclePattern,
  trainingDays: boolean[] = [true, true, false, true, true, true, false],
  dayTypes?: NutritionDayType[]
): CarbCycleDay[] {
  const { protein, carbs, fats, fiber } = baseMacros
  const types = dayTypes ?? trainingDays.map(td => td ? 'training' as const : 'rest' as const)

  if (pattern === 'none') {
    return types.map(() => buildDay(protein, carbs, fats, fiber, 'medium'))
  }

  let result: CarbCycleDay[] | null = null

  // ─── High/Low: training days get more carbs, rest/HIIT get adjusted ───
  if (pattern === 'high-low') {
    result = types.map(dt => {
      if (dt === 'training') return buildDay(protein, Math.round(carbs * 1.3), Math.round(fats * 0.8), fiber, 'high')
      if (dt === 'hiit') return buildDay(protein, Math.round(carbs * 0.8), Math.round(fats * 1.1), fiber, 'medium')
      return buildDay(protein, Math.round(carbs * 0.6), Math.round(fats * 1.3), fiber, 'low')
    })
  }

  // ─── High/Med/Low ───
  if (!result && pattern === 'high-med-low') {
    let highCount = 0
    result = types.map(dt => {
      if (dt === 'rest') return buildDay(protein, Math.round(carbs * 0.5), Math.round(fats * 1.4), fiber, 'low')
      if (dt === 'hiit') return buildDay(protein, Math.round(carbs * 0.7), Math.round(fats * 1.2), fiber, 'medium')
      if (highCount < 2) { highCount++; return buildDay(protein, Math.round(carbs * 1.4), Math.round(fats * 0.7), fiber, 'high') }
      return buildDay(protein, carbs, fats, fiber, 'medium')
    })
  }

  // ─── Weekly refeed: place refeed on Saturday (post-hardest-week), rest are deficit ───
  if (!result && pattern === 'refeed-weekly') {
    const weeklyTarget = baseMacros.calories * 7
    const refeedProtein = Math.round(protein * 0.85)
    const refeedFats = fats
    const refeedCals = Math.round(weeklyTarget / 7 * 1.3)
    const refeedCarbs = Math.round((refeedCals - refeedProtein * 4 - refeedFats * 9) / 4)
    const lowCals = Math.round((weeklyTarget - refeedCals) / 6)
    const lowCarbs = Math.round((lowCals - protein * 4 - fats * 9) / 4)

    // Find the best refeed day: Saturday (index 5) for IB Reset, or last HIIT/training day
    const refeedIdx = 5

    result = types.map((dt, i) => {
      if (i === refeedIdx) {
        return buildDay(refeedProtein, Math.max(refeedCarbs, 50), refeedFats, fiber + 5, 'refeed')
      }
      // Training days: standard deficit
      if (dt === 'training') {
        return buildDay(protein, Math.max(lowCarbs, 30), fats, fiber, 'low')
      }
      // HIIT days: slightly less carbs, slightly more fat
      if (dt === 'hiit') {
        return buildDay(protein, Math.max(Math.round(lowCarbs * 0.8), 20), Math.round(fats * 1.1), fiber, 'low')
      }
      // Rest days: lowest carbs, highest fats
      return buildDay(protein, Math.max(Math.round(lowCarbs * 0.7), 20), Math.round(fats * 1.2), fiber, 'low')
    })
  }

  // ─── Biweekly refeed ───
  if (!result && pattern === 'refeed-biweekly') {
    const weeklyTarget = baseMacros.calories * 7
    const refeedCals = Math.round(weeklyTarget / 7 * 1.25)
    const refeedProtein = Math.round(protein * 0.85)
    const refeedCarbs = Math.round((refeedCals - refeedProtein * 4 - fats * 9) / 4)
    const lowCals = Math.round((weeklyTarget - refeedCals * 2) / 5)
    const lowCarbs = Math.round((lowCals - protein * 4 - fats * 9) / 4)

    result = types.map((dt, i) => {
      if (i === 3 || i === 6) return buildDay(refeedProtein, Math.max(refeedCarbs, 50), fats, fiber + 5, 'refeed')
      if (dt === 'rest') return buildDay(protein, Math.max(Math.round(lowCarbs * 0.7), 20), Math.round(fats * 1.2), fiber, 'low')
      return buildDay(protein, Math.max(lowCarbs, 30), fats, fiber, 'low')
    })
  }

  // ─── Contest prep ───
  if (!result && pattern === 'contest-prep') {
    const weeklyTarget = baseMacros.calories * 7
    const refeedProtein = Math.round(protein * 0.9)
    const refeedCals = Math.round(weeklyTarget / 7 * 1.2)
    const refeedCarbs = Math.round((refeedCals - refeedProtein * 4 - fats * 9) / 4)
    const lowCals = Math.round((weeklyTarget - refeedCals) / 6)
    const lowCarbs = Math.round((lowCals - protein * 4 - fats * 9) / 4)

    result = types.map((dt, i) => {
      if (i === 3) return buildDay(refeedProtein, Math.max(refeedCarbs, 50), fats, fiber + 5, 'refeed')
      if (dt === 'training') return buildDay(protein, Math.max(Math.round(lowCarbs * 1.15), 30), fats, fiber, 'medium')
      if (dt === 'hiit') return buildDay(protein, Math.max(lowCarbs, 30), fats, fiber, 'low')
      return buildDay(protein, Math.max(Math.round(lowCarbs * 0.85), 20), Math.round(fats * 1.1), fiber, 'low')
    })
  }

  // ─── IB Transition ───
  if (!result && pattern === 'ib-transition') {
    const transitionFats = Math.round(fats * 2)
    return types.map(() => buildDay(protein, 0, transitionFats, fiber, 'low'))
  }

  if (!result) {
    return types.map(() => buildDay(protein, carbs, fats, fiber, 'medium'))
  }

  return normalizeWeeklyCalories(result, baseMacros)
}

function normalizeWeeklyCalories(days: CarbCycleDay[], baseMacros: MacroTargets): CarbCycleDay[] {
  const targetWeekly = baseMacros.calories * 7
  const actualWeekly = days.reduce((sum, d) => sum + d.macros.calories, 0)
  if (actualWeekly === 0 || targetWeekly === 0) return days
  const diff = targetWeekly - actualWeekly
  if (Math.abs(diff) < 7) return days

  // Only adjust NON-REFEED days — refeed days must preserve their prescribed profile
  const adjustable = days.filter(d => d.dayType !== 'refeed')
  const totalCarbs = adjustable.reduce((sum, d) => sum + d.macros.carbs, 0)
  if (totalCarbs === 0) return days

  const carbGramDiff = diff / 4

  for (const day of adjustable) {
    const proportion = day.macros.carbs / totalCarbs
    const adjustment = Math.round(carbGramDiff * proportion)
    day.macros.carbs = Math.max(day.macros.carbs + adjustment, 20)
    day.macros.calories = day.macros.protein * 4 + day.macros.carbs * 4 + day.macros.fats * 9
  }

  return days
}

export function getCarbCyclePatterns(goal: string, philosophy: string): { id: CarbCyclePattern; label: string; desc: string }[] {
  const patterns: { id: CarbCyclePattern; label: string; desc: string }[] = [
    { id: 'none', label: 'No Cycling', desc: 'Same macros every day' },
    { id: 'high-low', label: 'High / Low', desc: 'High carbs on training days, low on rest days' },
    { id: 'high-med-low', label: 'High / Med / Low', desc: '3-tier: heavy day high, moderate day med, rest day low' },
  ]

  if (goal === 'cut' || goal === 'contest-prep') {
    patterns.push(
      { id: 'refeed-weekly', label: 'Weekly Refeed', desc: '6 deficit days + 1 refeed at maintenance (Norton)' },
      { id: 'refeed-biweekly', label: 'Twice-Weekly Refeed', desc: '3 low + 1 refeed repeating (aggressive deficit)' },
    )
  }

  if (goal === 'contest-prep') {
    patterns.push(
      { id: 'contest-prep', label: 'Contest Prep', desc: 'Progressive deficit + strategic refeed on leg day' },
    )
  }

  if (philosophy === 'incredible-bulk') {
    patterns.push(
      { id: 'ib-transition', label: 'IB Transition', desc: '2-day zero-carb fat load between Growth and Reset' },
    )
  }

  return patterns
}

// ─── Auto-prescribe: picks the optimal protocol based on profile ───

export function prescribeCarbCycle(
  goal: string,
  philosophy: string,
  phase: string,
  bodyFatPercent: number,
  sex: 'male' | 'female'
): { pattern: CarbCyclePattern; reason: string } {
  const phaseL = phase.toLowerCase()

  // ─── Philosophy-specific overrides ───

  // IB Transition: always zero-carb fat load
  if (phaseL.includes('transition') && philosophy === 'incredible-bulk') {
    return { pattern: 'ib-transition', reason: 'IB Transition phase — 2-day zero-carb fat load to shift metabolism to fat-burning' }
  }

  // DTP: steady carbs all day — Gethin rejects carb cycling, clean consistent intake
  if (philosophy === 'dtp') {
    return { pattern: 'none', reason: 'DTP protocol — steady, consistent carb intake across all meals and all days. No cycling.' }
  }

  // FST-7: consistently high carbs — Rambod forbids low carb during growth (fascia can\'t stretch without glycogen)
  if (philosophy === 'fst7') {
    if (goal === 'cut') {
      return { pattern: 'refeed-weekly', reason: 'FST-7 cut — weekly refeed to maintain muscle fullness for fascia stretching. Carbs stay high relative to other cut protocols.' }
    }
    return { pattern: 'none', reason: 'FST-7 — consistently high carbs required for maximal pump and fascia expansion. No cycling.' }
  }

  // HIT: heavy surplus, simple approach — Yates ate big, consistently
  if (philosophy === 'hit') {
    if (goal === 'cut') {
      return { pattern: 'refeed-weekly', reason: 'HIT cut — weekly refeed to maintain training intensity. Recovery is everything with HIT.' }
    }
    return { pattern: 'high-low', reason: 'HIT — higher carbs on training days to fuel maximum intensity, slightly lower on rest days for the 3 recovery days.' }
  }

  // Y3T: carb cycling matches the 3-week rotation
  if (philosophy === 'y3t') {
    if (phaseL.includes('annihilation') || phaseL.includes('week 3')) {
      return { pattern: 'none', reason: 'Y3T Week 3 — high carbs every day. Massive rep ranges + giant sets completely deplete glycogen, need aggressive repletion.' }
    }
    if (phaseL.includes('heavy') || phaseL.includes('week 1')) {
      return { pattern: 'high-low', reason: 'Y3T Week 1 — higher carbs on heavy training days for CNS fuel, higher fats on rest days for joint support.' }
    }
    return { pattern: 'high-low', reason: 'Y3T Week 2 — moderate cycling, carbs slightly increased vs Week 1 to fuel expanding volume.' }
  }

  // Bompa: matches energy system demands
  if (philosophy === 'bompa') {
    if (phaseL.includes('conversion') || phaseL.includes('power')) {
      return { pattern: 'none', reason: 'Bompa Power phase — massive carb loading (60-70% of calories) to fuel explosive work. No cycling.' }
    }
    if (phaseL.includes('maximum') || phaseL.includes('strength')) {
      return { pattern: 'high-low', reason: 'Bompa Max Strength — carbs on training days for ATP-CP system, reduced on rest days (volume is low).' }
    }
    return { pattern: 'high-low', reason: 'Bompa — carbs matched to training demands, higher on training days, lower on rest.' }
  }

  // Corey G: G-Flux — massive intake every day, no cycling needed
  if (philosophy === 'corey-g') {
    return { pattern: 'none', reason: 'G-Flux — massive caloric throughput every day. Training 7 days/week burns off any excess. No cycling needed.' }
  }

  // ─── Goal-based defaults (IB, MI40, PHAT, Contest Prep) ───

  if (goal === 'contest-prep' || philosophy === 'contest-prep') {
    return { pattern: 'contest-prep', reason: 'Contest prep — progressive deficit with strategic refeed on your hardest training day (Norton protocol)' }
  }

  if (goal === 'cut') {
    const lean = (sex === 'male' && bodyFatPercent <= 12) || (sex === 'female' && bodyFatPercent <= 20)
    if (lean) {
      return { pattern: 'refeed-biweekly', reason: 'Already lean — twice-weekly refeeds to prevent metabolic adaptation and maintain training performance' }
    }
    return { pattern: 'refeed-weekly', reason: 'Cutting phase — weekly refeed to restore leptin and glycogen after the hardest training week' }
  }

  if (goal === 'bulk') {
    return { pattern: 'high-low', reason: 'Bulking — high carbs on training days to fuel performance, lower on rest days to limit fat gain' }
  }

  return { pattern: 'high-low', reason: 'Maintenance — cycling carbs around training days for optimal nutrient partitioning' }
}

export type NutritionDayType = 'training' | 'hiit' | 'rest'

export function prescribeTrainingDays(philosophy: string, phase: string): boolean[] {
  return prescribeNutritionDayTypes(philosophy, phase).map(t => t !== 'rest')
}

export function prescribeNutritionDayTypes(philosophy: string, phase: string): NutritionDayType[] {
  const phaseL = phase.toLowerCase()

  // ─── IB / MI40 ───
  if (philosophy === 'incredible-bulk') {
    if (phaseL.includes('transition')) return ['rest', 'rest', 'rest', 'rest', 'rest', 'rest', 'rest']
    if (phaseL.includes('reset')) return ['training', 'hiit', 'training', 'training', 'training', 'hiit', 'rest']
    return ['training', 'training', 'rest', 'training', 'training', 'training', 'rest'] // Growth
  }

  if (philosophy === 'mi40') {
    if (phaseL.includes('phase 5') || phaseL.includes('deload'))
      return ['training', 'training', 'training', 'rest', 'rest', 'rest', 'rest'] // 3-day deload
    if (phaseL.includes('phase 6') || phaseL.includes('overreach'))
      return ['training', 'training', 'training', 'training', 'training', 'training', 'rest'] // 6-day overreach
    return ['training', 'training', 'training', 'training', 'training', 'rest', 'rest'] // Phase 1-3: 5-day
  }

  // ─── DTP: 5 training days, steady carbs throughout ───
  if (philosophy === 'dtp')
    return ['training', 'training', 'training', 'training', 'training', 'rest', 'rest']

  // ─── Y3T: 5 days with mid-week rest ───
  if (philosophy === 'y3t')
    return ['training', 'training', 'rest', 'training', 'training', 'rest', 'rest']

  // ─── FST-7: 5 training days ───
  if (philosophy === 'fst7')
    return ['training', 'training', 'training', 'training', 'training', 'rest', 'rest']

  // ─── HIT: 5 training days (was 4, now 5-day split) ───
  if (philosophy === 'hit')
    return ['training', 'training', 'training', 'training', 'training', 'rest', 'rest']

  // ─── PHAT: 5 days with rest day mid-week (classic PHAT structure) ───
  if (philosophy === 'phat')
    return ['training', 'training', 'rest', 'training', 'training', 'training', 'rest']

  // ─── Bompa: phase-dependent ───
  if (philosophy === 'bompa') {
    if (phaseL.includes('anatomical') || phaseL.includes('adaptation'))
      return ['training', 'training', 'training', 'training', 'training', 'rest', 'rest']
    if (phaseL.includes('maximum') || phaseL.includes('strength'))
      return ['training', 'rest', 'training', 'rest', 'training', 'training', 'rest'] // heavier needs more recovery
    if (phaseL.includes('conversion') || phaseL.includes('power'))
      return ['training', 'rest', 'training', 'rest', 'training', 'rest', 'rest'] // explosive needs most recovery
    return ['training', 'training', 'training', 'training', 'training', 'rest', 'rest'] // Hypertrophy
  }

  // ─── Corey G: every day is a training day ───
  if (philosophy === 'corey-g')
    return ['training', 'training', 'training', 'training', 'training', 'training', 'training']

  // ─── Contest Prep: phase-dependent ───
  if (philosophy === 'contest-prep') {
    if (phaseL.includes('peak'))
      return ['training', 'training', 'training', 'rest', 'rest', 'rest', 'rest'] // peak week: less training
    return ['training', 'training', 'rest', 'training', 'training', 'training', 'rest'] // PHAT-style
  }

  return ['training', 'training', 'rest', 'training', 'training', 'training', 'rest']
}

// ─── Contest Prep Timeline ───

export function contestPrepTimeline(
  currentWeightKg: number,
  currentBfPercent: number,
  targetBfPercent: number,
  rateOfLossPercent: number = 0.6
): { weeksRequired: number; weeklyLossKg: number; totalLossKg: number; dailyDeficit: number } {
  const fatMassLoss = currentWeightKg * ((currentBfPercent - targetBfPercent) / 100)
  const totalLoss = fatMassLoss / 0.713
  const weeklyLoss = currentWeightKg * (rateOfLossPercent / 100)
  const weeks = Math.ceil(totalLoss / weeklyLoss)
  const deficit = weeklyLoss * 1100

  return {
    weeksRequired: weeks,
    weeklyLossKg: Math.round(weeklyLoss * 100) / 100,
    totalLossKg: Math.round(totalLoss * 100) / 100,
    dailyDeficit: Math.round(deficit),
  }
}

// ─── Peak Week Protocol (Norton) ───
// Source: Layne Norton & Peter Baker — The Complete Contest Prep Guide
// (BioLayne LLC, 2018). One universal 10-day curve applies to every division —
// only the stage target body fat % (see data/divisions.ts) varies by division.

interface PeakWeekMultiplier {
  p: number
  c: number
  f: number
  sodiumMultiplier: number
  fibreTarget: string
  waterTarget: string
  trainingNote: string
  cardioNote: string
}

const NORTON_PEAK_WEEK: Record<number, PeakWeekMultiplier> = {
  10: { p: 1.0, c: 0.7, f: 0.7, sodiumMultiplier: 1.3, fibreTarget: '30+ g', waterTarget: '4 L', trainingNote: 'Normal + LISS', cardioNote: '1 LISS session' },
  9: { p: 1.0, c: 0.7, f: 0.7, sodiumMultiplier: 1.3, fibreTarget: '30+ g', waterTarget: '4 L', trainingNote: 'Normal + LISS', cardioNote: '1 LISS session' },
  8: { p: 1.0, c: 0.7, f: 0.7, sodiumMultiplier: 1.3, fibreTarget: '30+ g', waterTarget: '4 L', trainingNote: 'Normal + LISS', cardioNote: '1 LISS session' },
  7: { p: 0.9, c: 1.0, f: 1.0, sodiumMultiplier: 1.2, fibreTarget: '25–30 g', waterTarget: '4 L', trainingNote: 'Normal', cardioNote: 'None' },
  6: { p: 0.9, c: 1.0, f: 1.0, sodiumMultiplier: 1.2, fibreTarget: '25–30 g', waterTarget: '4 L', trainingNote: 'Normal', cardioNote: 'None' },
  5: { p: 0.8, c: 2.5, f: 1.6, sodiumMultiplier: 1.0, fibreTarget: '15–20 g', waterTarget: '4 L', trainingNote: 'Legs + HIIT', cardioNote: 'HIIT session' },
  4: { p: 0.85, c: 1.9, f: 1.3, sodiumMultiplier: 1.0, fibreTarget: '15–20 g', waterTarget: '4 L', trainingNote: 'Normal', cardioNote: 'None' },
  3: { p: 0.9, c: 1.3, f: 1.0, sodiumMultiplier: 1.0, fibreTarget: '10–15 g', waterTarget: '4 L', trainingNote: 'Moderate + LISS', cardioNote: '1 LISS session' },
  2: { p: 0.95, c: 0.7, f: 0.7, sodiumMultiplier: 1.0, fibreTarget: '5–10 g', waterTarget: '4 L', trainingNote: 'Circuit', cardioNote: 'None' },
  1: { p: 1.0, c: 1.0, f: 1.0, sodiumMultiplier: 1.0, fibreTarget: '<10 g', waterTarget: '4 L', trainingNote: 'Circuit', cardioNote: 'None' },
  0: { p: 0.7, c: 2.25, f: 1.45, sodiumMultiplier: 1.3, fibreTarget: '<5 g', waterTarget: 'Sip post-pump only', trainingNote: 'Pump only', cardioNote: 'None' },
}

export interface PeakWeekDayTargets extends MacroTargets {
  sodiumMultiplier: number
  fibreTarget: string
  waterTarget: string
  trainingNote: string
  cardioNote: string
}

export function peakWeekMacros(normalMacros: MacroTargets, daysOut: number): PeakWeekDayTargets {
  const mult = NORTON_PEAK_WEEK[daysOut] ?? NORTON_PEAK_WEEK[1]

  const protein = Math.round(normalMacros.protein * mult.p)
  const carbs = Math.round(normalMacros.carbs * mult.c)
  const fats = Math.round(normalMacros.fats * mult.f)

  return {
    protein,
    carbs,
    fats,
    calories: protein * 4 + carbs * 4 + fats * 9,
    fiber: normalMacros.fiber,
    sodiumMultiplier: mult.sodiumMultiplier,
    fibreTarget: mult.fibreTarget,
    waterTarget: mult.waterTarget,
    trainingNote: mult.trainingNote,
    cardioNote: mult.cardioNote,
  }
}

// ─── Division-specific stage target body fat % (SETUP!C19) ───

export function getDivisionTargetBodyFat(division: CompetitionDivision): number {
  return DIVISIONS[division].targetStageBodyFatPercent
}
