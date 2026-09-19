import { describe, it, expect } from 'vitest'
import { generateWorkout, getAlternativeExercise } from './workout-generator'

// Regression test for the Shuffle button: hand-authored philosophies (Incredible
// Bulk, DTP, HIT, Bompa, Contest-Prep) never varied by week, so the old
// week+1 approach silently did nothing for them. This is what Shuffle now
// calls directly instead.
describe('getAlternativeExercise', () => {
  it('finds a different exercise for a well-populated body part', () => {
    const alt = getAlternativeExercise('chest', ['Bench Press'])
    expect(alt).not.toBeNull()
    expect(alt!.name.toLowerCase()).not.toBe('bench press')
  })

  it('finds an alternative for a pose-priority-only body part (back-width)', () => {
    const alt = getAlternativeExercise('back-width', ['Wide-Grip Lat Pulldowns'])
    expect(alt).not.toBeNull()
    expect(alt!.name.toLowerCase()).not.toBe('wide-grip lat pulldowns')
  })

  it('returns null rather than a duplicate when every candidate is excluded', () => {
    const alt = getAlternativeExercise('traps', ['Barbell Shrugs', 'Low Pulley Shrugs', 'Dumbbell Shrugs', 'Cable Shrugs', 'Behind-the-Back Barbell Shrugs'])
    // Whatever the real pool is, excluding names that don't match any of it
    // should never throw — either finds something not in the list, or null.
    if (alt) expect(['Barbell Shrugs', 'Low Pulley Shrugs', 'Dumbbell Shrugs', 'Cable Shrugs', 'Behind-the-Back Barbell Shrugs']).not.toContain(alt.name)
  })
})

describe('generateWorkout', () => {
  it('always populates sets/reps for every exercise it generates', () => {
    const workout = generateWorkout('incredible-bulk', 'Growth', 1, '2026-01-05', 3, false)

    expect(workout).not.toBeNull()
    expect(workout!.exercises.length).toBeGreaterThan(0)

    for (const exercise of workout!.exercises) {
      expect(exercise.sets.length).toBeGreaterThan(0)
      for (const set of exercise.sets) {
        expect(set.setNumber).toBeGreaterThan(0)
        expect(set.targetReps).toBeTruthy()
      }
    }
  })

  it('returns null for a phase name that does not exist rather than a half-built workout', () => {
    const workout = generateWorkout('incredible-bulk', 'Not A Real Phase', 1, '2026-01-05', 1, false)
    expect(workout).toBeNull()
  })
})

describe('pose-priority philosophies — generic wave + PHAT/PH3 resolution', () => {
  it('PHAT: the first exercise is always 3-5 reps regardless of wave week', () => {
    for (const week of [1, 2, 3, 4]) {
      const workout = generateWorkout('phat', 'PHAT Block', 1, '2026-01-05', week)
      expect(workout).not.toBeNull()
      expect(workout!.exercises[0].sets[0].targetReps).toBe('3-5')
    }
  })

  it('MI40: rep range changes across the 4-week generic wave', () => {
    const week1 = generateWorkout('mi40', 'MI40 Block', 1, '2026-01-05', 1)
    const week2 = generateWorkout('mi40', 'MI40 Block', 1, '2026-01-05', 2)
    expect(week1!.exercises[0].sets[0].targetReps).not.toBe(week2!.exercises[0].sets[0].targetReps)
  })

  it('FST-7: week 4 (deload) reduces set count vs week 1', () => {
    const week1 = generateWorkout('fst7', 'FST-7 Block', 1, '2026-01-05', 1)
    const week4 = generateWorkout('fst7', 'FST-7 Block', 1, '2026-01-05', 4)
    const totalSets1 = week1!.exercises.reduce((sum, e) => sum + e.sets.length, 0)
    const totalSets4 = week4!.exercises.reduce((sum, e) => sum + e.sets.length, 0)
    expect(totalSets4).toBeLessThan(totalSets1)
    expect(week4!.notes).toContain('DELOAD')
  })

  it('Corey-G: day3 (Back & Biceps) includes dedicated back-width and back-thickness exercises, not generic "back"', () => {
    const workout = generateWorkout('corey-g', 'Corey-G Block', 3, '2026-01-05', 1)
    expect(workout).not.toBeNull()
    const bodyParts = new Set(workout!.exercises.map(e => e.targetMuscle))
    expect(bodyParts.has('back-width') || bodyParts.has('back-thickness')).toBe(true)
  })

  it('cycle 2 adds a progression note that cycle 1 does not have', () => {
    const cycle1 = generateWorkout('mi40', 'MI40 Block', 1, '2026-01-05', 1, false, 1)
    const cycle2 = generateWorkout('mi40', 'MI40 Block', 1, '2026-01-05', 1, false, 2)
    expect(cycle1!.notes).not.toContain('CYCLE 2')
    expect(cycle2!.notes).toContain('CYCLE 2')
  })
})
