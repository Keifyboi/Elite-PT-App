// Sensible food pairings for meal generation
// Each archetype defines which protein/carb/fat/veg combinations actually work together as a meal

export interface MealArchetype {
  name: string
  mealType: 'breakfast' | 'main' | 'shake' | 'snack'
  proteinIds: string[]     // food IDs that work in this archetype
  carbIds: string[]
  fatIds: string[]
  vegIds: string[]
}

// ─── Breakfast archetypes ───

export const BREAKFAST_HIGH_FAT: MealArchetype[] = [
  {
    name: 'Eggs & Avocado',
    mealType: 'breakfast',
    proteinIds: ['eggs-whole', 'egg-whites', 'turkey-rasher'],
    carbIds: [],
    fatIds: ['avocado', 'organic-butter', 'olive-oil', 'coconut-oil'],
    vegIds: ['mushrooms', 'tomato', 'peppers', 'asparagus'],
  },
  {
    name: 'Steak & Eggs',
    mealType: 'breakfast',
    proteinIds: ['eggs-whole', 'fillet-steak-cooked', 'lean-beef-mince-cooked'],
    carbIds: [],
    fatIds: ['avocado', 'organic-butter'],
    vegIds: ['mushrooms', 'tomato', 'asparagus'],
  },
  {
    name: 'Salmon & Eggs',
    mealType: 'breakfast',
    proteinIds: ['salmon-cooked', 'eggs-whole', 'egg-whites'],
    carbIds: [],
    fatIds: ['avocado'],
    vegIds: ['asparagus', 'tomato'],
  },
  {
    name: 'Turkey & Nut Butter',
    mealType: 'breakfast',
    proteinIds: ['turkey-breast-cooked', 'turkey-rasher', 'eggs-whole'],
    carbIds: [],
    fatIds: ['almond-butter', 'peanut-butter', 'avocado'],
    vegIds: ['peppers', 'mushrooms', 'tomato'],
  },
]

export const BREAKFAST_WITH_CARBS: MealArchetype[] = [
  {
    name: 'Oats & Protein',
    mealType: 'breakfast',
    proteinIds: ['whey-protein', 'casein-protein', 'protein-powder', 'greek-yoghurt-0'],
    carbIds: ['oats', 'banana'],
    fatIds: ['almond-butter', 'peanut-butter'],
    vegIds: [],
  },
  {
    name: 'Eggs & Toast',
    mealType: 'breakfast',
    proteinIds: ['eggs-whole', 'egg-whites', 'turkey-rasher'],
    carbIds: ['white-sourdough-bread', 'whole-wheat-bread', 'sourdough-bread', 'rye-bread'],
    fatIds: ['avocado', 'organic-butter'],
    vegIds: ['tomato', 'mushrooms'],
  },
  {
    name: 'Yoghurt Bowl',
    mealType: 'breakfast',
    proteinIds: ['greek-yoghurt-0', 'greek-yoghurt-whole'],
    carbIds: ['oats', 'granola', 'banana', 'blueberries', 'frozen-mixed-berries'],
    fatIds: ['almond-butter', 'peanut-butter', 'almonds', 'walnuts'],
    vegIds: [],
  },
  {
    name: 'Bagel & Eggs',
    mealType: 'breakfast',
    proteinIds: ['eggs-whole', 'egg-whites', 'salmon-cooked'],
    carbIds: ['plain-bagel'],
    fatIds: ['avocado', 'organic-butter'],
    vegIds: ['tomato'],
  },
  {
    name: 'Rice & Eggs',
    mealType: 'breakfast',
    proteinIds: ['eggs-whole', 'chicken-breast-cooked', 'lean-beef-mince-cooked'],
    carbIds: ['jasmine-rice', 'brown-rice', 'cream-of-rice'],
    fatIds: ['avocado', 'coconut-oil'],
    vegIds: ['peppers', 'peas'],
  },
]

// ─── Main meal archetypes (lunch / dinner) ───

