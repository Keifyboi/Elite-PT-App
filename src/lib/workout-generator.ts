import type { WorkoutDay, WorkoutExercise, WorkoutSet, PhaseConfig, Exercise, Intensifier, TrainingPhilosophy, BodybuildingPhilosophy, BodyPart } from './types'
import { EXERCISE_DATABASE } from './data/exercises'
import { BODYBUILDING_EXERCISES } from './data/bodybuilding-exercises'
import { getCurrentPhase } from './philosophy-engine'
import { getTemplateForSplit, Y3T_WEEK1_TEMPLATES, Y3T_WEEK2_TEMPLATES, Y3T_WEEK3_TEMPLATES } from './data/workout-templates'
import { getY3TWeek, getGenericWaveWeek } from './block-wave'

const BODYBUILDING_PHILOSOPHIES: readonly BodybuildingPhilosophy[] = ['y3t', 'mi40', 'fst7', 'phat', 'corey-g']

function isBodybuildingPhilosophy(p: TrainingPhilosophy): p is BodybuildingPhilosophy {
  return (BODYBUILDING_PHILOSOPHIES as readonly string[]).includes(p)
}

// ─── Universal pose-priority 5-day split → body parts ───
// Bypasses parseSplitDay's keyword matching entirely: "back" as a substring
// would otherwise collide with the generic 'back' keyword every other
// philosophy still relies on, silently losing the width/thickness split.
const BODYBUILDING_DAY_BODYPARTS: Record<string, BodyPart[]> = {
  day1: ['chest', 'triceps'],
  day2: ['quads', 'calves'],
  day3: ['back-width', 'back-thickness', 'biceps'],
  day4: ['hamstrings', 'glutes', 'calves'],
  day5: ['shoulders', 'traps', 'biceps', 'triceps'],
}

// ─── Map split-day names to body parts ───

