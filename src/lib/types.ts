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
  division?: CompetitionDivision
}

export type CompetitionDivision =
  | 'mens-bodybuilding'
  | 'mens-classic-physique'
  | 'mens-physique'
  | 'womens-bodybuilding'
  | 'womens-physique'
  | 'womens-figure'
  | 'womens-fitness'
  | 'womens-bikini'

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
  | 'back-width'
  | 'back-thickness'
  | 'shoulders'
  | 'traps'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'

// ─── Bodybuilding Program Builder (pose-priority engine) ───

// The 5 philosophies covered by the pose-priority rewrite. A subset of
// TrainingPhilosophy — HIT/DTP/Bompa/Incredible Bulk/Contest-Prep are
// untouched and keep using the generic BodyPart/PhaseConfig system above.
export type BodybuildingPhilosophy = 'y3t' | 'mi40' | 'fst7' | 'phat' | 'corey-g'

// High-leverage areas that appear in 3+ mandatory poses or are chronically
// underbuilt — tracked individually rather than folded into "back"/"shoulders".
export type PosePriorityArea =
  | 'back-width'
  | 'back-thickness'
  | 'traps'
  | 'serratus'
  | 'hamstring-glute-tie-in'
  | 'calves'

// A macrocycle stage — distinct from PhaseConfig.name (which is a
// philosophy-specific label like "Phase 3 (Power/Hypertrophy)"). This is the
// higher-level stage that decides which philosophy block runs next.
export type MacrocyclePhase = 'hypertrophy-1' | 'hypertrophy-2' | 'recomposition' | 'prep-and-peak'

export type WaveStage = 'accumulation' | 'intensification' | 'overreach' | 'deload'

export interface WaveWeek {
  stage: WaveStage
  volumeMultiplier: number // 1.0 / 0.9 / 1.15 / 0.6
  repRangeLabel: string    // e.g. "10-12 / 12-15"
  rir: [number, number]
}

// A persisted record of one training block, written when a block is
// generated (Stage 2) and read to check macrocycle pose-priority coverage
// (Stage 3). Typed now so the storage plumbing can land in Stage 1.
export interface TrainingBlock {
  id: string
  philosophy: BodybuildingPhilosophy
  macrocyclePhase: MacrocyclePhase
  cycleCount: number       // number of wave cycles the block ran (Y3T: 3-week cycles; others: 4-week cycles)
  startDate: string
  dedicatedPoseAreas: PosePriorityArea[] // pose-priority areas this block was the dedicated block for
}

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
