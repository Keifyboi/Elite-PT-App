export type BudgetTier = 'essential' | 'recommended' | 'optimal'

export interface SupplementProtocol {
  name: string
  dose: string
  timing: string
  notes?: string
  tier: BudgetTier
}

export interface SupplementStack {
  category: string
  items: SupplementProtocol[]
}

export const BUDGET_LABELS: Record<BudgetTier, string> = {
  essential: 'Essential — Low Budget',
  recommended: 'Recommended — Mid Budget',
  optimal: 'Optimal — Full Protocol',
}

export function filterByBudget(stacks: SupplementStack[], maxTier: BudgetTier): SupplementStack[] {
  const tierOrder: BudgetTier[] = ['essential', 'recommended', 'optimal']
  const maxIdx = tierOrder.indexOf(maxTier)

  return stacks
    .map(s => ({
      ...s,
      items: s.items.filter(item => tierOrder.indexOf(item.tier) <= maxIdx),
    }))
    .filter(s => s.items.length > 0)
}

// ─── Daily foundation (both phases) ───

const DAILY_FOUNDATION: SupplementStack = {
  category: 'Daily Foundation',
  items: [
    { name: 'Multi-Vitamin/Multi-Mineral', dose: 'Males 2 caps 3x/day, Females 2 caps 2x/day', timing: 'With meals', tier: 'essential' },
    { name: 'Fish Oil (Omega-3)', dose: 'Under 12% BF: 3-6g | Over 12%: 12-15g/day', timing: 'With meals', notes: '1 cap = 1g, 1 tsp liquid = 5g', tier: 'essential' },
    { name: 'Magnesium (Glycinate)', dose: '400-800mg/day divided', timing: 'After 4PM, with meals', notes: 'Chelated form only', tier: 'essential' },
    { name: 'Vitamin D3', dose: '1000-3000 IU', timing: 'With breakfast', notes: 'Fat soluble — take with fats', tier: 'essential' },
    { name: 'Powdered Greens', dose: '2+ servings', timing: 'Post-training + 1 other meal', tier: 'recommended' },
    { name: 'Zinc', dose: '10-30mg', timing: 'With dinner', notes: 'Testosterone + 80+ hormonal processes', tier: 'recommended' },
    { name: 'Spore Probiotic', dose: 'Per brand', timing: 'Morning', notes: 'Gut health, protein digestion', tier: 'recommended' },
  ],
}

// ─── Growth / Bulk phase stack ───

const GROWTH_PRE_WORKOUT: SupplementStack = {
  category: 'Pre-Workout (Growth)',
  items: [
    { name: 'Caffeine', dose: '3-6mg/kg', timing: '60 min pre-workout', notes: 'Save high doses for late prep. Week-long breaks to reset tolerance', tier: 'essential' },
    { name: 'Beta Alanine', dose: '1-4g', timing: 'Pre-workout', notes: 'Account for amount in pre-WO supp', tier: 'recommended' },
    { name: 'Citrulline', dose: '6-8g', timing: '1-2hr pre-workout', tier: 'recommended' },
    { name: 'Pre-Workout Supplement', dose: 'Per label', timing: '30 min pre-training', tier: 'recommended' },
    { name: 'Acetyl L-Carnitine (ALCAR)', dose: '1000-3000mg', timing: 'Pre-workout', tier: 'optimal' },
  ],
}

const GROWTH_POST_WORKOUT: SupplementStack = {
  category: 'Post-Workout (Growth)',
  items: [
    { name: 'Whey Protein', dose: '0.6-1g per kg LBM', timing: 'Immediately post-workout', tier: 'essential' },
    { name: 'Creatine Monohydrate', dose: '4-6g 3x/day (males)', timing: 'With post-WO carbs + carb meals', tier: 'essential' },
    { name: 'Carbohydrate Powder', dose: '1-2g per lb BW around workout', timing: '15% intra, 40% post shake, 45% post meal', tier: 'recommended' },
    { name: 'Glutamine', dose: '0.08-0.2g per kg BW', timing: 'Post-workout', notes: '100kg male = 8-20g', tier: 'recommended' },
    { name: 'BCAAs', dose: '10-40g divided pre/intra/post', timing: 'Around workout', notes: '20g threshold for hypertrophy in 200lb male', tier: 'optimal' },
    { name: 'Leucine', dose: '2-5g', timing: 'Post-workout + midday meals', notes: 'Activates mTOR pathway', tier: 'optimal' },
  ],
}

// ─── Reset / Cut phase stack ───

