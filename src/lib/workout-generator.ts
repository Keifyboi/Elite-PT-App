import type { WorkoutDay, WorkoutExercise, WorkoutSet, PhaseConfig, Intensifier, TrainingPhilosophy, BodyPart } from './types'
import { EXERCISE_DATABASE } from './data/exercises'
import { getCurrentPhase } from './philosophy-engine'
import { getTemplateForSplit } from './data/workout-templates'

// ─── Map split-day names to body parts ───

const SPLIT_TO_BODYPARTS: Record<string, BodyPart[]> = {
  'chest': ['chest'],
  'back': ['back'],
  'shoulders': ['shoulders'],
  'arms': ['biceps', 'triceps'],
  'biceps': ['biceps'],
  'triceps': ['triceps'],
  'legs': ['quads', 'hamstrings', 'glutes', 'calves'],
  'quads': ['quads'],
  'hamstrings': ['hamstrings'],
  'glutes': ['glutes'],
  'calves': ['calves'],
  'abs': ['abs'],
  'upper body': ['chest', 'back', 'shoulders'],
  'lower body': ['quads', 'hamstrings', 'glutes', 'calves'],
  'upper': ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  'lower': ['quads', 'hamstrings', 'glutes', 'calves'],
  'full body': ['chest', 'back', 'quads', 'hamstrings', 'shoulders', 'abs'],
  'weak points': ['shoulders', 'calves', 'abs'],
  'conditioning': ['quads', 'hamstrings'],
}

function parseSplitDay(splitDay: string): BodyPart[] {
  const lower = splitDay.toLowerCase()
  const parts: BodyPart[] = []
  const seen = new Set<BodyPart>()

  for (const [key, bps] of Object.entries(SPLIT_TO_BODYPARTS)) {
    if (lower.includes(key)) {
      for (const bp of bps) {
        if (!seen.has(bp)) {
          parts.push(bp)
          seen.add(bp)
        }
      }
    }
  }

  if (parts.length === 0) {
    return ['chest', 'back', 'shoulders']
  }

  return parts
}

// ─── Exercise selection logic ───

// Deterministic shuffle seeded by week number — same week always produces same exercise order,
// different weeks produce different rotations through the full pool.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr]
  let s = (seed * 1664525 + 1013904223) & 0x7fffffff
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    const j = s % (i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}


function selectExercises(
  bodyParts: BodyPart[],
  totalSets: [number, number],
  phase: PhaseConfig,
  weekNumber: number = 1
): { bodyPart: BodyPart; exerciseId: string; exerciseName: string; sets: number }[] {
  const result: { bodyPart: BodyPart; exerciseId: string; exerciseName: string; sets: number }[] = []
  const usedIds = new Set<string>()

  const avgSetsPerBP = Math.round(((totalSets[0] + totalSets[1]) / 2) / bodyParts.length)

  for (const bp of bodyParts) {
    const pool = EXERCISE_DATABASE.filter(e => e.bodyPart === bp && !usedIds.has(e.id))
    if (pool.length === 0) continue

    // Use seeded shuffle so each week rotates to a different exercise selection
    const bpSeed = weekNumber * 31 + bp.charCodeAt(0)
    const compounds = seededShuffle(pool.filter(e => e.category === 'compound'), bpSeed)
    const isolations = seededShuffle(pool.filter(e => e.category !== 'compound'), bpSeed + 7)

    const setsForBP = Math.max(avgSetsPerBP, Math.round(totalSets[0] / bodyParts.length))
    let remainingSets = setsForBP

    // Pick 1-2 compounds
    const numCompounds = compounds.length > 0 ? Math.min(2, compounds.length) : 0
    for (let i = 0; i < numCompounds && remainingSets > 0; i++) {
      const ex = compounds.filter(c => !usedIds.has(c.id))[0]
      if (!ex) break
      const sets = Math.min(Math.ceil(remainingSets / (numCompounds - i + (isolations.length > 0 ? 1 : 0))), 5)
      result.push({ bodyPart: bp, exerciseId: ex.id, exerciseName: ex.name, sets })
      usedIds.add(ex.id)
      remainingSets -= sets
    }

    // Fill remaining with isolation/cable/machine work
    const numIso = Math.min(remainingSets > 0 ? Math.ceil(remainingSets / 3) : 0, isolations.length)
    for (let i = 0; i < numIso && remainingSets > 0; i++) {
      const ex = isolations.filter(c => !usedIds.has(c.id))[0]
      if (!ex) break
      const sets = Math.min(remainingSets, 4)
      result.push({ bodyPart: bp, exerciseId: ex.id, exerciseName: ex.name, sets })
      usedIds.add(ex.id)
      remainingSets -= sets
    }
  }

  return result
}

