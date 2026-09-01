'use client'

import { useEffect, useState } from 'react'
import type { MacroTargets, MealPlan, Meal, MealFood, FoodItem, UserProfile, CarbCycleDay } from '@/lib/types'
import { getProfile, saveProfile, getTodayMealPlan, saveMealPlan, getMealPlanByDate, getWeekDates, clearWeekMealPlans } from '@/lib/storage'
import { calculateMacros, recommendedSteps, generateCarbCycle, getCarbCyclePatterns, prescribeCarbCycle, prescribeTrainingDays, prescribeNutritionDayTypes, getDivisionTargetBodyFat, contestPrepTimeline, bmrMuller, calculateLBM, calculateFatMass, calculateTDEE, determineActivityFactor, proteinTarget, type CarbCyclePattern } from '@/lib/nutrition-engine'
import { generateMealPlan, swapFood, getSwapCandidates, adjustPortion, rebalancePlan } from '@/lib/meal-generator'
import { buildPeakWeekProtocol } from '@/lib/peak-week'
import { FOOD_DATABASE } from '@/lib/data/foods'
import ShoppingListView from './ShoppingList'
import BarcodeScanner, { type ScannedFood } from './BarcodeScanner'

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif',
  fontSize: 16,
  letterSpacing: '0.06em',
}

type NutritionMode = 'foundation' | 'build' | 'cut' | 'contest'

function getNutritionMode(phase: string, philosophy: string, goal: string): NutritionMode {
  if (philosophy === 'contest-prep' || goal === 'contest-prep') return 'contest'
  // Normalise: strip hyphens/spaces, lowercase → 'phase1', 'phase2', etc.
  const p = (phase ?? '').toLowerCase().replace(/[\s-]/g, '')
  if (p === 'phase1' || p === '1') return 'foundation'
  if (p === 'phase2' || p === '2') return 'build'
  if (p === 'contestprep') return 'contest'
  return 'cut' // Phase 3, 4, 5 default
}

function computeTDEE(profile: UserProfile): number {
  const lbm = calculateLBM(profile.weightKg, profile.bodyFatPercent)
  const fatMass = calculateFatMass(profile.weightKg, profile.bodyFatPercent)
  const bmr = bmrMuller(lbm, fatMass, profile.age, profile.sex)
  const actFactor = profile.occupation
    ? determineActivityFactor(profile.occupation, profile.trainingDaysPerWeek ?? 5, profile.dailyStepTarget ?? 8000)
    : profile.activityFactor
  return Math.round(calculateTDEE(bmr, actFactor))
}

function getPrepPhaseLabel(weeksOut: number): string {
  if (weeksOut > 10) return 'BUILDING THE BASE'
  if (weeksOut >= 8) return 'PROGRESSIVE DEFICIT'
  if (weeksOut >= 5) return 'PEAK CONDITIONING'
  if (weeksOut >= 2) return 'CARB DEPLETION'
  return 'PEAK WEEK'
}

function getNextMilestone(weeksOut: number): string {
  if (weeksOut > 10) return `${weeksOut - 10} weeks until progressive deficit phase`
  if (weeksOut >= 8) return `${weeksOut - 5} weeks until peak conditioning`
  if (weeksOut >= 5) return `${weeksOut - 2} weeks until carb depletion`
  if (weeksOut >= 2) return 'Peak week incoming — tighten everything'
  return 'Show day — execute the plan'
}