const RESET_PRE_WORKOUT: SupplementStack = {
  category: 'Pre-Workout (Reset/Cut)',
  items: [
    { name: 'Caffeine', dose: '400-600mg', timing: 'Pre-workout', tier: 'essential' },
    { name: 'L-Carnitine', dose: '2-3g', timing: 'AM + pre-workout', notes: 'Shuttles fatty acids into mitochondria', tier: 'recommended' },
    { name: 'Green Tea Extract', dose: '200-400mg', timing: 'Breakfast + pre-training', notes: 'Fat usage, thyroid support', tier: 'recommended' },
    { name: 'ALCAR', dose: '500-2000mg', timing: 'Pre-workout', notes: 'Mental focus, fat shuttling', tier: 'recommended' },
    { name: 'Alpha GPC', dose: '250-300mg', timing: '1-2hr pre-training', notes: '250mg superior to 500mg for force production', tier: 'optimal' },
    { name: 'Tyrosine', dose: '250-1500mg', timing: 'Pre-workout', notes: 'Dopamine precursor — pair with choline source', tier: 'optimal' },
  ],
}

const RESET_POST_WORKOUT: SupplementStack = {
  category: 'Post-Workout (Reset/Cut)',
  items: [
    { name: 'Electrolytes', dose: 'Per brand', timing: 'Post-workout', tier: 'essential' },
    { name: 'Glutamine', dose: '5-20g', timing: 'Post-workout', notes: 'Gut health, glycogen replenishment without carbs', tier: 'recommended' },
    { name: 'Vitamin C (Buffered)', dose: '2-5g', timing: 'Post-workout + before bed', notes: 'Adrenal health, tissue recovery', tier: 'recommended' },
    { name: 'Taurine', dose: '1-3g', timing: 'Post-workout', notes: 'Calms nervous system, electrolyte balance', tier: 'recommended' },
    { name: 'Glycine', dose: '1-6g', timing: 'Post-workout', notes: 'Liver detox, metabolic waste clearance', tier: 'optimal' },
  ],
}

const RESET_DURING_DAY: SupplementStack = {
  category: 'During the Day (Reset/Cut)',
  items: [
    { name: 'L-Carnitine', dose: '1-3g AM + 1-2g with 2 other meals', timing: 'With protein/fat meals', tier: 'recommended' },
    { name: 'Vitamin B12', dose: '500-2500mcg', timing: 'Morning', notes: 'Protein metabolism, energy', tier: 'recommended' },
    { name: 'Fenugreek', dose: '400-600mg 2-3x/day', timing: 'With meals', notes: 'Insulin mimicker, anti-catabolic on low carb', tier: 'optimal' },
  ],
}

// ─── Sleep protocol ───

const SLEEP_PROTOCOL: SupplementStack = {
  category: 'Sleep Protocol',
  items: [
    { name: 'Magnesium (Glycinate)', dose: 'Up to 800mg female / 1400mg male', timing: 'Last meal + before bed', notes: '4 chelate forms if using UberMag', tier: 'essential' },
    { name: 'Melatonin', dose: '1-5mg', timing: '30-60 min before bed', tier: 'recommended' },
    { name: 'Taurine', dose: '1-3g', timing: 'Before bed', notes: 'GABA precursor, nervous system calming', tier: 'recommended' },
    { name: '5-HTP', dose: '200-500mg', timing: 'Before bed', notes: 'Serotonin precursor', tier: 'optimal' },
  ],
}

// ─── Contest prep supplements (Norton) ───

const CONTEST_PREP_STACK: SupplementStack = {
  category: 'Contest Prep Essentials',
  items: [
    { name: 'Creatine Monohydrate', dose: '3-5g/day', timing: 'Daily — do not load or cut', notes: 'Maintain throughout prep and peak week', tier: 'essential' },
    { name: 'Caffeine', dose: '3-6mg/kg', timing: '60 min pre-workout', notes: 'Take week-long breaks with deloads', tier: 'essential' },
    { name: 'Fish Oil (EPA/DHA)', dose: '1860mg EPA + 1500mg DHA', timing: 'With meals', notes: 'Anti-catabolic, enhances meal anabolism', tier: 'essential' },
    { name: 'Beta-Alanine', dose: '3-6g/day', timing: 'Daily (builds up over time)', tier: 'recommended' },
    { name: 'Citrulline', dose: '6-8g pre-WO + 2-4g other times', timing: '1-2hr pre-exercise', notes: 'Reduces soreness, improves performance', tier: 'recommended' },
    { name: 'Melatonin', dose: '3-5mg', timing: '30-60 min before bed', notes: 'Sleep + small positive effect on fat loss/leptin', tier: 'recommended' },
    { name: 'Vitamin D3', dose: '1000-3000 IU', timing: 'Daily', notes: 'Low D = reduced testosterone', tier: 'recommended' },
    { name: 'Tart Cherry Extract', dose: '480mg/day', timing: 'Daily', notes: '4x soreness reduction. Takes ~1 week to build up', tier: 'optimal' },
    { name: 'Rhodiola Rosea', dose: '300-600mg', timing: 'Pre-workout or daily', notes: 'Use during caffeine breaks. Do NOT exceed 600mg', tier: 'optimal' },
    { name: 'HMB', dose: '3g/day', timing: 'Pre-training', notes: 'Anti-catabolic — more useful during deficit', tier: 'optimal' },
  ],
}

