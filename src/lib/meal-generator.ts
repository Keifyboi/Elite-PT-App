import type { MacroTargets, FoodItem, Meal, MealFood, MealPlan, TrainingPhilosophy, UserProfile } from './types'
import { FOOD_DATABASE } from './data/foods'
import { getArchetypesForSlot, type MealArchetype } from './data/meal-pairings'

const CALORIE_TOLERANCE = 50
const MACRO_TOLERANCE = 5
const MAX_SOLVER_PASSES = 20

// ─── Helpers ───

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function roundServing(grams: number, unit: string): number {
  if (unit === 'egg') return Math.max(1, Math.round(grams))
  if (unit === 'rasher') return Math.max(1, Math.round(grams))
  if (unit === 'weetabix' || unit === 'bar' || unit === 'muffin' || unit === 'bagel' || unit === 'crumpet' || unit === 'rice cake' || unit === 'corn cake') {
    return Math.max(1, Math.round(grams))
  }
  return Math.max(5, Math.round(grams / 5) * 5)
}

function calcFoodMacros(food: FoodItem, portion: number): MacroTargets {
  const scale = portion / food.servingSize
  return {
    calories: Math.round(food.calories * scale),
    protein: Math.round(food.protein * scale * 10) / 10,
    carbs: Math.round(food.carbs * scale * 10) / 10,
    fats: Math.round(food.fats * scale * 10) / 10,
    fiber: Math.round(food.fiber * scale * 10) / 10,
  }
}

function buildMealFood(food: FoodItem, portion: number): MealFood {
  return {
    foodId: food.id,
    name: food.name,
    servingSize: portion,
    servingUnit: food.servingUnit,
    macros: calcFoodMacros(food, portion),
  }
}

function portionForMacro(food: FoodItem, targetGrams: number, macro: 'protein' | 'carbs' | 'fats'): number {
  const perUnit = food[macro] / food.servingSize
  if (perUnit <= 0) return 0
  return roundServing(targetGrams / perUnit, food.servingUnit)
}

function sumMacros(foods: MealFood[]): MacroTargets {
  return foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.macros.calories,
      protein: acc.protein + f.macros.protein,
      carbs: acc.carbs + f.macros.carbs,
      fats: acc.fats + f.macros.fats,
      fiber: acc.fiber + f.macros.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
  )
}

// Keith's preferred staple foods — meals are generated from this list only
const PREFERRED_FOOD_IDS = new Set([
  // proteins
  'chicken-breast-cooked', 'chicken-breast-raw',
  'eggs-whole', 'egg-whites',
  'lean-beef-mince-cooked', 'lean-beef-mince-raw',
  'tuna',
  // dairy / shakes
  'greek-yoghurt-0', 'greek-yoghurt-whole',
  'whey-protein', 'protein-powder',
  // fats
  'avocado', 'olive-oil', 'peanut-butter',
  // grains / carbs
  'basmati-rice', 'brown-rice',
  'white-bread', 'whole-wheat-bread', 'sourdough-bread',
  // fruits
  'banana',
  // vegetables (all veg allowed — variety is fine here)
  'broccoli', 'tender-stem-broccoli', 'peppers', 'green-beans',
  'asparagus', 'courgette', 'carrots', 'peas', 'tomato',
  'mushrooms', 'country-mix-vegetables', 'spinach',
  // supplements (intra/post shakes)
  'highly-branched-cyclic-dextrin', 'essential-amino-acids', 'creatine-monohydrate',
])

function foodsByCategory(...cats: string[]): FoodItem[] {
  const all = FOOD_DATABASE.filter(f => cats.includes(f.category))
  const preferred = all.filter(f => PREFERRED_FOOD_IDS.has(f.id))
  // Only use preferred list if it has at least one option in this category;
  // otherwise fall back to the full category so meals never come back empty.
  return preferred.length > 0 ? preferred : all
}

// ─── Meal slot with absolute gram targets per meal ───

interface MealSlot {
  name: string
  time: string
  protein: number  // absolute grams
  carbs: number
  fats: number
  proteinSources: string[]
  carbSources: string[]
  fatSources: string[]
  addVeg: boolean
}

// ─── Calculate absolute gram targets per meal based on nutrient timing science ───
// Sources: IB Main Book sample days, MI40-X Nutrition Guide, Norton Contest Prep Guide
//
// Core rules:
// - Protein: even across all meals (leucine threshold each meal)
// - Carbs: ZERO at breakfast, backloaded around workout (30-40% intra/post, 25-30% post meal, rest evening)
// - Fats: front-loaded at breakfast (40-50% of daily fats), inversely correlated with carbs per meal
// - High carb meal = low fat. High fat meal = low carb. Never both high in same meal.
// - Veg at every solid meal for fibre + volume + micronutrients

// ─── Philosophy-specific nutrient timing ───

// Estimate how much protein will come from carb and fat sources
// so we can reduce protein food portions to avoid overshoot
function estimateSecondaryProtein(totalCarbs: number, totalFats: number): number {
  // Average protein per gram of carb food (rice ~7.5g/100g at ~78g carbs/100g ≈ 0.096 protein per gram of carbs)
  const proteinFromCarbs = totalCarbs * 0.08
  // Average protein per gram of fat food (nuts ~20g/100g at ~50g fat/100g ≈ 0.4 protein per gram of fat, but oils are 0)
  // Use conservative estimate since many fat sources are oils/butter with 0 protein
  const proteinFromFats = totalFats * 0.1
  return Math.round(proteinFromCarbs + proteinFromFats)
}

// Max carb grams from food weight perspective (200g dry = ~600g cooked = practical max)
const MAX_CARB_FOOD_WEIGHT = 200 // grams of dry carb food per meal

