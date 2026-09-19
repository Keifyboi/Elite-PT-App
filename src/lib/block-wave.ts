import type { WaveWeek } from './types'

// ─── Generic 4-week wave (MI40 / FST-7 / PHAT / Corey-G) ───
// Not yet wired into any generator — that's Stage 2. Y3T is deliberately
// excluded: its own 3-week heavy/moderate/light rotation (below) IS its
// periodization, and doesn't nest cleanly inside a 4-week cycle.

const GENERIC_WAVE: Record<1 | 2 | 3 | 4, WaveWeek> = {
  1: { stage: 'accumulation', volumeMultiplier: 1.0, repRangeLabel: '10-12 / 12-15', rir: [2, 3] },
  2: { stage: 'intensification', volumeMultiplier: 0.9, repRangeLabel: '6-8 / 8-10', rir: [1, 2] },
  3: { stage: 'overreach', volumeMultiplier: 1.15, repRangeLabel: '12-15 / 15-20', rir: [3, 4] },
  4: { stage: 'deload', volumeMultiplier: 0.6, repRangeLabel: '10-12 / 12-15', rir: [4, 5] },
}

export function getGenericWaveWeek(weekInCycle: 1 | 2 | 3 | 4): WaveWeek {
  return GENERIC_WAVE[weekInCycle]
}

// ─── Y3T weekly rotation (consolidated) ───
// This was previously re-implemented independently in workout-generator.ts,
// WorkoutTracker.tsx, and phase-progression.ts. All three now import from
// here — this function must keep producing exactly what those three
// implementations produced (see block-wave.test.ts).

export type Y3TSubWeek = 0 | 1 | 2 // 0=Heavy, 1=Moderate, 2=Annihilation

export interface Y3TWeek {
  subWeek: Y3TSubWeek
  weekInCycle: 1 | 2 | 3 // 1-indexed, matches phase-progression's prior "weekInCycle"
  isAnnihilation: boolean
  repRange: [number, number]
  restSeconds: number
  label: string
  desc: string
  note: string
}

const Y3T_WEEKS: Record<Y3TSubWeek, Omit<Y3TWeek, 'subWeek' | 'weekInCycle' | 'isAnnihilation'>> = {
  0: {
    repRange: [6, 10],
    restSeconds: 180,
    label: 'Y3T WEEK 1 — HEAVY',
    desc: '6-10 reps · compound focus',
    note: 'Y3T WEEK 1 — HEAVY. Compound focus, 6-10 reps, maximum load.',
  },
  1: {
    repRange: [10, 15],
    restSeconds: 90,
    label: 'Y3T WEEK 2 — MODERATE',
    desc: '10-15 reps · balanced intensity',
    note: 'Y3T WEEK 2 — MODERATE. 10-15 reps, balanced intensity.',
  },
  2: {
    repRange: [15, 40],
    restSeconds: 35,
    label: 'Y3T WEEK 3 — ANNIHILATION',
    desc: '15-40 reps · giant sets · minimal rest',
    note: 'Y3T WEEK 3 — ANNIHILATION. Giant sets, 15-40 reps, minimal rest. Extreme pump protocol.',
  },
}

export function getY3TWeek(weekNumber: number): Y3TWeek {
  const subWeek = ((weekNumber - 1) % 3) as Y3TSubWeek
  return {
    subWeek,
    weekInCycle: (subWeek + 1) as 1 | 2 | 3,
    isAnnihilation: subWeek === 2,
    ...Y3T_WEEKS[subWeek],
  }
}