export const MAIN_MEALS: MealArchetype[] = [
  {
    name: 'Chicken & Rice',
    mealType: 'main',
    proteinIds: ['chicken-breast-cooked', 'chicken-breast-raw'],
    carbIds: ['jasmine-rice', 'brown-rice', 'basmati-rice'],
    fatIds: ['olive-oil', 'avocado'],
    vegIds: ['broccoli', 'green-beans', 'asparagus', 'peppers'],
  },
  {
    name: 'Chicken & Sweet Potato',
    mealType: 'main',
    proteinIds: ['chicken-breast-cooked', 'chicken-breast-raw'],
    carbIds: ['sweet-potato'],
    fatIds: ['olive-oil', 'avocado', 'coconut-oil'],
    vegIds: ['broccoli', 'green-beans', 'asparagus', 'brussel-sprouts'],
  },
  {
    name: 'Chicken & Pasta',
    mealType: 'main',
    proteinIds: ['chicken-breast-cooked', 'chicken-breast-raw'],
    carbIds: ['pasta', 'wholemeal-pasta'],
    fatIds: ['olive-oil'],
    vegIds: ['broccoli', 'peppers', 'courgette', 'mushrooms', 'tomato-passata'],
  },
  {
    name: 'Steak & Potato',
    mealType: 'main',
    proteinIds: ['fillet-steak-cooked', 'fillet-steak-raw', 'lean-beef-mince-cooked'],
    carbIds: ['white-potato', 'sweet-potato'],
    fatIds: ['organic-butter', 'olive-oil'],
    vegIds: ['broccoli', 'asparagus', 'green-beans', 'mushrooms'],
  },
  {
    name: 'Beef Mince & Rice',
    mealType: 'main',
    proteinIds: ['lean-beef-mince-cooked', 'lean-beef-mince-raw'],
    carbIds: ['jasmine-rice', 'brown-rice'],
    fatIds: ['olive-oil', 'avocado'],
    vegIds: ['broccoli', 'peppers', 'peas', 'carrots', 'green-beans'],
  },
  {
    name: 'Salmon & Rice',
    mealType: 'main',
    proteinIds: ['salmon-cooked', 'salmon-raw'],
    carbIds: ['jasmine-rice', 'brown-rice'],
    fatIds: ['avocado'],
    vegIds: ['asparagus', 'broccoli', 'green-beans', 'tender-stem-broccoli'],
  },
  {
    name: 'Salmon & Sweet Potato',
    mealType: 'main',
    proteinIds: ['salmon-cooked', 'salmon-raw'],
    carbIds: ['sweet-potato'],
    fatIds: ['olive-oil'],
    vegIds: ['asparagus', 'broccoli', 'tender-stem-broccoli'],
  },
  {
    name: 'White Fish & Potato',
    mealType: 'main',
    proteinIds: ['cod-cooked', 'cod-raw', 'haddock-cooked', 'haddock-raw'],
    carbIds: ['white-potato', 'sweet-potato'],
    fatIds: ['olive-oil', 'organic-butter'],
    vegIds: ['peas', 'broccoli', 'green-beans', 'asparagus'],
  },
  {
    name: 'Prawns & Noodles',
    mealType: 'main',
    proteinIds: ['prawns-cooked', 'prawns-raw'],
    carbIds: ['egg-noodles', 'jasmine-rice'],
    fatIds: ['coconut-oil', 'sesame-seeds'],
    vegIds: ['peppers', 'bean-sprouts', 'stir-fry-mix', 'courgette'],
  },
  {
    name: 'Turkey & Rice',
    mealType: 'main',
    proteinIds: ['turkey-breast-cooked', 'turkey-breast-raw'],
    carbIds: ['jasmine-rice', 'brown-rice', 'sweet-potato'],
    fatIds: ['olive-oil', 'avocado'],
    vegIds: ['broccoli', 'green-beans', 'asparagus', 'peppers'],
  },
  {
    name: 'Tuna & Potato',
    mealType: 'main',
    proteinIds: ['tuna'],
    carbIds: ['white-potato', 'sweet-potato', 'jasmine-rice'],
    fatIds: ['olive-oil', 'avocado'],
    vegIds: ['broccoli', 'green-beans', 'peppers', 'tomato'],
  },
  {
    name: 'Lentil & Chicken Bowl',
    mealType: 'main',
    proteinIds: ['chicken-breast-cooked', 'lean-beef-mince-cooked'],
    carbIds: ['lentils', 'chickpeas', 'brown-rice'],
    fatIds: ['olive-oil', 'avocado'],
    vegIds: ['tomato-passata', 'peppers', 'onion', 'carrots'],
  },
]

// ─── High fat / low carb meals (for IB Reset, keto-style meals) ───

