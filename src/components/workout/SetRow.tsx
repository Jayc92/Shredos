'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { displayWeight } from '@/lib/workout'
import type { PRType } from '@/lib/workout'
import { Trash2, AlertCircle, Check } from 'lucide-react'
import { trackSetSave } from './set-save-coordinator'
import { reconcileSetRowState } from './set-apply-reconcile'
import type { WorkoutSet, TrackingMode } from '@/types/database'

// Phase 2C: display labels for evaluateSetPRs' PRType. "Est. 1RM PR"
// specifically, not "1RM PR" -- it's a formula-derived estimate, not a
// verified true 1-rep max. "Rep PR" for bodyweight display copy, while
// the internal type stays bodyweight_reps.
const PR_LABELS: Record<Exclude<PRType, null>, string> = {
  weight: 'Weight PR',
  estimated_1rm: 'Est. 1RM PR',
  bodyweight_reps: 'Rep PR',
}

// Phase 2S: local, non-exported conversion -- distance is stored in
// meters (matching distance_meters) but displayed in miles, the same
// metric-storage/US-display split this app already uses for weight
// (weight_kg / lbsToKg / displayWeight in lib/units.ts). Kept local
// here rather than added to lib/units.ts, since that file isn't part
// of this phase's approved scope.
const METERS_PER_MILE = 1609.34

interface SetRowProps {
  set: WorkoutSet
  isUnilateral: boolean
  trackingMode: TrackingMode
  prType?: PRType
  targetFeedbackLabel?: string
  readOnly?: boolean
}

