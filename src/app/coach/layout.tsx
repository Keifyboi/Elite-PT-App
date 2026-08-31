import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coach Portal',
  description: 'Athletic Odyssey coach dashboard — manage clients, review check-ins, and track progression.',
}

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
