'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { metersToMiles } from '@/lib/activity'
import type { DailyActivityLog } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'

// ============================================================
// ForgeFitOS — daily aggregate movement form (Phase 1H, extended
// in Phase 5A.4 with daily distance).
//
// Steps and Distance are independently optional aggregate totals
// for ONE local calendar day: blank means "not recorded" (NULL) and
// is never coerced to zero; an explicit 0 is a real recorded zero.
// Distance is entered in miles; the server converts to canonical
// meters. The parent mounts this with key={date} (the 5A.3 QA fix)
// so every calendar day gets its own instance and state can never
// bleed across ?date= navigations — both fields reinitialize from
// that date's server-fetched row.
// ============================================================

interface ActivityLogFormProps {
  date: string
  existingLog: DailyActivityLog | null
  isFutureDate: boolean
}

export function ActivityLogForm({ date, existingLog, isFutureDate }: ActivityLogFormProps) {
  const router = useRouter()
  // NULL prefills as blank ("not recorded"); an explicit stored 0
  // prefills as "0" — the distinction is visible, not just stored.
  const [steps, setSteps] = useState(
    existingLog && existingLog.steps !== null ? String(existingLog.steps) : ''
  )
  const [distanceMiles, setDistanceMiles] = useState(
    existingLog && existingLog.distance_meters !== null
      ? String(metersToMiles(existingLog.distance_meters))
      : ''
  )
  const [notes, setNotes] = useState(existingLog?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)

    const res = await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        // Blank -> null ("not recorded") — never fabricated into 0.
        steps: steps === '' ? null : Number(steps),
        // Raw miles value; the server validates and converts to
        // canonical meters exactly once.
        distanceMiles: distanceMiles === '' ? null : distanceMiles,
        notes: notes || null,
      }),
    })

    setSaving(false)

    if (res.ok) {
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not save your daily movement. Try again.')
    }
  }

  return (
    <Card variant="action" className="gap-0 py-4">
      <CardContent className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs text-ink-muted" htmlFor="steps-input">
          Steps (optional)
        </label>
        <input
          id="steps-input"
          type="number"
          inputMode="numeric"
          min={0}
          max={100000}
          step={1}
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          disabled={isFutureDate}
          placeholder="Not recorded"
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-lg font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-ink-muted" htmlFor="distance-input">
          Distance (miles, optional)
        </label>
        <input
          id="distance-input"
          type="number"
          inputMode="decimal"
          min={0}
          step={0.01}
          value={distanceMiles}
          onChange={(e) => setDistanceMiles(e.target.value)}
          disabled={isFutureDate}
          placeholder="Not recorded"
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-lg font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-ink-muted" htmlFor="activity-notes-input">
          Notes (optional)
        </label>
        <input
          id="activity-notes-input"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isFutureDate}
          placeholder="Long walk, rest day, etc."
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {isFutureDate ? (
        <p className="text-xs text-ink-muted">Can’t log steps for a future date.</p>
      ) : (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full min-h-11 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : existingLog ? 'Update movement' : 'Save movement'}
        </button>
      )}
    </CardContent>
    </Card>
  )
}