export function SetRow({ set, isUnilateral, trackingMode, prType, targetFeedbackLabel, readOnly = false }: SetRowProps) {
  const router = useRouter()
  const [reps,      setReps]      = useState(set.reps      !== null ? String(set.reps)      : '')
  const [lbs,       setLbs]       = useState(set.weight_kg !== null ? String(displayWeight(set.weight_kg)) : '')
  const [rpe,       setRpe]       = useState(set.rpe       !== null ? String(set.rpe)       : '')
  const [completed, setCompleted] = useState(set.completed)
  const [isWarmup,  setIsWarmup]  = useState(set.is_warmup)
  const [busy,      setBusy]      = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Phase 2S: cardio/timed duration as a minutes + seconds pair rather
  // than one ambiguous "total seconds" field. Bodyweight's added-weight
  // box starts expanded only if a value already exists -- otherwise
  // collapsed behind a "+ Added weight" affordance, matching the
  // approved smallest-safe design.
  const [durationMin, setDurationMin] = useState(
    set.duration_seconds !== null ? String(Math.floor(set.duration_seconds / 60)) : ''
  )
  const [durationSec, setDurationSec] = useState(
    set.duration_seconds !== null ? String(set.duration_seconds % 60) : ''
  )
  // Missing never renders as measured zero: a NULL value maps to ''
  // here AND the weight/distance inputs use unit placeholders (never
  // "0"), so only a genuinely stored 0 can ever display as 0.
  const [distanceMi, setDistanceMi] = useState(
    set.distance_meters !== null ? String(Math.round((set.distance_meters / METERS_PER_MILE) * 100) / 100) : ''
  )
  const [addedWeightExpanded, setAddedWeightExpanded] = useState(set.weight_kg !== null)

  // UI-5B1B stale-state correction: the useState initializers above
  // run ONCE, and router.refresh() preserves client state — so a
  // server-side change to this set (Apply-to-remaining's reconciled
  // response, or a refresh landing new values) previously never
  // reached the visible inputs until a full remount. This is React's
  // adjust-state-during-render pattern: when the server row changes,
  // reconcileSetRowState diffs it field-by-field against the last
  // synced row and updates ONLY the fields whose SERVER value
  // changed — in-progress typing in other fields, busy/saveError
  // indicators, and the component instance itself are untouched.
  const [syncedSet, setSyncedSet] = useState(set)
  if (set !== syncedSet) {
    const u = reconcileSetRowState(syncedSet, set)
    if (u.reps        !== undefined) setReps(u.reps)
    if (u.lbs         !== undefined) setLbs(u.lbs)
    if (u.rpe         !== undefined) setRpe(u.rpe)
    if (u.durationMin !== undefined) setDurationMin(u.durationMin)
    if (u.durationSec !== undefined) setDurationSec(u.durationSec)
    if (u.distanceMi  !== undefined) setDistanceMi(u.distanceMi)
    if (u.completed   !== undefined) setCompleted(u.completed)
    if (u.isWarmup    !== undefined) setIsWarmup(u.isWarmup)
    if (u.addedWeightExpanded)       setAddedWeightExpanded(true)
    setSyncedSet(set)
  }

  async function patch(update: Record<string, unknown>) {
    // Phase 2I backstop: the UI hides/disables every mutation control
    // in read-only mode, and every handler below already guards itself
    // independently -- this additional check means even a future
    // caller that forgets its own guard still can't reach the network.
    if (readOnly) return false
    setSaveError(null)
    // UI-5B1B: the in-flight save registers with the coordinator so
    // Apply-to-remaining can deterministically await it. The promise
    // is returned unchanged — every caller's await/rollback behavior
    // is identical to before.
    const save = (async () => {
      const res = await fetch(`/api/workout-sets/${set.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })
      if (!res.ok) {
        setSaveError('Not saved')
        return false
      }
      router.refresh()
      return true
    })()
    return trackSetSave(set.workout_exercise_id, save)
  }

  async function handleRepsBlur() {
    if (readOnly) return
    const n = parseInt(reps)
    if (!isNaN(n) && n !== set.reps) await patch({ reps: n })
  }

  async function handleWeightBlur() {
    if (readOnly) return
    const n = parseFloat(lbs)
    if (!isNaN(n)) {
      const stored = set.weight_kg !== null ? displayWeight(set.weight_kg) : null
      if (n !== stored) await patch({ weight_lbs: n })
    }
  }

  async function handleRpeBlur() {
    if (readOnly) return
    const n = parseFloat(rpe)
    if (!isNaN(n) && n >= 1 && n <= 10 && n !== set.rpe) await patch({ rpe: n })
  }

  // Phase 2S: combines the minutes + seconds pair into one
  // duration_seconds PATCH. Both fields empty clears duration back to
  // null; otherwise each empty field is treated as 0 for the total.
  async function handleDurationBlur() {
    if (readOnly) return
    if (durationMin.trim() === '' && durationSec.trim() === '') {
      if (set.duration_seconds !== null) await patch({ duration_seconds: null })
      return
    }
    const m = parseInt(durationMin) || 0
    const s = parseInt(durationSec) || 0
    const total = m * 60 + s
    if (total !== (set.duration_seconds ?? -1)) await patch({ duration_seconds: total })
  }

  async function handleDistanceBlur() {
    if (readOnly) return
    if (distanceMi.trim() === '') {
      if (set.distance_meters !== null) await patch({ distance_meters: null })
      return
    }
    const mi = parseFloat(distanceMi)
    if (isNaN(mi) || mi <= 0) {
      if (set.distance_meters !== null) await patch({ distance_meters: null })
      return
    }
    const meters = Math.round(mi * METERS_PER_MILE * 100) / 100
    if (meters !== set.distance_meters) await patch({ distance_meters: meters })
  }

  async function toggleComplete() {
    if (readOnly) return
    const next = !completed
    setCompleted(next)
    const ok = await patch({ completed: next })
    if (!ok) setCompleted(!next)
  }

  async function toggleWarmup() {
    if (readOnly) return
    const next = !isWarmup
    setIsWarmup(next)
    const ok = await patch({ is_warmup: next })
    if (!ok) setIsWarmup(!next)
  }

  async function handleDelete() {
    if (readOnly) return
    if (!confirm('Delete this set?')) return
    setBusy(true)
    const res = await fetch(`/api/workout-sets/${set.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setSaveError('Delete failed')
      setBusy(false)
      return
    }
    router.refresh()
  }

  const inputCls = 'w-full min-w-0 min-h-9 px-2 py-1.5 rounded-md bg-surface-interactive border border-edge text-ink text-xs text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-ring'
  const weightSuffix = isUnilateral ? 'per side' : 'lbs'
  const showWarmupToggle = trackingMode === 'weight_reps' || trackingMode === 'bodyweight'

  // Phase 2C/2G: combined PR + target-feedback label — only one PR type
  // shown, priority already resolved by evaluateSetPRs, and target
  // feedback already resolved by evaluateSetTargetFeedback, both
  // before this component ever sees them. SetRow does not query or
  // compute PR/target status itself. Approved order: PR first, then
  // range/effort, joined with " · ". A PR remains visible even when
  // there is no programmed target (targetFeedbackLabel is '' or
  // undefined in that case).
  const combinedLabel = [
    prType ? PR_LABELS[prType] : null,
    targetFeedbackLabel || null,
  ].filter(Boolean).join(' · ')

  return (
    <div className={cn(
      'py-2 border-b border-edge-subtle last:border-0',
      isWarmup   && 'opacity-60',
      completed  && 'opacity-80'
    )}>
      {/* UI-5B1A mobile correction: below sm the row wraps into two
          real rows — set number + the action group on the first, the
          tracking inputs full-width on the second — so every action
          button keeps a REAL 44x44 CSS box (no pseudo-element hit
          slop) and the numeric inputs get generous width. From sm:
          the original single-row composition returns with the same
          44px boxes. Pure CSS composition: every control exists once
          in the DOM; no handler, state, or payload changes. */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 sm:flex-nowrap">
      {/* Set number */}
      <span className="text-xs text-ink-muted w-5 text-center flex-shrink-0 tabular-nums">
        {isWarmup ? 'WU' : set.set_number}
      </span>

      {/* Tracking inputs — full-width second row on phones, inline from sm: */}
      <div className="order-last flex w-full min-w-0 items-center gap-1.5 sm:order-none sm:w-auto sm:flex-1">
      {(trackingMode === 'weight_reps' || trackingMode === 'bodyweight') && (
        <>
          {/* Reps */}
          <div className="flex-1 min-w-0">
            <input type="number" inputMode="numeric" value={reps}
              onChange={e => setReps(e.target.value)}
              onFocus={e => e.target.select()}
              onBlur={handleRepsBlur}
              placeholder="reps" min="0" step="1"
              aria-label="Reps"
              readOnly={readOnly}
              aria-readonly={readOnly}
              className={inputCls} />
          </div>

          {/* Weight — always visible for weight_reps; only for bodyweight
              once "+ Added weight" has been expanded */}
          {(trackingMode === 'weight_reps' || addedWeightExpanded) && (
            <div className="flex-1 min-w-0">
              <div className="relative">
                <input type="number" inputMode="decimal" value={lbs}
                  onChange={e => setLbs(e.target.value)}
                  onFocus={e => e.target.select()}
                  onBlur={handleWeightBlur}
                  placeholder="lbs" min="0" step="0.5"
                  aria-label={trackingMode === 'bodyweight'
                    ? (isUnilateral ? 'Added weight per side in lbs' : 'Added weight in lbs')
                    : (isUnilateral ? 'Weight per side in lbs' : 'Weight in lbs')}
                  readOnly={readOnly}
                  aria-readonly={readOnly}
                  className={cn(inputCls, isUnilateral ? 'pr-16' : 'pr-7')} />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted select-none pointer-events-none whitespace-nowrap">
                  {weightSuffix}
                </span>
              </div>
            </div>
          )}

          {/* RPE — Rate of Perceived Exertion 1–10 */}
          <div className="w-12 flex-shrink-0">
            <input type="number" inputMode="decimal" value={rpe}
              onChange={e => setRpe(e.target.value)}
              onFocus={e => e.target.select()}
              onBlur={handleRpeBlur}
              placeholder="RPE" min="1" max="10" step="0.5"
              title="Rate of Perceived Exertion (1–10). RPE 10 = max effort. RPE 8 ≈ 2 reps in reserve."
              aria-label="RPE — Rate of Perceived Exertion, 1 to 10"
              readOnly={readOnly}
              aria-readonly={readOnly}
              className={inputCls} />
          </div>
        </>
      )}

      {(trackingMode === 'cardio' || trackingMode === 'timed') && (
        <>
          {/* Duration — minutes : seconds pair */}
          <div className="flex-1 min-w-0 flex items-center gap-1">
            <input type="number" inputMode="numeric" value={durationMin}
              onChange={e => setDurationMin(e.target.value)}
              onFocus={e => e.target.select()}
              onBlur={handleDurationBlur}
              placeholder="min" min="0" step="1"
              aria-label="Duration — minutes"
              readOnly={readOnly}
              aria-readonly={readOnly}
              className={inputCls} />
            <span className="text-xs text-ink-muted flex-shrink-0">:</span>
            <input type="number" inputMode="numeric" value={durationSec}
              onChange={e => setDurationSec(e.target.value)}
              onFocus={e => e.target.select()}
              onBlur={handleDurationBlur}
              placeholder="sec" min="0" max="59" step="1"
              aria-label="Duration — seconds"
              readOnly={readOnly}
              aria-readonly={readOnly}
              className={inputCls} />
          </div>

          {/* Distance — cardio only, optional */}
          {trackingMode === 'cardio' && (
            <div className="flex-1 min-w-0">
              <div className="relative">
                <input type="number" inputMode="decimal" value={distanceMi}
                  onChange={e => setDistanceMi(e.target.value)}
                  onFocus={e => e.target.select()}
                  onBlur={handleDistanceBlur}
                  placeholder="mi" min="0" step="0.01"
                  aria-label="Distance in miles"
                  readOnly={readOnly}
                  aria-readonly={readOnly}
                  className={cn(inputCls, 'pr-7')} />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted select-none pointer-events-none whitespace-nowrap">
                  mi
                </span>
              </div>
            </div>
          )}

          {/* RPE — timed only, optional */}
          {trackingMode === 'timed' && (
            <div className="w-12 flex-shrink-0">
              <input type="number" inputMode="decimal" value={rpe}
                onChange={e => setRpe(e.target.value)}
                onFocus={e => e.target.select()}
                onBlur={handleRpeBlur}
                placeholder="RPE" min="1" max="10" step="0.5"
                title="Rate of Perceived Exertion (1–10). RPE 10 = max effort. RPE 8 ≈ 2 reps in reserve."
                aria-label="RPE — Rate of Perceived Exertion, 1 to 10"
                readOnly={readOnly}
                aria-readonly={readOnly}
                className={inputCls} />
            </div>
          )}
        </>
      )}

      </div>

      {/* Action group — real 44px boxes, clearly separated, grouped
          right on the phone row */}
      <div className="ml-auto flex flex-shrink-0 items-center gap-2 sm:ml-0">
      {/* Warm-up toggle — not applicable to cardio/timed (Phase 2S) */}
      {showWarmupToggle && (
        <button
          type="button"
          onClick={toggleWarmup}
          disabled={readOnly}
          title="Warm-up set — excluded from progressive overload and volume calculations"
          aria-label="Warm-up set"
          aria-pressed={isWarmup}
          className={cn(
            'flex h-11 min-w-11 items-center justify-center rounded border px-1 text-xs font-medium transition-colors flex-shrink-0 disabled:opacity-70',
            isWarmup
              ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-sm'
              : 'border-edge text-ink-muted hover:border-ink-muted'
          )}
        >
          WU
        </button>
      )}

      {/* Complete */}
      <button
        type="button"
        onClick={toggleComplete}
        disabled={readOnly}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
        aria-pressed={completed}
        className={cn(
          'w-11 h-11 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-90',
          completed
            ? 'border-success bg-success-subtle text-success'
            : 'border-edge hover:border-ink-muted'
        )}
      >
        {completed && <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />}
      </button>

      {/* Save error indicator */}
      {saveError && (
        <span title={saveError} className="flex-shrink-0 text-critical" aria-label={saveError}>
          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
      )}

      {/* Delete */}
      {!readOnly && (
        <button type="button" onClick={handleDelete} disabled={busy}
          aria-label="Delete set"
          className="flex h-11 w-11 items-center justify-center text-ink-muted hover:text-critical transition-colors flex-shrink-0 disabled:opacity-40">
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
      </div>
      </div>

      {/* Phase 2S: collapsed "Added weight" affordance for bodyweight,
          shown below the main row once (before the PR/target line) --
          same pattern as the row itself, just a second line rather than
          squeezing into an already-full single-line layout on mobile. */}
      {trackingMode === 'bodyweight' && !addedWeightExpanded && !readOnly && (
        <button
          type="button"
          onClick={() => setAddedWeightExpanded(true)}
          className="inline-flex min-h-9 items-center text-xs text-ink-muted hover:text-ink pl-7 mt-1 transition-colors"
        >
          + Added weight
        </button>
      )}

      {/* Phase 2C/2G: combined PR + target-feedback line */}
      {combinedLabel && (
        <p className="text-xs text-primary font-medium pl-7 mt-1">
          {combinedLabel}
        </p>
      )}
    </div>
  )
}
