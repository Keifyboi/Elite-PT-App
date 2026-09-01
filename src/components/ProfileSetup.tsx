'use client'

import { useState } from 'react'
import type { UserProfile, CompetitionDivision } from '@/lib/types'
import { saveProfile } from '@/lib/storage'
import { determineActivityFactor, recommendedSteps } from '@/lib/nutrition-engine'
import { prescribeStrategy, type PrescribedStrategy } from '@/lib/prescribe-strategy'
import { DIVISIONS } from '@/lib/data/divisions'

type Step = 'basics' | 'goal' | 'training' | 'summary' | 'strategy'
const STEPS: Step[] = ['basics', 'goal', 'training', 'summary', 'strategy']

type TrainingYears = '<6mo' | '6-18mo' | '1-3yr' | '3+yr'
type Consistency = '<3' | '3-4' | '5+'

function assignStartingPhase(trainingYears: TrainingYears, consistency: Consistency): string {
  if (trainingYears === '<6mo' || trainingYears === '6-18mo' || consistency === '<3') {
    return 'Phase 1'
  }
  if (trainingYears === '1-3yr') {
    return 'Phase 2'
  }
  // 3+ years — still start at Phase 2, let competency scoring gate Phase 3
  return 'Phase 2'
}

function Input({ label, value, onChange, type = 'text', placeholder, suffix, min, max, step }: {
  label: string; value: string | number; onChange: (v: string) => void
  type?: string; placeholder?: string; suffix?: string; min?: number; max?: number; step?: number
}) {
  return (
    <div>
      <label className="text-xs text-[var(--muted)] block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type={type} inputMode={type === 'number' ? 'decimal' : undefined}
          value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          min={min} max={max} step={step}
          className="flex-1 bg-[var(--surface)] border border-[var(--card-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
        />
        {suffix && <span className="text-xs text-[var(--muted)]">{suffix}</span>}
      </div>
    </div>
  )
}