export const HIGH_FAT_MEALS: MealArchetype[] = [
  {
    name: 'Chicken & Avocado',
    mealType: 'main',
    proteinIds: ['chicken-breast-cooked', 'chicken-breast-raw'],
    carbIds: [],
    fatIds: ['avocado', 'olive-oil', 'almonds', 'macadamia-nut-oil'],
    vegIds: ['broccoli', 'asparagus', 'green-beans', 'peppers'],
  },
  {
    name: 'Steak & Greens',
    mealType: 'main',
    proteinIds: ['fillet-steak-cooked', 'lean-beef-mince-cooked'],
    carbIds: [],
    fatIds: ['organic-butter', 'olive-oil', 'avocado'],
    vegIds: ['broccoli', 'asparagus', 'mushrooms', 'green-beans'],
  },
  {
    name: 'Salmon & Vegetables',
    mealType: 'main',
    proteinIds: ['salmon-cooked', 'salmon-raw'],
    carbIds: [],
    fatIds: ['olive-oil', 'avocado'],
    vegIds: ['asparagus', 'broccoli', 'tender-stem-broccoli', 'green-beans'],
  },
  {
    name: 'Turkey & Nuts',
    mealType: 'main',
    proteinIds: ['turkey-breast-cooked', 'chicken-breast-cooked'],
    carbIds: [],
    fatIds: ['almonds', 'cashews', 'walnuts', 'peanut-butter', 'almond-butter'],
    vegIds: ['broccoli', 'peppers', 'cauliflower'],
  },
  {
    name: 'Eggs & Cheese',
    mealType: 'main',
    proteinIds: ['eggs-whole', 'egg-whites'],
    carbIds: [],
    fatIds: ['cheese', 'avocado', 'organic-butter'],
    vegIds: ['mushrooms', 'peppers', 'tomato', 'courgette'],
  },
]

// ─── Shake archetypes ───

export const SHAKES: MealArchetype[] = [
  {
    name: 'Whey & Carb Shake',
    mealType: 'shake',
    proteinIds: ['whey-protein', 'protein-powder'],
    carbIds: ['highly-branched-cyclic-dextrin', 'banana', 'oats'],
    fatIds: [],
    vegIds: [],
  },
  {
    name: 'Casein Shake',
    mealType: 'shake',
    proteinIds: ['casein-protein', 'whey-protein', 'protein-powder'],
    carbIds: ['banana', 'blueberries', 'frozen-mixed-berries'],
    fatIds: ['almond-butter', 'peanut-butter'],
    vegIds: [],
  },
  {
    name: 'Protein & EAA Shake',
    mealType: 'shake',
    proteinIds: ['whey-protein', 'essential-amino-acids', 'protein-powder'],
    carbIds: ['highly-branched-cyclic-dextrin', 'banana'],
    fatIds: [],
    vegIds: [],
  },
]

// ─── Snack archetypes ───

export const SNACKS: MealArchetype[] = [
  {
    name: 'Rice Cakes & Nut Butter',
    mealType: 'snack',
    proteinIds: ['whey-protein', 'protein-powder'],
    carbIds: ['rice-cakes'],
    fatIds: ['almond-butter', 'peanut-butter'],
    vegIds: [],
  },
  {
    name: 'Yoghurt & Berries',
    mealType: 'snack',
    proteinIds: ['greek-yoghurt-0', 'greek-yoghurt-whole'],
    carbIds: ['blueberries', 'raspberries', 'frozen-mixed-berries', 'banana'],
    fatIds: ['almonds', 'walnuts'],
    vegIds: [],
  },
]

// ─── Get appropriate archetypes for a meal slot ───

export function getArchetypesForSlot(
  slotName: string,
  hasCarbs: boolean,
  hasFats: boolean
): MealArchetype[] {
  const nameL = slotName.toLowerCase()
  const isBreakfast = nameL.includes('breakfast') || nameL.includes('meal 1')
  const isShake = nameL.includes('shake') || nameL.includes('intra')
  const isPostSquat = nameL.includes('post-squat')

  if (isShake || isPostSquat) return SHAKES
  if (isBreakfast && !hasCarbs) return BREAKFAST_HIGH_FAT
  if (isBreakfast && hasCarbs) return BREAKFAST_WITH_CARBS
  if (!hasCarbs && hasFats) return HIGH_FAT_MEALS
  return MAIN_MEALS
}
