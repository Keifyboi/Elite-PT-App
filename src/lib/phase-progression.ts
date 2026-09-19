import type { UserProfile, WeeklyCheckIn, MacroTargets, TrainingPhilosophy } from './types'
import { getPhases, getNextPhase, getCurrentPhase } from './philosophy-engine'
import { getY3TWeek } from './block-wave'

// ─── Phase switch recommendation ───

export interface PhaseRecommendation {
  shouldSwitch: boolean
  currentPhase: string
  recommendedPhase: string
  reasons: string[]
  adjustments: Adjustment[]
  urgency: 'info' | 'warning' | 'action'
}

export interface Adjustment {
  type: 'carbs' | 'fats' | 'calories' | 'cardio' | 'volume' | 'steps'
  direction: 'increase' | 'decrease'
  amount: string
  reason: string
}

// ─── IB: Growth ↔ Reset switching criteria (from IB Main Book) ───

function evaluateIBPhase(profile: UserProfile, checkIns: WeeklyCheckIn[]): PhaseRecommendation {
  const current = profile.currentPhase
  const recent = checkIns.slice(0, 4)
  const latest = recent[0]
  const previous = recent[1]

  const base: PhaseRecommendation = {
    shouldSwitch: false,
    currentPhase: current,
    recommendedPhase: current,
    reasons: [],
    adjustments: [],
    urgency: 'info',
  }

  if (!latest) return base

  if (current.toLowerCase().includes('growth')) {
    const reasons: string[] = []

    // BF% gain check: >2% above starting BF for this growth block
    const startBf = recent[recent.length - 1]?.bodyFatPercent ?? latest.bodyFatPercent
    if (latest.bodyFatPercent - startBf >= 2) {
      reasons.push(`Body fat up ${(latest.bodyFatPercent - startBf).toFixed(1)}% — exceeds 2% threshold`)
    }

    // Subjective signals
    if (latest.subjective.energy <= 4) reasons.push('Energy crashing — possible insulin resistance')
    if (latest.subjective.mood <= 4) reasons.push('Mood swings detected')
    if (latest.subjective.sleep <= 4) reasons.push('Sleep quality declining')

    // Weight gain stalling (should be 1-2% BW per 5 days during growth)
    if (previous) {
      const weeklyGain = latest.weightKg - previous.weightKg
      if (weeklyGain < 0.1) {
        reasons.push('Weight gain stalled — growth window may be closing')
      }
    }

    // Males >15% BF = hard switch
    if (profile.sex === 'male' && latest.bodyFatPercent > 15) {
      reasons.push('Body fat exceeds 15% male threshold — must reset')
    }
    if (profile.sex === 'female' && latest.bodyFatPercent > 23) {
      reasons.push('Body fat exceeds 23% female threshold — must reset')
    }

    if (reasons.length >= 2) {
      return {
        shouldSwitch: true,
        currentPhase: current,
        recommendedPhase: 'Transition',
        reasons,
        adjustments: [],
        urgency: 'action',
      }
    }

    if (reasons.length === 1) {
      return { ...base, reasons, urgency: 'warning' }
    }

    return base
  }

  if (current.toLowerCase().includes('reset') || current.toLowerCase().includes('transition')) {
    const reasons: string[] = []

    // Weight loss stalling
    if (previous) {
      const weeklyLoss = previous.weightKg - latest.weightKg
      if (weeklyLoss < 0.1) {
        reasons.push('Weight loss stalled — glycogen likely depleted')
      }
    }

    // Subjective: energy tanking, pumps gone
    if (latest.subjective.energy <= 3) reasons.push('Energy very low — diet fatigue')
    if (latest.subjective.strength <= 4) reasons.push('Strength declining — recovery compromised')

    // BF% check: if back near starting lean point
    if (profile.sex === 'male' && latest.bodyFatPercent <= 12) {
      reasons.push('Body fat at or below 12% — ready to grow')
    }
    if (profile.sex === 'female' && latest.bodyFatPercent <= 20) {
      reasons.push('Body fat at or below 20% — ready to grow')
    }

    if (reasons.length >= 2) {
      return {
        shouldSwitch: true,
        currentPhase: current,
        recommendedPhase: 'Growth',
        reasons,
        adjustments: [],
        urgency: 'action',
      }
    }

    if (reasons.length === 1) {
      return { ...base, reasons, urgency: 'warning' }
    }

    return base
  }

  return base
}