function getMealSlots(
  philosophy: TrainingPhilosophy,
  phase: string,
  isTrainingDay: boolean,
  targets?: MacroTargets
): MealSlot[] {
  const rawP = targets?.protein ?? 150
  const C = targets?.carbs ?? 200
  const F = targets?.fats ?? 60
  const secondaryP = estimateSecondaryProtein(C, F)
  const P = Math.max(rawP - secondaryP, Math.round(rawP * 0.5))
  const phaseL = phase.toLowerCase()
  const isReset = phaseL.includes('reset') || phaseL.includes('cut') || phaseL.includes('shred')

  let slots: MealSlot[]
  switch (philosophy) {
    case 'incredible-bulk':
    case 'mi40':
      slots = ibMi40Slots(P, C, F, isReset, isTrainingDay); break
    case 'contest-prep':
    case 'phat':
      slots = nortonSlots(P, C, F, isTrainingDay); break
    case 'bompa':
      slots = bompaSlots(P, C, F, phaseL, isTrainingDay); break
    case 'dtp':
      slots = dtpSlots(P, C, F, isTrainingDay); break
    case 'y3t':
      slots = y3tSlots(P, C, F, phaseL, isTrainingDay); break
    case 'fst7':
      slots = fst7Slots(P, C, F, isTrainingDay); break
    case 'hit':
      slots = hitSlots(P, C, F, isTrainingDay); break
    case 'corey-g':
      slots = coreyGSlots(P, C, F, isTrainingDay); break
    default:
      slots = ibMi40Slots(P, C, F, isReset, isTrainingDay)
  }

  // Redistribute: cap carbs per meal and spread overflow to under-loaded meals
  return redistributeCarbs(slots)
}

function redistributeCarbs(slots: MealSlot[]): MealSlot[] {
  const totalCarbs = slots.reduce((s, sl) => s + sl.carbs, 0)
  if (totalCarbs <= 0) return slots

  // Count carb-eligible meals (those with carbs > 0 OR non-breakfast/non-zero-by-design)
  const carbMeals = slots.filter(s => s.carbs > 0)
  if (carbMeals.length === 0) return slots

  // Dynamic cap: total carbs / carb-containing meals, but no less than 60g and capped at practical max
  // Practical max: 200g dry rice ≈ 156g carbs. Use 120g as a generous but doable per-meal cap.
  const dynamicCap = Math.min(Math.max(Math.ceil(totalCarbs / carbMeals.length * 1.3), 60), 120)

  let overflow = 0
  for (const slot of slots) {
    if (slot.carbs > dynamicCap) {
      overflow += slot.carbs - dynamicCap
      slot.carbs = dynamicCap
    }
  }

  if (overflow <= 0) return slots

  // Spread overflow: first to existing carb meals that have headroom
  let recipients = slots.filter(s => s.carbs > 0 && s.carbs < dynamicCap)
  while (overflow > 0 && recipients.length > 0) {
    const perSlot = Math.ceil(overflow / recipients.length)
    for (const slot of recipients) {
      const add = Math.min(perSlot, dynamicCap - slot.carbs, overflow)
      slot.carbs += add
      overflow -= add
      if (overflow <= 0) break
    }
    recipients = slots.filter(s => s.carbs > 0 && s.carbs < dynamicCap)
    if (recipients.every(s => s.carbs >= dynamicCap)) break
  }

  // If still overflow, open up zero-carb solid meals (not shakes, not IB breakfast if reset)
  if (overflow > 0) {
    const zeroMeals = slots.filter(s => s.carbs === 0 && !s.name.toLowerCase().includes('shake') && !s.name.toLowerCase().includes('intra'))
    const perSlot = Math.ceil(overflow / Math.max(zeroMeals.length, 1))
    for (const slot of zeroMeals) {
      const add = Math.min(perSlot, dynamicCap, overflow)
      slot.carbs += add
      overflow -= add
      if (slot.carbSources.length === 0) slot.carbSources = ['grains']
      if (overflow <= 0) break
    }
  }

  // Final verification: if total still doesn't match, add remainder to the largest carb meal
  const newTotal = slots.reduce((s, sl) => s + sl.carbs, 0)
  const shortfall = totalCarbs - newTotal
  if (shortfall > 0) {
    const largest = slots.filter(s => s.carbs > 0).sort((a, b) => b.carbs - a.carbs)[0]
    if (largest) largest.carbs += shortfall
  }

  return slots
}

