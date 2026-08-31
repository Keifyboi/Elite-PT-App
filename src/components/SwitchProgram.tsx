'use client'

import { useState, useEffect } from 'react'
import type { UserProfile } from '@/lib/types'
import { getProfile, saveProfile, getCheckIns, getRollingCompetencyScore } from '@/lib/storage'
import { contestPrepTimeline, calculateMacros, calculateLBM } from '@/lib/nutrition-engine'
import { prescribeStrategy } from '@/lib/prescribe-strategy'
import { assessContestReadiness, type ReadinessAssessment } from '@/lib/contest-readiness'

interface ContestDetails {
  showDate: string
  division: 'mens-bodybuilding' | 'classic-physique' | 'mens-physique' | 'bikini' | 'figure' | 'womens-physique'
}

const DIVISIONS = [
  { id: 'mens-bodybuilding' as const, label: "Men's Bodybuilding", targetBf: 5 },
  { id: 'classic-physique' as const, label: 'Classic Physique', targetBf: 6 },
  { id: 'mens-physique' as const, label: "Men's Physique", targetBf: 7 },
  { id: 'womens-physique' as const, label: "Women's Physique", targetBf: 10 },
  { id: 'figure' as const, label: 'Figure', targetBf: 11 },
  { id: 'bikini' as const, label: 'Bikini', targetBf: 12 },
]

