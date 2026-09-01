import { describe, it, expect } from 'vitest'
import {
  bmrMuller,
  calculateLBM,
  calculateFatMass,
  calculateTDEE,
  peakWeekMacros,
  getDivisionTargetBodyFat,
  contestPrepTimeline,
} from './nutrition-engine'

// Golden-value regression test against Keith's own
// AthleticOdyssey_ContestPrep_v6_fixed.xlsx SETUP sheet inputs:
// 34yo male, 178cm, 103.5kg, 22% BF, 1.375 activity factor, Men's Physique.
describe('contest-prep math matches the reference spreadsheet', () => {
  const weightKg = 103.5
  const bodyFatPercent = 22
  const age = 34
  const sex = 'male' as const
  const activityFactor = 1.375

  const lbm = calculateLBM(weightKg, bodyFatPercent)
  const fatMass = calculateFatMass(weightKg, bodyFatPercent)

  it('body composition matches SETUP!C17/C18', () => {
    expect(fatMass).toBeCloseTo(22.77, 2)
    expect(lbm).toBeCloseTo(80.73, 2)
  })

  it('Müller BMR matches SETUP!C24 (2074 kcal)', () => {
    const bmr = bmrMuller(lbm, fatMass, age, sex)
    expect(Math.round(bmr)).toBe(2074)
  })

  it('TDEE matches SETUP!C26 (2852 kcal)', () => {
    const bmr = bmrMuller(lbm, fatMass, age, sex)
    const tdee = calculateTDEE(bmr, activityFactor)
    expect(Math.round(tdee)).toBe(2852)
  })

  it("Men's Physique target stage body fat matches SETUP!C19 (5%)", () => {
    expect(getDivisionTargetBodyFat('mens-physique')).toBe(5)
  })

  it("Women's Bikini target stage body fat matches SETUP!C19 (10.5%)", () => {
    expect(getDivisionTargetBodyFat('womens-bikini')).toBe(10.5)
  })

  it('contest prep timeline produces a sane, positive estimate', () => {
    const targetBf = getDivisionTargetBodyFat('mens-physique')
    const timeline = contestPrepTimeline(weightKg, bodyFatPercent, targetBf, 0.6)
    expect(timeline.weeksRequired).toBeGreaterThan(0)
    expect(timeline.weeklyLossKg).toBeCloseTo(weightKg * 0.006, 2)
  })
})

// Regression test for the missing-D-9 bug: the old bb/bk tables had keys
// for daysOut 10 and 8 but not 9, so a client 9 days out silently got no
// Norton adjustment at all instead of the correct depletion multiplier.
describe('peakWeekMacros — Norton protocol (PEAK WEEK sheet)', () => {
  const normalMacros = { calories: 2327, protein: 194, carbs: 233, fats: 69, fiber: 30 }

  it('D-9 gets the same depletion multiplier as D-10 and D-8 (bug fix)', () => {
    const d10 = peakWeekMacros(normalMacros, 10)
    const d9 = peakWeekMacros(normalMacros, 9)
    const d8 = peakWeekMacros(normalMacros, 8)
    expect(d9.protein).toBe(d10.protein)
    expect(d9.carbs).toBe(d10.carbs)
    expect(d9.fats).toBe(d10.fats)
    expect(d9).toEqual(d8)
    expect(d9.sodiumMultiplier).toBe(1.3)
    expect(d9.fibreTarget).toBe('30+ g')
  })

  it('D-5 carb-load multipliers match PEAK WEEK!E7:E9 (×0.8 / ×2.5 / ×1.6)', () => {
    const d5 = peakWeekMacros(normalMacros, 5)
    expect(d5.protein).toBe(Math.round(194 * 0.8))
    expect(d5.carbs).toBe(Math.round(233 * 2.5))
    expect(d5.fats).toBe(Math.round(69 * 1.6))
    expect(d5.trainingNote).toBe('Legs + HIIT')
  })

  it('Show Day multipliers match PEAK WEEK!I7:I9 midpoints (×0.7 / ×2.25 / ×1.45)', () => {
    const showDay = peakWeekMacros(normalMacros, 0)
    expect(showDay.protein).toBe(Math.round(194 * 0.7))
    expect(showDay.carbs).toBe(Math.round(233 * 2.25))
    expect(showDay.fats).toBe(Math.round(69 * 1.45))
    expect(showDay.sodiumMultiplier).toBe(1.3)
  })
})
