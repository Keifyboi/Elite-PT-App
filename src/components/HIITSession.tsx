'use client'

import { useState, useEffect, useRef } from 'react'

export interface HIITInterval {
  type: 'warmup' | 'work' | 'rest' | 'cooldown' | 'liss'
  durationSeconds: number
  notes?: string
}

export interface HIITProtocol {
  name: string
  totalMinutes: number
  equipment: string
  intervals: HIITInterval[]
  postNotes?: string
}

// ─── MI40-X Phase-specific HIIT protocols (spin bike) ───

export function getHIITProtocol(phase: string, sessionNumber: number): HIITProtocol {
  const phaseL = phase.toLowerCase()

  // Phase 1-2 (or Reset): Foundation HIIT — 30s work : 120s rest
  if (phaseL.includes('phase 1') || phaseL.includes('phase 2') || phaseL.includes('high frequency') || phaseL.includes('reset')) {
    if (sessionNumber === 2) {
      return {
        name: 'LISS Recovery',
        totalMinutes: 20,
        equipment: 'Spin Bike',
        intervals: [
          { type: 'liss', durationSeconds: 1200, notes: '20 min steady state — 130-150bpm, conversational pace' },
        ],
        postNotes: 'Post-workout only. Keep heart rate in zone 2.',
      }
    }
    const intervals: HIITInterval[] = [
      { type: 'warmup', durationSeconds: 300, notes: '5 min easy spinning — gradually increase resistance' },
    ]
    for (let i = 0; i < 6; i++) {
      intervals.push({ type: 'work', durationSeconds: 30, notes: 'ALL OUT — max resistance, max RPM' })
      intervals.push({ type: 'rest', durationSeconds: 120, notes: 'Easy spin — drop resistance, recover' })
    }
    intervals.push({ type: 'cooldown', durationSeconds: 300, notes: '5 min easy spin — gradually lower resistance' })
    return { name: 'Foundation HIIT', totalMinutes: 25, equipment: 'Spin Bike', intervals }
  }

  // Phase 3 (Power/Hypertrophy): Mixed intervals
  if (phaseL.includes('phase 3') || phaseL.includes('power')) {
    const intervals: HIITInterval[] = [
      { type: 'warmup', durationSeconds: 300, notes: '5 min progressive warm-up' },
      { type: 'work', durationSeconds: 60, notes: '60s sprint — high resistance' },
      { type: 'rest', durationSeconds: 180, notes: '3 min recovery' },
    ]
    for (let i = 0; i < 5; i++) {
      intervals.push({ type: 'work', durationSeconds: 30, notes: '30s ALL OUT sprint' })
      intervals.push({ type: 'rest', durationSeconds: 90, notes: '90s recovery' })
    }
    intervals.push({ type: 'cooldown', durationSeconds: 300, notes: '5 min cool-down' })
    return { name: 'Mixed Intervals', totalMinutes: 22, equipment: 'Spin Bike', intervals }
  }

  // Phase 5 (De-Load): Light LISS only
  if (phaseL.includes('phase 5') || phaseL.includes('deload') || phaseL.includes('de-load')) {
    return {
      name: 'De-Load LISS',
      totalMinutes: 20,
      equipment: 'Spin Bike',
      intervals: [
        { type: 'liss', durationSeconds: 1200, notes: '20 min easy spin — recovery focus, zone 1-2' },
      ],
      postNotes: 'Recovery week — no HIIT. Low intensity only.',
    }
  }

  // Phase 6 (Overreaching): Aggressive short intervals
  if (phaseL.includes('phase 6') || phaseL.includes('overreach')) {
    const intervals: HIITInterval[] = [
      { type: 'warmup', durationSeconds: 300, notes: '5 min progressive warm-up' },
    ]
    for (let i = 0; i < 2; i++) {
      intervals.push({ type: 'work', durationSeconds: 30, notes: '30s sprint — high resistance' })
      intervals.push({ type: 'rest', durationSeconds: 120, notes: '2 min recovery' })
    }
    for (let i = 0; i < 6; i++) {
      intervals.push({ type: 'work', durationSeconds: 15, notes: '15s MAX EFFORT — 110% intensity' })
      intervals.push({ type: 'rest', durationSeconds: 90, notes: '90s recovery' })
    }
    intervals.push({ type: 'cooldown', durationSeconds: 300, notes: '5 min cool-down' })
    return { name: 'Aggressive Intervals', totalMinutes: 20, equipment: 'Spin Bike', intervals }
  }

  // Default: standard HIIT
  const intervals: HIITInterval[] = [
    { type: 'warmup', durationSeconds: 300, notes: '5 min easy spinning' },
  ]
  for (let i = 0; i < 8; i++) {
    intervals.push({ type: 'work', durationSeconds: 30, notes: '30s ALL OUT' })
    intervals.push({ type: 'rest', durationSeconds: 90, notes: '90s recovery' })
  }
  intervals.push({ type: 'cooldown', durationSeconds: 300, notes: '5 min cool-down' })
  return { name: 'Standard HIIT', totalMinutes: 26, equipment: 'Spin Bike', intervals }
}

