'use client'

const tabs = [
  {
    id: 'dashboard',
    label: 'TODAY',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: 'workout',
    label: 'TRAIN',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4v16M18 4v16M3 9h3M18 9h3M3 15h3M18 15h3M6 9h12M6 15h12" />
      </svg>
    ),
  },
  {
    id: 'nutrition',
    label: 'FUEL',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 4-3 6-5 8H10c-2-2-5-4-5-8a7 7 0 0 1 7-7Z" />
        <path d="M9 21h6M10 17h4" />
      </svg>
    ),
  },
  {
    id: 'progress',
    label: 'PROGRESS',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'supplements',
    label: 'ME',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
] as const

export type TabId = (typeof tabs)[number]['id']

export default function BottomNav({
  active,
  onTabChange,
}: {
  active: TabId
  onTabChange: (tab: TabId) => void
}) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{
        background: '#111',
        borderTop: '1px solid #222',
      }}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-0.5 px-2 py-2 relative transition-opacity"
              style={{
                color: isActive ? '#c9a84c' : '#555',
                minWidth: 52,
              }}
            >
              {tab.icon(isActive)}
              <span
                style={{
                  fontSize: 8,
                  letterSpacing: '0.08em',
                  fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif',
                  color: isActive ? '#c9a84c' : '#555',
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
