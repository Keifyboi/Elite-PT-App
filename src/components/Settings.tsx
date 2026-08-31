'use client'

import { useState, useRef, useEffect } from 'react'
import type { UserProfile } from '@/lib/types'
import { getProfile, saveProfile } from '@/lib/storage'
import { calculateMacros, calculateLBM, determineActivityFactor } from '@/lib/nutrition-engine'
import { downloadBackup, importData } from '@/lib/data-backup'
import { getSupabaseClient } from '@/lib/supabase'

const HEADING = { fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', letterSpacing: '0.06em' } as const

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block mb-1 tracking-widest uppercase" style={{ fontSize: 10, color: 'var(--muted)' }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', suffix, step, placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; suffix?: string; step?: number; placeholder?: string
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type={type}
          inputMode={type === 'number' ? 'decimal' : undefined}
          value={value}
          onChange={e => onChange(e.target.value)}
          step={step}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 text-sm outline-none w-full"
          style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', color: 'var(--foreground)' }}
        />
        {suffix && <span className="text-[11px] shrink-0" style={{ color: 'var(--muted)' }}>{suffix}</span>}
      </div>
    </Field>
  )
}

export default function Settings({ onClose }: { onClose: () => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [bodyFatPercent, setBodyFatPercent] = useState('')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [occupation, setOccupation] = useState<'sedentary' | 'light-active' | 'active' | 'very-active'>('sedentary')
  const [trainingDays, setTrainingDays] = useState('')
  const [stepTarget, setStepTarget] = useState('')
  const [programStart, setProgramStart] = useState('')
  const [saved, setSaved] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const p = getProfile()
    if (!p) return
    setProfile(p)
    setName(p.name)
    setAge(String(p.age))
    setHeightCm(String(p.heightCm))
    setWeightKg(String(p.weightKg))
    setBodyFatPercent(String(p.bodyFatPercent))
    setSex(p.sex)
    setOccupation(p.occupation ?? 'sedentary')
    setTrainingDays(String(p.trainingDaysPerWeek ?? 5))
    setStepTarget(String(p.dailyStepTarget ?? 8000))
    setProgramStart(p.programStartDate ?? '')
  }, [])

  const [validationError, setValidationError] = useState('')

  const handleSave = () => {
    if (!profile) return
    const ageN = Number(age); const htN = Number(heightCm); const wtN = Number(weightKg); const bfN = Number(bodyFatPercent)
    if (!name.trim()) { setValidationError('Name is required.'); return }
    if (!ageN || ageN < 10 || ageN > 100) { setValidationError('Enter a valid age (10–100).'); return }
    if (!htN || htN < 100 || htN > 250) { setValidationError('Enter a valid height (100–250 cm).'); return }
    if (!wtN || wtN < 30 || wtN > 300) { setValidationError('Enter a valid weight (30–300 kg).'); return }
    if (bfN < 3 || bfN > 60) { setValidationError('Enter a valid body fat % (3–60).'); return }
    setValidationError('')
    const activityFactor = determineActivityFactor(occupation, Number(trainingDays) || 5, Number(stepTarget) || 8000)
    const updated: UserProfile = {
      ...profile,
      name: name.trim(),
      age: Number(age),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      bodyFatPercent: Number(bodyFatPercent),
      sex,
      occupation,
      activityFactor,
      trainingDaysPerWeek: Number(trainingDays),
      dailyStepTarget: Number(stepTarget),
      programStartDate: programStart || undefined,
    }
    saveProfile(updated)
    setProfile(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = importData(ev.target?.result as string)
      if (result.success) {
        setImportMsg('Restored. Reloading...')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setImportMsg(result.error ?? 'Import failed')
      }
    }
    reader.readAsText(file)
  }

  const macros = profile
    ? calculateMacros({ ...profile, weightKg: Number(weightKg), bodyFatPercent: Number(bodyFatPercent), age: Number(age) })
    : null
  const lbm = Number(weightKg) > 0 && Number(bodyFatPercent) >= 0
    ? calculateLBM(Number(weightKg), Number(bodyFatPercent))
    : 0

  const card = { background: 'var(--card)', border: '1px solid var(--card-border)' } as const
  const cardAccent = { ...card, borderTop: '2px solid var(--accent)' } as const

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'var(--background)', overflow: 'hidden' }}>
      <div style={{ height: '100%', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-md mx-auto px-4 pt-6 pb-32">

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 style={{ ...HEADING, fontSize: 26 }}>SETTINGS</h2>
          <button onClick={onClose} className="text-sm tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Close</button>
        </div>

        {/* Profile */}
        <div className="p-4 mb-3 space-y-4" style={cardAccent}>
          <p style={{ ...HEADING, fontSize: 16, color: 'var(--muted-bright)' }}>PROFILE</p>

          <Input label="Name" value={name} onChange={setName} placeholder="Your name" />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Age" value={age} onChange={setAge} type="number" suffix="yrs" />
            <Input label="Height" value={heightCm} onChange={setHeightCm} type="number" suffix="cm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Weight" value={weightKg} onChange={setWeightKg} type="number" suffix="kg" step={0.1} />
            <Input label="Body Fat" value={bodyFatPercent} onChange={setBodyFatPercent} type="number" suffix="%" step={0.5} />
          </div>

          <Field label="Sex">
            <div className="grid grid-cols-2 gap-2">
              {(['male', 'female'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSex(s)}
                  className="py-2.5 text-sm font-bold tracking-widest uppercase transition-colors"
                  style={{
                    background: sex === s ? 'var(--accent-glow)' : 'var(--surface)',
                    border: sex === s ? '2px solid var(--accent)' : '1px solid var(--card-border)',
                    color: sex === s ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {s === 'male' ? 'M' : 'F'}
                </button>
              ))}
            </div>
          </Field>

          {lbm > 0 && (
            <div className="flex justify-between items-center px-3 py-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--card-border)' }}>
              <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--muted)' }}>LBM</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{lbm.toFixed(1)} kg</span>
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="p-4 mb-3 space-y-4" style={card}>
          <p style={{ ...HEADING, fontSize: 16, color: 'var(--muted-bright)' }}>ACTIVITY</p>

          <Field label="Occupation">
            <div className="grid grid-cols-2 gap-2">
              {(['sedentary', 'light-active', 'active', 'very-active'] as const).map(o => (
                <button
                  key={o}
                  onClick={() => setOccupation(o)}
                  className="py-2.5 text-xs font-bold tracking-wide uppercase transition-colors"
                  style={{
                    background: occupation === o ? 'var(--accent-glow)' : 'var(--surface)',
                    border: occupation === o ? '2px solid var(--accent)' : '1px solid var(--card-border)',
                    color: occupation === o ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {o.replace('-', ' ')}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Training days/week" value={trainingDays} onChange={setTrainingDays} type="number" suffix="days" />
            <Input label="Step target" value={stepTarget} onChange={setStepTarget} type="number" suffix="steps" />
          </div>

          <Input label="Program start date" value={programStart} onChange={setProgramStart} type="date" />
        </div>

        {/* Macro preview */}
        {macros && (
          <div className="p-4 mb-3" style={card}>
            <p className="mb-3" style={{ ...HEADING, fontSize: 16, color: 'var(--muted-bright)' }}>UPDATED TARGETS</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'kcal', value: String(macros.calories), color: 'var(--accent)' },
                { label: 'protein', value: `${macros.protein}g`, color: '#60a5fa' },
                { label: 'carbs', value: `${macros.carbs}g`, color: 'var(--accent)' },
                { label: 'fats', value: `${macros.fats}g`, color: '#f87171' },
              ].map(m => (
                <div key={m.label} className="py-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--card-border)' }}>
                  <p className="text-sm font-bold tabular-nums" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-[9px] mt-0.5 tracking-widest uppercase" style={{ color: 'var(--muted)' }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation error */}
        {validationError && (
          <p className="text-center py-2 mb-2" style={{ color: 'var(--error)', fontSize: 13 }}>{validationError}</p>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full py-3.5 mb-3 transition-colors"
          style={{
            background: saved ? 'var(--success)' : 'var(--accent)',
            color: '#000',
            fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif',
            fontSize: 18,
            letterSpacing: '0.08em',
          }}
        >
          {saved ? 'SAVED ✓' : 'SAVE CHANGES'}
        </button>

        {/* Data Management */}
        <div className="p-4 space-y-2" style={card}>
          <p className="mb-3" style={{ ...HEADING, fontSize: 16, color: 'var(--muted-bright)' }}>DATA MANAGEMENT</p>
          <p style={{ fontSize: 10, color: 'var(--muted)' }}>Back up weekly — all data is stored on this device only.</p>
          <button
            onClick={downloadBackup}
            className="w-full py-2.5 transition-colors"
            style={{ border: '1px solid var(--card-border)', color: 'var(--foreground)', background: 'var(--surface)', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.08em' }}
          >
            EXPORT BACKUP
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-2.5 transition-colors"
            style={{ border: '1px solid var(--card-border)', color: 'var(--foreground)', background: 'var(--surface)', fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.08em' }}
          >
            IMPORT BACKUP
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          {importMsg && <p className="text-xs" style={{ color: 'var(--accent)' }}>{importMsg}</p>}
          <p className="text-[9px] pt-1 tracking-wide" style={{ color: 'var(--muted)' }}>
            Export saves all workouts, meals, check-ins, and profile. Import restores from a backup file.
          </p>
        </div>

        {/* Sign Out */}
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
          <button
            onClick={async () => {
              await getSupabaseClient().auth.signOut()
              window.location.href = '/'
            }}
            className="w-full py-3 transition-opacity"
            style={{
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              background: 'transparent',
              fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif',
              fontSize: 14,
              letterSpacing: '0.1em',
            }}
          >
            SIGN OUT
          </button>
        </div>

      </div>
      </div>
    </div>
  )
}
