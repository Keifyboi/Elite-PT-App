import type { BodyPart, Intensifier } from '@/lib/types'

// Structured workout templates for each split day
// Exercises are ordered: compounds first → isolation → finishing moves
// Each template defines the exact session structure

export interface ExerciseTemplate {
  name: string
  bodyPart: BodyPart | 'shoulders' | 'rear-delts' | 'side-delts' | 'front-delts' | 'traps' | 'upper-back'
  category: 'compound' | 'isolation' | 'machine' | 'cable' | 'bodyweight'
  sets: number
  repRange: [number, number]
  tempo?: string
  restSeconds?: number
  intensifier?: Intensifier
  notes?: string
}

export interface WorkoutTemplate {
  splitDay: string
  exercises: ExerciseTemplate[]
}

// ─── Shoulder exercises (missing from main DB) ───

export const SHOULDER_EXERCISES = [
  { name: 'Seated Dumbbell Overhead Press', bodyPart: 'shoulders' as const },
  { name: 'Standing Barbell Overhead Press', bodyPart: 'shoulders' as const },
  { name: 'Dumbbell Lateral Raises', bodyPart: 'shoulders' as const },
  { name: 'Cable Lateral Raises', bodyPart: 'shoulders' as const },
  { name: 'Seated Cable Lateral Raises', bodyPart: 'shoulders' as const },
  { name: 'Bent-Over Dumbbell Rear Delt Raises', bodyPart: 'shoulders' as const },
  { name: 'Cable Rear Delt Flyes', bodyPart: 'shoulders' as const },
  { name: 'Reverse Pec Deck', bodyPart: 'shoulders' as const },
  { name: 'Face Pulls', bodyPart: 'shoulders' as const },
  { name: 'Dumbbell Front Raises', bodyPart: 'shoulders' as const },
  { name: 'Arnold Press', bodyPart: 'shoulders' as const },
  { name: 'Machine Shoulder Press', bodyPart: 'shoulders' as const },
  { name: 'Prone Incline Dumbbell Lateral Raises', bodyPart: 'shoulders' as const },
  { name: 'Upright Rows', bodyPart: 'shoulders' as const },
  { name: 'Plate Bus Drivers', bodyPart: 'shoulders' as const },
  { name: 'Dumbbell Shrugs', bodyPart: 'shoulders' as const },
  { name: 'Cable Shrugs', bodyPart: 'shoulders' as const },
  { name: 'Barbell Shrugs', bodyPart: 'shoulders' as const },
]

// ─── Glute exercises (underrepresented in main DB) ───

export const GLUTE_EXERCISES = [
  { name: 'Barbell Hip Thrusts', bodyPart: 'glutes' as const },
  { name: 'Cable Pull-Throughs', bodyPart: 'glutes' as const },
  { name: 'Glute Kickbacks', bodyPart: 'glutes' as const },
  { name: 'Sumo Deadlifts', bodyPart: 'glutes' as const },
  { name: 'Bulgarian Split Squats (Glute Focus)', bodyPart: 'glutes' as const },
  { name: 'Walking Lunges', bodyPart: 'glutes' as const },
  { name: 'Barbell Glute Bridge', bodyPart: 'glutes' as const },
  { name: 'Single-Leg Hip Thrust', bodyPart: 'glutes' as const },
]

// ─── IB / MI40 WORKOUT TEMPLATES ───

export const IB_RESET_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Back & Biceps': {
    splitDay: 'Back & Biceps',
    exercises: [
      { name: 'Wide-Grip Lat Pulldowns', bodyPart: 'back', category: 'cable', sets: 3, repRange: [10, 12], tempo: '3-0-1-2', restSeconds: 45, notes: 'Depress shoulder blades, squeeze lats' },
      { name: 'Dumbbell Preacher Curls', bodyPart: 'biceps', category: 'isolation', sets: 3, repRange: [10, 12], tempo: '3-0-1-2', restSeconds: 45 },
      { name: 'Seated Cable Rows (1½ reps)', bodyPart: 'back', category: 'cable', sets: 4, repRange: [10, 12], tempo: '3-0-2-0', restSeconds: 10, intensifier: '1.5-reps' },
      { name: 'Standing Cable Pullovers', bodyPart: 'back', category: 'cable', sets: 4, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60, intensifier: 'nos' },
      { name: 'Standing Alternating Dumbbell Curls', bodyPart: 'biceps', category: 'isolation', sets: 3, repRange: [10, 12], tempo: '3-1-1-1', restSeconds: 10 },
      { name: 'Incline Dumbbell Curls', bodyPart: 'biceps', category: 'isolation', sets: 3, repRange: [10, 12], tempo: '3-1-1-0', restSeconds: 60, intensifier: 'nos-x' },
    ],
  },
  'Chest & Triceps': {
    splitDay: 'Chest & Triceps',
    exercises: [
      { name: 'Cable Flyes', bodyPart: 'chest', category: 'cable', sets: 3, repRange: [10, 12], tempo: '3-0-1-2', restSeconds: 45 },
      { name: 'Single-Arm Rope Tricep Pushdowns', bodyPart: 'triceps', category: 'cable', sets: 3, repRange: [10, 12], tempo: '3-0-1-2', restSeconds: 45 },
      { name: 'Machine Bench Press', bodyPart: 'chest', category: 'machine', sets: 4, repRange: [10, 12], tempo: '3-0-2-0', restSeconds: 10 },
      { name: 'Dumbbell Bench Press (1½ reps)', bodyPart: 'chest', category: 'compound', sets: 4, repRange: [6, 8], tempo: '3-0-1-0', restSeconds: 60, intensifier: 'nos-x' },
      { name: 'Overhead Rope Tricep Extensions', bodyPart: 'triceps', category: 'cable', sets: 3, repRange: [10, 12], tempo: '3-1-1-0', restSeconds: 10 },
      { name: 'Lying Dumbbell Tricep Extensions', bodyPart: 'triceps', category: 'isolation', sets: 3, repRange: [10, 12], tempo: '3-1-1-0', restSeconds: 60, intensifier: 'nos' },
    ],
  },
  'Legs': {
    splitDay: 'Legs',
    exercises: [
      { name: 'Hack Squats', bodyPart: 'quads', category: 'machine', sets: 4, repRange: [10, 12], tempo: '4-0-1-0', restSeconds: 60 },
      { name: 'Lying Leg Curls (1¼ reps)', bodyPart: 'hamstrings', category: 'machine', sets: 4, repRange: [8, 12], tempo: '4-0-1-0', restSeconds: 60, intensifier: 'nos' },
      { name: 'Leg Extensions', bodyPart: 'quads', category: 'machine', sets: 4, repRange: [10, 12], tempo: '3-0-1-3', restSeconds: 60, intensifier: 'cs-6' },
      { name: 'Stiff-Leg Deadlifts', bodyPart: 'hamstrings', category: 'compound', sets: 4, repRange: [10, 12], tempo: '3-2-1-0', restSeconds: 45 },
      { name: 'Leg Press', bodyPart: 'quads', category: 'machine', sets: 4, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 15, intensifier: 'nos-x' },
      { name: 'Barbell Back Squats (Heels Elevated)', bodyPart: 'quads', category: 'compound', sets: 4, repRange: [10, 12], tempo: '3-2-1-0', restSeconds: 60 },
      { name: 'Seated Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 4, repRange: [8, 10], tempo: '3-2-X-0', restSeconds: 15, intensifier: 'nos' },
      { name: 'Standing Calf Raises', bodyPart: 'calves', category: 'machine', sets: 5, repRange: [6, 8], tempo: '2-4-1-0', restSeconds: 15 },
      { name: 'Seated Calf Raises', bodyPart: 'calves', category: 'machine', sets: 5, repRange: [12, 15], tempo: '2-2-1-0', restSeconds: 45 },
    ],
  },
  'Shoulders, Calves & Abs': {
    splitDay: 'Shoulders, Calves & Abs',
    exercises: [
      { name: 'Cable Lateral Raises', bodyPart: 'shoulders', category: 'cable', sets: 4, repRange: [10, 12], tempo: '3-0-1-2', restSeconds: 15, intensifier: 'nos' },
      { name: 'Low Pulley Shrugs', bodyPart: 'shoulders', category: 'cable', sets: 6, repRange: [6, 8], tempo: '2-1-1-2', restSeconds: 60 },
      { name: 'Prone Incline Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 4, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 10, intensifier: 'nos' },
      { name: 'Seated Rows (Wide Overhand, Rear Delt Focus)', bodyPart: 'shoulders', category: 'cable', sets: 4, repRange: [10, 12], tempo: '3-0-1-2', restSeconds: 60, intensifier: 'nos-x' },
      { name: 'Reverse Pec Deck', bodyPart: 'shoulders', category: 'machine', sets: 3, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 10 },
      { name: 'Standing Face Pulls', bodyPart: 'shoulders', category: 'cable', sets: 3, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 15 },
      { name: 'Dumbbell Front Raises', bodyPart: 'shoulders', category: 'isolation', sets: 3, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60 },
      { name: 'Lying Reverse Crunches', bodyPart: 'abs', category: 'bodyweight', sets: 3, repRange: [10, 12], tempo: '2-0-1-2', restSeconds: 10 },
      { name: 'Dumbbell Crunches (Feet on Bench)', bodyPart: 'abs', category: 'isolation', sets: 3, repRange: [10, 12], tempo: '3-0-1-2', restSeconds: 60 },
      { name: 'Standing Calf Raises', bodyPart: 'calves', category: 'machine', sets: 5, repRange: [6, 8], tempo: '2-4-1-0', restSeconds: 15 },
      { name: 'Seated Calf Raises', bodyPart: 'calves', category: 'machine', sets: 5, repRange: [12, 15], tempo: '2-2-1-0', restSeconds: 45 },
    ],
  },
}

export const IB_GROWTH_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Back & Biceps': {
    splitDay: 'Back & Biceps',
    exercises: [
      { name: 'Bent-Over Dumbbell Rows', bodyPart: 'back', category: 'compound', sets: 6, repRange: [6, 8], tempo: '4-0-1-2', restSeconds: 90 },
      { name: 'Seated Cable Rows (Elevated Seat)', bodyPart: 'back', category: 'cable', sets: 6, repRange: [6, 8], tempo: '3-0-1-2', restSeconds: 75 },
      { name: 'Cable Pullovers (Bent Over)', bodyPart: 'back', category: 'cable', sets: 4, repRange: [10, 12], tempo: '3-1-1-0', restSeconds: 60 },
      { name: 'Incline Dumbbell Curls (Supinated)', bodyPart: 'biceps', category: 'isolation', sets: 4, repRange: [8, 10], tempo: '4-1-1-0', restSeconds: 60 },
      { name: 'Supinated Lat Pulldowns', bodyPart: 'back', category: 'cable', sets: 4, repRange: [10, 12], tempo: '3-0-1-1', restSeconds: 75 },
      { name: 'Seated Dumbbell Curls (Supinating)', bodyPart: 'biceps', category: 'isolation', sets: 4, repRange: [8, 10], tempo: '3-0-1-1', restSeconds: 60 },
    ],
  },
  'Chest & Triceps': {
    splitDay: 'Chest & Triceps',
    exercises: [
      { name: 'Pec Deck Flyes', bodyPart: 'chest', category: 'machine', sets: 4, repRange: [10, 12], tempo: '3-0-1-2', restSeconds: 60 },
      { name: 'Single-Arm Rope Tricep Pushdowns', bodyPart: 'triceps', category: 'cable', sets: 4, repRange: [8, 10], tempo: '3-0-1-2', restSeconds: 60 },
      { name: 'Barbell Bench Press', bodyPart: 'chest', category: 'compound', sets: 6, repRange: [6, 8], tempo: '4-0-1-0', restSeconds: 90 },
      { name: 'Machine Decline Press', bodyPart: 'chest', category: 'machine', sets: 4, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 90 },
      { name: 'Dumbbell Flyes', bodyPart: 'chest', category: 'isolation', sets: 4, repRange: [10, 12], tempo: '3-2-1-0', restSeconds: 60 },
      { name: 'Overhead Rope Tricep Extensions', bodyPart: 'triceps', category: 'cable', sets: 4, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60 },
      { name: 'Parallel Bar Dips (Chest)', bodyPart: 'chest', category: 'bodyweight', sets: 4, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60 },
    ],
  },
  'Quads & Abs': {
    splitDay: 'Quads & Abs',
    exercises: [
      { name: 'Barbell Back Squats (Heels Elevated)', bodyPart: 'quads', category: 'compound', sets: 4, repRange: [6, 8], tempo: '4-1-1-0', restSeconds: 90 },
      { name: 'Leg Press', bodyPart: 'quads', category: 'machine', sets: 4, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 90 },
      { name: 'Leg Extensions', bodyPart: 'quads', category: 'machine', sets: 6, repRange: [10, 12], tempo: '3-0-1-3', restSeconds: 60 },
      { name: 'Hanging Leg Raises', bodyPart: 'abs', category: 'bodyweight', sets: 4, repRange: [10, 12], tempo: '2-0-1-2', restSeconds: 60 },
      { name: 'Stability Ball Crunches', bodyPart: 'abs', category: 'bodyweight', sets: 4, repRange: [10, 12], tempo: '3-0-1-2', restSeconds: 60 },
    ],
  },
  'Upper Back & Shoulders': {
    splitDay: 'Upper Back & Shoulders',
    exercises: [
      { name: 'Seated Dumbbell Shoulder Press (Neutral Grip)', bodyPart: 'shoulders', category: 'compound', sets: 6, repRange: [10, 12], tempo: '3-0-1-2', restSeconds: 60 },
      { name: 'Pull-Ups (Neutral Grip)', bodyPart: 'back', category: 'compound', sets: 6, repRange: [8, 10], tempo: '3-0-1-2', restSeconds: 60 },
      { name: 'Dumbbell Rows', bodyPart: 'back', category: 'compound', sets: 6, repRange: [6, 8], tempo: '4-0-1-1', restSeconds: 90 },
      { name: 'Cable Lateral Raises', bodyPart: 'shoulders', category: 'cable', sets: 4, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 45 },
      { name: 'Dumbbell Lateral Raises (Seated)', bodyPart: 'shoulders', category: 'isolation', sets: 4, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 45 },
      { name: 'Prone Incline Dumbbell Rear Delt Raises', bodyPart: 'shoulders', category: 'isolation', sets: 4, repRange: [10, 12], tempo: '3-0-1-1', restSeconds: 45 },
      { name: 'Cable Face Pulls', bodyPart: 'shoulders', category: 'cable', sets: 4, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 45 },
    ],
  },
  'Arms': {
    splitDay: 'Arms',
    exercises: [
      { name: 'Prone Dumbbell Curls (Neutral Grip)', bodyPart: 'biceps', category: 'isolation', sets: 6, repRange: [8, 8], tempo: '3-0-1-2', restSeconds: 60 },
      { name: 'Single-Arm Rope Tricep Pushdowns', bodyPart: 'triceps', category: 'cable', sets: 6, repRange: [6, 8], tempo: '3-0-1-2', restSeconds: 60 },
      { name: 'Incline Cable Curls', bodyPart: 'biceps', category: 'cable', sets: 5, repRange: [8, 10], tempo: '4-1-1-0', restSeconds: 60 },
      { name: 'Overhead Tricep Extensions (Rope)', bodyPart: 'triceps', category: 'cable', sets: 5, repRange: [8, 10], tempo: '4-1-1-0', restSeconds: 60 },
      { name: 'EZ Bar Reverse Curls', bodyPart: 'biceps', category: 'compound', sets: 4, repRange: [6, 8], tempo: '4-0-1-0', restSeconds: 10 },
      { name: 'Seated Zottman Curls', bodyPart: 'biceps', category: 'isolation', sets: 4, repRange: [10, 12], tempo: '3-0-1-1', restSeconds: 60 },
      { name: 'EZ Bar California Press', bodyPart: 'triceps', category: 'compound', sets: 4, repRange: [6, 8], tempo: '4-1-1-0', restSeconds: 10 },
      { name: 'Rope Pushdowns', bodyPart: 'triceps', category: 'cable', sets: 4, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60 },
    ],
  },
  'Hamstrings & Calves': {
    splitDay: 'Hamstrings & Calves',
    exercises: [
      { name: 'Lying Leg Curls (1¼ reps)', bodyPart: 'hamstrings', category: 'machine', sets: 5, repRange: [4, 6], tempo: '4-0-1-0', restSeconds: 60 },
      { name: 'Standing Calf Raises (Straight Toes)', bodyPart: 'calves', category: 'machine', sets: 5, repRange: [6, 8], tempo: '2-4-1-0', restSeconds: 60 },
      { name: 'Stiff-Leg Deadlifts', bodyPart: 'hamstrings', category: 'compound', sets: 5, repRange: [10, 12], tempo: '3-2-1-0', restSeconds: 60 },
      { name: 'Seated Calf Raises (Toes Out)', bodyPart: 'calves', category: 'machine', sets: 5, repRange: [12, 15], tempo: '2-2-1-2', restSeconds: 60 },
      { name: 'Seated Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 5, repRange: [6, 8], tempo: '3-2-X-0', restSeconds: 60 },
      { name: 'Glute-Ham Raises', bodyPart: 'hamstrings', category: 'bodyweight', sets: 5, repRange: [8, 12], tempo: '3-0-1-2', restSeconds: 60 },
    ],
  },
}