// ─── HIIT Timer Component ───

export default function HIITSession({ protocol, onComplete }: {
  protocol: HIITProtocol
  onComplete: () => void
}) {
  const [started, setStarted] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [finished, setFinished] = useState(false)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<AudioContext | null>(null)

  const current = protocol.intervals[currentIdx]
  const totalIntervals = protocol.intervals.length
  const completedIntervals = currentIdx
  const workIntervals = protocol.intervals.filter(i => i.type === 'work').length
  const completedWork = protocol.intervals.slice(0, currentIdx).filter(i => i.type === 'work').length

  const playBeep = (intervalType?: string) => {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      const ctx = audioRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      const t = intervalType ?? current?.type
      osc.frequency.value = t === 'work' ? 800 : 400
      gain.gain.value = 0.3
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } catch {}
  }

  const startSession = () => {
    setStarted(true)
    setRemaining(protocol.intervals[0].durationSeconds)
  }

  useEffect(() => {
    if (!started || finished) return
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          // Move to next interval
          const nextIdx = currentIdx + 1
          if (nextIdx >= totalIntervals) {
            setFinished(true)
            if (intervalRef.current) clearInterval(intervalRef.current)
            return 0
          }
          playBeep(protocol.intervals[nextIdx].type)
          setCurrentIdx(nextIdx)
          return protocol.intervals[nextIdx].durationSeconds
        }
        // Beep at 3 seconds remaining
        if (prev === 4) playBeep()
        return prev - 1
      })
    }, 1000)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [started, finished, currentIdx, paused])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  const typeColors: Record<string, string> = {
    warmup: 'text-blue-400',
    work: 'text-[var(--danger)]',
    rest: 'text-[var(--success)]',
    cooldown: 'text-blue-400',
    liss: 'text-[var(--accent)]',
  }

  const typeLabels: Record<string, string> = {
    warmup: 'WARM UP',
    work: 'GO!',
    rest: 'RECOVER',
    cooldown: 'COOL DOWN',
    liss: 'STEADY STATE',
  }

  const typeBg: Record<string, string> = {
    warmup: 'bg-blue-500/10',
    work: 'bg-[var(--danger)]/20',
    rest: 'bg-[var(--success)]/10',
    cooldown: 'bg-blue-500/10',
    liss: 'bg-[var(--accent)]/10',
  }

  if (!started) {
    return (
      <div className="px-4 pt-4 pb-4 space-y-4">
        <div className="bg-[var(--card)] p-4 border border-[var(--card-border)]" style={{ borderTop: '2px solid var(--accent)' }}>
          <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 11, letterSpacing: '0.08em', color: 'var(--accent)' }}>TODAY&apos;S CARDIO</p>
          <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 20, letterSpacing: '0.06em' }} className="mt-1">{protocol.name.toUpperCase()}</p>
          <p className="text-xs text-[var(--muted)]">{protocol.equipment} · {protocol.totalMinutes} min</p>
        </div>

        <div className="bg-[var(--card)] p-4 border border-[var(--card-border)] space-y-2">
          <p className="mb-2" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.06em' }}>SESSION STRUCTURE</p>
          {protocol.intervals.map((interval, i) => (
            <div key={i} className={`flex justify-between items-center py-1.5 px-2 ${typeBg[interval.type]}`}>
              <div className="flex items-center gap-2">
                <span className={typeColors[interval.type]} style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 13, letterSpacing: '0.06em' }}>
                  {typeLabels[interval.type]}
                </span>
                {interval.notes && <span className="text-[9px] text-[var(--muted)]">{interval.notes}</span>}
              </div>
              <span className="text-xs font-bold tabular-nums">
                {interval.durationSeconds >= 60 ? `${Math.floor(interval.durationSeconds / 60)}:${(interval.durationSeconds % 60).toString().padStart(2, '0')}` : `${interval.durationSeconds}s`}
              </span>
            </div>
          ))}
        </div>

        {protocol.postNotes && (
          <p className="text-[10px] text-[var(--muted)] italic px-1">{protocol.postNotes}</p>
        )}

        <button onClick={startSession} className="w-full bg-[var(--accent)] text-black py-3"
          style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.08em' }}>
          START SESSION
        </button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="px-4 pt-4 pb-4 space-y-4 flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-4xl">🏁</p>
        <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 22, letterSpacing: '0.06em' }}>SESSION COMPLETE</p>
        <p className="text-xs text-[var(--muted)]">{protocol.name} · {protocol.totalMinutes} min · {workIntervals} intervals</p>
        <button onClick={onComplete} className="w-full bg-[var(--success)] text-black py-3 mt-4"
          style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.08em' }}>
          DONE
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      {/* Current interval — big display */}
      <div className={`p-8 text-center ${typeBg[current.type]} border ${current.type === 'work' ? 'border-[var(--danger)]' : 'border-[var(--card-border)]'}`}>
        <p className={typeColors[current.type]} style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 28, letterSpacing: '0.06em' }}>
          {typeLabels[current.type]}
        </p>
        <p className={`text-6xl font-bold tabular-nums mt-2 ${typeColors[current.type]}`}>
          {mins}:{secs.toString().padStart(2, '0')}
        </p>
        {current.notes && (
          <p className="text-xs text-[var(--muted)] mt-2">{current.notes}</p>
        )}
        <button onClick={() => setPaused(p => !p)} className="mt-3 px-6 py-2 border border-[var(--card-border)]" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.08em', color: 'var(--foreground)' }}>
          {paused ? 'RESUME' : 'PAUSE'}
        </button>
      </div>

      {/* Progress */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-[var(--muted)]">Interval {completedWork}/{workIntervals}</span>
        <span className="text-xs text-[var(--muted)]">{completedIntervals}/{totalIntervals} total</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${current.type === 'work' ? 'bg-[var(--danger)]' : 'bg-[var(--success)]'}`}
          style={{ width: `${(completedIntervals / totalIntervals) * 100}%` }} />
      </div>

      {/* Next up */}
      {currentIdx + 1 < totalIntervals && (
        <div className="bg-[var(--card)] p-3 border border-[var(--card-border)]">
          <p className="text-[10px] text-[var(--muted)]">NEXT</p>
          <p className={typeColors[protocol.intervals[currentIdx + 1].type]} style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 14, letterSpacing: '0.06em' }}>
            {typeLabels[protocol.intervals[currentIdx + 1].type]} — {protocol.intervals[currentIdx + 1].durationSeconds}s
          </p>
        </div>
      )}
    </div>
  )
}
