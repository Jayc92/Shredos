'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fastingTypeFromHours, didCompleteGoal, validateManualFastTimes } from '@/lib/fasting'
import { FASTING_GOAL_OPTIONS } from '@/lib/constants'
import type { FastingLog } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { EditFastForm } from './EditFastForm'

interface FastingControlsProps {
  activeFast: FastingLog | null
  defaultGoalHours: number | null
  onUpdate?: () => void
}

// Phase 5A.1: a second ONGOING fast can never coexist with the
// current one (the partial unique index is the race-safe authority);
// a completed historical entry never conflicts, so manual entry
// stays available while a fast is active.
const ACTIVE_CONFLICT_COPY =
  'You already have an active fast. End the current fast before starting another ongoing fast.'

export function FastingControls({ activeFast, defaultGoalHours, onUpdate }: FastingControlsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [goalHours, setGoalHours] = useState(
    defaultGoalHours ? String(defaultGoalHours) : '16'
  )

  // Edit form for the current active fast (QA correction: an
  // accidentally wrong Start must be correctable in place).
  const [showEdit, setShowEdit] = useState(false)

  // Manual add form. End deliberately starts (and stays) blank unless
  // the user types one: blank End is the ongoing-fast workflow.
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

    // Pure validation first: required/parsable start, no future start
    // (small clock-skew tolerance only), optional end strictly after
    // start. The local datetime-local value is parsed exactly once.
    const validation = validateManualFastTimes(manualStart, manualEnd)
    if (!validation.ok) {
      setError(validation.error)
      return
    }
    const { startedAt, endedAt } = validation

    // A blank End means "create the current active fast from this
    // start". That can never coexist with an existing active fast, so
    // surface the decision instead of an obscure database error. The
    // existing fast is never mutated or replaced here; ending it uses
    // the normal End-fast control above.
    if (!endedAt && activeFast) {
      setError(ACTIVE_CONFLICT_COPY)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const hours = parseFloat(manualGoal) || null
    // completed_goal keeps the existing insert contract: the
    // authoritative didCompleteGoal rule for completed fasts, NULL
    // while a fast is still active (matching Start fast now).
    const completed = endedAt && hours ? didCompleteGoal(startedAt, endedAt, hours) : null

    const { error: dbError } = await supabase.from('fasting_logs').insert({
      user_id: user.id,
      started_at: startedAt.toISOString(),
      ended_at: endedAt?.toISOString() ?? null,
      fasting_type: hours ? fastingTypeFromHours(hours) : 'custom',
      goal_hours: hours,
      completed_goal: completed,
      notes: manualNotes || null,
    })

    setLoading(false)
    if (dbError) {
      if (dbError.code === '23505') {
        // Race-safe fallback: the partial unique index rejected a
        // second open row created concurrently elsewhere.
        setError(ACTIVE_CONFLICT_COPY)
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
        <p className="text-sm text-critical bg-critical-subtle rounded-lg px-3 py-2">{error}</p>
      )}

      {activeFast ? (
        /* End fast + in-place correction of the current fast */
        <div className="space-y-2">
          <button
            onClick={endFast}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-critical-subtle text-critical border border-edge font-semibold text-sm hover:border-critical disabled:opacity-50 transition-colors"
          >
            {loading ? 'Ending...' : 'End fast'}
          </button>
          <button
            type="button"
            onClick={() => { setShowEdit(!showEdit); setError(null) }}
            className="w-full py-2 rounded-lg border border-edge text-ink-muted text-xs font-medium hover:bg-surface-sunken transition-colors"
          >
            {showEdit ? 'Close edit' : 'Edit fast'}
          </button>
          {showEdit && (
            <EditFastForm fast={activeFast} onDone={() => setShowEdit(false)} />
          )}
        </div>
      ) : (
        /* Start fast */
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink-muted">Goal</label>
            <select
              value={goalHours}
              onChange={(e) => setGoalHours(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
            className="w-full py-3 rounded-lg bg-brand text-brand-foreground font-semibold text-sm hover:bg-brand-hover disabled:opacity-50 transition-colors"
          >
            {loading ? 'Starting...' : 'Start fast now'}
          </button>
        </div>
      )}

      {/* Manual add toggle — available while a fast is active too: a
          completed historical entry never violates the one-active
          rule, and only a second ONGOING attempt is blocked. */}
      <button
        onClick={() => { setShowManual(!showManual); setError(null) }}
        className="w-full py-2 text-xs text-ink-muted hover:text-ink transition-colors"
      >
        {showManual ? 'Cancel manual entry' : '+ Add a fast manually'}
      </button>

      {showManual && (
        <form onSubmit={addManualFast} className="space-y-3 pt-2 border-t border-edge-subtle">
          <p className="text-xs font-medium text-ink">Manual fast entry</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-xs text-ink-muted">Start</label>
              <input
                type="datetime-local"
                value={manualStart}
                onChange={(e) => setManualStart(e.target.value)}
                required
                className="w-full px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-ink-muted">End (optional)</label>
              <input
                type="datetime-local"
                value={manualEnd}
                onChange={(e) => setManualEnd(e.target.value)}
                className="w-full px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <p className="text-xs text-ink-muted">
            Leave End blank to start an ongoing fast from this time.
          </p>

          <div className="space-y-1">
            <label className="block text-xs text-ink-muted">Goal hours</label>
            <select
              value={manualGoal}
              onChange={(e) => setManualGoal(e.target.value)}
              className="w-full px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-xs focus:outline-none focus:ring-2 focus:ring-ring"
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
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg border border-edge text-ink text-sm font-medium hover:bg-surface-sunken disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Save manual fast'}
          </button>
        </form>
      )}
    </CardContent>
    </Card>
  )
}