// ─── IB / MI40 (Ben Pakulski) ───
// No carbs breakfast. High fat AM. Carbs backloaded peri-workout. Fat + carbs never together.
function ibMi40Slots(P: number, C: number, F: number, isReset: boolean, isTD: boolean): MealSlot[] {
  const p6 = Math.round(P / 6)

  if (isReset && isTD) {
    return [
      { name: 'Meal 1 — High Fat + Protein', time: '7:00 AM', protein: p6, carbs: 0, fats: Math.round(F * 0.35), proteinSources: ['protein'], carbSources: [], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Meal 2 — Protein + Fats', time: '10:00 AM', protein: p6, carbs: 0, fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: [], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Pre-Workout', time: '12:30 PM', protein: p6, carbs: 0, fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: [], fatSources: ['nuts-fats'], addVeg: false },
      { name: 'Intra/Post Shake', time: '2:00 PM', protein: p6, carbs: Math.round(C * 0.65), fats: 0, proteinSources: ['dairy'], carbSources: ['supplements', 'grains'], fatSources: [], addVeg: false },
      { name: 'Post-Workout Meal', time: '3:30 PM', protein: p6, carbs: Math.round(C * 0.30), fats: Math.round(F * 0.05), proteinSources: ['protein'], carbSources: ['grains'], fatSources: [], addVeg: true },
      { name: 'Last Meal', time: '7:00 PM', protein: p6, carbs: Math.round(C * 0.05), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    ]
  }
  if (isReset && !isTD) {
    const halfC = Math.round(C / 2)
    return [
      { name: 'Meal 1 — High Fat + Protein', time: '7:00 AM', protein: Math.round(P / 5), carbs: 0, fats: Math.round(F * 0.30), proteinSources: ['protein'], carbSources: [], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Meal 2', time: '10:00 AM', protein: Math.round(P / 5), carbs: 0, fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: [], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Meal 3', time: '1:00 PM', protein: Math.round(P / 5), carbs: halfC, fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Meal 4', time: '4:00 PM', protein: Math.round(P / 5), carbs: 0, fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: [], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Last Meal', time: '7:00 PM', protein: Math.round(P / 5), carbs: halfC, fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains', 'fruits'], fatSources: ['nuts-fats'], addVeg: true },
    ]
  }
  if (isTD) {
    return [
      { name: 'Meal 1 — High Fat Breakfast', time: '7:00 AM', protein: p6, carbs: 0, fats: Math.round(F * 0.40), proteinSources: ['protein'], carbSources: [], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Meal 2', time: '10:00 AM', protein: p6, carbs: Math.round(C * 0.12), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Pre-Workout', time: '12:30 PM', protein: p6, carbs: Math.round(C * 0.12), fats: Math.round(F * 0.05), proteinSources: ['protein'], carbSources: ['grains', 'fruits'], fatSources: [], addVeg: false },
      { name: 'Intra/Post Shake', time: '2:00 PM', protein: p6, carbs: Math.round(C * 0.30), fats: 0, proteinSources: ['dairy'], carbSources: ['supplements', 'grains'], fatSources: [], addVeg: false },
      { name: 'Post-Workout Meal', time: '3:30 PM', protein: p6, carbs: Math.round(C * 0.28), fats: 0, proteinSources: ['protein'], carbSources: ['grains'], fatSources: [], addVeg: true },
      { name: 'Last Meal', time: '7:00 PM', protein: p6, carbs: Math.round(C * 0.18), fats: Math.round(F * 0.40), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    ]
  }
  // Non-training bulk
  const p5 = Math.round(P / 5)
  return [
    { name: 'Meal 1 — High Fat Breakfast', time: '7:00 AM', protein: p5, carbs: 0, fats: Math.round(F * 0.35), proteinSources: ['protein'], carbSources: [], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Meal 2', time: '10:00 AM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Meal 3', time: '1:00 PM', protein: p5, carbs: Math.round(C * 0.30), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Meal 4', time: '4:00 PM', protein: p5, carbs: Math.round(C * 0.25), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains', 'fruits'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Last Meal', time: '7:00 PM', protein: p5, carbs: Math.round(C * 0.25), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
  ]
}

// ─── Norton / PHAT (Layne Norton) ───
// <5% carbs at breakfast. 20-30% pre-training. 30-40% post. Remainder spread. Leucine threshold each meal.
function nortonSlots(P: number, C: number, F: number, isTD: boolean): MealSlot[] {
  const p5 = Math.round(P / 5)
  if (isTD) {
    return [
      { name: 'Meal 1 — Low Carb', time: '7:00 AM', protein: p5, carbs: Math.round(C * 0.05), fats: Math.round(F * 0.30), proteinSources: ['protein'], carbSources: ['fruits'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Pre-Workout', time: '11:00 AM', protein: p5, carbs: Math.round(C * 0.25), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Post-Workout Shake', time: '1:30 PM', protein: p5, carbs: Math.round(C * 0.35), fats: 0, proteinSources: ['dairy'], carbSources: ['supplements', 'grains'], fatSources: [], addVeg: false },
      { name: 'Post-Workout Meal', time: '3:00 PM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains'], fatSources: [], addVeg: true },
      { name: 'Last Meal', time: '7:00 PM', protein: p5, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.40), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    ]
  }
  return [
    { name: 'Meal 1', time: '7:00 AM', protein: p5, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.30), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Meal 2', time: '10:30 AM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Meal 3', time: '1:30 PM', protein: p5, carbs: Math.round(C * 0.25), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Meal 4', time: '4:30 PM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains', 'fruits'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Last Meal', time: '7:00 PM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
  ]
}

// ─── Bompa (Tudor Bompa) ───
// HIGH carb breakfast. High GI around workouts. Medium GI through day. Low GI evening. Energy system matching.
function bompaSlots(P: number, C: number, F: number, phaseL: string, isTD: boolean): MealSlot[] {
  const p5 = Math.round(P / 5)
  const isMaxStr = phaseL.includes('maximum') || phaseL.includes('strength')
  const isConversion = phaseL.includes('conversion') || phaseL.includes('power')

  // Max Strength: slightly reduced carbs, focus on ATP-CP (creatine) system
  if (isMaxStr) {
    if (isTD) {
      return [
        { name: 'Meal 1 — Carb Breakfast', time: '7:00 AM', protein: p5, carbs: Math.round(C * 0.25), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: false },
        { name: 'Pre-Workout', time: '11:00 AM', protein: p5, carbs: Math.round(C * 0.25), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
        { name: 'Post-Workout (High GI)', time: '2:00 PM', protein: p5, carbs: Math.round(C * 0.30), fats: Math.round(F * 0.10), proteinSources: ['protein', 'dairy'], carbSources: ['grains', 'fruits'], fatSources: [], addVeg: true },
        { name: 'Meal 4 — Medium GI', time: '5:00 PM', protein: p5, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
        { name: 'Last Meal — Low GI', time: '7:30 PM', protein: p5, carbs: Math.round(C * 0.05), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['vegetables'], fatSources: ['nuts-fats'], addVeg: true },
      ]
    }
    return bompaRestDay(P, C, F)
  }

  // Conversion/Endurance: MASSIVE carb loading (60-70% of cals from carbs)
  if (isConversion && isTD) {
    return [
      { name: 'Meal 1 — High Carb Breakfast', time: '7:00 AM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: false },
      { name: 'Pre-Workout (High GI)', time: '10:30 AM', protein: p5, carbs: Math.round(C * 0.25), fats: Math.round(F * 0.10), proteinSources: ['protein'], carbSources: ['grains', 'fruits'], fatSources: [], addVeg: false },
      { name: 'Post-Workout (High GI)', time: '1:30 PM', protein: p5, carbs: Math.round(C * 0.30), fats: Math.round(F * 0.10), proteinSources: ['protein', 'dairy'], carbSources: ['grains', 'supplements'], fatSources: [], addVeg: true },
      { name: 'Meal 4 — Medium GI', time: '4:30 PM', protein: p5, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Last Meal — Low GI', time: '7:00 PM', protein: p5, carbs: Math.round(C * 0.10), fats: Math.round(F * 0.35), proteinSources: ['protein'], carbSources: ['vegetables', 'grains'], fatSources: ['nuts-fats'], addVeg: true },
    ]
  }

  // Default Bompa (AA / Hypertrophy): high carb breakfast, GI taper through day
  if (isTD) {
    return [
      { name: 'Meal 1 — High Carb Breakfast', time: '7:00 AM', protein: p5, carbs: Math.round(C * 0.25), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: false },
      { name: 'Pre-Workout', time: '11:00 AM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains', 'fruits'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Post-Workout (High GI)', time: '2:00 PM', protein: p5, carbs: Math.round(C * 0.30), fats: Math.round(F * 0.10), proteinSources: ['protein', 'dairy'], carbSources: ['grains', 'supplements'], fatSources: [], addVeg: true },
      { name: 'Meal 4 — Medium GI', time: '5:00 PM', protein: p5, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Last Meal — Low GI', time: '7:30 PM', protein: p5, carbs: Math.round(C * 0.10), fats: Math.round(F * 0.30), proteinSources: ['protein'], carbSources: ['vegetables'], fatSources: ['nuts-fats'], addVeg: true },
    ]
  }
  return bompaRestDay(P, C, F)
}

function bompaRestDay(P: number, C: number, F: number): MealSlot[] {
  const p4 = Math.round(P / 4)
  return [
    { name: 'Meal 1 — Balanced Breakfast', time: '8:00 AM', protein: p4, carbs: Math.round(C * 0.30), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: false },
    { name: 'Meal 2', time: '12:00 PM', protein: p4, carbs: Math.round(C * 0.30), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Meal 3', time: '4:00 PM', protein: p4, carbs: Math.round(C * 0.25), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains', 'fruits'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Last Meal', time: '7:30 PM', protein: p4, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['vegetables'], fatSources: ['nuts-fats'], addVeg: true },
  ]
}

// ─── DTP (Kris Gethin) ───
// 6-7 meals, 2.5-3 hours apart. Complex low-GI carbs steady ALL DAY. Fast carbs ONLY post-DTP. Clean, even distribution.
function dtpSlots(P: number, C: number, F: number, isTD: boolean): MealSlot[] {
  const p6 = Math.round(P / 6)
  if (isTD) {
    return [
      { name: 'Meal 1 — Oats + Protein', time: '6:30 AM', protein: p6, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: false },
      { name: 'Meal 2', time: '9:00 AM', protein: p6, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Pre-Workout', time: '11:30 AM', protein: p6, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Post-DTP (Fast Carbs)', time: '2:00 PM', protein: p6, carbs: Math.round(C * 0.25), fats: Math.round(F * 0.05), proteinSources: ['dairy'], carbSources: ['supplements', 'fruits'], fatSources: [], addVeg: false },
      { name: 'Meal 5', time: '4:30 PM', protein: p6, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Meal 6', time: '7:00 PM', protein: p6, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    ]
  }
  const p5 = Math.round(P / 5)
  return [
    { name: 'Meal 1', time: '7:00 AM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: false },
    { name: 'Meal 2', time: '10:00 AM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Meal 3', time: '1:00 PM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Meal 4', time: '4:00 PM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains', 'fruits'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Meal 5', time: '7:00 PM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
  ]
}

// ─── Y3T (Neil Hill) ───
// Week 1: moderate carbs, higher fats for joint/CNS. Week 2: carbs up slightly. Week 3: HIGH carbs everywhere.
function y3tSlots(P: number, C: number, F: number, phaseL: string, isTD: boolean): MealSlot[] {
  const p5 = Math.round(P / 5)
  const isWeek3 = phaseL.includes('annihilation') || phaseL.includes('week 3')
  const isWeek1 = phaseL.includes('heavy') || phaseL.includes('week 1')

  // Week 3: HIGH carbs at every meal — glycogen repletion from giant sets + 50-100 rep sets
  if (isWeek3 && isTD) {
    return [
      { name: 'Meal 1 — High Carb', time: '7:00 AM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: false },
      { name: 'Pre-Workout', time: '10:30 AM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.10), proteinSources: ['protein'], carbSources: ['grains', 'fruits'], fatSources: [], addVeg: true },
      { name: 'Post-Workout (Fast Carbs)', time: '1:30 PM', protein: p5, carbs: Math.round(C * 0.30), fats: Math.round(F * 0.10), proteinSources: ['dairy', 'protein'], carbSources: ['supplements', 'grains'], fatSources: [], addVeg: true },
      { name: 'Meal 4', time: '4:30 PM', protein: p5, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.30), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Last Meal', time: '7:00 PM', protein: p5, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.35), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    ]
  }

  // Week 1: moderate carbs, HIGHER healthy fats for joints and CNS under heavy loading
  if (isWeek1 && isTD) {
    return [
      { name: 'Meal 1 — Moderate Carb + Fats', time: '7:00 AM', protein: p5, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.30), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: false },
      { name: 'Pre-Workout', time: '11:00 AM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Post-Workout', time: '2:00 PM', protein: p5, carbs: Math.round(C * 0.30), fats: Math.round(F * 0.10), proteinSources: ['protein', 'dairy'], carbSources: ['grains'], fatSources: [], addVeg: true },
      { name: 'Meal 4', time: '5:00 PM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Last Meal', time: '7:30 PM', protein: p5, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    ]
  }

  // Week 2 / default / rest days: balanced
  return nortonSlots(P, C, F, isTD)
}

// ─── FST-7 (Hany Rambod) ───
// Pre-WO: high sodium + lean protein + complex carb 90-120min before. Consistently HIGH carbs. Fast carbs post within 30min.
function fst7Slots(P: number, C: number, F: number, isTD: boolean): MealSlot[] {
  const p5 = Math.round(P / 5)
  if (isTD) {
    return [
      { name: 'Meal 1', time: '7:00 AM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Pre-WO (High Sodium)', time: '10:30 AM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Post-FST7 (Fast Carbs)', time: '1:30 PM', protein: p5, carbs: Math.round(C * 0.30), fats: Math.round(F * 0.05), proteinSources: ['dairy'], carbSources: ['supplements', 'grains'], fatSources: [], addVeg: false },
      { name: 'Post-WO Meal', time: '3:00 PM', protein: p5, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Last Meal', time: '7:00 PM', protein: p5, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.35), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    ]
  }
  return nortonSlots(P, C, F, false)
}

// ─── HIT / Blood & Guts (Dorian Yates) ───
// 5-6 LARGE meals. Heavy surplus. Post-WO: high GI carb drink immediately, steak meal 1hr later. Simple heavy foods.
function hitSlots(P: number, C: number, F: number, isTD: boolean): MealSlot[] {
  const p5 = Math.round(P / 5)
  if (isTD) {
    return [
      { name: 'Meal 1 — Large Breakfast', time: '7:00 AM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: false },
      { name: 'Meal 2 — Large Pre-WO', time: '11:00 AM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Post-WO Shake (High GI)', time: '2:00 PM', protein: p5, carbs: Math.round(C * 0.25), fats: 0, proteinSources: ['dairy'], carbSources: ['supplements', 'grains'], fatSources: [], addVeg: false },
      { name: 'Post-WO Steak Meal', time: '3:00 PM', protein: p5, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
      { name: 'Last Meal — Large', time: '7:00 PM', protein: p5, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.30), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    ]
  }
  // HIT rest day: still large meals, 5-6, heavy foods
  return [
    { name: 'Meal 1', time: '8:00 AM', protein: Math.round(P / 4), carbs: Math.round(C * 0.25), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: false },
    { name: 'Meal 2', time: '12:00 PM', protein: Math.round(P / 4), carbs: Math.round(C * 0.25), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Meal 3', time: '4:00 PM', protein: Math.round(P / 4), carbs: Math.round(C * 0.25), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Meal 4', time: '7:30 PM', protein: Math.round(P / 4), carbs: Math.round(C * 0.25), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
  ]
}

// ─── Corey Gregory (Squat Every Day) ───
// G-Flux: massive intake (3500-4500 cal), high frequency training burns it off. Variable carbs, high everything.
function coreyGSlots(P: number, C: number, F: number, isTD: boolean): MealSlot[] {
  // Always training day (7 days/week), huge volume needs fuelling
  const p6 = Math.round(P / 6)
  return [
    { name: 'Meal 1 — Big Breakfast', time: '6:30 AM', protein: p6, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.25), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: false },
    { name: 'Post-Squat', time: '9:00 AM', protein: p6, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.10), proteinSources: ['dairy', 'protein'], carbSources: ['grains', 'supplements'], fatSources: [], addVeg: false },
    { name: 'Meal 3', time: '12:00 PM', protein: p6, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Pre-Giant Sets', time: '3:00 PM', protein: p6, carbs: Math.round(C * 0.15), fats: Math.round(F * 0.15), proteinSources: ['protein'], carbSources: ['grains', 'fruits'], fatSources: ['nuts-fats'], addVeg: true },
    { name: 'Post-WO', time: '5:30 PM', protein: p6, carbs: Math.round(C * 0.20), fats: Math.round(F * 0.10), proteinSources: ['protein', 'dairy'], carbSources: ['grains', 'supplements'], fatSources: [], addVeg: true },
    { name: 'Last Meal', time: '8:00 PM', protein: p6, carbs: Math.round(C * 0.10), fats: Math.round(F * 0.20), proteinSources: ['protein'], carbSources: ['grains'], fatSources: ['nuts-fats'], addVeg: true },
  ]
}

// ─── Find a food by ID ───

function foodById(id: string): FoodItem | undefined {
  return FOOD_DATABASE.find(f => f.id === id)
}

// ─── Pick a food from an archetype's list, preferring unused ───

function pickFromArchetype(ids: string[], usedIds: Set<string>): FoodItem | null {
  const unused = ids.map(id => foodById(id)).filter((f): f is FoodItem => f !== undefined && !usedIds.has(f.id))
  if (unused.length > 0) return pickRandom(unused)
  const all = ids.map(id => foodById(id)).filter((f): f is FoodItem => f !== undefined)
  if (all.length > 0) return pickRandom(all)
  return null
}

// ─── Build one meal using archetype pairings with cross-macro accounting ───

function buildMeal(slot: MealSlot, usedIds: Set<string>): Meal {
  const foods: MealFood[] = []

  // Running tallies — subtract each food's FULL contribution from remaining targets
  let remainP = slot.protein
  let remainC = slot.carbs
  let remainF = slot.fats

  // Pick an archetype that matches this slot
  const archetypes = getArchetypesForSlot(slot.name, slot.carbs > 5, slot.fats > 5)
  const archetype = archetypes.length > 0 ? pickRandom(archetypes) : null

  // Helper: pick food and add, updating running tallies
  const addFood = (food: FoodItem, targetGrams: number, primaryMacro: 'protein' | 'carbs' | 'fats') => {
    let portion = portionForMacro(food, Math.max(targetGrams, 0), primaryMacro)
    // Cap portions at practical meal sizes
    if (food.servingUnit === 'g') {
      if (primaryMacro === 'protein') portion = Math.min(portion, 250)
      else if (primaryMacro === 'carbs') portion = Math.min(portion, 200) // ~200g dry = ~600g cooked
      else portion = Math.min(portion, 100) // fats are calorie dense
    }
    if (portion <= 0) return

    const mf = buildMealFood(food, portion)
    foods.push(mf)
    usedIds.add(food.id)

    // Subtract ALL macro contributions from remaining targets
    remainP -= mf.macros.protein
    remainC -= mf.macros.carbs
    remainF -= mf.macros.fats
  }

  const pickFood = (pool: string[], fallbackCats: string[], minMacro: string, minVal: number): FoodItem | null => {
    let food = pool.length > 0 ? pickFromArchetype(pool, usedIds) : null
    if (!food) {
      const fb = foodsByCategory(...fallbackCats).filter(f => !usedIds.has(f.id) && f[minMacro as keyof Pick<FoodItem, 'protein' | 'carbs' | 'fats'>] > minVal)
      food = fb.length > 0 ? pickRandom(fb) : null
    }
    return food
  }

  // 1. Protein source — portion to hit protein target
  if (slot.protein > 3) {
    const food = pickFood(archetype?.proteinIds ?? [], slot.proteinSources, 'protein', 3)
    if (food) addFood(food, remainP, 'protein')
  }

  // 2. Carb source — portion to hit REMAINING carb target (after protein's carb contribution)
  if (slot.carbs > 5 && remainC > 5) {
    const food = pickFood(archetype?.carbIds ?? [], slot.carbSources, 'carbs', 5)
    if (food) addFood(food, remainC, 'carbs')
  }

  // 3. Fat source — portion to hit REMAINING fat target (after protein & carb foods' fat contribution)
  if (slot.fats > 3 && remainF > 3) {
    const food = pickFood(archetype?.fatIds ?? [], slot.fatSources, 'fats', 3)
    if (food) addFood(food, remainF, 'fats')
  }

  // 4. Veg for fibre + volume
  if (slot.addVeg) {
    const pool = archetype?.vegIds ?? []
    let veg = pool.length > 0 ? pickFromArchetype(pool, usedIds) : null
    if (!veg) {
      const fb = foodsByCategory('vegetables').filter(f => !usedIds.has(f.id))
      veg = fb.length > 0 ? pickRandom(fb) : null
    }
    if (veg) foods.push(buildMealFood(veg, 150))
  }

  // 5. Post-build check: if protein is over target, trim the protein source
  //    Use the ORIGINAL target (slot.protein + secondary estimate) not the reduced P
  const mealTotals = sumMacros(foods)
  const originalMealProteinTarget = slot.protein + Math.round(estimateSecondaryProtein(slot.carbs, slot.fats))
  if (mealTotals.protein > originalMealProteinTarget + 3 && foods.length > 0) {
    const proteinFoodIdx = foods.findIndex(f => {
      const db = FOOD_DATABASE.find(d => d.id === f.foodId)
      return db && db.protein > 10 && !isFixedUnit(db)
    })
    if (proteinFoodIdx >= 0) {
      const pf = foods[proteinFoodIdx]
      const db = FOOD_DATABASE.find(d => d.id === pf.foodId)!
      const excess = mealTotals.protein - originalMealProteinTarget
      const pPerG = db.protein / db.servingSize
      const reduction = excess / pPerG
      const newPortion = roundServing(pf.servingSize - reduction, db.servingUnit)
      if (newPortion >= 20) {
        foods[proteinFoodIdx] = buildMealFood(db, newPortion)
      }
    }
  }

  return {
    id: crypto.randomUUID(),
    name: slot.name,
    time: slot.time,
    foods,
    totals: sumMacros(foods),
  }
}

// ─── Macro totals across all meals ───

function planTotals(meals: Meal[]): MacroTargets {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.totals.calories,
      protein: acc.protein + m.totals.protein,
      carbs: acc.carbs + m.totals.carbs,
      fats: acc.fats + m.totals.fats,
      fiber: acc.fiber + m.totals.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
  )
}

function macrosOnTarget(totals: MacroTargets, targets: MacroTargets): boolean {
  return Math.abs(totals.protein - targets.protein) <= MACRO_TOLERANCE
    && Math.abs(totals.carbs - targets.carbs) <= MACRO_TOLERANCE
    && Math.abs(totals.fats - targets.fats) <= MACRO_TOLERANCE
    && Math.abs(totals.calories - targets.calories) <= CALORIE_TOLERANCE
}

// ─── Find the best food in a meal to adjust for a given macro ───

function findAdjustableFood(
  meals: Meal[],
  macro: 'protein' | 'carbs' | 'fats',
  direction: 'increase' | 'decrease'
): { mealIdx: number; foodIdx: number; db: FoodItem } | null {
  let best: { mealIdx: number; foodIdx: number; db: FoodItem; density: number } | null = null

  for (let mi = 0; mi < meals.length; mi++) {
    for (let fi = 0; fi < meals[mi].foods.length; fi++) {
      const mf = meals[mi].foods[fi]
      const db = FOOD_DATABASE.find(f => f.id === mf.foodId)
      if (!db || isFixedUnit(db)) continue

      const macroPerServing = db[macro] / db.servingSize
      if (macroPerServing <= 0) continue

      // Prefer foods where this macro is dominant (least collateral impact)
      const totalMacroPerG = (db.protein + db.carbs + db.fats) / db.servingSize
      const density = macroPerServing / (totalMacroPerG || 1)

      if (direction === 'decrease' && mf.servingSize <= 15) continue

      if (!best || density > best.density) {
        best = { mealIdx: mi, foodIdx: fi, db, density }
      }
    }
  }

  return best
}

// ─── Adjust a single food's portion to close a macro gap ───

function adjustFoodForMacro(
  meals: Meal[],
  macro: 'protein' | 'carbs' | 'fats',
  diff: number
): boolean {
  const direction = diff > 0 ? 'increase' : 'decrease'
  const target = findAdjustableFood(meals, macro, direction)
  if (!target) return false

  const { mealIdx, foodIdx, db } = target
  const mf = meals[mealIdx].foods[foodIdx]
  const macroPerG = db[macro] / db.servingSize
  if (macroPerG <= 0) return false

  const gramsToAdjust = diff / macroPerG
  const newPortion = roundServing(mf.servingSize + gramsToAdjust, db.servingUnit)

  if (newPortion < 10 || newPortion > mf.servingSize * 4) return false

  meals[mealIdx].foods[foodIdx] = buildMealFood(db, newPortion)
  meals[mealIdx].totals = sumMacros(meals[mealIdx].foods)
  return true
}

// ─── Multi-macro constraint solver ───
// Priority: protein → carbs → fats → calories
// Each pass adjusts the most off-target macro, then rechecks

function solveToTarget(meals: Meal[], targets: MacroTargets): Meal[] {
  for (let pass = 0; pass < MAX_SOLVER_PASSES; pass++) {
    const totals = planTotals(meals)
    if (macrosOnTarget(totals, targets)) break

    const pDiff = targets.protein - totals.protein
    const cDiff = targets.carbs - totals.carbs
    const fDiff = targets.fats - totals.fats

    // Protein overshoot is the most common problem — prioritise it
    // Sort by: protein first if over, then by absolute deviation
    const allOffenders = [
      { macro: 'protein' as const, diff: pDiff, abs: Math.abs(pDiff) },
      { macro: 'carbs' as const, diff: cDiff, abs: Math.abs(cDiff) },
      { macro: 'fats' as const, diff: fDiff, abs: Math.abs(fDiff) },
    ]
    const offenders = allOffenders.filter(o => o.abs > MACRO_TOLERANCE)

    // Protein over target gets top priority (most common cross-contamination issue)
    offenders.sort((a, b) => {
      if (a.macro === 'protein' && a.diff < 0) return -1
      if (b.macro === 'protein' && b.diff < 0) return 1
      return b.abs - a.abs
    })

    if (offenders.length === 0) break

    let adjusted = false
    for (const offender of offenders) {
      if (adjustFoodForMacro(meals, offender.macro, offender.diff)) {
        adjusted = true
        break
      }
    }

    if (!adjusted) break
  }

  // Final calorie check — if macros are on target but calories drifted, fine-tune via carbs
  const finalTotals = planTotals(meals)
  const calDiff = targets.calories - finalTotals.calories
  if (Math.abs(calDiff) > CALORIE_TOLERANCE) {
    const carbAdjust = calDiff / 4
    if (Math.abs(carbAdjust) > 1) {
      adjustFoodForMacro(meals, 'carbs', carbAdjust)
    }
  }

  // Fibre check — if fibre target exists and we're well under, boost vegetable portions
  if (targets.fiber > 0) {
    const fibreTotal = planTotals(meals).fiber
    if (fibreTotal < targets.fiber * 0.5) {
      for (const meal of meals) {
        for (let i = 0; i < meal.foods.length; i++) {
          const db = FOOD_DATABASE.find(f => f.id === meal.foods[i].foodId)
          if (!db || db.fiber <= 0 || isFixedUnit(db)) continue
          // Bump veg portions up by 50g to add fibre
          const newPortion = roundServing(meal.foods[i].servingSize + 50, db.servingUnit)
          meal.foods[i] = buildMealFood(db, newPortion)
          meal.totals = sumMacros(meal.foods)
          if (planTotals(meals).fiber >= targets.fiber * 0.7) break
        }
        if (planTotals(meals).fiber >= targets.fiber * 0.7) break
      }
    }
  }

  return meals
}

function isFixedUnit(food: FoodItem): boolean {
  return ['egg', 'rasher', 'weetabix', 'bar', 'muffin', 'bagel', 'crumpet', 'rice cake', 'corn cake'].includes(food.servingUnit)
}

// ─── Main: generate a single day's meal plan ───

export function generateMealPlan(
  targets: MacroTargets,
  goal: 'bulk' | 'cut' | 'maintain' | 'contest-prep',
  philosophy: TrainingPhilosophy = 'incredible-bulk',
  phase: string = '',
  isTrainingDay: boolean = true
): MealPlan {
  const slots = getMealSlots(philosophy, phase || goal, isTrainingDay, targets)

  // Try up to 5 attempts with different random food picks
  let bestPlan: { meals: Meal[]; totals: MacroTargets } | null = null
  let bestScore = Infinity

  for (let attempt = 0; attempt < 5; attempt++) {
    const usedIds = new Set<string>()
    let meals = slots.map(s => buildMeal(s, usedIds))
    meals = solveToTarget(meals, targets)

    const totals = planTotals(meals)
    const score = Math.abs(totals.protein - targets.protein)
      + Math.abs(totals.carbs - targets.carbs)
      + Math.abs(totals.fats - targets.fats)

    if (macrosOnTarget(totals, targets)) {
      bestPlan = { meals, totals }
      break
    }

    if (score < bestScore) {
      bestScore = score
      bestPlan = { meals, totals }
    }
  }

  const meals = bestPlan!.meals

  // ─── Task 5: final calorie correction pass — aim for < ±50 kcal variance ───
  const correctedTotals = planTotals(meals)
  const calGap = targets.calories - correctedTotals.calories
  if (Math.abs(calGap) > 50) {
    // Find the meal with the most calories — easiest to absorb a small change
    let largestMealIdx = 0
    let largestCals = 0
    for (let i = 0; i < meals.length; i++) {
      if (meals[i].totals.calories > largestCals) {
        largestCals = meals[i].totals.calories
        largestMealIdx = i
      }
    }
    const meal = meals[largestMealIdx]
    // Find an adjustable protein source (gram-based, high protein, not a fixed unit)
    const proteinFoodIdx = meal.foods.findIndex(f => {
      const db = FOOD_DATABASE.find(d => d.id === f.foodId)
      return db && db.protein > 10 && !isFixedUnit(db) && db.servingUnit === 'g'
    })
    if (proteinFoodIdx >= 0) {
      const pf = meal.foods[proteinFoodIdx]
      const db = FOOD_DATABASE.find(d => d.id === pf.foodId)!
      // Cap adjustment at ±100 kcal per pass; protein ~4 kcal/g
      const cappedGap = Math.sign(calGap) * Math.min(Math.abs(calGap), 100)
      const gramsToAdd = cappedGap / 4
      const newPortion = roundServing(pf.servingSize + gramsToAdd, db.servingUnit)
      if (newPortion >= 20 && newPortion <= 400) {
        meal.foods[proteinFoodIdx] = buildMealFood(db, newPortion)
        meal.totals = sumMacros(meal.foods)
      }
    }
  }

  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString().split('T')[0],
    meals,
    totals: planTotals(meals),
    targets,
  }
}

// ─── Generate a full 7-day plan ───

export function generateWeeklyMealPlan(
  targets: MacroTargets,
  goal: 'bulk' | 'cut' | 'maintain' | 'contest-prep',
  philosophy: TrainingPhilosophy,
  phase: string,
  trainingDays: boolean[] // [mon, tue, wed, thu, fri, sat, sun]
): MealPlan[] {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const today = new Date()

  return trainingDays.map((isTD, i) => {
    const date = new Date(today)
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    date.setDate(today.getDate() + mondayOffset + i)

    const plan = generateMealPlan(targets, goal, philosophy, phase, isTD)
    return {
      ...plan,
      id: crypto.randomUUID(),
      date: date.toISOString().split('T')[0],
    }
  })
}

// ─── Swap a food, recalculate portion to maintain the macro it was serving ───

export function swapFood(
  mealPlan: MealPlan,
  mealId: string,
  foodIndex: number,
  newFoodId: string
): MealPlan {
  const newDb = FOOD_DATABASE.find(f => f.id === newFoodId)
  if (!newDb) return mealPlan

  const updatedMeals = mealPlan.meals.map(meal => {
    if (meal.id !== mealId) return meal
    const oldFood = meal.foods[foodIndex]
    if (!oldFood) return meal

    // Identify the primary macro role this food was filling
    const om = oldFood.macros
    let primary: 'protein' | 'carbs' | 'fats' = 'protein'
    if (om.carbs > om.protein && om.carbs > om.fats) primary = 'carbs'
    else if (om.fats > om.protein) primary = 'fats'

    // Solve for portion that matches the old food's primary macro
    let portion = portionForMacro(newDb, om[primary], primary)

    // Fallback: match calories
    if (portion <= 0 && newDb.calories > 0) {
      const cpu = newDb.calories / newDb.servingSize
      portion = roundServing(om.calories / cpu, newDb.servingUnit)
    }
    if (portion <= 0) portion = newDb.servingSize

    const newFoods = [...meal.foods]
    newFoods[foodIndex] = buildMealFood(newDb, portion)

    return { ...meal, foods: newFoods, totals: sumMacros(newFoods) }
  })

  // Re-run solver to hit ±5g on all macros after the swap
  const solved = solveToTarget(updatedMeals, mealPlan.targets)

  return {
    ...mealPlan,
    meals: solved,
    totals: planTotals(solved),
  }
}

// ─── Swap candidates: same category first, sorted by macro similarity ───

export function getSwapCandidates(currentFood: MealFood): FoodItem[] {
  const db = FOOD_DATABASE.find(f => f.id === currentFood.foodId)
  if (!db) return FOOD_DATABASE

  const sameCategory = FOOD_DATABASE.filter(f => f.id !== currentFood.foodId && f.category === db.category)
  const otherCategory = FOOD_DATABASE.filter(f => f.id !== currentFood.foodId && f.category !== db.category)

  const sortBySimilarity = (a: FoodItem, b: FoodItem) => {
    const aDiff = Math.abs(a.protein - db.protein) + Math.abs(a.carbs - db.carbs) + Math.abs(a.fats - db.fats)
    const bDiff = Math.abs(b.protein - db.protein) + Math.abs(b.carbs - db.carbs) + Math.abs(b.fats - db.fats)
    return aDiff - bDiff
  }

  return [...sameCategory.sort(sortBySimilarity), ...otherCategory.sort(sortBySimilarity)]
}

// ─── Manually adjust a single food's portion ───

// ─── Rebalance: re-run solver after a food is removed to redistribute portions ───

export function rebalancePlan(mealPlan: MealPlan): MealPlan {
  const solved = solveToTarget([...mealPlan.meals], mealPlan.targets)
  return {
    ...mealPlan,
    meals: solved,
    totals: planTotals(solved),
  }
}

export function adjustPortion(
  mealPlan: MealPlan,
  mealId: string,
  foodIndex: number,
  newPortion: number
): MealPlan {
  const updatedMeals = mealPlan.meals.map(meal => {
    if (meal.id !== mealId) return meal
    const food = meal.foods[foodIndex]
    if (!food) return meal

    const db = FOOD_DATABASE.find(f => f.id === food.foodId)
    if (!db) return meal

    const newFoods = [...meal.foods]
    newFoods[foodIndex] = buildMealFood(db, roundServing(newPortion, db.servingUnit))

    return { ...meal, foods: newFoods, totals: sumMacros(newFoods) }
  })

  const solved = solveToTarget(updatedMeals, mealPlan.targets)

  return {
    ...mealPlan,
    meals: solved,
    totals: planTotals(solved),
  }
}