// ─── Contest Prep: Norton's 2-of-3 stall rule ───

function evaluateContestPrep(profile: UserProfile, checkIns: WeeklyCheckIn[]): PhaseRecommendation {
  const recent = checkIns.slice(0, 3)
  const base: PhaseRecommendation = {
    shouldSwitch: false,
    currentPhase: profile.currentPhase,
    recommendedPhase: profile.currentPhase,
    reasons: [],
    adjustments: [],
    urgency: 'info',
  }

  if (recent.length < 2) return base

  const latest = recent[0]
  const prev = recent[1]
  const prevPrev = recent[2]

  // Calculate target weekly loss (0.6% BW/week default)
  const targetLoss = profile.weightKg * 0.006

  // Stall indicators
  let stallCount = 0
  const reasons: string[] = []

  // 1. Weight not dropping
  const weightLoss = prev.weightKg - latest.weightKg
  if (weightLoss < targetLoss * 0.5) {
    stallCount++
    reasons.push(`Weight loss ${weightLoss.toFixed(2)}kg — below 50% of target (${targetLoss.toFixed(2)}kg)`)
  }

  // 2. Body fat not dropping
  const bfDrop = prev.bodyFatPercent - latest.bodyFatPercent
  if (bfDrop <= 0) {
    stallCount++
    reasons.push(`Body fat unchanged at ${latest.bodyFatPercent}%`)
  }

  // 3. Photos (we approximate with subjective "strength" as proxy for visible progress)
  if (latest.subjective.strength <= prev.subjective.strength && latest.subjective.energy <= prev.subjective.energy) {
    stallCount++
    reasons.push('Subjective scores flat or declining — likely no visible change')
  }

  // Check for 2 consecutive stalls
  const twoWeekStall = prevPrev && (prev.weightKg - prevPrev.weightKg > -targetLoss * 0.5)

  if (stallCount >= 2) {
    const adjustments: Adjustment[] = []

    // First plateau: 5% carb/fat reduction + 10% cardio increase
    adjustments.push({
      type: 'carbs', direction: 'decrease', amount: '5%',
      reason: 'Norton plateau protocol: start conservative',
    })
    adjustments.push({
      type: 'fats', direction: 'decrease', amount: '5%',
      reason: 'Matched carb reduction',
    })
    adjustments.push({
      type: 'cardio', direction: 'increase', amount: '10%',
      reason: 'Add 1 session or 5 min to existing',
    })
    adjustments.push({
      type: 'steps', direction: 'increase', amount: '1000',
      reason: 'Increase daily steps by 1000',
    })

    return {
      shouldSwitch: false,
      currentPhase: profile.currentPhase,
      recommendedPhase: profile.currentPhase,
      reasons,
      adjustments,
      urgency: twoWeekStall ? 'action' : 'warning',
    }
  }

  // Rate approaching 1% BW/week — get more aggressive
  if (weightLoss > profile.weightKg * 0.009) {
    return {
      ...base,
      reasons: ['Rate of loss approaching 1% BW/week — consider slowing deficit to preserve muscle'],
      urgency: 'warning',
    }
  }

  // Check if diet break is due (no more than 4 weeks without one)
  if (checkIns.length >= 4 && profile.weekNumber % 4 === 0) {
    return {
      ...base,
      reasons: ['4 weeks in deficit — consider a 1-2 week diet break at maintenance (MATADOR protocol)'],
      adjustments: [{
        type: 'calories', direction: 'increase', amount: 'to maintenance',
        reason: 'Diet break: recalculate maintenance using Muller equation at current weight',
      }],
      urgency: 'info',
    }
  }

  return base
}

