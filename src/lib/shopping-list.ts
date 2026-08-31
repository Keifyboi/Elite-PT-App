import type { MealPlan } from './types'
import { FOOD_DATABASE } from './data/foods'

export interface ShoppingItem {
  foodId: string
  name: string
  totalAmount: number
  unit: string
  category: string
  meals: string[] // which days/meals use this item
}

export interface ShoppingList {
  items: ShoppingItem[]
  generatedFor: string // e.g. "Week of 30 Jun 2026"
  daysIncluded: number
}

export function generateShoppingList(mealPlans: MealPlan[]): ShoppingList {
  const itemMap = new Map<string, ShoppingItem>()

  for (const plan of mealPlans) {
    const dayLabel = formatDay(plan.date)

    for (const meal of plan.meals) {
      for (const food of meal.foods) {
        const existing = itemMap.get(food.foodId)
        const mealRef = `${dayLabel} — ${meal.name}`

        if (existing) {
          existing.totalAmount += food.servingSize
          if (!existing.meals.includes(mealRef)) {
            existing.meals.push(mealRef)
          }
        } else {
          const db = FOOD_DATABASE.find(f => f.id === food.foodId)
          itemMap.set(food.foodId, {
            foodId: food.foodId,
            name: food.name,
            totalAmount: food.servingSize,
            unit: food.servingUnit,
            category: db?.category ?? 'other',
            meals: [mealRef],
          })
        }
      }
    }
  }

  // Round amounts to practical shopping quantities
  const items = Array.from(itemMap.values()).map(item => ({
    ...item,
    totalAmount: roundToShoppingAmount(item.totalAmount, item.unit),
  }))

  // Sort by category then name
  const categoryOrder = ['protein', 'seafood', 'organ-meats', 'dairy', 'grains', 'breads', 'fruits', 'vegetables', 'nuts-fats', 'beans-lentils', 'supplements', 'sweeteners']
  items.sort((a, b) => {
    const catA = categoryOrder.indexOf(a.category)
    const catB = categoryOrder.indexOf(b.category)
    if (catA !== catB) return catA - catB
    return a.name.localeCompare(b.name)
  })

  return {
    items,
    generatedFor: mealPlans.length > 0 ? `Week of ${formatDay(mealPlans[0].date)}` : '',
    daysIncluded: mealPlans.length,
  }
}

function roundToShoppingAmount(grams: number, unit: string): number {
  if (unit === 'egg') return Math.ceil(grams)
  if (unit === 'rasher') return Math.ceil(grams)
  if (['weetabix', 'bar', 'muffin', 'bagel', 'crumpet', 'rice cake', 'corn cake'].includes(unit)) return Math.ceil(grams)
  // Round up to nearest 50g for practical shopping
  return Math.ceil(grams / 50) * 50
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

export const CATEGORY_LABELS: Record<string, string> = {
  'protein': 'Meat & Poultry',
  'seafood': 'Seafood',
  'organ-meats': 'Specialty Meats',
  'dairy': 'Dairy & Protein Powders',
  'grains': 'Grains & Starches',
  'breads': 'Breads',
  'fruits': 'Fruits',
  'vegetables': 'Vegetables',
  'nuts-fats': 'Nuts, Seeds & Oils',
  'beans-lentils': 'Beans & Lentils',
  'supplements': 'Supplements',
  'sweeteners': 'Sweeteners',
}
