'use client'

import { useEffect, useState, useRef } from 'react'
import type { WorkoutDay, WorkoutExercise, WorkoutSet } from '@/lib/types'
import { getProfile, saveWorkout, getWorkoutByDate, getWeekDates, getCurrentWeekNumber, getWorkouts } from '@/lib/storage'
import HIITSession, { getHIITProtocol } from './HIITSession'
import { generateWorkout } from '@/lib/workout-generator'
import { getLastSession, suggestOverload, getPersonalBest, getExerciseHistory, type ExerciseRecord } from '@/lib/exercise-history'
import { getCurrentPhase } from '@/lib/philosophy-engine'
import { evaluatePhaseProgression } from '@/lib/phase-progression'
import { getCheckIns } from '@/lib/storage'

// ─── Progression data helper ───

interface ExerciseWeekData {
  weekLabel: string
  volume: number
  maxWeight: number
}

interface ExerciseProgression {
  name: string
  weeks: ExerciseWeekData[]
}

function getProgressionData(workouts: WorkoutDay[]): ExerciseProgression[] {
  // Group workouts by ISO week (YYYY-Www)
  const byWeek: Record<string, WorkoutDay[]> = {}
  for (const w of workouts) {
    const d = new Date(w.date + 'T12:00:00')
    const jan4 = new Date(d.getFullYear(), 0, 4)
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)
    const weekNum = Math.ceil((dayOfYear + jan4.getDay()) / 7)
    const key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
    if (!byWeek[key]) byWeek[key] = []
    byWeek[key].push(w)
  }

  const sortedWeeks = Object.keys(byWeek).sort()

  // Accumulate per-exercise volume per week
  const exerciseData: Record<string, Record<string, { volume: number; maxWeight: number }>> = {}

  for (const weekKey of sortedWeeks) {
    for (const workout of byWeek[weekKey]) {
      for (const exercise of workout.exercises) {
        const name = exercise.name
        if (!exerciseData[name]) exerciseData[name] = {}
        if (!exerciseData[name][weekKey]) exerciseData[name][weekKey] = { volume: 0, maxWeight: 0 }
        for (const set of exercise.sets) {
          if (!set.completed) continue
          const reps = set.actualReps ?? 0
          const weight = set.weight ?? 0
          const vol = weight > 0 ? weight * reps : reps
          exerciseData[name][weekKey].volume += vol
          if (weight > exerciseData[name][weekKey].maxWeight) {
            exerciseData[name][weekKey].maxWeight = weight
          }
        }
      }
    }
  }

  // Build result — only exercises appearing in 2+ weeks
  const result: ExerciseProgression[] = []
  for (const [name, weekMap] of Object.entries(exerciseData)) {
    const weeksWithData = sortedWeeks.filter(wk => weekMap[wk] && weekMap[wk].volume > 0)
    if (weeksWithData.length < 2) continue
    result.push({
      name,
      weeks: weeksWithData.map(wk => ({
        weekLabel: wk,
        volume: weekMap[wk].volume,
        maxWeight: weekMap[wk].maxWeight,
      })),
    })
  }

  // Sort by most recent week volume descending, return top 8
  result.sort((a, b) => {
    const aLast = a.weeks[a.weeks.length - 1].volume
    const bLast = b.weeks[b.weeks.length - 1].volume
    return bLast - aLast
  })
  return result.slice(0, 8)
}

// ─── Sparkline ───

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 80, h = 28
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const lastX = (w).toFixed(1)
  const lastY = (h - ((data[data.length - 1] - min) / range) * (h - 4) - 2).toFixed(1)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h, flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={2} fill="var(--accent)" />
    </svg>
  )
}

// ─── Progression view ───

