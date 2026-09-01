import type { CompetitionDivision } from '../types'

// Source: Layne Norton & Peter Baker — The Complete Contest Prep Guide
// (BioLayne LLC, 2018). Note: BIA typically over-reads. Use relative change,
// not absolute — no judge measures BF% onstage, visual assessment only.
export interface DivisionReference {
  label: string
  targetStageBodyFatPercent: number // used to size the cut (SETUP!C19)
  caliperTarget: string
  dxaTarget: string
  biaTarget: string
}

export const DIVISIONS: Record<CompetitionDivision, DivisionReference> = {
  'mens-bodybuilding': {
    label: "Men's Bodybuilding",
    targetStageBodyFatPercent: 3,
    caliperTarget: '2–4%',
    dxaTarget: '4–6%',
    biaTarget: '6–9%',
  },
  'mens-classic-physique': {
    label: "Men's Classic Physique",
    targetStageBodyFatPercent: 4,
    caliperTarget: '3–5%',
    dxaTarget: '5–7%',
    biaTarget: '7–10%',
  },
  'mens-physique': {
    label: "Men's Physique",
    targetStageBodyFatPercent: 5,
    caliperTarget: '4–6%',
    dxaTarget: '6–8%',
    biaTarget: '8–11%',
  },
  'womens-bodybuilding': {
    label: "Women's Bodybuilding",
    targetStageBodyFatPercent: 7,
    caliperTarget: '6–8%',
    dxaTarget: '8–11%',
    biaTarget: '10–13%',
  },
  'womens-physique': {
    label: "Women's Physique",
    targetStageBodyFatPercent: 8,
    caliperTarget: '7–9%',
    dxaTarget: '9–12%',
    biaTarget: '11–15%',
  },
  'womens-figure': {
    label: "Women's Figure",
    targetStageBodyFatPercent: 9,
    caliperTarget: '8–10%',
    dxaTarget: '10–13%',
    biaTarget: '10–15%',
  },
  'womens-fitness': {
    label: "Women's Fitness",
    targetStageBodyFatPercent: 9,
    caliperTarget: '8–10%',
    dxaTarget: '10–13%',
    biaTarget: '10–15%',
  },
  'womens-bikini': {
    label: "Women's Bikini",
    targetStageBodyFatPercent: 10.5,
    caliperTarget: '9–12%',
    dxaTarget: '11–14%',
    biaTarget: '12–15%',
  },
}
