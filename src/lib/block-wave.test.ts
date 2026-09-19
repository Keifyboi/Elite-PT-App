import { describe, it, expect } from 'vitest'
import { getGenericWaveWeek, getY3TWeek } from './block-wave'

describe('getGenericWaveWeek', () => {
  it('week 1 — accumulation: 100% volume, RIR 2-3', () => {
    const w = getGenericWaveWeek(1)
    expect(w.stage).toBe('accumulation')
    expect(w.volumeMultiplier).toBe(1.0)
    expect(w.rir).toEqual([2, 3])
  })

  it('week 2 — intensification: ~90% volume, RIR 1-2', () => {
    const w = getGenericWaveWeek(2)
    expect(w.stage).toBe('intensification')
    expect(w.volumeMultiplier).toBe(0.9)
    expect(w.rir).toEqual([1, 2])
  })

  it('week 3 — overreach: ~115% volume, RIR 3-4', () => {
    const w = getGenericWaveWeek(3)
    expect(w.stage).toBe('overreach')
    expect(w.volumeMultiplier).toBe(1.15)
    expect(w.rir).toEqual([3, 4])
  })

  it('week 4 — deload: ~60% volume, same reps as week 1, RIR 4-5', () => {
    const w = getGenericWaveWeek(4)
    expect(w.stage).toBe('deload')
    expect(w.volumeMultiplier).toBe(0.6)
    expect(w.repRangeLabel).toBe(getGenericWaveWeek(1).repRangeLabel)
    expect(w.rir).toEqual([4, 5])
  })
})

// Regression test for the Y3T consolidation. These expected values are
// computed directly from the formulas that used to be independently
// duplicated in workout-generator.ts, WorkoutTracker.tsx, and
// phase-progression.ts — not re-derived from the new code — so this proves
// the consolidation changed nothing observable.
function oldGetY3TSubWeek(weekNumber: number): 0 | 1 | 2 {
  return ((weekNumber - 1) % 3) as 0 | 1 | 2
}
function oldGetY3TRepRange(subWeek: 0 | 1 | 2): [number, number] {
  if (subWeek === 0) return [6, 10]
  if (subWeek === 1) return [10, 15]
  return [15, 40]
}
function oldGetY3TRest(subWeek: 0 | 1 | 2): number {
  if (subWeek === 0) return 180
  if (subWeek === 1) return 90
  return 35
}
function oldWeekInCycle(weekNumber: number): number {
  return ((weekNumber - 1) % 3) + 1
}

describe('getY3TWeek (consolidation regression)', () => {
  for (let weekNumber = 1; weekNumber <= 12; weekNumber++) {
    it(`weekNumber ${weekNumber} matches the old triplicated logic`, () => {
      const oldSubWeek = oldGetY3TSubWeek(weekNumber)
      const result = getY3TWeek(weekNumber)

      expect(result.subWeek).toBe(oldSubWeek)
      expect(result.weekInCycle).toBe(oldWeekInCycle(weekNumber))
      expect(result.isAnnihilation).toBe(oldSubWeek === 2)
      expect(result.repRange).toEqual(oldGetY3TRepRange(oldSubWeek))
      expect(result.restSeconds).toBe(oldGetY3TRest(oldSubWeek))
    })
  }

  it('labels match the exact strings previously hardcoded in WorkoutTracker.tsx', () => {
    expect(getY3TWeek(1).label).toBe('Y3T WEEK 1 — HEAVY')
    expect(getY3TWeek(2).label).toBe('Y3T WEEK 2 — MODERATE')
    expect(getY3TWeek(3).label).toBe('Y3T WEEK 3 — ANNIHILATION')
  })

  it('notes match the exact strings previously hardcoded in workout-generator.ts', () => {
    expect(getY3TWeek(1).note).toBe('Y3T WEEK 1 — HEAVY. Compound focus, 6-10 reps, maximum load.')
    expect(getY3TWeek(2).note).toBe('Y3T WEEK 2 — MODERATE. 10-15 reps, balanced intensity.')
    expect(getY3TWeek(3).note).toBe('Y3T WEEK 3 — ANNIHILATION. Giant sets, 15-40 reps, minimal rest. Extreme pump protocol.')
  })
})
