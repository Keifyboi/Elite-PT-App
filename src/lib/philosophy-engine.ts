import type { PhaseConfig, TrainingPhilosophy, TrainingStyle, CardioProtocol, SupplementItem } from './types'

// ─── Pose-priority program builder: universal 5-day split ───
// Shared by all 5 rewritten philosophies (Y3T/MI40/FST-7/PHAT/Corey-G).
// Traps always get a dedicated slot on Day 5 rather than leftover shoulder
// sets. Actual body-part resolution for each day happens in
// workout-generator.ts (getBodybuildingSplitBodyParts), not by string-parsing
// these labels, so the granular back-width/back-thickness/traps values never
// collide with the generic 'back'/'shoulders' keyword matching other
// philosophies still rely on.
const BODYBUILDING_SPLIT: Record<string, string> = {
  day1: 'Chest & Triceps',
  day2: 'Legs — Quad Focus',
  day3: 'Back & Biceps',
  day4: 'Legs — Hamstring/Glute Focus',
  day5: 'Shoulders, Traps & Arms',
}

// ─── Phase configurations for all 9 training philosophies ───

export const PHILOSOPHY_PHASES: Record<TrainingPhilosophy, PhaseConfig[]> = {

  // ─── Ben Pakulski — Incredible Bulk (Cyclical Bulking) ───
  'incredible-bulk': [
    {
      name: 'Growth',
      philosophy: 'incredible-bulk',
      durationWeeks: 4,
      macroSplit: { protein: 35, carbs: 45, fats: 20 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 1000,
      trainingStyle: {
        daysPerWeek: 6,
        setsPerBodyPart: [12, 20],
        repRange: [4, 10],
        restSeconds: [60, 120],
        tempoDefault: '4-0-1-2',
        intensifierFrequency: 'last-set',
        splitType: 'push-pull-legs-2x',
        split: {
          day1: 'Back & Biceps',
          day2: 'Chest & Triceps',
          day3: 'Quads & Abs',
          day4: 'Upper Back & Shoulders',
          day5: 'Arms',
          day6: 'Hamstrings & Calves',
        },
      },
      cardioProtocol: { type: 'none', sessionsPerWeek: 0, durationMinutes: 0 },
      supplementProtocol: [
        { name: 'Whey Protein', dose: '0.25-0.4g/lb BW', timing: 'Post-workout' },
        { name: 'Carb Powder', dose: '1-2g/lb BW around workout', timing: 'Intra/Post' },
        { name: 'Creatine', dose: '4-6g 3x/day', timing: 'With carb meals' },
        { name: 'Leucine', dose: '2-3g', timing: 'Post-workout + midday' },
        { name: 'Fish Oil', dose: '3-6g', timing: 'With meals' },
        { name: 'Magnesium', dose: '1200-1600mg', timing: 'With meals, PM' },
      ],
    },
    {
      name: 'Transition',
      philosophy: 'incredible-bulk',
      durationWeeks: 0.3, // 2 days
      macroSplit: { protein: 40, carbs: 0, fats: 60 },
      calorieStrategy: 'maintenance',
      calorieAdjustment: 0,
      trainingStyle: {
        daysPerWeek: 0,
        setsPerBodyPart: [0, 0],
        repRange: [0, 0],
        restSeconds: [0, 0],
        tempoDefault: '',
        intensifierFrequency: 'none',
        splitType: 'rest',
        split: {},
      },
      cardioProtocol: { type: 'hiit', sessionsPerWeek: 2, durationMinutes: 25, workRestRatio: '30:90' },
      supplementProtocol: [
        { name: 'Fish Oil', dose: '6-8g Omega-3s', timing: 'With meals' },
        { name: 'Greens Powder', dose: '6+ servings', timing: 'Throughout day' },
        { name: 'Electrolytes', dose: '1 tsp sodium bicarb 3x', timing: 'Throughout day' },
      ],
    },
    {
      name: 'Reset',
      philosophy: 'incredible-bulk',
      durationWeeks: 2,
      macroSplit: { protein: 50, carbs: 15, fats: 35 },
      calorieStrategy: 'deficit',
      calorieAdjustment: -1000,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [8, 12],
        repRange: [10, 15],
        restSeconds: [30, 60],
        tempoDefault: '3-0-1-2',
        intensifierFrequency: 'every-exercise',
        splitType: 'density',
        split: {
          day1: 'Back & Biceps',
          day2: 'HIIT / Metabolic',
          day3: 'Chest & Triceps',
          day4: 'Legs',
          day5: 'Shoulders, Calves & Abs',
          day6: 'HIIT / Metabolic',
        },
      },
      cardioProtocol: { type: 'mixed', sessionsPerWeek: 3, durationMinutes: 25, workRestRatio: '30:90' },
      supplementProtocol: [
        { name: 'L-Carnitine', dose: '2-6g/day', timing: 'Breakfast + Pre-WO' },
        { name: 'Fish Oil', dose: '6-9g', timing: 'With meals' },
        { name: 'Greens Powder', dose: '2 servings post-WO + 1 other', timing: 'Post-workout' },
        { name: 'Caffeine', dose: '400-600mg', timing: 'Pre-workout' },
        { name: 'Vitamin C', dose: '3-5g', timing: 'Post-WO + before bed' },
      ],
    },
  ],

  // ─── Ben Pakulski — MI40 ───
  // One block-wide phase: week-to-week rep/volume progression comes from
  // getGenericWaveWeek. MI40's identity (intra-set stretch + peak-contraction
  // holds) is cued per-exercise via Exercise.mi40Intention, not via phase
  // switching.
  'mi40': [
    {
      name: 'MI40 Block',
      philosophy: 'mi40',
      durationWeeks: 4, // 8 in Hypertrophy II (2 cycles) — see macrocycle.ts
      macroSplit: { protein: 38, carbs: 42, fats: 20 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 350,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [8, 14],
        repRange: [8, 12], // overridden weekly by getGenericWaveWeek
        restSeconds: [40, 90],
        tempoDefault: '4-0-1-0',
        intensifierFrequency: 'last-set',
        splitType: 'pose-priority',
        split: BODYBUILDING_SPLIT,
      },
      cardioProtocol: { type: 'none', sessionsPerWeek: 0, durationMinutes: 0 },
      supplementProtocol: [
        { name: 'Glutamine', dose: '15-20g', timing: 'Post-workout' },
        { name: 'BCAAs', dose: '20g+', timing: 'Pre/Intra/Post' },
      ],
    },
  ],

  // ─── Kris Gethin — DTP ───
  'dtp': [
    {
      name: 'DTP Block',
      philosophy: 'dtp',
      durationWeeks: 4,
      macroSplit: { protein: 40, carbs: 40, fats: 20 },
      calorieStrategy: 'deficit',
      calorieAdjustment: -400,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [10, 12],
        repRange: [5, 50],
        restSeconds: [45, 240],
        tempoDefault: '2-0-1-0',
        intensifierFrequency: 'every-exercise',
        splitType: 'dtp-pyramid',
        split: { day1: 'Chest', day2: 'Back', day3: 'Shoulders', day4: 'Legs', day5: 'Arms' },
      },
      cardioProtocol: { type: 'none', sessionsPerWeek: 0, durationMinutes: 0 },
      supplementProtocol: [
        { name: 'Water', dose: '1.5-2 gallons', timing: 'Throughout day' },
      ],
    },
  ],

  // ─── Neil Hill — Y3T ───
  // One block-wide phase: week-to-week variation comes entirely from
  // getY3TWeek's 3-week heavy/moderate/annihilation rotation (block-wave.ts),
  // not from switching phase entries. Split is the universal pose-priority
  // 5-day split (see BODYBUILDING_SPLIT below) — same for all 5 philosophies
  // this rewrite covers.
  'y3t': [
    {
      name: 'Y3T Block',
      philosophy: 'y3t',
      durationWeeks: 3, // one full heavy/moderate/annihilation rotation
      macroSplit: { protein: 40, carbs: 35, fats: 25 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 300,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [9, 12],
        repRange: [6, 15], // overridden weekly by getY3TWeek
        restSeconds: [90, 180], // overridden weekly by getY3TWeek
        tempoDefault: '4-0-1-0',
        intensifierFrequency: 'none', // Y3T's own annihilation-week giant-set override applies instead
        splitType: 'pose-priority',
        split: BODYBUILDING_SPLIT,
      },
      cardioProtocol: { type: 'liss', sessionsPerWeek: 2, durationMinutes: 20 },
      supplementProtocol: [],
    },
  ],

  // ─── Hany Rambod — FST-7 ───
  // One block-wide phase: week-to-week rep/volume progression comes from
  // getGenericWaveWeek (block-wave.ts), not from switching phase entries.
  'fst7': [
    {
      name: 'FST-7 Block',
      philosophy: 'fst7',
      durationWeeks: 4, // one generic wave cycle
      macroSplit: { protein: 35, carbs: 45, fats: 20 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 400,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [10, 14],
        repRange: [8, 12], // overridden weekly by getGenericWaveWeek
        restSeconds: [30, 120],
        tempoDefault: '3-0-1-0',
        intensifierFrequency: 'last-set', // FST-7 finisher goes on the final 1-2 exercises only
        splitType: 'pose-priority',
        split: BODYBUILDING_SPLIT,
      },
      cardioProtocol: { type: 'liss', sessionsPerWeek: 3, durationMinutes: 25 },
      supplementProtocol: [
        { name: 'Pre-WO sodium meal', dose: 'High sodium + lean protein + carbs', timing: '90-120min pre-WO' },
      ],
    },
  ],

  // ─── Dorian Yates — HIT ───
  'hit': [
    {
      name: 'Blood & Guts',
      philosophy: 'hit',
      durationWeeks: 8,
      macroSplit: { protein: 40, carbs: 40, fats: 20 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 500,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [3, 4],
        repRange: [6, 8],
        restSeconds: [120, 300],
        tempoDefault: '4-0-1-0',
        intensifierFrequency: 'every-exercise',
        splitType: 'hit-5day',
        split: { day1: 'Chest', day2: 'Back', day3: 'Shoulders', day4: 'Legs', day5: 'Arms' },
      },
      cardioProtocol: { type: 'none', sessionsPerWeek: 0, durationMinutes: 0 },
      supplementProtocol: [],
    },
  ],

  // ─── Layne Norton — PHAT ───
  // PHAT/PH3 resolution: the locked 5-day split has no room for separate
  // power/hypertrophy days, so every session's primary compound is
  // programmed PHAT-style (3-5 reps, RIR 1-2) regardless of the day, applied
  // in generateWorkout — everything after it follows the generic wave's
  // current-week hypertrophy rep range.
  'phat': [
    {
      name: 'PHAT Block',
      philosophy: 'phat',
      durationWeeks: 4, // 1-2 cycles per macrocycle.ts
      macroSplit: { protein: 32, carbs: 43, fats: 25 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 300,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [8, 14],
        repRange: [8, 12], // accessory work — overridden weekly by getGenericWaveWeek; primary compound is forced to [3,5]
        restSeconds: [60, 300],
        tempoDefault: '2-0-1-0',
        intensifierFrequency: 'none',
        splitType: 'pose-priority',
        split: BODYBUILDING_SPLIT,
      },
      cardioProtocol: { type: 'liss', sessionsPerWeek: 2, durationMinutes: 20 },
      supplementProtocol: [
        { name: 'Leucine', dose: '3-5g per meal', timing: 'Every 3.5-5 hours' },
      ],
    },
  ],

  // ─── Tudor Bompa — Periodisation ───
  'bompa': [
    {
      name: 'Anatomical Adaptation',
      philosophy: 'bompa',
      durationWeeks: 6,
      macroSplit: { protein: 30, carbs: 45, fats: 25 },
      calorieStrategy: 'maintenance',
      calorieAdjustment: 0,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [6, 9],
        repRange: [10, 15],
        restSeconds: [60, 90],
        tempoDefault: '2-0-2-0',
        intensifierFrequency: 'none',
        splitType: 'circuit',
        split: { day1: 'Chest', day2: 'Back', day3: 'Shoulders', day4: 'Legs', day5: 'Arms' },
      },
      cardioProtocol: { type: 'liss', sessionsPerWeek: 3, durationMinutes: 30 },
      supplementProtocol: [],
    },
    {
      name: 'Hypertrophy',
      philosophy: 'bompa',
      durationWeeks: 5,
      macroSplit: { protein: 35, carbs: 45, fats: 20 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 400,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [12, 18],
        repRange: [6, 12],
        restSeconds: [60, 120],
        tempoDefault: '3-0-1-0',
        intensifierFrequency: 'none',
        splitType: 'bodypart',
        split: { day1: 'Chest', day2: 'Back', day3: 'Shoulders', day4: 'Legs', day5: 'Arms' },
      },
      cardioProtocol: { type: 'liss', sessionsPerWeek: 2, durationMinutes: 20 },
      supplementProtocol: [],
    },
    {
      name: 'Maximum Strength',
      philosophy: 'bompa',
      durationWeeks: 5,
      macroSplit: { protein: 35, carbs: 35, fats: 30 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 200,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [9, 15],
        repRange: [1, 5],
        restSeconds: [180, 300],
        tempoDefault: '3-0-X-0',
        intensifierFrequency: 'none',
        splitType: 'upper-lower',
        split: { day1: 'Chest', day2: 'Back', day3: 'Legs', day4: 'Shoulders', day5: 'Arms' },
      },
      cardioProtocol: { type: 'none', sessionsPerWeek: 0, durationMinutes: 0 },
      supplementProtocol: [
        { name: 'Creatine', dose: '5g', timing: 'Post-workout' },
      ],
    },
    {
      name: 'Conversion / Power',
      philosophy: 'bompa',
      durationWeeks: 4,
      macroSplit: { protein: 30, carbs: 50, fats: 20 },
      calorieStrategy: 'maintenance',
      calorieAdjustment: 0,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [6, 10],
        repRange: [3, 6],
        restSeconds: [120, 240],
        tempoDefault: '2-0-X-0',
        intensifierFrequency: 'none',
        splitType: 'power',
        split: { day1: 'Upper Power', day2: 'Lower Power', day3: 'Chest', day4: 'Back', day5: 'Legs' },
      },
      cardioProtocol: { type: 'hiit', sessionsPerWeek: 2, durationMinutes: 15 },
      supplementProtocol: [],
    },
  ],

  // ─── Corey Gregory — Squat Every Day ───
  // One block-wide phase on the universal 5-day split, giant-set volume
  // overload for lagging parts; week-to-week progression from the generic wave.
  'corey-g': [
    {
      name: 'Corey-G Block',
      philosophy: 'corey-g',
      durationWeeks: 4,
      macroSplit: { protein: 30, carbs: 40, fats: 30 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 500,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [10, 16],
        repRange: [10, 15], // overridden weekly by getGenericWaveWeek
        restSeconds: [30, 90],
        tempoDefault: '2-0-1-0',
        intensifierFrequency: 'every-exercise', // giant sets — high density, minimal rest
        splitType: 'pose-priority',
        split: BODYBUILDING_SPLIT,
      },
      cardioProtocol: { type: 'liss', sessionsPerWeek: 3, durationMinutes: 20 },
      supplementProtocol: [
        { name: 'Glucosamine', dose: 'Per label', timing: 'Daily' },
        { name: 'Fish Oil', dose: 'High dose', timing: 'Daily' },
        { name: 'Intra-workout Aminos', dose: '10-15g', timing: 'During training' },
      ],
    },
  ],

  // ─── Norton/Baker — Contest Prep ───
  'contest-prep': [
    {
      name: 'Early Prep (20+ weeks out)',
      philosophy: 'contest-prep',
      durationWeeks: 12,
      macroSplit: { protein: 35, carbs: 40, fats: 25 },
      calorieStrategy: 'deficit',
      calorieAdjustment: -400,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [8, 10],
        repRange: [6, 12],
        restSeconds: [60, 180],
        tempoDefault: '3-0-1-0',
        intensifierFrequency: 'none',
        splitType: 'upper-lower-2x',
        split: { day1: 'Upper', day2: 'Lower', day3: 'Upper', day4: 'Lower', day5: 'Weak Points' },
      },
      cardioProtocol: { type: 'mixed', sessionsPerWeek: 3, durationMinutes: 25 },
      supplementProtocol: [
        { name: 'Creatine', dose: '3-5g/day', timing: 'Daily' },
        { name: 'Caffeine', dose: '3-6mg/kg', timing: '60min pre-WO' },
        { name: 'Fish Oil', dose: '1860mg EPA + 1500mg DHA', timing: 'With meals' },
        { name: 'Citrulline', dose: '6-8g', timing: '1-2hr pre-WO' },
        { name: 'Melatonin', dose: '3-5mg', timing: '30-60min before bed' },
      ],
    },
    {
      name: 'Mid Prep (12-8 weeks out)',
      philosophy: 'contest-prep',
      durationWeeks: 4,
      macroSplit: { protein: 40, carbs: 35, fats: 25 },
      calorieStrategy: 'deficit',
      calorieAdjustment: -600,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [8, 10],
        repRange: [6, 12],
        restSeconds: [60, 150],
        tempoDefault: '3-0-1-0',
        intensifierFrequency: 'last-set',
        splitType: 'upper-lower-2x',
        split: { day1: 'Upper', day2: 'Lower', day3: 'Upper', day4: 'Lower', day5: 'Weak Points' },
      },
      cardioProtocol: { type: 'mixed', sessionsPerWeek: 4, durationMinutes: 30 },
      supplementProtocol: [],
    },
    {
      name: 'Peak Week',
      philosophy: 'contest-prep',
      durationWeeks: 1,
      macroSplit: { protein: 35, carbs: 40, fats: 25 },
      calorieStrategy: 'maintenance',
      calorieAdjustment: 0,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [6, 8],
        repRange: [8, 12],
        restSeconds: [60, 120],
        tempoDefault: '3-0-1-0',
        intensifierFrequency: 'none',
        splitType: 'peak-week',
        split: { day1: 'Legs', day2: 'Chest', day3: 'Back', day4: 'Shoulders', day5: 'Arms' },
      },
      cardioProtocol: { type: 'liss', sessionsPerWeek: 2, durationMinutes: 20 },
      supplementProtocol: [],
    },
  ],
}

