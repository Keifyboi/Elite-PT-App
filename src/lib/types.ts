// ─── User Profile ───
export interface UserProfile {
  name: string
  age: number
  heightCm: number
  weightKg: number
  sex: 'male' | 'female'
  bodyFatPercent: number
  activityFactor: 1.2 | 1.375 | 1.55 | 1.725 | 1.9
  goal: 'bulk' | 'cut' | 'maintain' | 'contest-prep'
  trainingPhilosophy: TrainingPhilosophy
  currentPhase: string
  weekNumber: number
  dailyStepTarget: number
  trainingDaysPerWeek: number
  occupation: 'sedentary' | 'light-active' | 'active' | 'very-active'
  programStartDate?: string
  dietBreakActive?: boolean
  dietBreakStartDate?: string
  contestDate?: string
}

export type TrainingPhilosophy =
  | 'mi40'
  | 'incredible-bulk'
  | 'dtp'
  | 'y3t'
  | 'fst7'
  | 'hit'
  | 'phat'
  | 'bompa'
  | 'corey-g'
  | 'contest-prep'

// ─── Nutrition ───
export interface MacroTargets {
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
}

export interface MealPlan {
  id: string
  date: string
  meals: Meal[]
  totals: MacroTargets
  targets: MacroTargets
}

export interface Meal {
  id: string
  name: string
  time: string
  foods: MealFood[]
  totals: MacroTargets
}

export interface MealFood {
  foodId: string
  name: string
  servingSize: number
  servingUnit: string
  macros: MacroTargets
}

export interface FoodItem {
  id: string
  name: string
  category: FoodCategory
  servingSize: number
  servingUnit: string
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
}

export type FoodCategory =
  | 'protein'
  | 'dairy'
  | 'grains'
  | 'vegetables'
  | 'fruits'
  | 'nuts-fats'
  | 'supplements'
  | 'seafood'
  | 'organ-meats'
  | 'beans-lentils'
  | 'breads'
  | 'sweeteners'

// ─── Training ───
export interface WorkoutDay {
  id: string
  date: string
  phase: string
  philosophy: TrainingPhilosophy
  splitDay: string
  exercises: WorkoutExercise[]
  notes: string
  completed: boolean
  executionQuality?: number   // 1-5, captured at session completion
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  name: string
  targetMuscle: string
  sets: WorkoutSet[]
  tempo: string
  restSeconds: number
  intensifier?: Intensifier
  notes: string
  order: number
}

export interface WorkoutSet {
  setNumber: number
  targetReps: string
  actualReps?: number
  weight?: number
  rpe?: number
  completed: boolean
}

export type Intensifier =
  | 'nos'
  | 'nos-x'
  | 'cs-6'
  | 'fst7'
  | 'drop-set'
  | 'rest-pause'
  | 'giant-set'
  | 'speed-work'
  | '1.5-reps'
  | 'forced-reps'
  | 'negative-overload'

export interface Exercise {
  id: string
  name: string
  bodyPart: BodyPart
  category: 'compound' | 'isolation' | 'machine' | 'cable' | 'bodyweight'
  primaryMuscle: string
  secondaryMuscles: string[]
  executionCues: string[]
  mi40Intention?: string
}

export type BodyPart =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'

// ─── Progress Tracking ───
export interface WeeklyCheckIn {
  id: string
  weekNumber: number
  date: string
  weightKg: number
  bodyFatPercent: number
  measurements: Measurements
  photos: string[]
  subjective: SubjectiveScores
  macroAdherence: number
  trainingAdherence: number

  // Nutrition diagnostics
  mealsPerDay?: number           // 1-6
  hungerRating?: number          // 1-5 (1=always hungry, 5=no hunger)
  cravingsLevel?: number         // 1-5 (1=severe, 5=none)
  alcoholSessions?: number       // 0-7 per week
  mealPrepDone?: boolean

  // Recovery & lifestyle
  hoursOfSleep?: number          // e.g. 7.5
  injuryNiggle?: string          // free text, optional
  stretchingDone?: boolean       // foam rolling / mobility done this week

  // Training quality
  executionQuality?: number      // 1-5 self-rating

  // Competency scoring (5 dimensions, 1-5 each)
  competencyScores?: {
    nutrition: number
    training: number
    recovery: number
    mindset: number
    consistency: number
  }
}

export interface Measurements {
  chest?: number
  waist?: number
  hips?: number
  armLeft?: number
  armRight?: number
  thighLeft?: number
  thighRight?: number
}

export interface SubjectiveScores {
  energy: number
  strength: number
  hunger: number
  mood: number
  stress: number
  sleep: number
}

// ─── Phase System ───
export interface PhaseConfig {
  name: string
  philosophy: TrainingPhilosophy
  durationWeeks: number
  macroSplit: { protein: number; carbs: number; fats: number }
  calorieStrategy: 'surplus' | 'deficit' | 'maintenance'
  calorieAdjustment: number
  trainingStyle: TrainingStyle
  cardioProtocol: CardioProtocol
  supplementProtocol: SupplementItem[]
}

export interface TrainingStyle {
  daysPerWeek: number
  setsPerBodyPart: [number, number]
  repRange: [number, number]
  restSeconds: [number, number]
  tempoDefault: string
  intensifierFrequency: 'none' | 'last-set' | 'every-exercise'
  splitType: string
  split: Record<string, string>
}

export interface CardioProtocol {
  type: 'none' | 'liss' | 'hiit' | 'mixed'
  sessionsPerWeek: number
  durationMinutes: number
  workRestRatio?: string
}

export interface SupplementItem {
  name: string
  dose: string
  timing: string
}

// ─── Supplement Logging ───
export interface SupplementLog {
  date: string       // YYYY-MM-DD
  itemName: string   // supplement name
  taken: boolean
}

// ─── Carb Cycling ───
export interface CarbCycleDay {
  dayType: 'low' | 'medium' | 'high' | 'refeed'
  macros: MacroTargets
  mealDistribution: Record<string, MacroTargets>
}
