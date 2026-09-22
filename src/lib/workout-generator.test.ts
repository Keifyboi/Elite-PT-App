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

  // MI40_PHASE12_TEMPLATES is hand-authored, fixed programming (Pakulski's
  // NOS/NOS-X intensifiers, 40s rest, activation-set structure) — it doesn't
  // vary week to week the way the generic-wave fallback used to. The wave
  // still applies its week-4 deload (see the FST-7 test above) on top of it.
  it('MI40: serves the real hand-authored Chest day content, consistently', () => {
    const week1 = generateWorkout('mi40', 'MI40 Block', 1, '2026-01-05', 1)
    const week2 = generateWorkout('mi40', 'MI40 Block', 1, '2026-01-05', 2)
    expect(week1!.exercises[0].name).toBe('Incline Dumbbell Press')
    expect(week1!.exercises[0].sets[0].targetReps).toBe(week2!.exercises[0].sets[0].targetReps)
  })

  it('FST-7: week 4 (deload) reduces set count vs week 1', () => {
    const week1 = generateWorkout('fst7', 'FST-7 Block', 1, '2026-01-05', 1)
    const week4 = generateWorkout('fst7', 'FST-7 Block', 1, '2026-01-05', 4)
    const totalSets1 = week1!.exercises.reduce((sum, e) => sum + e.sets.length, 0)
    const totalSets4 = week4!.exercises.reduce((sum, e) => sum + e.sets.length, 0)
    expect(totalSets4).toBeLessThan(totalSets1)
    expect(week4!.notes).toContain('DELOAD')
  })

  // Corey-G's real 7-day squat-every-session split is restored — day3 is
  // "Squat + Back & Biceps" (COREYG_TEMPLATES), not a pose-priority-selected
  // generic back day.
  it('Corey-G: day3 serves the real "Squat + Back & Biceps" hand-authored session', () => {
    const workout = generateWorkout('corey-g', 'Corey-G Block', 3, '2026-01-05', 1)
    expect(workout).not.toBeNull()
    const names = workout!.exercises.map(e => e.name.toLowerCase())
    expect(names.some(n => n.includes('squat'))).toBe(true)
  })

  it('Corey-G: squats every day across all 7 split days', () => {
    for (let day = 1; day <= 7; day++) {
      const workout = generateWorkout('corey-g', 'Corey-G Block', day, '2026-01-05', 1)
      expect(workout, `day ${day}`).not.toBeNull()
      const names = workout!.exercises.map(e => e.name.toLowerCase())
      expect(names.some(n => n.includes('squat') || n.includes('lunge')), `day ${day}: ${names.join(', ')}`).toBe(true)
    }
  })

  // Y3T's 3 weeks reuse the same split-day labels (Chest/Back/Shoulders/
  // Legs/Arms), so which template set applies depends on the week — proves
  // generateWorkout's direct Y3T_WEEK1/2/3_TEMPLATES selection (not
  // getTemplateForSplit, which always returns null for Y3T) picks correctly.
  it('Y3T: each week of the rotation serves distinct hand-authored Chest-day content', () => {
    const heavy = generateWorkout('y3t', 'Y3T Block', 1, '2026-01-05', 1) // subWeek 0
    const moderate = generateWorkout('y3t', 'Y3T Block', 1, '2026-01-05', 2) // subWeek 1
    const annihilation = generateWorkout('y3t', 'Y3T Block', 1, '2026-01-05', 3) // subWeek 2
    const names = (w: typeof heavy) => w!.exercises.map(e => e.name)
    expect(heavy).not.toBeNull()
    expect(moderate).not.toBeNull()
    expect(annihilation).not.toBeNull()
    expect(names(heavy)).not.toEqual(names(moderate))
    expect(names(moderate)).not.toEqual(names(annihilation))
    // Annihilation week still applies its own giant-set/set-boost override on top.
    expect(annihilation!.exercises[0].intensifier).toBe('giant-set')
  })

  // PHAT's real 5-day power/hypertrophy split, not the old forced-first-
  // exercise hack — power days are genuinely low-rep, hypertrophy days
  // genuinely higher-rep, straight from PHAT_TEMPLATES.
  it('PHAT: power days and hypertrophy days serve genuinely different rep ranges', () => {
    const power = generateWorkout('phat', 'PHAT Block', 1, '2026-01-05', 1) // Upper Body Power
    const hypertrophy = generateWorkout('phat', 'PHAT Block', 5, '2026-01-05', 1) // Chest & Arms Hypertrophy
    expect(power!.exercises[0].sets[0].targetReps).toBe('3-5')
    expect(hypertrophy!.exercises[1].sets[0].targetReps).not.toBe('3-5')
  })

  it('FST-7: day1 serves the real "Chest & Triceps" hand-authored session', () => {
    const workout = generateWorkout('fst7', 'FST-7 Block', 1, '2026-01-05', 1)
    expect(workout).not.toBeNull()
    const bodyParts = new Set(workout!.exercises.map(e => e.targetMuscle))
    expect(bodyParts.has('chest') || bodyParts.has('triceps')).toBe(true)
  })

  it('cycle 2 adds a progression note that cycle 1 does not have', () => {
    const cycle1 = generateWorkout('mi40', 'MI40 Block', 1, '2026-01-05', 1, false, 1)
    const cycle2 = generateWorkout('mi40', 'MI40 Block', 1, '2026-01-05', 1, false, 2)
    expect(cycle1!.notes).not.toContain('CYCLE 2')
    expect(cycle2!.notes).toContain('CYCLE 2')
  })
})
