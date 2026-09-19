'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { calculateMacros } from '@/lib/nutrition-engine'
import { getCurrentPhase } from '@/lib/philosophy-engine'
import type { UserProfile, TrainingPhilosophy } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientProfile {
  current_phase: string | null
  week_number: number | null
  weight_kg: number | null
  body_fat_percent: number | null
  training_philosophy: string | null
  goal: string | null
  program_start_date: string | null
  age?: number | null
  sex?: string | null
  occupation?: string | null
  activity_factor?: number | null
  training_days_per_week?: number | null
  daily_step_target?: number | null
}

interface ClientRow {
  id: string
  name: string
  email: string
  tier: string | null
  client_profiles: ClientProfile | ClientProfile[] | null
}

interface CheckIn {
  id: string
  user_id: string
  week_number: number
  date: string
  weight_kg: number | null
  body_fat_percent: number | null
  measurements: Record<string, number> | null
  subjective: { energy?: number; mood?: number; strength?: number; hunger?: number; stress?: number; sleep?: number } | null
  macro_adherence: number | null
  training_adherence: number | null
  meals_per_day: number | null
  hunger_rating: number | null
  cravings_level: number | null
  alcohol_sessions: number | null
  meal_prep_done: boolean | null
  hours_of_sleep: number | null
  injury_niggle: string | null
  stretching_done: boolean | null
  execution_quality: number | null
  competency_scores: { nutrition: number; training: number; recovery: number; mindset: number; consistency: number } | null
  coach_reviewed: boolean | null
  coach_notes: string | null
  loom_url: string | null
  promotion_recommended: boolean | null
  promotion_confirmed: boolean | null
  section_scores: { nutrition?: number; training?: number; recovery?: number; wellbeing?: number } | null
  created_at: string
}

interface ClientFlag {
  id: string
  client_id: string
  coach_id: string
  flag_type: string
  flag_data: Record<string, unknown> | null
  severity: 'red' | 'amber'
  resolved: boolean
  created_at: string
}

// ─── View-as-client (read-only) ───

interface WorkoutSetRow {
  setNumber: number
  targetReps: string
  actualReps?: number
  weight?: number
  rpe?: number
  completed: boolean
}

interface WorkoutExerciseRow {
  name: string
  targetMuscle: string
  sets: WorkoutSetRow[]
  notes?: string
}

interface WorkoutLogRow {
  date: string
  week_number: number | null
  philosophy: string | null
  exercises: WorkoutExerciseRow[] | null
  notes: string | null
  execution_quality: number | null
}

interface MealFoodRow {
  name: string
  grams?: number
  calories?: number
}

interface MealRow {
  name: string
  time?: string
  foods: MealFoodRow[]
  totals?: { calories: number; protein: number; carbs: number; fats: number }
}

interface MealPlanRow {
  date: string
  meals: MealRow[] | null
  target_calories: number | null
  logged_calories: number | null
}

// ─── Prescribe workout (write) ───

interface PrescribeExerciseForm {
  name: string
  targetMuscle: string
  setsCount: number
  targetReps: string
  notes: string
}

interface PrescribeForm {
  date: string
  philosophy: string
  splitDay: string
  phase: string
  dayNotes: string
  exercises: PrescribeExerciseForm[]
}

const TRAINING_PHILOSOPHIES = ['y3t', 'mi40', 'fst7', 'phat', 'corey-g', 'incredible-bulk', 'dtp', 'hit', 'bompa', 'contest-prep']

const EMPTY_EXERCISE: PrescribeExerciseForm = { name: '', targetMuscle: '', setsCount: 3, targetReps: '8-12', notes: '' }

function emptyPrescribeForm(): PrescribeForm {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return {
    date: tomorrow.toISOString().split('T')[0],
    philosophy: 'y3t',
    splitDay: '',
    phase: '',
    dayNotes: '',
    exercises: [{ ...EMPTY_EXERCISE }],
  }
}