// ─── HIIT / Metabolic Session Templates ───
// From MI40-X Advanced HIIT Blueprint + IB Transition protocols

const HIIT_SESSION: WorkoutTemplate = {
  splitDay: 'HIIT / Metabolic',
  exercises: [
    { name: 'Warm-Up (Low Intensity)', bodyPart: 'quads', category: 'bodyweight', sets: 1, repRange: [5, 5], restSeconds: 0, notes: '5 minutes — spin bike or incline treadmill walk at conversational pace' },
    { name: 'HIIT Intervals — Sprint', bodyPart: 'quads', category: 'bodyweight', sets: 10, repRange: [30, 30], restSeconds: 90, notes: '30 seconds ALL-OUT effort → 90 seconds coast/rest. Prowler sled, spin bike, or outdoor sprints preferred. Avoid treadmill.' },
    { name: 'Cool-Down (Low Intensity)', bodyPart: 'quads', category: 'bodyweight', sets: 1, repRange: [5, 5], restSeconds: 0, notes: '5 minutes — gradually decreasing pace' },
  ],
}

const METABOLIC_SESSION: WorkoutTemplate = {
  splitDay: 'HIIT / Metabolic',
  exercises: [
    { name: 'Warm-Up', bodyPart: 'quads', category: 'bodyweight', sets: 1, repRange: [5, 5], restSeconds: 0, notes: '5 minutes light cardio' },
    { name: 'Farmers Walks', bodyPart: 'quads', category: 'compound', sets: 4, repRange: [40, 40], restSeconds: 60, notes: '40m per set — heavy dumbbells or trap bar' },
    { name: 'Sled Pushes', bodyPart: 'quads', category: 'compound', sets: 4, repRange: [30, 30], restSeconds: 90, notes: '30m per set — moderate weight, maximal speed' },
    { name: 'Battle Ropes', bodyPart: 'shoulders', category: 'bodyweight', sets: 4, repRange: [30, 30], restSeconds: 60, notes: '30 seconds per set — alternating waves' },
    { name: 'Kettlebell Swings', bodyPart: 'hamstrings', category: 'compound', sets: 4, repRange: [15, 20], restSeconds: 60, notes: 'Hip hinge, explosive. Not a squat.' },
    { name: 'Cool-Down', bodyPart: 'quads', category: 'bodyweight', sets: 1, repRange: [5, 5], restSeconds: 0, notes: '5 minutes stretching + foam roll' },
  ],
}

// ─── DTP (Kris Gethin) TEMPLATES ───

export const DTP_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Chest': {
    splitDay: 'Chest',
    exercises: [
      { name: 'Barbell Bench Press', bodyPart: 'chest', category: 'compound', sets: 12, repRange: [5, 50], restSeconds: 45, intensifier: 'rest-pause', notes: 'DTP PYRAMID: 50→40→30→20→10→5→5→10→20→30→40→50. Rest 45s high reps, 240s heavy. Rest-pause if failing before target.' },
      { name: 'Incline Dumbbell Flyes', bodyPart: 'chest', category: 'isolation', sets: 3, repRange: [12, 15], restSeconds: 30, intensifier: 'drop-set', notes: 'Finisher: 3 drop sets to flush remaining energy' },
    ],
  },
  'Back': {
    splitDay: 'Back',
    exercises: [
      { name: 'Bent-Over Barbell Rows', bodyPart: 'back', category: 'compound', sets: 12, repRange: [5, 50], restSeconds: 45, intensifier: 'rest-pause', notes: 'DTP PYRAMID: 50→40→30→20→10→5→5→10→20→30→40→50. Rest 45s high reps, 240s heavy.' },
      { name: 'Straight-Arm Lat Pulldowns', bodyPart: 'back', category: 'cable', sets: 3, repRange: [12, 15], restSeconds: 30, intensifier: 'drop-set', notes: 'Finisher: 3 drop sets' },
    ],
  },
  'Shoulders': {
    splitDay: 'Shoulders',
    exercises: [
      { name: 'Seated Overhead Press', bodyPart: 'shoulders', category: 'compound', sets: 12, repRange: [5, 50], restSeconds: 45, intensifier: 'rest-pause', notes: 'DTP PYRAMID: 50→40→30→20→10→5→5→10→20→30→40→50. Rest 45s high reps, 240s heavy.' },
      { name: 'Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 3, repRange: [12, 15], restSeconds: 30, intensifier: 'drop-set', notes: 'Finisher: 3 drop sets' },
    ],
  },
  'Legs': {
    splitDay: 'Legs',
    exercises: [
      { name: 'Leg Press', bodyPart: 'quads', category: 'machine', sets: 12, repRange: [5, 50], restSeconds: 45, intensifier: 'rest-pause', notes: 'DTP PYRAMID: 50→40→30→20→10→5→5→10→20→30→40→50. Rest 45s high reps, 240s heavy.' },
      { name: 'Leg Extensions', bodyPart: 'quads', category: 'machine', sets: 3, repRange: [12, 15], restSeconds: 30, intensifier: 'drop-set', notes: 'Finisher: 3 drop sets to failure' },
    ],
  },
  'Arms': {
    splitDay: 'Arms',
    exercises: [
      { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 12, repRange: [5, 50], restSeconds: 45, intensifier: 'rest-pause', notes: 'DTP PYRAMID: 50→40→30→20→10→5→5→10→20→30→40→50. Full spectrum fibre recruitment.' },
      { name: 'Tricep Pushdowns', bodyPart: 'triceps', category: 'cable', sets: 12, repRange: [5, 50], restSeconds: 45, intensifier: 'rest-pause', notes: 'DTP PYRAMID: 50→40→30→20→10→5→5→10→20→30→40→50.' },
    ],
  },
}

// ─── Y3T (Neil Hill) TEMPLATES ───

