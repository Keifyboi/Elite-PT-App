'use client'

import { useEffect, useState } from 'react'
import type { UserProfile, MacroTargets, WeeklyCheckIn } from '@/lib/types'
import { getProfile, saveProfile, getTodayMealPlan, getTodayWorkout, getCheckIns, getWorkouts, getHabitLogs, getHabitLogForDate, saveHabitLog, getMealPlans, getWeekDates, getCurrentWeekNumber, getRollingCompetencyScore, isGoalReviewDue } from '@/lib/storage'
import { useProfile } from '@/lib/ProfileContext'
import { calculateMacros, calculateLBM } from '@/lib/nutrition-engine'
import { evaluatePhaseProgression, type PhaseRecommendation } from '@/lib/phase-progression'
import { prescribeHabits, calculateStreak, type HabitDefinition } from '@/lib/habits'
import ProfileSetup from './ProfileSetup'
import SwitchProgram from './SwitchProgram'
import Settings from './Settings'

const GOLD = '#c9a84c'
const GOLD_DIM = 'rgba(201,168,76,0.12)'
const SURFACE = '#1a1a1a'
const BORDER = '#2a2a2a'

function TrendArrow({ current, previous, wantUp }: { current: number; previous: number; wantUp?: boolean }) {
  if (!previous) return null
  const diff = current - previous
  if (Math.abs(diff) < 0.1) return <span style={{ color: '#555' }}>→</span>
  const isGood = wantUp ? diff > 0 : diff < 0
  const color = isGood ? '#639922' : '#e24b4a'
  return diff > 0
    ? <span style={{ color }}>↑ +{diff.toFixed(1)}</span>
    : <span style={{ color }}>↓ {Math.abs(diff).toFixed(1)}</span>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, letterSpacing: '0.08em', color: '#555', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', marginBottom: 6 }}>
      {children}
    </p>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px', ...style }}>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const { refreshProfile } = useProfile()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [macros, setMacros] = useState<MacroTargets | null>(null)
  const [checkIns, setCheckIns] = useState<WeeklyCheckIn[]>([])
  const [workoutCount, setWorkoutCount] = useState(0)
  const [phaseRec, setPhaseRec] = useState<PhaseRecommendation | null>(null)
  const [weekSummary, setWeekSummary] = useState<{
    workoutsCompleted: number
    workoutsTarget: number
    avgCalories: number
    avgProtein: number
    habitDays: number
  } | null>(null)
  const [showSwitchProgram, setShowSwitchProgram] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showGoalReview, setShowGoalReview] = useState(false)
  const [rollingScore, setRollingScore] = useState<number | null>(null)
  const [scoreLoaded, setScoreLoaded] = useState(false)
  const [habitCompleted, setHabitCompleted] = useState<string[]>([])
  const [habitStreak, setHabitStreak] = useState(0)
  const [habits, setHabits] = useState<HabitDefinition[]>([])

  useEffect(() => {
    let p = getProfile()
    const cis = getCheckIns().sort((a, b) => b.weekNumber - a.weekNumber)
    setCheckIns(cis)

    if (p) {
      let dirty = false
      if (cis.length > 0) {
        const latest = cis[0]
        if (p.weightKg !== latest.weightKg || p.bodyFatPercent !== latest.bodyFatPercent) {
          p = { ...p, weightKg: latest.weightKg, bodyFatPercent: latest.bodyFatPercent }
          dirty = true
        }
      }
      const calculatedWeek = getCurrentWeekNumber(p)
      if (calculatedWeek !== p.weekNumber) {
        p = { ...p, weekNumber: calculatedWeek }
        dirty = true
      }
      if (dirty) saveProfile(p)
      setProfile(p)
      setMacros(calculateMacros(p))
      setPhaseRec(evaluatePhaseProgression(p, cis))

      const h = prescribeHabits(p)
      setHabits(h)
      const today = new Date().toISOString().split('T')[0]
      const log = getHabitLogForDate(today)
      setHabitCompleted(log?.completedIds ?? [])
      setHabitStreak(calculateStreak(getHabitLogs(), h.length))

      const allWorkouts = getWorkouts()
      setWorkoutCount(allWorkouts.filter(w => w.completed).length)

      const weekDates = getWeekDates(p.programStartDate)
      const weekWorkouts = allWorkouts.filter(w => weekDates.includes(w.date))
      const weekCompleted = weekWorkouts.filter(w => w.completed).length
      const weekMeals = getMealPlans().filter(m => weekDates.includes(m.date) && m.totals.calories > 0)
      const avgCals = weekMeals.length > 0
        ? Math.round(weekMeals.reduce((s, m) => s + m.totals.calories, 0) / weekMeals.length)
        : 0
      const avgProt = weekMeals.length > 0
        ? Math.round(weekMeals.reduce((s, m) => s + m.totals.protein, 0) / weekMeals.length)
        : 0
      const habitLogs = getHabitLogs().filter(hd => weekDates.includes(hd.date))
      const habitDays = habitLogs.filter(hd => hd.completedIds.length >= h.length).length
      setWeekSummary({ workoutsCompleted: weekCompleted, workoutsTarget: p.trainingDaysPerWeek, avgCalories: avgCals, avgProtein: avgProt, habitDays })
    }

    const score = getRollingCompetencyScore()
    setRollingScore(score)
    setScoreLoaded(true)

    if (isGoalReviewDue()) setShowGoalReview(true)
  }, [])

  const toggleHabit = (id: string) => {
    if (!profile) return
    const today = new Date().toISOString().split('T')[0]
    const next = habitCompleted.includes(id)
      ? habitCompleted.filter(x => x !== id)
      : [...habitCompleted, id]
    setHabitCompleted(next)
    saveHabitLog({ date: today, completedIds: next })
    setHabitStreak(calculateStreak(getHabitLogs(), habits.length))
  }

  if (!profile || !macros) {
    return (
      <ProfileSetup onComplete={(p) => {
        setProfile(p)
        setMacros(calculateMacros(p))
        setPhaseRec(evaluatePhaseProgression(p, []))
      }} />
    )
  }

  const lbm = calculateLBM(profile.weightKg, profile.bodyFatPercent)
  const todayWorkout = getTodayWorkout()
  const todayMeal = getTodayMealPlan()
  const consumed = todayMeal?.totals ?? { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
  const latestCheckIn = checkIns[0]
  const previousCheckIn = checkIns[1]
  const recentWeights = checkIns.slice(0, 4).map(ci => ci.weightKg).reverse()

  const readinessPct = rollingScore !== null ? Math.round((rollingScore / 25) * 100) : 0
  const phaseLabel = (() => {
    const p = profile.currentPhase
    if (p === 'phase-1') return 'FOUNDATION PHASE'
    if (p === 'phase-2') return 'BUILD PHASE'
    if (p === 'phase-3') return 'PERFORMANCE PHASE'
    if (p === 'phase-4') return 'PEAK PHASE'
    if (p === 'phase-5') return 'MAINTENANCE PHASE'
    if (p === 'contest-prep') return 'CONTEST PREP'
    return (p ?? '').toUpperCase() || 'NO PHASE SET'
  })()

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Dark header */}
      <div style={{ background: '#111', borderBottom: '1px solid #1e1e1e', padding: '52px 16px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: 480, margin: '0 auto' }}>
          <div>
            <a href="/" style={{ fontSize: 10, color: '#444', letterSpacing: '0.1em', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', textDecoration: 'none' }}>
              ATHLETIC ODYSSEY
            </a>
            <h1 style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 28, letterSpacing: '0.05em', color: '#fff', lineHeight: 1, marginTop: 2 }}>
              {profile.name ? `HEY ${profile.name.toUpperCase()}` : 'DASHBOARD'}
            </h1>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            style={{ width: 36, height: 36, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4, flexShrink: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Phase banner */}
        <div style={{ background: 'rgba(201,168,76,0.08)', borderLeft: `3px solid ${GOLD}`, borderRadius: '0 6px 6px 0', padding: '8px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 10, color: GOLD, letterSpacing: '0.08em', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif' }}>
                WEEK {profile.weekNumber} — {phaseLabel}
              </p>
              {scoreLoaded && rollingScore !== null ? (
                <p style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                  Readiness {rollingScore.toFixed(1)}/25
                  {rollingScore >= 20
                    ? <span style={{ color: '#639922', marginLeft: 6 }}>· Phase advance unlocked ✓</span>
                    : <span style={{ color: '#666', marginLeft: 6 }}>· Score {(20 - rollingScore).toFixed(1)} more to advance</span>
                  }
                </p>
              ) : (
                <p style={{ fontSize: 10, color: '#555', marginTop: 2 }}>Log check-in scores to see readiness</p>
              )}
            </div>
            <button
              onClick={() => setShowSwitchProgram(true)}
              style={{ fontSize: 9, color: '#555', background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '3px 8px', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', letterSpacing: '0.06em', borderRadius: 4, flexShrink: 0 }}
            >
              SWITCH
            </button>
          </div>
          {scoreLoaded && rollingScore !== null && (
            <div style={{ height: 3, background: '#1a1a1a', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${readinessPct}%`, background: GOLD, borderRadius: 2, transition: 'width 0.5s ease' }} />
            </div>
          )}
        </div>

        {/* TODAY'S FOCUS */}
        <div>
          <SectionLabel>TODAY&apos;S FOCUS</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {/* Workout tile */}
            <Card style={{ border: todayWorkout && !todayWorkout.completed ? `1px solid ${GOLD}` : `1px solid ${BORDER}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 4v16M18 4v16M3 9h3M18 9h3M3 15h3M18 15h3M6 9h12M6 15h12" />
                </svg>
                <span style={{ fontSize: 9, color: GOLD, letterSpacing: '0.06em', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif' }}>TRAIN</span>
              </div>
              {todayWorkout ? (
                <>
                  <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 15, letterSpacing: '0.04em', color: '#fff', lineHeight: 1.1 }}>
                    {todayWorkout.splitDay.toUpperCase()}
                  </p>
                  <p style={{ fontSize: 9, color: '#555', marginTop: 3 }}>
                    {todayWorkout.exercises.length} exercises
                  </p>
                  {todayWorkout.completed ? (
                    <p style={{ fontSize: 9, color: '#639922', marginTop: 4, fontWeight: 600 }}>DONE ✓</p>
                  ) : (
                    <p style={{ fontSize: 9, color: GOLD, marginTop: 4 }}>IN PROGRESS →</p>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 10, color: '#444', marginTop: 2 }}>Rest day</p>
              )}
            </Card>

            {/* Macros tile */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a7 7 0 0 1 7 7c0 4-3 6-5 8H10c-2-2-5-4-5-8a7 7 0 0 1 7-7Z" />
                  <path d="M9 21h6M10 17h4" />
                </svg>
                <span style={{ fontSize: 9, color: GOLD, letterSpacing: '0.06em', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif' }}>FUEL</span>
              </div>
              <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 15, letterSpacing: '0.04em', color: '#fff', lineHeight: 1.1 }}>
                {macros.calories} kcal
              </p>
              <p style={{ fontSize: 9, color: '#555', marginTop: 3 }}>
                {macros.protein}P · {macros.carbs}C · {macros.fats}F
              </p>
              {consumed.calories > 0 ? (
                <p style={{ fontSize: 9, color: GOLD, marginTop: 4 }}>{consumed.calories} logged</p>
              ) : (
                <p style={{ fontSize: 9, color: '#444', marginTop: 4 }}>Nothing logged yet</p>
              )}
            </Card>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {[
            {
              val: `${profile.weightKg}`,
              unit: 'kg',
              label: 'WEIGHT',
              trend: previousCheckIn ? <TrendArrow current={profile.weightKg} previous={previousCheckIn.weightKg} wantUp={profile.goal === 'bulk'} /> : null
            },
            {
              val: lbm.toFixed(1),
              unit: 'kg',
              label: 'LBM',
              trend: null
            },
            {
              val: `${profile.bodyFatPercent}`,
              unit: '%',
              label: 'BODY FAT',
              trend: previousCheckIn ? <TrendArrow current={profile.bodyFatPercent} previous={previousCheckIn.bodyFatPercent} /> : null
            },
          ].map(stat => (
            <div key={stat.label} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 18, letterSpacing: '0.04em', color: '#fff', lineHeight: 1 }}>
                {stat.val}<span style={{ fontSize: 11, color: '#555' }}>{stat.unit}</span>
              </p>
              <p style={{ fontSize: 8, color: '#555', letterSpacing: '0.07em', marginTop: 3, fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif' }}>{stat.label}</p>
              {stat.trend && <p style={{ fontSize: 9, marginTop: 3 }}>{stat.trend}</p>}
            </div>
          ))}
        </div>

        {/* Habits row */}
        {habits.length > 0 && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif' }}>DAILY HABITS</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {habitStreak > 0 && (
                  <span style={{ fontSize: 9, color: '#639922' }}>{habitStreak}d streak</span>
                )}
                <span style={{ fontSize: 9, color: GOLD }}>{habitCompleted.length}/{habits.length}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {habits.map(habit => {
                const done = habitCompleted.includes(habit.id)
                return (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px',
                      background: done ? GOLD_DIM : '#111',
                      border: `1px solid ${done ? GOLD : '#2a2a2a'}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 13, opacity: done ? 1 : 0.4 }}>{habit.icon}</span>
                    <span style={{ fontSize: 9, color: done ? GOLD : '#555', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', letterSpacing: '0.05em' }}>
                      {habit.label.toUpperCase()}
                    </span>
                    {done && <span style={{ fontSize: 9, color: GOLD }}>✓</span>}
                  </button>
                )
              })}
            </div>
            <div style={{ height: 2, background: '#1a1a1a', borderRadius: 1, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${habits.length > 0 ? (habitCompleted.length / habits.length) * 100 : 0}%`, background: GOLD, borderRadius: 1, transition: 'width 0.3s ease' }} />
            </div>
          </Card>
        )}

        {/* Weekly summary */}
        {weekSummary && (
          <div>
            <SectionLabel>THIS WEEK</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                {
                  value: `${weekSummary.workoutsCompleted}/${weekSummary.workoutsTarget}`,
                  label: 'Workouts',
                  pct: Math.min((weekSummary.workoutsCompleted / Math.max(weekSummary.workoutsTarget, 1)) * 100, 100),
                  color: weekSummary.workoutsCompleted >= weekSummary.workoutsTarget ? '#639922' : GOLD,
                },
                {
                  value: `${weekSummary.habitDays}/7`,
                  label: 'Habit days',
                  pct: (weekSummary.habitDays / 7) * 100,
                  color: weekSummary.habitDays >= 5 ? '#639922' : weekSummary.habitDays >= 3 ? GOLD : '#e24b4a',
                },
                {
                  value: weekSummary.avgCalories > 0 ? String(weekSummary.avgCalories) : '—',
                  label: `Avg kcal / ${macros.calories}`,
                  pct: weekSummary.avgCalories > 0 ? Math.min((weekSummary.avgCalories / macros.calories) * 100, 110) : 0,
                  color: GOLD,
                },
                {
                  value: weekSummary.avgProtein > 0 ? `${weekSummary.avgProtein}g` : '—',
                  label: `Avg protein / ${macros.protein}g`,
                  pct: weekSummary.avgProtein > 0 ? Math.min((weekSummary.avgProtein / macros.protein) * 100, 110) : 0,
                  color: '#60a5fa',
                },
              ].map(item => (
                <Card key={item.label}>
                  <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.04em', color: item.color }}>{item.value}</p>
                  <p style={{ fontSize: 9, color: '#555', marginTop: 2 }}>{item.label}</p>
                  <div style={{ height: 2, background: '#111', borderRadius: 1, marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 1 }} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Weight trend */}
        {recentWeights.length >= 2 && (
          <div>
            <SectionLabel>WEIGHT TREND</SectionLabel>
            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 56 }}>
                {(() => {
                  const min = Math.min(...recentWeights) - 0.5
                  const max = Math.max(...recentWeights) + 0.5
                  const range = max - min || 1
                  return recentWeights.map((w, i) => {
                    const heightPct = ((w - min) / range) * 100
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 9, color: '#666', tabularNums: true } as React.CSSProperties}>{w}</span>
                        <div style={{ width: '100%', height: `${Math.max(heightPct, 8)}%`, background: GOLD, opacity: 0.7 + (i / recentWeights.length) * 0.3, borderRadius: '2px 2px 0 0' }} />
                        <span style={{ fontSize: 8, color: '#444' }}>W{checkIns.length - recentWeights.length + i + 1}</span>
                      </div>
                    )
                  })
                })()}
              </div>
            </Card>
          </div>
        )}

        {/* Latest check-in scores */}
        {latestCheckIn && (
          <div>
            <SectionLabel>CHECK-IN · WEEK {latestCheckIn.weekNumber}</SectionLabel>
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {Object.entries(latestCheckIn.subjective).map(([key, val]) => {
                  const color = val >= 7 ? '#639922' : val >= 5 ? GOLD : '#e24b4a'
                  return (
                    <div key={key} style={{ background: '#111', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                      <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 18, letterSpacing: '0.04em', color }}>{val}<span style={{ fontSize: 10, color: '#444' }}>/10</span></p>
                      <p style={{ fontSize: 8, color: '#555', textTransform: 'capitalize', letterSpacing: '0.05em', marginTop: 2 }}>{key}</p>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Phase recommendation */}
        {phaseRec && phaseRec.reasons.length > 0 && (
          <div>
            <SectionLabel>PHASE STATUS</SectionLabel>
            <Card style={{
              borderLeft: `3px solid ${phaseRec.urgency === 'action' ? '#e24b4a' : phaseRec.urgency === 'warning' ? GOLD : BORDER}`,
              borderRadius: '0 8px 8px 0',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 12, letterSpacing: '0.06em', color: '#888' }}>
                  {phaseRec.shouldSwitch ? 'PHASE SWITCH RECOMMENDED' : 'PHASE STATUS'}
                </p>
                <span style={{
                  fontSize: 8, fontWeight: 600, padding: '2px 6px', borderRadius: 3, letterSpacing: '0.06em',
                  background: phaseRec.urgency === 'action' ? '#e24b4a' : phaseRec.urgency === 'warning' ? GOLD : '#2a2a2a',
                  color: phaseRec.urgency === 'info' ? '#888' : '#000',
                }}>
                  {phaseRec.urgency.toUpperCase()}
                </span>
              </div>
              {phaseRec.shouldSwitch && (
                <p style={{ fontSize: 11, color: GOLD, marginBottom: 6 }}>→ Switch to: {phaseRec.recommendedPhase}</p>
              )}
              <ul style={{ listStyle: 'none', marginBottom: 8 }}>
                {phaseRec.reasons.map((r, i) => (
                  <li key={i} style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>• {r}</li>
                ))}
              </ul>
              {phaseRec.shouldSwitch && (
                <button
                  onClick={() => {
                    if (!profile) return
                    const updated = { ...profile, currentPhase: phaseRec.recommendedPhase }
                    saveProfile(updated)
                    setProfile(updated)
                    setMacros(calculateMacros(updated))
                    setPhaseRec(evaluatePhaseProgression(updated, checkIns))
                  }}
                  style={{ width: '100%', background: GOLD, color: '#000', padding: '10px 0', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.08em', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  SWITCH TO {phaseRec.recommendedPhase.toUpperCase()}
                </button>
              )}
            </Card>
          </div>
        )}

        {/* Workout count footer */}
        <p style={{ fontSize: 9, color: '#333', textAlign: 'center', letterSpacing: '0.06em', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif' }}>
          {workoutCount} WORKOUTS COMPLETED TOTAL
        </p>

      </div>

      {/* Goal Review Modal */}
      {showGoalReview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '0 16px' }}>
          <div style={{ background: '#111', borderTop: `2px solid ${GOLD}`, maxWidth: 384, width: '100%', padding: 24 }}>
            <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 11, letterSpacing: '0.08em', color: '#555' }}>WEEK {profile.weekNumber}</p>
            <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 28, letterSpacing: '0.06em', color: '#fff', lineHeight: 1.1, marginTop: 4, marginBottom: 16 }}>GOAL REVIEW</p>
            {(() => {
              const sorted = [...checkIns].sort((a, b) => a.weekNumber - b.weekNumber)
              const first = sorted[0]
              const last = sorted[sorted.length - 1]
              if (sorted.length < 2 || !first || !last) {
                return <p style={{ fontSize: 12, color: '#555', marginBottom: 16 }}>Complete your first check-in to track progress.</p>
              }
              return (
                <table style={{ width: '100%', marginBottom: 16, borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      { label: 'Starting weight', value: `${first.weightKg} kg → ${last.weightKg} kg` },
                      { label: 'Starting BF%', value: `${first.bodyFatPercent}% → ${last.bodyFatPercent}%` },
                      { label: 'Net change', value: `${(last.weightKg - first.weightKg) >= 0 ? '+' : ''}${(last.weightKg - first.weightKg).toFixed(1)} kg` },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td style={{ paddingBottom: 8, fontSize: 10, color: '#555', paddingRight: 8 }}>{row.label}</td>
                        <td style={{ paddingBottom: 8, fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.04em', color: '#fff', textAlign: 'right' }}>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            })()}
            <p style={{ fontSize: 11, color: '#555', marginBottom: 16 }}>You&apos;ve completed {profile.weekNumber} weeks. Time to review your goal.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { localStorage.setItem('ao_goal_review_dismissed_week', String(profile.weekNumber)); setShowGoalReview(false) }}
                style={{ flex: 1, padding: '12px 0', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.06em', background: '#1a1a1a', color: '#666', border: '1px solid #2a2a2a', cursor: 'pointer' }}>
                KEEP MY GOAL
              </button>
              <button
                onClick={() => { setShowGoalReview(false); setShowSwitchProgram(true) }}
                style={{ flex: 1, padding: '12px 0', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.06em', background: GOLD, color: '#000', border: 'none', cursor: 'pointer' }}>
                SET NEW GOAL
              </button>
            </div>
          </div>
        </div>
      )}

      {showSwitchProgram && (
        <SwitchProgram
          onComplete={() => {
            setShowSwitchProgram(false)
            const p = getProfile()
            if (p) { setProfile(p); setMacros(calculateMacros(p)); setPhaseRec(evaluatePhaseProgression(p, checkIns)); refreshProfile() }
          }}
          onCancel={() => setShowSwitchProgram(false)}
        />
      )}

      {showSettings && (
        <Settings onClose={() => {
          setShowSettings(false)
          const p = getProfile()
          if (p) { setProfile(p); setMacros(calculateMacros(p)); refreshProfile() }
        }} />
      )}
    </div>
  )
}
