import type { BodybuildingPhilosophy, PosePriorityArea } from './types'

// ─── Judging context: the 8 mandatory poses ───

export type MandatoryPose =
  | 'front-double-bicep'
  | 'front-lat-spread'
  | 'side-chest'
  | 'side-triceps'
  | 'back-double-bicep'
  | 'back-lat-spread'
  | 'abs-and-thighs'
  | 'most-muscular'

export interface PosePriorityMapEntry {
  label: string
  primaryAreas: string[]
  secondaryAreas: string[]
}

export const POSE_PRIORITY_MAP: Record<MandatoryPose, PosePriorityMapEntry> = {
  'front-double-bicep': { label: 'Front Double Bicep', primaryAreas: ['Biceps peak', 'Forearms', 'Side delts'], secondaryAreas: ['Lat width', 'Quad sweep', 'Abs'] },
  'front-lat-spread': { label: 'Front Lat Spread', primaryAreas: ['Lat width', 'Serratus'], secondaryAreas: ['Chest', 'Abs', 'Quads'] },
  'side-chest': { label: 'Side Chest', primaryAreas: ['Chest fullness/upper chest', 'Arm size'], secondaryAreas: ['Quad sweep', 'Calf diamond'] },
  'side-triceps': { label: 'Side Triceps', primaryAreas: ['Triceps horseshoe', 'Delts'], secondaryAreas: ['Calves', 'Hamstring-quad tie-in'] },
  'back-double-bicep': { label: 'Back Double Bicep', primaryAreas: ['Back width + thickness', 'Rear delts'], secondaryAreas: ['Hamstrings', 'Glutes', 'Calves'] },
  'back-lat-spread': { label: 'Back Lat Spread', primaryAreas: ['Lat width', 'Lower back (erectors)'], secondaryAreas: ['Hamstrings', 'Glutes'] },
  'abs-and-thighs': { label: 'Abs & Thighs', primaryAreas: ['Ab/serratus detail', 'Quad separation'], secondaryAreas: ['Hamstring tie-in', 'Obliques'] },
  'most-muscular': { label: 'Most Muscular', primaryAreas: ['Traps', 'Chest', 'Delts', 'Serratus'], secondaryAreas: ['Overall density/hardness'] },
}

// ─── Technique → Mechanism ───
// What each block-level philosophy naturally trains well, and what it must
// compensate for via exercise selection rather than by switching technique.
// strongFor/weakFor are limited to the 6 tracked PosePriorityArea values —
// the spec names other qualities (raw load progression, CNS output, pump)
// that aren't pose-priority areas, so those are left out rather than forced in.

export interface TechniqueMechanism {
  mechanism: string
  strongFor: PosePriorityArea[]
  weakFor: PosePriorityArea[]
}

export const TECHNIQUE_MECHANISM: Record<BodybuildingPhilosophy, TechniqueMechanism> = {
  y3t: {
    mechanism: 'Weekly heavy (6-8) / moderate (10-12) / light (15-20) rep rotation',
    strongFor: ['back-thickness', 'hamstring-glute-tie-in'],
    weakFor: ['serratus'],
  },
  mi40: {
    mechanism: 'Intra-set stretch + peak-contraction holds, mind-muscle',
    strongFor: ['hamstring-glute-tie-in', 'back-width', 'serratus'],
    weakFor: [],
  },
  fst7: {
    mechanism: 'Short-rest (30-45s) high-rep finishing sets, fascia stretch via pump',
    strongFor: ['serratus', 'calves'],
    weakFor: ['traps', 'back-thickness'],
  },
  'corey-g': {
    mechanism: 'Giant sets, high density, minimal rest between exercises',
    strongFor: ['calves'],
    weakFor: [],
  },
  phat: {
    mechanism: 'Power slot (low-rep, heavy) + hypertrophy slot in the same session',
    strongFor: ['traps', 'back-thickness'],
    weakFor: [],
  },
}

// ─── Pose-Priority Area Coverage Across a Full Macrocycle ───
// Because only one philosophy runs at a time, coverage is achieved across a
// sequence of blocks, not within any single block. `servedBy` = philosophies
// that actively develop the area (not just avoid losing it); `maintainedBy` =
// philosophies that hold it at maintenance volume while a different block
// is the active priority.

export interface CoverageEntry {
  servedBy: BodybuildingPhilosophy[]
  maintainedBy: BodybuildingPhilosophy[]
}

export const MACROCYCLE_COVERAGE: Record<PosePriorityArea, CoverageEntry> = {
  'back-width': { servedBy: ['y3t', 'phat', 'mi40'], maintainedBy: [] },
  'back-thickness': { servedBy: ['phat', 'y3t'], maintainedBy: ['fst7'] },
  traps: { servedBy: ['phat'], maintainedBy: ['fst7', 'mi40'] },
  serratus: { servedBy: ['mi40'], maintainedBy: ['fst7'] },
  'hamstring-glute-tie-in': { servedBy: ['mi40', 'y3t', 'phat'], maintainedBy: [] },
  calves: { servedBy: ['fst7', 'corey-g'], maintainedBy: ['y3t', 'mi40', 'phat'] },
}
