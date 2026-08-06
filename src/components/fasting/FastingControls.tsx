'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fastingTypeFromHours, didCompleteGoal } from '@/lib/fasting'
import { FASTING_GOAL_OPTIONS } from '@/lib/constants'
import type { FastingLog } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'

interface FastingControlsProps {
  activeFast: FastingLog | null
  defaultGoalHours: number | null
  onUpdate?: () => void
}

export function FastingControls({ activeFast, defaultGoalHours, onUpdate }: FastingControlsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [goalHours, setGoalHours] = useState(
    defaultGoalHours ? String(defaultGoalHours) : '16'
  )

  // Manual add form
  const [showManual, setShowManual] = useState(false)
  const [manualStart, setManualStart] = useState('')
  const [manualEnd, setManualEnd] = useState('')
  const [manualGoal, setManualGoal] = useState('16')
  const [manualNotes, setManualNotes] = useState('')

  async function startFast() {
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const hours = parseFloat(goalHours) || null
    const { error: dbError } = await supabase.from('fasting_logs').insert({
      user_id: user.id,
      started_at: new Date().toISOString(),
      ended_at: null,
      fasting_type: hours ? fastingTypeFromHours(hours) : 'intermittent',
      goal_hours: hours,
      completed_goal: null,
      notes: null,
    })

    setLoading(false)
    if (dbError) {
      if (dbError.code === '23505') {
        setError('You already have an active fast.')
      } else {
        setError(dbError.message)
      }
      return
    }

    onUpdate?.()
    router.refresh()
  }

  async function endFast() {
    if (!activeFast) return
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const endedAt = new Date().toISOString()
    const completed = didCompleteGoal(activeFast.started_at, endedAt, activeFast.goal_hours)

    const { error: dbError } = await supabase
      .from('fasting_logs')
      .update({ ended_at: endedAt, completed_goal: completed })
      .eq('id', activeFast.id)

    setLoading(false)
    if (dbError) { setError(dbError.message); return }

    onUpdate?.()
    router.refresh()
  }

  async function addManualFast(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!manualStart) { setError('Start time is required.'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const startDate = new Date(manualStart)
    const endDate = manualEnd ? new Date(manualEnd) : null
    const hours = parseFloat(manualGoal) || null
    const completed = endDate && hours ? didCompleteGoal(startDate, endDate, hours) : null

    const { error: dbError } = await supabase.from('fasting_logs').insert({
      user_id: user.id,
      started_at: startDate.toISOString(),
      ended_at: endDate?.toISOString() ?? null,
      fasting_type: hours ? fastingTypeFromHours(hours) : 'custom',
      goal_hours: hours,
      completed_goal: completed,
      notes: manualNotes || null,
    })

    setLoading(false)
    if (dbError) {
      if (dbError.code === '23505') {
        setError('You already have an active fast. End it before adding a new one without an end time.')
      } else {
        setError(dbError.message)
      }
      return
    }

    setShowManual(false)
    setManualStart('')
    setManualEnd('')
    setManualNotes('')
    onUpdate?.()
    router.refresh()
  }

  return (
    <Card variant="elevated" className="gap-0 py-4">
      <CardContent className="space-y-4">
      <h3 className="text-sm font-medium text-ink">Controls</h3>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {activeFast ? (
        /* End fast */
        <button
          onClick={endFast}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-destructive/20 text-destructive border border-destructive/30 font-semibold text-sm hover:bg-destructive/30 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Ending...' : 'End fast'}
        </button>
      ) : (
        /* Start fast */
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-muted">Goal</label>
            <select
              value={goalHours}
              onChange={(e) => setGoalHours(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">No goal</option>
              {FASTING_GOAL_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={startFast}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Starting...' : 'Start fast now'}
          </button>
        </div>
      )}

      {/* Manual add toggle */}
      {!activeFast && (
        <button
          onClick={() => setShowManual(!showManual)}
          className="w-full py-2 text-xs text-ink-muted hover:text-ink transition-colors"
        >
          {showManual ? '↑ Cancel manual entry' : '+ Add past fast manually'}
        </button>
      )}

      {showManual && (
        <form onSubmit={addManualFast} className="space-y-3 pt-2 border-t border-edge-subtle">
          <p className="text-xs font-medium text-ink">Manual fast entry</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-ink-muted">Start</label>
              <input
                type="datetime-local"
                value={manualStart}
                onChange={(e) => setManualStart(e.target.value)}
                required
                className="w-full px-2 py-2 rounded-lg bg-secondary border border-border text-ink text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ink-muted">End (optional)</label>
              <input
                type="datetime-local"
                value={manualEnd}
                onChange={(e) => setManualEnd(e.target.value)}
                className="w-full px-2 py-2 rounded-lg bg-secondary border border-border text-ink text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-ink-muted">Goal hours</label>
            <select
              value={manualGoal}
              onChange={(e) => setManualGoal(e.target.value)}
              className="w-full px-2 py-2 rounded-lg bg-secondary border border-border text-ink text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {FASTING_GOAL_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={manualNotes}
            onChange={(e) => setManualNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-ink placeholder:text-ink-muted text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-secondary border border-border text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Save manual fast'}
          </button>
        </form>
      )}
    </CardContent>
    </Card>
  )
}