function GoalButton({ selected, onClick, title, desc }: { selected: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left p-3 transition-colors ${
        selected ? 'bg-[var(--accent-glow)] text-[var(--accent)]' : 'bg-[var(--card)] text-[var(--foreground)]'
      }`}
      style={{ border: selected ? '2px solid var(--accent)' : '1px solid var(--card-border)' }}
    >
      <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 15, letterSpacing: '0.06em' }}>{title.toUpperCase()}</p>
      <p className="text-[10px] text-[var(--muted)]">{desc}</p>
    </button>
  )
}

export default function ProfileSetup({ onComplete }: { onComplete: (p: UserProfile) => void }) {
  const [step, setStep] = useState<Step>('basics')

  // Form state
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [bodyFatPercent, setBodyFatPercent] = useState('')
  const [occupation, setOccupation] = useState<'sedentary' | 'light-active' | 'active' | 'very-active'>('sedentary')
  const [goal, setGoal] = useState<'bulk' | 'cut' | 'maintain' | 'contest-prep'>('cut')
  const [division, setDivision] = useState<CompetitionDivision | ''>('')

  // Training history
  const [trainingYears, setTrainingYears] = useState<TrainingYears | ''>('')
  const [consistency, setConsistency] = useState<Consistency | ''>('')
  const [assignedPhase, setAssignedPhase] = useState<string>('')

  // Prescription (calculated when entering summary step)
  const [strategy, setStrategy] = useState<PrescribedStrategy | null>(null)

  const stepIdx = STEPS.indexOf(step)
  const lbm = Number(weightKg) > 0 && Number(bodyFatPercent) >= 0
    ? (Number(weightKg) * (1 - Number(bodyFatPercent) / 100)).toFixed(1)
    : null

  const canNext = (() => {
    if (step === 'basics') return name.trim().length > 0 && Number(age) > 0 && Number(heightCm) > 0 && Number(weightKg) > 0 && Number(bodyFatPercent) >= 0
    if (step === 'goal') return true
    if (step === 'training') return trainingYears !== '' && consistency !== ''
    return true
  })()

  const handleNext = () => {
    if (step === 'basics') {
      setStep('goal')
    } else if (step === 'goal') {
      setStep('training')
    } else if (step === 'training') {
      const phase = assignStartingPhase(trainingYears as TrainingYears, consistency as Consistency)
      setAssignedPhase(phase)
      const s = prescribeStrategy(
        Number(age), sex, Number(heightCm), Number(weightKg), Number(bodyFatPercent), goal, occupation
      )
      setStrategy(s)
      setStep('summary')
    } else if (step === 'summary') {
      setStep('strategy')
    }
  }

  const handleStart = () => {
    if (!strategy) return
    const activityFactor = determineActivityFactor(occupation, strategy.trainingDaysPerWeek, strategy.stepsTarget)
    const profile: UserProfile = {
      name: name.trim(),
      age: Number(age),
      sex,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      bodyFatPercent: Number(bodyFatPercent),
      activityFactor,
      goal: strategy.goal,
      trainingPhilosophy: strategy.philosophy,
      currentPhase: assignedPhase || strategy.startingPhase,
      weekNumber: 1,
      dailyStepTarget: strategy.stepsTarget,
      trainingDaysPerWeek: strategy.trainingDaysPerWeek,
      occupation,
      division: division || undefined,
      programStartDate: (() => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
      })(),
    }
    saveProfile(profile)
    onComplete(profile)
  }

  return (
    <div className="px-5 pt-6 pb-8 max-w-md mx-auto">
      {/* Progress bar */}
      <div className="flex gap-1 mb-6">
        {STEPS.map((_, i) => (
          <div key={i} className={`flex-1 h-1 rounded-full ${i <= stepIdx ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'}`} />
        ))}
      </div>

      {/* ─── Step 1: Everything about you ─── */}
      {step === 'basics' && (
        <div className="space-y-4">
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 18, letterSpacing: '0.06em' }}>About You</h2>
            <p className="text-xs text-[var(--muted)]">We need your stats to build your personalised program.</p>
          </div>

          <Input label="Name" value={name} onChange={setName} placeholder="Keith" />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Age" value={age} onChange={setAge} type="number" placeholder="38" suffix="yrs" min={16} max={80} />
            <div>
              <label className="text-xs text-[var(--muted)] block mb-1">Sex</label>
              <div className="flex gap-1.5">
                <button onClick={() => setSex('male')}
                  className={`flex-1 py-2.5 text-xs font-bold ${sex === 'male' ? 'bg-[var(--accent-glow)] text-[var(--accent)]' : 'bg-[var(--card)] text-[var(--muted)]'}`}
                  style={{ border: sex === 'male' ? '2px solid var(--accent)' : '1px solid var(--card-border)' }}
                >Male</button>
                <button onClick={() => setSex('female')}
                  className={`flex-1 py-2.5 text-xs font-bold ${sex === 'female' ? 'bg-[var(--accent-glow)] text-[var(--accent)]' : 'bg-[var(--card)] text-[var(--muted)]'}`}
                  style={{ border: sex === 'female' ? '2px solid var(--accent)' : '1px solid var(--card-border)' }}
                >Female</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Height" value={heightCm} onChange={setHeightCm} type="number" placeholder="165" suffix="cm" min={100} max={230} />
            <Input label="Weight" value={weightKg} onChange={setWeightKg} type="number" placeholder="75" suffix="kg" min={30} max={200} step={0.1} />
            <Input label="Body Fat" value={bodyFatPercent} onChange={setBodyFatPercent} type="number" placeholder="15" suffix="%" min={3} max={50} step={0.5} />
          </div>

          {lbm && (
            <div className="bg-[var(--card)] p-2.5 border border-[var(--card-border)] flex justify-between">
              <span className="text-[10px] text-[var(--muted)]">Lean Body Mass</span>
              <span className="text-sm font-bold text-[var(--accent)]">{lbm} kg</span>
            </div>
          )}

          <div>
            <label className="text-xs text-[var(--muted)] block mb-1">Day job</label>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { id: 'sedentary' as const, label: 'Desk job' },
                { id: 'light-active' as const, label: 'Light active' },
                { id: 'active' as const, label: 'Active' },
                { id: 'very-active' as const, label: 'Very active' },
              ]).map(o => (
                <button key={o.id} onClick={() => setOccupation(o.id)}
                  className={`py-2 text-xs font-bold ${occupation === o.id ? 'bg-[var(--accent-glow)] text-[var(--accent)]' : 'bg-[var(--card)] text-[var(--muted)]'}`}
                  style={{ border: occupation === o.id ? '2px solid var(--accent)' : '1px solid var(--card-border)' }}
                >{o.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 2: Goal (only decision they make) ─── */}
      {step === 'goal' && (
        <div className="space-y-3">
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 18, letterSpacing: '0.06em' }}>What&apos;s the goal?</h2>
            <p className="text-xs text-[var(--muted)]">Pick one. We&apos;ll handle the rest.</p>
          </div>
          <GoalButton selected={goal === 'cut'} onClick={() => setGoal('cut')} title="Lose Fat" desc="Get leaner while keeping your muscle" />
          <GoalButton selected={goal === 'bulk'} onClick={() => setGoal('bulk')} title="Build Muscle" desc="Add size with minimal fat gain" />
          <GoalButton selected={goal === 'maintain'} onClick={() => setGoal('maintain')} title="Maintain / Recomp" desc="Hold where you are, improve composition" />
          <GoalButton selected={goal === 'contest-prep'} onClick={() => setGoal('contest-prep')} title="Contest Prep" desc="Stage-ready conditioning for competition" />

          {goal === 'contest-prep' && (
            <div>
              <label className="text-xs text-[var(--muted)] block mb-1">Division</label>
              <select
                value={division}
                onChange={e => setDivision(e.target.value as CompetitionDivision)}
                className="w-full bg-[var(--surface)] border border-[var(--card-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
              >
                <option value="">Select division…</option>
                {(Object.entries(DIVISIONS) as [CompetitionDivision, { label: string }][]).map(([id, d]) => (
                  <option key={id} value={id}>{d.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-[var(--muted)] mt-1">Sets your stage-ready body fat target and peak week protocol.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Step 3: Training History ─── */}
      {step === 'training' && (
        <div className="space-y-5">
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 18, letterSpacing: '0.06em' }}>Training History</h2>
            <p className="text-xs text-[var(--muted)]">This sets your starting point in the program.</p>
          </div>

          {/* Q1: How long training */}
          <div>
            <p className="text-xs text-[var(--muted)] mb-2">How long have you been training consistently?</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: '<6mo' as const, label: '< 6 MONTHS' },
                { id: '6-18mo' as const, label: '6–18 MONTHS' },
                { id: '1-3yr' as const, label: '1–3 YEARS' },
                { id: '3+yr' as const, label: '3+ YEARS' },
              ]).map(o => (
                <button key={o.id} onClick={() => setTrainingYears(o.id)}
                  className={`py-3 transition-colors ${trainingYears === o.id ? 'bg-[var(--accent-glow)] text-[var(--accent)]' : 'bg-[var(--card)] text-[var(--foreground)]'}`}
                  style={{ border: trainingYears === o.id ? '2px solid var(--accent)' : '1px solid var(--card-border)', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 13, letterSpacing: '0.06em' }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Current consistency */}
          <div>
            <p className="text-xs text-[var(--muted)] mb-2">What best describes your current consistency?</p>
            <div className="grid grid-cols-1 gap-2">
              {([
                { id: '<3' as const, label: '< 3 SESSIONS / WEEK', desc: 'Getting started or returning from a break' },
                { id: '3-4' as const, label: '3–4 SESSIONS / WEEK', desc: 'Solid training habit already in place' },
                { id: '5+' as const, label: '5+ SESSIONS / WEEK', desc: 'High frequency — training is a priority' },
              ]).map(o => (
                <button key={o.id} onClick={() => setConsistency(o.id)}
                  className={`w-full text-left px-3 py-2.5 transition-colors ${consistency === o.id ? 'bg-[var(--accent-glow)]' : 'bg-[var(--card)]'}`}
                  style={{ border: consistency === o.id ? '2px solid var(--accent)' : '1px solid var(--card-border)' }}>
                  <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 13, letterSpacing: '0.06em', color: consistency === o.id ? 'var(--accent)' : 'var(--foreground)' }}>{o.label}</p>
                  <p className="text-[10px] text-[var(--muted)]">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 4: Onboarding Summary ─── */}
      {step === 'summary' && (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-[var(--muted)] tracking-widest uppercase mb-1">Your Starting Point</p>
            <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 40, letterSpacing: '0.06em', color: 'var(--accent)', lineHeight: 1 }}>
              {assignedPhase.toUpperCase()}
            </p>
          </div>

          <div className="p-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderTop: '2px solid var(--accent)' }}>
            {assignedPhase === 'Phase 1' ? (
              <>
                <p className="text-sm text-[var(--foreground)] mb-3">
                  You&apos;re starting at Phase 1 — Foundation. This is where every successful transformation begins, regardless of experience. Focus: habits, protein, recovery.
                </p>
                <ul className="space-y-2">
                  {[
                    'Habit-based nutrition — no calorie counting yet',
                    '3–4x training per week, building technique',
                    'Weekly check-ins every Sunday',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span style={{ color: 'var(--accent)', fontSize: 12 }}>•</span>
                      <span className="text-[12px] text-[var(--muted)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--foreground)] mb-3">
                  You&apos;re starting at Phase 2 — Progressive Overload. Your foundation is solid. Now we dial in intensity, track macros, and drive measurable progress.
                </p>
                <ul className="space-y-2">
                  {[
                    'Macro tracking with weekly adjustments',
                    '4–5x training per week, progressive loading',
                    'Competency scoring gates Phase 3 advancement',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span style={{ color: 'var(--accent)', fontSize: 12 }}>•</span>
                      <span className="text-[12px] text-[var(--muted)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <p className="text-[10px] text-[var(--muted)] text-center">Next: your prescribed nutrition and training protocol.</p>
        </div>
      )}

      {/* ─── Step 5: Your prescribed strategy ─── */}
      {step === 'strategy' && strategy && (
        <div className="space-y-4">
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 18, letterSpacing: '0.06em' }}>Your Program</h2>
            <p className="text-xs text-[var(--muted)]">Based on your stats and goal, here&apos;s where you start.</p>
          </div>

          {/* Warnings first */}
          {strategy.warnings.length > 0 && (
            <div className="bg-[var(--danger)]/10 border border-[var(--danger)] p-3">
              {strategy.warnings.map((w, i) => (
                <p key={i} className="text-[10px] text-[var(--danger)]">⚠ {w}</p>
              ))}
            </div>
          )}

          {/* Philosophy & Phase */}
          <div className="bg-[var(--card)] p-4" style={{ border: '1px solid var(--card-border)', borderTop: '2px solid var(--accent)' }}>
            <p className="text-[10px] text-[var(--accent)] font-bold">TRAINING SYSTEM</p>
            <p className="text-sm font-bold mt-0.5">{strategy.philosophyLabel}</p>
            <div className="flex justify-between items-center mt-2">
              <div>
                <p className="text-[10px] text-[var(--muted)]">Starting phase</p>
                <p className="text-sm font-bold text-[var(--accent)]">{strategy.startingPhase}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[var(--muted)]">Duration</p>
                <p className="text-xs font-bold">{strategy.estimatedDuration}</p>
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="bg-[var(--card)] p-4 border border-[var(--card-border)]">
            <p className="text-[10px] text-[var(--accent)] font-bold mb-2">WHY THIS PROGRAM</p>
            <ul className="space-y-1.5">
              {strategy.reasoning.map((r, i) => (
                <li key={i} className="text-xs text-[var(--foreground)]">• {r}</li>
              ))}
            </ul>
          </div>

          {/* Daily Targets */}
          <div className="bg-[var(--card)] p-4 border border-[var(--card-border)]">
            <p className="text-[10px] text-[var(--accent)] font-bold mb-2">DAILY TARGETS</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[var(--surface)] p-2.5 text-center">
                <p className="text-sm font-bold tabular-nums text-[var(--accent)]">{strategy.macros.calories}</p>
                <p className="text-[9px] text-[var(--muted)]">CALORIES</p>
              </div>
              <div className="bg-[var(--surface)] p-2.5 text-center">
                <p className="text-sm font-bold tabular-nums text-blue-400">{strategy.macros.protein}g</p>
                <p className="text-[9px] text-[var(--muted)]">PROTEIN</p>
              </div>
              <div className="bg-[var(--surface)] p-2.5 text-center">
                <p className="text-sm font-bold tabular-nums text-amber-400">{strategy.macros.carbs}g</p>
                <p className="text-[9px] text-[var(--muted)]">CARBS</p>
              </div>
              <div className="bg-[var(--surface)] p-2.5 text-center">
                <p className="text-sm font-bold tabular-nums text-red-400">{strategy.macros.fats}g</p>
                <p className="text-[9px] text-[var(--muted)]">FATS</p>
              </div>
            </div>
          </div>

          {/* Protocol details */}
          <div className="bg-[var(--card)] p-4 border border-[var(--card-border)] space-y-2">
            <p className="text-[10px] text-[var(--accent)] font-bold">YOUR PROTOCOL</p>
            <div className="flex justify-between">
              <span className="text-xs text-[var(--muted)]">Carb cycling</span>
              <span className="text-xs font-bold">{strategy.carbCyclePattern.replace(/-/g, ' ')}</span>
            </div>
            <p className="text-[9px] text-[var(--muted)]">{strategy.carbCycleReason}</p>
            <div className="flex justify-between">
              <span className="text-xs text-[var(--muted)]">Training days</span>
              <span className="text-xs font-bold">{strategy.trainingDaysPerWeek}x / week</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-[var(--muted)]">Daily steps</span>
              <span className="text-xs font-bold">{strategy.stepsTarget.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {stepIdx > 0 && (
          <button onClick={() => setStep(STEPS[stepIdx - 1])}
            className="flex-1 py-3 border border-[var(--card-border)]"
            style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.08em', color: 'var(--muted)' }}>
            BACK
          </button>
        )}
        {step === 'strategy' ? (
          <button onClick={handleStart}
            className="flex-1 bg-[var(--accent)] text-black py-3"
            style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.08em' }}>
            LET&apos;S GO
          </button>
        ) : (
          <button onClick={handleNext} disabled={!canNext}
            className={`flex-1 py-3 ${canNext ? 'bg-[var(--accent)] text-black' : 'bg-[var(--card-border)] text-[var(--muted)]'}`}
            style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.08em' }}>
            NEXT
          </button>
        )}
      </div>
    </div>
  )
}
