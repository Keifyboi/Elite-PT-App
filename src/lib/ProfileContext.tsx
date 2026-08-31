'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { UserProfile } from './types'
import { getProfile, saveProfile as storageSaveProfile } from './storage'
import { syncProfileToSupabase } from './supabase-storage'

interface ProfileContextValue {
  profile: UserProfile | null
  refreshProfile: () => void
  updateProfile: (p: UserProfile) => void
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  refreshProfile: () => {},
  updateProfile: () => {},
})

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const refreshProfile = useCallback(() => {
    setProfile(getProfile())
  }, [])

  const updateProfile = useCallback((p: UserProfile) => {
    storageSaveProfile(p)
    setProfile(p)
    syncProfileToSupabase(p).catch(() => {})
  }, [])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  return (
    <ProfileContext.Provider value={{ profile, refreshProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}