// ─── Intensifier assignment ───

function assignIntensifier(
  frequency: 'none' | 'last-set' | 'every-exercise',
  exerciseIndex: number,
  totalExercises: number,
  philosophy: TrainingPhilosophy
): Intensifier | undefined {
  if (frequency === 'none') return undefined

  const philosophyIntensifiers: Record<string, Intensifier[]> = {
    'mi40': ['nos', 'nos-x', '1.5-reps'],
    'incredible-bulk': ['nos', 'nos-x', 'cs-6'],
    'fst7': ['fst7'],
    'hit': ['forced-reps', 'negative-overload', 'rest-pause'],
    'dtp': ['rest-pause'],
    'y3t': ['drop-set', 'rest-pause', 'giant-set'],
    'phat': ['speed-work'],
    'corey-g': ['giant-set'],
    'contest-prep': ['drop-set', 'rest-pause'],
    'bompa': [],
  }

  const pool = philosophyIntensifiers[philosophy] ?? []
  if (pool.length === 0) return undefined

  if (frequency === 'last-set') {
    // Only on the last 1-2 exercises
    if (exerciseIndex >= totalExercises - 2) {
      return pool[exerciseIndex % pool.length]
    }
    return undefined
  }

  // every-exercise
  return pool[exerciseIndex % pool.length]
}

// ─── Y3T sub-week helpers ───

// weekNumber is 1-indexed. Sub-week: 0=Heavy, 1=Moderate, 2=Annihilation
function getY3TSubWeek(weekNumber: number): 0 | 1 | 2 {
  return ((weekNumber - 1) % 3) as 0 | 1 | 2
}

function getY3TRepRange(subWeek: 0 | 1 | 2): [number, number] {
  if (subWeek === 0) return [6, 10]    // Heavy
  if (subWeek === 1) return [10, 15]   // Moderate
  return [15, 40]                       // Annihilation
}

function getY3TRest(subWeek: 0 | 1 | 2): number {
  if (subWeek === 0) return 180
  if (subWeek === 1) return 90
  return 35 // Annihilation: 30-40s
}

function getY3TNote(subWeek: 0 | 1 | 2): string {
  if (subWeek === 0) return 'Y3T WEEK 1 — HEAVY. Compound focus, 6-10 reps, maximum load.'
  if (subWeek === 1) return 'Y3T WEEK 2 — MODERATE. 10-15 reps, balanced intensity.'
  return 'Y3T WEEK 3 — ANNIHILATION. Giant sets, 15-40 reps, minimal rest. Extreme pump protocol.'
}

// ─── Build rep string based on philosophy ───

function buildRepString(repRange: [number, number], philosophy: TrainingPhilosophy, exerciseIndex: number): string {
  if (philosophy === 'dtp') {
    // DTP pyramid: decreasing then increasing
    const pyramid = [50, 40, 30, 20, 10, 5, 5, 10, 20, 30, 40, 50]
    return pyramid.join('-')
  }

  if (philosophy === 'y3t') {
    return `${repRange[0]}-${repRange[1]}`
  }

  if (philosophy === 'phat' && exerciseIndex === 0) {
    return '6x3 (speed work @ 65%)'
  }

  return `${repRange[0]}-${repRange[1]}`
}

// ─── Generate workout sets ───

function buildSets(numSets: number, repRange: [number, number]): WorkoutSet[] {
  return Array.from({ length: numSets }, (_, i) => ({
    setNumber: i + 1,
    targetReps: `${repRange[0]}-${repRange[1]}`,
    completed: false,
  }))
}

// ─── Main generator ───