// ─── Helper functions ───

export function getPhases(philosophy: TrainingPhilosophy): PhaseConfig[] {
  return PHILOSOPHY_PHASES[philosophy] ?? []
}

export function getCurrentPhase(philosophy: TrainingPhilosophy, phaseName: string): PhaseConfig | undefined {
  return getPhases(philosophy).find(p => p.name === phaseName)
}

export function getNextPhase(philosophy: TrainingPhilosophy, currentPhaseName: string): PhaseConfig | undefined {
  const phases = getPhases(philosophy)
  const idx = phases.findIndex(p => p.name === currentPhaseName)
  if (idx < 0) return phases[0]
  return phases[(idx + 1) % phases.length]
}

export function getPhilosophyLabel(philosophy: TrainingPhilosophy): string {
  const labels: Record<TrainingPhilosophy, string> = {
    'mi40': 'MI40 (Ben Pakulski)',
    'incredible-bulk': 'Incredible Bulk (Ben Pakulski)',
    'dtp': 'DTP (Kris Gethin)',
    'y3t': 'Y3T (Neil Hill)',
    'fst7': 'FST-7 (Hany Rambod)',
    'hit': 'HIT / Blood & Guts (Dorian Yates)',
    'phat': 'PHAT (Layne Norton)',
    'bompa': 'Periodisation (Tudor Bompa)',
    'corey-g': 'Squat Every Day (Corey Gregory)',
    'contest-prep': 'Contest Prep (Norton/Baker)',
  }
  return labels[philosophy]
}