export default function SwitchProgram({ onComplete, onCancel }: { onComplete: () => void; onCancel: () => void }) {
  const profile = getProfile()
  const [step, setStep] = useState<'goal' | 'contest' | 'review'>('goal')
  const [goal, setGoal] = useState<'bulk' | 'cut' | 'maintain' | 'contest-prep'>(profile?.goal ?? 'cut')
  const [contest, setContest] = useState<ContestDetails>({ showDate: '', division: 'mens-bodybuilding' })
  const [readiness, setReadiness] = useState<ReadinessAssessment | null>(null)
  const [showReadiness, setShowReadiness] = useState(false)
  const [rollingScore, setRollingScore] = useState<number | null | undefined>(undefined)

  useEffect(() => {
    if (profile) {
      const cis = getCheckIns().sort((a, b) => b.weekNumber - a.weekNumber)
      setReadiness(assessContestReadiness(profile, cis))
    }
    setRollingScore(getRollingCompetencyScore())
  }, [])

  if (!profile) return null

  const lbm = calculateLBM(profile.weightKg, profile.bodyFatPercent)

  const handleGoalNext = () => {
    if (goal === 'contest-prep') {
      if (readiness && !readiness.eligible) {
        setShowReadiness(true)
        return
      }
      setStep('contest')
    } else {
      setStep('review')
    }
  }

  const getStrategy = () => {
    return prescribeStrategy(
      profile.age, profile.sex, profile.heightCm, profile.weightKg,
      profile.bodyFatPercent, goal, profile.occupation ?? 'sedentary'
    )
  }

  const getContestTimeline = () => {
    const div = DIVISIONS.find(d => d.id === contest.division)
    const targetBf = div?.targetBf ?? 5
    const timeline = contestPrepTimeline(profile.weightKg, profile.bodyFatPercent, targetBf)

    const showDateObj = contest.showDate ? new Date(contest.showDate) : null
    const today = new Date()
    const weeksAvailable = showDateObj ? Math.floor((showDateObj.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000)) : null

    return { ...timeline, targetBf, weeksAvailable, showDateObj }
  }

  const handleSwitch = () => {
    const strategy = getStrategy()
    const updated: UserProfile = {
      ...profile,
      goal: strategy.goal,
      trainingPhilosophy: strategy.philosophy,
      currentPhase: strategy.startingPhase,
      trainingDaysPerWeek: strategy.trainingDaysPerWeek,
      dailyStepTarget: strategy.stepsTarget,
    }
    saveProfile(updated)
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
      <div className="max-w-md mx-auto px-5 pt-6 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 18, letterSpacing: '0.06em' }}>SWITCH PROGRAM</h2>
          <button onClick={onCancel} className="text-[var(--muted)] text-sm">Cancel</button>
        </div>

        {/* Current stats summary */}
        <div className="bg-[var(--card)] p-3 border border-[var(--card-border)] mb-4">
          <p className="text-[10px] text-[var(--muted)] mb-1">CURRENT STATS (from latest data)</p>
          <div className="flex justify-between text-xs">
            <span>{profile.weightKg}kg · {profile.bodyFatPercent}% BF · {lbm.toFixed(1)}kg LBM</span>
            <span className="text-[var(--accent)]">{profile.currentPhase}</span>
          </div>
        </div>

        {/* ─── Step 1: Pick new goal ─── */}
        {step === 'goal' && !showReadiness && (
          <div className="space-y-3">
            {/* Readiness score banner */}
            <div className="bg-[var(--card)] p-3 border border-[var(--card-border)]">
              <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 12, letterSpacing: '0.06em', color: 'var(--muted-bright)' }}>READINESS</p>
              {rollingScore === undefined ? null : rollingScore === null ? (
                <p className="text-[10px] text-[var(--muted)] mt-1">LOG 2+ WEEKLY SCORES TO UNLOCK NEXT PHASE</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-[var(--surface)]" style={{ border: '1px solid var(--card-border)' }}>
                      <div style={{ width: `${(rollingScore / 25) * 100}%`, height: '100%', background: rollingScore >= 20 ? 'var(--accent)' : 'var(--muted-bright)', borderRadius: 0 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.04em', color: rollingScore >= 20 ? 'var(--accent)' : 'var(--foreground)' }}>{rollingScore.toFixed(1)}/25</span>
                  </div>
                  <p className="text-[9px] text-[var(--muted)] mt-0.5">Based on last 3 check-ins</p>
                </>
              )}
            </div>
            <p className="text-xs text-[var(--muted)]">What are you switching to?</p>
            {([
              { id: 'cut' as const, title: 'Lose Fat', desc: 'Get leaner while keeping muscle' },
              { id: 'bulk' as const, title: 'Build Muscle', desc: 'Add size with minimal fat gain' },
              { id: 'maintain' as const, title: 'Maintain / Recomp', desc: 'Hold position, improve composition' },
            ]).map(g => (
              <button key={g.id} onClick={() => setGoal(g.id)}
                className={`w-full text-left p-3 transition-colors ${
                  goal === g.id ? 'bg-[var(--accent-glow)] text-[var(--accent)]' : 'bg-[var(--card)]'
                }`}
                style={{ border: goal === g.id ? '2px solid var(--accent)' : '1px solid var(--card-border)' }}>
                <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 15, letterSpacing: '0.06em' }}>{g.title.toUpperCase()}</p>
                <p className="text-[10px] text-[var(--muted)]">{g.desc}</p>
              </button>
            ))}

            {/* Contest Prep — gated by both readiness and competency score */}
            {(() => {
              const competencyLocked = rollingScore === undefined ? false : rollingScore === null || rollingScore < 20
              return (
                <button
                  onClick={() => {
                    if (competencyLocked) return
                    setGoal('contest-prep')
                    if (readiness && !readiness.eligible) setShowReadiness(true)
                  }}
                  className={`w-full text-left p-3 transition-colors ${
                    goal === 'contest-prep' ? 'bg-[var(--accent-glow)] text-[var(--accent)]' : 'bg-[var(--card)]'
                  }`}
                  style={{
                    border: goal === 'contest-prep' ? '2px solid var(--accent)' : '1px solid var(--card-border)',
                    opacity: competencyLocked ? 0.4 : 1,
                    pointerEvents: competencyLocked ? 'none' : undefined,
                  }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 15, letterSpacing: '0.06em' }}>CONTEST PREP</p>
                      <p className="text-[10px] text-[var(--muted)]">Prepare for competition</p>
                      {competencyLocked && (
                        <p className="text-[10px] text-[var(--muted)] mt-0.5">
                          {rollingScore === null ? 'LOG 2+ WEEKLY SCORES TO UNLOCK' : '🔒 Score ≥20/25 required'}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {competencyLocked && (
                        <span className="text-[10px] text-[var(--muted)]">🔒</span>
                      )}
                      {readiness && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          readiness.verdict === 'ready' ? 'bg-[var(--success)]/20 text-[var(--success)]' :
                          readiness.verdict === 'almost' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' :
                          readiness.verdict === 'not-ready' ? 'bg-[var(--danger)]/20 text-[var(--danger)]' :
                          'bg-[var(--card-border)] text-[var(--muted)]'
                        }`}>{readiness.score}% ready</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })()}
          </div>
        )}

        {/* ─── Readiness Assessment (shown when contest prep selected but not eligible) ─── */}
        {step === 'goal' && showReadiness && readiness && (
          <div className="space-y-3">
            <button onClick={() => setShowReadiness(false)} className="text-[10px] text-[var(--accent)] font-bold">
              ← Back to goals
            </button>

            <div className={`p-4 border ${
              readiness.verdict === 'ready' ? 'bg-[var(--success)]/10 border-[var(--success)]' :
              readiness.verdict === 'almost' ? 'bg-[var(--accent)]/10 border-[var(--accent)]' :
              'bg-[var(--danger)]/10 border-[var(--danger)]'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <h3 style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 15, letterSpacing: '0.06em' }}>CONTEST PREP READINESS</h3>
                <div className="text-right">
                  <p className={`text-base font-bold tabular-nums ${
                    readiness.verdict === 'ready' ? 'text-[var(--success)]' :
                    readiness.verdict === 'almost' ? 'text-[var(--accent)]' :
                    'text-[var(--danger)]'
                  }`}>{readiness.score}%</p>
                  <p className="text-[9px] text-[var(--muted)]">{readiness.verdictLabel}</p>
                </div>
              </div>
              <p className="text-xs mb-3">{readiness.recommendation}</p>
            </div>

            {/* Individual checks */}
            <div className="space-y-2">
              {readiness.checks.map((check, i) => (
                <div key={i} className={`bg-[var(--card)] p-3 border ${
                  check.passed ? 'border-[var(--card-border)]' : check.severity === 'critical' ? 'border-[var(--danger)]' : 'border-[var(--accent)]'
                }`}>
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-xs font-bold">{check.passed ? '✓' : '✗'} {check.label}</p>
                    <p className={`text-[10px] font-bold ${check.passed ? 'text-[var(--success)]' : check.severity === 'critical' ? 'text-[var(--danger)]' : 'text-[var(--accent)]'}`}>
                      {check.value}
                    </p>
                  </div>
                  <p className="text-[9px] text-[var(--muted)]">{check.detail}</p>
                  {!check.passed && <p className="text-[9px] text-[var(--muted)] mt-0.5">Threshold: {check.threshold}</p>}
                </div>
              ))}
            </div>

            {/* Required actions */}
            {readiness.requiredActions.length > 0 && (
              <div className="bg-[var(--card)] p-4 border border-[var(--card-border)]">
                <p className="text-[10px] text-[var(--accent)] font-bold mb-2">WHAT NEEDS TO HAPPEN FIRST</p>
                <ul className="space-y-1.5">
                  {readiness.requiredActions.map((a, i) => (
                    <li key={i} className="text-xs">→ {a}</li>
                  ))}
                </ul>
                {readiness.estimatedWeeksUntilReady !== null && (
                  <p className="text-xs text-[var(--accent)] font-bold mt-2">
                    Estimated {readiness.estimatedWeeksUntilReady} weeks until eligible
                  </p>
                )}
              </div>
            )}

            {/* Override for "almost ready" */}
            {readiness.verdict === 'almost' && (
              <button onClick={() => { setShowReadiness(false); setStep('contest') }}
                className="w-full bg-[var(--accent)] text-black py-3"
                style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.08em' }}>
                PROCEED ANYWAY
              </button>
            )}
          </div>
        )}

        {/* ─── Step 2: Contest details (only if contest prep) ─── */}
        {step === 'contest' && (
          <div className="space-y-4">
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>SHOW DETAILS</h3>
              <p className="text-xs text-[var(--muted)]">When and what division?</p>
            </div>

            <div>
              <label className="text-xs text-[var(--muted)] block mb-1">Show Date</label>
              <input type="date" value={contest.showDate}
                onChange={e => setContest({ ...contest, showDate: e.target.value })}
                className="w-full bg-[var(--surface)] border border-[var(--card-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="text-xs text-[var(--muted)] block mb-1">Division</label>
              <div className="space-y-1.5">
                {DIVISIONS.filter(d => profile.sex === 'male' ? !['bikini', 'figure', 'womens-physique'].includes(d.id) : !['mens-bodybuilding', 'classic-physique', 'mens-physique'].includes(d.id))
                  .map(d => (
                  <button key={d.id} onClick={() => setContest({ ...contest, division: d.id })}
                    className={`w-full text-left p-3 ${contest.division === d.id ? 'bg-[var(--accent-glow)] text-[var(--accent)]' : 'bg-[var(--card)]'}`}
                    style={{ border: contest.division === d.id ? '2px solid var(--accent)' : '1px solid var(--card-border)' }}>
                    <div className="flex justify-between">
                      <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 15, letterSpacing: '0.06em' }}>{d.label.toUpperCase()}</p>
                      <p className="text-[10px] text-[var(--muted)]">Target ~{d.targetBf}% BF</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline preview */}
            {contest.showDate && (() => {
              const t = getContestTimeline()
              const tooShort = t.weeksAvailable !== null && t.weeksAvailable < t.weeksRequired
              const comfortable = t.weeksAvailable !== null && t.weeksAvailable >= t.weeksRequired + 4

              return (
                <div className={`p-4 border ${tooShort ? 'bg-[var(--danger)]/10 border-[var(--danger)]' : 'bg-[var(--card)] border-[var(--card-border)]'}`}>
                  <p className="text-[10px] text-[var(--accent)] font-bold mb-2">PREP TIMELINE</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--muted)]">Current BF</span>
                      <span className="font-bold">{profile.bodyFatPercent}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--muted)]">Target BF</span>
                      <span className="font-bold">{t.targetBf}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--muted)]">Total to lose</span>
                      <span className="font-bold">{t.totalLossKg} kg</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--muted)]">Weekly loss rate</span>
                      <span className="font-bold">{t.weeklyLossKg} kg/week (0.6% BW)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--muted)]">Weeks needed</span>
                      <span className={`font-bold ${tooShort ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>{t.weeksRequired} weeks</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--muted)]">Weeks available</span>
                      <span className="font-bold">{t.weeksAvailable} weeks</span>
                    </div>
                    {t.weeksAvailable !== null && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--muted)]">Diet break buffer</span>
                        <span className={`font-bold ${comfortable ? 'text-[var(--success)]' : tooShort ? 'text-[var(--danger)]' : 'text-[var(--accent)]'}`}>
                          {t.weeksAvailable - t.weeksRequired} weeks
                        </span>
                      </div>
                    )}
                  </div>

                  {tooShort && (
                    <div className="mt-3 pt-2 border-t border-[var(--danger)]">
                      <p className="text-[10px] text-[var(--danger)] font-bold">NOT ENOUGH TIME</p>
                      <p className="text-[10px] text-[var(--danger)]">
                        You need {t.weeksRequired} weeks but only have {t.weeksAvailable}. Either push the show date back
                        or accept a more aggressive loss rate (risking muscle loss).
                      </p>
                    </div>
                  )}
                  {comfortable && (
                    <p className="text-[10px] text-[var(--success)] mt-2">
                      Good buffer for diet breaks (MATADOR protocol) and a relaxed peak week.
                    </p>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* ─── Step 3: Prescribed strategy ─── */}
        {step === 'review' && (() => {
          const strategy = getStrategy()
          const macros = calculateMacros({ ...profile, goal: strategy.goal, trainingPhilosophy: strategy.philosophy, currentPhase: strategy.startingPhase, trainingDaysPerWeek: strategy.trainingDaysPerWeek, dailyStepTarget: strategy.stepsTarget })
          return (
            <div className="space-y-4">
              <div className="bg-[var(--card)] p-4" style={{ border: '1px solid var(--card-border)', borderTop: '2px solid var(--accent)' }}>
                <p className="text-[10px] text-[var(--accent)] font-bold">NEW PROGRAM</p>
                <p className="text-sm font-bold mt-0.5">{strategy.philosophyLabel}</p>
                <p className="text-sm text-[var(--accent)]">{strategy.startingPhase}</p>
                <p className="text-[10px] text-[var(--muted)] mt-1">{strategy.estimatedDuration}</p>
              </div>

              {strategy.warnings.length > 0 && (
                <div className="bg-[var(--danger)]/10 border border-[var(--danger)] p-3">
                  {strategy.warnings.map((w, i) => (
                    <p key={i} className="text-[10px] text-[var(--danger)]">⚠ {w}</p>
                  ))}
                </div>
              )}

              <div className="bg-[var(--card)] p-4 border border-[var(--card-border)]">
                <p className="text-[10px] text-[var(--accent)] font-bold mb-2">WHY</p>
                <ul className="space-y-1">
                  {strategy.reasoning.map((r, i) => (
                    <li key={i} className="text-xs">• {r}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="bg-[var(--card)] p-2 text-center border border-[var(--card-border)]">
                  <p className="text-sm font-bold text-[var(--accent)]">{macros.calories}</p>
                  <p className="text-[8px] text-[var(--muted)]">KCAL</p>
                </div>
                <div className="bg-[var(--card)] p-2 text-center border border-[var(--card-border)]">
                  <p className="text-sm font-bold text-blue-400">{macros.protein}g</p>
                  <p className="text-[8px] text-[var(--muted)]">PROTEIN</p>
                </div>
                <div className="bg-[var(--card)] p-2 text-center border border-[var(--card-border)]">
                  <p className="text-sm font-bold text-amber-400">{macros.carbs}g</p>
                  <p className="text-[8px] text-[var(--muted)]">CARBS</p>
                </div>
                <div className="bg-[var(--card)] p-2 text-center border border-[var(--card-border)]">
                  <p className="text-sm font-bold text-red-400">{macros.fats}g</p>
                  <p className="text-[8px] text-[var(--muted)]">FATS</p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step !== 'goal' && (
            <button onClick={() => setStep(step === 'review' ? (goal === 'contest-prep' ? 'contest' : 'goal') : 'goal')}
              className="flex-1 py-3 border border-[var(--card-border)]"
              style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.08em', color: 'var(--muted)' }}>
              BACK
            </button>
          )}
          {step === 'review' ? (
            <button onClick={handleSwitch}
              className="flex-1 bg-[var(--accent)] text-black py-3"
              style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.08em' }}>
              SWITCH PROGRAM
            </button>
          ) : (
            <button onClick={() => { if (step === 'goal') handleGoalNext(); else setStep('review') }}
              disabled={step === 'contest' && !contest.showDate}
              className={`flex-1 py-3 ${(step === 'contest' && !contest.showDate) ? 'bg-[var(--card-border)] text-[var(--muted)]' : 'bg-[var(--accent)] text-black'}`}
              style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.08em' }}>
              NEXT
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
