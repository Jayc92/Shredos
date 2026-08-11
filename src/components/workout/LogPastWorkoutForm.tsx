'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { History } from 'lucide-react'
import { validateManualWorkoutMetadata, composeTime12To24 } from '@/lib/workout'
import { Card, CardContent } from '@/components/ui/card'

// ============================================================
// ForgeFitOS — Log past workout (Phase 5A.2)
//
// Secondary Train-hub action for a workout that already happened.
// Date + Start + Duration (the user usually remembers "about 60
// minutes"; the end instant is derived server-side). Creates a
// HISTORICAL DRAFT — status 'in_progress' with the true duration
// frozen from birth — which the active-session invariant ignores,
// so it never conflicts with a live workout and stays editable for
// exercise/set entry until the user presses Complete workout.
// Calories are optional, user-entered, informational only.
// ============================================================

export function LogPastWorkoutForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [workoutDate, setWorkoutDate] = useState('')
  // Explicit 12-hour segments (Safari's native segmented time control
  // can look populated while a segment is uncommitted): hour and
  // AM/PM start as placeholders so the control never looks complete
  // until it truly is; minute defaults visibly to 00.
  const [startHour, setStartHour] = useState('')
  const [startMinute, setStartMinute] = useState('00')
  const [startMeridiem, setStartMeridiem] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [caloriesBurned, setCaloriesBurned] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Workout title is required.')
      return
    }
    // An incomplete segmented time never serializes into a value.
    const startTime = composeTime12To24(startHour, startMinute, startMeridiem)
    if (!startTime) {
      setError('Enter a complete start time.')
      return
    }
    // Same pure validation the server enforces — early, exact errors.
    const validation = validateManualWorkoutMetadata({
      workoutDate,
      startTime,
      durationMinutes: durationMinutes === '' ? NaN : Number(durationMinutes),
      caloriesBurned,
    })
    if (!validation.ok) {
      setError(validation.error)
      return
    }

    setSaving(true)
    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'historical',
        title: title.trim(),
        workoutDate,
        startTime,
        durationMinutes: Number(durationMinutes),
        caloriesBurned: caloriesBurned === '' ? null : Number(caloriesBurned),
        notes: notes.trim() || null,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not save the workout. Please try again.')
      return
    }
    const { data } = await res.json()
    router.push(`/workouts/${data.id}`)
  }

  return (
    <Card variant="default" className="gap-0 py-4">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Already worked out?</p>
            <p className="text-xs text-ink-muted mt-0.5">
              Record a workout you did without the app — its real time and
              length are kept, then you add the exercises.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(!open); setError(null) }}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-11 rounded-[var(--radius-control)] border border-edge text-sm font-medium text-ink hover:bg-surface-sunken transition-colors flex-shrink-0"
          >
            <History className="h-4 w-4" aria-hidden="true" />
            {open ? 'Close' : 'Log past workout'}
          </button>
        </div>

        {open && (
          <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-edge-subtle">
            {error && (
              <p className="text-sm text-critical bg-critical-subtle rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="space-y-1">
              <label className="block text-xs text-ink-muted">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
                placeholder="e.g. Push day"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* 1-col on mobile, 2-col from sm: — Safari's segmented
                time control (incl. AM/PM) has a large intrinsic
                minimum; min-w-0 cells keep every control inside the
                card at any width. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1 min-w-0">
                <label className="block text-xs text-ink-muted">Date</label>
                <input
                  type="date"
                  value={workoutDate}
                  onChange={(e) => setWorkoutDate(e.target.value)}
                  required
                  className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <span className="block text-xs text-ink-muted">Start time</span>
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
              </div>
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
                  placeholder="60"
                  className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
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
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-ink-muted">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
                placeholder="Anything worth remembering"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <p className="text-xs text-ink-muted">
              Saves with the real workout time and length, then opens it so you
              can add exercises and sets. Press Complete workout when done.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-lg bg-brand text-brand-foreground font-semibold text-sm hover:bg-brand-hover disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save past workout'}
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
