'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import { composeTime12To24, splitTime24To12 } from '@/lib/local-time'
import {
  ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS, validateActivitySessionInput,
  formatActivityDuration, formatActivityDistance, metersToMiles,
} from '@/lib/activity'
import { todayISO } from '@/lib/dates'
import { formatTime } from '@/lib/dates'
import { Card, CardContent } from '@/components/ui/card'
import type { ActivitySession } from '@/types/database'

// ============================================================
// ForgeFitOS — Recent intentional activities (Phase 5A.3)
//
// Renders the recent sessions with correction affordances for
// manually logged rows (edit + delete — the fasting/workout lesson:
// never ship immutable mistakes). live/imported are reserved
// provenance values with no correction UI yet; the server rejects
// edits on them regardless. Calories follow the NULL-vs-0 rule:
// an explicit 0 renders as 0, unrecorded renders nothing.
// ============================================================

interface ActivitySessionListProps {
  sessions: ActivitySession[]
}

function EditActivityForm({ session, onDone }: { session: ActivitySession; onDone: () => void }) {
  const router = useRouter()
  // Prefill: split the stored LOCAL start instant back into segments;
  // a NULL start returns the group to its clearly-optional off state.
  const startParts = session.started_at
    ? splitTime24To12(format(new Date(session.started_at), 'HH:mm'))
    : null
  const [activityType, setActivityType] = useState(session.activity_type)
  const [activityDate, setActivityDate] = useState(session.activity_date)
  const [withStartTime, setWithStartTime] = useState(startParts !== null)
  const [startHour, setStartHour] = useState(startParts?.hour12 ?? '')
  const [startMinute, setStartMinute] = useState(startParts?.minute ?? '00')
  const [startMeridiem, setStartMeridiem] = useState<string>(startParts?.meridiem ?? '')
  const [durationMinutes, setDurationMinutes] = useState(
    String(Math.round(session.duration_seconds / 60)))
  const [distanceMiles, setDistanceMiles] = useState(
    session.distance_meters !== null ? String(metersToMiles(session.distance_meters)) : '')
  const [caloriesBurned, setCaloriesBurned] = useState(
    session.calories_burned !== null ? String(session.calories_burned) : '')
  const [notes, setNotes] = useState(session.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    let startTime: string | null = null
    if (withStartTime) {
      startTime = composeTime12To24(startHour, startMinute, startMeridiem)
      if (!startTime) {
        setError('Enter a complete start time.')
        return
      }
    }
    // Unchecking the toggle deliberately clears started_at to NULL.

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
    const res = await fetch(`/api/activity-sessions/${session.id}`, {
      method: 'PATCH',
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
      setError(body.error ?? 'Could not save changes. Please try again.')
      return
    }
    onDone()
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="space-y-3 pt-2 border-t border-edge-subtle">
      <p className="text-xs font-medium text-ink">Edit activity</p>

      {error && (
        <p className="text-sm text-critical bg-critical-subtle rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1 min-w-0">
          <label className="block text-xs text-ink-muted">Activity type</label>
          <select value={activityType} onChange={(e) => setActivityType(e.target.value)}
            className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1 min-w-0">
          <label className="block text-xs text-ink-muted">Date</label>
          <input type="date" value={activityDate} required
            onChange={(e) => setActivityDate(e.target.value)}
            className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={withStartTime}
            onChange={(e) => { setWithStartTime(e.target.checked); setError(null) }}
            className="rounded border-input flex-shrink-0" />
          <span className="text-xs text-ink-muted">
            Add start time <span className="font-normal">(optional)</span>
          </span>
        </label>
        {withStartTime && (
          <div className="grid grid-cols-3 gap-1 min-w-0" role="group" aria-label="Start time">
            <select aria-label="Hour" value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Hour</option>
              {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <select aria-label="Minute" value={startMinute}
              onChange={(e) => setStartMinute(e.target.value)}
              className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select aria-label="AM or PM" value={startMeridiem}
              onChange={(e) => setStartMeridiem(e.target.value)}
              className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring">
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
          <input type="number" inputMode="numeric" value={durationMinutes} required
            min="1" max="1440" step="1"
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1 min-w-0">
          <label className="block text-xs text-ink-muted">Distance (miles, optional)</label>
          <input type="number" inputMode="decimal" value={distanceMiles}
            min="0.01" step="0.01" placeholder="Not recorded"
            onChange={(e) => setDistanceMiles(e.target.value)}
            className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1 min-w-0">
          <label className="block text-xs text-ink-muted">Calories burned (optional)</label>
          <input type="number" inputMode="numeric" value={caloriesBurned}
            min="0" step="1" placeholder="Not recorded"
            onChange={(e) => setCaloriesBurned(e.target.value)}
            className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1 min-w-0">
          <label className="block text-xs text-ink-muted">Notes (optional)</label>
          <input type="text" value={notes} maxLength={2000}
            placeholder="Anything worth remembering"
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-w-0 px-2 py-2 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onDone} disabled={saving}
          className="py-2.5 rounded-lg border border-edge text-ink-muted text-sm font-medium hover:bg-surface-sunken disabled:opacity-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="py-2.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

export function ActivitySessionList({ sessions }: ActivitySessionListProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Delete this activity?')) return
    setError(null)
    setDeletingId(id)
    const res = await fetch(`/api/activity-sessions/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not delete. Please try again.')
      return
    }
    router.refresh()
  }

  if (sessions.length === 0) {
    return (
      <Card variant="status" className="gap-0 py-4">
        <CardContent className="text-center py-6">
          <p className="text-sm text-ink-muted">
            No intentional activities logged yet. A deliberate walk counts.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="default" className="gap-0 py-4">
      <CardContent className="space-y-3">
        <h3 className="text-sm font-medium text-ink">Recent activities</h3>

        {error && (
          <p className="text-sm text-critical bg-critical-subtle rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="space-y-1">
          {sessions.map((session) => {
            const label = ACTIVITY_TYPE_LABELS[session.activity_type as keyof typeof ACTIVITY_TYPE_LABELS]
              ?? session.activity_type
            const isManual = session.source === 'manual'
            return (
              <div key={session.id} className="py-2 border-b border-edge-subtle last:border-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-ink">{label}</p>
                      <span className="text-xs text-ink-muted tabular-nums">
                        {formatActivityDuration(session.duration_seconds)}
                      </span>
                      {session.distance_meters !== null && (
                        <span className="text-xs text-ink-muted tabular-nums">
                          {formatActivityDistance(session.distance_meters)}
                        </span>
                      )}
                      {session.calories_burned !== null && (
                        <span className="text-xs text-ink-muted tabular-nums">
                          {session.calories_burned} cal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted">
                      {format(parseISO(session.activity_date), 'EEE, MMM d')}
                      {session.started_at ? ` · ${formatTime(new Date(session.started_at))}` : ''}
                    </p>
                    {session.notes && (
                      <p className="text-xs text-ink-muted italic truncate">{session.notes}</p>
                    )}
                  </div>

                  {isManual && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditingId(editingId === session.id ? null : session.id); setError(null) }}
                        className="p-1.5 text-ink-muted hover:text-ink transition-colors"
                        aria-label="Edit activity"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        disabled={deletingId === session.id}
                        className="p-1.5 text-ink-muted hover:text-critical transition-colors disabled:opacity-40"
                        aria-label="Delete activity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {editingId === session.id && (
                  <EditActivityForm session={session} onDone={() => setEditingId(null)} />
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
