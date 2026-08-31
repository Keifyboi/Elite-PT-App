import type { UserProfile, WeeklyCheckIn } from './types'
import { calculateLBM } from './nutrition-engine'

export interface ReadinessAssessment {
  eligible: boolean
  score: number // 0-100
  verdict: 'ready' | 'almost' | 'not-ready' | 'locked'
  verdictLabel: string
  checks: ReadinessCheck[]
  recommendation: string
  requiredActions: string[]
  estimatedWeeksUntilReady: number | null
}

interface ReadinessCheck {
  label: string
  passed: boolean
  value: string
  threshold: string
  severity: 'critical' | 'warning' | 'info'
  detail: string
}

export function assessContestReadiness(
  profile: UserProfile,
  checkIns: WeeklyCheckIn[]
): ReadinessAssessment {
  const sorted = [...checkIns].sort((a, b) => b.weekNumber - a.weekNumber)
  const checks: ReadinessCheck[] = []
  const requiredActions: string[] = []

  const isMale = profile.sex === 'male'
  const bfThreshold = isMale ? 12 : 20
  const idealStart = isMale ? 10 : 18

  // ─── 1. Body fat threshold ───
  const bfPassed = profile.bodyFatPercent <= bfThreshold
  checks.push({
    label: 'Body fat threshold',
    passed: bfPassed,
    value: `${profile.bodyFatPercent}%`,
    threshold: `≤${bfThreshold}%`,
    severity: 'critical',
    detail: bfPassed
      ? `At ${profile.bodyFatPercent}% you're lean enough to start prep`
      : `Need to reach ${bfThreshold}% before prep is viable. Currently ${(profile.bodyFatPercent - bfThreshold).toFixed(1)}% above threshold`,
  })
  if (!bfPassed) requiredActions.push(`Continue cutting to ${bfThreshold}%`)

  // ─── 2. Continuous dieting duration ───
  // Check how many consecutive weeks of weight loss (no maintenance breaks)
  let consecutiveDietWeeks = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    const loss = sorted[i + 1].weightKg - sorted[i].weightKg
    // Allow up to 0.5kg gain (water/glycogen fluctuation from refeeds) without breaking the streak
    if (loss >= -0.5) consecutiveDietWeeks++
    else break
  }
  const dietTooLong = consecutiveDietWeeks > 12
  const dietModerate = consecutiveDietWeeks > 8 && consecutiveDietWeeks <= 12
  checks.push({
    label: 'Continuous dieting duration',
    passed: !dietTooLong,
    value: `${consecutiveDietWeeks} weeks`,
    threshold: '≤12 weeks without a break',
    severity: dietTooLong ? 'critical' : dietModerate ? 'warning' : 'info',
    detail: dietTooLong
      ? `${consecutiveDietWeeks} weeks of continuous deficit — metabolic adaptation likely significant. MATADOR research shows diet breaks every 2-4 weeks preserve metabolic rate`
      : dietModerate
        ? `${consecutiveDietWeeks} weeks dieting — consider a maintenance phase before starting prep`
        : `${consecutiveDietWeeks} weeks — sustainable dieting duration`,
  })
  if (dietTooLong) requiredActions.push('Complete a 2-4 week maintenance phase (diet break) before starting prep')

  // ─── 3. Recent weight loss magnitude ───
  let totalRecentLoss = 0
  if (sorted.length >= 2) {
    const oldestRecent = sorted[Math.min(sorted.length - 1, 11)]
    totalRecentLoss = oldestRecent.weightKg - sorted[0].weightKg
  }
  const lostTooMuch = totalRecentLoss > 15
  const lostSignificant = totalRecentLoss > 10
  checks.push({
    label: 'Recent weight loss',
    passed: !lostTooMuch,
    value: `${totalRecentLoss.toFixed(1)} kg in ${Math.min(sorted.length, 12)} weeks`,
    threshold: '≤10-15kg before maintenance',
    severity: lostTooMuch ? 'critical' : lostSignificant ? 'warning' : 'info',
    detail: lostTooMuch
      ? `Lost ${totalRecentLoss.toFixed(1)}kg — body is fatigued, metabolism adapted, hormones suppressed. Need a full reverse diet + maintenance period before prep`
      : lostSignificant
        ? `Lost ${totalRecentLoss.toFixed(1)}kg — significant loss. A maintenance phase will help restore metabolic rate before prep`
        : totalRecentLoss > 0
          ? `${totalRecentLoss.toFixed(1)}kg lost — within manageable range`
          : 'No significant recent weight loss',
  })
  if (lostTooMuch) requiredActions.push('Complete a reverse diet (2-10% weekly calorie increases) back to maintenance')

  // ─── 4. Maintenance period since last cut ───
  let weeksAtMaintenance = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    const change = Math.abs(sorted[i].weightKg - sorted[i + 1].weightKg)
    if (change < 0.3) weeksAtMaintenance++
    else break
  }
  const hadMaintenance = weeksAtMaintenance >= 4
  const noMaintenance = weeksAtMaintenance < 2 && consecutiveDietWeeks > 6
  checks.push({
    label: 'Maintenance period',
    passed: hadMaintenance || consecutiveDietWeeks <= 4,
    value: `${weeksAtMaintenance} weeks at maintenance`,
    threshold: '≥4 weeks at maintenance before prep',
    severity: noMaintenance ? 'critical' : !hadMaintenance && consecutiveDietWeeks > 4 ? 'warning' : 'info',
    detail: hadMaintenance
      ? `${weeksAtMaintenance} weeks at maintenance — metabolism has had time to recover`
      : noMaintenance
        ? 'No recent maintenance period after extended dieting — hormones, NEAT, and metabolic rate need time to normalise'
        : consecutiveDietWeeks <= 4
          ? 'Short recent diet — maintenance period not critical'
          : `Only ${weeksAtMaintenance} weeks at maintenance — ideally need 4+`,
  })
  if (noMaintenance) requiredActions.push('Hold maintenance calories for 4-8 weeks to restore metabolic rate, NEAT, and hormonal function')

  // ─── 5. Subjective readiness (energy, mood, sleep) ───
  const latestSubjective = sorted[0]?.subjective
  if (latestSubjective) {
    const avgScore = (latestSubjective.energy + latestSubjective.mood + latestSubjective.sleep + latestSubjective.strength) / 4
    const subjectiveOk = avgScore >= 6
    checks.push({
      label: 'Subjective readiness',
      passed: subjectiveOk,
      value: `Avg ${avgScore.toFixed(1)}/10`,
      threshold: '≥6/10 average (energy, mood, sleep, strength)',
      severity: avgScore < 5 ? 'critical' : !subjectiveOk ? 'warning' : 'info',
      detail: avgScore < 5
        ? 'Energy, mood, and recovery are significantly compromised — you would struggle through prep and likely lose muscle'
        : !subjectiveOk
          ? 'Slightly below optimal — a few weeks of maintenance eating and reduced training stress would help'
          : 'Subjective scores indicate you are recovered and ready',
    })
    if (avgScore < 5) requiredActions.push('Focus on sleep, stress management, and adequate calories until energy/mood recover above 6/10')
  }

  // ─── 6. Rate of recent loss (metabolic adaptation indicator) ───
  if (sorted.length >= 3) {
    const recentRate = sorted.length >= 2 ? (sorted[1].weightKg - sorted[0].weightKg) : 0
    const previousRate = sorted.length >= 3 ? (sorted[2].weightKg - sorted[1].weightKg) : recentRate
    const rateSlowing = previousRate > 0 && recentRate > 0 && recentRate < previousRate * 0.5

    if (rateSlowing) {
      checks.push({
        label: 'Loss rate declining',
        passed: false,
        value: `${recentRate.toFixed(2)}kg/wk (was ${previousRate.toFixed(2)})`,
        threshold: 'Consistent loss rate',
        severity: 'warning',
        detail: 'Weight loss rate has halved — metabolic adaptation is occurring. Starting prep from this state means you\'ll need to drop calories very low, very quickly',
      })
      requiredActions.push('Reverse diet or maintain to restore metabolic rate before entering a new deficit')
    }
  }

  // ─── 7. LBM preservation check ───
  if (sorted.length >= 4) {
    const oldLbm = calculateLBM(sorted[sorted.length - 1].weightKg, sorted[sorted.length - 1].bodyFatPercent)
    const newLbm = calculateLBM(sorted[0].weightKg, sorted[0].bodyFatPercent)
    const lbmLoss = oldLbm - newLbm
    const totalLoss = sorted[sorted.length - 1].weightKg - sorted[0].weightKg
    const lbmPercent = totalLoss > 0 ? (lbmLoss / totalLoss) * 100 : 0

    if (lbmPercent > 35) {
      checks.push({
        label: 'Muscle preservation',
        passed: false,
        value: `${lbmPercent.toFixed(0)}% of weight lost was LBM`,
        threshold: '≤30% LBM loss (Norton benchmark: 28.7%)',
        severity: 'warning',
        detail: 'Losing too much muscle relative to fat — indicates the deficit is too aggressive, protein too low, or training volume insufficient. Prep from this state risks significant muscle loss',
      })
    }
  }

  // ─── Score and verdict ───
  const criticalFails = checks.filter(c => !c.passed && c.severity === 'critical').length
  const warningFails = checks.filter(c => !c.passed && c.severity === 'warning').length
  const totalChecks = checks.length
  const passedChecks = checks.filter(c => c.passed).length

  const score = Math.round((passedChecks / totalChecks) * 100)

  let verdict: ReadinessAssessment['verdict']
  let verdictLabel: string
  let recommendation: string

  if (!bfPassed) {
    verdict = 'locked'
    verdictLabel = 'Not Yet Available'
    recommendation = `Contest prep unlocks at ${bfThreshold}% body fat. Continue your current program — the app will notify you when you're eligible.`
  } else if (criticalFails > 0) {
    verdict = 'not-ready'
    verdictLabel = 'Not Recommended'
    recommendation = 'Your body needs recovery time before prep. Complete the required actions below — the app will reassess at each check-in.'
  } else if (warningFails > 1) {
    verdict = 'almost'
    verdictLabel = 'Proceed With Caution'
    recommendation = 'You can start prep but conditions aren\'t ideal. A 2-4 week maintenance phase would set you up for a more effective prep with less muscle loss.'
  } else {
    verdict = 'ready'
    verdictLabel = 'Ready for Prep'
    recommendation = profile.bodyFatPercent <= idealStart
      ? `At ${profile.bodyFatPercent}% you're in an ideal position to start prep. The lower you start, the less aggressive the deficit needs to be.`
      : `At ${profile.bodyFatPercent}% you're eligible. Starting at ${idealStart}% would be more comfortable but you can begin now.`
  }

  // Estimate weeks until ready (if not ready)
  let estimatedWeeksUntilReady: number | null = null
  if (verdict === 'locked') {
    const bfToLose = profile.bodyFatPercent - bfThreshold
    const weeklyBfLoss = 0.5
    estimatedWeeksUntilReady = Math.ceil(bfToLose / weeklyBfLoss)
  } else if (verdict === 'not-ready') {
    const maintenanceNeeded = noMaintenance ? 6 : 0
    const reverseNeeded = lostTooMuch ? 4 : 0
    estimatedWeeksUntilReady = Math.max(maintenanceNeeded, reverseNeeded)
  }

  return {
    eligible: verdict === 'ready' || verdict === 'almost',
    score,
    verdict,
    verdictLabel,
    checks,
    recommendation,
    requiredActions,
    estimatedWeeksUntilReady,
  }
}
