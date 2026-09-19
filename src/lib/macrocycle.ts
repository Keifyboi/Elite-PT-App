import type { UserProfile, TrainingBlock, BodybuildingPhilosophy, MacrocyclePhase, PosePriorityArea } from './types'
import { getTrainingBlockHistory, saveTrainingBlock } from './storage'
import { MACROCYCLE_COVERAGE } from './pose-priority'

// Cycle length in weeks per philosophy. Y3T is the exception to the generic
// 4-week wave — its own 3-week heavy/moderate/annihilation rotation IS its
// periodization (block-wave.ts).
const CYCLE_LENGTH_WEEKS: Record<BodybuildingPhilosophy, number> = {
  y3t: 3,
  mi40: 4,
  fst7: 4,
  phat: 4,
  'corey-g': 4,
}

// How many days before the show Prep & Peak begins, and how many of those
// final days switch to FST-7 for a fullness/pump window. Not specified
// numerically in the spec — a judgment call, flagged for correction.
const PREP_AND_PEAK_WINDOW_DAYS = 56 // 8 weeks out
const PREP_AND_PEAK_FST7_WINDOW_DAYS = 7

interface SequenceStep {
  philosophy: BodybuildingPhilosophy
  macrocyclePhase: MacrocyclePhase
  cycles: number
}

// The macrocycle walk. Recomposition's Corey-G repeats indefinitely (its
// length is need-based, not fixed) until a contest date pulls the athlete
// into Prep & Peak.
const MACROCYCLE_SEQUENCE: SequenceStep[] = [
  { philosophy: 'y3t', macrocyclePhase: 'hypertrophy-1', cycles: 1 },
  { philosophy: 'fst7', macrocyclePhase: 'hypertrophy-1', cycles: 1 },
  { philosophy: 'mi40', macrocyclePhase: 'hypertrophy-1', cycles: 1 },
  { philosophy: 'mi40', macrocyclePhase: 'hypertrophy-2', cycles: 2 },
  { philosophy: 'phat', macrocyclePhase: 'hypertrophy-2', cycles: 1 },
  { philosophy: 'corey-g', macrocyclePhase: 'recomposition', cycles: 1 },
]