interface EnrichedClient {
  id: string
  name: string
  email: string
  tier: string | null
  profile: ClientProfile | null
  latestCheckIn: CheckIn | null
  recentCheckIns: CheckIn[]
  flags: ClientFlag[]
  daysSinceCheckIn: number | null
  latestWorkout: WorkoutLogRow | null
  latestMealPlan: MealPlanRow | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(dateStr: string | null | undefined, now: Date): number {
  if (!dateStr) return 9999
  const d = new Date(dateStr)
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function totalCompScore(scores: CheckIn['competency_scores']): number {
  if (!scores) return 0
  return scores.nutrition + scores.training + scores.recovery + scores.mindset + scores.consistency
}

// Reuses the exact same calculation the client's own app runs, so the coach
// sees the identical targets rather than a second, possibly-drifting formula.
// Returns null when the synced profile doesn't have enough fields yet
// (e.g. an older row from before occupation/activity fields were synced).
function computeClientMacros(p: ClientProfile | null) {
  if (!p || p.weight_kg == null || p.body_fat_percent == null || p.age == null || !p.sex || !p.goal) return null
  const profile: UserProfile = {
    name: '',
    age: p.age,
    heightCm: 0,
    weightKg: p.weight_kg,
    sex: p.sex as UserProfile['sex'],
    bodyFatPercent: p.body_fat_percent,
    activityFactor: (p.activity_factor as UserProfile['activityFactor']) ?? 1.55,
    goal: p.goal as UserProfile['goal'],
    trainingPhilosophy: (p.training_philosophy as TrainingPhilosophy) ?? 'hit',
    currentPhase: p.current_phase ?? '',
    weekNumber: p.week_number ?? 1,
    dailyStepTarget: p.daily_step_target ?? 8000,
    trainingDaysPerWeek: p.training_days_per_week ?? 5,
    occupation: (p.occupation as UserProfile['occupation']) ?? 'sedentary',
  }
  return calculateMacros(profile)
}

function checkInDaysAgo(client: EnrichedClient): number | null {
  if (!client.latestCheckIn) return null
  return daysBetween(client.latestCheckIn.date, new Date())
}

const FLAG_LABELS: Record<string, string> = {
  missed_checkin: 'Missed Check-In',
  consecutive_missed_checkins: '⚠ 3 Consecutive Missed Check-Ins',
  weight_spike: 'Weight Spike (>3kg)',
  weight_stall: 'Weight Stalled (3+ weeks)',
  injury_reported: '🏥 Injury Reported',
  low_wellbeing: 'Low Well-Being Score',
  low_compliance: 'Low Compliance',
  promotion_ready: '✓ Promotion Recommended',
  high_alcohol: 'High Alcohol Intake',
  no_workouts: 'No Workouts Logged',
}

function generateAutoFlags(
  client: EnrichedClient,
  existingFlags: ClientFlag[]
): Array<{ type: string; severity: 'red' | 'amber'; data?: Record<string, unknown> }> {
  const flags: Array<{ type: string; severity: 'red' | 'amber'; data?: Record<string, unknown> }> = []
  const now = new Date()
  const checkIns = client.recentCheckIns
  const latest = checkIns[0] ?? null

  const alreadyFlagged = (type: string) =>
    existingFlags.some((e) => e.flag_type === type && !e.resolved)

  if (!latest) {
    const daysSinceStart = client.profile?.program_start_date
      ? daysBetween(client.profile.program_start_date, now)
      : 9999
    if (daysSinceStart > 7 && !alreadyFlagged('missed_checkin')) {
      flags.push({ type: 'missed_checkin', severity: 'amber' })
    }
  } else {
    const daysSinceLast = daysBetween(latest.date, now)
    if (daysSinceLast > 7 && !alreadyFlagged('missed_checkin')) {
      flags.push({ type: 'missed_checkin', severity: 'amber' })
    }
    if (daysSinceLast > 21 && !alreadyFlagged('consecutive_missed_checkins')) {
      flags.push({ type: 'consecutive_missed_checkins', severity: 'red' })
    }

    if (checkIns.length >= 2) {
      const w1 = latest.weight_kg ?? 0
      const w2 = checkIns[1].weight_kg ?? 0
      const change = Math.abs(w1 - w2)
      if (change > 3 && !alreadyFlagged('weight_spike')) {
        flags.push({ type: 'weight_spike', severity: 'amber', data: { change } })
      }
    }

    if (checkIns.length >= 3) {
      const w0 = checkIns[0].weight_kg ?? 0
      const w2 = checkIns[2].weight_kg ?? 0
      const totalChange = Math.abs(w0 - w2)
      if (totalChange < 0.2 && !alreadyFlagged('weight_stall')) {
        flags.push({ type: 'weight_stall', severity: 'amber' })
      }
    }

    if (latest.injury_niggle && !alreadyFlagged('injury_reported')) {
      flags.push({ type: 'injury_reported', severity: 'red', data: { note: latest.injury_niggle } })
    }

    const energy = latest.subjective?.energy ?? 5
    const mood = latest.subjective?.mood ?? 5
    if ((energy < 4 || mood < 4) && !alreadyFlagged('low_wellbeing')) {
      flags.push({ type: 'low_wellbeing', severity: 'amber' })
    }

    if ((latest.macro_adherence ?? 100) < 50 && !alreadyFlagged('low_compliance')) {
      flags.push({ type: 'low_compliance', severity: 'amber' })
    }

    if ((latest.alcohol_sessions ?? 0) > 4 && !alreadyFlagged('high_alcohol')) {
      flags.push({ type: 'high_alcohol', severity: 'amber' })
    }

    // Promotion check
    const withScores = checkIns.filter((c) => c.competency_scores).slice(0, 3)
    if (withScores.length >= 2) {
      const totalSum = withScores.reduce((s, c) => s + totalCompScore(c.competency_scores), 0)
      const avg = totalSum / withScores.length
      if (avg >= 20 && !alreadyFlagged('promotion_ready')) {
        flags.push({ type: 'promotion_ready', severity: 'amber', data: { score: avg } })
      }
    }
  }

  return flags
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'accent' }) {
  if (variant === 'accent') {
    return (
      <span style={{
        fontSize: 9,
        padding: '2px 6px',
        background: 'var(--accent-glow)',
        border: '1px solid var(--accent)',
        color: 'var(--accent)',
        letterSpacing: '0.06em',
        fontFamily: 'inherit',
        textTransform: 'uppercase',
      }}>
        {children}
      </span>
    )
  }
  return (
    <span style={{
      fontSize: 9,
      padding: '2px 6px',
      background: 'var(--surface)',
      border: '1px solid var(--card-border)',
      color: 'var(--muted)',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    }}>
      {children}
    </span>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--card-border)',
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{
        fontFamily: "'Bebas Neue', impact, sans-serif",
        fontSize: 22,
        letterSpacing: '0.06em',
        color: 'var(--foreground)',
        lineHeight: 1,
      }}>{value}</div>
    </div>
  )
}

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const color = value >= 80 ? 'var(--success)' : value >= 60 ? 'var(--accent)' : 'var(--danger)'
  return (
    <div style={{ height: 6, background: 'var(--card-border)', width: '100%' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.3s' }} />
    </div>
  )
}

function MiniBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = (value / max) * 100
  const color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--accent)' : 'var(--danger)'
  return (
    <div style={{ height: 4, background: 'var(--card-border)', width: 60, display: 'inline-block' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color }} />
    </div>
  )
}

