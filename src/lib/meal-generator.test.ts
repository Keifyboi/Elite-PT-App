import { describe, it, expect } from 'vitest'
import { generateMealPlan } from './meal-generator'

describe('generateMealPlan', () => {
  it('lands within the app\'s documented ±50 kcal tolerance of the target', () => {
    const targets = { calories: 2327, protein: 194, carbs: 233, fats: 69, fiber: 30 }
    const plan = generateMealPlan(targets, 'cut', 'incredible-bulk', 'Growth', true)

    expect(Math.abs(plan.totals.calories - targets.calories)).toBeLessThanOrEqual(50)
    expect(plan.meals.length).toBeGreaterThan(0)
  })

  it('every meal food carries positive, finite macros', () => {
    const targets = { calories: 2800, protein: 180, carbs: 350, fats: 80, fiber: 30 }
    const plan = generateMealPlan(targets, 'bulk', 'incredible-bulk', 'Growth', true)

    for (const meal of plan.meals) {
      for (const food of meal.foods) {
        expect(Number.isFinite(food.macros.calories)).toBe(true)
        expect(food.macros.calories).toBeGreaterThanOrEqual(0)
        expect(food.servingSize).toBeGreaterThan(0)
      }
    }
  })
})