// ─── Y3T: Fixed 3-week rotation ───

function evaluateY3T(profile: UserProfile): PhaseRecommendation {
  const weekInCycle = getY3TWeek(profile.weekNumber).weekInCycle
  const phases = getPhases('y3t')
  const currentIdx = phases.findIndex(p => p.name === profile.currentPhase)
  const expectedIdx = weekInCycle - 1

  if (currentIdx !== expectedIdx && phases[expectedIdx]) {
    return {
      shouldSwitch: true,
      currentPhase: profile.currentPhase,
      recommendedPhase: phases[expectedIdx].name,
      reasons: [`Y3T auto-rotation: Week ${weekInCycle} of 3-week cycle`],
      adjustments: [],
      urgency: 'action',
    }
  }

  return {
    shouldSwitch: false,
    currentPhase: profile.currentPhase,
    recommendedPhase: profile.currentPhase,
    reasons: [`Y3T Week ${weekInCycle}/3 — on track`],
    adjustments: [],
    urgency: 'info',
  }
}

// ─── Bompa: Duration-based phase progression with step-loading ───

function evaluateBompa(profile: UserProfile): PhaseRecommendation {
  const phases = getPhases('bompa')
  const current = getCurrentPhase('bompa', profile.currentPhase)
  if (!current) {
    return {
      shouldSwitch: true,
      currentPhase: profile.currentPhase,
      recommendedPhase: phases[0]?.name ?? '',
      reasons: ['Phase not found — starting from Anatomical Adaptation'],
      adjustments: [],
      urgency: 'action',
    }
  }

  // Step-loading within mesocycle: Week 4 of every block is a deload
  const weekInPhase = ((profile.weekNumber - 1) % Math.ceil(current.durationWeeks)) + 1
  const isDeload = weekInPhase % 4 === 0

  if (weekInPhase > current.durationWeeks) {
    const next = getNextPhase('bompa', profile.currentPhase)
    return {
      shouldSwitch: true,
      currentPhase: profile.currentPhase,
      recommendedPhase: next?.name ?? phases[0].name,
      reasons: [`Completed ${current.durationWeeks} weeks of ${current.name} — progress to next phase`],
      adjustments: [],
      urgency: 'action',
    }
  }

  const loadLabel = isDeload ? 'DELOAD week' : weekInPhase === 3 ? 'Peak shock week' : weekInPhase === 2 ? 'High load week' : 'Medium load week'

  return {
    shouldSwitch: false,
    currentPhase: profile.currentPhase,
    recommendedPhase: profile.currentPhase,
    reasons: [`${current.name} — Week ${weekInPhase}/${Math.ceil(current.durationWeeks)} — ${loadLabel}`],
    adjustments: isDeload ? [{
      type: 'volume', direction: 'decrease', amount: '40%',
      reason: 'Step-loading deload: reduce volume, maintain intensity',
    }] : [],
    urgency: isDeload ? 'warning' : 'info',
  }
}

// ─── MI40: Phase progression through 7 phases ───

function evaluateMI40(profile: UserProfile, checkIns: WeeklyCheckIn[]): PhaseRecommendation {
  const current = getCurrentPhase('mi40', profile.currentPhase)
  if (!current) {
    return {
      shouldSwitch: true,
      currentPhase: profile.currentPhase,
      recommendedPhase: 'Phase 1-2 (High Frequency)',
      reasons: ['Starting MI40 program'],
      adjustments: [],
      urgency: 'action',
    }
  }

  const weekInPhase = ((profile.weekNumber - 1) % Math.ceil(current.durationWeeks)) + 1

  if (weekInPhase > current.durationWeeks) {
    const next = getNextPhase('mi40', profile.currentPhase)
    return {
      shouldSwitch: true,
      currentPhase: profile.currentPhase,
      recommendedPhase: next?.name ?? 'Phase 1-2 (High Frequency)',
      reasons: [`Completed ${current.name} — advancing to next MI40 phase`],
      adjustments: [],
      urgency: 'action',
    }
  }

  return {
    shouldSwitch: false,
    currentPhase: profile.currentPhase,
    recommendedPhase: profile.currentPhase,
    reasons: [`${current.name} — Week ${weekInPhase}/${Math.ceil(current.durationWeeks)}`],
    adjustments: [],
    urgency: 'info',
  }
}

