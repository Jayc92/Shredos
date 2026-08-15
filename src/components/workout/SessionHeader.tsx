'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  formatWorkoutDuration, workoutStatusLabel,
  validateManualWorkoutMetadata, validateWorkoutCalories,
} from '@/lib/workout'
import { composeTime12To24, splitTime24To12 } from '@/lib/local-time'
import { format, parseISO } from 'date-fns'
import { Check, ChevronRight, Pencil, Trash2, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { WorkoutSession } from '@/types/database'

// Phase 2N title-error fix: must match WORKOUT_TITLE_MAX_LENGTH in
// src/app/api/workouts/[id]/route.ts. Kept as an independent literal
// here rather than importing from that route module — a route file
// pulls in server-only imports that shouldn't be dragged into a
// client component's bundle.
const TITLE_MAX_LENGTH = 100

interface SessionHeaderProps {
  session: WorkoutSession; routineId?: string | null; routineName?: string | null
  onSessionDeleted?: () => void
}
export function SessionHeader({ session, routineId, routineName, onSessionDeleted }: SessionHeaderProps) {
  const router = useRouter()
  const [editingTitle,  setEditingTitle]  = useState(false)
  const [title,         setTitle]         = useState(session.title || 'Workout')
  const [savingTitle,   setSavingTitle]   = useState(false)
  const [titleError,    setTitleError]    = useState<string | null>(null)
  const [completing,    setCompleting]    = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const [reopening,     setReopening]     = useState(false)
  const [reopenError,   setReopenError]   = useState<string | null>(null)
  const [deleting,      setDeleting]      = useState(false)
  const [deleteError,   setDeleteError]   = useState<string | null>(null)
  // Phase 5A.2: compact metadata correction for manually logged
  // workouts (source='manual' only). Never touches status/source —
  // a draft stays a draft, a completed row stays completed.
  const isManual = session.source === 'manual'
  const [editingDetails, setEditingDetails] = useState(false)
  const [detailsDate,     setDetailsDate]     = useState(session.workout_date)
  // Prefill the explicit 12-hour segments from the stored instant's
  // LOCAL wall-clock (same proven round-trip; splitTime24To12 keeps
  // 00:30 -> 12:30 AM and 12:30 -> 12:30 PM correct).
  const startParts = session.start_time
    ? splitTime24To12(format(new Date(session.start_time), 'HH:mm'))
    : null
  const [detailsHour,     setDetailsHour]     = useState(startParts?.hour12 ?? '')
  const [detailsMinute,   setDetailsMinute]   = useState(startParts?.minute ?? '00')
  const [detailsMeridiem, setDetailsMeridiem] = useState<string>(startParts?.meridiem ?? '')
  const [detailsDuration, setDetailsDuration] = useState(
    session.completed_duration_seconds != null
      ? String(Math.round(session.completed_duration_seconds / 60)) : '')
  const [detailsCalories, setDetailsCalories] = useState(
    session.calories_burned != null ? String(session.calories_burned) : '')
  const [savingDetails,   setSavingDetails]   = useState(false)
  const [detailsError,    setDetailsError]    = useState<string | null>(null)
  // Phase 5A.5: compact LIVE-ONLY calories editor (D6). Manual rows
  // already edit calories through the full details editor above —
  // never two calorie controls on one row. Eligible live rows are
  // in_progress or completed (a reopened live row is in_progress and
  // stays eligible); the workout_calories PATCH mode can only touch
  // calories_burned, so source stays 'live' and a completed row
  // stays completed with its frozen duration.
  const isLive = session.source === 'live'
  const caloriesEligible =
    isLive && (session.status === 'in_progress' || session.status === 'completed')
  const [editingCalories, setEditingCalories] = useState(false)
  const [caloriesValue,   setCaloriesValue]   = useState(
    session.calories_burned != null ? String(session.calories_burned) : '')
  const [savingCalories,  setSavingCalories]  = useState(false)
  const [caloriesError,   setCaloriesError]   = useState<string | null>(null)
  const dateLabel = format(parseISO(session.workout_date), 'EEEE, MMMM d')
  const duration  = formatWorkoutDuration(session.start_time, session.end_time, session.completed_duration_seconds)
  const isActive  = session.status === 'in_progress'
  const isDone    = session.status === 'completed'
  async function saveTitle() {
    if (isDone) return
    if (savingTitle) return
    const trimmed = title.trim()
    if (trimmed.length > TITLE_MAX_LENGTH) return // Save button is already disabled in this state; defensive guard for Enter
    if (!trimmed || trimmed === session.title) {
      setTitleError(null)
      setEditingTitle(false)
      return
    }
    setSavingTitle(true)
    setTitleError(null)
    try {
      const res = await fetch(`/api/workouts/${session.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: trimmed }) })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setTitleError(body.error ?? 'Could not save workout title. Please try again.')
        setSavingTitle(false)
        return
      }
      setTitleError(null)
      setEditingTitle(false)
      setSavingTitle(false)
      router.refresh()
    } catch {
      setTitleError('Could not save workout title. Please try again.')
      setSavingTitle(false)
    }
  }
  function handleTitleCancel() {
    setTitle(session.title || 'Workout')
    setTitleError(null)
    setEditingTitle(false)
  }
  function handleTitleClick() {
    // Defense in depth: the button below only renders when !isDone, but
    // guard the handler itself too, matching the same independent-guard
    // philosophy already applied to every mutation handler in Phase 2I.
    if (isDone) return
    setTitle(session.title || 'Workout')
    setTitleError(null)
    setEditingTitle(true)
  }
  async function handleComplete() {
    setCompleting(true); setCompleteError(null)
    try { const res = await fetch(`/api/workouts/${session.id}/complete`, { method: 'POST' }); if (!res.ok) throw new Error(''); router.refresh() }
    catch { setCompleteError('Could not save. Try again.') } finally { setCompleting(false) }
  }
  async function handleReopen() {
    if (!confirm('Reopen this workout for editing? Its completion time and summary will update when you complete it again.')) return
    setReopening(true); setReopenError(null)
    try { const res = await fetch(`/api/workouts/${session.id}/reopen`, { method: 'POST' }); if (!res.ok) throw new Error(''); router.refresh() }
    catch { setReopenError('Could not reopen. Try again.') } finally { setReopening(false) }
  }
  async function handleDelete() {
    const confirmMsg = isActive
      ? 'Delete this in-progress workout? All logged sets in this session will be permanently removed.'
      : 'Delete this workout? This cannot be undone.'
    if (!confirm(confirmMsg)) return
    setDeleting(true); setDeleteError(null)
    try {
      const res = await fetch(`/api/workouts/${session.id}`, { method: 'DELETE' })
      if (!res.ok) { const b = await res.json().catch(() => ({})); setDeleteError(b.error ?? 'Delete failed — please try again.'); setDeleting(false); return }
      onSessionDeleted?.()
    } catch { setDeleteError('Network error — please try again.'); setDeleting(false) }
  }
  async function handleSaveCalories(e: React.FormEvent) {
    e.preventDefault()
    setCaloriesError(null)
    // Same pure validation the server enforces — blank clears to NULL,
    // 0 is an explicit recorded zero.
    const validation = validateWorkoutCalories(caloriesValue)
    if (!validation.ok) { setCaloriesError(validation.error); return }
    setSavingCalories(true)
    try {
      const res = await fetch(`/api/workouts/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'workout_calories',
          caloriesBurned: caloriesValue === '' ? null : Number(caloriesValue),
        }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setCaloriesError(b.error ?? 'Could not save calories. Please try again.')
        setSavingCalories(false)
        return
      }
      setSavingCalories(false)
      setEditingCalories(false)
      router.refresh()
    } catch {
      setCaloriesError('Network error — please try again.')
      setSavingCalories(false)
    }
  }
  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault()
    setDetailsError(null)
    const detailsStart = composeTime12To24(detailsHour, detailsMinute, detailsMeridiem)
    if (!detailsStart) {
      setDetailsError('Enter a complete start time.')
      return
    }
    const validation = validateManualWorkoutMetadata({
      workoutDate: detailsDate,
      startTime: detailsStart,
      durationMinutes: detailsDuration === '' ? NaN : Number(detailsDuration),
      caloriesBurned: detailsCalories,
    })
    if (!validation.ok) { setDetailsError(validation.error); return }
    setSavingDetails(true)
    try {
      const res = await fetch(`/api/workouts/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'manual_metadata',
          workoutDate: detailsDate,
          startTime: detailsStart,
          durationMinutes: Number(detailsDuration),
          caloriesBurned: detailsCalories === '' ? null : Number(detailsCalories),
        }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setDetailsError(b.error ?? 'Could not save workout details. Please try again.')
        setSavingDetails(false)
        return
      }
      setSavingDetails(false)
      setEditingDetails(false)
      router.refresh()
    } catch {
      setDetailsError('Network error — please try again.')
      setSavingDetails(false)
    }
  }
  return (
    // State-driven hierarchy (Phase 4B.6B): the active session is the
    // page's primary surface (action); completed reads as a settled
    // elevated card; skipped stays subtle. Status text always renders.
    <Card
      variant={isActive ? 'action' : isDone ? 'elevated' : 'subtle'}
      className="gap-0 py-4"
    >
      <CardContent className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        {isDone ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* UI-5B1A: long titles wrap instead of truncating. */}
            <h1 className="min-w-0 break-words text-base font-semibold text-ink">{title}</h1>
          </div>
        ) : editingTitle ? (
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') handleTitleCancel() }}
                maxLength={TITLE_MAX_LENGTH + 20}
                aria-label="Workout title"
                className="flex-1 min-w-0 min-h-11 px-2 py-1 rounded-md bg-surface-interactive border border-edge text-ink text-base font-semibold focus:outline-none focus:ring-2 focus:ring-ring" />
              {/* UI-5B1A: 44px targets for the save/cancel controls. */}
              <button onClick={saveTitle} disabled={savingTitle || title.trim().length > TITLE_MAX_LENGTH}
                aria-label="Save title"
                className="flex h-11 w-11 items-center justify-center text-success hover:text-success/80 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 transition-colors">
                <Check className="w-4 h-4" aria-hidden="true" />
              </button>
              <button onClick={handleTitleCancel} disabled={savingTitle}
                aria-label="Cancel editing title"
                className="flex h-11 w-11 items-center justify-center text-ink-muted hover:text-ink disabled:opacity-40 flex-shrink-0 transition-colors">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <p className={cn('text-xs', title.length > TITLE_MAX_LENGTH ? 'text-critical' : 'text-ink-muted')} aria-live="polite">
              {title.length} / {TITLE_MAX_LENGTH}
            </p>
            {titleError && (
              <p className="text-xs text-critical" aria-live="polite">{titleError}</p>
            )}
          </div>
        ) : (
          <button onClick={handleTitleClick} className="flex min-h-11 items-center gap-2 text-left flex-1 min-w-0 group">
            <h1 className="min-w-0 break-words text-base font-semibold text-ink">{title}</h1>
            <Pencil className="w-3.5 h-3.5 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" aria-hidden="true" />
          </button>
        )}
        {/* UI-5B1A: 44px delete target. */}
        <button onClick={handleDelete} disabled={deleting} title="Delete workout session" aria-label="Delete workout session"
          className="flex h-11 w-11 items-center justify-center text-ink-muted hover:text-critical transition-colors flex-shrink-0 disabled:opacity-40">
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <div className="flex items-center gap-3 flex-wrap text-xs text-ink-muted">
        <span>{dateLabel}</span>
        {duration && <span>{duration}</span>}
        {/* UI-5B1A: lucide chevron replaces the text-glyph arrow. */}
        {routineId && routineName && (
          <a href={`/workouts/routines/${routineId}`}
            className="inline-flex items-center gap-0.5 text-brand hover:underline flex-shrink-0">
            From: {routineName}
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
        <span className={cn('rounded-full border px-2 py-0.5 font-medium',
          isDone ? 'bg-success-subtle text-success border-success/20' : isActive ? 'bg-caution-subtle text-caution border-caution/20' : 'bg-surface-sunken text-ink-muted border-edge-subtle')}>
          {workoutStatusLabel(session)}
        </span>
        {isManual && isDone && <span>Logged manually</span>}
        {/* Phase 5A.5 (D2): a recorded value displays whenever it
            exists — in progress or completed. NULL shows nothing
            (never a fake zero); an explicit 0 shows as a real zero. */}
        {session.calories_burned != null && (
          <span>Calories burned {session.calories_burned}</span>
        )}
      </div>
      {deleteError && <p className="text-xs text-critical bg-critical-subtle rounded px-2 py-1">{deleteError}</p>}
      {isActive && (
        <div className="space-y-2">
          <button onClick={handleComplete} disabled={completing}
            className="w-full min-h-11 py-2.5 rounded-[var(--radius-control)] bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors">
            {completing ? 'Saving…' : 'Complete workout'}
          </button>
          {completeError && <p className="text-xs text-critical text-center">{completeError}</p>}
        </div>
      )}
      {isDone && (
        <div className="space-y-2">
          <button onClick={handleReopen} disabled={reopening}
            className="w-full min-h-11 py-2.5 rounded-[var(--radius-control)] border border-edge text-ink-muted font-medium text-sm hover:bg-surface-interactive disabled:opacity-50 transition-colors">
            {reopening ? 'Reopening…' : 'Reopen workout'}
          </button>
          {reopenError && <p className="text-xs text-critical text-center">{reopenError}</p>}
        </div>
      )}
      {caloriesEligible && (
        <div className="space-y-2">
          <button type="button"
            onClick={() => {
              setCaloriesValue(session.calories_burned != null ? String(session.calories_burned) : '')
              setEditingCalories(!editingCalories)
              setCaloriesError(null)
            }}
            className="w-full py-2 rounded-[var(--radius-control)] border border-edge text-ink-muted text-xs font-medium hover:bg-surface-sunken transition-colors">
            {editingCalories
              ? 'Close calories'
              : session.calories_burned != null ? 'Edit calories' : 'Log calories'}
          </button>
          {editingCalories && (
            <form onSubmit={handleSaveCalories} className="space-y-3 pt-2 border-t border-edge-subtle">
              {caloriesError && (
                <p className="text-sm text-critical bg-critical-subtle rounded-lg px-3 py-2">{caloriesError}</p>
              )}
              <div className="space-y-1 min-w-0">
                <label className="block text-xs text-ink-muted">Calories burned (optional)</label>
                <input type="number" inputMode="numeric" value={caloriesValue}
                  min="0" step="1" placeholder="Not recorded"
                  onChange={e => setCaloriesValue(e.target.value)}
                  className="w-full min-w-0 px-2 py-2 rounded-lg bg-surface-interactive border border-edge text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setEditingCalories(false); setCaloriesError(null) }}
                  disabled={savingCalories}
                  className="py-2.5 rounded-lg border border-edge text-ink-muted text-sm font-medium hover:bg-surface-sunken disabled:opacity-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingCalories}
                  className="py-2.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors">
                  {savingCalories ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      {isManual && (
        <div className="space-y-2">
          <button type="button"
            onClick={() => { setEditingDetails(!editingDetails); setDetailsError(null) }}
            className="w-full py-2 rounded-[var(--radius-control)] border border-edge text-ink-muted text-xs font-medium hover:bg-surface-sunken transition-colors">
            {editingDetails ? 'Close details' : 'Edit workout details'}
          </button>
          {editingDetails && (
            <form onSubmit={handleSaveDetails} className="space-y-3 pt-2 border-t border-edge-subtle">
              {detailsError && (
                <p className="text-sm text-critical bg-critical-subtle rounded-lg px-3 py-2">{detailsError}</p>
              )}
              {/* Same Safari intrinsic-minimum fix as LogPastWorkoutForm:
                  1-col mobile, 2-col sm:+, min-w-0 cells. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs text-ink-muted">Date</label>
                  <input type="date" value={detailsDate} required
                    onChange={e => setDetailsDate(e.target.value)}
                    className="w-full min-w-0 px-2 py-2 rounded-lg bg-surface-interactive border border-edge text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="block text-xs text-ink-muted">Start time</span>
                  <div className="grid grid-cols-3 gap-1 min-w-0" role="group" aria-label="Start time">
                    <select aria-label="Hour" value={detailsHour}
                      onChange={e => setDetailsHour(e.target.value)}
                      className="w-full min-w-0 px-2 py-2 rounded-lg bg-surface-interactive border border-edge text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Hour</option>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <select aria-label="Minute" value={detailsMinute}
                      onChange={e => setDetailsMinute(e.target.value)}
                      className="w-full min-w-0 px-2 py-2 rounded-lg bg-surface-interactive border border-edge text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select aria-label="AM or PM" value={detailsMeridiem}
                      onChange={e => setDetailsMeridiem(e.target.value)}
                      className="w-full min-w-0 px-2 py-2 rounded-lg bg-surface-interactive border border-edge text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring">
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
                  <input type="number" inputMode="numeric" value={detailsDuration} required
                    min="1" max="1440" step="1"
                    onChange={e => setDetailsDuration(e.target.value)}
                    className="w-full min-w-0 px-2 py-2 rounded-lg bg-surface-interactive border border-edge text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs text-ink-muted">Calories burned (optional)</label>
                  <input type="number" inputMode="numeric" value={detailsCalories}
                    min="0" step="1" placeholder="Not recorded"
                    onChange={e => setDetailsCalories(e.target.value)}
                    className="w-full min-w-0 px-2 py-2 rounded-lg bg-surface-interactive border border-edge text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setEditingDetails(false); setDetailsError(null) }}
                  disabled={savingDetails}
                  className="py-2.5 rounded-lg border border-edge text-ink-muted text-sm font-medium hover:bg-surface-sunken disabled:opacity-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingDetails}
                  className="py-2.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors">
                  {savingDetails ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      </CardContent>
    </Card>
  )
}