export const Y3T_WEEK1_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Chest': {
    splitDay: 'Chest',
    exercises: [
      { name: 'Flat Bench Press', bodyPart: 'chest', category: 'compound', sets: 3, repRange: [6, 8], tempo: '4-0-1-0', restSeconds: 150 },
      { name: 'Incline Dumbbell Press', bodyPart: 'chest', category: 'compound', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 120 },
      { name: 'Cable Flyes', bodyPart: 'chest', category: 'cable', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 120 },
    ],
  },
  'Back': {
    splitDay: 'Back',
    exercises: [
      { name: 'Bent-Over Barbell Rows', bodyPart: 'back', category: 'compound', sets: 3, repRange: [6, 8], tempo: '4-0-1-0', restSeconds: 150 },
      { name: 'Lat Pulldowns', bodyPart: 'back', category: 'cable', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 120 },
      { name: 'Seated Cable Rows', bodyPart: 'back', category: 'cable', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 120 },
    ],
  },
  'Shoulders': {
    splitDay: 'Shoulders',
    exercises: [
      { name: 'Seated Dumbbell Press', bodyPart: 'shoulders', category: 'compound', sets: 3, repRange: [6, 8], tempo: '4-0-1-0', restSeconds: 150 },
      { name: 'Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 120 },
      { name: 'Bent-Over Rear Delt Raises', bodyPart: 'shoulders', category: 'isolation', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 120 },
    ],
  },
  'Legs': {
    splitDay: 'Legs',
    exercises: [
      { name: 'Barbell Squats', bodyPart: 'quads', category: 'compound', sets: 3, repRange: [6, 8], tempo: '4-0-1-0', restSeconds: 150 },
      { name: 'Leg Press', bodyPart: 'quads', category: 'machine', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 120 },
      { name: 'Lying Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 3, repRange: [6, 8], tempo: '4-0-1-0', restSeconds: 150 },
      { name: 'Standing Calf Raises', bodyPart: 'calves', category: 'machine', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 120 },
    ],
  },
  'Arms': {
    splitDay: 'Arms',
    exercises: [
      { name: 'Close-Grip Bench Press', bodyPart: 'triceps', category: 'compound', sets: 3, repRange: [6, 8], tempo: '4-0-1-0', restSeconds: 150 },
      { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 3, repRange: [6, 8], tempo: '4-0-1-0', restSeconds: 150 },
      { name: 'Skull Crushers', bodyPart: 'triceps', category: 'isolation', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 120 },
      { name: 'Incline Dumbbell Curls', bodyPart: 'biceps', category: 'isolation', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 120 },
    ],
  },
}

export const Y3T_WEEK2_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Chest': {
    splitDay: 'Chest',
    exercises: [
      { name: 'Incline Dumbbell Press', bodyPart: 'chest', category: 'compound', sets: 3, repRange: [10, 12], tempo: '4-0-1-0', restSeconds: 90 },
      { name: 'Machine Chest Press', bodyPart: 'chest', category: 'machine', sets: 3, repRange: [12, 14], tempo: '4-0-1-0', restSeconds: 60 },
      { name: 'Cable Flyes', bodyPart: 'chest', category: 'cable', sets: 3, repRange: [12, 14], tempo: '4-0-1-0', restSeconds: 60 },
      { name: 'Pec Deck', bodyPart: 'chest', category: 'machine', sets: 3, repRange: [12, 14], tempo: '4-0-1-0', restSeconds: 60 },
    ],
  },
  'Back': {
    splitDay: 'Back',
    exercises: [
      { name: 'Lat Pulldowns', bodyPart: 'back', category: 'cable', sets: 3, repRange: [10, 12], tempo: '4-0-1-0', restSeconds: 90 },
      { name: 'Seated Cable Rows', bodyPart: 'back', category: 'cable', sets: 3, repRange: [12, 14], tempo: '4-0-1-0', restSeconds: 60 },
      { name: 'Dumbbell Rows', bodyPart: 'back', category: 'compound', sets: 3, repRange: [10, 12], tempo: '4-0-1-0', restSeconds: 90 },
      { name: 'Straight-Arm Pulldowns', bodyPart: 'back', category: 'cable', sets: 3, repRange: [12, 14], tempo: '4-0-1-0', restSeconds: 60 },
    ],
  },
  'Shoulders': {
    splitDay: 'Shoulders',
    exercises: [
      { name: 'Machine Shoulder Press', bodyPart: 'shoulders', category: 'machine', sets: 3, repRange: [10, 12], tempo: '4-0-1-0', restSeconds: 90 },
      { name: 'Cable Lateral Raises', bodyPart: 'shoulders', category: 'cable', sets: 3, repRange: [12, 14], tempo: '4-0-1-0', restSeconds: 60 },
      { name: 'Reverse Pec Deck', bodyPart: 'shoulders', category: 'machine', sets: 3, repRange: [12, 14], tempo: '4-0-1-0', restSeconds: 60 },
      { name: 'Face Pulls', bodyPart: 'shoulders', category: 'cable', sets: 3, repRange: [12, 14], tempo: '4-0-1-0', restSeconds: 60 },
    ],
  },
  'Legs': {
    splitDay: 'Legs',
    exercises: [
      { name: 'Leg Press', bodyPart: 'quads', category: 'machine', sets: 3, repRange: [10, 12], tempo: '4-0-1-0', restSeconds: 90 },
      { name: 'Leg Extensions', bodyPart: 'quads', category: 'machine', sets: 4, repRange: [12, 14], tempo: '4-0-1-0', restSeconds: 60 },
      { name: 'Romanian Deadlifts', bodyPart: 'hamstrings', category: 'compound', sets: 3, repRange: [12, 14], tempo: '4-0-1-0', restSeconds: 60 },
      { name: 'Seated Calf Raises', bodyPart: 'calves', category: 'machine', sets: 4, repRange: [12, 14], tempo: '4-0-1-0', restSeconds: 60 },
    ],
  },
  'Arms': {
    splitDay: 'Arms',
    exercises: [
      { name: 'Tricep Pushdowns', bodyPart: 'triceps', category: 'cable', sets: 3, repRange: [10, 12], tempo: '4-0-1-0', restSeconds: 90 },
      { name: 'Preacher Curls', bodyPart: 'biceps', category: 'isolation', sets: 3, repRange: [10, 12], tempo: '4-0-1-0', restSeconds: 90 },
      { name: 'Overhead Tricep Extensions', bodyPart: 'triceps', category: 'cable', sets: 3, repRange: [12, 14], tempo: '4-0-1-0', restSeconds: 60 },
      { name: 'Hammer Curls', bodyPart: 'biceps', category: 'isolation', sets: 3, repRange: [12, 14], tempo: '4-0-1-0', restSeconds: 60 },
    ],
  },
}

