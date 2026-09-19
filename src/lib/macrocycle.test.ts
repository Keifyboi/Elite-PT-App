import { describe, it, expect } from 'vitest'
import { evaluateMacrocycleProgression, getActiveBlock } from './macrocycle'
import type { UserProfile, TrainingBlock, BodybuildingPhilosophy, MacrocyclePhase } from './types'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function baseProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    name: 'Test',
    age: 30,
    heightCm: 180,
    weightKg: 90,
    sex: 'male',
    bodyFatPercent: 12,
    activityFactor: 1.55,
    goal: 'bulk',
    trainingPhilosophy: 'y3t',
    currentPhase: 'Y3T Block',
    weekNumber: 1,
    dailyStepTarget: 8000,
    trainingDaysPerWeek: 5,
    occupation: 'light-active',
    ...overrides,
  }
}

function block(philosophy: BodybuildingPhilosophy, macrocyclePhase: MacrocyclePhase, cycleCount: number, startDate: string): TrainingBlock {
  return { id: 'b1', philosophy, macrocyclePhase, cycleCount, startDate, dedicatedPoseAreas: [] }
}

describe('getActiveBlock', () => {
  it('returns no block when history is empty', () => {
    const info = getActiveBlock(baseProfile(), [])
    expect(info.block).toBeNull()
    expect(info.weekInBlock).toBe(1)
  })

  it('computes weekInBlock/cycleNumber from the block start date (Y3T, 3-week cycles)', () => {
    // 25 days in = week 4 (floor(25/7)+1), cycle 2 of a 3-week cycle
    const history = [block('y3t', 'hypertrophy-1', 1, daysAgo(25))]
    const info = getActiveBlock(baseProfile(), history)
    expect(info.weekInBlock).toBe(4)
    expect(info.cycleNumber).toBe(2)
  })
})

describe('evaluateMacrocycleProgression', () => {
  it('starts the macrocycle at Y3T / Hypertrophy I when there is no history', () => {
    const rec = evaluateMacrocycleProgression(baseProfile(), [])
    expect(rec.shouldSwitch).toBe(true)
    expect(rec.nextPhilosophy).toBe('y3t')
    expect(rec.nextMacrocyclePhase).toBe('hypertrophy-1')
    expect(rec.cycleCount).toBe(1)
  })

  it('does not switch mid-block', () => {
    const history = [block('y3t', 'hypertrophy-1', 1, daysAgo(7))] // week 2 of 3
    const rec = evaluateMacrocycleProgression(baseProfile(), history)
    expect(rec.shouldSwitch).toBe(false)
  })

  it('Hyp I sequence: Y3T -> FST-7 -> MI40 -> Hyp II (MI40 x2 cycles) -> PHAT -> Recomposition (Corey-G)', () => {
    const steps: { philosophy: BodybuildingPhilosophy; macrocyclePhase: MacrocyclePhase; cycleCount: number }[] = [
      { philosophy: 'y3t', macrocyclePhase: 'hypertrophy-1', cycleCount: 1 },
      { philosophy: 'fst7', macrocyclePhase: 'hypertrophy-1', cycleCount: 1 },
      { philosophy: 'mi40', macrocyclePhase: 'hypertrophy-1', cycleCount: 1 },
      { philosophy: 'mi40', macrocyclePhase: 'hypertrophy-2', cycleCount: 2 },
      { philosophy: 'phat', macrocyclePhase: 'hypertrophy-2', cycleCount: 1 },
      { philosophy: 'corey-g', macrocyclePhase: 'recomposition', cycleCount: 1 },
    ]

    for (let i = 0; i < steps.length; i++) {
      const current = steps[i]
      // Start the block far enough in the past that all its cycles are complete.
      const cycleLenDays = current.philosophy === 'y3t' ? 21 : 28
      const startedDaysAgo = current.cycleCount * cycleLenDays + 3
      const history = [block(current.philosophy, current.macrocyclePhase, current.cycleCount, daysAgo(startedDaysAgo))]

      const rec = evaluateMacrocycleProgression(baseProfile(), history)
      expect(rec.shouldSwitch).toBe(true)

      const next = steps[i + 1] ?? steps[steps.length - 1] // Corey-G repeats itself
      expect(rec.nextPhilosophy).toBe(next.philosophy)
      expect(rec.nextMacrocyclePhase).toBe(next.macrocyclePhase)
    }
  })

  it('Prep & Peak: within 8 weeks of a contest date, switches to MI40', () => {
    const profile = baseProfile({ contestDate: daysAgo(-40) }) // 40 days in the future
    const history = [block('corey-g', 'recomposition', 1, daysAgo(3))]
    const rec = evaluateMacrocycleProgression(profile, history)
    expect(rec.shouldSwitch).toBe(true)
    expect(rec.nextPhilosophy).toBe('mi40')
    expect(rec.nextMacrocyclePhase).toBe('prep-and-peak')
  })

  it('Prep & Peak: within the final 7 days, switches to FST-7', () => {
    const profile = baseProfile({ contestDate: daysAgo(-5) }) // 5 days out
    const history = [block('mi40', 'prep-and-peak', 1, daysAgo(20))]
    const rec = evaluateMacrocycleProgression(profile, history)
    expect(rec.shouldSwitch).toBe(true)
    expect(rec.nextPhilosophy).toBe('fst7')
    expect(rec.nextMacrocyclePhase).toBe('prep-and-peak')
  })
})