// ─── Generic: duration-based for DTP, FST-7, HIT, PHAT, Corey G ───

function evaluateGenericPhase(profile: UserProfile, philosophy: TrainingPhilosophy): PhaseRecommendation {
  const current = getCurrentPhase(philosophy, profile.currentPhase)
  const phases = getPhases(philosophy)

  if (!current && phases.length > 0) {
    return {
      shouldSwitch: true,
      currentPhase: profile.currentPhase,
      recommendedPhase: phases[0].name,
      reasons: ['Starting program'],
      adjustments: [],
      urgency: 'action',
    }
  }

  if (!current) {
    return { shouldSwitch: false, currentPhase: profile.currentPhase, recommendedPhase: profile.currentPhase, reasons: [], adjustments: [], urgency: 'info' }
  }

  const weekInPhase = ((profile.weekNumber - 1) % Math.ceil(current.durationWeeks)) + 1

  if (weekInPhase > current.durationWeeks) {
    const next = getNextPhase(philosophy, profile.currentPhase)
    return {
      shouldSwitch: true,
      currentPhase: profile.currentPhase,
      recommendedPhase: next?.name ?? phases[0].name,
      reasons: [`Completed ${Math.ceil(current.durationWeeks)} weeks — time to progress`],
      adjustments: [],
      urgency: 'action',
    }
  }

  return {
    shouldSwitch: false,
    currentPhase: profile.currentPhase,
    recommendedPhase: profile.currentPhase,
    reasons: [`${current.name} — Week ${weekInPhase}/${Math.ceil(current.durationWeeks)}`],
    adjustments: [],
    urgency: 'info',
  }
}

// ─── Main evaluator: routes to the right philosophy's logic ───

export function evaluatePhaseProgression(
  profile: UserProfile,
  checkIns: WeeklyCheckIn[]
): PhaseRecommendation {
  const sorted = [...checkIns].sort((a, b) => b.weekNumber - a.weekNumber)

  switch (profile.trainingPhilosophy) {
    case 'incredible-bulk':
      return evaluateIBPhase(profile, sorted)
    case 'contest-prep':
      return evaluateContestPrep(profile, sorted)
    case 'y3t':
      return evaluateY3T(profile)
    case 'bompa':
      return evaluateBompa(profile)
    case 'mi40':
      return evaluateMI40(profile, sorted)
    default:
      return evaluateGenericPhase(profile, profile.trainingPhilosophy)
  }
}

// ─── Apply macro adjustments from a recommendation ───

export function applyAdjustments(currentMacros: MacroTargets, adjustments: Adjustment[]): MacroTargets {
  let { calories, protein, carbs, fats, fiber } = { ...currentMacros }

  for (const adj of adjustments) {
    const pct = parseFloat(adj.amount) / 100
    if (isNaN(pct)) continue

    if (adj.type === 'carbs') {
      const change = Math.round(carbs * pct)
      carbs = adj.direction === 'decrease' ? carbs - change : carbs + change
    }
    if (adj.type === 'fats') {
      const change = Math.round(fats * pct)
      fats = adj.direction === 'decrease' ? fats - change : fats + change
    }
    if (adj.type === 'calories') {
      if (adj.amount === 'to maintenance') continue
      const change = Math.round(calories * pct)
      calories = adj.direction === 'decrease' ? calories - change : calories + change
    }
  }

  calories = protein * 4 + carbs * 4 + fats * 9

  return { calories, protein, carbs: Math.max(carbs, 20), fats: Math.max(fats, 20), fiber }
}
