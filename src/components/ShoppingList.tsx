'use client'

import { useEffect, useState } from 'react'
import type { MealPlan } from '@/lib/types'
import { getProfile, getMealPlans, getWeekDates } from '@/lib/storage'
import { generateShoppingList, CATEGORY_LABELS, type ShoppingList as ShoppingListType, type ShoppingItem } from '@/lib/shopping-list'

function CategoryGroup({ category, items, checkedIds, onToggle }: {
  category: string
  items: ShoppingItem[]
  checkedIds: Set<string>
  onToggle: (id: string) => void
}) {
  const allChecked = items.every(i => checkedIds.has(i.foodId))

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] overflow-hidden" style={{ borderTop: '2px solid var(--accent)' }}>
      <div className="flex justify-between items-center px-3 py-2 border-b border-[var(--card-border)]">
        <p style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 16, letterSpacing: '0.06em' }}>{(CATEGORY_LABELS[category] ?? category).toUpperCase()}</p>
        <span className="text-[10px] text-[var(--muted)]">{items.filter(i => checkedIds.has(i.foodId)).length}/{items.length}</span>
      </div>
      <div className="divide-y divide-[var(--card-border)]">
        {items.map(item => (
          <button
            key={item.foodId}
            onClick={() => onToggle(item.foodId)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${checkedIds.has(item.foodId) ? 'opacity-40' : ''}`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
              checkedIds.has(item.foodId) ? 'bg-[var(--success)] border-[var(--success)]' : 'border-[var(--card-border)]'
            }`}>
              {checkedIds.has(item.foodId) && <span className="text-black text-[10px] font-bold">✓</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${checkedIds.has(item.foodId) ? 'line-through' : 'font-medium'}`}>{item.name}</p>
              <p className="text-[9px] text-[var(--muted)]">
                Used in {item.meals.length} meal{item.meals.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-[var(--accent)]">
                {item.totalAmount}{item.unit === 'g' ? 'g' : item.unit === 'mL' ? 'mL' : ` ${item.unit}`}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ShoppingListView({ onClose }: { onClose: () => void }) {
  const [list, setList] = useState<ShoppingListType | null>(null)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  useEffect(() => {
    const profile = getProfile()
    if (!profile) return

    const weekDates = getWeekDates()
    const allPlans = getMealPlans()

    // Pull all plans for this week's dates
    const weekPlans = weekDates
      .map(date => allPlans.find(p => p.date === date))
      .filter((p): p is MealPlan => p !== undefined)

    setList(generateShoppingList(weekPlans))

    // Load checked state from localStorage
    const saved = localStorage.getItem('elitept_shopping_checked')
    if (saved) {
      try { setCheckedIds(new Set(JSON.parse(saved))) } catch {}
    }
  }, [])

  const toggleItem = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem('elitept_shopping_checked', JSON.stringify([...next]))
      return next
    })
  }

  const clearChecked = () => {
    setCheckedIds(new Set())
    localStorage.removeItem('elitept_shopping_checked')
  }

  if (!list) return null

  // Group items by category
  const grouped = new Map<string, ShoppingItem[]>()
  for (const item of list.items) {
    const cat = item.category
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(item)
  }

  const totalItems = list.items.length
  const checkedCount = list.items.filter(i => checkedIds.has(i.foodId)).length

  return (
    <div className="px-4 pt-2 pb-4 space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <button onClick={onClose} className="text-[10px] text-[var(--accent)] font-bold mb-0.5">← Back to Meals</button>
          <h2 style={{ fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif', fontSize: 18, letterSpacing: '0.06em' }}>SHOPPING LIST</h2>
          <p className="text-[10px] text-[var(--muted)]">{list.generatedFor} · {list.daysIncluded} days · {totalItems} items</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{checkedCount}/{totalItems}</p>
          {checkedCount > 0 && (
            <button onClick={clearChecked} className="text-[9px] text-[var(--muted)] underline">Clear all</button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
        <div className="h-full bg-[var(--success)] rounded-full transition-all" style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }} />
      </div>

      {/* Category groups */}
      {Array.from(grouped.entries()).map(([category, items]) => (
        <CategoryGroup key={category} category={category} items={items} checkedIds={checkedIds} onToggle={toggleItem} />
      ))}
    </div>
  )
}
