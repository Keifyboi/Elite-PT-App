'use client'

import { useRef, useState } from 'react'
import { resizeImage, type StoredPhoto } from '@/lib/photo-storage'

type Pose = 'front' | 'side' | 'back'

const POSES: { id: Pose; label: string; desc: string }[] = [
  { id: 'front', label: 'Front', desc: 'Relaxed front pose' },
  { id: 'side', label: 'Side', desc: 'Side profile, arms relaxed' },
  { id: 'back', label: 'Back', desc: 'Rear double bicep or relaxed' },
]

export default function PhotoCapture({ photos, onPhotosChange }: {
  photos: { pose: Pose; dataUrl: string }[]
  onPhotosChange: (photos: { pose: Pose; dataUrl: string }[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activePose, setActivePose] = useState<Pose | null>(null)

  const handleCapture = (pose: Pose) => {
    setActivePose(pose)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activePose) return

    const dataUrl = await resizeImage(file, 1200)
    const existing = photos.filter(p => p.pose !== activePose)
    onPhotosChange([...existing, { pose: activePose, dataUrl }])

    setActivePose(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemove = (pose: Pose) => {
    onPhotosChange(photos.filter(p => p.pose !== pose))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--muted)]">
        Take progress photos in consistent lighting. Same room, same time, same clothing (posing shorts/bikini).
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="grid grid-cols-3 gap-2">
        {POSES.map(pose => {
          const photo = photos.find(p => p.pose === pose.id)
          return (
            <div key={pose.id} className="flex flex-col items-center">
              {photo ? (
                <div className="relative w-full aspect-[3/4] overflow-hidden border-2 border-[var(--success)]">
                  <img
                    src={photo.dataUrl}
                    alt={pose.label}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemove(pose.id)}
                    className="absolute top-1 right-1 w-5 h-5 bg-[var(--danger)] text-black text-xs rounded-full flex items-center justify-center font-bold"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center">
                    <span className="text-[9px] font-bold text-white">{pose.label}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleCapture(pose.id)}
                  className="w-full aspect-[3/4] border-2 border-dashed border-[var(--card-border)] flex flex-col items-center justify-center gap-1 hover:border-[var(--accent)] transition-colors"
                >
                  <span className="text-2xl text-[var(--muted)]">📷</span>
                  <span className="text-[10px] font-bold text-[var(--muted)]">{pose.label}</span>
                  <span className="text-[8px] text-[var(--muted)]">{pose.desc}</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-[9px] text-[var(--muted)] italic">
        Photos stored on-device only. AI analysis available when API key is configured.
      </p>
    </div>
  )
}
