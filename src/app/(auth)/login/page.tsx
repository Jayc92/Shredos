'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/lib/constants'
import { BrandMark } from '@/components/layout/BrandMark'
import { SIGNUP_NEUTRAL_MESSAGE, presentAuthError } from './auth-messages'

type Mode = 'signin' | 'signup' | 'magic'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode]         = useState<Mode>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [done, setDone]         = useState<string | null>(null)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setDone(null); setLoading(true)
    const { error: err } = await createClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)
    if (err) { setError(presentAuthError(err.message)); return }
    window.location.assign('/dashboard')
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setDone(null); setLoading(true)
    const { error: err } = await createClient().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: (process.env.NEXT_PUBLIC_APP_URL ?? '') + '/auth/callback',
      },
    })
    setLoading(false)
    if (err) { setError(presentAuthError(err.message)); return }
    setDone(SIGNUP_NEUTRAL_MESSAGE)
    setMode('signin')
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setDone(null); setLoading(true)
    const { error: err } = await createClient().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: (process.env.NEXT_PUBLIC_APP_URL ?? '') + '/auth/callback',
        shouldCreateUser: true,
      },
    })
    setLoading(false)
    if (err) { setError(presentAuthError(err.message)); return }
    setDone('Magic link sent. Check your email.')
  }

  const title: Record<Mode, string> = {
    signin: 'Sign in',
    signup: 'Create account',
    magic:  'Magic link',
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="text-center space-y-2">
          <BrandMark className="size-12 mx-auto" />
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          <p className="text-sm text-ink-muted">Private performance coaching dashboard</p>
        </div>

        {/* Mode tabs */}
        <div className="flex rounded-lg bg-surface-sunken p-1 gap-1">
          {(['signin', 'signup', 'magic'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setDone(null) }}
              aria-pressed={mode === m}
              className={[
                'flex-1 min-h-11 rounded-md text-xs transition-colors',
                mode === m
                  ? 'bg-surface-raised text-ink font-semibold shadow-sm'
                  : 'text-ink-muted font-medium hover:text-ink',
              ].join(' ')}
            >
              {title[m]}
            </button>
          ))}
        </div>

        {/* Success message */}
        {done && (
          <div role="status" aria-live="polite" className="bg-success-subtle border border-edge rounded-lg px-4 py-3">
            <p className="text-sm text-success">{done}</p>
          </div>
        )}

        {/* Sign in form */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="signin-email" className="block text-sm font-medium text-ink">Email</label>
              <input id="signin-email" type="email" autoComplete="email" autoFocus required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full min-h-11 px-3 rounded-lg bg-surface-interactive border border-edge text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-focus-ring text-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="signin-password" className="block text-sm font-medium text-ink">Password</label>
              <input id="signin-password" type="password" autoComplete="current-password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full min-h-11 px-3 rounded-lg bg-surface-interactive border border-edge text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-focus-ring text-sm"
              />
            </div>
            {error && <p role="alert" className="text-sm text-critical bg-critical-subtle rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full min-h-11 rounded-lg bg-brand text-brand-foreground font-semibold text-sm hover:bg-brand-hover disabled:opacity-50 transition-colors">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {/* Create account form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="signup-email" className="block text-sm font-medium text-ink">Email</label>
              <input id="signup-email" type="email" autoComplete="email" autoFocus required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full min-h-11 px-3 rounded-lg bg-surface-interactive border border-edge text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-focus-ring text-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-password" className="block text-sm font-medium text-ink">Password</label>
              <input id="signup-password" type="password" autoComplete="new-password" required minLength={8}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full min-h-11 px-3 rounded-lg bg-surface-interactive border border-edge text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-focus-ring text-sm"
              />
            </div>
            {error && <p role="alert" className="text-sm text-critical bg-critical-subtle rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full min-h-11 rounded-lg bg-brand text-brand-foreground font-semibold text-sm hover:bg-brand-hover disabled:opacity-50 transition-colors">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
            <p className="text-xs text-center text-ink-muted">
              You may need to confirm your email before signing in.
            </p>
          </form>
        )}

        {/* Magic link form */}
        {mode === 'magic' && (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="magic-email" className="block text-sm font-medium text-ink">Email</label>
              <input id="magic-email" type="email" autoComplete="email" autoFocus required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full min-h-11 px-3 rounded-lg bg-surface-interactive border border-edge text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-focus-ring text-sm"
              />
            </div>
            {error && <p role="alert" className="text-sm text-critical bg-critical-subtle rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full min-h-11 rounded-lg bg-brand text-brand-foreground font-semibold text-sm hover:bg-brand-hover disabled:opacity-50 transition-colors">
              {loading ? 'Sending...' : 'Send magic link'}
            </button>
            <p className="text-xs text-center text-ink-muted">
              Useful if you hit Supabase rate limits on magic links.
            </p>
          </form>
        )}

        <p className="text-center text-xs text-ink-muted">Private beta — test data may be reset.</p>
      </div>
    </div>
  )
}
