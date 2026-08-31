import type { PhaseConfig, TrainingPhilosophy, TrainingStyle, CardioProtocol, SupplementItem } from './types'

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
  'mi40': [
    {
      name: 'Phase 1-2 (High Frequency)',
      philosophy: 'mi40',
      durationWeeks: 2,
      macroSplit: { protein: 40, carbs: 40, fats: 20 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 300,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [8, 12],
        repRange: [8, 12],
        restSeconds: [40, 40],
        tempoDefault: '4-0-1-0',
        intensifierFrequency: 'last-set',
        splitType: 'mi40-40min',
        split: { day1: 'Chest', day2: 'Back', day3: 'Shoulders & Arms', day4: 'Legs', day5: 'Weak Points' },
      },
      cardioProtocol: { type: 'none', sessionsPerWeek: 0, durationMinutes: 0 },
      supplementProtocol: [
        { name: 'Glutamine', dose: '15-20g', timing: 'Post-workout' },
        { name: 'BCAAs', dose: '20g+', timing: 'Pre/Intra/Post' },
      ],
    },
    {
      name: 'Phase 3 (Power/Hypertrophy)',
      philosophy: 'mi40',
      durationWeeks: 1,
      macroSplit: { protein: 35, carbs: 45, fats: 20 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 400,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [10, 14],
        repRange: [6, 10],
        restSeconds: [60, 90],
        tempoDefault: '4-0-1-0',
        intensifierFrequency: 'last-set',
        splitType: 'mi40-power',
        split: { day1: 'Chest & Triceps', day2: 'Back & Biceps', day3: 'Legs', day4: 'Shoulders', day5: 'Arms' },
      },
      cardioProtocol: { type: 'none', sessionsPerWeek: 0, durationMinutes: 0 },
      supplementProtocol: [],
    },
    {
      name: 'Phase 5 (De-Load)',
      philosophy: 'mi40',
      durationWeeks: 1,
      macroSplit: { protein: 35, carbs: 45, fats: 20 },
      calorieStrategy: 'maintenance',
      calorieAdjustment: 0,
      trainingStyle: {
        daysPerWeek: 3,
        setsPerBodyPart: [4, 6],
        repRange: [10, 12],
        restSeconds: [60, 90],
        tempoDefault: '3-0-1-0',
        intensifierFrequency: 'none',
        splitType: 'deload',
        split: { day1: 'Upper', day2: 'Lower', day3: 'Full Body' },
      },
      cardioProtocol: { type: 'liss', sessionsPerWeek: 2, durationMinutes: 20 },
      supplementProtocol: [],
    },
    {
      name: 'Phase 6 (Overreaching)',
      philosophy: 'mi40',
      durationWeeks: 1,
      macroSplit: { protein: 40, carbs: 40, fats: 20 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 500,
      trainingStyle: {
        daysPerWeek: 6,
        setsPerBodyPart: [14, 20],
        repRange: [8, 12],
        restSeconds: [40, 60],
        tempoDefault: '4-0-1-0',
        intensifierFrequency: 'every-exercise',
        splitType: 'mi40-overreach',
        split: { day1: 'Chest', day2: 'Back', day3: 'Legs', day4: 'Shoulders', day5: 'Arms', day6: 'Weak Points' },
      },
      cardioProtocol: { type: 'none', sessionsPerWeek: 0, durationMinutes: 0 },
      supplementProtocol: [
        { name: 'Glutamine', dose: '20-30g', timing: 'Post + with meals' },
        { name: 'Vitamin C', dose: '2g', timing: 'Post each workout' },
        { name: 'Magnesium', dose: '+200-400mg extra', timing: 'PM' },
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
  'y3t': [
    {
      name: 'Week 1 (Heavy)',
      philosophy: 'y3t',
      durationWeeks: 1,
      macroSplit: { protein: 40, carbs: 30, fats: 30 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 300,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [9, 12],
        repRange: [6, 10],
        restSeconds: [120, 180],
        tempoDefault: '4-0-1-0',
        intensifierFrequency: 'none',
        splitType: 'bodypart',
        split: { day1: 'Chest', day2: 'Back', day3: 'Shoulders', day4: 'Legs', day5: 'Arms' },
      },
      cardioProtocol: { type: 'liss', sessionsPerWeek: 2, durationMinutes: 20 },
      supplementProtocol: [],
    },
    {
      name: 'Week 2 (Hypertrophy)',
      philosophy: 'y3t',
      durationWeeks: 1,
      macroSplit: { protein: 35, carbs: 40, fats: 25 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 300,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [9, 12],
        repRange: [10, 14],
        restSeconds: [60, 90],
        tempoDefault: '4-0-1-0',
        intensifierFrequency: 'none',
        splitType: 'bodypart',
        split: { day1: 'Chest', day2: 'Back', day3: 'Shoulders', day4: 'Legs', day5: 'Arms' },
      },
      cardioProtocol: { type: 'liss', sessionsPerWeek: 2, durationMinutes: 20 },
      supplementProtocol: [],
    },
    {
      name: 'Week 3 (Annihilation)',
      philosophy: 'y3t',
      durationWeeks: 1,
      macroSplit: { protein: 30, carbs: 50, fats: 20 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 400,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [6, 10],
        repRange: [20, 100],
        restSeconds: [30, 60],
        tempoDefault: '4-0-1-0',
        intensifierFrequency: 'every-exercise',
        splitType: 'bodypart',
        split: { day1: 'Chest', day2: 'Back', day3: 'Shoulders', day4: 'Legs', day5: 'Arms' },
      },
      cardioProtocol: { type: 'liss', sessionsPerWeek: 2, durationMinutes: 20 },
      supplementProtocol: [],
    },
  ],

  // ─── Hany Rambod — FST-7 ───
  'fst7': [
    {
      name: 'FST-7 Block',
      philosophy: 'fst7',
      durationWeeks: 6,
      macroSplit: { protein: 35, carbs: 45, fats: 20 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 400,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [10, 14],
        repRange: [8, 12],
        restSeconds: [30, 120],
        tempoDefault: '3-0-1-0',
        intensifierFrequency: 'last-set',
        splitType: 'bodypart-fst7',
        split: { day1: 'Chest & Triceps', day2: 'Back & Biceps', day3: 'Legs', day4: 'Shoulders & Calves', day5: 'Arms' },
        // Template keys match exactly
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
  'phat': [
    {
      name: 'PHAT Block',
      philosophy: 'phat',
      durationWeeks: 8,
      macroSplit: { protein: 30, carbs: 45, fats: 25 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 300,
      trainingStyle: {
        daysPerWeek: 5,
        setsPerBodyPart: [8, 14],
        repRange: [3, 20],
        restSeconds: [60, 300],
        tempoDefault: '2-0-1-0',
        intensifierFrequency: 'none',
        splitType: 'phat',
        split: {
          day1: 'Upper Body Power',
          day2: 'Lower Body Power',
          day3: 'Back & Shoulders Hypertrophy',
          day4: 'Lower Body Hypertrophy',
          day5: 'Chest & Arms Hypertrophy',
        },
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
  'corey-g': [
    {
      name: 'Squat Every Day + Get Swole',
      philosophy: 'corey-g',
      durationWeeks: 6,
      macroSplit: { protein: 30, carbs: 40, fats: 30 },
      calorieStrategy: 'surplus',
      calorieAdjustment: 500,
      trainingStyle: {
        daysPerWeek: 7,
        setsPerBodyPart: [8, 12],
        repRange: [1, 15],
        restSeconds: [60, 120],
        tempoDefault: '2-0-1-0',
        intensifierFrequency: 'none',
        splitType: 'daily-squat-plus',
        split: {
          day1: 'Squat + Chest & Back Giant Sets',
          day2: 'Squat + Shoulders & Arms Giant Sets',
          day3: 'Squat + Back & Biceps',
          day4: 'Squat + Chest & Triceps',
          day5: 'Squat + Full Upper Giant Sets',
          day6: 'Squat + Conditioning',
          day7: 'Squat + Lunges (Finisher)',
        },
      },
      cardioProtocol: { type: 'liss', sessionsPerWeek: 7, durationMinutes: 0 },
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