function ProgressionView() {
  const [open, setOpen] = useState(false)
  const workouts = getWorkouts()
  const data = open ? getProgressionData(workouts) : []

  const hasEnough = workouts.filter(w => w.completed).length >= 2

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-0 py-1"
        style={{ background: 'none', border: 'none' }}
      >
        <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>
          PROGRESSION
        </p>
        <span className="text-[var(--muted)] text-xs">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="mt-2">
          {!hasEnough ? (
            <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
              COMPLETE 2+ WORKOUTS TO SEE PROGRESSION
            </p>
          ) : data.length === 0 ? (
            <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
              NO EXERCISES WITH MULTI-WEEK DATA YET
            </p>
          ) : (
            data.map(exercise => {
              const volumes = exercise.weeks.map(w => w.volume)
              const lastVol = volumes[volumes.length - 1]
              const prevVol = volumes[volumes.length - 2]
              const pctChange = prevVol > 0 ? ((lastVol - prevVol) / prevVol) * 100 : 0

              return (
                <div
                  key={exercise.name}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--card-border)',
                    padding: '8px 12px',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{
                      fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif',
                      fontSize: 13,
                      letterSpacing: '0.06em',
                      color: 'var(--foreground)',
                      flex: 1,
                      marginRight: 8,
                    }}>
                      {exercise.name.toUpperCase()}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkline data={volumes} />
                      <div style={{ textAlign: 'right', minWidth: 44 }}>
                        <p style={{
                          fontSize: 13,
                          fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif',
                          color: 'var(--foreground)',
                          lineHeight: 1.2,
                        }}>
                          {lastVol.toFixed(0)}
                        </p>
                        <p style={{
                          fontSize: 10,
                          color: pctChange >= 0 ? 'var(--success)' : 'var(--danger)',
                          lineHeight: 1.2,
                        }}>
                          {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>weekly volume (kg×reps)</p>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── Set row with rest timer trigger ───

function SetRow({ set, restSeconds, onUpdate, onComplete }: {
  set: WorkoutSet; restSeconds: number
  onUpdate: (s: WorkoutSet) => void; onComplete: (restSec: number) => void
}) {
  return (
    <div className={`flex items-center gap-2 py-1.5 px-2 ${set.completed ? 'bg-[var(--accent-dim)]/20' : ''}`}>
      <span className="text-xs text-[var(--muted)] w-6">#{set.setNumber}</span>
      <input type="number" inputMode="decimal" placeholder="kg" value={set.weight ?? ''}
        onChange={e => onUpdate({ ...set, weight: Number(e.target.value) || undefined })}
        className="bg-[var(--surface)] border border-[var(--card-border)] px-2 py-1.5 text-sm w-16 text-center" />
      <span className="text-xs text-[var(--muted)]">x</span>
      <input type="number" inputMode="numeric" placeholder={set.targetReps} value={set.actualReps ?? ''}
        onChange={e => onUpdate({ ...set, actualReps: Number(e.target.value) || undefined })}
        className="bg-[var(--surface)] border border-[var(--card-border)] px-2 py-1.5 text-sm w-14 text-center" />
      <input type="number" inputMode="decimal" placeholder="RPE" value={set.rpe ?? ''}
        onChange={e => onUpdate({ ...set, rpe: Number(e.target.value) || undefined })}
        className="bg-[var(--surface)] border border-[var(--card-border)] px-2 py-1.5 text-sm w-14 text-center" />
      <button
        onClick={() => { const u = { ...set, completed: !set.completed }; onUpdate(u); if (!set.completed) onComplete(restSeconds) }}
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors ${
          set.completed ? 'bg-[var(--success)] border-[var(--success)] text-black' : 'border-[var(--card-border)] text-[var(--muted)]'
        }`}
      >{set.completed ? '✓' : ''}</button>
    </div>
  )
}

// ─── Rest timer ───

function RestTimer({ seconds, onDismiss }: { seconds: number; onDismiss: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    setRemaining(seconds)
    intervalRef.current = setInterval(() => {
      setRemaining(prev => { if (prev <= 1) { if (intervalRef.current) clearInterval(intervalRef.current); return 0 }; return prev - 1 })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [seconds])
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const done = remaining === 0
  return (
    <div className={`fixed bottom-20 left-4 right-4 p-4 z-40 border ${done ? 'bg-[var(--success)]/20 border-[var(--success)]' : 'bg-[var(--card)] border-[var(--card-border)]'}`}>
      <div className="flex justify-between items-center">
        <div>
          <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.08em' }}>{done ? 'GO!' : 'REST TIMER'}</p>
          <p className={`text-2xl font-bold tabular-nums ${done ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>{mins}:{secs.toString().padStart(2, '0')}</p>
        </div>
        <button onClick={onDismiss} className="text-[var(--muted)] text-sm px-3 py-1 border border-[var(--card-border)]">Dismiss</button>
      </div>
      <div className="h-1.5 bg-[var(--background)] mt-2 overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${done ? 'bg-[var(--success)]' : 'bg-[var(--accent)]'}`} style={{ width: `${seconds > 0 ? (remaining / seconds) * 100 : 0}%` }} />
      </div>
    </div>
  )
}

// ─── Exercise card ───

function ExerciseCard({ exercise, onUpdate, onSetComplete }: {
  exercise: WorkoutExercise; onUpdate: (e: WorkoutExercise) => void; onSetComplete: (restSec: number) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const completedSets = exercise.sets.filter(s => s.completed).length

  const last = getLastSession(exercise.name)
  const suggestion = suggestOverload(exercise.name)
  const pb = getPersonalBest(exercise.name)
  const history = showHistory ? getExerciseHistory(exercise.name) : []

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] overflow-hidden" style={{ borderTop: '2px solid var(--accent)' }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-3">
        <div className="text-left">
          <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>{exercise.name.toUpperCase()}</p>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">
            {exercise.targetMuscle} · {exercise.tempo} · {exercise.restSeconds}s rest
            {exercise.intensifier ? ` · ${exercise.intensifier.toUpperCase()}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${completedSets === exercise.sets.length ? 'text-[var(--success)]' : 'text-[var(--muted)]'}`}>{completedSets}/{exercise.sets.length}</span>
          <span className="text-[var(--muted)]">{expanded ? '▾' : '▸'}</span>
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-1">
          {/* Last session + overload suggestion */}
          {last && (
            <div className="bg-[var(--background)] p-2 mb-2 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-[var(--muted)]">Last: {last.date}</span>
                {pb && <span className="text-[9px] text-[var(--accent)]">PB: {pb.weight}kg × {pb.reps}</span>}
              </div>
              <div className="flex gap-1.5">
                {last.sets.map((s, i) => (
                  <span key={i} className="text-[9px] text-[var(--muted)] bg-[var(--card)] px-1.5 py-0.5">
                    {s.weight}kg×{s.reps}
                  </span>
                ))}
              </div>
              {suggestion && (
                <p className="text-[10px] text-[var(--accent)] font-bold">
                  → {suggestion.suggestedWeight}kg × {suggestion.suggestedReps} — {suggestion.reason}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 text-[10px] text-[var(--muted)] px-2 mb-1">
            <span className="w-6" /><span className="w-16 text-center">Weight</span><span className="w-3" /><span className="w-14 text-center">Reps</span><span className="w-14 text-center">RPE</span><span className="w-8" />
          </div>
          {exercise.sets.map(set => (
            <SetRow key={set.setNumber} set={set} restSeconds={exercise.restSeconds}
              onUpdate={u => { const sets = exercise.sets.map(s => s.setNumber === u.setNumber ? u : s); onUpdate({ ...exercise, sets }) }}
              onComplete={onSetComplete} />
          ))}
          {exercise.notes && <p className="text-[10px] text-[var(--accent)] mt-2 px-2">{exercise.notes}</p>}

          {/* History toggle */}
          <button onClick={() => setShowHistory(!showHistory)} className="text-[9px] text-[var(--muted)] underline px-2 mt-1">
            {showHistory ? 'Hide history' : 'View history'}
          </button>

          {showHistory && history.length > 0 && (
            <div className="bg-[var(--background)] p-2 mt-1 space-y-1.5 max-h-40 overflow-y-auto">
              {history.map((rec, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-[9px] text-[var(--muted)]">{rec.date}</span>
                  <div className="flex gap-1">
                    {rec.sets.map((s, j) => (
                      <span key={j} className="text-[9px] text-[var(--foreground)]">{s.weight}×{s.reps}</span>
                    ))}
                  </div>
                  <span className="text-[9px] text-[var(--muted)]">{rec.totalVolume}kg vol</span>
                </div>
              ))}
            </div>
          )}
          {showHistory && history.length === 0 && (
            <p className="text-[9px] text-[var(--muted)] px-2">No previous sessions recorded</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Weekly schedule view ───

function WeekSchedule({ onSelectDay }: { onSelectDay: (date: string, dayNum: number) => void }) {
  const profile = getProfile()
  const weekDates = getWeekDates(profile?.programStartDate)
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = new Date().toISOString().split('T')[0]

  if (!profile) {
    return <div className="flex items-center justify-center min-h-[60vh] text-[var(--muted)]">Set up your profile first</div>
  }

  const phase = getCurrentPhase(profile.trainingPhilosophy, profile.currentPhase)
  const splitKeys = phase ? Object.keys(phase.trainingStyle.split) : []

  return (
    <div className="px-4 pt-2 pb-4 space-y-3">
      <div>
        <h2 style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 18, letterSpacing: '0.06em' }}>TRAINING WEEK</h2>
        <p className="text-[10px] text-[var(--muted)]">
          {profile.trainingPhilosophy.toUpperCase().replace('-', ' ')} · {profile.currentPhase} · Week {profile.weekNumber}
        </p>
      </div>

      <div className="space-y-2" id="week-days-grid">
        {weekDates.map((date, i) => {
          const dayKey = splitKeys[i]
          const splitDay = phase?.trainingStyle.split[dayKey] ?? null
          const isRest = !splitDay || splitDay.toLowerCase() === 'rest' || splitDay.toLowerCase() === 'off'
          const isToday = date === today
          const existing = getWorkoutByDate(date)
          const isCompleted = existing?.completed ?? false

          return (
            <button
              key={date}
              onClick={() => { if (!isRest) onSelectDay(date, i + 1) }}
              disabled={isRest}
              className={`w-full flex items-center justify-between p-3 border transition-colors ${
                isToday ? 'border-[var(--accent)] bg-[var(--accent)]/5' :
                isCompleted ? 'border-[var(--success)] bg-[var(--success)]/5' :
                isRest ? 'border-[var(--card-border)] bg-[var(--card)] opacity-50' :
                'border-[var(--card-border)] bg-[var(--card)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 flex flex-col items-center justify-center ${
                  isToday ? 'bg-[var(--accent)] text-black' :
                  isCompleted ? 'bg-[var(--success)] text-black' :
                  'bg-[var(--background)]'
                }`}>
                  <span className="text-[10px] font-bold leading-none">{dayNames[i]}</span>
                  <span className="text-[8px] leading-none">{date.slice(8)}</span>
                </div>
                <div className="text-left">
                  <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 15, letterSpacing: '0.06em' }}>{isRest ? ((splitDay ?? 'Rest Day').toUpperCase()) : splitDay?.toUpperCase()}</p>
                  {existing && !isRest && (
                    <p className="text-[10px] text-[var(--muted)]">
                      {existing.exercises.length} exercises · {existing.exercises.reduce((s, e) => s + e.sets.filter(ss => ss.completed).length, 0)}/{existing.exercises.reduce((s, e) => s + e.sets.length, 0)} sets
                    </p>
                  )}
                  {!existing && !isRest && (
                    <p className="text-[10px] text-[var(--muted)]">Tap to generate</p>
                  )}
                </div>
              </div>
              <div>
                {isCompleted && <span className="text-[var(--success)] font-bold">✓</span>}
                {isToday && !isCompleted && !isRest && <span style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 11, letterSpacing: '0.08em', color: 'var(--accent)' }}>TODAY</span>}
              </div>
            </button>
          )
        })}
      </div>

      <ProgressionView />
    </div>
  )
}

// ─── Y3T sub-week helper (mirrors workout-generator logic) ───

function getY3TSubWeek(weekNumber: number): 0 | 1 | 2 {
  return ((weekNumber - 1) % 3) as 0 | 1 | 2
}

const Y3T_LABELS: Record<0 | 1 | 2, { label: string; desc: string; muted: boolean }> = {
  0: { label: 'Y3T WEEK 1 — HEAVY', desc: '6-10 reps · compound focus', muted: true },
  1: { label: 'Y3T WEEK 2 — MODERATE', desc: '10-15 reps · balanced intensity', muted: true },
  2: { label: 'Y3T WEEK 3 — ANNIHILATION', desc: '15-40 reps · giant sets · minimal rest', muted: false },
}

function Y3TBanner({ weekNumber }: { weekNumber: number }) {
  const sub = getY3TSubWeek(weekNumber)
  const info = Y3T_LABELS[sub]
  const isAnnihilation = sub === 2

  return (
    <div style={{
      borderTop: isAnnihilation ? '2px solid var(--accent)' : '1px solid var(--card-border)',
      background: isAnnihilation ? 'rgba(201,168,76,0.07)' : 'var(--surface)',
      padding: '8px 12px',
      marginBottom: 4,
    }}>
      <p style={{
        fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif',
        fontSize: 14,
        letterSpacing: '0.06em',
        color: isAnnihilation ? 'var(--accent)' : 'var(--muted)',
        lineHeight: 1.2,
      }}>{info.label}</p>
      <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{info.desc}</p>
    </div>
  )
}

// ─── Execution quality prompt ───

const EXECUTION_LABELS: Record<number, string> = {
  1: 'Poor form / injury risk',
  2: 'Below par',
  3: 'Solid',
  4: 'Strong',
  5: 'Perfect',
}

function ExecutionRatingPrompt({ onRate }: { onRate: (quality?: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="px-4 pt-6 pb-8 flex flex-col items-center" style={{ minHeight: '60vh', justifyContent: 'center' }}>
      <p style={{
        fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif',
        fontSize: 22,
        letterSpacing: '0.06em',
        textAlign: 'center',
        marginBottom: 4,
      }}>
        HOW WAS YOUR EXECUTION?
      </p>
      <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginBottom: 28 }}>
        Rate your form and focus for this session
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => setSelected(n)}
            style={{
              width: 52,
              height: 52,
              border: selected === n ? '2px solid var(--accent)' : '1px solid var(--card-border)',
              background: selected === n ? 'rgba(201,168,76,0.15)' : 'var(--surface)',
              boxShadow: selected === n ? '0 0 0 2px var(--accent-glow)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif',
              fontSize: 22,
              letterSpacing: '0.06em',
              color: selected === n ? 'var(--accent)' : 'var(--foreground)',
              cursor: 'pointer',
              transition: 'all 0.1s',
            }}
          >{n}</button>
        ))}
      </div>

      {selected !== null && (
        <p style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 24, textAlign: 'center' }}>
          {EXECUTION_LABELS[selected]}
        </p>
      )}

      <button
        onClick={() => onRate(selected ?? undefined)}
        disabled={selected === null}
        style={{
          width: '100%',
          maxWidth: 320,
          padding: '14px 0',
          background: selected !== null ? 'var(--success)' : 'var(--surface)',
          border: selected !== null ? 'none' : '1px solid var(--card-border)',
          color: selected !== null ? 'black' : 'var(--muted)',
          fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif',
          fontSize: 16,
          letterSpacing: '0.08em',
          cursor: selected !== null ? 'pointer' : 'default',
          marginBottom: 16,
        }}
      >
        {selected !== null ? 'SAVE & FINISH' : 'SELECT A RATING'}
      </button>

      <button
        onClick={() => onRate(undefined)}
        style={{ fontSize: 10, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Skip
      </button>
    </div>
  )
}

// ─── Main component ───

export default function WorkoutTracker() {
  const [view, setView] = useState<'week' | 'session'>('week')
  const [workout, setWorkout] = useState<WorkoutDay | null>(null)
  const [restTimerSecs, setRestTimerSecs] = useState<number | null>(null)
  const [showExecutionRating, setShowExecutionRating] = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const existing = getWorkoutByDate(today)
    if (existing && !existing.completed) {
      setWorkout(existing)
      setView('session')
    }
  }, [])

  useEffect(() => {
    if (view === 'session' && !workout) setView('week')
  }, [view, workout])

  const handleSelectDay = (date: string, dayNum: number) => {
    const profile = getProfile()
    if (!profile) return

    let w = getWorkoutByDate(date)
    if (!w) {
      const phaseRec = evaluatePhaseProgression(profile, getCheckIns())
      const isDeload =
        profile.trainingPhilosophy === 'bompa' &&
        phaseRec.adjustments.some(a => a.reason.toLowerCase().includes('deload'))
      w = generateWorkout(profile.trainingPhilosophy, profile.currentPhase, dayNum, date, getCurrentWeekNumber(profile), isDeload) ?? undefined
      if (w) saveWorkout(w)
    }
    if (w) {
      setWorkout(w)
      setView('session')
    }
  }

  const updateExercise = (updated: WorkoutExercise) => {
    if (!workout) return
    const exercises = workout.exercises.map(e => e.id === updated.id ? updated : e)
    const w = { ...workout, exercises }
    setWorkout(w)
    saveWorkout(w)
  }

  const handleFinishWithRating = (quality?: number) => {
    if (!workout) return
    const w: WorkoutDay = { ...workout, completed: true, executionQuality: quality }
    saveWorkout(w)
    setWorkout(null)
    setView('week')
    setShowExecutionRating(false)
  }

  const handleRegenerate = () => {
    if (!workout) return
    const profile = getProfile()
    if (!profile) return
    const phase = getCurrentPhase(profile.trainingPhilosophy, profile.currentPhase)
    if (!phase) return
    const splitKeys = Object.keys(phase.trainingStyle.split)
    const dayNum = splitKeys.findIndex(k => phase.trainingStyle.split[k] === workout.splitDay) + 1
    // Shuffle uses week+1 so it always picks a rotation different from the current one
    const w = generateWorkout(profile.trainingPhilosophy, profile.currentPhase, dayNum || 1, workout.date, getCurrentWeekNumber(profile) + 1)
    if (w) {
      saveWorkout(w)
      setWorkout(w)
    }
  }

  // ─── Week view ───
  if (view === 'week') {
    return <WeekSchedule onSelectDay={handleSelectDay} />
  }

  // ─── Session view ───
  if (!workout) return null

  // ─── Execution rating screen (shown after tapping Complete) ───
  if (showExecutionRating) {
    return <ExecutionRatingPrompt onRate={handleFinishWithRating} />
  }

  // HIIT / Metabolic session — use the HIIT timer component
  const isHIIT = workout.splitDay.toLowerCase().includes('hiit') || workout.splitDay.toLowerCase().includes('metabolic')
  if (isHIIT) {
    const profile = getProfile()
    const protocol = getHIITProtocol(profile?.currentPhase ?? 'reset', 1)
    return (
      <div>
        <div className="px-4 pt-2">
          <button onClick={() => { setView('week'); setWorkout(null) }} className="text-[10px] text-[var(--accent)] font-bold">
            ← Back to Week
          </button>
        </div>
        <HIITSession protocol={protocol} onComplete={() => {
          setShowExecutionRating(true)
        }} />
      </div>
    )
  }

  const totalSets = workout.exercises.reduce((sum, e) => sum + e.sets.length, 0)
  const completedSets = workout.exercises.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0)

  // Y3T banner data
  const sessionProfile = getProfile()
  const isY3TSession = workout.philosophy === 'y3t'
  const y3tSubWeekForBanner = isY3TSession && sessionProfile
    ? getY3TSubWeek(sessionProfile.weekNumber)
    : null

  return (
    <div className="px-4 pt-2 pb-4 space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <button onClick={() => { setView('week'); setWorkout(null) }} className="text-[10px] text-[var(--accent)] font-bold mb-0.5">
            ← Back to Week
          </button>
          <h2 style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 18, letterSpacing: '0.06em' }}>{workout.splitDay.toUpperCase()}</h2>
          <p className="text-xs text-[var(--muted)]">
            {workout.philosophy.toUpperCase().replace('-', ' ')} · {workout.phase} · {completedSets}/{totalSets} sets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRegenerate} className="text-[10px] text-[var(--muted)] border border-[var(--card-border)] px-2 py-1">Shuffle</button>
          <div className="bg-[var(--accent)] text-black text-xs font-bold px-3 py-1.5 rounded-full">
            {totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Y3T phase banner */}
      {isY3TSession && y3tSubWeekForBanner !== null && sessionProfile && (
        <Y3TBanner weekNumber={sessionProfile.weekNumber} />
      )}

      {workout.exercises.map(exercise => (
        <ExerciseCard key={exercise.id} exercise={exercise} onUpdate={updateExercise}
          onSetComplete={secs => setRestTimerSecs(secs)} />
      ))}

      {completedSets === totalSets && totalSets > 0 && (
        <button
          onClick={() => setShowExecutionRating(true)}
          className="w-full bg-[var(--success)] text-black py-3"
          style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.08em' }}
        >COMPLETE WORKOUT ✓</button>
      )}

      {restTimerSecs !== null && restTimerSecs > 0 && (
        <RestTimer seconds={restTimerSecs} onDismiss={() => setRestTimerSecs(null)} />
      )}
    </div>
  )
}
