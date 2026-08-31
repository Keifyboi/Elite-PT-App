'use client'

import { useState, useEffect } from 'react'
import BottomNav, { type TabId } from '@/components/BottomNav'
import Dashboard from '@/components/Dashboard'
import WorkoutTracker from '@/components/WorkoutTracker'
import NutritionTracker from '@/components/NutritionTracker'
import SupplementTracker from '@/components/SupplementTracker'
import ProgressTracker from '@/components/ProgressTracker'
import ProfileSetup from '@/components/ProfileSetup'
import AuthScreen from '@/components/AuthScreen'
import { getProfile } from '@/lib/storage'
import { getSupabaseClient } from '@/lib/supabase'
import { ProfileProvider } from '@/lib/ProfileContext'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role === 'coach') {
              window.location.href = '/coach'
            } else {
              setAuthed(true)
            }
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role === 'coach') {
              window.location.href = '/coach'
            } else {
              setAuthed(true)
            }
          })
      }
      if (event === 'SIGNED_OUT') {
        setAuthed(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (authed) {
      setHasProfile(getProfile() !== null)
    }
  }, [authed])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--muted)]">
        ...
      </div>
    )
  }

  if (!authed) {
    return <AuthScreen onSuccess={() => setAuthed(true)} />
  }

  if (hasProfile === null) {
    return <div className="min-h-screen flex items-center justify-center text-[var(--muted)]">Loading...</div>
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen pb-6">
        <ProfileSetup onComplete={(_p) => { setHasProfile(true) }} />
      </div>
    )
  }

  return (
    <ProfileProvider>
      <div className="min-h-screen pb-20">
        <div className="max-w-lg mx-auto w-full">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'workout' && <WorkoutTracker />}
          {activeTab === 'nutrition' && <NutritionTracker />}
          {activeTab === 'supplements' && <SupplementTracker />}
          {activeTab === 'progress' && <ProgressTracker />}
        </div>
        <BottomNav active={activeTab} onTabChange={setActiveTab} />
      </div>
    </ProfileProvider>
  )
}