export function generateWorkout(
  philosophy: TrainingPhilosophy,
  phaseName: string,
  dayNumber: number,
  date?: string,
  weekNumber: number = 1,
  isDeload?: boolean
): WorkoutDay | null {
  const phase = getCurrentPhase(philosophy, phaseName)
  if (!phase) return null

  const style = phase.trainingStyle
  const splitKeys = Object.keys(style.split)
  if (splitKeys.length === 0) return null

  // Determine which day in the split
  const dayKey = splitKeys[(dayNumber - 1) % splitKeys.length]
  const splitDay = style.split[dayKey]

  // Skip rest/HIIT days
  if (!splitDay || splitDay.toLowerCase() === 'rest' || splitDay.toLowerCase() === 'off') {
    return null
  }

  // Try structured template first (exact programming from extracted data)
  const template = getTemplateForSplit(philosophy, phaseName, splitDay)

  // ─── Y3T sub-week detection ───
  const y3tSubWeek = philosophy === 'y3t' ? getY3TSubWeek(weekNumber) : -1
  const isY3TAnnihilation = y3tSubWeek === 2
  const isY3T = philosophy === 'y3t'

  let exercises: WorkoutExercise[]

  if (template) {
    exercises = template.exercises.map((ex, idx) => {
      // For Y3T, override rep ranges and rest from template
      const effectiveRepRange: [number, number] = isY3T
        ? getY3TRepRange(y3tSubWeek as 0 | 1 | 2)
        : ex.repRange
      const effectiveRest = isY3T
        ? getY3TRest(y3tSubWeek as 0 | 1 | 2)
        : (ex.restSeconds ?? (ex.category === 'compound' ? style.restSeconds[1] : style.restSeconds[0]))
      // Annihilation: increase sets ~50% and force giant-set intensifier
      const numSets = isY3TAnnihilation ? Math.max(ex.sets, Math.round(ex.sets * 1.5)) : ex.sets
      const effectiveIntensifier = isY3TAnnihilation ? 'giant-set' : ex.intensifier

      return {
        id: crypto.randomUUID(),
        exerciseId: ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: ex.name,
        targetMuscle: ex.bodyPart,
        sets: buildSets(numSets, effectiveRepRange),
        tempo: ex.tempo ?? style.tempoDefault,
        restSeconds: effectiveRest,
        intensifier: effectiveIntensifier,
        notes: ex.notes ?? (effectiveIntensifier ? intensifierNotes(effectiveIntensifier) : ''),
        order: idx + 1,
      }
    })
  } else {
    // Fallback: random selection from exercise database
    const bodyParts = parseSplitDay(splitDay)
    const exerciseSelections = selectExercises(bodyParts, style.setsPerBodyPart, phase, weekNumber)

    exercises = exerciseSelections.map((sel, idx) => {
      const intensifier = isY3TAnnihilation
        ? 'giant-set' as const
        : assignIntensifier(style.intensifierFrequency, idx, exerciseSelections.length, philosophy)

      // Y3T overrides rep range entirely; otherwise use style with compound/isolation adjustment
      let adjustedReps: [number, number]
      if (isY3T) {
        adjustedReps = getY3TRepRange(y3tSubWeek as 0 | 1 | 2)
      } else {
        const repRange = style.repRange as [number, number]
        const dbEx = EXERCISE_DATABASE.find(e => e.id === sel.exerciseId)
        const isCompound = dbEx?.category === 'compound'
        adjustedReps = isCompound
          ? [repRange[0], Math.min(repRange[0] + 4, repRange[1])]
          : [Math.max(repRange[0], repRange[1] - 4), repRange[1]]
      }

      const dbEx = EXERCISE_DATABASE.find(e => e.id === sel.exerciseId)
      const isCompound = dbEx?.category === 'compound'
      const effectiveRest = isY3T
        ? getY3TRest(y3tSubWeek as 0 | 1 | 2)
        : (isCompound ? style.restSeconds[1] : style.restSeconds[0])

      // Annihilation: ~50% more sets
      const numSets = isY3TAnnihilation ? Math.round(sel.sets * 1.5) : sel.sets

      return {
        id: crypto.randomUUID(),
        exerciseId: sel.exerciseId,
        name: sel.exerciseName,
        targetMuscle: sel.bodyPart,
        sets: buildSets(numSets, adjustedReps),
        tempo: style.tempoDefault,
        restSeconds: effectiveRest,
        intensifier,
        notes: intensifier ? intensifierNotes(intensifier) : '',
        order: idx + 1,
      }
    })
  }

  // Apply deload modifications: reduce sets by 40%, strip intensifiers
  if (isDeload) {
    exercises = exercises.map(ex => ({
      ...ex,
      sets: ex.sets.slice(0, Math.max(1, Math.floor(ex.sets.length * 0.6))).map((s, i) => ({ ...s, setNumber: i + 1 })),
      intensifier: undefined,
      notes: '',
    }))
  }

  const workoutNotes = isDeload
    ? 'DELOAD WEEK — reduced volume'
    : isY3T
    ? getY3TNote(y3tSubWeek as 0 | 1 | 2)
    : ''

  return {
    id: crypto.randomUUID(),
    date: date ?? new Date().toISOString().split('T')[0],
    phase: phaseName,
    philosophy,
    splitDay,
    exercises,
    notes: workoutNotes,
    completed: false,
  }
}

