'use client'

import { useEffect, useState } from 'react'
import { useProfile } from '@/lib/ProfileContext'
import { getSupplementStacks, filterByBudget, BUDGET_LABELS, type SupplementStack, type BudgetTier } from '@/lib/data/supplements'
import { getSupplementLogs, toggleSupplementLog } from '@/lib/storage'

const TIER_COLORS: Record<BudgetTier, string> = {
  essential: 'text-[var(--success)]',
  recommended: 'text-[var(--accent)]',
  optimal: 'text-[var(--muted)]',
}

const TIER_BADGES: Record<BudgetTier, string> = {
  essential: 'bg-[var(--success)]/20 text-[var(--success)]',
  recommended: 'bg-[var(--accent)]/20 text-[var(--accent)]',
  optimal: 'bg-[var(--card-border)] text-[var(--muted)]',
}

function StackCard({ stack, expanded, onToggle, showTierBadge }: {
  stack: SupplementStack
  expanded: boolean
  onToggle: () => void
  showTierBadge: boolean
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] overflow-hidden" style={{ borderTop: '2px solid var(--accent)' }}>
      <button onClick={onToggle} className="w-full flex justify-between items-center p-3">
        <div className="text-left">
          <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>{stack.category.toUpperCase()}</p>
          <p className="text-[10px] text-[var(--muted)]">{stack.items.length} supplement{stack.items.length !== 1 ? 's' : ''}</p>
        </div>
        <span className="text-[var(--muted)]">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {stack.items.map((item, idx) => (
            <div key={idx} className="border-b border-[var(--card-border)] last:border-0 pb-2 last:pb-0">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold">{item.name}</p>
                    {showTierBadge && (
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 ${TIER_BADGES[item.tier]}`}>
                        {item.tier === 'essential' ? 'CORE' : item.tier === 'recommended' ? 'REC' : 'OPT'}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--muted)]">{item.dose}</p>
                </div>
                <p className="text-[10px] text-[var(--accent)] font-bold text-right shrink-0">{item.timing}</p>
              </div>
              {item.notes && (
                <p className="text-[9px] text-[var(--muted)] italic mt-0.5">{item.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TodayLog({ allStacks, budget }: { allStacks: SupplementStack[]; budget: BudgetTier }) {
  const today = new Date().toISOString().split('T')[0]
  const [takenMap, setTakenMap] = useState<Map<string, boolean>>(new Map())

  const flatItems = filterByBudget(allStacks, budget).flatMap(s => s.items)

  const loadLogs = () => {
    const logs = getSupplementLogs()
    const todayLogs = logs.filter(l => l.date === today)
    const map = new Map<string, boolean>()
    for (const l of todayLogs) {
      map.set(l.itemName, l.taken)
    }
    setTakenMap(map)
  }

  useEffect(() => { loadLogs() }, [today, allStacks, budget]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = (itemName: string) => {
    toggleSupplementLog(today, itemName)
    loadLogs()
  }

  const takenCount = flatItems.filter(i => takenMap.get(i.name)).length
  const total = flatItems.length
  const pct = total > 0 ? Math.round((takenCount / total) * 100) : 0

  if (total === 0) return null

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)]" style={{ borderTop: '2px solid var(--accent)' }}>
      <div className="p-3 pb-2">
        <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>TODAY&apos;S LOG</p>
        <p className="text-[10px] text-[var(--muted)] mt-0.5">{takenCount}/{total} TAKEN TODAY</p>
        {/* Progress bar */}
        <div className="mt-1.5 h-[4px] bg-[var(--surface)]" style={{ border: 'none' }}>
          <div
            style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease' }}
          />
        </div>
      </div>
      <div className="px-3 pb-3 space-y-0">
        {flatItems.map((item, i) => {
          const taken = !!takenMap.get(item.name)
          return (
            <button
              key={i}
              onClick={() => handleToggle(item.name)}
              className="w-full flex items-center gap-3 py-2 text-left"
              style={{ borderBottom: i < flatItems.length - 1 ? '1px solid var(--card-border)' : 'none' }}
            >
              {/* Checkbox */}
              <div
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: 16, height: 16,
                  background: taken ? 'var(--accent)' : 'var(--surface)',
                  border: `1px solid ${taken ? 'var(--accent)' : 'var(--card-border)'}`,
                }}
              >
                {taken && <span style={{ color: '#000', fontSize: 10, fontWeight: 'bold', lineHeight: 1 }}>✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${taken ? 'font-bold text-[var(--accent)]' : 'text-[var(--foreground)]'} truncate`}>{item.name}</p>
                <p className="text-[10px] text-[var(--muted)] truncate">{item.timing}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function SupplementTracker() {
  const { profile } = useProfile()
  const [allStacks, setAllStacks] = useState<SupplementStack[]>([])
  const [budget, setBudget] = useState<BudgetTier>('optimal')
  const [expandedIdx, setExpandedIdx] = useState<Set<number>>(new Set([0]))
  const [phaseLabel, setPhaseLabel] = useState('')

  useEffect(() => {
    if (!profile) return

    const s = getSupplementStacks(
      profile.trainingPhilosophy,
      profile.currentPhase,
      profile.goal,
      profile.bodyFatPercent,
      profile.sex
    )
    setAllStacks(s)
    setPhaseLabel(`${profile.trainingPhilosophy.toUpperCase().replace('-', ' ')} · ${profile.currentPhase}`)
    setExpandedIdx(new Set([0]))
  }, [profile])

  const toggleExpanded = (idx: number) => {
    setExpandedIdx(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  if (allStacks.length === 0) {
    return <div className="flex items-center justify-center min-h-[60vh] text-[var(--muted)]">Set up your profile first</div>
  }

  const filteredStacks = filterByBudget(allStacks, budget)
  const totalAll = allStacks.reduce((s, st) => s + st.items.length, 0)
  const totalFiltered = filteredStacks.reduce((s, st) => s + st.items.length, 0)

  return (
    <div className="px-4 pt-2 pb-4 space-y-3">
      <div>
        <h2 style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 18, letterSpacing: '0.06em' }}>SUPPLEMENTS</h2>
        <p className="text-[10px] text-[var(--muted)]">{phaseLabel}</p>
      </div>

      {/* Today's supplement log */}
      <TodayLog allStacks={allStacks} budget={budget} />

      {/* Budget tier selector */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] p-3">
        <p className="mb-2" style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>BUDGET LEVEL</p>
        <div className="flex gap-1.5">
          {(['essential', 'recommended', 'optimal'] as BudgetTier[]).map(tier => (
            <button
              key={tier}
              onClick={() => { setBudget(tier); setExpandedIdx(new Set([0])) }}
              className={`flex-1 py-2 text-[10px] font-bold border transition-colors ${
                budget === tier
                  ? tier === 'essential' ? 'bg-[var(--success)] text-black border-[var(--success)]'
                    : tier === 'recommended' ? 'bg-[var(--accent)] text-black border-[var(--accent)]'
                    : 'bg-[var(--foreground)] text-black border-[var(--foreground)]'
                  : 'bg-[var(--card)] text-[var(--muted)] border-[var(--card-border)]'
              }`}
            >
              {tier === 'essential' ? '$ Low' : tier === 'recommended' ? '$$ Mid' : '$$$ Full'}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-[var(--muted)] mt-2">
          {BUDGET_LABELS[budget]} — {totalFiltered} of {totalAll} supplements
        </p>
      </div>

      {/* Summary counts per tier */}
      <div className="grid grid-cols-3 gap-2">
        {(['essential', 'recommended', 'optimal'] as BudgetTier[]).map(tier => {
          const count = allStacks.reduce((s, st) => s + st.items.filter(i => i.tier === tier).length, 0)
          const active = (['essential', 'recommended', 'optimal'].indexOf(tier) <= ['essential', 'recommended', 'optimal'].indexOf(budget))
          return (
            <div key={tier} className={`bg-[var(--card)] p-2 border border-[var(--card-border)] text-center ${active ? '' : 'opacity-40'}`}>
              <p className={`text-sm font-bold tabular-nums ${TIER_COLORS[tier]}`}>{count}</p>
              <p className="text-[9px] text-[var(--muted)] capitalize">{tier}</p>
            </div>
          )
        })}
      </div>

      {/* Filtered stacks */}
      {filteredStacks.map((stack, idx) => (
        <StackCard
          key={idx}
          stack={stack}
          expanded={expandedIdx.has(idx)}
          onToggle={() => toggleExpanded(idx)}
          showTierBadge={budget === 'optimal'}
        />
      ))}

      {/* Shopping List */}
      <ShoppingList stacks={filteredStacks} showTierBadge={budget === 'optimal'} />
    </div>
  )
}

const HEADING_STYLE = { fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', letterSpacing: '0.06em' } as const

const TIER_LABEL: Record<BudgetTier, string> = {
  essential: 'CORE',
  recommended: 'REC',
  optimal: 'OPT',
}

const TIER_COLOR: Record<BudgetTier, string> = {
  essential: 'var(--success)',
  recommended: 'var(--accent)',
  optimal: 'var(--muted-bright)',
}

function ShoppingList({ stacks, showTierBadge }: { stacks: SupplementStack[]; showTierBadge: boolean }) {
  const [copied, setCopied] = useState(false)

  // Flatten all items, dedup by name, keep lowest tier (highest priority)
  const tierOrder: BudgetTier[] = ['essential', 'recommended', 'optimal']
  const seen = new Map<string, { name: string; dose: string; tier: BudgetTier; category: string }>()
  for (const stack of stacks) {
    for (const item of stack.items) {
      const key = item.name.toLowerCase()
      const existing = seen.get(key)
      if (!existing || tierOrder.indexOf(item.tier) < tierOrder.indexOf(existing.tier)) {
        seen.set(key, { name: item.name, dose: item.dose, tier: item.tier, category: stack.category })
      }
    }
  }
  const items = Array.from(seen.values()).sort(
    (a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
  )

  if (items.length === 0) return null

  const copyText = items
    .map(i => `[ ] ${i.name} — ${i.dose}`)
    .join('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="border border-[var(--card-border)]" style={{ background: 'var(--card)', borderTop: '2px solid var(--accent)' }}>
      <div className="flex justify-between items-center p-3 pb-2">
        <div>
          <p style={{ ...HEADING_STYLE, fontSize: 16, color: 'var(--foreground)' }}>SHOPPING LIST</p>
          <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{items.length} supplements</p>
        </div>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors"
          style={{
            background: copied ? 'var(--success)' : 'var(--surface)',
            border: `1px solid ${copied ? 'var(--success)' : 'var(--card-border)'}`,
            color: copied ? '#000' : 'var(--muted-bright)',
          }}
        >
          {copied ? 'COPIED ✓' : 'COPY LIST'}
        </button>
      </div>

      <div className="px-3 pb-3 space-y-0">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 py-2.5"
            style={{ borderBottom: i < items.length - 1 ? '1px solid var(--card-border)' : 'none' }}
          >
            {/* Checkbox */}
            <div
              className="shrink-0 mt-0.5"
              style={{ width: 16, height: 16, border: '1px solid var(--card-border)', background: 'var(--surface)' }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-bold">{item.name}</p>
                {showTierBadge && (
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 shrink-0"
                    style={{ color: TIER_COLOR[item.tier], border: `1px solid ${TIER_COLOR[item.tier]}` }}
                  >
                    {TIER_LABEL[item.tier]}
                  </span>
                )}
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{item.dose}</p>
              <p className="text-[9px] mt-0.5 tracking-wide uppercase" style={{ color: 'var(--muted)' }}>{item.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