export const Y3T_WEEK3_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Chest': {
    splitDay: 'Chest',
    exercises: [
      { name: 'Incline Dumbbell Press', bodyPart: 'chest', category: 'compound', sets: 2, repRange: [25, 30], restSeconds: 30, intensifier: 'rest-pause', notes: 'Rest-pause to hit target reps' },
      { name: 'Cable Flyes', bodyPart: 'chest', category: 'cable', sets: 2, repRange: [20, 20], restSeconds: 0, intensifier: 'giant-set', notes: 'Giant set with Push-Ups: 20 flyes → 20 push-ups' },
      { name: 'Push-Ups', bodyPart: 'chest', category: 'bodyweight', sets: 2, repRange: [20, 20], restSeconds: 60, intensifier: 'giant-set', notes: 'Paired with Cable Flyes giant set' },
      { name: 'Pec Deck', bodyPart: 'chest', category: 'machine', sets: 1, repRange: [50, 50], restSeconds: 0, intensifier: 'rest-pause', notes: '1x50 rest-pause — break into mini-sets as needed' },
    ],
  },
  'Back': {
    splitDay: 'Back',
    exercises: [
      { name: 'Lat Pulldowns', bodyPart: 'back', category: 'cable', sets: 2, repRange: [25, 30], restSeconds: 30, intensifier: 'rest-pause', notes: 'Rest-pause to hit target reps' },
      { name: 'Seated Cable Rows', bodyPart: 'back', category: 'cable', sets: 2, repRange: [20, 20], restSeconds: 60, intensifier: 'drop-set', notes: 'Drop set: strip weight once per set' },
      { name: 'Machine Rows', bodyPart: 'back', category: 'machine', sets: 1, repRange: [50, 50], restSeconds: 0, intensifier: 'rest-pause', notes: '1x50 rest-pause — break into mini-sets as needed' },
    ],
  },
  'Shoulders': {
    splitDay: 'Shoulders',
    exercises: [
      { name: 'Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 2, repRange: [25, 30], restSeconds: 30 },
      { name: 'Reverse Pec Deck', bodyPart: 'shoulders', category: 'machine', sets: 2, repRange: [20, 25], restSeconds: 30 },
      { name: 'Machine Shoulder Press', bodyPart: 'shoulders', category: 'machine', sets: 2, repRange: [20, 20], restSeconds: 30, intensifier: 'drop-set', notes: 'Drop set each set' },
      { name: 'Cable Lateral Raises', bodyPart: 'shoulders', category: 'cable', sets: 1, repRange: [50, 50], restSeconds: 0, intensifier: 'giant-set', notes: '1x50 giant set — minimal rest, break into blocks' },
    ],
  },
  'Legs': {
    splitDay: 'Legs',
    exercises: [
      { name: 'Leg Press', bodyPart: 'quads', category: 'machine', sets: 1, repRange: [50, 50], restSeconds: 0, intensifier: 'rest-pause', notes: '1x50 rest-pause — break into mini-sets as needed' },
      { name: 'Seated Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 2, repRange: [25, 30], restSeconds: 0, intensifier: 'giant-set', notes: 'Giant set with Lying Leg Curls' },
      { name: 'Lying Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 2, repRange: [20, 20], restSeconds: 60, intensifier: 'giant-set', notes: 'Giant set with Seated Leg Curls' },
      { name: 'Donkey Calf Raises', bodyPart: 'calves', category: 'machine', sets: 3, repRange: [30, 40], tempo: '4-0-1-0', restSeconds: 60, notes: '4-second negative on every rep' },
    ],
  },
  'Arms': {
    splitDay: 'Arms',
    exercises: [
      { name: 'Tricep Pushdowns', bodyPart: 'triceps', category: 'cable', sets: 2, repRange: [20, 20], restSeconds: 0, intensifier: 'giant-set', notes: 'Giant set with Overhead Extensions' },
      { name: 'Overhead Tricep Extensions', bodyPart: 'triceps', category: 'cable', sets: 2, repRange: [20, 20], restSeconds: 60, intensifier: 'giant-set', notes: 'Giant set with Pushdowns' },
      { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 2, repRange: [25, 30], restSeconds: 30, intensifier: 'rest-pause', notes: 'Rest-pause to hit target reps' },
      { name: 'EZ Bar Skull Crushers', bodyPart: 'triceps', category: 'isolation', sets: 2, repRange: [20, 20], restSeconds: 30, intensifier: 'drop-set', notes: 'Drop set each set' },
      { name: 'Cable Curls', bodyPart: 'biceps', category: 'cable', sets: 2, repRange: [20, 20], restSeconds: 30, intensifier: 'drop-set', notes: 'Drop set each set' },
    ],
  },
}

// ─── FST-7 (Hany Rambod) TEMPLATES ───

export const FST7_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Chest & Triceps': {
    splitDay: 'Chest & Triceps',
    exercises: [
      { name: 'Incline Barbell Press', bodyPart: 'chest', category: 'compound', sets: 4, repRange: [8, 12], restSeconds: 90 },
      { name: 'Flat Dumbbell Press', bodyPart: 'chest', category: 'compound', sets: 3, repRange: [10, 12], restSeconds: 90 },
      { name: 'Close-Grip Bench Press', bodyPart: 'triceps', category: 'compound', sets: 3, repRange: [8, 12], restSeconds: 90 },
      { name: 'Weighted Bench Dips', bodyPart: 'triceps', category: 'bodyweight', sets: 3, repRange: [10, 12], restSeconds: 90 },
      { name: 'Cable Flyes (FST-7)', bodyPart: 'chest', category: 'cable', sets: 7, repRange: [10, 12], restSeconds: 35, intensifier: 'fst7', notes: 'FST-7 finisher: 7 sets, 30-45s rest. Flex target muscle between sets 3 and 4.' },
      { name: 'Overhead Cable Tricep Extensions (FST-7)', bodyPart: 'triceps', category: 'cable', sets: 7, repRange: [10, 12], restSeconds: 35, intensifier: 'fst7', notes: 'FST-7 finisher: 7 sets, 30-45s rest. Flex target muscle between sets 3 and 4.' },
    ],
  },
  'Back & Biceps': {
    splitDay: 'Back & Biceps',
    exercises: [
      { name: 'Bent-Over Barbell Rows', bodyPart: 'back', category: 'compound', sets: 4, repRange: [8, 12], restSeconds: 90 },
      { name: 'Lat Pulldowns', bodyPart: 'back', category: 'cable', sets: 3, repRange: [10, 12], restSeconds: 90 },
      { name: 'Incline Dumbbell Curls', bodyPart: 'biceps', category: 'isolation', sets: 3, repRange: [10, 12], restSeconds: 90 },
      { name: 'Seated Cable Rows (FST-7)', bodyPart: 'back', category: 'cable', sets: 7, repRange: [10, 12], restSeconds: 35, intensifier: 'fst7', notes: 'FST-7 finisher: 7 sets, 30-45s rest. Flex target muscle between sets 3 and 4.' },
      { name: 'Cable Preacher Curls (FST-7)', bodyPart: 'biceps', category: 'cable', sets: 7, repRange: [10, 12], restSeconds: 35, intensifier: 'fst7', notes: 'FST-7 finisher: 7 sets, 30-45s rest. Flex target muscle between sets 3 and 4.' },
    ],
  },
  'Legs': {
    splitDay: 'Legs',
    exercises: [
      { name: 'Barbell Squats', bodyPart: 'quads', category: 'compound', sets: 4, repRange: [8, 12], restSeconds: 120 },
      { name: 'Hack Squats', bodyPart: 'quads', category: 'machine', sets: 3, repRange: [10, 12], restSeconds: 90 },
      { name: 'Romanian Deadlifts', bodyPart: 'hamstrings', category: 'compound', sets: 3, repRange: [8, 10], restSeconds: 90 },
      { name: 'Lying Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 3, repRange: [10, 12], restSeconds: 90 },
      { name: 'Leg Extensions (FST-7)', bodyPart: 'quads', category: 'machine', sets: 7, repRange: [10, 12], restSeconds: 35, intensifier: 'fst7', notes: 'FST-7 finisher: 7 sets, 30-45s rest. Flex target muscle between sets 3 and 4.' },
      { name: 'Standing Calf Raises (FST-7)', bodyPart: 'calves', category: 'machine', sets: 7, repRange: [10, 12], restSeconds: 35, intensifier: 'fst7', notes: 'FST-7 finisher: 7 sets, 30-45s rest. Flex target muscle between sets 3 and 4.' },
    ],
  },
  'Shoulders & Calves': {
    splitDay: 'Shoulders & Calves',
    exercises: [
      { name: 'Seated Dumbbell Press', bodyPart: 'shoulders', category: 'compound', sets: 4, repRange: [8, 12], restSeconds: 90 },
      { name: 'Upright Rows', bodyPart: 'shoulders', category: 'compound', sets: 3, repRange: [10, 12], restSeconds: 90 },
      { name: 'Bent-Over Rear Delt Raises', bodyPart: 'shoulders', category: 'isolation', sets: 3, repRange: [10, 12], restSeconds: 90 },
      { name: 'Dumbbell Lateral Raises (FST-7)', bodyPart: 'shoulders', category: 'isolation', sets: 7, repRange: [10, 12], restSeconds: 35, intensifier: 'fst7', notes: 'FST-7 finisher: 7 sets, 30-45s rest. Flex target muscle between sets 3 and 4.' },
      { name: 'Seated Calf Raises (FST-7)', bodyPart: 'calves', category: 'machine', sets: 7, repRange: [10, 12], restSeconds: 35, intensifier: 'fst7', notes: 'FST-7 finisher: 7 sets, 30-45s rest. Flex target muscle between sets 3 and 4.' },
    ],
  },
  'Arms': {
    splitDay: 'Arms',
    exercises: [
      { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 3, repRange: [8, 12], restSeconds: 90 },
      { name: 'Close-Grip Bench Press', bodyPart: 'triceps', category: 'compound', sets: 3, repRange: [8, 12], restSeconds: 90 },
      { name: 'Incline Dumbbell Curls', bodyPart: 'biceps', category: 'isolation', sets: 3, repRange: [10, 12], restSeconds: 90 },
      { name: 'Weighted Bench Dips', bodyPart: 'triceps', category: 'bodyweight', sets: 3, repRange: [10, 12], restSeconds: 90 },
      { name: 'Cable Preacher Curls (FST-7)', bodyPart: 'biceps', category: 'cable', sets: 7, repRange: [10, 12], restSeconds: 35, intensifier: 'fst7', notes: 'FST-7 finisher: 7 sets, 30-45s rest. Flex target muscle between sets 3 and 4.' },
      { name: 'Overhead Cable Tricep Extensions (FST-7)', bodyPart: 'triceps', category: 'cable', sets: 7, repRange: [10, 12], restSeconds: 35, intensifier: 'fst7', notes: 'FST-7 finisher: 7 sets, 30-45s rest. Flex target muscle between sets 3 and 4.' },
    ],
  },
}

// ─── HIT / Blood & Guts (Dorian Yates) TEMPLATES ───

export const HIT_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Chest': {
    splitDay: 'Chest',
    exercises: [
      { name: 'Incline Barbell Press (Warm-Up)', bodyPart: 'chest', category: 'compound', sets: 2, repRange: [12, 15], restSeconds: 90, notes: 'Warm-up — controlled tempo, nowhere near failure' },
      { name: 'Incline Barbell Press', bodyPart: 'chest', category: 'compound', sets: 1, repRange: [6, 8], restSeconds: 180, intensifier: 'forced-reps', notes: 'WORKING SET — absolute failure + 2 forced reps with partner' },
      { name: 'Flat Dumbbell Press (Warm-Up)', bodyPart: 'chest', category: 'compound', sets: 1, repRange: [10, 10], restSeconds: 90, notes: 'Warm-up' },
      { name: 'Flat Dumbbell Press', bodyPart: 'chest', category: 'compound', sets: 1, repRange: [6, 8], restSeconds: 180, intensifier: 'forced-reps', notes: 'WORKING SET — absolute failure + 2 forced reps' },
      { name: 'Dumbbell Flyes', bodyPart: 'chest', category: 'isolation', sets: 1, repRange: [8, 10], restSeconds: 180, intensifier: 'negative-overload', notes: 'WORKING SET — partner lifts, you lower in 4-5s, 2-3 reps past failure' },
      { name: 'Cable Crossovers', bodyPart: 'chest', category: 'cable', sets: 1, repRange: [8, 10], restSeconds: 120, intensifier: 'forced-reps', notes: 'WORKING SET — failure + partials' },
    ],
  },
  'Back': {
    splitDay: 'Back',
    exercises: [
      { name: 'Machine Lat Pulldowns (Warm-Up)', bodyPart: 'back', category: 'machine', sets: 2, repRange: [12, 12], restSeconds: 90, notes: 'Warm-up sets' },
      { name: 'Machine Lat Pulldowns', bodyPart: 'back', category: 'machine', sets: 1, repRange: [6, 8], restSeconds: 240, intensifier: 'forced-reps', notes: 'WORKING SET — failure + 2 forced reps + 1 slow negative' },
      { name: 'Barbell Rows (Underhand)', bodyPart: 'back', category: 'compound', sets: 1, repRange: [6, 8], restSeconds: 180, intensifier: 'forced-reps', notes: 'WORKING SET — absolute failure' },
      { name: 'Single-Arm Dumbbell Rows', bodyPart: 'back', category: 'compound', sets: 1, repRange: [6, 8], restSeconds: 180, notes: 'WORKING SET — absolute failure' },
      { name: 'Machine Seated Rows', bodyPart: 'back', category: 'machine', sets: 1, repRange: [6, 8], restSeconds: 180, intensifier: 'forced-reps', notes: 'WORKING SET — failure + 2 forced reps' },
      { name: 'Barbell Deadlifts (Warm-Up)', bodyPart: 'back', category: 'compound', sets: 2, repRange: [10, 10], restSeconds: 120, notes: 'Warm-up sets' },
      { name: 'Barbell Deadlifts', bodyPart: 'back', category: 'compound', sets: 1, repRange: [8, 8], restSeconds: 300, intensifier: 'rest-pause', notes: 'WORKING SET — failure, rack 15s, squeeze out 1-2 more' },
    ],
  },
  'Shoulders': {
    splitDay: 'Shoulders',
    exercises: [
      { name: 'Seated Dumbbell Press (Warm-Up)', bodyPart: 'shoulders', category: 'compound', sets: 2, repRange: [12, 12], restSeconds: 90, notes: 'Warm-up sets' },
      { name: 'Seated Dumbbell Press', bodyPart: 'shoulders', category: 'compound', sets: 1, repRange: [6, 8], restSeconds: 180, intensifier: 'forced-reps', notes: 'WORKING SET — absolute failure + 2 forced reps' },
      { name: 'Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 1, repRange: [8, 10], restSeconds: 120, intensifier: 'forced-reps', notes: 'WORKING SET — failure + partial reps' },
      { name: 'Bent-Over Rear Delt Raises', bodyPart: 'shoulders', category: 'isolation', sets: 1, repRange: [8, 10], restSeconds: 120, intensifier: 'forced-reps', notes: 'WORKING SET — failure' },
      { name: 'Cable Lateral Raises', bodyPart: 'shoulders', category: 'cable', sets: 1, repRange: [8, 10], restSeconds: 120, intensifier: 'negative-overload', notes: 'WORKING SET — slow negatives to failure' },
      { name: 'Barbell Shrugs', bodyPart: 'shoulders', category: 'compound', sets: 1, repRange: [6, 8], restSeconds: 120, intensifier: 'rest-pause', notes: 'WORKING SET — failure, hold at top 2s each rep' },
    ],
  },
  'Legs': {
    splitDay: 'Legs',
    exercises: [
      { name: 'Leg Extensions (Warm-Up)', bodyPart: 'quads', category: 'machine', sets: 2, repRange: [15, 15], restSeconds: 90, notes: 'Warm-up sets' },
      { name: 'Leg Extensions', bodyPart: 'quads', category: 'machine', sets: 1, repRange: [8, 10], restSeconds: 180, intensifier: 'forced-reps', notes: 'WORKING SET — failure + 2 forced reps' },
      { name: 'Leg Press', bodyPart: 'quads', category: 'machine', sets: 1, repRange: [8, 10], restSeconds: 240, intensifier: 'rest-pause', notes: 'WORKING SET — failure, rack 15s, 2-3 more reps' },
      { name: 'Hack Squats', bodyPart: 'quads', category: 'machine', sets: 1, repRange: [8, 10], restSeconds: 240, intensifier: 'forced-reps', notes: 'WORKING SET — absolute failure + 2 forced reps' },
      { name: 'Lying Leg Curls (Warm-Up)', bodyPart: 'hamstrings', category: 'machine', sets: 1, repRange: [12, 12], restSeconds: 90, notes: 'Warm-up' },
      { name: 'Lying Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 1, repRange: [6, 8], restSeconds: 180, intensifier: 'forced-reps', notes: 'WORKING SET — failure + 2 forced reps' },
      { name: 'Stiff-Leg Deadlifts', bodyPart: 'hamstrings', category: 'compound', sets: 1, repRange: [8, 8], restSeconds: 180, intensifier: 'rest-pause', notes: 'WORKING SET — failure + rest-pause' },
      { name: 'Standing Calf Raises', bodyPart: 'calves', category: 'machine', sets: 1, repRange: [8, 10], restSeconds: 120, intensifier: 'forced-reps', notes: 'WORKING SET — failure + 2 forced reps' },
      { name: 'Seated Calf Raises', bodyPart: 'calves', category: 'machine', sets: 1, repRange: [10, 12], restSeconds: 120, notes: 'WORKING SET — failure' },
    ],
  },
  'Arms': {
    splitDay: 'Arms',
    exercises: [
      { name: 'Barbell Curls (Warm-Up)', bodyPart: 'biceps', category: 'compound', sets: 1, repRange: [12, 12], restSeconds: 90, notes: 'Warm-up' },
      { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 1, repRange: [6, 8], restSeconds: 180, intensifier: 'forced-reps', notes: 'WORKING SET — absolute failure + 2 forced reps' },
      { name: 'Incline Dumbbell Curls', bodyPart: 'biceps', category: 'isolation', sets: 1, repRange: [6, 8], restSeconds: 180, intensifier: 'forced-reps', notes: 'WORKING SET — failure + forced reps' },
      { name: 'Concentration Curls', bodyPart: 'biceps', category: 'isolation', sets: 1, repRange: [8, 10], restSeconds: 120, intensifier: 'negative-overload', notes: 'WORKING SET — slow 5s negatives' },
      { name: 'Close-Grip Bench Press (Warm-Up)', bodyPart: 'triceps', category: 'compound', sets: 1, repRange: [12, 12], restSeconds: 90, notes: 'Warm-up' },
      { name: 'Close-Grip Bench Press', bodyPart: 'triceps', category: 'compound', sets: 1, repRange: [6, 8], restSeconds: 180, intensifier: 'forced-reps', notes: 'WORKING SET — absolute failure + 2 forced reps' },
      { name: 'Tricep Pushdowns', bodyPart: 'triceps', category: 'cable', sets: 1, repRange: [8, 10], restSeconds: 120, intensifier: 'forced-reps', notes: 'WORKING SET — failure + partials' },
      { name: 'Overhead Dumbbell Extensions', bodyPart: 'triceps', category: 'isolation', sets: 1, repRange: [8, 10], restSeconds: 120, intensifier: 'negative-overload', notes: 'WORKING SET — slow negatives to failure' },
    ],
  },
}

// ─── PHAT (Layne Norton) TEMPLATES ───

export const PHAT_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Upper Body Power': {
    splitDay: 'Upper Body Power',
    exercises: [
      { name: 'Barbell Bench Press', bodyPart: 'chest', category: 'compound', sets: 3, repRange: [3, 5], restSeconds: 300 },
      { name: 'Weighted Pull-Ups', bodyPart: 'back', category: 'compound', sets: 3, repRange: [3, 5], restSeconds: 300 },
      { name: 'Seated Dumbbell Press', bodyPart: 'shoulders', category: 'compound', sets: 3, repRange: [5, 8], restSeconds: 180 },
      { name: 'Barbell Rows', bodyPart: 'back', category: 'compound', sets: 3, repRange: [3, 5], restSeconds: 300 },
      { name: 'Weighted Dips', bodyPart: 'triceps', category: 'bodyweight', sets: 2, repRange: [6, 8], restSeconds: 180 },
      { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 2, repRange: [6, 8], restSeconds: 120 },
    ],
  },
  'Lower Body Power': {
    splitDay: 'Lower Body Power',
    exercises: [
      { name: 'Barbell Squats', bodyPart: 'quads', category: 'compound', sets: 3, repRange: [3, 5], restSeconds: 300 },
      { name: 'Hack Squats', bodyPart: 'quads', category: 'machine', sets: 3, repRange: [5, 8], restSeconds: 240 },
      { name: 'Leg Press', bodyPart: 'quads', category: 'machine', sets: 2, repRange: [6, 8], restSeconds: 240 },
      { name: 'Stiff-Leg Deadlifts', bodyPart: 'hamstrings', category: 'compound', sets: 3, repRange: [5, 8], restSeconds: 240 },
      { name: 'Lying Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 2, repRange: [6, 8], restSeconds: 180 },
      { name: 'Standing Calf Raises', bodyPart: 'calves', category: 'machine', sets: 3, repRange: [6, 8], restSeconds: 120 },
    ],
  },
  'Back & Shoulders Hypertrophy': {
    splitDay: 'Back & Shoulders Hypertrophy',
    exercises: [
      { name: 'Bent-Over Rows (Speed Work)', bodyPart: 'back', category: 'compound', sets: 6, repRange: [3, 3], restSeconds: 90, intensifier: 'speed-work', notes: '65-70% 1RM, maximum bar velocity' },
      { name: 'Seated Cable Rows', bodyPart: 'back', category: 'cable', sets: 3, repRange: [8, 12], restSeconds: 90 },
      { name: 'Lat Pulldowns', bodyPart: 'back', category: 'cable', sets: 3, repRange: [8, 12], restSeconds: 90 },
      { name: 'Dumbbell Rows', bodyPart: 'back', category: 'compound', sets: 2, repRange: [10, 12], restSeconds: 60 },
      { name: 'Seated Dumbbell Press', bodyPart: 'shoulders', category: 'compound', sets: 3, repRange: [8, 12], restSeconds: 90 },
      { name: 'Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 3, repRange: [12, 15], restSeconds: 60 },
      { name: 'Cable Rear Delt Flyes', bodyPart: 'shoulders', category: 'cable', sets: 3, repRange: [12, 15], restSeconds: 60 },
    ],
  },
  'Lower Body Hypertrophy': {
    splitDay: 'Lower Body Hypertrophy',
    exercises: [
      { name: 'Squats (Speed Work)', bodyPart: 'quads', category: 'compound', sets: 6, repRange: [3, 3], restSeconds: 90, intensifier: 'speed-work', notes: '65-70% 1RM, maximum bar velocity' },
      { name: 'Hack Squats', bodyPart: 'quads', category: 'machine', sets: 3, repRange: [8, 12], restSeconds: 90 },
      { name: 'Leg Extensions', bodyPart: 'quads', category: 'machine', sets: 3, repRange: [12, 15], restSeconds: 60 },
      { name: 'Romanian Deadlifts', bodyPart: 'hamstrings', category: 'compound', sets: 3, repRange: [8, 12], restSeconds: 90 },
      { name: 'Lying Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 3, repRange: [12, 15], restSeconds: 60 },
      { name: 'Standing Calf Raises', bodyPart: 'calves', category: 'machine', sets: 4, repRange: [10, 12], restSeconds: 60 },
    ],
  },
  'Chest & Arms Hypertrophy': {
    splitDay: 'Chest & Arms Hypertrophy',
    exercises: [
      { name: 'Flat Dumbbell Press (Speed Work)', bodyPart: 'chest', category: 'compound', sets: 6, repRange: [3, 3], restSeconds: 90, intensifier: 'speed-work', notes: '65-70% 1RM, maximum bar velocity' },
      { name: 'Incline Barbell Press', bodyPart: 'chest', category: 'compound', sets: 3, repRange: [8, 12], restSeconds: 90 },
      { name: 'Cable Flyes', bodyPart: 'chest', category: 'cable', sets: 3, repRange: [10, 12], restSeconds: 60 },
      { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 3, repRange: [8, 12], restSeconds: 60 },
      { name: 'Preacher Curls', bodyPart: 'biceps', category: 'isolation', sets: 2, repRange: [10, 12], restSeconds: 60 },
      { name: 'Skull Crushers', bodyPart: 'triceps', category: 'isolation', sets: 3, repRange: [8, 12], restSeconds: 60 },
      { name: 'Cable Tricep Pushdowns', bodyPart: 'triceps', category: 'cable', sets: 2, repRange: [10, 12], restSeconds: 60 },
    ],
  },
}

// ─── Bompa Periodisation TEMPLATES ───

export const BOMPA_AA_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Chest': { splitDay: 'Chest', exercises: [
    { name: 'Dumbbell Bench Press', bodyPart: 'chest', category: 'compound', sets: 3, repRange: [12, 15], restSeconds: 60, notes: '40-60% 1RM — tendon/ligament prep' },
    { name: 'Incline Dumbbell Press', bodyPart: 'chest', category: 'compound', sets: 3, repRange: [12, 15], restSeconds: 60 },
    { name: 'Cable Flyes', bodyPart: 'chest', category: 'cable', sets: 2, repRange: [12, 15], restSeconds: 60 },
    { name: 'Push-Ups', bodyPart: 'chest', category: 'bodyweight', sets: 2, repRange: [12, 15], restSeconds: 60 },
  ]},
  'Back': { splitDay: 'Back', exercises: [
    { name: 'Lat Pulldowns', bodyPart: 'back', category: 'cable', sets: 3, repRange: [12, 15], restSeconds: 60, notes: '40-60% 1RM — tendon/ligament prep' },
    { name: 'Dumbbell Rows', bodyPart: 'back', category: 'compound', sets: 3, repRange: [12, 15], restSeconds: 60 },
    { name: 'Seated Cable Rows', bodyPart: 'back', category: 'cable', sets: 2, repRange: [12, 15], restSeconds: 60 },
    { name: 'Straight-Arm Pulldowns', bodyPart: 'back', category: 'cable', sets: 2, repRange: [12, 15], restSeconds: 60 },
  ]},
  'Shoulders': { splitDay: 'Shoulders', exercises: [
    { name: 'Seated Dumbbell Press', bodyPart: 'shoulders', category: 'compound', sets: 3, repRange: [12, 15], restSeconds: 60, notes: '40-60% 1RM' },
    { name: 'Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 3, repRange: [12, 15], restSeconds: 60 },
    { name: 'Bent-Over Rear Delt Raises', bodyPart: 'shoulders', category: 'isolation', sets: 2, repRange: [12, 15], restSeconds: 60 },
    { name: 'Face Pulls', bodyPart: 'shoulders', category: 'cable', sets: 2, repRange: [12, 15], restSeconds: 60 },
  ]},
  'Legs': { splitDay: 'Legs', exercises: [
    { name: 'Goblet Squats', bodyPart: 'quads', category: 'compound', sets: 3, repRange: [12, 15], restSeconds: 60, notes: '40-60% 1RM — joint prep' },
    { name: 'Leg Press', bodyPart: 'quads', category: 'machine', sets: 3, repRange: [12, 15], restSeconds: 60 },
    { name: 'Lying Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 3, repRange: [12, 15], restSeconds: 60 },
    { name: 'Romanian Deadlifts', bodyPart: 'hamstrings', category: 'compound', sets: 2, repRange: [12, 15], restSeconds: 60 },
    { name: 'Standing Calf Raises', bodyPart: 'calves', category: 'machine', sets: 3, repRange: [15, 15], restSeconds: 60 },
  ]},
  'Arms': { splitDay: 'Arms', exercises: [
    { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 3, repRange: [12, 15], restSeconds: 60, notes: '40-60% 1RM' },
    { name: 'Tricep Pushdowns', bodyPart: 'triceps', category: 'cable', sets: 3, repRange: [12, 15], restSeconds: 60 },
    { name: 'Hammer Curls', bodyPart: 'biceps', category: 'isolation', sets: 2, repRange: [12, 15], restSeconds: 60 },
    { name: 'Overhead Tricep Extensions', bodyPart: 'triceps', category: 'cable', sets: 2, repRange: [12, 15], restSeconds: 60 },
    { name: 'Plank', bodyPart: 'abs', category: 'bodyweight', sets: 3, repRange: [30, 60], restSeconds: 60, notes: 'Hold 30-60 seconds' },
  ]},
}

export const BOMPA_HYPERTROPHY_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Chest': {
    splitDay: 'Chest',
    exercises: [
      { name: 'Barbell Bench Press', bodyPart: 'chest', category: 'compound', sets: 4, repRange: [8, 12], restSeconds: 90, notes: '60-80% 1RM' },
      { name: 'Incline Dumbbell Press', bodyPart: 'chest', category: 'compound', sets: 4, repRange: [8, 12], restSeconds: 90 },
      { name: 'Cable Flyes', bodyPart: 'chest', category: 'cable', sets: 3, repRange: [10, 12], restSeconds: 60 },
      { name: 'Dips', bodyPart: 'chest', category: 'bodyweight', sets: 3, repRange: [10, 12], restSeconds: 60 },
    ],
  },
  'Back': {
    splitDay: 'Back',
    exercises: [
      { name: 'Barbell Rows', bodyPart: 'back', category: 'compound', sets: 4, repRange: [6, 10], restSeconds: 90 },
      { name: 'Pull-Ups', bodyPart: 'back', category: 'bodyweight', sets: 4, repRange: [8, 12], restSeconds: 90 },
      { name: 'Seated Cable Rows', bodyPart: 'back', category: 'cable', sets: 3, repRange: [10, 12], restSeconds: 60 },
      { name: 'Straight-Arm Pulldowns', bodyPart: 'back', category: 'cable', sets: 3, repRange: [10, 12], restSeconds: 60 },
    ],
  },
  'Shoulders': {
    splitDay: 'Shoulders',
    exercises: [
      { name: 'Standing Barbell Press', bodyPart: 'shoulders', category: 'compound', sets: 4, repRange: [6, 10], restSeconds: 90 },
      { name: 'Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 3, repRange: [10, 12], restSeconds: 60 },
      { name: 'Bent-Over Rear Raises', bodyPart: 'shoulders', category: 'isolation', sets: 3, repRange: [10, 12], restSeconds: 60 },
      { name: 'Face Pulls', bodyPart: 'shoulders', category: 'cable', sets: 3, repRange: [10, 12], restSeconds: 60 },
    ],
  },
  'Legs': {
    splitDay: 'Legs',
    exercises: [
      { name: 'Barbell Squats', bodyPart: 'quads', category: 'compound', sets: 4, repRange: [6, 10], restSeconds: 120 },
      { name: 'Leg Press', bodyPart: 'quads', category: 'machine', sets: 4, repRange: [8, 12], restSeconds: 90 },
      { name: 'Romanian Deadlifts', bodyPart: 'hamstrings', category: 'compound', sets: 4, repRange: [8, 12], restSeconds: 90 },
      { name: 'Leg Extensions', bodyPart: 'quads', category: 'machine', sets: 3, repRange: [10, 12], restSeconds: 60 },
      { name: 'Lying Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 3, repRange: [10, 12], restSeconds: 60 },
      { name: 'Standing Calf Raises', bodyPart: 'calves', category: 'machine', sets: 4, repRange: [10, 12], restSeconds: 60 },
    ],
  },
  'Arms': {
    splitDay: 'Arms',
    exercises: [
      { name: 'Close-Grip Bench Press', bodyPart: 'triceps', category: 'compound', sets: 3, repRange: [8, 10], restSeconds: 90 },
      { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 3, repRange: [8, 10], restSeconds: 90 },
      { name: 'Skull Crushers', bodyPart: 'triceps', category: 'isolation', sets: 3, repRange: [10, 12], restSeconds: 60 },
      { name: 'Incline Curls', bodyPart: 'biceps', category: 'isolation', sets: 3, repRange: [10, 12], restSeconds: 60 },
      { name: 'Tricep Pushdowns', bodyPart: 'triceps', category: 'cable', sets: 3, repRange: [10, 12], restSeconds: 60 },
    ],
  },
}

export const BOMPA_MAXSTRENGTH_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Chest': { splitDay: 'Chest', exercises: [
    { name: 'Barbell Bench Press', bodyPart: 'chest', category: 'compound', sets: 5, repRange: [1, 5], restSeconds: 300, notes: '85-100% 1RM — full neurological recovery between sets' },
    { name: 'Incline Barbell Press', bodyPart: 'chest', category: 'compound', sets: 4, repRange: [3, 5], restSeconds: 240 },
    { name: 'Weighted Dips', bodyPart: 'chest', category: 'compound', sets: 3, repRange: [3, 5], restSeconds: 240 },
  ]},
  'Back': { splitDay: 'Back', exercises: [
    { name: 'Barbell Deadlifts', bodyPart: 'back', category: 'compound', sets: 5, repRange: [1, 5], restSeconds: 300, notes: '85-100% 1RM' },
    { name: 'Weighted Pull-Ups', bodyPart: 'back', category: 'compound', sets: 5, repRange: [3, 5], restSeconds: 300 },
    { name: 'Barbell Rows', bodyPart: 'back', category: 'compound', sets: 4, repRange: [3, 5], restSeconds: 240 },
  ]},
  'Legs': { splitDay: 'Legs', exercises: [
    { name: 'Barbell Back Squats', bodyPart: 'quads', category: 'compound', sets: 5, repRange: [1, 5], restSeconds: 300, notes: '85-100% 1RM' },
    { name: 'Front Squats', bodyPart: 'quads', category: 'compound', sets: 4, repRange: [3, 5], restSeconds: 240 },
    { name: 'Barbell Hip Thrusts', bodyPart: 'glutes', category: 'compound', sets: 3, repRange: [3, 5], restSeconds: 180 },
    { name: 'Standing Calf Raises', bodyPart: 'calves', category: 'machine', sets: 3, repRange: [6, 8], restSeconds: 120 },
  ]},
  'Shoulders': { splitDay: 'Shoulders', exercises: [
    { name: 'Standing Barbell Press', bodyPart: 'shoulders', category: 'compound', sets: 5, repRange: [3, 5], restSeconds: 300, notes: '85-100% 1RM' },
    { name: 'Push Press', bodyPart: 'shoulders', category: 'compound', sets: 4, repRange: [3, 5], restSeconds: 240 },
    { name: 'Barbell Upright Rows', bodyPart: 'shoulders', category: 'compound', sets: 3, repRange: [5, 5], restSeconds: 180 },
  ]},
  'Arms': { splitDay: 'Arms', exercises: [
    { name: 'Close-Grip Bench Press', bodyPart: 'triceps', category: 'compound', sets: 4, repRange: [3, 5], restSeconds: 240, notes: '85-100% 1RM' },
    { name: 'Weighted Chin-Ups', bodyPart: 'biceps', category: 'compound', sets: 4, repRange: [3, 5], restSeconds: 240 },
    { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 3, repRange: [5, 5], restSeconds: 180 },
    { name: 'Skull Crushers', bodyPart: 'triceps', category: 'compound', sets: 3, repRange: [5, 5], restSeconds: 180 },
  ]},
}