// ─── HIIT-specific supplements ───

const HIIT_STACK: SupplementStack = {
  category: 'HIIT Cardio',
  items: [
    { name: 'Electrolytes', dose: '1 serving', timing: 'Post-HIIT', tier: 'essential' },
    { name: 'BCAAs', dose: '4% of BW in lbs = grams', timing: 'Pre-HIIT', notes: 'e.g. 200lb = 8g', tier: 'recommended' },
    { name: 'Glutamine', dose: '5-10g', timing: 'Immediately post-HIIT', tier: 'recommended' },
    { name: 'Alpha GPC', dose: '150-600mg', timing: '15-30 min pre-HIIT', tier: 'optimal' },
    { name: 'ALCAR', dose: '500-2000mg', timing: '15-30 min pre-HIIT', tier: 'optimal' },
    { name: 'Glycine', dose: '2-10g', timing: 'Immediately post-HIIT', tier: 'optimal' },
    { name: 'Taurine', dose: '1-3g', timing: 'Post-HIIT', tier: 'optimal' },
  ],
}

// ─── Specialisation protocols ───

const INSULIN_SENSITIVITY: SupplementStack = {
  category: 'Insulin Sensitivity Protocol',
  items: [
    { name: 'Fenugreek', dose: '1000mg extract with carb meals', timing: 'With carb-containing meals', notes: 'Or 1 heaping tsp ground seed', tier: 'recommended' },
    { name: 'R-ALA (Alpha Lipoic Acid)', dose: '200-400mg', timing: 'Post-workout + with carb meals', notes: 'Insulin mimicker for glucose uptake', tier: 'optimal' },
    { name: 'Chromium Polynicotinate', dose: '400-600mg/day', timing: 'With meals', tier: 'optimal' },
  ],
}

const TESTOSTERONE_SUPPORT: SupplementStack = {
  category: 'Testosterone Support',
  items: [
    { name: 'Zinc', dose: '120mg female / 180mg male', timing: 'Spread with meals', tier: 'recommended' },
    { name: 'Boron', dose: '10mg/day', timing: 'With breakfast', notes: '2.5mg insufficient. Increases free T, decreases estradiol', tier: 'recommended' },
    { name: 'Ashwagandha', dose: '300mg 2x/day', timing: 'Morning + pre-workout', notes: 'May increase strength, T, reduce muscle damage', tier: 'recommended' },
    { name: 'GPLC (Glycocarn)', dose: '1-2g', timing: 'Pre-workout', notes: 'Androgen receptor density + vasodilation', tier: 'optimal' },
    { name: 'Pantethine', dose: '200-300mg 3x/day', timing: 'With meals', notes: 'Activated B5, restores pregnenolone production', tier: 'optimal' },
  ],
}

const ESTROGEN_DETOX: SupplementStack = {
  category: 'Estrogen Detoxification',
  items: [
    { name: 'DIM', dose: '75-150mg', timing: 'Spread throughout day', notes: 'Blocks aromatase, optimise T:E ratio', tier: 'recommended' },
    { name: 'Calcium D-Glucarate', dose: '2 caps 3x/day start, then 2/day', timing: 'With meals', notes: 'Inhibits estrogen reabsorption in colon', tier: 'optimal' },
    { name: 'Sulforaphane', dose: '30-50mg/day', timing: 'With meals', notes: 'From broccoli sprouts — eat raw for bioavailability', tier: 'optimal' },
    { name: 'Green Tea Extract / Resveratrol', dose: 'Per label', timing: 'With meals', notes: 'Gene expression for estrogen production', tier: 'optimal' },
    { name: 'Primal Fiber', dose: '2 TBSP', timing: 'Before breakfast + after dinner', notes: 'Probiotic + fibre for estrogen elimination', tier: 'optimal' },
  ],
}

