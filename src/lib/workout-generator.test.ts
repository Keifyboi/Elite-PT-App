import { describe, it, expect } from 'vitest'
import { generateWorkout } from './workout-generator'

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
