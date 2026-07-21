'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { lbsToKg, inchesToCm } from '@/lib/units'
import { todayISO } from '@/lib/dates'

interface WeighInFormProps {
  onSuccess?: () => void
}

export function WeighInForm({ onSuccess }: WeighInFormProps) {
  const router = useRouter()
  const [weightLbs, setWeightLbs] = useState('')
  const [date, setDate] = useState(todayISO())
  const [bfPct, setBfPct] = useState('')
  const [waistIn, setWaistIn] = useState('')
  const [notes, setNotes] = useState('')
  const [energy, setEnergy] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!weightLbs || isNaN(parseFloat(weightLbs))) {
      setError('Please enter a valid weight.')
      return
    }

    if (!date) {
      setError('Please select a date.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Session expired.')
      setSaving(false)
      return
    }

    const weightKg = lbsToKg(parseFloat(weightLbs))

    const { error: dbError } = await supabase.from('body_metrics').upsert(
      {
        user_id: user.id,
        logged_date: date,
        weight_kg: weightKg,
        bf_pct: bfPct ? parseFloat(bfPct) : null,
        waist_cm: waistIn ? inchesToCm(parseFloat(waistIn)) : null,
        energy_1_5: energy ? parseInt(energy) : null,
        notes: notes || null,
      },
      { onConflict: 'user_id,logged_date' }
    )

    setSaving(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    setSuccess(true)
    setWeightLbs('')
    setBfPct('')
    setWaistIn('')
    setNotes('')
    setEnergy('')
    setDate(todayISO())

    onSuccess?.()
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="shred-card space-y-4">
      <h2 className="text-base font-semibold">Log weigh-in</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Weight <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={weightLbs}
              onChange={(e) => setWeightLbs(e.target.value)}
              placeholder="185.0"
              min="50"
              max="700"
              step="0.1"
              required
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">lbs</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayISO()}
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Body fat %{' '}
            <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={bfPct}
              onChange={(e) => setBfPct(e.target.value)}
              placeholder="22.0"
              min="1"
              max="60"
              step="0.1"
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Energy{' '}
            <span className="text-muted-foreground font-normal text-xs">(1–5)</span>
          </label>
          <select
            value={energy}
            onChange={(e) => setEnergy(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          >
            <option value="">Skip</option>
            <option value="1">1 — Very low</option>
            <option value="2">2 — Low</option>
            <option value="3">3 — Moderate</option>
            <option value="4">4 — Good</option>
            <option value="5">5 — Excellent</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">
          Waist{' '}
          <span className="text-muted-foreground font-normal text-xs">(optional)</span>
        </label>
        <div className="relative">
          <input
            type="number"
            value={waistIn}
            onChange={(e) => setWaistIn(e.target.value)}
            placeholder="34.0"
            min="10"
            max="80"
            step="0.1"
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">in</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">
          Notes{' '}
          <span className="text-muted-foreground font-normal text-xs">(optional)</span>
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. after gym, 8hr sleep"
          className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
          ✓ Weigh-in saved.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving...' : 'Save weigh-in'}
      </button>
    </form>
  )
}