const ADRENAL_RECOVERY: SupplementStack = {
  category: 'Adrenal Recovery',
  items: [
    { name: 'Vitamin C (Buffered)', dose: '2-6g/day divided', timing: 'With meals + post-WO', notes: 'Adrenal support baseline', tier: 'essential' },
    { name: 'Magnesium', dose: '800-1200mg+', timing: 'PM + with meals', tier: 'essential' },
    { name: 'Rhodiola Rosea', dose: '50-300mg', timing: 'Morning', notes: 'Decreases fatigue perception', tier: 'recommended' },
    { name: 'Taurine', dose: '3g', timing: 'Afternoon/evening meals', notes: 'Calming, helps sleep', tier: 'recommended' },
  ],
}

// ─── MI40 phase-specific adjustments ───

const MI40_PHASE_ADJUSTMENTS: Record<string, SupplementStack> = {
  'Phase 1-2 (High Frequency)': {
    category: 'MI40 Phase 1-2 Additions',
    items: [
      { name: 'Glutamine (extra)', dose: '+5-10g', timing: 'Post-workout', notes: 'High frequency recovery demand', tier: 'recommended' },
      { name: 'Naps', dose: '20-30 min', timing: 'Post-training if possible', notes: 'Recovery priority', tier: 'essential' },
    ],
  },
  'Phase 3 (Power/Hypertrophy)': {
    category: 'MI40 Phase 3 Additions',
    items: [
      { name: 'Caffeine (increase)', dose: 'Increase by 50-100mg', timing: 'Pre-workout', notes: 'Heavier loads demand more neural drive', tier: 'essential' },
      { name: 'Greens in electrolyte water', dose: '1 serving', timing: 'Pre-training', notes: 'Alkalise before heavy session', tier: 'recommended' },
    ],
  },
  'Phase 5 (De-Load)': {
    category: 'MI40 Phase 5 Additions',
    items: [
      { name: 'Allostatic Stamina / Adaptogens', dose: '3 caps', timing: 'First 2 meals', notes: 'Adrenal rebuild during deload', tier: 'optimal' },
    ],
  },
  'Phase 6 (Overreaching)': {
    category: 'MI40 Phase 6 Additions',
    items: [
      { name: 'Glutamine (extra)', dose: '+10-20g', timing: 'Post-workout + with greens', notes: 'Extreme volume recovery', tier: 'recommended' },
      { name: 'Vitamin C (Buffered)', dose: '2g', timing: 'Post each workout', tier: 'recommended' },
      { name: 'Magnesium (extra)', dose: '+200-400mg', timing: 'PM', tier: 'recommended' },
      { name: 'Leucine (extra)', dose: '+2g', timing: 'All meals except breakfast', tier: 'optimal' },
    ],
  },
}

// ─── Main: get supplement stacks for current context ───

export function getSupplementStacks(
  philosophy: string,
  phase: string,
  goal: string,
  bodyFatPercent: number,
  sex: 'male' | 'female'
): SupplementStack[] {
  const stacks: SupplementStack[] = [DAILY_FOUNDATION]

  const isReset = phase.toLowerCase().includes('reset') || phase.toLowerCase().includes('cut') || phase.toLowerCase().includes('shred')
  const isGrowth = phase.toLowerCase().includes('growth') || phase.toLowerCase().includes('bulk')
  const isContestPrep = goal === 'contest-prep' || philosophy === 'contest-prep'

  // Phase-specific workout supplements
  if (isContestPrep) {
    stacks.push(CONTEST_PREP_STACK)
    stacks.push(RESET_PRE_WORKOUT)
    stacks.push(RESET_POST_WORKOUT)
  } else if (isReset) {
    stacks.push(RESET_PRE_WORKOUT)
    stacks.push(RESET_POST_WORKOUT)
    stacks.push(RESET_DURING_DAY)
    stacks.push(HIIT_STACK)
  } else {
    stacks.push(GROWTH_PRE_WORKOUT)
    stacks.push(GROWTH_POST_WORKOUT)
  }

  // Sleep always
  stacks.push(SLEEP_PROTOCOL)

  // MI40 phase-specific
  if (philosophy === 'mi40' && MI40_PHASE_ADJUSTMENTS[phase]) {
    stacks.push(MI40_PHASE_ADJUSTMENTS[phase])
  }

  // Goal-specific add-ons
  const needsInsulinHelp = (sex === 'male' && bodyFatPercent > 12) || (sex === 'female' && bodyFatPercent > 20)
  if (needsInsulinHelp) {
    stacks.push(INSULIN_SENSITIVITY)
  }

  if (isGrowth && sex === 'male') {
    stacks.push(TESTOSTERONE_SUPPORT)
  }

  if ((sex === 'male' && bodyFatPercent > 15) || (sex === 'female' && bodyFatPercent > 22)) {
    stacks.push(ESTROGEN_DETOX)
  }

  if (isReset || isContestPrep) {
    stacks.push(ADRENAL_RECOVERY)
  }

  return stacks
}