function intensifierNotes(intensifier: Intensifier): string {
  const notes: Record<Intensifier, string> = {
    'nos': 'NOS: 3 drop sets after final working set, 0-10s rest between, -20% each drop, partials to failure on last',
    'nos-x': 'NOS-X: Same as NOS + 20-30s loaded stretch after each drop, finish on a concentric',
    'cs-6': 'CS-6: 10 reps, then 6 mini-sets of 8 reps with 20s rest and -10% each',
    'fst7': 'FST-7: 7 sets of 10-12 reps, 30-45s rest, flex target muscle 10s between sets 3 and 4',
    'drop-set': 'Drop set: strip 20-30% on failure, continue to failure, repeat 2-3 times',
    'rest-pause': 'Rest-pause: on failure, rack 10-15s, squeeze out 1-2 more reps',
    'giant-set': 'Giant set: 4-5 exercises back-to-back, no rest between, 90s after completing round',
    'speed-work': 'Speed work: 6 sets of 3 reps @ 65-70% 1RM, maximum bar velocity, 60s rest',
    'forced-reps': 'Forced reps: partner assists 2-3 reps past failure with minimal help',
    'negative-overload': 'Negative overload: partner lifts, you lower in 4-5s, 2-3 reps after failure',
    '1.5-reps': '1.5 reps: full rep + half rep at peak contraction = 1 rep',
  }
  return notes[intensifier]
}

// ─── Generate a full week of workouts ───

export function generateWeeklyWorkouts(
  philosophy: TrainingPhilosophy,
  phaseName: string,
  weekStartDate?: string,
  weekNumber: number = 1
): WorkoutDay[] {
  const phase = getCurrentPhase(philosophy, phaseName)
  if (!phase) return []

  const start = weekStartDate ? new Date(weekStartDate) : new Date()
  const dayOfWeek = start.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(start)
  monday.setDate(start.getDate() + mondayOffset)

  const workouts: WorkoutDay[] = []
  const splitKeys = Object.keys(phase.trainingStyle.split)

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    if (i < splitKeys.length) {
      const workout = generateWorkout(philosophy, phaseName, i + 1, dateStr, weekNumber)
      if (workout) {
        workouts.push(workout)
      }
    }
  }

  return workouts
}

// ─── Get today's split day label ───

export function getTodaySplitDay(
  philosophy: TrainingPhilosophy,
  phaseName: string,
  weekNumber: number
): { dayNumber: number; splitDay: string } | null {
  const phase = getCurrentPhase(philosophy, phaseName)
  if (!phase) return null

  const splitKeys = Object.keys(phase.trainingStyle.split)
  const dayOfWeek = new Date().getDay()
  // Mon=0, Tue=1 ... Sun=6 for our split
  const splitIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  if (splitIndex >= splitKeys.length) return null

  const dayKey = splitKeys[splitIndex]
  return {
    dayNumber: splitIndex + 1,
    splitDay: phase.trainingStyle.split[dayKey],
  }
}
