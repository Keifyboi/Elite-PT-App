'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'

interface AuthScreenProps {
  onSuccess: () => void
}

type Tab = 'signin' | 'signup'

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [tab, setTab] = useState<Tab>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const inputClass =
    'w-full px-3 py-2.5 bg-[var(--surface)] border border-[var(--card-border)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors'

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await getSupabaseClient().auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (err) {
        setError(err.message)
      } else {
        setResetSent(true)
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError(err.message)
      } else if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        if (profile?.role === 'coach') {
          window.location.href = '/coach'
        } else {
          onSuccess()
        }
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const { error: err } = await getSupabaseClient().auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (err) {
        setError(err.message)
      } else {
        setSignupSuccess(true)
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1
              className="text-[var(--foreground)]"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '32px',
                letterSpacing: '0.06em',
                fontWeight: 400,
                lineHeight: 1,
              }}
            >
              ATHLETIC ODYSSEY
            </h1>
          </Link>
          <p
            className="mt-1 text-[var(--muted)]"
            style={{
              fontFamily: "'Lekton', monospace",
              fontSize: '11px',
              letterSpacing: '0.15em',
            }}
          >
            ELITE PERFORMANCE TRACKER
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)]">

          {/* Tab switcher */}
          <div className="flex border-b border-[var(--card-border)]">
            {(['signin', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSignupSuccess(false) }}
                className="flex-1 py-3 text-xs tracking-widest transition-colors"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: '0.08em',
                  color: tab === t ? 'var(--accent)' : 'var(--muted)',
                  borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                  background: 'none',
                  fontWeight: 400,
                  fontSize: '13px',
                }}
              >
                {t === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* Signup success */}
            {signupSuccess && (
              <div
                className="p-3 text-center text-[var(--success)] border border-[var(--success)] mb-4"
                style={{ fontFamily: "'Lekton', monospace", fontSize: '12px', letterSpacing: '0.05em' }}
              >
                CHECK YOUR EMAIL to confirm your account.
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="p-3 mb-4 text-[var(--danger)] border border-[var(--danger)]"
                style={{
                  fontFamily: "'Lekton', monospace",
                  fontSize: '11px',
                  background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
                }}
              >
                {error}
              </div>
            )}

            {/* Sign In form */}
            {tab === 'signin' && !signupSuccess && !showReset && (
              <form onSubmit={handleSignIn} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inputClass}
                  style={{ fontFamily: "'Lekton', monospace" }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className={inputClass}
                  style={{ fontFamily: "'Lekton', monospace" }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 py-3 bg-[var(--accent)] text-black transition-opacity disabled:opacity-50"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '15px',
                    letterSpacing: '0.1em',
                    fontWeight: 400,
                  }}
                >
                  {loading ? '...' : 'SIGN IN'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReset(true); setResetEmail(email); setError(null) }}
                  className="text-center"
                  style={{ fontFamily: "'Lekton', monospace", fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
                >
                  Forgot password?
                </button>
              </form>
            )}

            {/* Reset password form */}
            {tab === 'signin' && showReset && (
              <div className="flex flex-col gap-3">
                {resetSent ? (
                  <div
                    className="p-3 text-center border"
                    style={{ fontFamily: "'Lekton', monospace", fontSize: '12px', letterSpacing: '0.05em', color: 'var(--success)', borderColor: 'var(--success)' }}
                  >
                    CHECK YOUR EMAIL — reset link sent to {resetEmail}
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
                    <p style={{ fontFamily: "'Lekton', monospace", fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                      Enter your email and we&apos;ll send a reset link.
                    </p>
                    <input
                      type="email"
                      placeholder="Email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className={inputClass}
                      style={{ fontFamily: "'Lekton', monospace" }}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="py-3 bg-[var(--accent)] text-black transition-opacity disabled:opacity-50"
                      style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '0.1em', fontWeight: 400 }}
                    >
                      {loading ? '...' : 'SEND RESET LINK'}
                    </button>
                  </form>
                )}
                <button
                  type="button"
                  onClick={() => { setShowReset(false); setResetSent(false); setError(null) }}
                  style={{ fontFamily: "'Lekton', monospace", fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'center' }}
                >
                  ← Back to sign in
                </button>
              </div>
            )}

            {/* Sign Up form */}
            {tab === 'signup' && !signupSuccess && (
              <form onSubmit={handleSignUp} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className={inputClass}
                  style={{ fontFamily: "'Lekton', monospace" }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inputClass}
                  style={{ fontFamily: "'Lekton', monospace" }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={inputClass}
                  style={{ fontFamily: "'Lekton', monospace" }}
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={inputClass}
                  style={{ fontFamily: "'Lekton', monospace" }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 py-3 bg-[var(--accent)] text-black transition-opacity disabled:opacity-50"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '15px',
                    letterSpacing: '0.1em',
                    fontWeight: 400,
                  }}
                >
                  {loading ? '...' : 'CREATE ACCOUNT'}
                </button>
              </form>
            )}
          </div>
        </div>
        {/* Footer */}
        <p
          className="text-center mt-6 text-[var(--muted)]"
          style={{ fontFamily: "'Lekton', monospace", fontSize: '10px', letterSpacing: '0.05em' }}
        >
          © {new Date().getFullYear()} Athletic Odyssey. All rights reserved.
        </p>
      </div>
    </div>
  )
}