function daysBetween(startDate: string, end: Date): number {
  const start = new Date(startDate + 'T12:00:00')
  const endMid = new Date(end)
  endMid.setHours(12, 0, 0, 0)
  return Math.floor((endMid.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
}

function weekFromDays(days: number): number {
  return Math.max(1, Math.floor(days / 7) + 1)
}

function dedicatedAreasFor(philosophy: BodybuildingPhilosophy): PosePriorityArea[] {
  return (Object.keys(MACROCYCLE_COVERAGE) as PosePriorityArea[]).filter(area =>
    MACROCYCLE_COVERAGE[area].servedBy.includes(philosophy)
  )
}

export interface ActiveBlockInfo {
  block: TrainingBlock | null
  weekInBlock: number
  cycleNumber: number
  weekInCycle: number
}

export function getActiveBlock(
  profile: UserProfile,
  history: TrainingBlock[] = getTrainingBlockHistory()
): ActiveBlockInfo {
  const active = [...history].sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null
  if (!active) return { block: null, weekInBlock: 1, cycleNumber: 1, weekInCycle: 1 }

  const weekInBlock = weekFromDays(daysBetween(active.startDate, new Date()))
  const cycleLen = CYCLE_LENGTH_WEEKS[active.philosophy]
  const cycleNumber = Math.max(1, Math.ceil(weekInBlock / cycleLen))
  const weekInCycle = ((weekInBlock - 1) % cycleLen) + 1

  return { block: active, weekInBlock, cycleNumber, weekInCycle }
}

export interface MacrocycleRecommendation {
  shouldSwitch: boolean
  nextPhilosophy: BodybuildingPhilosophy
  nextMacrocyclePhase: MacrocyclePhase
  cycleCount: number
  reason: string
}

export function evaluateMacrocycleProgression(
  profile: UserProfile,
  history: TrainingBlock[] = getTrainingBlockHistory()
): MacrocycleRecommendation {
  const { block, cycleNumber } = getActiveBlock(profile, history)

  if (!block) {
    const first = MACROCYCLE_SEQUENCE[0]
    return {
      shouldSwitch: true,
      nextPhilosophy: first.philosophy,
      nextMacrocyclePhase: first.macrocyclePhase,
      cycleCount: first.cycles,
      reason: 'Starting the macrocycle: Hypertrophy I — Y3T block 1 of 3',
    }
  }

  // Prep & Peak is contest-date driven, not sequence-driven — it can
  // interrupt any macrocycle phase.
  if (profile.contestDate) {
    const daysToShow = daysBetween(new Date().toISOString().split('T')[0], new Date(profile.contestDate + 'T12:00:00'))
    if (daysToShow >= 0 && daysToShow <= PREP_AND_PEAK_WINDOW_DAYS) {
      const inFinalWindow = daysToShow <= PREP_AND_PEAK_FST7_WINDOW_DAYS
      const wantPhilosophy: BodybuildingPhilosophy = inFinalWindow ? 'fst7' : 'mi40'
      const alreadyThere = block.macrocyclePhase === 'prep-and-peak' && block.philosophy === wantPhilosophy
      return alreadyThere
        ? { shouldSwitch: false, nextPhilosophy: block.philosophy, nextMacrocyclePhase: block.macrocyclePhase, cycleCount: block.cycleCount, reason: 'Prep & Peak — on track' }
        : {
            shouldSwitch: true,
            nextPhilosophy: wantPhilosophy,
            nextMacrocyclePhase: 'prep-and-peak',
            cycleCount: 1,
            reason: inFinalWindow
              ? 'Prep & Peak: final week — FST-7 fullness/pump window'
              : 'Prep & Peak: MI40 for the remainder of the prep window',
          }
    }
  }

  const blockComplete = cycleNumber > block.cycleCount
  if (!blockComplete) {
    return {
      shouldSwitch: false,
      nextPhilosophy: block.philosophy,
      nextMacrocyclePhase: block.macrocyclePhase,
      cycleCount: block.cycleCount,
      reason: `${block.macrocyclePhase} — ${block.philosophy} cycle ${cycleNumber} of ${block.cycleCount}`,
    }
  }

  // Block finished — advance to the next step in the sequence, or repeat
  // the last step (Recomposition/Corey-G loops until a contest date appears).
  const idx = MACROCYCLE_SEQUENCE.findIndex(
    s => s.philosophy === block.philosophy && s.macrocyclePhase === block.macrocyclePhase
  )
  const next = MACROCYCLE_SEQUENCE[idx + 1] ?? MACROCYCLE_SEQUENCE[MACROCYCLE_SEQUENCE.length - 1]

  return {
    shouldSwitch: true,
    nextPhilosophy: next.philosophy,
    nextMacrocyclePhase: next.macrocyclePhase,
    cycleCount: next.cycles,
    reason: `Block complete — advancing to ${next.macrocyclePhase}: ${next.philosophy}`,
  }
}

export function startNextBlockIfDue(profile: UserProfile): TrainingBlock | null {
  const history = getTrainingBlockHistory()
  const rec = evaluateMacrocycleProgression(profile, history)
  if (!rec.shouldSwitch) return null

  const block: TrainingBlock = {
    id: crypto.randomUUID(),
    philosophy: rec.nextPhilosophy,
    macrocyclePhase: rec.nextMacrocyclePhase,
    cycleCount: rec.cycleCount,
    startDate: new Date().toISOString().split('T')[0],
    dedicatedPoseAreas: dedicatedAreasFor(rec.nextPhilosophy),
  }
  saveTrainingBlock(block)
  return block
}
