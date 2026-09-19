'use client'

import { useEffect, useState } from 'react'
import type { WeeklyCheckIn, Measurements, SubjectiveScores, UserProfile } from '@/lib/types'
import { getCheckIns, saveCheckIn, getProfile, saveProfile, getWorkouts, getMealPlans, getCurrentWeekNumber } from '@/lib/storage'
import { calculateMacros, calculateLBM } from '@/lib/nutrition-engine'
import { evaluatePhaseProgression, type PhaseRecommendation } from '@/lib/phase-progression'
import { startNextBlockIfDue } from '@/lib/macrocycle'
import { savePhoto, getPhotosForCheckIn, type StoredPhoto } from '@/lib/photo-storage'
import PhotoCapture from './PhotoCapture'

function LineChart({
  data, color, chartId, unit,
}: {
  data: { label: string; value: number }[]
  color: string
  chartId: string
  unit: string
}) {
  if (data.length < 2) return null

  const W = 300
  const H = 90
  const PAD = { top: 8, right: 8, bottom: 22, left: 32 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const values = data.map(d => d.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 0.01

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * innerW
  const toY = (v: number) => PAD.top + ((maxV - v) / range) * innerH

  const polyPts = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')
  const areaPts = `${PAD.left},${H - PAD.bottom} ${polyPts} ${toX(data.length - 1)},${H - PAD.bottom}`

  const labelIdxs = data.length <= 4
    ? data.map((_, i) => i)
    : [0, Math.round((data.length - 1) / 2), data.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id={`grad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines at min, mid, max */}
      {[minV, (minV + maxV) / 2, maxV].map((v, i) => (
        <g key={i}>
          <line
            x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)}
            stroke="var(--card-border)" strokeWidth="0.5" strokeDasharray="3,3"
          />
          <text x={PAD.left - 3} y={toY(v) + 3} fontSize="7" fill="var(--muted)" textAnchor="end">
            {v.toFixed(1)}{unit}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <polygon points={areaPts} fill={`url(#grad-${chartId})`} />

      {/* Line */}
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" points={polyPts} />

      {/* Dots */}
      {data.map((d, i) => (
        <circle key={i} cx={toX(i)} cy={toY(d.value)} r="3" fill={color} />
      ))}

      {/* X labels */}
      {labelIdxs.map(i => (
        <text key={i} x={toX(i)} y={H - 5} fontSize="7" fill="var(--muted)" textAnchor="middle">
          {data[i].label}
        </text>
      ))}
    </svg>
  )
}

function BarChart({ data }: {
  data: { label: string; macro: number; training: number }[]
}) {
  if (data.length === 0) return null

  const W = 300
  const H = 80
  const PAD = { top: 6, right: 8, bottom: 22, left: 8 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const groupW = innerW / data.length
  const barW = Math.min(groupW * 0.35, 14)
  const gap = barW * 0.4

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {data.map((d, i) => {
        const cx = PAD.left + i * groupW + groupW / 2
        const mH = (d.macro / 100) * innerH
        const tH = (d.training / 100) * innerH
        return (
          <g key={i}>
            <rect x={cx - barW - gap / 2} y={PAD.top + innerH - mH} width={barW} height={mH}
              fill="var(--accent)" opacity="0.7" rx="2" />
            <rect x={cx + gap / 2} y={PAD.top + innerH - tH} width={barW} height={tH}
              fill="#3b82f6" opacity="0.7" rx="2" />
            <text x={cx} y={H - 5} fontSize="7" fill="var(--muted)" textAnchor="middle">
              {d.label}
            </text>
          </g>
        )
      })}
      {/* Legend */}
      <rect x={PAD.left} y={PAD.top - 2} width="6" height="6" fill="var(--accent)" opacity="0.7" rx="1" />
      <text x={PAD.left + 8} y={PAD.top + 4} fontSize="7" fill="var(--muted)">Nutrition</text>
      <rect x={PAD.left + 60} y={PAD.top - 2} width="6" height="6" fill="#3b82f6" opacity="0.7" rx="1" />
      <text x={PAD.left + 68} y={PAD.top + 4} fontSize="7" fill="var(--muted)">Training</text>
    </svg>
  )
}

function MiniChart({ data, color = 'var(--accent)', height = 48 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 100
  const h = height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  const lastPt = pts.split(' ').at(-1)!.split(',')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <line x1="0" y1={h - 1} x2={w} y2={h - 1} stroke="var(--card-border)" strokeWidth="0.5" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={parseFloat(lastPt[0])} cy={parseFloat(lastPt[1])} r={2} fill={color} />
    </svg>
  )
}

function NumInput({ label, value, onChange, suffix, step, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; suffix?: string; step?: number; placeholder?: string
}) {
  return (
    <div>
      <label className="text-[10px] text-[var(--muted)] block mb-0.5">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          inputMode="decimal"
          step={step ?? 0.1}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[var(--surface)] border border-[var(--card-border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        {suffix && <span className="text-[10px] text-[var(--muted)] shrink-0">{suffix}</span>}
      </div>
    </div>
  )
}

function ScoreBtns({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex-1 py-1.5 border ${value === n ? 'bg-[var(--accent-glow)] border-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--card-border)] text-[var(--muted)]'}`}
          style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.06em' }}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function YesNoToggle({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`py-1.5 border ${value === true ? 'bg-[var(--accent-glow)] border-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--card-border)] text-[var(--muted)]'}`}
        style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 13, letterSpacing: '0.06em' }}
      >
        YES
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`py-1.5 border ${value === false ? 'bg-[var(--danger)]/20 border-[var(--danger)]' : 'bg-[var(--surface)] border-[var(--card-border)] text-[var(--muted)]'}`}
        style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 13, letterSpacing: '0.06em' }}
      >
        NO
      </button>
    </div>
  )
}

function ScoreSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const color = value >= 7 ? 'var(--success)' : value >= 5 ? 'var(--accent)' : 'var(--danger)'
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--muted)]">{label}</span>
        <span className="font-bold" style={{ color }}>{value}/10</span>
      </div>
      <input
        type="range" min="1" max="10" value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 accent-[var(--accent)]"
      />
    </div>
  )
}

function TrendValue({ current, previous, unit, inverted }: { current: number; previous?: number; unit: string; inverted?: boolean }) {
  if (!previous) return <span className="text-sm font-bold">{current}{unit}</span>
  const diff = current - previous
  const abs = Math.abs(diff)
  if (abs < 0.05) return <span className="text-sm font-bold">{current}{unit} <span className="text-[10px] text-[var(--muted)]">→</span></span>
  const isGood = inverted ? diff < 0 : diff > 0
  return (
    <span className="text-sm font-bold">
      {current}{unit}{' '}
      <span className={`text-[10px] ${isGood ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
        {diff > 0 ? '+' : ''}{diff.toFixed(1)}
      </span>
    </span>
  )
}

export default function ProgressTracker() {
  const [checkIns, setCheckIns] = useState<WeeklyCheckIn[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formStep, setFormStep] = useState<'body' | 'measurements' | 'photos' | 'subjective' | 'nutrition' | 'recovery' | 'competency' | 'adherence'>('body')
  const [postSubmitRec, setPostSubmitRec] = useState<PhaseRecommendation | null>(null)
  const [capturedPhotos, setCapturedPhotos] = useState<{ pose: 'front' | 'side' | 'back'; dataUrl: string }[]>([])
  const [historyPhotos, setHistoryPhotos] = useState<Record<string, StoredPhoto[]>>({})

  // Form state
  const [weight, setWeight] = useState('')
  const [bf, setBf] = useState('')
  const [measurements, setMeasurements] = useState<Record<string, string>>({
    chest: '', waist: '', hips: '', armLeft: '', armRight: '', thighLeft: '', thighRight: '',
  })
  const [scores, setScores] = useState<SubjectiveScores>({ energy: 7, strength: 7, hunger: 5, mood: 7, stress: 4, sleep: 7 })
  const [macroAdh, setMacroAdh] = useState('80')
  const [trainingAdh, setTrainingAdh] = useState('90')

  // New diagnostic fields
  const [mealsPerDay, setMealsPerDay] = useState('')
  const [hungerRating, setHungerRating] = useState<number | null>(null)
  const [cravingsLevel, setCravingsLevel] = useState<number | null>(null)
  const [alcoholSessions, setAlcoholSessions] = useState<number | null>(null)
  const [mealPrepDone, setMealPrepDone] = useState<boolean | null>(null)
  const [hoursOfSleep, setHoursOfSleep] = useState('')
  const [injuryNiggle, setInjuryNiggle] = useState('')
  const [stretchingDone, setStretchingDone] = useState<boolean | null>(null)
  const [executionQuality, setExecutionQuality] = useState<number | null>(null)
  const [compNutrition, setCompNutrition] = useState<number | null>(null)
  const [compTraining, setCompTraining] = useState<number | null>(null)
  const [compRecovery, setCompRecovery] = useState<number | null>(null)
  const [compMindset, setCompMindset] = useState<number | null>(null)
  const [compConsistency, setCompConsistency] = useState<number | null>(null)

  useEffect(() => {
    const p = getProfile()
    setProfile(p)
    const cis = getCheckIns().sort((a, b) => b.weekNumber - a.weekNumber)
    setCheckIns(cis)

    if (p) {
      setWeight(String(p.weightKg))
      setBf(String(p.bodyFatPercent))
    }

    // Load photos for check-ins that have them
    const loadPhotos = async () => {
      const photoMap: Record<string, StoredPhoto[]> = {}
      for (const ci of cis) {
        if (ci.photos.length > 0) {
          const photos = await getPhotosForCheckIn(ci.id)
          if (photos.length > 0) photoMap[ci.id] = photos
        }
      }
      setHistoryPhotos(photoMap)
    }
    loadPhotos()
  }, [])

  const resetForm = () => {
    setFormStep('body')
    setMeasurements({ chest: '', waist: '', hips: '', armLeft: '', armRight: '', thighLeft: '', thighRight: '' })
    setScores({ energy: 7, strength: 7, hunger: 5, mood: 7, stress: 4, sleep: 7 })
    setMacroAdh('80')
    setTrainingAdh('90')
    setCapturedPhotos([])
    setPostSubmitRec(null)
    setMealsPerDay('')
    setHungerRating(null)
    setCravingsLevel(null)
    setAlcoholSessions(null)
    setMealPrepDone(null)
    setHoursOfSleep('')
    setInjuryNiggle('')
    setStretchingDone(null)
    setExecutionQuality(null)
    setCompNutrition(null)
    setCompTraining(null)
    setCompRecovery(null)
    setCompMindset(null)
    setCompConsistency(null)
  }

  const submitCheckIn = async () => {
    if (!profile) return

    const parsedMeasurements: Measurements = {}
    if (measurements.chest) parsedMeasurements.chest = Number(measurements.chest)
    if (measurements.waist) parsedMeasurements.waist = Number(measurements.waist)
    if (measurements.hips) parsedMeasurements.hips = Number(measurements.hips)
    if (measurements.armLeft) parsedMeasurements.armLeft = Number(measurements.armLeft)
    if (measurements.armRight) parsedMeasurements.armRight = Number(measurements.armRight)
    if (measurements.thighLeft) parsedMeasurements.thighLeft = Number(measurements.thighLeft)
    if (measurements.thighRight) parsedMeasurements.thighRight = Number(measurements.thighRight)

    const checkInDate = new Date().toISOString().split('T')[0]
    // Derive week number from programStartDate rather than check-in count,
    // so skipped weeks don't corrupt the sequence.
    let weekNumber: number
    if (profile.programStartDate) {
      const start = new Date(profile.programStartDate + 'T12:00:00')
      const checkIn = new Date(checkInDate + 'T12:00:00')
      const days = Math.floor((checkIn.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
      weekNumber = Math.max(1, Math.floor(days / 7) + 1)
    } else {
      weekNumber = getCurrentWeekNumber(profile)
    }

    const checkInId = crypto.randomUUID()
    const checkin: WeeklyCheckIn = {
      id: checkInId,
      weekNumber,
      date: checkInDate,
      weightKg: Number(weight),
      bodyFatPercent: Number(bf),
      measurements: parsedMeasurements,
      photos: capturedPhotos.map(p => p.pose),
      subjective: scores,
      macroAdherence: Number(macroAdh),
      trainingAdherence: Number(trainingAdh),
      ...(mealsPerDay ? { mealsPerDay: Number(mealsPerDay) } : {}),
      ...(hungerRating !== null ? { hungerRating } : {}),
      ...(cravingsLevel !== null ? { cravingsLevel } : {}),
      ...(alcoholSessions !== null ? { alcoholSessions } : {}),
      ...(mealPrepDone !== null ? { mealPrepDone } : {}),
      ...(hoursOfSleep ? { hoursOfSleep: Number(hoursOfSleep) } : {}),
      ...(injuryNiggle.trim() ? { injuryNiggle: injuryNiggle.trim() } : {}),
      ...(stretchingDone !== null ? { stretchingDone } : {}),
      ...(executionQuality !== null ? { executionQuality } : {}),
      ...(compNutrition !== null && compTraining !== null && compRecovery !== null && compMindset !== null && compConsistency !== null
        ? { competencyScores: { nutrition: compNutrition, training: compTraining, recovery: compRecovery, mindset: compMindset, consistency: compConsistency } }
        : {}),
    }

    saveCheckIn(checkin)

    for (const photo of capturedPhotos) {
      await savePhoto({
        id: crypto.randomUUID(),
        checkInId,
        pose: photo.pose,
        dataUrl: photo.dataUrl,
        timestamp: Date.now(),
      })
    }

    // Update profile with latest weight/BF
    const updatedProfile = {
      ...profile,
      weightKg: Number(weight),
      bodyFatPercent: Number(bf),
    }
    saveProfile(updatedProfile)
    setProfile(updatedProfile)

    const newCheckIns = [checkin, ...checkIns]
    setCheckIns(newCheckIns)

    // Evaluate phase progression with new data
    const rec = evaluatePhaseProgression(updatedProfile, newCheckIns)
    setPostSubmitRec(rec)
    setShowForm(false)
  }

  // Adherence auto-calculation
  const calcAdherence = () => {
    const thisWeekStart = new Date()
    thisWeekStart.setDate(thisWeekStart.getDate() - 7)
    const dateStr = thisWeekStart.toISOString().split('T')[0]

    const recentWorkouts = getWorkouts().filter(w => w.date >= dateStr)
    const completedWorkouts = recentWorkouts.filter(w => w.completed).length
    const totalWorkouts = profile?.trainingDaysPerWeek ?? 5
    const tAdh = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0
    setTrainingAdh(String(Math.min(tAdh, 100)))

    const recentMeals = getMealPlans().filter(m => m.date >= dateStr)
    if (recentMeals.length > 0 && profile) {
      const targets = calculateMacros(profile)
      const avgCals = recentMeals.reduce((s, m) => s + m.totals.calories, 0) / recentMeals.length
      const calAdh = targets.calories > 0 ? Math.round((1 - Math.abs(avgCals - targets.calories) / targets.calories) * 100) : 0
      setMacroAdh(String(Math.max(0, Math.min(calAdh, 100))))
    }
  }

  const [measurementsExpanded, setMeasurementsExpanded] = useState(false)

  const latest = checkIns[0]
  const previous = checkIns[1]

  return (
    <div className="px-4 pt-2 pb-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 18, letterSpacing: '0.06em' }} className="uppercase">Progress</h2>
        <button
          onClick={() => { if (showForm) { setShowForm(false); resetForm() } else { setShowForm(true); resetForm() } }}
          className="bg-[var(--accent)] text-black px-4 py-2 rounded-full"
          style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 13, letterSpacing: '0.08em' }}
        >
          {showForm ? 'Cancel' : '+ Check-in'}
        </button>
      </div>

      {/* ─── Progress Charts ─── */}
      {checkIns.length >= 2 && (() => {
        const sorted = [...checkIns].sort((a, b) => a.weekNumber - b.weekNumber)
        const weekLabel = (ci: typeof sorted[0]) => `W${ci.weekNumber}`

        const weightData = sorted.map(ci => ({ label: weekLabel(ci), value: ci.weightKg }))
        const bfData = sorted.map(ci => ({ label: weekLabel(ci), value: ci.bodyFatPercent }))
        const adherenceData = sorted.map(ci => ({
          label: weekLabel(ci),
          macro: ci.macroAdherence,
          training: ci.trainingAdherence,
        }))

        return (
          <div className="space-y-3">
            <div className="bg-[var(--card)] p-4 border border-[var(--card-border)]" style={{ borderTop: '2px solid var(--accent)' }}>
              <p className="mb-2 uppercase" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>Weight Trend</p>
              <LineChart data={weightData} color="var(--accent)" chartId="weight" unit="kg" />
            </div>

            <div className="bg-[var(--card)] p-4 border border-[var(--card-border)]" style={{ borderTop: '2px solid var(--accent)' }}>
              <p className="mb-2 uppercase" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>Body Fat %</p>
              <LineChart data={bfData} color="#3b82f6" chartId="bf" unit="%" />
            </div>

            <div className="bg-[var(--card)] p-4 border border-[var(--card-border)]" style={{ borderTop: '2px solid var(--accent)' }}>
              <p className="mb-2 uppercase" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>Weekly Adherence</p>
              <BarChart data={adherenceData} />
            </div>

            {/* ─── LBM Trend Card ─── */}
            {(() => {
              const lbmData = sorted
                .filter(ci => ci.weightKg > 0 && ci.bodyFatPercent >= 0)
                .map(ci => ci.weightKg * (1 - ci.bodyFatPercent / 100))
              if (lbmData.length < 2) return null
              const latestLbm = lbmData[lbmData.length - 1]
              const firstLbm = lbmData[0]
              const lbmChange = latestLbm - firstLbm
              return (
                <div className="bg-[var(--card)] p-4 border border-[var(--card-border)]" style={{ borderTop: '2px solid var(--accent)' }}>
                  <p className="uppercase" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>LBM Trend</p>
                  <p className="text-[10px] text-[var(--muted)] mb-2">Lean body mass (kg)</p>
                  <MiniChart data={lbmData} color="var(--accent)" height={48} />
                  <div className="mt-2 flex items-end justify-between">
                    <span style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 28, letterSpacing: '0.06em', color: 'var(--accent)', lineHeight: 1 }}>
                      {latestLbm.toFixed(1)}<span style={{ fontSize: 14, marginLeft: 2 }}>kg</span>
                    </span>
                    <div className="text-right">
                      <p className={`text-[11px] font-bold ${lbmChange >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                        {lbmChange >= 0 ? '+' : ''}{lbmChange.toFixed(1)} kg
                      </p>
                      <p className="text-[9px] text-[var(--muted)]">Based on {lbmData.length} check-ins</p>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ─── Measurements Trend Card (collapsible) ─── */}
            {(() => {
              const measurementKeys: { key: keyof Measurements; label: string; color: string }[] = [
                { key: 'waist', label: 'WAIST', color: 'var(--muted-bright)' },
                { key: 'hips', label: 'HIPS', color: 'var(--muted-bright)' },
                { key: 'chest', label: 'CHEST', color: 'var(--muted-bright)' },
                { key: 'armLeft', label: 'L ARM', color: 'var(--accent)' },
                { key: 'thighLeft', label: 'L THIGH', color: 'var(--accent)' },
              ]
              const hasSomeData = measurementKeys.some(mk => {
                const vals = sorted.map(ci => ci.measurements?.[mk.key]).filter((v): v is number => typeof v === 'number')
                return vals.length >= 2
              })
              if (!hasSomeData) return null
              return (
                <div className="bg-[var(--card)] border border-[var(--card-border)]" style={{ borderTop: '2px solid var(--accent)' }}>
                  <button
                    className="w-full flex justify-between items-center p-4"
                    onClick={() => setMeasurementsExpanded(e => !e)}
                  >
                    <p className="uppercase" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>Measurements</p>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: measurementsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      <path d="M2 4.5L7 9.5L12 4.5" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {measurementsExpanded && (
                    <div className="px-4 pb-4 grid grid-cols-2 gap-4">
                      {measurementKeys.map(mk => {
                        const vals = sorted
                          .map(ci => ci.measurements?.[mk.key])
                          .filter((v): v is number => typeof v === 'number')
                        if (vals.length < 2) return null
                        const lastVal = vals[vals.length - 1]
                        return (
                          <div key={mk.key}>
                            <p className="text-[10px] uppercase text-[var(--muted)] mb-1">{mk.label}</p>
                            <MiniChart data={vals} color={mk.color} height={40} />
                            <p className="mt-1" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.06em' }}>{lastVal.toFixed(1)} cm</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )
      })()}

      {/* ─── Check-in Form ─── */}
      {showForm && (
        <div className="bg-[var(--card)] p-4 border border-[var(--card-border)] space-y-4" style={{ borderTop: '2px solid var(--accent)' }}>
          <div className="flex justify-between items-center">
            <h3 className="uppercase" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>Weekly Check-in</h3>
            <div className="flex gap-1">
              {(['body', 'measurements', 'photos', 'subjective', 'nutrition', 'recovery', 'competency', 'adherence'] as const).map((s, i) => (
                <div key={s} className={`w-4 h-1 ${
                  (['body', 'measurements', 'photos', 'subjective', 'nutrition', 'recovery', 'competency', 'adherence'] as const).indexOf(formStep) >= i ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'
                }`} />
              ))}
            </div>
          </div>

          {formStep === 'body' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)]">Weigh in same time, same conditions, fasted.</p>
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Weight (kg)" value={weight} onChange={setWeight} suffix="kg" placeholder={latest ? String(latest.weightKg) : ''} />
                <NumInput label="Body Fat %" value={bf} onChange={setBf} suffix="%" placeholder={latest ? String(latest.bodyFatPercent) : ''} />
              </div>
              {Number(weight) > 0 && Number(bf) > 0 && (
                <div className="bg-[var(--surface)] p-2 flex justify-between border border-[var(--card-border)]">
                  <span className="text-[10px] text-[var(--muted)]">LBM</span>
                  <span className="text-xs font-bold text-[var(--accent)]">{calculateLBM(Number(weight), Number(bf)).toFixed(1)} kg</span>
                </div>
              )}
              {latest && Number(weight) > 0 && (
                <div className="bg-[var(--surface)] p-2 flex justify-between border border-[var(--card-border)]">
                  <span className="text-[10px] text-[var(--muted)]">Change from last week</span>
                  <span className={`text-xs font-bold ${(() => { const diff = Number(weight) - latest.weightKg; const wantDown = profile?.goal === 'cut' || profile?.goal === 'contest-prep'; return (wantDown ? diff < 0 : diff > 0) ? 'text-[var(--success)]' : 'text-[var(--danger)]' })()}`}>
                    {(Number(weight) - latest.weightKg) > 0 ? '+' : ''}{(Number(weight) - latest.weightKg).toFixed(1)} kg
                  </span>
                </div>
              )}
            </div>
          )}

          {formStep === 'measurements' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)]">Body measurements in cm. Skip any you don&apos;t measure.</p>
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Chest" value={measurements.chest} onChange={v => setMeasurements({ ...measurements, chest: v })} suffix="cm" />
                <NumInput label="Waist" value={measurements.waist} onChange={v => setMeasurements({ ...measurements, waist: v })} suffix="cm" />
                <NumInput label="Hips" value={measurements.hips} onChange={v => setMeasurements({ ...measurements, hips: v })} suffix="cm" />
                <NumInput label="Left Arm" value={measurements.armLeft} onChange={v => setMeasurements({ ...measurements, armLeft: v })} suffix="cm" />
                <NumInput label="Right Arm" value={measurements.armRight} onChange={v => setMeasurements({ ...measurements, armRight: v })} suffix="cm" />
                <NumInput label="Left Thigh" value={measurements.thighLeft} onChange={v => setMeasurements({ ...measurements, thighLeft: v })} suffix="cm" />
                <NumInput label="Right Thigh" value={measurements.thighRight} onChange={v => setMeasurements({ ...measurements, thighRight: v })} suffix="cm" />
              </div>
            </div>
          )}

          {formStep === 'photos' && (
            <PhotoCapture photos={capturedPhotos} onPhotosChange={setCapturedPhotos} />
          )}

          {formStep === 'subjective' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)]">Rate each 1–10 for this past week.</p>
              <ScoreSlider label="Energy" value={scores.energy} onChange={v => setScores({ ...scores, energy: v })} />
              <ScoreSlider label="Strength" value={scores.strength} onChange={v => setScores({ ...scores, strength: v })} />
              <ScoreSlider label="Hunger" value={scores.hunger} onChange={v => setScores({ ...scores, hunger: v })} />
              <ScoreSlider label="Mood" value={scores.mood} onChange={v => setScores({ ...scores, mood: v })} />
              <ScoreSlider label="Stress" value={scores.stress} onChange={v => setScores({ ...scores, stress: v })} />
              <ScoreSlider label="Sleep" value={scores.sleep} onChange={v => setScores({ ...scores, sleep: v })} />
            </div>
          )}

          {formStep === 'nutrition' && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--muted)]">Nutrition diagnostics for this past week.</p>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] block mb-1">Meals per day</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMealsPerDay(String(n))}
                      className={`flex-1 py-1.5 border ${mealsPerDay === String(n) ? 'bg-[var(--accent-glow)] border-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--card-border)] text-[var(--muted)]'}`}
                      style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.06em' }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] block mb-0.5">Hunger (1=starving, 5=no hunger)</label>
                <ScoreBtns value={hungerRating} onChange={setHungerRating} />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] block mb-0.5">Cravings (1=intense, 5=none)</label>
                <ScoreBtns value={cravingsLevel} onChange={setCravingsLevel} />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] block mb-1">Alcohol sessions this week</label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAlcoholSessions(n)}
                      className={`flex-1 py-1.5 border ${alcoholSessions === n ? 'bg-[var(--accent-glow)] border-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--card-border)] text-[var(--muted)]'}`}
                      style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.06em' }}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAlcoholSessions(5)}
                    className={`flex-1 py-1.5 border ${alcoholSessions === 5 ? 'bg-[var(--accent-glow)] border-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--card-border)] text-[var(--muted)]'}`}
                    style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.06em' }}
                  >
                    5+
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] block mb-1">Meal prep done this week</label>
                <YesNoToggle value={mealPrepDone} onChange={setMealPrepDone} />
              </div>
            </div>
          )}

          {formStep === 'recovery' && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--muted)]">Recovery, lifestyle, and training quality.</p>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] block mb-0.5">Avg hours sleep per night</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.5}
                    min={0}
                    max={14}
                    value={hoursOfSleep}
                    onChange={e => setHoursOfSleep(e.target.value)}
                    placeholder="e.g. 7.5"
                    className="w-full bg-[var(--surface)] border border-[var(--card-border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  />
                  <span className="text-[10px] text-[var(--muted)] shrink-0">hrs</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] block mb-1">Stretching / mobility done</label>
                <YesNoToggle value={stretchingDone} onChange={setStretchingDone} />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] block mb-0.5">Injury niggles</label>
                <input
                  type="text"
                  value={injuryNiggle}
                  onChange={e => setInjuryNiggle(e.target.value)}
                  placeholder="e.g. left knee ache"
                  className="w-full bg-[var(--surface)] border border-[var(--card-border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] block mb-0.5">Execution quality (1=poor, 5=excellent)</label>
                <ScoreBtns value={executionQuality} onChange={setExecutionQuality} />
              </div>
            </div>
          )}

          {formStep === 'competency' && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--muted)]">Rate yourself 1–5 across each dimension this week.</p>

              {([
                { label: 'Nutrition', value: compNutrition, setter: setCompNutrition },
                { label: 'Training', value: compTraining, setter: setCompTraining },
                { label: 'Recovery', value: compRecovery, setter: setCompRecovery },
                { label: 'Mindset', value: compMindset, setter: setCompMindset },
                { label: 'Consistency', value: compConsistency, setter: setCompConsistency },
              ] as Array<{ label: string; value: number | null; setter: (v: number) => void }>).map(({ label, value, setter }) => (
                <div key={label}>
                  <label className="text-[10px] uppercase tracking-widest text-[var(--muted)] block mb-0.5">{label}</label>
                  <ScoreBtns value={value} onChange={setter} />
                </div>
              ))}

              {compNutrition && compTraining && compRecovery && compMindset && compConsistency && (
                <div className="bg-[var(--surface)] border border-[var(--card-border)] p-2 flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Total Score</span>
                  <span style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em', color: 'var(--accent)' }}>
                    {compNutrition + compTraining + compRecovery + compMindset + compConsistency}/25
                  </span>
                </div>
              )}
            </div>
          )}

          {formStep === 'adherence' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)]">How consistently did you follow the plan this week?</p>
              <button onClick={calcAdherence} className="text-[10px] text-[var(--accent)] font-bold underline">
                Auto-calculate from logged data
              </button>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[var(--muted)] block mb-0.5">Nutrition adherence</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min="0" max="100" value={macroAdh}
                      onChange={e => setMacroAdh(e.target.value)}
                      className="flex-1 h-1.5 accent-[var(--accent)]"
                    />
                    <span className="text-xs font-bold w-8 text-right">{macroAdh}%</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[var(--muted)] block mb-0.5">Training adherence</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min="0" max="100" value={trainingAdh}
                      onChange={e => setTrainingAdh(e.target.value)}
                      className="flex-1 h-1.5 accent-[var(--accent)]"
                    />
                    <span className="text-xs font-bold w-8 text-right">{trainingAdh}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2">
            {formStep !== 'body' && (
              <button
                onClick={() => {
                  const steps = ['body', 'measurements', 'photos', 'subjective', 'nutrition', 'recovery', 'competency', 'adherence'] as const
                  setFormStep(steps[steps.indexOf(formStep) - 1])
                }}
                className="flex-1 py-2.5 text-xs font-bold border border-[var(--card-border)] text-[var(--muted)]"
              >
                Back
              </button>
            )}
            {formStep === 'adherence' ? (
              <button
                onClick={submitCheckIn}
                disabled={!weight || bf === ''}
                className="flex-1 bg-[var(--accent)] text-black font-bold py-2.5 text-xs disabled:opacity-30"
              >
                Save Check-in
              </button>
            ) : (
              <button
                onClick={() => {
                  const steps = ['body', 'measurements', 'photos', 'subjective', 'nutrition', 'recovery', 'competency', 'adherence'] as const
                  setFormStep(steps[steps.indexOf(formStep) + 1])
                }}
                disabled={formStep === 'body' && (!weight || bf === '')}
                className="flex-1 bg-[var(--accent)] text-black font-bold py-2.5 text-xs disabled:opacity-30"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Post-submit phase recommendation ─── */}
      {postSubmitRec && postSubmitRec.reasons.length > 0 && (
        <div className={`p-4 border ${
          postSubmitRec.urgency === 'action' ? 'bg-[var(--danger)]/10 border-[var(--danger)]' :
          postSubmitRec.urgency === 'warning' ? 'bg-[var(--accent)]/10 border-[var(--accent)]' :
          'bg-[var(--card)] border-[var(--card-border)]'
        }`}>
          <h3 className="mb-1 uppercase" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>
            {postSubmitRec.shouldSwitch ? 'Phase Switch Recommended' : 'Phase Assessment'}
          </h3>
          {postSubmitRec.shouldSwitch && (
            <p className="text-xs font-bold text-[var(--accent)] mb-2">→ {postSubmitRec.recommendedPhase}</p>
          )}
          <ul className="space-y-0.5">
            {postSubmitRec.reasons.map((r, i) => (
              <li key={i} className="text-[10px]">• {r}</li>
            ))}
          </ul>
          {postSubmitRec.adjustments.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[var(--card-border)]">
              {postSubmitRec.adjustments.map((a, i) => (
                <p key={i} className="text-[10px] text-[var(--muted)]">
                  {a.direction === 'increase' ? '↑' : '↓'} {a.type}: {a.amount}
                </p>
              ))}
            </div>
          )}
          {postSubmitRec.shouldSwitch && profile && (
            <button
              onClick={() => {
                const updated = {
                  ...profile,
                  currentPhase: postSubmitRec.recommendedPhase,
                  ...(postSubmitRec.recommendedPhilosophy ? { trainingPhilosophy: postSubmitRec.recommendedPhilosophy } : {}),
                }
                if (postSubmitRec.recommendedPhilosophy) startNextBlockIfDue(updated)
                saveProfile(updated)
                setProfile(updated)
                setPostSubmitRec(null)
              }}
              className="mt-2 w-full bg-[var(--accent)] text-black font-bold py-2 text-xs"
            >
              Switch to {postSubmitRec.recommendedPhase}
            </button>
          )}
        </div>
      )}

      {/* ─── Macro recalc notification ─── */}
      {postSubmitRec && profile && (
        <div className="bg-[var(--card)] p-3 border border-[var(--card-border)]">
          <p className="mb-1 uppercase" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>Updated Targets</p>
          {(() => {
            const m = calculateMacros(profile)
            return (
              <p className="text-[10px] text-[var(--muted)]">
                {m.calories} kcal · {m.protein}g P · {m.carbs}g C · {m.fats}g F
              </p>
            )
          })()}
          <p className="text-[9px] text-[var(--muted)] mt-1">Macros recalculated from your updated weight and body fat.</p>
        </div>
      )}

      {/* ─── Check-in History ─── */}
      {checkIns.length > 0 ? (
        <div className="space-y-2">
          <h3 className="uppercase" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>History</h3>
          {checkIns.map((ci, idx) => {
            const prev = checkIns[idx + 1]
            return (
              <div key={ci.id} className="bg-[var(--card)] p-3 border border-[var(--card-border)]">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 15, letterSpacing: '0.06em' }}>WEEK {ci.weekNumber}</p>
                    <p className="text-[10px] text-[var(--muted)]">{ci.date}</p>
                  </div>
                  <div className="text-right">
                    <TrendValue current={ci.weightKg} previous={prev?.weightKg} unit="kg" inverted />
                    <p className="text-[10px] text-[var(--muted)]">{ci.bodyFatPercent}% BF · {calculateLBM(ci.weightKg, ci.bodyFatPercent).toFixed(1)}kg LBM</p>
                  </div>
                </div>

                {/* Subjective scores row */}
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {Object.entries(ci.subjective).map(([key, val]) => (
                    <span key={key} className={`text-[9px] rounded-full px-1.5 py-0.5 font-bold ${
                      val >= 7 ? 'bg-[var(--success)]/20 text-[var(--success)]' :
                      val >= 5 ? 'bg-[var(--accent)]/20 text-[var(--accent)]' :
                      'bg-[var(--danger)]/20 text-[var(--danger)]'
                    }`}>
                      {key}: {val}
                    </span>
                  ))}
                </div>

                {/* Adherence */}
                {(ci.macroAdherence > 0 || ci.trainingAdherence > 0) && (
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-[9px] text-[var(--muted)]">Nutrition: {ci.macroAdherence}%</span>
                    <span className="text-[9px] text-[var(--muted)]">Training: {ci.trainingAdherence}%</span>
                    {ci.competencyScores && (
                      <span className="text-[9px] text-[var(--muted)]">
                        Score: {ci.competencyScores.nutrition + ci.competencyScores.training + ci.competencyScores.recovery + ci.competencyScores.mindset + ci.competencyScores.consistency}/25
                      </span>
                    )}
                  </div>
                )}

                {/* Progress photos */}
                {historyPhotos[ci.id] && historyPhotos[ci.id].length > 0 && (
                  <div className="flex gap-1.5 mt-2">
                    {historyPhotos[ci.id].map(photo => (
                      <div key={photo.id} className="relative w-16 h-20 overflow-hidden border border-[var(--card-border)]">
                        <img src={photo.dataUrl} alt={photo.pose} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center">
                          <span className="text-[7px] font-bold text-white uppercase">{photo.pose}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Measurements if present */}
                {ci.measurements && Object.keys(ci.measurements).length > 0 && (
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {Object.entries(ci.measurements).map(([key, val]) => val ? (
                      <span key={key} className="text-[9px] text-[var(--muted)]">{key}: {val}cm</span>
                    ) : null)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center text-[var(--muted)] text-sm py-8">
          No check-ins yet. Tap + Check-in to log your first.
        </div>
      )}
    </div>
  )
}