// 'back' and 'shoulders' resolve to the granular pose-priority values
// (back-width/back-thickness, shoulders+traps) rather than the generic
// buckets — this is the same anatomical-correctness rule the pose-priority
// philosophies use, applied to every philosophy's fallback selection so
// traps/width/thickness are never silently dropped, regardless of technique.
const SPLIT_TO_BODYPARTS: Record<string, BodyPart[]> = {
  'chest': ['chest'],
  'back': ['back-width', 'back-thickness'],
  'shoulders': ['shoulders', 'traps'],
  'arms': ['biceps', 'triceps'],
  'biceps': ['biceps'],
  'triceps': ['triceps'],
  'legs': ['quads', 'hamstrings', 'glutes', 'calves'],
  'quads': ['quads'],
  'hamstrings': ['hamstrings'],
  'glutes': ['glutes'],
  'calves': ['calves'],
  'abs': ['abs'],
  'upper body': ['chest', 'back-width', 'back-thickness', 'shoulders', 'traps'],
  'lower body': ['quads', 'hamstrings', 'glutes', 'calves'],
  'upper': ['chest', 'back-width', 'back-thickness', 'shoulders', 'traps', 'biceps', 'triceps'],
  'lower': ['quads', 'hamstrings', 'glutes', 'calves'],
  'full body': ['chest', 'back-width', 'back-thickness', 'quads', 'hamstrings', 'shoulders', 'traps', 'abs'],
  'weak points': ['shoulders', 'traps', 'calves', 'abs'],
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
    return ['chest', 'back-width', 'back-thickness', 'shoulders', 'traps']
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


// Curated pose-priority movements (back-width/back-thickness/traps/serratus/
// hamstring-glute-tie-in/calves) shaped to slot into the same compound-vs-
// isolation selection logic below: role 'primary' → 'compound' (picked
// first, guaranteeing priority-area coverage since for the 3 brand-new body
// parts — back-width, back-thickness, traps — this curated list is the ONLY
// source; EXERCISE_DATABASE has zero entries for them).
function curatedPoolForBodyPart(bp: BodyPart): Exercise[] {
  return BODYBUILDING_EXERCISES.filter(e => e.bodyPart === bp).map(e => ({
    id: e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: e.name,
    bodyPart: e.bodyPart,
    category: e.role === 'primary' ? 'compound' : 'isolation',
    primaryMuscle: '',
    secondaryMuscles: [],
    executionCues: [],
  }))
}

// Used by the Shuffle button to swap in a different exercise targeting the
// same muscle group — same pool selectExercises() already draws from, so an
// "alternative" is always something the app already trusts for that body
// part. Returns null when nothing else targets that muscle (e.g. only one
// exercise exists for it), in which case the caller should leave it as-is.
export function getAlternativeExercise(targetMuscle: BodyPart, excludeNames: string[]): { name: string } | null {
  const pool = [...curatedPoolForBodyPart(targetMuscle), ...EXERCISE_DATABASE.filter(e => e.bodyPart === targetMuscle)]
  const exclude = new Set(excludeNames.map(n => n.toLowerCase()))
  const candidates = pool.filter(e => !exclude.has(e.name.toLowerCase()))
  if (candidates.length === 0) return null
  return { name: candidates[Math.floor(Math.random() * candidates.length)].name }
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
    // Curated pose-priority movements first, generic database second — see
    // curatedPoolForBodyPart for why this ordering matters.
    const pool = [...curatedPoolForBodyPart(bp), ...EXERCISE_DATABASE.filter(e => e.bodyPart === bp)]
      .filter(e => !usedIds.has(e.id))
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
  isDeload?: boolean,
  cycleNumber: number = 1
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

  // ─── Y3T sub-week (own 3-week rotation) / generic 4-week wave detection ───
  const isY3T = philosophy === 'y3t'
  const y3tWeek = isY3T ? getY3TWeek(weekNumber) : null
  const isY3TAnnihilation = y3tWeek?.isAnnihilation ?? false

  // Try structured template first (exact programming from hand-authored
  // data). MI40/FST-7/PHAT/Corey-G/every other philosophy resolve through
  // getTemplateForSplit's exact-match-on-real-split-label lookup. Y3T is
  // special-cased here instead: its 3 weeks (Heavy/Moderate/Annihilation)
  // reuse the same 5 split-day labels, so which template set applies
  // depends on the current week, not just philosophy/phase/splitDay —
  // getTemplateForSplit can't disambiguate that, so it always returns null
  // for Y3T and this is the real lookup.
  const template = isY3T
    ? ([Y3T_WEEK1_TEMPLATES, Y3T_WEEK2_TEMPLATES, Y3T_WEEK3_TEMPLATES][y3tWeek!.subWeek][splitDay] ?? null)
    : getTemplateForSplit(philosophy, phaseName, splitDay)

  const usesGenericWave = isBodybuildingPhilosophy(philosophy) && !isY3T
  const waveWeek = usesGenericWave ? getGenericWaveWeek((((weekNumber - 1) % 4) + 1) as 1 | 2 | 3 | 4) : null
  const isPhat = philosophy === 'phat'

  // Wave week 4 (Deload) already means 60% volume — same as the existing
  // isDeload truncation below, so it just sets that flag.
  const effectiveIsDeload = isDeload || waveWeek?.stage === 'deload'

  function parseWaveRepRange(): [number, number] | null {
    if (!waveWeek) return null
    // repRangeLabel is "X-Y / A-B" (compound / isolation) or a single "X-Y"
    const firstRange = waveWeek.repRangeLabel.split('/')[0].trim()
    const [lo, hi] = firstRange.split('-').map(Number)
    return [lo, hi]
  }

  let exercises: WorkoutExercise[]

  if (template) {
    exercises = template.exercises.map((ex, idx) => {
      // For Y3T, override rep ranges and rest from template
      const effectiveRepRange: [number, number] = y3tWeek
        ? y3tWeek.repRange
        : ex.repRange
      const effectiveRest = y3tWeek
        ? y3tWeek.restSeconds
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
    // Fallback: random selection from exercise database. Y3T/MI40/FST-7/
    // PHAT/Corey-G now match a hand-authored template every real training
    // day, so this only runs for non-bodybuilding philosophies or an
    // unmatched split-day label (shouldn't happen with the splits above).
    const bodyParts = isBodybuildingPhilosophy(philosophy)
      ? (BODYBUILDING_DAY_BODYPARTS[dayKey] ?? parseSplitDay(splitDay))
      : parseSplitDay(splitDay)
    const exerciseSelections = selectExercises(bodyParts, style.setsPerBodyPart, phase, weekNumber)

    exercises = exerciseSelections.map((sel, idx) => {
      const intensifier = isY3TAnnihilation
        ? 'giant-set' as const
        : assignIntensifier(style.intensifierFrequency, idx, exerciseSelections.length, philosophy)

      const dbEx = EXERCISE_DATABASE.find(e => e.id === sel.exerciseId)
        ?? BODYBUILDING_EXERCISES.find(e => e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === sel.exerciseId)
      const isCompound = dbEx ? ('category' in dbEx ? dbEx.category === 'compound' : dbEx.role === 'primary') : false

      // Y3T/generic-wave override rep range entirely; otherwise use style
      // with compound/isolation adjustment.
      let adjustedReps: [number, number]
      if (y3tWeek) {
        adjustedReps = y3tWeek.repRange
      } else if (waveWeek) {
        adjustedReps = parseWaveRepRange() ?? (style.repRange as [number, number])
      } else {
        const repRange = style.repRange as [number, number]
        adjustedReps = isCompound
          ? [repRange[0], Math.min(repRange[0] + 4, repRange[1])]
          : [Math.max(repRange[0], repRange[1] - 4), repRange[1]]
      }

      const effectiveRest = y3tWeek
        ? y3tWeek.restSeconds
        : (isCompound ? style.restSeconds[1] : style.restSeconds[0])

      // Annihilation: ~50% more sets. Generic wave: scale by the week's
      // volume multiplier (same idea, different curve).
      const numSets = isY3TAnnihilation
        ? Math.round(sel.sets * 1.5)
        : waveWeek
          ? Math.max(1, Math.round(sel.sets * waveWeek.volumeMultiplier))
          : sel.sets

      // PHAT/PH3 resolution: the day's first (primary compound) exercise is
      // always 3-5 reps / RIR 1-2, regardless of wave week — everything
      // after it follows the wave's hypertrophy rep range as normal.
      const phatOverride = isPhat && idx === 0
      const finalReps: [number, number] = phatOverride ? [3, 5] : adjustedReps
      const phatNote = phatOverride ? 'PHAT power slot — RIR 1-2' : undefined

      return {
        id: crypto.randomUUID(),
        exerciseId: sel.exerciseId,
        name: sel.exerciseName,
        targetMuscle: sel.bodyPart,
        sets: buildSets(numSets, finalReps),
        tempo: style.tempoDefault,
        restSeconds: effectiveRest,
        intensifier,
        notes: phatNote ?? (intensifier ? intensifierNotes(intensifier) : ''),
        order: idx + 1,
      }
    })
  }

  // Apply deload modifications: reduce sets by 40%, strip intensifiers
  if (effectiveIsDeload) {
    exercises = exercises.map(ex => ({
      ...ex,
      sets: ex.sets.slice(0, Math.max(1, Math.floor(ex.sets.length * 0.6))).map((s, i) => ({ ...s, setNumber: i + 1 })),
      intensifier: undefined,
      notes: '',
    }))
  }

  const baseNotes = effectiveIsDeload
    ? 'DELOAD WEEK — reduced volume'
    : y3tWeek
    ? y3tWeek.note
    : waveWeek
    ? `${waveWeek.stage.toUpperCase()} WEEK — ${waveWeek.repRangeLabel} reps, RIR ${waveWeek.rir[0]}-${waveWeek.rir[1]}`
    : ''

  // Cycle-to-cycle progression cue — reuses the app's existing per-exercise
  // history/PB tracking rather than a new numeric prescription engine; the
  // athlete checks their own logged numbers from Cycle 1 against this cue.
  const cycleNote = isBodybuildingPhilosophy(philosophy) && cycleNumber > 1
    ? `CYCLE ${cycleNumber} — beat your Cycle ${cycleNumber - 1} numbers on each lift.`
    : ''
  const workoutNotes = [cycleNote, baseNotes].filter(Boolean).join(' ')

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