export const BOMPA_POWER_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Upper Power': { splitDay: 'Upper Power', exercises: [
    { name: 'Power Cleans', bodyPart: 'back', category: 'compound', sets: 5, repRange: [3, 3], restSeconds: 180, notes: 'Explosive — full triple extension' },
    { name: 'Push Press', bodyPart: 'shoulders', category: 'compound', sets: 4, repRange: [3, 5], restSeconds: 180 },
    { name: 'Plyometric Push-Ups', bodyPart: 'chest', category: 'bodyweight', sets: 4, repRange: [5, 5], restSeconds: 120 },
    { name: 'Medicine Ball Slams', bodyPart: 'abs', category: 'compound', sets: 3, repRange: [8, 8], restSeconds: 90 },
  ]},
  'Lower Power': { splitDay: 'Lower Power', exercises: [
    { name: 'Box Jumps', bodyPart: 'quads', category: 'bodyweight', sets: 5, repRange: [3, 3], restSeconds: 180, notes: 'Maximum height — step down between reps' },
    { name: 'Jump Squats', bodyPart: 'quads', category: 'compound', sets: 4, repRange: [5, 5], restSeconds: 120 },
    { name: 'Power Cleans from Hang', bodyPart: 'back', category: 'compound', sets: 4, repRange: [3, 3], restSeconds: 180 },
    { name: 'Barbell Hip Thrusts (Explosive)', bodyPart: 'glutes', category: 'compound', sets: 3, repRange: [5, 5], restSeconds: 120 },
  ]},
  'Chest': { splitDay: 'Chest', exercises: [
    { name: 'Plyometric Push-Ups', bodyPart: 'chest', category: 'bodyweight', sets: 5, repRange: [5, 5], restSeconds: 120, notes: 'Maximum explosive intent — clap if possible' },
    { name: 'Barbell Bench Press (Explosive)', bodyPart: 'chest', category: 'compound', sets: 4, repRange: [3, 5], restSeconds: 180, notes: 'Explosive concentric, controlled eccentric' },
    { name: 'Medicine Ball Chest Pass', bodyPart: 'chest', category: 'compound', sets: 3, repRange: [8, 8], restSeconds: 90 },
  ]},
  'Back': { splitDay: 'Back', exercises: [
    { name: 'Power Cleans', bodyPart: 'back', category: 'compound', sets: 5, repRange: [3, 3], restSeconds: 180, notes: 'Explosive' },
    { name: 'Barbell Rows (Explosive)', bodyPart: 'back', category: 'compound', sets: 4, repRange: [5, 5], restSeconds: 120 },
    { name: 'Weighted Pull-Ups', bodyPart: 'back', category: 'compound', sets: 4, repRange: [3, 5], restSeconds: 180 },
  ]},
  'Legs': { splitDay: 'Legs', exercises: [
    { name: 'Box Jumps', bodyPart: 'quads', category: 'bodyweight', sets: 5, repRange: [3, 3], restSeconds: 180 },
    { name: 'Jump Squats', bodyPart: 'quads', category: 'compound', sets: 4, repRange: [5, 5], restSeconds: 120 },
    { name: 'Barbell Hip Thrusts (Explosive)', bodyPart: 'glutes', category: 'compound', sets: 4, repRange: [5, 5], restSeconds: 120 },
    { name: 'Single-Leg Box Jumps', bodyPart: 'quads', category: 'bodyweight', sets: 3, repRange: [5, 5], restSeconds: 90 },
  ]},
}

