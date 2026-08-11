'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { validateManualFastTimes, didCompleteGoal } from '@/lib/fasting'
import type { FastingLog } from '@/types/database'

// Phase 5A.1 QA correction: a fast record must be correctable —
// an active fast's Start, a completed fast's timestamps, and
// (critically) clearing a completed fast's End to make the SAME ROW
// the current active fast again. The row keeps its id; nothing is
// deleted or reinserted; completed_goal is recomputed from the
// corrected timestamps or cleared while ongoing.
export const REOPEN_CONFLICT_COPY =
  'You already have an active fast. End the current fast before reopening this one.'

interface EditFastFormProps {
  fast: FastingLog
  onDone: () => void
}

/** datetime-local prefill: format the stored instant as LOCAL
 *  wall-clock (date-fns formats in the user's timezone) — the same
 *  single-parse convention 5A.1 proved for the reverse direction. */
const toLocalInputValue = (iso: string) => format(new Date(iso), "yyyy-MM-dd'T'HH:mm")

export function EditFastForm({ fast, onDone }: EditFastFormProps) {
  const router = useRouter()
  const [start, setStart] = useState(toLocalInputValue(fast.started_at))
  const [end, setEnd] = useState(fast.ended_at ? toLocalInputValue(fast.ended_at) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wasCompleted = fast.ended_at !== null
  const willReopen = wasCompleted && end === ''

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Same validation rules as manual entry (5A.1): required
    // non-future Start; optional End strictly after Start; blank End
    // means the fast is (or becomes) ongoing.
    const validation = validateManualFastTimes(start, end)
    if (!validation.ok) {
      setError(validation.error)
      return
    }
    const { startedAt, endedAt } = validation

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    // Reopening (blank End) can never coexist with a DIFFERENT active
    // fast. Editing the currently active fast itself is not a
    // second-active conflict — it stays one open row. Checked fresh
    // here before the write; the partial unique index remains the
    // race-safe backstop.
    if (!endedAt) {
      const { data: openFast } = await supabase
        .from('fasting_logs')
        .select('id')
        .eq('user_id', user.id)
        .is('ended_at', null)
        .neq('id', fast.id)
        .maybeSingle()
      if (openFast) {
        setSaving(false)
        setError(REOPEN_CONFLICT_COPY)
        return
      }
    }

    // Same-row update, explicitly id- and user-scoped (RLS remains
    // authoritative). completed_goal is recomputed with the existing
    // rule and the row's own goal; a reopened fast never keeps a
    // stale goal flag.
    const { error: dbError } = await supabase
      .from('fasting_logs')
      .update({
        started_at: startedAt.toISOString(),
        ended_at: endedAt?.toISOString() ?? null,
        completed_goal: endedAt
          ? didCompleteGoal(startedAt, endedAt, fast.goal_hours)
          : null,
      })
      .eq('id', fast.id)
      .eq('user_id', user.id)

    setSaving(false)
    if (dbError) {
      if (dbError.code === '23505') {
        setError(REOPEN_CONFLICT_COPY)
      } else {
        setError(dbError.message)
      }
      return
    }

    onDone()
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="space-y-3 pt-2 border-t border-edge-subtle">
      <p className="text-xs font-medium text-ink">Edit fast</p>

      {error && (
        <p className="text-sm text-critical bg-critical-subtle rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="block text-xs text-ink-muted">Start</label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            className="w-full px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-ink-muted">End (optional)</label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <p className="text-xs text-ink-muted">
        Leave End blank to keep this fast ongoing.
      </p>
      {willReopen && (
        <p className="text-xs text-caution bg-caution-subtle rounded-lg px-3 py-2">
          This fast will become active again.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          className="py-2.5 rounded-lg border border-edge text-ink-muted text-sm font-medium hover:bg-surface-sunken disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="py-2.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