function CheckInDaysBadge({ days }: { days: number | null }) {
  if (days === null) return <span style={{ fontSize: 10, color: 'var(--danger)' }}>NO CHECK-INS</span>
  const color = days < 3 ? 'var(--success)' : days <= 7 ? 'var(--accent)' : 'var(--danger)'
  return (
    <span style={{ fontSize: 10, color }}>
      {days === 0 ? 'Today' : `${days}d ago`}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CoachPortal() {
  const [coachId, setCoachId] = useState<string | null>(null)
  const [coachName, setCoachName] = useState<string>('')
  const [clients, setClients] = useState<EnrichedClient[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Coach review state for selected client
  const [reviewDraft, setReviewDraft] = useState<{
    loomUrl: string
    notes: string
    promotionRecommended: boolean
    coachReviewed: boolean
  }>({ loomUrl: '', notes: '', promotionRecommended: false, coachReviewed: false })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  // ── Auth & load ──
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated. Sign in as a coach to access this portal.')
        setLoading(false)
        return
      }

      // Get coach profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'coach') {
        setError('This portal is for coaches only.')
        setLoading(false)
        return
      }

      setCoachId(profile.id)
      setCoachName(profile.name ?? 'Coach')
      await loadClients(profile.id)
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadClients = useCallback(async (cId: string) => {
    const now = new Date()

    // 1. Fetch clients
    const { data: rawClients, error: cErr } = await supabase
      .from('profiles')
      .select(`
        id, name, email, tier,
        client_profiles (
          current_phase, week_number, weight_kg, body_fat_percent,
          training_philosophy, goal, program_start_date, age, sex,
          occupation, activity_factor, training_days_per_week, daily_step_target
        )
      `)
      .eq('coach_id', cId)

    if (cErr || !rawClients) return

    // 2. Fetch unresolved flags for all clients
    const { data: allFlags } = await supabase
      .from('client_flags')
      .select('*')
      .eq('coach_id', cId)
      .eq('resolved', false)
      .order('created_at', { ascending: false })

    const flagsByClient: Record<string, ClientFlag[]> = {}
    for (const f of allFlags ?? []) {
      if (!flagsByClient[f.client_id]) flagsByClient[f.client_id] = []
      flagsByClient[f.client_id].push(f)
    }

    // 3. Fetch last 3 check-ins per client in parallel
    const enriched: EnrichedClient[] = await Promise.all(
      (rawClients as ClientRow[]).map(async (c) => {
        const profile = Array.isArray(c.client_profiles)
          ? (c.client_profiles[0] ?? null)
          : (c.client_profiles ?? null)

        const [{ data: checkIns }, { data: workoutRows }, { data: mealRows }] = await Promise.all([
          supabase
            .from('check_ins')
            .select('*')
            .eq('user_id', c.id)
            .order('week_number', { ascending: false })
            .limit(3),
          supabase
            .from('workout_logs')
            .select('date, week_number, philosophy, exercises, notes, execution_quality')
            .eq('user_id', c.id)
            .order('date', { ascending: false })
            .limit(1),
          supabase
            .from('meal_plans')
            .select('date, meals, target_calories, logged_calories')
            .eq('user_id', c.id)
            .order('date', { ascending: false })
            .limit(1),
        ])

        const recentCheckIns: CheckIn[] = checkIns ?? []
        const latestCheckIn = recentCheckIns[0] ?? null
        const existingFlags = flagsByClient[c.id] ?? []

        const client: EnrichedClient = {
          id: c.id,
          name: c.name,
          email: c.email,
          tier: c.tier,
          profile,
          latestCheckIn,
          recentCheckIns,
          flags: existingFlags,
          daysSinceCheckIn: latestCheckIn ? daysBetween(latestCheckIn.date, now) : null,
          latestWorkout: (workoutRows?.[0] as WorkoutLogRow) ?? null,
          latestMealPlan: (mealRows?.[0] as MealPlanRow) ?? null,
        }

        // 4. Auto-generate flags
        const newFlags = generateAutoFlags(client, existingFlags)
        if (newFlags.length > 0) {
          const inserts = newFlags.map((f) => ({
            client_id: c.id,
            coach_id: cId,
            flag_type: f.type,
            flag_data: f.data ?? null,
            severity: f.severity,
            resolved: false,
          }))
          const { data: inserted } = await supabase
            .from('client_flags')
            .insert(inserts)
            .select()
          if (inserted) {
            client.flags = [...existingFlags, ...inserted]
          }
        }

        return client
      })
    )

    setClients(enriched)
  }, [supabase])

  // ── When client selected, populate review draft ──
  const selectedClient = clients.find((c) => c.id === selectedId) ?? null

  useEffect(() => {
    if (!selectedClient?.latestCheckIn) return
    const ci = selectedClient.latestCheckIn
    setReviewDraft({
      loomUrl: ci.loom_url ?? '',
      notes: ci.coach_notes ?? '',
      promotionRecommended: ci.promotion_recommended ?? false,
      coachReviewed: ci.coach_reviewed ?? false,
    })
    setSaveMsg(null)
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveReview() {
    if (!selectedClient?.latestCheckIn) return
    setSaving(true)
    setSaveMsg(null)
    const { error: err } = await supabase
      .from('check_ins')
      .update({
        loom_url: reviewDraft.loomUrl || null,
        coach_notes: reviewDraft.notes || null,
        promotion_recommended: reviewDraft.promotionRecommended,
        coach_reviewed: reviewDraft.coachReviewed,
      })
      .eq('id', selectedClient.latestCheckIn.id)

    setSaving(false)
    setSaveMsg(err ? 'Save failed.' : 'Saved.')
    setTimeout(() => setSaveMsg(null), 3000)
  }

  async function handlePrescribeWorkout(clientId: string, form: PrescribeForm): Promise<boolean> {
    const exercises = form.exercises.map((ex, i) => ({
      id: crypto.randomUUID(),
      exerciseId: ex.name.trim().toLowerCase().replace(/\s+/g, '-'),
      name: ex.name.trim(),
      targetMuscle: ex.targetMuscle.trim(),
      sets: Array.from({ length: Math.max(1, ex.setsCount) }, (_, si) => ({
        setNumber: si + 1,
        targetReps: ex.targetReps.trim() || '8-12',
        completed: false,
      })),
      tempo: '3-0-1-0',
      restSeconds: 90,
      notes: ex.notes.trim(),
      order: i,
    }))

    const { error } = await supabase.from('workout_logs').upsert(
      {
        user_id: clientId,
        date: form.date,
        philosophy: form.philosophy,
        split_day: form.splitDay || null,
        phase: form.phase || null,
        exercises,
        notes: form.dayNotes || null,
        coach_edited: true,
      },
      { onConflict: 'user_id,date' }
    )

    if (error) return false

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              latestWorkout: {
                date: form.date,
                week_number: c.profile?.week_number ?? null,
                philosophy: form.philosophy,
                exercises,
                notes: form.dayNotes || null,
                execution_quality: null,
              },
            }
          : c
      )
    )
    return true
  }

  async function handleResolveFlag(flagId: string) {
    await supabase.from('client_flags').update({ resolved: true }).eq('id', flagId)
    setClients((prev) =>
      prev.map((c) => ({
        ...c,
        flags: c.flags.map((f) => (f.id === flagId ? { ...f, resolved: true } : f)),
      }))
    )
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // ── Trend arrow ──
  function trendArrow(current: number | null, prev: number | null, lowerIsBetter = false): string {
    if (current == null || prev == null) return '—'
    if (current === prev) return '→'
    const up = current > prev
    if (lowerIsBetter) return up ? '↑' : '↓'
    return up ? '↑' : '↓'
  }

  function trendColor(current: number | null, prev: number | null, lowerIsBetter = false): string {
    if (current == null || prev == null) return 'var(--muted)'
    if (current === prev) return 'var(--muted)'
    const up = current > prev
    const good = lowerIsBetter ? !up : up
    return good ? 'var(--success)' : 'var(--danger)'
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
        Loading coach portal…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', impact, sans-serif", fontSize: 28, letterSpacing: '0.06em', color: 'var(--foreground)' }}>ACCESS DENIED</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, maxWidth: 320 }}>{error}</div>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '10px 28px',
            background: 'var(--accent)',
            color: '#000',
            fontFamily: "'Bebas Neue', impact, sans-serif",
            fontSize: 14,
            letterSpacing: '0.1em',
            textDecoration: 'none',
          }}
        >
          SIGN IN
        </a>
      </div>
    )
  }

  const unresolvedFlags = (id: string) => clients.find((c) => c.id === id)?.flags.filter((f) => !f.resolved) ?? []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', fontFamily: 'var(--font-body), Lekton, monospace' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'var(--card)',
        borderBottom: '1px solid var(--accent)',
        padding: '0 20px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </a>
          <span style={{ fontFamily: "'Bebas Neue', impact, sans-serif", fontSize: 20, letterSpacing: '0.06em', color: 'var(--foreground)' }}>
            ATHLETIC ODYSSEY
          </span>
          <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>COACH PORTAL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: 'var(--muted-bright)', letterSpacing: '0.04em' }}>{coachName}</span>
          <button
            onClick={handleSignOut}
            style={{
              fontSize: 10,
              color: 'var(--muted)',
              background: 'none',
              border: '1px solid var(--card-border)',
              padding: '4px 10px',
              cursor: 'pointer',
              letterSpacing: '0.06em',
            }}
          >
            SIGN OUT
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ paddingTop: 52, display: 'flex', height: 'calc(100vh - 52px)' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 280,
          flexShrink: 0,
          borderRight: '1px solid var(--card-border)',
          overflowY: 'auto',
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--card-border)' }}>
            <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>
              {clients.length} CLIENT{clients.length !== 1 ? 'S' : ''}
            </span>
          </div>

          {clients.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--muted)', fontSize: 12 }}>No clients assigned yet.</div>
          ) : (
            clients.map((client) => {
              const days = checkInDaysAgo(client)
              const flags = unresolvedFlags(client.id)
              const isActive = client.id === selectedId
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedId(client.id)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    background: isActive ? 'var(--accent-glow)' : 'transparent',
                    borderBottom: '1px solid var(--card-border)',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    fontFamily: "'Bebas Neue', impact, sans-serif",
                    fontSize: 14,
                    letterSpacing: '0.06em',
                    color: 'var(--foreground)',
                    marginBottom: 4,
                  }}>
                    {client.name}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    {client.tier && <Badge>{client.tier}</Badge>}
                    {client.profile?.current_phase && <Badge variant="accent">{client.profile.current_phase}</Badge>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                      Check-in: <CheckInDaysBadge days={days} />
                    </div>
                    {flags.length > 0 && (
                      <div style={{
                        background: 'var(--danger)',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        {flags.length}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </aside>

        {/* ── Main detail ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {!selectedClient ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              {clients.length === 0 ? (
                <>
                  <div style={{ fontFamily: "'Bebas Neue', impact, sans-serif", fontSize: 32, letterSpacing: '0.06em' }}>COACH PORTAL</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>No clients assigned yet.</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, maxWidth: 340, textAlign: 'center' }}>
                    Clients will appear here once they sign up and are linked to your account.
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: "'Bebas Neue', impact, sans-serif", fontSize: 24, letterSpacing: '0.06em', color: 'var(--muted)' }}>
                    SELECT A CLIENT
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>Choose a client from the left sidebar.</div>
                </>
              )}
            </div>
          ) : (
            <ClientDetail
              client={selectedClient}
              reviewDraft={reviewDraft}
              setReviewDraft={setReviewDraft}
              saving={saving}
              saveMsg={saveMsg}
              onSave={handleSaveReview}
              onResolveFlag={handleResolveFlag}
              onPrescribeWorkout={handlePrescribeWorkout}
              trendArrow={trendArrow}
              trendColor={trendColor}
            />
          )}
        </main>
      </div>

      {/* ── Mobile: stack sidebar above main ── */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="display: flex; height"] {
            flex-direction: column !important;
          }
          aside {
            width: 100% !important;
            height: 200px !important;
            border-right: none !important;
            border-bottom: 1px solid var(--card-border) !important;
          }
        }
      `}</style>
    </div>
  )
}

// ─── Client Detail Panel ──────────────────────────────────────────────────────

function ClientDetail({
  client,
  reviewDraft,
  setReviewDraft,
  saving,
  saveMsg,
  onSave,
  onResolveFlag,
  trendArrow,
  trendColor,
  onPrescribeWorkout,
}: {
  client: EnrichedClient
  reviewDraft: { loomUrl: string; notes: string; promotionRecommended: boolean; coachReviewed: boolean }
  setReviewDraft: React.Dispatch<React.SetStateAction<{ loomUrl: string; notes: string; promotionRecommended: boolean; coachReviewed: boolean }>>
  saving: boolean
  saveMsg: string | null
  onSave: () => void
  onResolveFlag: (id: string) => void
  trendArrow: (a: number | null, b: number | null, lbg?: boolean) => string
  trendColor: (a: number | null, b: number | null, lbg?: boolean) => string
  onPrescribeWorkout: (clientId: string, form: PrescribeForm) => Promise<boolean>
}) {
  const p = client.profile
  const ci = client.latestCheckIn
  const checkIns = client.recentCheckIns
  const flags = client.flags.filter((f) => !f.resolved)
  const compTotal = ci ? totalCompScore(ci.competency_scores) : 0
  const days = client.daysSinceCheckIn

  const sectionScoreColor = (v: number) => v >= 80 ? 'var(--success)' : v >= 60 ? 'var(--accent)' : 'var(--danger)'
  const macros = computeClientMacros(p)
  const currentPhaseConfig = p?.training_philosophy && p?.current_phase
    ? getCurrentPhase(p.training_philosophy as TrainingPhilosophy, p.current_phase)
    : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 860 }}>

      {/* ── Section 1: Header card ── */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderTop: '2px solid var(--accent)',
        padding: '18px 20px',
      }}>
        <div style={{ fontFamily: "'Bebas Neue', impact, sans-serif", fontSize: 28, letterSpacing: '0.06em', marginBottom: 6 }}>
          {client.name}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {client.tier && <Badge>{client.tier}</Badge>}
          {p?.current_phase && <Badge variant="accent">{p.current_phase}</Badge>}
          {p?.week_number != null && (
            <Badge>Week {p.week_number}{currentPhaseConfig ? ` of ${currentPhaseConfig.durationWeeks}` : ''}</Badge>
          )}
          {p?.training_philosophy && <Badge>{p.training_philosophy}</Badge>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {p?.goal && <span>Goal: <span style={{ color: 'var(--foreground)' }}>{p.goal}</span></span>}
          {p?.sex && <span>Sex: <span style={{ color: 'var(--foreground)' }}>{p.sex}</span></span>}
          {p?.program_start_date && <span>Starting: <span style={{ color: 'var(--foreground)' }}>{p.program_start_date}</span></span>}
          <span>Email: <span style={{ color: 'var(--foreground)' }}>{client.email}</span></span>
        </div>
      </div>

      {/* ── Section 2: Snapshot stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <StatCard label="Current Weight" value={ci?.weight_kg != null ? `${ci.weight_kg} kg` : p?.weight_kg != null ? `${p.weight_kg} kg` : '—'} />
        <StatCard label="Body Fat" value={ci?.body_fat_percent != null ? `${ci.body_fat_percent}%` : p?.body_fat_percent != null ? `${p.body_fat_percent}%` : '—'} />
        <StatCard label="Competency" value={ci?.competency_scores ? `${compTotal}/25` : '—'} />
        <StatCard label="Last Check-In" value={days != null ? (days === 0 ? 'Today' : `${days}d ago`) : 'None'} />
      </div>

      {/* ── Section 2b: Nutrition targets (same formula as the client's own app) ── */}
      {macros && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 8 }}>
            CURRENT TARGETS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <StatCard label="Target Kcal" value={String(macros.calories)} />
            <StatCard label="Protein" value={`${macros.protein}g`} />
            <StatCard label="Carbs" value={`${macros.carbs}g`} />
            <StatCard label="Fats" value={`${macros.fats}g`} />
          </div>
        </div>
      )}

      {/* ── Section 3: Active flags ── */}
      {flags.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            Active Flags ({flags.length})
          </div>
          {flags.map((flag) => {
            const isRed = flag.severity === 'red'
            return (
              <div
                key={flag.id}
                style={{
                  background: isRed ? 'var(--danger-glow)' : 'var(--accent-glow)',
                  border: `1px solid ${isRed ? 'var(--danger)' : 'var(--accent)'}`,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 12, color: isRed ? 'var(--danger)' : 'var(--accent)', letterSpacing: '0.04em' }}>
                    {isRed ? '🔴' : '🟡'} {FLAG_LABELS[flag.flag_type] ?? flag.flag_type}
                  </div>
                  {flag.flag_data && (
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                      {Object.entries(flag.flag_data).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {new Date(flag.created_at).toLocaleDateString('en-AU')}
                  </div>
                </div>
                <button
                  onClick={() => onResolveFlag(flag.id)}
                  style={{
                    fontSize: 10,
                    padding: '4px 10px',
                    background: 'var(--card)',
                    border: `1px solid ${isRed ? 'var(--danger)' : 'var(--accent)'}`,
                    color: isRed ? 'var(--danger)' : 'var(--accent)',
                    cursor: 'pointer',
                    letterSpacing: '0.06em',
                    flexShrink: 0,
                  }}
                >
                  RESOLVE
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Section 3b: View as client — latest training & nutrition (read-only) ── */}
      {(client.latestWorkout || client.latestMealPlan) && (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>
            VIEW AS CLIENT — MOST RECENT SESSION
          </div>

          {client.latestWorkout && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Training — {client.latestWorkout.date}
                  {client.latestWorkout.week_number != null && ` · Week ${client.latestWorkout.week_number}`}
                </div>
                {client.latestWorkout.philosophy && <Badge>{client.latestWorkout.philosophy}</Badge>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(client.latestWorkout.exercises ?? []).map((ex, i) => (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', padding: '8px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: 'var(--foreground)' }}>{ex.name}</span>
                      <span style={{ color: 'var(--muted)' }}>{ex.targetMuscle}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 10, color: 'var(--muted)' }}>
                      {ex.sets.map((s, si) => (
                        <span key={si}>
                          {s.actualReps != null ? `${s.actualReps}` : s.targetReps}
                          {s.weight != null ? `×${s.weight}kg` : ''}
                          {s.rpe != null ? ` @${s.rpe}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {client.latestWorkout.notes && (
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>{client.latestWorkout.notes}</div>
              )}
            </div>
          )}

          {client.latestMealPlan && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Nutrition — {client.latestMealPlan.date}
                {client.latestMealPlan.target_calories != null && client.latestMealPlan.logged_calories != null && (
                  <span style={{ marginLeft: 8, color: 'var(--foreground)', textTransform: 'none', letterSpacing: 0 }}>
                    {client.latestMealPlan.logged_calories} / {client.latestMealPlan.target_calories} kcal
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(client.latestMealPlan.meals ?? []).map((meal, i) => (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', padding: '8px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--foreground)', marginBottom: 4 }}>
                      {meal.name}{meal.time ? ` · ${meal.time}` : ''}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                      {meal.foods.map(f => f.name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Section 3c: Prescribe an upcoming workout ── */}
      <PrescribeWorkoutPanel clientId={client.id} onPrescribe={onPrescribeWorkout} />

      {/* ── Section 4: Latest check-in ── */}
      {ci ? (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>
            LATEST CHECK-IN — WEEK {ci.week_number} · {ci.date}
          </div>

          {/* Row 1: Section scores */}
          {ci.section_scores && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8, letterSpacing: '0.06em' }}>SECTION SCORES</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {(['nutrition', 'training', 'recovery', 'wellbeing'] as const).map((k) => {
                  const val = ci.section_scores?.[k] ?? 0
                  return (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{k}</div>
                      <ProgressBar value={val} />
                      <div style={{ fontSize: 11, color: sectionScoreColor(val) }}>{val}/100</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Row 2: Key metrics */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8, letterSpacing: '0.06em' }}>KEY METRICS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 24px', fontSize: 12 }}>
              {[
                ['Weight', ci.weight_kg != null ? `${ci.weight_kg}kg` : '—'],
                ['BF%', ci.body_fat_percent != null ? `${ci.body_fat_percent}%` : '—'],
                ['Sleep', ci.hours_of_sleep != null ? `${ci.hours_of_sleep}hrs` : '—'],
                ['Execution', ci.execution_quality != null ? `${ci.execution_quality}/5` : '—'],
                ['Hunger', ci.hunger_rating != null ? `${ci.hunger_rating}/5` : '—'],
                ['Cravings', ci.cravings_level != null ? `${ci.cravings_level}/5` : '—'],
                ['Alcohol', ci.alcohol_sessions != null ? `${ci.alcohol_sessions} sessions` : '—'],
                ['Macro Compliance', ci.macro_adherence != null ? `${ci.macro_adherence}%` : '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--surface)' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}>{label}</span>
                  <span style={{ color: 'var(--foreground)', fontSize: 11 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: Competency scores */}
          {ci.competency_scores && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8, letterSpacing: '0.06em' }}>COMPETENCY SCORES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(['nutrition', 'training', 'recovery', 'mindset', 'consistency'] as const).map((k) => {
                  const val = ci.competency_scores![k]
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 90, fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{k}</div>
                      <MiniBar value={val} max={5} />
                      <div style={{ fontSize: 11 }}>{val}/5</div>
                    </div>
                  )
                })}
                <div style={{
                  fontSize: 12,
                  color: compTotal >= 20 ? 'var(--accent)' : 'var(--muted)',
                  marginTop: 4,
                  letterSpacing: '0.04em',
                }}>
                  TOTAL: {compTotal}/25
                  {compTotal >= 20 && (
                    <span style={{ marginLeft: 10, color: 'var(--accent)', fontFamily: "'Bebas Neue', impact, sans-serif", letterSpacing: '0.06em', fontSize: 13 }}>
                      PHASE ADVANCE ELIGIBLE
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Row 4: Injury */}
          {ci.injury_niggle && (
            <div style={{
              background: 'var(--danger-glow)',
              border: '1px solid var(--danger)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <div style={{ fontSize: 12, color: 'var(--danger)' }}>⚠ INJURY: {ci.injury_niggle}</div>
              <span style={{ fontSize: 10, color: 'var(--danger)', letterSpacing: '0.06em', flexShrink: 0 }}>
                FLAG FOR REVIEW
              </span>
            </div>
          )}

          {/* Row 5: Coach review */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>COACH REVIEW</div>

            {/* Reviewed toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12 }}>
              <input
                type="checkbox"
                checked={reviewDraft.coachReviewed}
                onChange={(e) => setReviewDraft((d) => ({ ...d, coachReviewed: e.target.checked }))}
                style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
              />
              <span>Coach Reviewed</span>
              {ci.coach_reviewed && (
                <span style={{ fontSize: 10, color: 'var(--success)' }}>
                  ✓ Reviewed
                </span>
              )}
            </label>

            {/* Loom URL */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={reviewDraft.loomUrl}
                onChange={(e) => setReviewDraft((d) => ({ ...d, loomUrl: e.target.value }))}
                placeholder="Loom URL..."
                style={{
                  flex: 1,
                  fontSize: 12,
                  padding: '8px 10px',
                  background: 'var(--surface)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--foreground)',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Notes */}
            <textarea
              value={reviewDraft.notes}
              onChange={(e) => setReviewDraft((d) => ({ ...d, notes: e.target.value }))}
              placeholder="Coach notes..."
              rows={3}
              style={{
                fontSize: 12,
                padding: '8px 10px',
                background: 'var(--surface)',
                border: '1px solid var(--card-border)',
                color: 'var(--foreground)',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />

            {/* Promotion */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12 }}>
              <input
                type="checkbox"
                checked={reviewDraft.promotionRecommended}
                onChange={(e) => setReviewDraft((d) => ({ ...d, promotionRecommended: e.target.checked }))}
                style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
              />
              <span>Promotion Recommended</span>
            </label>

            {/* Save */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={onSave}
                disabled={saving}
                style={{
                  fontSize: 11,
                  padding: '8px 18px',
                  background: 'var(--accent)',
                  border: 'none',
                  color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.06em',
                  opacity: saving ? 0.7 : 1,
                  fontFamily: "'Bebas Neue', impact, sans-serif",
                }}
              >
                {saving ? 'SAVING…' : 'SAVE'}
              </button>
              {saveMsg && (
                <span style={{ fontSize: 11, color: saveMsg === 'Saved.' ? 'var(--success)' : 'var(--danger)' }}>
                  {saveMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--card-border)',
          padding: '24px 20px',
          fontSize: 12,
          color: 'var(--muted)',
        }}>
          No check-ins submitted yet.
        </div>
      )}

      {/* ── Section 5: 3-week trend ── */}
      {checkIns.length > 0 && (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          padding: '18px 20px',
        }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 12 }}>3-WEEK TREND</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  {['WEEK', 'WEIGHT', 'BF%', 'COMP SCORE', 'COMPLIANCE', 'NUTRITION'].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left',
                      padding: '4px 8px',
                      fontSize: 9,
                      color: 'var(--muted)',
                      letterSpacing: '0.08em',
                      borderBottom: '1px solid var(--card-border)',
                      fontWeight: 400,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {checkIns.map((c, i) => {
                  const prev = checkIns[i + 1] ?? null
                  const goal = client.profile?.goal
                  const weightLowerIsBetter = goal === 'cut' || goal === 'contest-prep'
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--surface)' }}>
                      <td style={{ padding: '6px 8px', color: 'var(--muted)' }}>Wk {c.week_number}</td>
                      <td style={{ padding: '6px 8px' }}>
                        {c.weight_kg != null ? `${c.weight_kg}kg` : '—'}
                        {prev && (
                          <span style={{ marginLeft: 4, fontSize: 10, color: trendColor(c.weight_kg, prev.weight_kg, weightLowerIsBetter) }}>
                            {trendArrow(c.weight_kg, prev.weight_kg, weightLowerIsBetter)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        {c.body_fat_percent != null ? `${c.body_fat_percent}%` : '—'}
                        {prev && (
                          <span style={{ marginLeft: 4, fontSize: 10, color: trendColor(c.body_fat_percent, prev.body_fat_percent, true) }}>
                            {trendArrow(c.body_fat_percent, prev.body_fat_percent, true)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        {c.competency_scores ? `${totalCompScore(c.competency_scores)}/25` : '—'}
                        {prev?.competency_scores && c.competency_scores && (
                          <span style={{ marginLeft: 4, fontSize: 10, color: trendColor(totalCompScore(c.competency_scores), totalCompScore(prev.competency_scores)) }}>
                            {trendArrow(totalCompScore(c.competency_scores), totalCompScore(prev.competency_scores))}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        {c.macro_adherence != null ? `${c.macro_adherence}%` : '—'}
                        {prev && (
                          <span style={{ marginLeft: 4, fontSize: 10, color: trendColor(c.macro_adherence, prev.macro_adherence) }}>
                            {trendArrow(c.macro_adherence, prev.macro_adherence)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        {c.section_scores?.nutrition != null ? `${c.section_scores.nutrition}/100` : '—'}
                        {prev?.section_scores?.nutrition != null && c.section_scores?.nutrition != null && (
                          <span style={{ marginLeft: 4, fontSize: 10, color: trendColor(c.section_scores.nutrition, prev.section_scores.nutrition) }}>
                            {trendArrow(c.section_scores.nutrition, prev.section_scores.nutrition)}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Prescribe Workout Panel ──────────────────────────────────────────────────
// Lets a coach set an upcoming day's workout before the client reaches it.
// The client's app checks Supabase for a coach_edited row before generating
// its own on that date — see fetchCoachPrescribedWorkout in supabase-storage.ts.

function PrescribeWorkoutPanel({
  clientId,
  onPrescribe,
}: {
  clientId: string
  onPrescribe: (clientId: string, form: PrescribeForm) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<PrescribeForm>(emptyPrescribeForm)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [loadedExisting, setLoadedExisting] = useState(false)

  // Editing a date that already has a workout (prescribed or client-generated)
  // should start from what's actually there, not overwrite it blind.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadedExisting(false)

    async function loadExisting() {
      const { data } = await getSupabaseClient()
        .from('workout_logs')
        .select('philosophy, split_day, phase, exercises, notes')
        .eq('user_id', clientId)
        .eq('date', form.date)
        .maybeSingle()

      if (cancelled) return
      setLoadedExisting(true)
      if (!data) return

      const existingExercises = (data.exercises as WorkoutExerciseRow[] | null) ?? []
      setForm((f) => ({
        ...f,
        philosophy: data.philosophy ?? f.philosophy,
        splitDay: data.split_day ?? '',
        phase: data.phase ?? '',
        dayNotes: data.notes ?? '',
        exercises: existingExercises.length > 0
          ? existingExercises.map((ex) => ({
              name: ex.name ?? '',
              targetMuscle: ex.targetMuscle ?? '',
              setsCount: ex.sets?.length || 3,
              targetReps: ex.sets?.[0]?.targetReps ?? '8-12',
              notes: ex.notes ?? '',
            }))
          : f.exercises,
      }))
    }

    loadExisting()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form.date, clientId])

  const updateExercise = (i: number, patch: Partial<PrescribeExerciseForm>) => {
    setForm((f) => ({
      ...f,
      exercises: f.exercises.map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex)),
    }))
  }

  const addExercise = () => setForm((f) => ({ ...f, exercises: [...f.exercises, { ...EMPTY_EXERCISE }] }))
  const removeExercise = (i: number) => setForm((f) => ({ ...f, exercises: f.exercises.filter((_, idx) => idx !== i) }))

  async function handleSave() {
    if (!form.date || form.exercises.every((ex) => !ex.name.trim())) {
      setMsg('Add at least one exercise.')
      return
    }
    setSaving(true)
    setMsg(null)
    const ok = await onPrescribe(clientId, {
      ...form,
      exercises: form.exercises.filter((ex) => ex.name.trim()),
    })
    setSaving(false)
    if (ok) {
      setMsg(`Prescribed for ${form.date}.`)
      setForm(emptyPrescribeForm())
      setTimeout(() => setMsg(null), 3000)
    } else {
      setMsg('Save failed.')
    }
  }

  const inputStyle = {
    fontSize: 12,
    padding: '7px 9px',
    background: 'var(--surface)',
    border: '1px solid var(--card-border)',
    color: 'var(--foreground)',
    fontFamily: 'inherit',
  } as const

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', padding: '18px 20px' }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>PRESCRIBE UPCOMING WORKOUT</div>
        <span style={{ fontSize: 11, color: 'var(--accent)' }}>{open ? 'CLOSE' : 'OPEN'}</span>
      </div>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: 4 }}>
                DATE {!loadedExisting && <span style={{ color: 'var(--accent)' }}>· checking existing…</span>}
              </div>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: 4 }}>PHILOSOPHY</div>
              <select
                value={form.philosophy}
                onChange={(e) => setForm((f) => ({ ...f, philosophy: e.target.value }))}
                style={{ ...inputStyle, width: '100%' }}
              >
                {TRAINING_PHILOSOPHIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              placeholder="Split / day label (e.g. Back & Shoulders)"
              value={form.splitDay}
              onChange={(e) => setForm((f) => ({ ...f, splitDay: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Phase label (optional)"
              value={form.phase}
              onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.exercises.map((ex, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  placeholder="Exercise name"
                  value={ex.name}
                  onChange={(e) => updateExercise(i, { name: e.target.value })}
                  style={{ ...inputStyle, flex: 2, minWidth: 140 }}
                />
                <input
                  placeholder="Target muscle"
                  value={ex.targetMuscle}
                  onChange={(e) => updateExercise(i, { targetMuscle: e.target.value })}
                  style={{ ...inputStyle, flex: 1, minWidth: 100 }}
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Sets"
                  value={ex.setsCount}
                  onChange={(e) => updateExercise(i, { setsCount: Number(e.target.value) || 1 })}
                  style={{ ...inputStyle, width: 60 }}
                />
                <input
                  placeholder="Reps (e.g. 8-12)"
                  value={ex.targetReps}
                  onChange={(e) => updateExercise(i, { targetReps: e.target.value })}
                  style={{ ...inputStyle, width: 100 }}
                />
                <button
                  onClick={() => removeExercise(i)}
                  disabled={form.exercises.length <= 1}
                  style={{
                    fontSize: 10,
                    padding: '7px 10px',
                    background: 'transparent',
                    border: '1px solid var(--card-border)',
                    color: 'var(--muted)',
                    cursor: form.exercises.length <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  REMOVE
                </button>
              </div>
            ))}
            <button
              onClick={addExercise}
              style={{
                alignSelf: 'flex-start',
                fontSize: 10,
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                cursor: 'pointer',
                letterSpacing: '0.06em',
              }}
            >
              + ADD EXERCISE
            </button>
          </div>

          <textarea
            placeholder="Notes for the client (optional)"
            value={form.dayNotes}
            onChange={(e) => setForm((f) => ({ ...f, dayNotes: e.target.value }))}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                fontSize: 11,
                padding: '8px 18px',
                background: 'var(--accent)',
                border: 'none',
                color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                letterSpacing: '0.06em',
                opacity: saving ? 0.7 : 1,
                fontFamily: "'Bebas Neue', impact, sans-serif",
              }}
            >
              {saving ? 'SAVING…' : 'PRESCRIBE'}
            </button>
            {msg && (
              <span style={{ fontSize: 11, color: msg.includes('failed') || msg.includes('Add') ? 'var(--danger)' : 'var(--success)' }}>
                {msg}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
