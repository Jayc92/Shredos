'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Footprints } from 'lucide-react'
import { composeTime12To24 } from '@/lib/local-time'
import {
  ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS, validateActivitySessionInput,
} from '@/lib/activity'
import { todayISO } from '@/lib/dates'
import { Card, CardContent } from '@/components/ui/card'

// ============================================================
// ForgeFitOS — Add intentional activity (Phase 5A.3)
//
// Manual completed activity session (walks first; full type
// selector, default Walk). Date + Duration are required; Start time
// is genuinely optional behind an explicit "Add start time" toggle —
// unchecked means "no start time" with zero ambiguity, checked
// reveals the segmented Hour/Minute/AM-PM control (the proven 5A.2
// pattern; never the native Safari time input), which must then be
// complete. Distance is entered in miles and stored canonically in
// meters by the server; calories are informational only. Sessions
// never touch daily steps or nutrition.
// ============================================================

export function AddActivityForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activityType, setActivityType] = useState('walk')
  const [activityDate, setActivityDate] = useState('')
  const [withStartTime, setWithStartTime] = useState(false)
  const [startHour, setStartHour] = useState('')
  const [startMinute, setStartMinute] = useState('00')
  const [startMeridiem, setStartMeridiem] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [distanceMiles, setDistanceMiles] = useState('')
  const [caloriesBurned, setCaloriesBurned] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // The toggle makes intent explicit: off -> no start time is a
    // valid record; on -> the segments must be complete (an
    // incomplete segmented time never serializes).
    let startTime: string | null = null
    if (withStartTime) {
      startTime = composeTime12To24(startHour, startMinute, startMeridiem)
      if (!startTime) {
        setError('Enter a complete start time.')
        return
      }
    }

    // Same pure validation the server enforces — early, exact errors.
    // The client checks the date-only future rule against the user's
    // REAL local today; the server re-validates authoritatively.
    const validation = validateActivitySessionInput(
      {
        activityType,
        activityDate,
        startTime,
        durationMinutes: durationMinutes === '' ? NaN : Number(durationMinutes),
        distanceMiles,
        caloriesBurned,
        notes,
      },
      todayISO()
    )
    if (!validation.ok) {
      setError(validation.error)
      return
    }

    setSaving(true)
    const res = await fetch('/api/activity-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityType,
        activityDate,
        startTime,
        durationMinutes: Number(durationMinutes),
        distanceMiles: distanceMiles === '' ? null : distanceMiles,
        caloriesBurned: caloriesBurned === '' ? null : Number(caloriesBurned),
        notes: notes.trim() || null,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not save the activity. Please try again.')
      return
    }
    setOpen(false)
    setActivityDate('')
    setWithStartTime(false)
    setStartHour('')
    setStartMinute('00')
    setStartMeridiem('')
    setDurationMinutes('')
    setDistanceMiles('')
    setCaloriesBurned('')
    setNotes('')
    router.refresh()
  }

  return (
    <Card variant="default" className="gap-0 py-4">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Log an intentional activity</p>
            <p className="text-xs text-ink-muted mt-0.5">
              A deliberate walk, run, or other session — separate from your
              daily step total.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(!open); setError(null) }}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-11 rounded-[var(--radius-control)] border border-edge text-sm font-medium text-ink hover:bg-surface-sunken transition-colors flex-shrink-0"
          >
            <Footprints className="h-4 w-4" aria-hidden="true" />
            {open ? 'Close' : 'Add activity'}
          </button>
        </div>

        {open && (
          <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-edge-subtle">
            {error && (
              <p className="text-sm text-critical bg-critical-subtle rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1 min-w-0">
                <label className="block text-xs text-ink-muted">Activity type</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 min-w-0">
                <label className="block text-xs text-ink-muted">Date</label>
                <input
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  required
                  className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={withStartTime}
                  onChange={(e) => { setWithStartTime(e.target.checked); setError(null) }}
                  className="rounded border-input flex-shrink-0"
                />
                <span className="text-xs text-ink-muted">
                  Add start time <span className="font-normal">(optional)</span>
                </span>
              </label>
              {withStartTime && (
                <div className="grid grid-cols-3 gap-1 min-w-0" role="group" aria-label="Start time">
                  <select
                    aria-label="Hour"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Hour</option>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Minute"
                    value={startMinute}
                    onChange={(e) => setStartMinute(e.target.value)}
                    className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    aria-label="AM or PM"
                    value={startMeridiem}
                    onChange={(e) => setStartMeridiem(e.target.value)}
                    className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">AM/PM</option>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1 min-w-0">
                <label className="block text-xs text-ink-muted">Duration (minutes)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  required
                  min="1"
                  max="1440"
                  step="1"
                  placeholder="45"
                  className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <label className="block text-xs text-ink-muted">Distance (miles, optional)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={distanceMiles}
                  onChange={(e) => setDistanceMiles(e.target.value)}
                  min="0.01"
                  step="0.01"
                  placeholder="Not recorded"
                  className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1 min-w-0">
                <label className="block text-xs text-ink-muted">Calories burned (optional)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={caloriesBurned}
                  onChange={(e) => setCaloriesBurned(e.target.value)}
                  min="0"
                  step="1"
                  placeholder="Not recorded"
                  className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <label className="block text-xs text-ink-muted">Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={2000}
                  placeholder="Anything worth remembering"
                  className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-lg bg-brand text-brand-foreground font-semibold text-sm hover:bg-brand-hover disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save activity'}
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