// ─── Corey Gregory (Squat Every Day) TEMPLATES ───

export const COREYG_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Squat + Chest & Back Giant Sets': {
    splitDay: 'Squat + Chest & Back Giant Sets',
    exercises: [
      { name: 'Front Squat (Daily Max)', bodyPart: 'quads', category: 'compound', sets: 1, repRange: [1, 3], restSeconds: 0, notes: 'Work up to daily max over 10-15 min' },
      { name: 'Incline Barbell Bench Press', bodyPart: 'chest', category: 'compound', sets: 4, repRange: [8, 10], restSeconds: 0, intensifier: 'giant-set', notes: 'Giant set A — no rest between exercises' },
      { name: 'Bent-Over Barbell Rows', bodyPart: 'back', category: 'compound', sets: 4, repRange: [8, 10], restSeconds: 0, intensifier: 'giant-set' },
      { name: 'Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 4, repRange: [12, 15], restSeconds: 0 },
      { name: 'Hanging Leg Raises', bodyPart: 'abs', category: 'bodyweight', sets: 4, repRange: [15, 20], restSeconds: 90, notes: '90s rest after completing full round' },
      { name: 'Walking Lunges', bodyPart: 'quads', category: 'compound', sets: 1, repRange: [1, 1], restSeconds: 0, notes: '200m total distance — finisher' },
    ],
  },
  'Squat + Shoulders & Arms Giant Sets': {
    splitDay: 'Squat + Shoulders & Arms Giant Sets',
    exercises: [
      { name: 'Box Squat (Daily Max)', bodyPart: 'quads', category: 'compound', sets: 1, repRange: [1, 3], restSeconds: 0, notes: 'Work up to daily max over 10-15 min' },
      { name: 'Seated Dumbbell Press', bodyPart: 'shoulders', category: 'compound', sets: 4, repRange: [8, 10], restSeconds: 0, intensifier: 'giant-set' },
      { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 4, repRange: [8, 10], restSeconds: 0, intensifier: 'giant-set' },
      { name: 'Skull Crushers', bodyPart: 'triceps', category: 'isolation', sets: 4, repRange: [8, 10], restSeconds: 0, intensifier: 'giant-set' },
      { name: 'Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 4, repRange: [12, 15], restSeconds: 90, notes: '90s rest after completing full round' },
      { name: 'Walking Lunges', bodyPart: 'quads', category: 'compound', sets: 1, repRange: [1, 1], restSeconds: 0, notes: '200m total distance — finisher' },
    ],
  },
  'Squat + Back & Biceps': {
    splitDay: 'Squat + Back & Biceps',
    exercises: [
      { name: 'Back Squat (Daily Max)', bodyPart: 'quads', category: 'compound', sets: 1, repRange: [1, 3], restSeconds: 0, notes: 'Work up to daily max over 10-15 min' },
      { name: 'Pull-Ups', bodyPart: 'back', category: 'bodyweight', sets: 4, repRange: [8, 10], restSeconds: 0, intensifier: 'giant-set' },
      { name: 'Seated Cable Rows', bodyPart: 'back', category: 'cable', sets: 4, repRange: [10, 12], restSeconds: 0, intensifier: 'giant-set' },
      { name: 'Hammer Curls', bodyPart: 'biceps', category: 'isolation', sets: 4, repRange: [10, 12], restSeconds: 0 },
      { name: 'Face Pulls', bodyPart: 'shoulders', category: 'cable', sets: 4, repRange: [12, 15], restSeconds: 90, notes: '90s rest after completing full round' },
      { name: 'Walking Lunges', bodyPart: 'quads', category: 'compound', sets: 1, repRange: [1, 1], restSeconds: 0, notes: '200m total distance — finisher' },
    ],
  },
  'Squat + Chest & Triceps': {
    splitDay: 'Squat + Chest & Triceps',
    exercises: [
      { name: 'Safety Bar Squat (Daily Max)', bodyPart: 'quads', category: 'compound', sets: 1, repRange: [1, 3], restSeconds: 0, notes: 'Work up to daily max over 10-15 min' },
      { name: 'Flat Dumbbell Press', bodyPart: 'chest', category: 'compound', sets: 4, repRange: [8, 10], restSeconds: 0, intensifier: 'giant-set' },
      { name: 'Cable Flyes', bodyPart: 'chest', category: 'cable', sets: 4, repRange: [10, 12], restSeconds: 0, intensifier: 'giant-set' },
      { name: 'Tricep Dips', bodyPart: 'triceps', category: 'bodyweight', sets: 4, repRange: [10, 12], restSeconds: 0 },
      { name: 'Overhead Extensions', bodyPart: 'triceps', category: 'cable', sets: 4, repRange: [10, 12], restSeconds: 90, notes: '90s rest after completing full round' },
      { name: 'Walking Lunges', bodyPart: 'quads', category: 'compound', sets: 1, repRange: [1, 1], restSeconds: 0, notes: '200m total distance — finisher' },
    ],
  },
  'Squat + Full Upper Giant Sets': {
    splitDay: 'Squat + Full Upper Giant Sets',
    exercises: [
      { name: 'Anderson Squat (Daily Max)', bodyPart: 'quads', category: 'compound', sets: 1, repRange: [1, 3], restSeconds: 0, notes: 'Work up to daily max over 10-15 min' },
      { name: 'Barbell Bench Press', bodyPart: 'chest', category: 'compound', sets: 4, repRange: [8, 10], restSeconds: 0, intensifier: 'giant-set' },
      { name: 'Dumbbell Rows', bodyPart: 'back', category: 'compound', sets: 4, repRange: [8, 10], restSeconds: 0, intensifier: 'giant-set' },
      { name: 'Seated Press', bodyPart: 'shoulders', category: 'compound', sets: 4, repRange: [8, 10], restSeconds: 0 },
      { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 4, repRange: [10, 10], restSeconds: 90, notes: '90s rest after completing full round' },
      { name: 'Walking Lunges', bodyPart: 'quads', category: 'compound', sets: 1, repRange: [1, 1], restSeconds: 0, notes: '200m total distance — finisher' },
    ],
  },
  'Squat + Conditioning': {
    splitDay: 'Squat + Conditioning',
    exercises: [
      { name: 'Front Squat (Daily Max)', bodyPart: 'quads', category: 'compound', sets: 1, repRange: [1, 3], restSeconds: 0, notes: 'Work up to daily max over 10-15 min' },
      { name: 'Farmer\'s Walks', bodyPart: 'abs', category: 'compound', sets: 4, repRange: [1, 1], restSeconds: 60, notes: '40m per set' },
      { name: 'Sled Pushes', bodyPart: 'quads', category: 'compound', sets: 4, repRange: [1, 1], restSeconds: 60, notes: '30m per set' },
      { name: 'Battle Ropes', bodyPart: 'shoulders', category: 'compound', sets: 4, repRange: [1, 1], restSeconds: 60, notes: '30 seconds per set' },
      { name: 'Walking Lunges', bodyPart: 'quads', category: 'compound', sets: 1, repRange: [1, 1], restSeconds: 0, notes: '400m total distance — extended finisher' },
    ],
  },
  'Squat + Lunges (Finisher)': {
    splitDay: 'Squat + Lunges (Finisher)',
    exercises: [
      { name: 'Back Squat (Daily Max)', bodyPart: 'quads', category: 'compound', sets: 1, repRange: [1, 3], restSeconds: 0, notes: 'Work up to daily max over 10-15 min' },
      { name: 'Walking Lunges', bodyPart: 'quads', category: 'compound', sets: 1, repRange: [1, 1], restSeconds: 0, notes: '800m distance finisher — break into 100m blocks if needed' },
    ],
  },
}

// ─── Contest Prep (Norton/Baker) TEMPLATES ───
// Uses PHAT structure with RPE 8 modifications — routed via getTemplateForSplit