function MacroBar({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-[var(--muted)]">{label}</span>
        <span style={{ color }}>{Math.round(current)}g / {target}g</span>
      </div>
      <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function VarianceBadge({ actual, target }: { actual: number; target: number }) {
  const diff = actual - target
  const abs = Math.abs(diff)
  const ok = abs <= 50
  return (
    <span className={`text-[10px] font-bold ${ok ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
      {diff >= 0 ? '+' : ''}{diff} kcal
    </span>
  )
}

function FoodRow({ food, mealId, foodIndex, onSwap, onRemove, onPortionEdit }: {
  food: MealFood
  mealId: string
  foodIndex: number
  onSwap: (mealId: string, foodIndex: number) => void
  onRemove: (mealId: string, foodIndex: number) => void
  onPortionEdit: (mealId: string, foodIndex: number) => void
}) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-[var(--card-border)] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{food.name}</p>
        <p className="text-[9px] text-[var(--muted)]">
          <button onClick={() => onPortionEdit(mealId, foodIndex)} className="underline decoration-dotted">
            {food.servingSize}{food.servingUnit}
          </button>
          {' · '}{food.macros.protein}p · {food.macros.carbs}c · {food.macros.fats}f
        </p>
      </div>
      <div className="flex items-center gap-1.5 ml-2">
        <span className="text-[10px] text-[var(--muted)]">{food.macros.calories}</span>
        <button onClick={() => onSwap(mealId, foodIndex)} className="text-[var(--accent)] text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent-dim)]/20">
          Swap
        </button>
        <button onClick={() => onRemove(mealId, foodIndex)} className="text-[var(--danger)] text-xs">×</button>
      </div>
    </div>
  )
}

function MealCard({ meal, mealId, onSwap, onRemove, onPortionEdit, onAddFood }: {
  meal: Meal
  mealId: string
  onSwap: (mealId: string, foodIndex: number) => void
  onRemove: (mealId: string, foodIndex: number) => void
  onPortionEdit: (mealId: string, foodIndex: number) => void
  onAddFood: (mealId: string) => void
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] p-3" style={{ borderTop: '2px solid var(--accent)' }}>
      <div className="flex justify-between items-center mb-1.5">
        <div>
          <p className="font-bold uppercase" style={headingStyle}>{meal.name}</p>
          <p className="text-[10px] text-[var(--muted)]">{meal.time}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{meal.totals.calories} kcal</p>
            <p className="text-[9px] text-[var(--muted)]">{Math.round(meal.totals.protein)}p · {Math.round(meal.totals.carbs)}c · {Math.round(meal.totals.fats)}f</p>
          </div>
          <button
            onClick={() => onAddFood(mealId)}
            className="w-7 h-7 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-lg font-bold flex items-center justify-center shrink-0"
          >+</button>
        </div>
      </div>
      {meal.foods.length > 0 ? (
        <div>
          {meal.foods.map((food, idx) => (
            <FoodRow key={idx} food={food} mealId={mealId} foodIndex={idx} onSwap={onSwap} onRemove={onRemove} onPortionEdit={onPortionEdit} />
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-[var(--muted)]">No foods</p>
      )}
    </div>
  )
}

export default function NutritionTracker() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [targets, setTargets] = useState<MacroTargets | null>(null)
  const [swapModal, setSwapModal] = useState<{ mealId: string; foodIndex: number; candidates: FoodItem[] } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [addFoodMealId, setAddFoodMealId] = useState<string | null>(null)
  const [addFoodSearch, setAddFoodSearch] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [scannedFood, setScannedFood] = useState<ScannedFood | null>(null)
  const [scannedServing, setScannedServing] = useState('100')
  const [isTrainingDay, setIsTrainingDay] = useState(true)
  const [portionEdit, setPortionEdit] = useState<{ mealId: string; foodIndex: number; value: string } | null>(null)
  const [carbCyclePattern, setCarbCyclePattern] = useState<CarbCyclePattern>('none')
  const [peakWeekPdfLoading, setPeakWeekPdfLoading] = useState(false)
  const [weekCycle, setWeekCycle] = useState<CarbCycleDay[]>([])
  const [selectedDay, setSelectedDay] = useState(0)
  const [showCyclePanel, setShowCyclePanel] = useState(false)
  const [prescriptionReason, setPrescriptionReason] = useState('')
  const [trainingDayMap, setTrainingDayMap] = useState<boolean[]>([true, true, false, true, true, true, false])
  const [showShoppingList, setShowShoppingList] = useState(false)
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)
  const [showFoodShoppingList, setShowFoodShoppingList] = useState(false)
  const [reverseDietRate, setReverseDietRate] = useState<'conservative' | 'moderate'>('conservative')

  useEffect(() => {
    const p = getProfile()
    if (!p) return

    setProfile(p)
    const t = calculateMacros(p)
    setTargets(t)

    const dow = new Date().getDay()
    const todayIdx = dow === 0 ? 6 : dow - 1
    setSelectedDay(todayIdx)

    // Auto-prescribe carb cycling
    const tdMap = prescribeTrainingDays(p.trainingPhilosophy, p.currentPhase)
    const dayTypes = prescribeNutritionDayTypes(p.trainingPhilosophy, p.currentPhase)
    setTrainingDayMap(tdMap)
    setIsTrainingDay(tdMap[todayIdx])

    const prescription = prescribeCarbCycle(p.goal, p.trainingPhilosophy, p.currentPhase, p.bodyFatPercent, p.sex)
    setCarbCyclePattern(prescription.pattern)
    setPrescriptionReason(prescription.reason)

    const cycle = generateCarbCycle(t, prescription.pattern, tdMap, dayTypes)
    setWeekCycle(cycle)

    // Only generate week plans if none exist yet for this week
    const weekDates = getWeekDates(p.programStartDate)
    const hasAnyPlan = weekDates.some(d => getMealPlanByDate(d) !== undefined)
    if (!hasAnyPlan) {
      generateWeekPlans(cycle, tdMap, weekDates, p, t)
    }

    const todayPlan = getMealPlanByDate(weekDates[todayIdx])
    if (todayPlan) setMealPlan(todayPlan)
  }, [])

  const generateWeekPlans = (
    cycle: CarbCycleDay[],
    tdMap: boolean[],
    weekDates: string[],
    p: UserProfile,
    fallbackTargets: MacroTargets
  ) => {
    // Clear old plans for this week, then generate fresh
    clearWeekMealPlans()

    // Generate ONE plan per unique macro profile, clone to all matching days
    const macroKey = (m: MacroTargets) => `${m.calories}-${m.protein}-${m.carbs}-${m.fats}`
    const generated = new Map<string, MealPlan>()

    for (let i = 0; i < 7; i++) {
      const dateStr = weekDates[i]
      const dayMacros = cycle[i]?.macros ?? fallbackTargets
      const key = macroKey(dayMacros)

      if (generated.has(key)) {
        const source = generated.get(key)!
        const cloned: MealPlan = {
          id: crypto.randomUUID(),
          date: dateStr,
          meals: source.meals.map(m => ({ ...m, id: crypto.randomUUID(), foods: m.foods.map(f => ({ ...f, macros: { ...f.macros } })), totals: { ...m.totals } })),
          totals: { ...source.totals },
          targets: { ...source.targets },
        }
        saveMealPlan(cloned)
      } else {
        const plan = generateMealPlan(dayMacros, p.goal, p.trainingPhilosophy, p.currentPhase, tdMap[i])
        plan.date = dateStr
        saveMealPlan(plan)
        generated.set(key, plan)
      }
    }
  }

  const getDayMacros = (): MacroTargets => {
    if (weekCycle.length > 0 && weekCycle[selectedDay]) {
      return weekCycle[selectedDay].macros
    }
    return targets ?? { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
  }

  const handleRegenerate = () => {
    setShowRegenConfirm(true)
  }

  const handleRegenConfirm = () => {
    if (!profile || !targets) return
    setShowRegenConfirm(false)
    const weekDates = getWeekDates(profile.programStartDate)
    generateWeekPlans(weekCycle, trainingDayMap, weekDates, profile, targets)
    const todayPlan = getMealPlanByDate(weekDates[selectedDay])
    if (todayPlan) setMealPlan(todayPlan)
  }

  // ─── Diet break helpers ───
  const computeMaintenanceMacros = (p: UserProfile): MacroTargets => {
    const lbm = calculateLBM(p.weightKg, p.bodyFatPercent)
    const fatMass = calculateFatMass(p.weightKg, p.bodyFatPercent)
    const bmr = bmrMuller(lbm, fatMass, p.age, p.sex)
    const actFactor = p.occupation
      ? determineActivityFactor(p.occupation, p.trainingDaysPerWeek ?? 5, p.dailyStepTarget ?? 8000)
      : p.activityFactor
    const tdee = Math.round(calculateTDEE(bmr, actFactor))
    const prot = proteinTarget(lbm, p.age, false)
    const proteinCals = prot * 4
    const remainingCals = tdee - proteinCals
    const carbs = Math.max(Math.round((remainingCals * 0.6) / 4), 30)
    const fats = Math.max(Math.round((remainingCals * 0.4) / 9), 20)
    return {
      calories: prot * 4 + carbs * 4 + fats * 9,
      protein: prot,
      carbs,
      fats,
      fiber: Math.round((tdee / 1000) * 12),
    }
  }

  const handleStartDietBreak = () => {
    if (!profile) return
    const today = new Date().toISOString().split('T')[0]
    const updated: UserProfile = { ...profile, dietBreakActive: true, dietBreakStartDate: today }
    saveProfile(updated)
    setProfile(updated)
  }

  const handleEndDietBreak = () => {
    if (!profile) return
    const updated: UserProfile = { ...profile, dietBreakActive: false }
    saveProfile(updated)
    setProfile(updated)
  }

  // ─── Food shopping list ───
  const generateFoodShoppingList = (): { name: string; totalGrams: number; unit: string; servings: number }[] => {
    const weekDates = getWeekDates(profile?.programStartDate)
    const foodMap = new Map<string, { name: string; totalGrams: number; unit: string; servings: number }>()
    for (const date of weekDates) {
      const plan = getMealPlanByDate(date)
      if (!plan) continue
      for (const meal of plan.meals) {
        for (const food of meal.foods) {
          const key = food.name.toLowerCase().trim()
          if (foodMap.has(key)) {
            const ex = foodMap.get(key)!
            ex.totalGrams += food.servingSize
            ex.servings += 1
          } else {
            foodMap.set(key, { name: food.name, totalGrams: food.servingSize, unit: food.servingUnit, servings: 1 })
          }
        }
      }
    }
    return Array.from(foodMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  const handleToggleDayType = () => {
    const next = !isTrainingDay
    setIsTrainingDay(next)
    if (!profile) return
    const dayTargets = getDayMacros()
    const plan = generateMealPlan(dayTargets, profile.goal, profile.trainingPhilosophy, profile.currentPhase, next)
    plan.date = getWeekDates(profile.programStartDate)[selectedDay]
    saveMealPlan(plan)
    setMealPlan(plan)
  }

  const handleCycleChange = (pattern: CarbCyclePattern) => {
    if (!targets || !profile) return
    setCarbCyclePattern(pattern)
    const cycle = generateCarbCycle(targets, pattern, trainingDayMap)
    setWeekCycle(cycle)
    setPrescriptionReason('')

    // Regenerate entire week using shared plans for matching macros
    const weekDates = getWeekDates(profile.programStartDate)
    generateWeekPlans(cycle, trainingDayMap, weekDates, profile, targets)

    const todayPlan = getMealPlanByDate(weekDates[selectedDay])
    if (todayPlan) setMealPlan(todayPlan)
    setShowCyclePanel(false)
  }

  const handleDaySelect = (dayIdx: number) => {
    if (!profile) return
    setSelectedDay(dayIdx)
    setIsTrainingDay(trainingDayMap[dayIdx])

    // Check for an existing plan for this date before generating a new one
    const weekDates = getWeekDates(profile.programStartDate)
    const dateStr = weekDates[dayIdx]
    const existing = getMealPlanByDate(dateStr)

    if (existing) {
      setMealPlan(existing)
      return
    }

    // No plan for this date — check if another day with matching macros already has one
    const dayMacros = weekCycle.length > 0 ? weekCycle[dayIdx]?.macros : targets
    if (!dayMacros) return

    const macroKey = `${dayMacros.calories}-${dayMacros.protein}-${dayMacros.carbs}-${dayMacros.fats}`
    const weekDatesAll = getWeekDates(profile.programStartDate)
    for (let i = 0; i < 7; i++) {
      if (i === dayIdx) continue
      const otherMacros = weekCycle.length > 0 ? weekCycle[i]?.macros : targets
      if (!otherMacros) continue
      if (`${otherMacros.calories}-${otherMacros.protein}-${otherMacros.carbs}-${otherMacros.fats}` === macroKey) {
        const otherPlan = getMealPlanByDate(weekDatesAll[i])
        if (otherPlan) {
          const cloned: MealPlan = {
            id: crypto.randomUUID(),
            date: dateStr,
            meals: otherPlan.meals.map(m => ({ ...m, id: crypto.randomUUID(), foods: m.foods.map(f => ({ ...f, macros: { ...f.macros } })), totals: { ...m.totals } })),
            totals: { ...otherPlan.totals },
            targets: { ...otherPlan.targets },
          }
          saveMealPlan(cloned)
          setMealPlan(cloned)
          return
        }
      }
    }

    const plan = generateMealPlan(dayMacros, profile.goal, profile.trainingPhilosophy, profile.currentPhase, trainingDayMap[dayIdx])
    plan.date = dateStr
    saveMealPlan(plan)
    setMealPlan(plan)
  }

  // Sync a modified plan to all days with the same macro targets
  const syncToMatchingDays = (updatedPlan: MealPlan) => {
    const weekDates = getWeekDates(profile?.programStartDate)
    const sourceTargets = updatedPlan.targets
    const sourceKey = `${sourceTargets.calories}-${sourceTargets.protein}-${sourceTargets.carbs}-${sourceTargets.fats}`

    for (let i = 0; i < 7; i++) {
      if (weekDates[i] === updatedPlan.date) continue
      const otherPlan = getMealPlanByDate(weekDates[i])
      if (!otherPlan) continue

      const otherKey = `${otherPlan.targets.calories}-${otherPlan.targets.protein}-${otherPlan.targets.carbs}-${otherPlan.targets.fats}`
      if (otherKey === sourceKey) {
        const cloned: MealPlan = {
          id: crypto.randomUUID(),
          date: weekDates[i],
          meals: updatedPlan.meals.map(m => ({
            ...m,
            id: crypto.randomUUID(),
            foods: m.foods.map(f => ({ ...f, macros: { ...f.macros } })),
            totals: { ...m.totals },
          })),
          totals: { ...updatedPlan.totals },
          targets: { ...updatedPlan.targets },
        }
        saveMealPlan(cloned)
      }
    }
  }

  const handlePortionSave = () => {
    if (!mealPlan || !portionEdit) return
    const newVal = parseFloat(portionEdit.value)
    if (isNaN(newVal) || newVal <= 0) { setPortionEdit(null); return }
    const updated = adjustPortion(mealPlan, portionEdit.mealId, portionEdit.foodIndex, newVal)
    saveMealPlan(updated)
    setMealPlan(updated)
    setPortionEdit(null)
    syncToMatchingDays(updated)
  }

  const handleSwapOpen = (mealId: string, foodIndex: number) => {
    if (!mealPlan) return
    const meal = mealPlan.meals.find(m => m.id === mealId)
    if (!meal) return
    const food = meal.foods[foodIndex]
    if (!food) return
    const candidates = getSwapCandidates(food)
    setSwapModal({ mealId, foodIndex, candidates })
    setSearchTerm('')
  }

  const handleSwapSelect = (newFoodId: string) => {
    if (!mealPlan || !swapModal) return
    const updated = swapFood(mealPlan, swapModal.mealId, swapModal.foodIndex, newFoodId)
    saveMealPlan(updated)
    setMealPlan(updated)
    setSwapModal(null)
    syncToMatchingDays(updated)
  }

  const handleRemoveFood = (mealId: string, foodIndex: number) => {
    if (!mealPlan) return

    // Remove the food
    const meals = mealPlan.meals.map(m => {
      if (m.id !== mealId) return m
      const foods = m.foods.filter((_, i) => i !== foodIndex)
      const totals = foods.reduce(
        (acc, f) => ({
          calories: acc.calories + f.macros.calories,
          protein: acc.protein + f.macros.protein,
          carbs: acc.carbs + f.macros.carbs,
          fats: acc.fats + f.macros.fats,
          fiber: acc.fiber + f.macros.fiber,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
      )
      return { ...m, foods, totals }
    })

    // Rebalance remaining food portions to hit targets
    const afterRemoval = { ...mealPlan, meals, totals: mealPlan.totals }
    const updated = rebalancePlan(afterRemoval)

    saveMealPlan(updated)
    setMealPlan(updated)
    syncToMatchingDays(updated)
  }

  const recalcMacros = (foods: MealFood[]): MacroTargets =>
    foods.reduce(
      (acc, f) => ({
        calories: acc.calories + f.macros.calories,
        protein: acc.protein + f.macros.protein,
        carbs: acc.carbs + f.macros.carbs,
        fats: acc.fats + f.macros.fats,
        fiber: acc.fiber + f.macros.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    )

  const addFoodToMeal = (mealId: string, food: MealFood) => {
    if (!mealPlan) return
    const meals = mealPlan.meals.map(m => {
      if (m.id !== mealId) return m
      const foods = [...m.foods, food]
      return { ...m, foods, totals: recalcMacros(foods) }
    })
    const updated: MealPlan = { ...mealPlan, meals, totals: recalcMacros(meals.flatMap(m => m.foods)) }
    saveMealPlan(updated)
    setMealPlan(updated)
    syncToMatchingDays(updated)
    setAddFoodMealId(null)
    setAddFoodSearch('')
    setScannedFood(null)
    setScannedServing('100')
  }

  const handleAddFromDB = (food: FoodItem) => {
    if (!addFoodMealId) return
    addFoodToMeal(addFoodMealId, {
      foodId: food.id,
      name: food.name,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      macros: {
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        fiber: food.fiber,
      },
    })
  }

  const handleConfirmScanned = () => {
    if (!addFoodMealId || !scannedFood) return
    const g = Math.max(1, parseFloat(scannedServing) || 100)
    addFoodToMeal(addFoodMealId, {
      foodId: `scanned-${Date.now()}`,
      name: scannedFood.name,
      servingSize: g,
      servingUnit: 'g',
      macros: {
        calories: Math.round((scannedFood.caloriesPer100 * g) / 100),
        protein: Math.round((scannedFood.proteinPer100 * g) / 100),
        carbs: Math.round((scannedFood.carbsPer100 * g) / 100),
        fats: Math.round((scannedFood.fatsPer100 * g) / 100),
        fiber: Math.round((scannedFood.fiberPer100 * g) / 100),
      },
    })
  }

  if (!mealPlan || !targets || !profile) {
    return <div className="flex items-center justify-center min-h-[60vh] text-[var(--muted)]">Set up your profile first</div>
  }

  if (showShoppingList) {
    return <ShoppingListView onClose={() => setShowShoppingList(false)} />
  }

  const stepTarget = profile.dailyStepTarget ?? recommendedSteps(profile.goal)
  const filteredCandidates = swapModal
    ? (searchTerm
      ? FOOD_DATABASE.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : swapModal.candidates
    ).slice(0, 30)
    : []

  return (
    <div className="px-4 pt-2 pb-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 style={{ ...headingStyle, fontSize: 18 }}>NUTRITION</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowShoppingList(true)} className="px-3 py-1.5 border border-[var(--card-border)]" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 13, letterSpacing: '0.08em', color: 'var(--foreground)', background: 'var(--card)' }}>
            SHOPPING LIST
          </button>
          <button onClick={handleRegenerate} className="px-3 py-1.5 bg-[var(--accent)] text-black" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 13, letterSpacing: '0.08em' }}>
            REGENERATE
          </button>
        </div>
      </div>

      {/* Contest Prep Card — shown when in contest mode */}
      {(() => {
        const mode = getNutritionMode(profile.currentPhase, profile.trainingPhilosophy, profile.goal)
        if (mode !== 'contest') return null

        const contestDate = profile.contestDate
        const dayTargets = getDayMacros()

        if (!contestDate) {
          return (
            <div className="bg-[var(--card)] border border-[var(--card-border)] p-4" style={{ borderTop: '2px solid var(--accent)' }}>
              <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 18, letterSpacing: '0.06em' }}>CONTEST PREP</p>
              <p className="text-[10px] text-[var(--muted)] mt-2 tracking-widest uppercase">Set contest date in profile to unlock peak week protocols.</p>
            </div>
          )
        }

        const msOut = new Date(contestDate).getTime() - Date.now()
        const weeksOut = Math.max(0, Math.ceil(msOut / (7 * 24 * 60 * 60 * 1000)))
        const daysOut = Math.max(0, Math.ceil(msOut / (24 * 60 * 60 * 1000)))

        const targetBf = profile.division ? getDivisionTargetBodyFat(profile.division) : 4
        const protocol = buildPeakWeekProtocol(profile, dayTargets)
        const currentDay = protocol.find(d => d.daysOut === Math.min(daysOut, 10)) ?? protocol[protocol.length - 1]
        const timeline = contestPrepTimeline(profile.weightKg, profile.bodyFatPercent, targetBf, 0.6)
        const phaseLabel = getPrepPhaseLabel(weeksOut)
        const nextMilestone = getNextMilestone(weeksOut)

        return (
          <div className="bg-[var(--card)] border border-[var(--card-border)] p-4 space-y-3" style={{ borderTop: '2px solid var(--accent)' }}>
            <div className="flex justify-between items-center">
              <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 18, letterSpacing: '0.06em' }}>CONTEST PREP</p>
              <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 32, letterSpacing: '0.06em', color: 'var(--accent)', lineHeight: 1 }}>{weeksOut} <span style={{ fontSize: 13 }}>WEEKS OUT</span></p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--muted)] tracking-widest uppercase">{phaseLabel}</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">{nextMilestone}</p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] text-[var(--muted)] tracking-widest uppercase">Peak Week Targets — {currentDay.label}</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { label: 'KCAL', value: currentDay.targets.calories },
                  { label: 'PROTEIN', value: `${currentDay.targets.protein}g` },
                  { label: 'CARBS', value: `${currentDay.targets.carbs}g` },
                  { label: 'FATS', value: `${currentDay.targets.fats}g` },
                ] as { label: string; value: string | number }[]).map(({ label, value }) => (
                  <div key={label} className="bg-[var(--surface)] border border-[var(--card-border)] p-2 text-center">
                    <p className="text-[8px] text-[var(--muted)] tracking-widest">{label}</p>
                    <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em', color: 'var(--accent)' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-1 border-t border-[var(--card-border)]">
              <p className="text-[10px] text-[var(--muted)]">
                Est. prep duration: <span style={{ color: 'var(--foreground)' }}>{timeline.weeksRequired} weeks</span> · Weekly loss: <span style={{ color: 'var(--foreground)' }}>{timeline.weeklyLossKg}kg</span> · Daily deficit: <span style={{ color: 'var(--danger)' }}>-{timeline.dailyDeficit} kcal</span>
              </p>
            </div>
            <button
              onClick={async () => {
                setPeakWeekPdfLoading(true)
                try {
                  const { pdf } = await import('@react-pdf/renderer')
                  const { PeakWeekPDF } = await import('./PeakWeekPDF')
                  const blob = await pdf(<PeakWeekPDF profile={profile} protocol={protocol} showDate={contestDate} />).toBlob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${profile.name.replace(/\s+/g, '-')}-peak-week-protocol.pdf`
                  a.click()
                  URL.revokeObjectURL(url)
                } finally {
                  setPeakWeekPdfLoading(false)
                }
              }}
              disabled={peakWeekPdfLoading}
              className="w-full py-2.5 text-xs font-bold bg-[var(--accent)] text-black disabled:opacity-50"
              style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', letterSpacing: '0.06em' }}
            >
              {peakWeekPdfLoading ? 'BUILDING PDF…' : 'DOWNLOAD PEAK WEEK PDF'}
            </button>
          </div>
        )
      })()}

      {/* Task 3 — Diet Break Banner */}
      {profile.dietBreakActive ? (
        <div className="bg-[var(--accent)] p-3" style={{ borderTop: '2px solid var(--accent)' }}>
          <div className="flex justify-between items-center">
            <div>
              <p style={{ ...headingStyle, fontSize: 14, color: 'black' }}>DIET BREAK ACTIVE</p>
              <p className="text-[11px] text-black/70 mt-0.5">Eating at maintenance to restore metabolic rate.</p>
              {(() => {
                const maintMacros = computeMaintenanceMacros(profile)
                return (
                  <p className="text-[10px] text-black/60 mt-0.5">
                    Target: {maintMacros.calories} kcal · {maintMacros.protein}p · {maintMacros.carbs}c · {maintMacros.fats}f
                  </p>
                )
              })()}
            </div>
            <button
              onClick={handleEndDietBreak}
              className="px-3 py-1.5 bg-black text-[var(--accent)] text-[11px] ml-3 shrink-0"
              style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', letterSpacing: '0.06em' }}
            >
              END DIET BREAK
            </button>
          </div>
        </div>
      ) : (prescriptionReason.toLowerCase().includes('diet break') || prescriptionReason.toLowerCase().includes('matador')) ? (
        <div className="bg-[var(--card)] border border-[var(--accent)] p-3" style={{ borderTop: '2px solid var(--accent)' }}>
          <div className="flex justify-between items-center">
            <div>
              <p style={{ ...headingStyle, fontSize: 13, color: 'var(--accent)' }}>DIET BREAK RECOMMENDED</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">MATADOR protocol — eat at maintenance for 1-2 weeks to restore leptin and metabolic rate.</p>
            </div>
            <button
              onClick={handleStartDietBreak}
              className="px-3 py-1.5 bg-[var(--accent)] text-black text-[11px] ml-3 shrink-0"
              style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', letterSpacing: '0.06em' }}
            >
              START DIET BREAK
            </button>
          </div>
        </div>
      ) : null}

      {/* Prescribed protocol */}
      {prescriptionReason && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] p-3" style={{ borderTop: '2px solid var(--accent)' }}>
          <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 11, letterSpacing: '0.08em', color: 'var(--accent)' }}>YOUR PROTOCOL</p>
          <p className="text-xs text-[var(--foreground)] mt-0.5">{prescriptionReason}</p>
        </div>
      )}

      {/* Week at a glance — always shown */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] p-3" style={{ borderTop: '2px solid var(--accent)' }}>
        <div className="flex gap-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
            const cycle = weekCycle[i]
            const isSelected = selectedDay === i
            const isTD = trainingDayMap[i]
            const typeColor = cycle?.dayType === 'high' ? 'bg-[var(--success)]' :
              cycle?.dayType === 'refeed' ? 'bg-blue-500' :
              cycle?.dayType === 'medium' ? 'bg-[var(--accent)]' : 'bg-[var(--danger)]'
            return (
              <button
                key={i}
                onClick={() => handleDaySelect(i)}
                className={`flex-1 py-1.5 text-center transition-all ${isSelected ? 'ring-2 ring-[var(--accent)]' : ''}`}
              >
                <p className={`text-[10px] ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>{day}</p>
                <div className={`w-3 h-3 rounded-full mx-auto mt-0.5 ${typeColor}`} />
                <p className="text-[8px] text-[var(--muted)] mt-0.5">{cycle?.macros.calories ?? '-'}</p>
                <p className="text-[7px] text-[var(--muted)]">{isTD ? 'Train' : 'Rest'}</p>
              </button>
            )
          })}
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-[8px] text-[var(--muted)]"><span className="w-2 h-2 rounded-full bg-[var(--danger)] inline-block" /> Low</span>
            <span className="flex items-center gap-1 text-[8px] text-[var(--muted)]"><span className="w-2 h-2 rounded-full bg-[var(--accent)] inline-block" /> Med</span>
            <span className="flex items-center gap-1 text-[8px] text-[var(--muted)]"><span className="w-2 h-2 rounded-full bg-[var(--success)] inline-block" /> High</span>
            <span className="flex items-center gap-1 text-[8px] text-[var(--muted)]"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Refeed</span>
          </div>
          <button onClick={() => setShowCyclePanel(true)} className="text-[9px] text-[var(--muted)] underline">
            Customise
          </button>
        </div>
      </div>

      {/* Daily summary with phase-aware display */}
      {(() => {
        const dayTargets = getDayMacros()
        const dayLabel = weekCycle.length > 0 && weekCycle[selectedDay]
          ? `${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][selectedDay]} — ${weekCycle[selectedDay].dayType.toUpperCase()} day`
          : 'Daily Totals'
        const mode = getNutritionMode(profile.currentPhase, profile.trainingPhilosophy, profile.goal)

        return (
          <div className="bg-[var(--card)] p-4 border border-[var(--card-border)] space-y-2" style={{ borderTop: '2px solid var(--accent)' }}>
            <div className="flex justify-between items-center mb-1">
              <span style={{ ...headingStyle }}>{dayLabel.toUpperCase()}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted)]">{mealPlan.totals.calories} / {dayTargets.calories}</span>
                <VarianceBadge actual={mealPlan.totals.calories} target={dayTargets.calories} />
              </div>
            </div>

            {mode === 'foundation' ? (
              <>
                {/* Foundation: protein only */}
                <p className="text-[10px] text-[var(--muted)] tracking-widest uppercase">Phase 1 — Protein First. Hit your target before anything else.</p>
                <div className="flex items-baseline gap-3 py-2">
                  <span style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 40, letterSpacing: '0.06em', color: 'var(--accent)', lineHeight: 1 }}>
                    {Math.round(mealPlan.totals.protein)}
                  </span>
                  <span className="text-[var(--muted)] text-sm">/ {dayTargets.protein}g protein</span>
                </div>
                <div className="h-2 bg-[var(--background)] overflow-hidden">
                  <div className="h-full transition-all duration-300" style={{ width: `${Math.min((mealPlan.totals.protein / dayTargets.protein) * 100, 100)}%`, backgroundColor: '#3b82f6' }} />
                </div>
              </>
            ) : mode === 'build' ? (
              <>
                {/* Build: full macros, no deficit */}
                <p className="text-[10px] text-[var(--muted)] tracking-widest uppercase">Phase 2 — Maintenance Eating. Build Muscle, No Deficit.</p>
                <MacroBar label="Protein" current={mealPlan.totals.protein} target={dayTargets.protein} color="#3b82f6" />
                <MacroBar label="Carbs" current={mealPlan.totals.carbs} target={dayTargets.carbs} color="#f59e0b" />
                <MacroBar label="Fats" current={mealPlan.totals.fats} target={dayTargets.fats} color="#ef4444" />
                <MacroBar label="Fibre" current={mealPlan.totals.fiber} target={dayTargets.fiber} color="#22c55e" />
              </>
            ) : (
              <>
                {/* Cut / Contest: full macros + deficit badge */}
                <MacroBar label="Protein" current={mealPlan.totals.protein} target={dayTargets.protein} color="#3b82f6" />
                <MacroBar label="Carbs" current={mealPlan.totals.carbs} target={dayTargets.carbs} color="#f59e0b" />
                <MacroBar label="Fats" current={mealPlan.totals.fats} target={dayTargets.fats} color="#ef4444" />
                <MacroBar label="Fibre" current={mealPlan.totals.fiber} target={dayTargets.fiber} color="#22c55e" />
                {(() => {
                  const tdee = computeTDEE(profile)
                  const deficit = tdee - dayTargets.calories
                  return deficit > 0 ? (
                    <div className="flex items-center gap-2 pt-1">
                      <span
                        className="text-[10px] tracking-widest uppercase px-2 py-1"
                        style={{ background: 'color-mix(in srgb, var(--danger) 15%, transparent)', color: 'var(--danger)', letterSpacing: '0.08em' }}
                      >
                        DEFICIT: -{deficit} kcal
                      </span>
                      <span className="text-[9px] text-[var(--muted)]">vs TDEE {tdee} kcal</span>
                    </div>
                  ) : null
                })()}
              </>
            )}
          </div>
        )
      })()}

      {/* Steps target */}
      <div className="bg-[var(--card)] p-3 border border-[var(--card-border)] flex justify-between items-center" style={{ borderTop: '2px solid var(--accent)' }}>
        <div>
          <p className="font-bold uppercase" style={headingStyle}>Daily Steps</p>
          <p className="text-[10px] text-[var(--muted)]">Target for {profile.goal === 'cut' ? 'fat loss' : profile.goal === 'contest-prep' ? 'prep' : 'current goal'}</p>
        </div>
        <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{stepTarget.toLocaleString()}</p>
      </div>

      {/* Activity level info */}
      <div className="bg-[var(--card)] p-3 border border-[var(--card-border)]">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold uppercase" style={headingStyle}>Activity Factor</p>
            <p className="text-[10px] text-[var(--muted)]">
              {profile.occupation ?? 'sedentary'} · {profile.trainingDaysPerWeek ?? 5} training days · {stepTarget} steps
            </p>
          </div>
          <p className="text-sm font-bold text-[var(--accent)]">{profile.activityFactor}x</p>
        </div>
      </div>

      {/* Meals */}
      {mealPlan.meals.map(meal => (
        <MealCard
          key={meal.id}
          meal={meal}
          mealId={meal.id}
          onSwap={handleSwapOpen}
          onRemove={handleRemoveFood}
          onAddFood={(mId) => { setAddFoodMealId(mId); setAddFoodSearch(''); setScannedFood(null) }}
          onPortionEdit={(mId, fIdx) => {
            const m = mealPlan.meals.find(mm => mm.id === mId)
            if (m) setPortionEdit({ mealId: mId, foodIndex: fIdx, value: String(m.foods[fIdx].servingSize) })
          }}
        />
      ))}

      {/* Task 2 — Food Shopping List button */}
      <button
        onClick={() => setShowFoodShoppingList(true)}
        className="w-full py-2.5 border border-[var(--card-border)] bg-[var(--card)]"
        style={{ ...headingStyle, fontSize: 13, color: 'var(--foreground)' }}
      >
        FOOD SHOPPING LIST
      </button>

      {/* Task 4 — Reverse Diet Protocol */}
      {(() => {
        const phaseL = profile.currentPhase.toLowerCase()
        const showReverse = profile.goal === 'maintain' || phaseL.includes('phase 5') || phaseL === '5' || phaseL.includes('maintenance')
        if (!showReverse) return null

        const baseCals = targets.calories
        const weeklyIncrease = reverseDietRate === 'conservative' ? 50 : 100
        const carbsPerKcal = 4

        return (
          <div className="bg-[var(--card)] border border-[var(--card-border)] p-4 space-y-3" style={{ borderTop: '2px solid var(--accent)' }}>
            <p style={{ ...headingStyle, fontSize: 16 }}>REVERSE DIET PROTOCOL</p>
            <p className="text-[10px] text-[var(--muted)]">This protocol gradually restores metabolic rate to prevent fat rebound.</p>
            <div className="flex gap-2">
              {(['conservative', 'moderate'] as const).map(rate => (
                <button
                  key={rate}
                  onClick={() => setReverseDietRate(rate)}
                  className="flex-1 py-1.5 text-[11px] border transition-colors"
                  style={{
                    fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif',
                    letterSpacing: '0.06em',
                    background: reverseDietRate === rate ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--surface)',
                    borderColor: reverseDietRate === rate ? 'var(--accent)' : 'var(--card-border)',
                    color: reverseDietRate === rate ? 'var(--accent)' : 'var(--foreground)',
                  }}
                >
                  {rate === 'conservative' ? 'CONSERVATIVE (+50 kcal/wk)' : 'MODERATE (+100 kcal/wk)'}
                </button>
              ))}
            </div>
            <div className="space-y-0">
              <div className="flex text-[9px] text-[var(--muted)] uppercase tracking-widest pb-1 border-b border-[var(--card-border)]">
                <span className="w-16">Week</span>
                <span className="flex-1">Calories</span>
                <span className="w-20 text-right">Extra Carbs</span>
              </div>
              {Array.from({ length: 8 }, (_, i) => {
                const wk = i + 1
                const cals = baseCals + weeklyIncrease * i
                const extraCarbs = Math.round((weeklyIncrease * i) / carbsPerKcal)
                const isFirst = i === 0
                const isLast = i === 7
                return (
                  <div key={wk} className={`flex py-1.5 text-[11px] border-b border-[var(--card-border)] ${isFirst || isLast ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>
                    <span className="w-16 text-[var(--muted)]">
                      {isFirst ? 'START' : isLast ? 'END' : `Week ${wk}`}
                    </span>
                    <span className="flex-1 tabular-nums font-medium">{cals.toLocaleString()} kcal</span>
                    <span className="w-20 text-right tabular-nums text-[var(--muted)]">{extraCarbs > 0 ? `+${extraCarbs}g` : '—'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Portion Edit Modal */}
      {portionEdit && (() => {
        const meal = mealPlan.meals.find(m => m.id === portionEdit.mealId)
        const food = meal?.foods[portionEdit.foodIndex]
        return food ? (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center px-6">
            <div className="bg-[var(--card)] p-5 w-full max-w-sm" style={{ borderTop: '2px solid var(--accent)' }}>
              <h3 className="font-bold mb-1 uppercase" style={headingStyle}>Adjust Portion</h3>
              <p className="text-xs text-[var(--muted)] mb-3">{food.name}</p>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="number"
                  value={portionEdit.value}
                  onChange={e => setPortionEdit({ ...portionEdit, value: e.target.value })}
                  className="flex-1 bg-[var(--surface)] border border-[var(--card-border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  min="1"
                  step="5"
                  autoFocus
                />
                <span className="text-sm text-[var(--muted)]">{food.servingUnit}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPortionEdit(null)} className="flex-1 py-2 text-xs font-bold border border-[var(--card-border)] text-[var(--muted)]">
                  Cancel
                </button>
                <button onClick={handlePortionSave} className="flex-1 py-2 text-xs font-bold bg-[var(--accent)] text-black">
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null
      })()}

      {/* Carb Cycle Pattern Picker */}
      {showCyclePanel && profile && targets && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-end">
          <div className="bg-[var(--card)] w-full max-h-[70vh] p-4 overflow-y-auto" style={{ borderTop: '2px solid var(--accent)' }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold uppercase" style={headingStyle}>Carb Cycling Pattern</h3>
              <button onClick={() => setShowCyclePanel(false)} className="text-[var(--muted)] text-lg">x</button>
            </div>
            <p className="text-[10px] text-[var(--muted)] mb-3">
              Weekly calories stay the same — carbs and fats shift between days for better performance and fat loss.
            </p>
            <div className="space-y-2">
              {getCarbCyclePatterns(profile.goal, profile.trainingPhilosophy).map(p => (
                <button
                  key={p.id}
                  onClick={() => handleCycleChange(p.id)}
                  className={`w-full text-left p-3 border transition-colors ${
                    carbCyclePattern === p.id
                      ? 'bg-[var(--accent)]/10 border-[var(--accent)]'
                      : 'bg-[var(--surface)] border-[var(--card-border)]'
                  }`}
                >
                  <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 15, letterSpacing: '0.06em' }}>{p.label.toUpperCase()}</p>
                  <p className="text-[10px] text-[var(--muted)]">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Food Modal */}
      {addFoodMealId && !showScanner && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-end">
          <div className="bg-[var(--card)] w-full max-h-[80vh] p-4 flex flex-col" style={{ borderTop: '2px solid var(--accent)' }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold uppercase" style={headingStyle}>Add Food</h3>
              <button onClick={() => { setAddFoodMealId(null); setScannedFood(null) }} className="text-[var(--muted)] text-lg">×</button>
            </div>

            {scannedFood ? (
              /* Confirm scanned food */
              <div className="space-y-3">
                <div className="bg-[var(--surface)] p-3">
                  <p className="text-sm">{scannedFood.name}</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">
                    Per 100g — {scannedFood.caloriesPer100}kcal · {scannedFood.proteinPer100}p · {scannedFood.carbsPer100}c · {scannedFood.fatsPer100}f
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-[var(--muted)] block mb-1">Serving size</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={scannedServing}
                      onChange={e => setScannedServing(e.target.value)}
                      className="flex-1 bg-[var(--surface)] border border-[var(--card-border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      min="1"
                      step="5"
                    />
                    <span className="text-sm text-[var(--muted)]">g</span>
                  </div>
                  {parseFloat(scannedServing) > 0 && (
                    <p className="text-[10px] text-[var(--accent)] mt-1">
                      = {Math.round(scannedFood.caloriesPer100 * parseFloat(scannedServing) / 100)}kcal ·{' '}
                      {Math.round(scannedFood.proteinPer100 * parseFloat(scannedServing) / 100)}p ·{' '}
                      {Math.round(scannedFood.carbsPer100 * parseFloat(scannedServing) / 100)}c ·{' '}
                      {Math.round(scannedFood.fatsPer100 * parseFloat(scannedServing) / 100)}f
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setScannedFood(null)} className="flex-1 py-2.5 text-xs font-bold border border-[var(--card-border)] text-[var(--muted)]">
                    Back
                  </button>
                  <button onClick={handleConfirmScanned} className="flex-1 py-2.5 text-xs font-bold bg-[var(--accent)] text-black">
                    Add to Meal
                  </button>
                </div>
              </div>
            ) : (
              /* Search or scan */
              <>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Search foods..."
                    value={addFoodSearch}
                    onChange={e => setAddFoodSearch(e.target.value)}
                    className="flex-1 bg-[var(--surface)] border border-[var(--card-border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                    autoFocus
                  />
                  <button
                    onClick={() => setShowScanner(true)}
                    className="px-3 py-2 bg-[var(--accent)]/15 text-[var(--accent)] text-sm font-bold shrink-0"
                    title="Scan barcode"
                  >
                    📷
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 space-y-0.5">
                  {addFoodSearch.length >= 2
                    ? FOOD_DATABASE
                        .filter(f => f.name.toLowerCase().includes(addFoodSearch.toLowerCase()))
                        .slice(0, 30)
                        .map(food => (
                          <button
                            key={food.id}
                            onClick={() => handleAddFromDB(food)}
                            className="w-full flex justify-between items-center py-2.5 px-3 hover:bg-[var(--surface)] transition-colors"
                          >
                            <div className="text-left">
                              <p className="text-sm font-medium">{food.name}</p>
                              <p className="text-[10px] text-[var(--muted)]">per {food.servingSize}{food.servingUnit}</p>
                            </div>
                            <div className="text-right text-[10px] text-[var(--muted)]">
                              {food.calories}cal · {food.protein}p · {food.carbs}c · {food.fats}f
                            </div>
                          </button>
                        ))
                    : (
                      <p className="text-center text-[var(--muted)] text-xs py-6">
                        Type to search, or tap 📷 to scan a barcode
                      </p>
                    )
                  }
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScanned={(food) => {
            setShowScanner(false)
            setScannedFood(food)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Task 1 — Regenerate Confirmation Dialog */}
      {showRegenConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-[var(--card)] p-5 w-full max-w-sm" style={{ borderTop: '2px solid var(--accent)' }}>
            <p style={{ ...headingStyle, fontSize: 20 }}>REGENERATE PLAN?</p>
            <p className="text-[13px] text-[var(--muted)] mt-2 mb-5" style={{ fontFamily: 'var(--font-body), Lekton, monospace' }}>
              This will replace your current meal plan. Any manual food swaps will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRegenConfirm(false)}
                className="flex-1 py-2.5 border border-[var(--card-border)] bg-[var(--surface)]"
                style={{ ...headingStyle, fontSize: 16 }}
              >
                CANCEL
              </button>
              <button
                onClick={handleRegenConfirm}
                className="flex-1 py-2.5 bg-[var(--accent)] text-black"
                style={{ ...headingStyle, fontSize: 16 }}
              >
                REGENERATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task 2 — Food Shopping List Modal */}
      {showFoodShoppingList && (() => {
        const items = generateFoodShoppingList()
        const listText = items.map(item => {
          const qty = item.unit === 'g' || item.unit === 'ml'
            ? `${Math.round(item.totalGrams)}${item.unit}`
            : `${item.servings} serving${item.servings !== 1 ? 's' : ''}`
          return `[ ] ${item.name} — ${qty}`
        }).join('\n')

        return (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-end">
            <div className="bg-[var(--card)] w-full max-h-[80vh] flex flex-col" style={{ borderTop: '2px solid var(--accent)' }}>
              <div className="flex justify-between items-center p-4 border-b border-[var(--card-border)]">
                <p style={{ ...headingStyle, fontSize: 16 }}>SHOPPING LIST</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { if (typeof navigator !== 'undefined') navigator.clipboard?.writeText(listText) }}
                    className="px-3 py-1 bg-[var(--surface)] border border-[var(--card-border)] text-[11px]"
                    style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', letterSpacing: '0.06em' }}
                  >
                    COPY LIST
                  </button>
                  <button onClick={() => setShowFoodShoppingList(false)} className="text-[var(--muted)] text-lg">×</button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-1">
                {items.length === 0 ? (
                  <p className="text-[var(--muted)] text-xs text-center py-6">No meal plan generated yet.</p>
                ) : items.map((item, idx) => {
                  const qty = item.unit === 'g' || item.unit === 'ml'
                    ? `${Math.round(item.totalGrams)}${item.unit}`
                    : `${item.servings} serving${item.servings !== 1 ? 's' : ''}`
                  return (
                    <div key={idx} className="flex items-center gap-3 py-1.5 border-b border-[var(--card-border)] last:border-0">
                      <div className="w-4 h-4 border border-[var(--card-border)] bg-[var(--surface)] shrink-0" />
                      <span className="text-sm flex-1">{item.name}</span>
                      <span className="text-[11px] text-[var(--muted)] tabular-nums">{qty}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Swap Modal */}
      {swapModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-end">
          <div className="bg-[var(--card)] w-full max-h-[75vh] p-4 flex flex-col" style={{ borderTop: '2px solid var(--accent)' }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold uppercase" style={headingStyle}>Swap Food</h3>
              <button onClick={() => setSwapModal(null)} className="text-[var(--muted)] text-lg">×</button>
            </div>
            <p className="text-[10px] text-[var(--muted)] mb-2">
              Portions auto-calculated to match macro targets within ±50kcal
            </p>
            <input
              type="text"
              placeholder="Search all foods..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--card-border)] px-3 py-2 text-sm mb-3 outline-none focus:border-[var(--accent)]"
            />
            <div className="overflow-y-auto flex-1 space-y-0.5">
              {filteredCandidates.map(food => (
                <button
                  key={food.id}
                  onClick={() => handleSwapSelect(food.id)}
                  className="w-full flex justify-between items-center py-2.5 px-3 hover:bg-[var(--surface)] transition-colors"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium">{food.name}</p>
                    <p className="text-[10px] text-[var(--muted)]">per {food.servingSize}{food.servingUnit}</p>
                  </div>
                  <div className="text-right text-[10px] text-[var(--muted)]">
                    {food.calories}cal · {food.protein}p · {food.carbs}c · {food.fats}f
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
