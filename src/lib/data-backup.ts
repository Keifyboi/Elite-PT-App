import { exportAllData } from './storage'

const STORAGE_KEYS = [
  'elitept_profile',
  'elitept_workouts',
  'elitept_meals',
  'elitept_checkins',
  'elitept_habits',
  'elitept_shopping_checked',
]

export interface BackupData {
  version: 1
  exportedAt: string
  data: Record<string, string | null>
}

export function exportData(): string {
  const data: Record<string, string | null> = {}
  for (const key of STORAGE_KEYS) {
    data[key] = localStorage.getItem(key)
  }

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }

  return JSON.stringify(backup, null, 2)
}

export function downloadBackup(): void {
  // Use the comprehensive exportAllData from storage (includes schema version
  // and parsed/migrated values rather than raw localStorage strings)
  const json = exportAllData()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `elitept-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(json: string): { success: boolean; error?: string } {
  try {
    const backup: BackupData = JSON.parse(json)

    if (!backup.version || !backup.data) {
      return { success: false, error: 'Invalid backup file format' }
    }

    for (const [key, value] of Object.entries(backup.data)) {
      if (value !== null && STORAGE_KEYS.includes(key)) {
        localStorage.setItem(key, value)
      }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'Could not parse backup file' }
  }
}