export const CONTEST_PREP_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Upper Body Power': {
    splitDay: 'Upper Body Power',
    exercises: [
      { name: 'Barbell Bench Press', bodyPart: 'chest', category: 'compound', sets: 3, repRange: [3, 5], restSeconds: 300, notes: 'RPE 8 — do not train to failure except final set' },
      { name: 'Weighted Pull-Ups', bodyPart: 'back', category: 'compound', sets: 3, repRange: [3, 5], restSeconds: 300, notes: 'RPE 8' },
      { name: 'Seated Dumbbell Press', bodyPart: 'shoulders', category: 'compound', sets: 3, repRange: [5, 8], restSeconds: 180, notes: 'RPE 8' },
      { name: 'Barbell Rows', bodyPart: 'back', category: 'compound', sets: 3, repRange: [3, 5], restSeconds: 300, notes: 'RPE 8' },
      { name: 'Weighted Dips', bodyPart: 'triceps', category: 'bodyweight', sets: 2, repRange: [6, 8], restSeconds: 180, notes: 'RPE 8' },
      { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 2, repRange: [6, 8], restSeconds: 120, notes: 'RPE 8' },
    ],
  },
  'Lower Body Power': {
    splitDay: 'Lower Body Power',
    exercises: [
      { name: 'Barbell Squats', bodyPart: 'quads', category: 'compound', sets: 3, repRange: [3, 5], restSeconds: 300, notes: 'RPE 8 — do not train to failure except final set' },
      { name: 'Hack Squats', bodyPart: 'quads', category: 'machine', sets: 3, repRange: [5, 8], restSeconds: 240, notes: 'RPE 8' },
      { name: 'Leg Press', bodyPart: 'quads', category: 'machine', sets: 2, repRange: [6, 8], restSeconds: 240, notes: 'RPE 8' },
      { name: 'Stiff-Leg Deadlifts', bodyPart: 'hamstrings', category: 'compound', sets: 3, repRange: [5, 8], restSeconds: 240, notes: 'RPE 8' },
      { name: 'Lying Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 2, repRange: [6, 8], restSeconds: 180, notes: 'RPE 8' },
      { name: 'Standing Calf Raises', bodyPart: 'calves', category: 'machine', sets: 3, repRange: [6, 8], restSeconds: 120, notes: 'RPE 8' },
    ],
  },
  'Back & Shoulders Hypertrophy': {
    splitDay: 'Back & Shoulders Hypertrophy',
    exercises: [
      { name: 'Bent-Over Rows (Speed Work)', bodyPart: 'back', category: 'compound', sets: 6, repRange: [3, 3], restSeconds: 90, intensifier: 'speed-work', notes: '65-70% 1RM, maximum bar velocity. RPE 8.' },
      { name: 'Seated Cable Rows', bodyPart: 'back', category: 'cable', sets: 3, repRange: [8, 12], restSeconds: 90, notes: 'RPE 8' },
      { name: 'Lat Pulldowns', bodyPart: 'back', category: 'cable', sets: 3, repRange: [8, 12], restSeconds: 90, notes: 'RPE 8' },
      { name: 'Dumbbell Rows', bodyPart: 'back', category: 'compound', sets: 2, repRange: [10, 12], restSeconds: 60, notes: 'RPE 8' },
      { name: 'Seated Dumbbell Press', bodyPart: 'shoulders', category: 'compound', sets: 3, repRange: [8, 12], restSeconds: 90, notes: 'RPE 8' },
      { name: 'Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 3, repRange: [12, 15], restSeconds: 60, notes: 'RPE 8' },
      { name: 'Cable Rear Delt Flyes', bodyPart: 'shoulders', category: 'cable', sets: 3, repRange: [12, 15], restSeconds: 60, notes: 'RPE 8' },
    ],
  },
  'Lower Body Hypertrophy': {
    splitDay: 'Lower Body Hypertrophy',
    exercises: [
      { name: 'Squats (Speed Work)', bodyPart: 'quads', category: 'compound', sets: 6, repRange: [3, 3], restSeconds: 90, intensifier: 'speed-work', notes: '65-70% 1RM, maximum bar velocity. RPE 8.' },
      { name: 'Hack Squats', bodyPart: 'quads', category: 'machine', sets: 3, repRange: [8, 12], restSeconds: 90, notes: 'RPE 8' },
      { name: 'Leg Extensions', bodyPart: 'quads', category: 'machine', sets: 3, repRange: [12, 15], restSeconds: 60, notes: 'RPE 8' },
      { name: 'Romanian Deadlifts', bodyPart: 'hamstrings', category: 'compound', sets: 3, repRange: [8, 12], restSeconds: 90, notes: 'RPE 8' },
      { name: 'Lying Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 3, repRange: [12, 15], restSeconds: 60, notes: 'RPE 8' },
      { name: 'Standing Calf Raises', bodyPart: 'calves', category: 'machine', sets: 4, repRange: [10, 12], restSeconds: 60, notes: 'RPE 8' },
    ],
  },
  'Chest & Arms Hypertrophy': {
    splitDay: 'Chest & Arms Hypertrophy',
    exercises: [
      { name: 'Flat Dumbbell Press (Speed Work)', bodyPart: 'chest', category: 'compound', sets: 6, repRange: [3, 3], restSeconds: 90, intensifier: 'speed-work', notes: '65-70% 1RM, maximum bar velocity. RPE 8.' },
      { name: 'Incline Barbell Press', bodyPart: 'chest', category: 'compound', sets: 3, repRange: [8, 12], restSeconds: 90, notes: 'RPE 8' },
      { name: 'Cable Flyes', bodyPart: 'chest', category: 'cable', sets: 3, repRange: [10, 12], restSeconds: 60, notes: 'RPE 8' },
      { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 3, repRange: [8, 12], restSeconds: 60, notes: 'RPE 8' },
      { name: 'Preacher Curls', bodyPart: 'biceps', category: 'isolation', sets: 2, repRange: [10, 12], restSeconds: 60, notes: 'RPE 8' },
      { name: 'Skull Crushers', bodyPart: 'triceps', category: 'isolation', sets: 3, repRange: [8, 12], restSeconds: 60, notes: 'RPE 8' },
      { name: 'Cable Tricep Pushdowns', bodyPart: 'triceps', category: 'cable', sets: 2, repRange: [10, 12], restSeconds: 60, notes: 'RPE 8' },
    ],
  },
}

// ─── MI40 Phase-Specific Templates ───
// ALL exercises use strict 4-0-1-0 tempo, 40s rest, and MI40 "intention" cues
// Phase 1-2: High frequency, 40-min sessions, NOS on last exercise per body part
// Phase 3: Power/Hypertrophy — heavier loads, 60-90s rest, still 4-0-1-0 tempo
// Phase 5: De-Load — reduced volume, no intensifiers, recovery focus
// Phase 6: Overreaching — maximum volume, NOS-X on every exercise, CEP protocol

export const MI40_PHASE12_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Chest': {
    splitDay: 'Chest',
    exercises: [
      { name: 'Incline Dumbbell Press', bodyPart: 'chest', category: 'compound', sets: 2, repRange: [10, 10], tempo: '4-0-1-0', restSeconds: 40, notes: 'Activation set — drive elbows together, isolate upper pec' },
      { name: 'Flat Barbell Bench Press', bodyPart: 'chest', category: 'compound', sets: 3, repRange: [8, 8], tempo: '4-0-1-0', restSeconds: 40, notes: 'Push body into bench, not weight away. Retract scapulae.' },
      { name: 'Seated Cable Flyes (1½ Reps)', bodyPart: 'chest', category: 'cable', sets: 3, repRange: [8, 8], tempo: '4-0-1-0', restSeconds: 40, intensifier: '1.5-reps', notes: 'Full contraction + half-range pulse = 1 rep' },
      { name: 'Incline Dumbbell Flyes (NOS)', bodyPart: 'chest', category: 'isolation', sets: 4, repRange: [8, 8], tempo: '4-0-1-0', restSeconds: 40, intensifier: 'nos', notes: 'NOS on set 4: failure → drop 20% → failure → drop 20% → failure → partials' },
    ],
  },
  'Back': {
    splitDay: 'Back',
    exercises: [
      { name: 'Straight-Arm Cable Pullovers', bodyPart: 'back', category: 'cable', sets: 3, repRange: [10, 12], tempo: '4-0-1-0', restSeconds: 40, notes: 'Bent over 45°+, arms straight, pivot from hips. Shove shoulders down.' },
      { name: 'Wide-Grip Lat Pulldowns', bodyPart: 'back', category: 'cable', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 40, notes: 'Pull through elbows, not hands. Extend scapula at top.' },
      { name: 'Seated Cable Rows (Neutral Grip)', bodyPart: 'back', category: 'cable', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 40, notes: 'Shove chest into imaginary wall while pulling shoulders back' },
      { name: 'Single-Arm Dumbbell Rows (NOS-X)', bodyPart: 'back', category: 'compound', sets: 3, repRange: [8, 8], tempo: '4-0-1-0', restSeconds: 40, intensifier: 'nos-x', notes: 'NOS-X: drops + 20-30s loaded stretch in bottom position after each drop' },
    ],
  },
  'Shoulders & Arms': {
    splitDay: 'Shoulders & Arms',
    exercises: [
      { name: 'Seated Dumbbell Overhead Press', bodyPart: 'shoulders', category: 'compound', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 40, notes: 'Squeeze elbows together on ascent, reach for ceiling' },
      { name: 'Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 3, repRange: [10, 12], tempo: '4-0-1-0', restSeconds: 40, notes: 'Feet together, shove shoulders down before each rep, palms down' },
      { name: 'Bent-Over Dumbbell Rear Delt Raises', bodyPart: 'shoulders', category: 'isolation', sets: 3, repRange: [10, 12], tempo: '4-0-1-0', restSeconds: 40, notes: 'Head facing ground, minimise scapula movement, pull from elbows' },
      { name: 'Barbell Curls', bodyPart: 'biceps', category: 'compound', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 40, notes: 'Curl in an arch (out and up). Squeeze pinky toward shoulder.' },
      { name: 'Tricep Cable Pushdowns', bodyPart: 'triceps', category: 'cable', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 40, notes: 'Elbows fixed, shove toward each other. Create an arc.' },
      { name: 'Incline Dumbbell Curls (NOS)', bodyPart: 'biceps', category: 'isolation', sets: 3, repRange: [8, 8], tempo: '4-0-1-0', restSeconds: 40, intensifier: 'nos', notes: 'Stretch biceps fully at bottom every rep' },
      { name: 'Overhead Cable Rope Extensions (NOS)', bodyPart: 'triceps', category: 'cable', sets: 3, repRange: [8, 8], tempo: '4-0-1-0', restSeconds: 40, intensifier: 'nos' },
    ],
  },
  'Legs': {
    splitDay: 'Legs',
    exercises: [
      { name: 'Barbell Back Squats (Heels Elevated)', bodyPart: 'quads', category: 'compound', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 40, notes: 'Elevate heels 1-2". Push knees forward. Co-contract glutes and quads.' },
      { name: 'Leg Press', bodyPart: 'quads', category: 'machine', sets: 3, repRange: [10, 12], tempo: '4-0-1-0', restSeconds: 40, notes: 'Constant movement, just prior to knee lock-out. Never pause.' },
      { name: 'Leg Extensions', bodyPart: 'quads', category: 'machine', sets: 3, repRange: [10, 12], tempo: '3-0-1-3', restSeconds: 40, notes: '3s peak contraction at top. Complete control, zero explosive movement.' },
      { name: 'Lying Leg Curls (Body Extended)', bodyPart: 'hamstrings', category: 'machine', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 40, notes: 'Prop upper body so hips in full extension. Force pelvis into pad.' },
      { name: 'Stiff-Leg Deadlifts', bodyPart: 'hamstrings', category: 'compound', sets: 3, repRange: [8, 10], tempo: '4-0-1-0', restSeconds: 40, notes: 'Toes elevated 1-2". Shove butt/hips backwards. Stop short of vertical.' },
      { name: 'Standing Calf Raises', bodyPart: 'calves', category: 'machine', sets: 4, repRange: [8, 10], tempo: '2-2-1-0', restSeconds: 40, notes: 'Drive through big toe. When you think you are up all the way, go further.' },
    ],
  },
  'Weak Points': {
    splitDay: 'Weak Points',
    exercises: [
      { name: 'Cable Lateral Raises', bodyPart: 'shoulders', category: 'cable', sets: 4, repRange: [10, 12], tempo: '4-0-1-0', restSeconds: 40, intensifier: 'nos' },
      { name: 'Prone Incline Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 3, repRange: [10, 12], tempo: '4-0-1-0', restSeconds: 40 },
      { name: 'Standing Calf Raises (Toes In)', bodyPart: 'calves', category: 'machine', sets: 4, repRange: [8, 10], tempo: '2-4-1-0', restSeconds: 40 },
      { name: 'Seated Calf Raises', bodyPart: 'calves', category: 'machine', sets: 4, repRange: [12, 15], tempo: '2-2-1-0', restSeconds: 40, intensifier: 'nos' },
      { name: 'Hanging Leg Raises', bodyPart: 'abs', category: 'bodyweight', sets: 3, repRange: [10, 12], tempo: '2-0-1-2', restSeconds: 40 },
      { name: 'Cable Crunches', bodyPart: 'abs', category: 'cable', sets: 3, repRange: [10, 12], tempo: '3-0-1-2', restSeconds: 40 },
    ],
  },
}

export const MI40_PHASE3_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Chest & Triceps': {
    splitDay: 'Chest & Triceps',
    exercises: [
      { name: 'Dumbbell Bench Press (¼ Reps at Bottom)', bodyPart: 'chest', category: 'compound', sets: 6, repRange: [8, 6], tempo: '4-0-1-0', restSeconds: 60, notes: 'Pyramid: 8-8-6-6-4-4. Extra ¼ rep at bottom of each rep.' },
      { name: 'Incline Machine Press', bodyPart: 'chest', category: 'machine', sets: 6, repRange: [12, 6], tempo: '3-0-1-2', restSeconds: 60, notes: 'Pyramid: 12-12-8-8-6-6. Press inward with pecs.' },
      { name: 'Cable Flyes', bodyPart: 'chest', category: 'cable', sets: 4, repRange: [8, 10], tempo: '3-0-1-2', restSeconds: 60 },
      { name: 'Dumbbell Flyes', bodyPart: 'chest', category: 'isolation', sets: 4, repRange: [8, 10], tempo: '3-2-1-0', restSeconds: 60 },
      { name: 'Close-Grip Bench Press', bodyPart: 'triceps', category: 'compound', sets: 4, repRange: [6, 8], tempo: '4-0-1-0', restSeconds: 75 },
      { name: 'Lying Dumbbell Tricep Extensions', bodyPart: 'triceps', category: 'isolation', sets: 4, repRange: [8, 10], tempo: '4-1-1-0', restSeconds: 60, intensifier: 'nos' },
    ],
  },
  'Back & Biceps': {
    splitDay: 'Back & Biceps',
    exercises: [
      { name: 'Barbell Rack Deadlifts', bodyPart: 'back', category: 'compound', sets: 6, repRange: [6, 8], tempo: '3-1-1-0', restSeconds: 75, notes: 'Rack 3-4" below knee. Initiate with lats.' },
      { name: 'Pull-Ups (Neutral Grip)', bodyPart: 'back', category: 'compound', sets: 6, repRange: [3, 5], tempo: '4-1-X-0', restSeconds: 60, notes: 'Full stretch leaning 10-15° at bottom' },
      { name: 'Dumbbell Rows (Neutral Grip)', bodyPart: 'back', category: 'compound', sets: 6, repRange: [4, 6], tempo: '4-1-1-0', restSeconds: 60 },
      { name: 'Machine Preacher Curls', bodyPart: 'biceps', category: 'machine', sets: 6, repRange: [6, 8], tempo: '4-0-1-0', restSeconds: 75 },
      { name: 'Standing Dumbbell Curls', bodyPart: 'biceps', category: 'isolation', sets: 5, repRange: [8, 8], tempo: '3-0-1-2', restSeconds: 60 },
    ],
  },
  'Legs': {
    splitDay: 'Legs',
    exercises: [
      { name: 'Barbell Back Squats (Heels Elevated)', bodyPart: 'quads', category: 'compound', sets: 5, repRange: [8, 10], tempo: '4-1-1-0', restSeconds: 75, notes: 'Push knees forward to initiate eccentric' },
      { name: 'Lying Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 5, repRange: [6, 8], tempo: '4-0-1-1', restSeconds: 75 },
      { name: 'Hack Squats', bodyPart: 'quads', category: 'machine', sets: 5, repRange: [8, 10], tempo: '3-0-1-0', restSeconds: 60 },
      { name: 'Leg Extensions', bodyPart: 'quads', category: 'machine', sets: 5, repRange: [10, 12], tempo: '2-0-1-3', restSeconds: 75, notes: '3s hold at top' },
      { name: 'Seated Leg Curls (Leaning Forward)', bodyPart: 'hamstrings', category: 'machine', sets: 5, repRange: [6, 8], tempo: '4-2-1-0', restSeconds: 60, notes: 'Lean forward for full stretch' },
      { name: 'Stiff-Leg Deadlifts', bodyPart: 'hamstrings', category: 'compound', sets: 5, repRange: [8, 12], tempo: '3-1-1-0', restSeconds: 75 },
      { name: 'Leg Press (Feet Wide & High)', bodyPart: 'glutes', category: 'machine', sets: 4, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60, notes: 'Press with glutes' },
    ],
  },
  'Shoulders': {
    splitDay: 'Shoulders',
    exercises: [
      { name: 'Seated Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 5, repRange: [8, 10], tempo: '3-0-1-0', restSeconds: 45 },
      { name: 'Prone 30° Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 5, repRange: [8, 10], tempo: '3-0-1-0', restSeconds: 45, notes: 'Pronated grip, rear delt focus' },
      { name: 'Cable Lateral Raises', bodyPart: 'shoulders', category: 'cable', sets: 5, repRange: [8, 10], tempo: '3-0-1-0', restSeconds: 45 },
      { name: 'Standing Cable Face Pulls', bodyPart: 'shoulders', category: 'cable', sets: 4, repRange: [8, 10], tempo: '3-0-1-0', restSeconds: 45, notes: 'Nose height, row rope towards face' },
      { name: 'Dumbbell Shrugs', bodyPart: 'shoulders', category: 'isolation', sets: 5, repRange: [8, 10], tempo: '2-0-1-2', restSeconds: 45 },
      { name: 'Standing Calf Raises', bodyPart: 'calves', category: 'machine', sets: 5, repRange: [8, 10], tempo: '2-2-1-0', restSeconds: 45 },
      { name: 'Seated Calf Raises', bodyPart: 'calves', category: 'machine', sets: 5, repRange: [8, 10], tempo: '2-2-1-0', restSeconds: 45 },
    ],
  },
  'Arms': {
    splitDay: 'Arms',
    exercises: [
      { name: 'Single-Arm Tricep Pushdowns (Rope)', bodyPart: 'triceps', category: 'cable', sets: 5, repRange: [5, 5], tempo: '3-0-1-2', restSeconds: 45 },
      { name: 'Prone Spider Curls', bodyPart: 'biceps', category: 'isolation', sets: 5, repRange: [5, 5], tempo: '3-0-1-2', restSeconds: 25 },
      { name: 'Overhead French Press (Rope)', bodyPart: 'triceps', category: 'cable', sets: 5, repRange: [6, 8], tempo: '3-1-1-0', restSeconds: 60, notes: 'Full stretch at bottom. No elbow flare.' },
      { name: 'Single-Arm Dumbbell Preacher Curls', bodyPart: 'biceps', category: 'isolation', sets: 5, repRange: [5, 5], tempo: '3-1-1-0', restSeconds: 45 },
      { name: 'Parallel Bar Dips (Triceps)', bodyPart: 'triceps', category: 'bodyweight', sets: 5, repRange: [8, 10], tempo: '3-1-1-0', restSeconds: 60, notes: 'Body upright, elbows turned in' },
      { name: 'Incline Dumbbell Curls (Supinating)', bodyPart: 'biceps', category: 'isolation', sets: 5, repRange: [6, 8], tempo: '3-1-1-0', restSeconds: 60 },
      { name: 'Lying Dumbbell Tricep Extensions (NOS)', bodyPart: 'triceps', category: 'isolation', sets: 5, repRange: [8, 10], tempo: '3-1-1-1', restSeconds: 60, intensifier: 'nos' },
    ],
  },
}

export const MI40_PHASE5_DELOAD_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Upper': {
    splitDay: 'Upper',
    exercises: [
      { name: 'Machine Chest Press', bodyPart: 'chest', category: 'machine', sets: 2, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60, notes: 'Deload — 60% of normal weight. Focus on execution.' },
      { name: 'Lat Pulldowns', bodyPart: 'back', category: 'cable', sets: 2, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60 },
      { name: 'Machine Shoulder Press', bodyPart: 'shoulders', category: 'machine', sets: 2, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60 },
      { name: 'Cable Curls', bodyPart: 'biceps', category: 'cable', sets: 2, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60 },
      { name: 'Tricep Pushdowns', bodyPart: 'triceps', category: 'cable', sets: 2, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60 },
    ],
  },
  'Lower': {
    splitDay: 'Lower',
    exercises: [
      { name: 'Leg Press', bodyPart: 'quads', category: 'machine', sets: 2, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60, notes: 'Deload — 60% of normal weight' },
      { name: 'Leg Extensions', bodyPart: 'quads', category: 'machine', sets: 2, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60 },
      { name: 'Lying Leg Curls', bodyPart: 'hamstrings', category: 'machine', sets: 2, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60 },
      { name: 'Standing Calf Raises', bodyPart: 'calves', category: 'machine', sets: 2, repRange: [10, 12], tempo: '2-2-1-0', restSeconds: 60 },
    ],
  },
  'Full Body': {
    splitDay: 'Full Body',
    exercises: [
      { name: 'Dumbbell Bench Press', bodyPart: 'chest', category: 'compound', sets: 2, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60, notes: 'Deload — light weight, perfect execution' },
      { name: 'Seated Cable Rows', bodyPart: 'back', category: 'cable', sets: 2, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60 },
      { name: 'Goblet Squats', bodyPart: 'quads', category: 'compound', sets: 2, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60 },
      { name: 'Dumbbell Lateral Raises', bodyPart: 'shoulders', category: 'isolation', sets: 2, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 60 },
      { name: 'Hanging Knee Raises', bodyPart: 'abs', category: 'bodyweight', sets: 2, repRange: [10, 12], tempo: '2-0-1-0', restSeconds: 60 },
    ],
  },
}

export const MI40_PHASE6_OVERREACH_TEMPLATES: Record<string, WorkoutTemplate> = {
  'Chest': {
    splitDay: 'Chest',
    exercises: [
      { name: 'Dumbbell Bench Press (¼ Reps)', bodyPart: 'chest', category: 'compound', sets: 6, repRange: [8, 8], tempo: '4-0-1-0', restSeconds: 40, intensifier: 'nos-x', notes: 'NOS-X every set. Extra ¼ rep at bottom.' },
      { name: 'Incline Machine Press', bodyPart: 'chest', category: 'machine', sets: 5, repRange: [8, 10], tempo: '3-0-1-2', restSeconds: 40, intensifier: 'nos' },
      { name: 'Cable Flyes', bodyPart: 'chest', category: 'cable', sets: 5, repRange: [10, 12], tempo: '3-0-1-2', restSeconds: 40, intensifier: 'nos' },
      { name: 'Dumbbell Flyes (NOS-X)', bodyPart: 'chest', category: 'isolation', sets: 4, repRange: [8, 10], tempo: '3-2-1-0', restSeconds: 40, intensifier: 'nos-x', notes: 'NOS-X with loaded stretch in bottom position' },
      { name: 'Push-Ups (Bottom Half Only)', bodyPart: 'chest', category: 'bodyweight', sets: 4, repRange: [20, 25], tempo: '2-0-1-0', restSeconds: 40, notes: 'Metabolic finisher. Push floor inward.' },
    ],
  },
  'Back': {
    splitDay: 'Back',
    exercises: [
      { name: 'Straight-Arm Cable Pullovers', bodyPart: 'back', category: 'cable', sets: 5, repRange: [6, 8], tempo: '4-0-1-0', restSeconds: 40, intensifier: 'nos-x' },
      { name: 'Pull-Ups (Neutral Grip)', bodyPart: 'back', category: 'compound', sets: 5, repRange: [8, 10], tempo: '3-0-1-0', restSeconds: 40, intensifier: 'nos' },
      { name: 'Dumbbell Rows (Neutral Grip)', bodyPart: 'back', category: 'compound', sets: 5, repRange: [6, 8], tempo: '4-1-1-0', restSeconds: 40, intensifier: 'nos' },
      { name: 'Wide-Grip Lat Pulldowns (Leaning)', bodyPart: 'back', category: 'cable', sets: 5, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 40, intensifier: 'nos-x' },
      { name: 'Seated Cable Rows (Rear Delt Focus)', bodyPart: 'back', category: 'cable', sets: 4, repRange: [10, 12], tempo: '3-0-1-0', restSeconds: 40, intensifier: 'nos' },
    ],
  },
  'Legs': MI40_PHASE3_TEMPLATES['Legs'],
  'Shoulders': MI40_PHASE3_TEMPLATES['Shoulders'],
  'Arms': MI40_PHASE3_TEMPLATES['Arms'],
  'Weak Points': MI40_PHASE12_TEMPLATES['Weak Points'],
}

// ─── Get the right template set for a philosophy and phase ───

export function getTemplateForSplit(
  philosophy: string,
  phase: string,
  splitDay: string
): WorkoutTemplate | null {
  const phaseL = phase.toLowerCase()

  let templates: Record<string, WorkoutTemplate>

  switch (philosophy) {
    case 'incredible-bulk': {
      const isReset = phaseL.includes('reset') || phaseL.includes('cut') || phaseL.includes('shred')
      templates = isReset ? IB_RESET_TEMPLATES : IB_GROWTH_TEMPLATES
      break
    }
    case 'mi40': {
      if (phaseL.includes('phase 1') || phaseL.includes('phase 2') || phaseL.includes('high frequency'))
        templates = MI40_PHASE12_TEMPLATES
      else if (phaseL.includes('phase 3') || phaseL.includes('power'))
        templates = MI40_PHASE3_TEMPLATES
      else if (phaseL.includes('phase 5') || phaseL.includes('de-load') || phaseL.includes('deload'))
        templates = MI40_PHASE5_DELOAD_TEMPLATES
      else if (phaseL.includes('phase 6') || phaseL.includes('overreach'))
        templates = MI40_PHASE6_OVERREACH_TEMPLATES
      else
        templates = MI40_PHASE12_TEMPLATES
      break
    }
    case 'dtp':
      templates = DTP_TEMPLATES; break
    case 'y3t': {
      if (phaseL.includes('annihilation') || phaseL.includes('week 3')) templates = Y3T_WEEK3_TEMPLATES
      else if (phaseL.includes('heavy') || phaseL.includes('week 1')) templates = Y3T_WEEK1_TEMPLATES
      else templates = Y3T_WEEK2_TEMPLATES
      break
    }
    case 'fst7':
      templates = FST7_TEMPLATES; break
    case 'hit':
      templates = HIT_TEMPLATES; break
    case 'phat':
      templates = PHAT_TEMPLATES; break
    case 'contest-prep':
      templates = CONTEST_PREP_TEMPLATES; break
    case 'bompa': {
      if (phaseL.includes('anatomical') || phaseL.includes('adaptation')) templates = BOMPA_AA_TEMPLATES
      else if (phaseL.includes('maximum') || phaseL.includes('strength')) templates = BOMPA_MAXSTRENGTH_TEMPLATES
      else if (phaseL.includes('conversion') || phaseL.includes('power')) templates = BOMPA_POWER_TEMPLATES
      else templates = BOMPA_HYPERTROPHY_TEMPLATES
      break
    }
    case 'corey-g':
      templates = COREYG_TEMPLATES; break
    default:
      templates = IB_GROWTH_TEMPLATES
  }

  // HIIT / Metabolic days — return the appropriate cardio session
  const splitLower = splitDay.toLowerCase()
  if (splitLower.includes('hiit') || splitLower.includes('metabolic')) {
    // Alternate between HIIT intervals and metabolic conditioning
    return HIIT_SESSION
  }

  if (templates[splitDay]) return templates[splitDay]

  // Partial match
  for (const [key, template] of Object.entries(templates)) {
    const keyWords = key.toLowerCase().split(/[\s,&]+/).filter(w => w.length > 2)
    const splitWords = splitDay.toLowerCase().split(/[\s,&]+/).filter(w => w.length > 2)
    if (keyWords.some(w => splitWords.some(sw => sw.includes(w) || w.includes(sw)))) return template
  }

  return null
}
