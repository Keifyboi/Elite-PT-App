import type { BodyPart, PosePriorityArea } from '../types'

// Curated exercise library for the pose-priority engine (Y3T/MI40/FST-7/PHAT/
// Corey-G). Sits alongside data/exercises.ts — those 5 philosophies draw from
// this list for the high-leverage pose-priority categories below, and from
// the general database for chest/quads/shoulders/arms and other standard
// groups per the usual selection logic.
export interface BodybuildingExercise {
  name: string
  bodyPart: BodyPart
  poseArea: PosePriorityArea
  role: 'primary' | 'detail'
  // Marks RDL-pattern stretch-position movements. Per Exercise Order Design
  // rule 3, these must be sequenced before general isolation work on
  // priority days — fatigue destroys stretch-position quality.
  movementQuality?: 'stretch-tie-in'
}

export const BODYBUILDING_EXERCISES: BodybuildingExercise[] = [
  // ─── Back Width ───
  { name: 'Weighted Pull-Ups (wide grip)', bodyPart: 'back-width', poseArea: 'back-width', role: 'primary' },
  { name: 'Lat Pulldown (wide grip, straight bar)', bodyPart: 'back-width', poseArea: 'back-width', role: 'primary' },
  { name: 'Single-Arm Lat Pulldown', bodyPart: 'back-width', poseArea: 'back-width', role: 'primary' },
  { name: 'Straight-Arm Pulldown', bodyPart: 'back-width', poseArea: 'back-width', role: 'detail' },
  { name: 'Dumbbell Pullover', bodyPart: 'back-width', poseArea: 'back-width', role: 'detail' },
  { name: 'Cross-Body Cable Pulldown', bodyPart: 'back-width', poseArea: 'back-width', role: 'detail' },

  // ─── Back Thickness ───
  { name: 'Barbell Bent-Over Row', bodyPart: 'back-thickness', poseArea: 'back-thickness', role: 'primary' },
  { name: 'Chest-Supported Row', bodyPart: 'back-thickness', poseArea: 'back-thickness', role: 'primary' },
  { name: 'T-Bar Row', bodyPart: 'back-thickness', poseArea: 'back-thickness', role: 'primary' },
  { name: 'Seal Row', bodyPart: 'back-thickness', poseArea: 'back-thickness', role: 'detail' },
  { name: 'Single-Arm Dumbbell Row', bodyPart: 'back-thickness', poseArea: 'back-thickness', role: 'detail' },
  { name: 'Meadows Row', bodyPart: 'back-thickness', poseArea: 'back-thickness', role: 'detail' },

  // ─── Traps ───
  { name: 'Barbell Shrugs', bodyPart: 'traps', poseArea: 'traps', role: 'primary' },
  { name: 'Trap Bar Shrugs', bodyPart: 'traps', poseArea: 'traps', role: 'primary' },
  { name: 'Dumbbell Shrugs', bodyPart: 'traps', poseArea: 'traps', role: 'detail' },
  { name: "Farmer's Carry", bodyPart: 'traps', poseArea: 'traps', role: 'detail' },
  { name: 'Face Pulls', bodyPart: 'traps', poseArea: 'traps', role: 'detail' },

  // ─── Serratus ───
  { name: 'Weighted Hanging Leg Raise with Pelvic Tilt', bodyPart: 'abs', poseArea: 'serratus', role: 'primary' },
  { name: 'Cable Pull-Over (high-to-low)', bodyPart: 'back-width', poseArea: 'serratus', role: 'primary' },
  { name: 'Landmine Press', bodyPart: 'shoulders', poseArea: 'serratus', role: 'detail' },
  { name: 'Standing Cable Crunch', bodyPart: 'abs', poseArea: 'serratus', role: 'detail' },

  // ─── Hamstring-Glute Tie-In ───
  { name: 'Romanian Deadlift', bodyPart: 'hamstrings', poseArea: 'hamstring-glute-tie-in', role: 'primary', movementQuality: 'stretch-tie-in' },
  { name: 'Stiff-Leg Deadlift', bodyPart: 'hamstrings', poseArea: 'hamstring-glute-tie-in', role: 'primary', movementQuality: 'stretch-tie-in' },
  { name: 'Seated Leg Curl', bodyPart: 'hamstrings', poseArea: 'hamstring-glute-tie-in', role: 'detail' },
  { name: 'Single-Leg RDL', bodyPart: 'hamstrings', poseArea: 'hamstring-glute-tie-in', role: 'detail', movementQuality: 'stretch-tie-in' },
  { name: '45° Back Extension', bodyPart: 'hamstrings', poseArea: 'hamstring-glute-tie-in', role: 'detail' },
  { name: 'Cable Pull-Through', bodyPart: 'hamstrings', poseArea: 'hamstring-glute-tie-in', role: 'detail', movementQuality: 'stretch-tie-in' },

  // ─── Calves ───
  { name: 'Standing Calf Raise', bodyPart: 'calves', poseArea: 'calves', role: 'primary' },
  { name: 'Seated Calf Raise', bodyPart: 'calves', poseArea: 'calves', role: 'primary' },
  { name: 'Donkey Calf Raise', bodyPart: 'calves', poseArea: 'calves', role: 'detail' },
  { name: 'Single-Leg Calf Raise', bodyPart: 'calves', poseArea: 'calves', role: 'detail' },
]

export function getExercisesForPoseArea(poseArea: PosePriorityArea): BodybuildingExercise[] {
  return BODYBUILDING_EXERCISES.filter(e => e.poseArea === poseArea)
}
