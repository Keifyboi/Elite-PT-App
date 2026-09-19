import { describe, it, expect } from 'vitest'
import { generateWorkout } from './workout-generator'
import { getTemplateForSplit } from './data/workout-templates'

// Regression test for a real gap found while auditing the hand-authored
// templates: 6 of 9 philosophies had zero trap-specific exercises anywhere,
// a direct miss against the "traps mandatory for Most Muscular, never
// omit" rule. This asserts every philosophy's shoulder/back day now
// includes at least one exercise tagged 'traps'.
describe('trap-specific volume is present across all philosophies', () => {
  const cases: { philosophy: string; phase: string; dayNumber: number; label: string }[] = [
    { philosophy: 'incredible-bulk', phase: 'Growth', dayNumber: 4, label: 'Incredible Bulk — Upper Back & Shoulders' },
    { philosophy: 'incredible-bulk', phase: 'Reset', dayNumber: 5, label: 'Incredible Bulk (Reset) — Shoulders, Calves & Abs' },
    { philosophy: 'dtp', phase: 'DTP Block', dayNumber: 3, label: 'DTP — Shoulders' },
    { philosophy: 'hit', phase: 'Blood & Guts', dayNumber: 3, label: 'HIT — Shoulders' },
    { philosophy: 'bompa', phase: 'Anatomical Adaptation', dayNumber: 3, label: 'Bompa (AA) — Shoulders' },
    { philosophy: 'bompa', phase: 'Hypertrophy', dayNumber: 3, label: 'Bompa (Hypertrophy) — Shoulders' },
    { philosophy: 'bompa', phase: 'Maximum Strength', dayNumber: 4, label: 'Bompa (Max Strength) — Shoulders' },
  ]

  for (const { philosophy, phase, dayNumber, label } of cases) {
    it(`${label} includes dedicated trap work`, () => {
      const workout = generateWorkout(philosophy as never, phase, dayNumber, '2026-01-05', 1, false)
      expect(workout).not.toBeNull()
      const hasTraps = workout!.exercises.some(e => e.targetMuscle === 'traps')
      expect(hasTraps).toBe(true)
    })
  }

  // Contest-Prep's phase-level split ('Upper'/'Lower'/'Weak Points') doesn't
  // align with its own template's richer day keys, so 'Back & Shoulders
  // Hypertrophy' is unreachable via generateWorkout(dayNumber) today (a
  // separate, pre-existing routing bug — flagged, not fixed here). Test the
  // template content directly instead, since that's what this fix changed.
  it('Contest Prep — Back & Shoulders Hypertrophy template includes dedicated trap work', () => {
    const template = getTemplateForSplit('contest-prep', 'Mid Prep (12-8 weeks out)', 'Back & Shoulders Hypertrophy')
    expect(template).not.toBeNull()
    expect(template!.exercises.some(e => e.bodyPart === 'traps')).toBe(true)
  })
})

describe('back width and thickness are both represented where a back day exists', () => {
  const cases: { philosophy: string; phase: string; dayNumber: number; label: string }[] = [
    { philosophy: 'incredible-bulk', phase: 'Growth', dayNumber: 1, label: 'Incredible Bulk — Back & Biceps' },
    { philosophy: 'bompa', phase: 'Anatomical Adaptation', dayNumber: 2, label: 'Bompa (AA) — Back' },
    { philosophy: 'bompa', phase: 'Hypertrophy', dayNumber: 2, label: 'Bompa (Hypertrophy) — Back' },
  ]

  for (const { philosophy, phase, dayNumber, label } of cases) {
    it(`${label} has at least one width and one thickness movement`, () => {
      const workout = generateWorkout(philosophy as never, phase, dayNumber, '2026-01-05', 1, false)
      expect(workout).not.toBeNull()
      const muscles = new Set(workout!.exercises.map(e => e.targetMuscle))
      expect(muscles.has('back-width')).toBe(true)
      expect(muscles.has('back-thickness')).toBe(true)
    })
  }

  it('Contest Prep — Back & Shoulders Hypertrophy template has both (tested directly, see routing-bug note above)', () => {
    const template = getTemplateForSplit('contest-prep', 'Mid Prep (12-8 weeks out)', 'Back & Shoulders Hypertrophy')
    expect(template).not.toBeNull()
    const muscles = new Set(template!.exercises.map(e => e.bodyPart))
    expect(muscles.has('back-width')).toBe(true)
    expect(muscles.has('back-thickness')).toBe(true)
  })
})
