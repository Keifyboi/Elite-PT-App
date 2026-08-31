'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

const HEADING = {
  fontFamily: 'var(--font-heading), "Bebas Neue", impact, sans-serif',
  letterSpacing: '0.08em',
} as const

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Supabase puts the access token in the URL hash; the client SDK picks it up automatically
    const supabase = getSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(!!session)
      if (!session) setMessage('Invalid or expired reset link. Please request a new one.')
    })
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setStatus('error'); setMessage('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setStatus('error'); setMessage('Passwords do not match.'); return }
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setStatus('error'); setMessage(error.message) }
    else { setStatus('success'); setMessage('Password updated. Redirecting...'); setTimeout(() => { window.location.href = '/' }, 2000) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        <h1 style={{ ...HEADING, fontSize: 32, color: 'var(--accent)', textAlign: 'center', marginBottom: 8 }}>
          RESET PASSWORD
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 32 }}>
          Athletic Odyssey
        </p>

        {!ready ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: 14 }}>{message || 'Verifying link...'}</p>
        ) : status === 'success' ? (
          <p style={{ color: 'var(--success)', textAlign: 'center', fontSize: 14 }}>{message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <p style={{ color: 'var(--error)', fontSize: 13, textAlign: 'center' }}>{message}</p>
            )}
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3"
              style={{ background: 'var(--card)', border: '1px solid var(--card-border)', color: 'var(--foreground)', fontSize: 14 }}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="w-full px-4 py-3"
              style={{ background: 'var(--card)', border: '1px solid var(--card-border)', color: 'var(--foreground)', fontSize: 14 }}
            />
            <button
              type="submit"
              className="w-full py-3.5"
              style={{ background: 'var(--accent)', color: '#000', ...HEADING, fontSize: 16 }}
            >
              UPDATE PASSWORD
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <a href="/" style={{ color: 'var(--muted)', fontSize: 13 }}>← Back to sign in</a>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)', color: 'var(--muted)' }}>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
