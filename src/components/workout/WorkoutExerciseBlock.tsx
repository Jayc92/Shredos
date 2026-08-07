'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { bestSet, progressSignal, formatPreviousBest, displayWeight, suggestNextTarget, evaluateSetPRs, evaluateSetTargetFeedback, pickRepresentativeCardioSet, trackingAwareProgressSignal } from '@/lib/workout'
import { ProgressBadge } from './ProgressBadge'
import { SetRow } from './SetRow'
import { ExerciseHistoryRows } from './ExerciseHistoryRows'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import type { WorkoutExerciseWithDetails, WorkoutSet } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import type { ProgressionTrend } from '@/lib/workout-coach'
import type { ExerciseHistoryEntry, PRBaseline, RepRange } from '@/lib/workout'

// Trend labels and styles (Phase 1E — lightweight, no charts)
const TREND_LABEL: Partial<Record<ProgressionTrend, string>> = {
  improving: '↑ Improving',
  steady:    '→ Steady',
  stalling:  '↓ Possible stall',
}
const TREND_CLS: Partial<Record<ProgressionTrend, string>> = {
  improving: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  steady:    'bg-secondary text-ink-muted border-border',
  stalling:  'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
}

// Phase 2C: fallback when no PR baseline is available yet for this
// exercise (e.g. it was just added to the session) — behaves the same
// as "no history", every set is eligible to be a first-time PR.
const EMPTY_PR_BASELINE: PRBaseline = {
  maxWeightKg: null,
  maxEstimated1RmKg: null,
  maxBodyweightReps: null,
}

interface WorkoutExerciseBlockProps {
  we: WorkoutExerciseWithDetails
  previousBest: WorkoutSet | null
  trend?: ProgressionTrend
  history?: ExerciseHistoryEntry[]
  prBaseline?: PRBaseline
  readOnly?: boolean
}

export function WorkoutExerciseBlock({ we, previousBest, trend, history, prBaseline, readOnly = false }: WorkoutExerciseBlockProps) {
  const router = useRouter()
  const [open, setOpen]           = useState(true)
  const [addingSet, setAddingSet] = useState(false)
  const [removing, setRemoving]   = useState(false)

  const sets    = we.workout_sets ?? []
  // Phase 2U: cardio/timed use the tracking-aware representative-set
  // picker and comparison signal -- bestSet()/progressSignal() would
  // always return null/'same' for these modes, since bestSet's filter
  // structurally excludes duration-based sets (no weight_kg, no reps).
  const isCardioOrTimed = we.exercise.tracking_mode === 'cardio' || we.exercise.tracking_mode === 'timed'
  const curBest = isCardioOrTimed
    ? pickRepresentativeCardioSet(sets, we.exercise.tracking_mode)
    : bestSet(sets)
  const signal  = isCardioOrTimed
    ? trackingAwareProgressSignal(curBest, previousBest, we.exercise.tracking_mode)
    : progressSignal(curBest, previousBest)
  const prevSummary = formatPreviousBest(previousBest, we.exercise.tracking_mode)
  const nextTarget = suggestNextTarget(
    previousBest,
    we.exercise.unilateral,
    we.exercise.tracking_mode,
    we.exercise.equipment,
    trend,
    { min: we.target_reps_min ?? null, max: we.target_reps_max ?? null }
  )
  const setPRs = evaluateSetPRs(sets, prBaseline ?? EMPTY_PR_BASELINE)

  // Phase 2G: per-set target-execution feedback for the active
  // workout. Only completed, non-warmup sets are evaluated — warmups
  // and incomplete sets receive no target feedback at all. Reuses the
  // exact same repRange snapshot already built above for
  // suggestNextTarget, so there's one source of truth for "what is
  // this exercise's target" per render, not two.
  const repRangeForFeedback: RepRange = { min: we.target_reps_min ?? null, max: we.target_reps_max ?? null }
  const targetFeedbackBySetId: Record<string, string> = {}
  for (const s of sets as any[]) {
    if (!s.completed || s.is_warmup) continue
    const feedback = evaluateSetTargetFeedback(s.reps, s.rpe, we.exercise.tracking_mode, repRangeForFeedback)
    targetFeedbackBySetId[s.id] = feedback.label
  }

  const completedSets = sets.filter((s: any) => s.completed && !s.is_warmup).length
  const totalSets     = sets.filter((s: any) => !s.is_warmup).length

  // Phase 2O: exercise-level setup/technique notes, surfaced from the
  // already-existing, already-user-owned exercises.notes column (not
  // new data -- ExerciseForm.tsx has edited this same field since
  // Phase 1C). Editable only when this block isn't read-only, exactly
  // mirroring the same editable-state rule already governing every
  // other mutation control in this component.
  const EXERCISE_NOTES_MAX_LENGTH = 1000
  const [editingExerciseNotes, setEditingExerciseNotes] = useState(false)
  const [exerciseNotesDraft, setExerciseNotesDraft] = useState(we.exercise.notes ?? '')
  const [savingExerciseNotes, setSavingExerciseNotes] = useState(false)
  const [exerciseNotesError, setExerciseNotesError] = useState<string | null>(null)
  const trimmedExerciseNotes = (we.exercise.notes ?? '').trim()

  function startEditingExerciseNotes() {
    if (readOnly) return
    setExerciseNotesDraft(we.exercise.notes ?? '')
    setExerciseNotesError(null)
    setEditingExerciseNotes(true)
  }

  function handleExerciseNotesCancel() {
    setExerciseNotesDraft(we.exercise.notes ?? '')
    setExerciseNotesError(null)
    setEditingExerciseNotes(false)
  }

  async function handleSaveExerciseNotes() {
    if (readOnly) return
    if (savingExerciseNotes) return
    const trimmed = exerciseNotesDraft.trim()
    if (trimmed.length > EXERCISE_NOTES_MAX_LENGTH) return // Save is already disabled in this state; defensive guard
    setSavingExerciseNotes(true)
    setExerciseNotesError(null)
    try {
      const res = await fetch(`/api/exercises/${we.exercise.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: trimmed.length > 0 ? trimmed : null }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setExerciseNotesError(body.error ?? 'Could not save exercise notes. Please try again.')
        setSavingExerciseNotes(false)
        return
      }
      setExerciseNotesError(null)
      setEditingExerciseNotes(false)
      setSavingExerciseNotes(false)
      router.refresh()
    } catch {
      setExerciseNotesError('Could not save exercise notes. Please try again.')
      setSavingExerciseNotes(false)
    }
  }

  async function handleAddSet() {
    if (readOnly) return
    setAddingSet(true)
    const lastSet = sets.length > 0 ? (sets[sets.length - 1] as any) : null
    const trackingMode = we.exercise.tracking_mode

    // Phase 2S: only send fields this exercise's tracking_mode
    // actually allows -- the API rejects any incompatible key outright,
    // so this must match exactly, not just "extra harmless fields."
    let payload: Record<string, unknown>
    if (trackingMode === 'weight_reps') {
      payload = {
        weight_lbs: lastSet?.weight_kg ? displayWeight(lastSet.weight_kg) : null,
        reps:       lastSet?.reps ?? null,
        is_warmup:  false,
        completed:  false,
      }
    } else if (trackingMode === 'bodyweight') {
      // Unlike weight_reps, bodyweight also copies RPE and the last
      // set's warm-up status, per the approved add-set behavior.
      payload = {
        reps:       lastSet?.reps ?? null,
        rpe:        lastSet?.rpe ?? null,
        is_warmup:  lastSet?.is_warmup ?? false,
        weight_lbs: lastSet?.weight_kg ? displayWeight(lastSet.weight_kg) : null,
        completed:  false,
      }
    } else if (trackingMode === 'cardio') {
      payload = {
        duration_seconds: lastSet?.duration_seconds ?? null,
        distance_meters:  lastSet?.distance_meters ?? null,
        completed: false,
      }
    } else {
      // timed
      payload = {
        duration_seconds: lastSet?.duration_seconds ?? null,
        rpe:               lastSet?.rpe ?? null,
        completed: false,
      }
    }

    await fetch(`/api/workout-exercises/${we.id}/sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setAddingSet(false)
    router.refresh()
  }

  async function handleRemove() {
    if (readOnly) return
    if (!confirm(`Remove ${we.exercise.name} from this workout?`)) return
    setRemoving(true)
    await fetch(`/api/workout-exercises/${we.id}`, { method: 'DELETE' })
    router.refresh()
  }

  const trendLabel = trend ? TREND_LABEL[trend] : undefined
  const trendCls   = trend ? TREND_CLS[trend]   : undefined

  return (
    <Card variant="default" className="gap-0 py-4">
      <CardContent className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => setOpen(!open)}
          className="flex items-start gap-2 flex-1 text-left min-w-0">
          {open
            ? <ChevronDown  className="w-4 h-4 text-ink-muted mt-0.5 flex-shrink-0" />
            : <ChevronRight className="w-4 h-4 text-ink-muted mt-0.5 flex-shrink-0" />}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-ink">{we.exercise.name}</span>
              {we.exercise.unilateral && (
                <span className="text-xs text-ink-muted">(per side)</span>
              )}
              {/* Phase 1E: trend label — only shown for meaningful signals */}
              {trendLabel && trendCls && (
                <span className={cn(
                  'text-xs border rounded px-1.5 py-0.5 font-medium',
                  trendCls
                )}>
                  {trendLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              {we.exercise.primary_muscle.charAt(0).toUpperCase() + we.exercise.primary_muscle.slice(1)}
              {we.exercise.equipment ? ` · ${we.exercise.equipment}` : ''}
              {totalSets > 0 && ` · ${completedSets}/${totalSets} sets done`}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* QA fix: previousBest exists but nothing completed yet this
              session -> no meaningful comparison exists, so show no
              badge at all rather than a misleading "Same". New-exercise
              behavior (no previousBest) is unaffected either way. */}
          {(curBest || !previousBest) && (
            <ProgressBadge signal={signal} previousSummary={prevSummary} />
          )}
          {!readOnly && (
            <button type="button" onClick={handleRemove} disabled={removing}
              className="p-1 text-ink-muted hover:text-critical transition-colors disabled:opacity-40"
              aria-label="Remove exercise">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {open && (editingExerciseNotes || trimmedExerciseNotes.length > 0 || !readOnly) && (
        <div className="pl-6">
          {editingExerciseNotes ? (
            <div className="space-y-1.5">
              <label htmlFor={`exercise-notes-${we.exercise.id}`} className="text-xs font-medium text-ink-muted">
                Exercise notes
              </label>
              <textarea
                id={`exercise-notes-${we.exercise.id}`}
                value={exerciseNotesDraft}
                onChange={e => setExerciseNotesDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') handleExerciseNotesCancel() }}
                placeholder="Setup, form cues, equipment differences, or anything to remember next time."
                maxLength={EXERCISE_NOTES_MAX_LENGTH + 100}
                rows={3}
                className="w-full px-2 py-1.5 rounded-md bg-secondary border border-input text-ink text-xs placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ring resize-y"
              />
              <p
                className={cn('text-xs', exerciseNotesDraft.length > EXERCISE_NOTES_MAX_LENGTH ? 'text-destructive' : 'text-ink-muted')}
                aria-live="polite"
              >
                {exerciseNotesDraft.length} / {EXERCISE_NOTES_MAX_LENGTH}
              </p>
              {exerciseNotesError && (
                <p className="text-xs text-destructive" aria-live="polite">{exerciseNotesError}</p>
              )}
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleSaveExerciseNotes}
                  disabled={savingExerciseNotes || exerciseNotesDraft.trim().length > EXERCISE_NOTES_MAX_LENGTH}
                  className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {savingExerciseNotes ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={handleExerciseNotesCancel} disabled={savingExerciseNotes}
                  className="px-3 py-1 rounded-md border border-border text-ink-muted text-xs font-medium hover:bg-secondary disabled:opacity-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : trimmedExerciseNotes.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-ink-muted">Exercise notes</p>
              <p className="text-xs text-ink whitespace-pre-wrap break-words">{trimmedExerciseNotes}</p>
              {!readOnly && (
                <button type="button" onClick={startEditingExerciseNotes} className="text-xs text-brand hover:underline">
                  Edit notes
                </button>
              )}
            </div>
          ) : (
            <button type="button" onClick={startEditingExerciseNotes} className="text-xs text-ink-muted hover:text-ink transition-colors">
              + Add exercise notes
            </button>
          )}
        </div>
      )}

      {open && (
        <div className="pl-6 space-y-0.5">
          {previousBest && (
            <p className="text-xs text-ink-muted">Last: {prevSummary}</p>
          )}
          {nextTarget.action !== 'no_suggestion' && (
            <p className="text-xs text-ink-muted">{nextTarget.message}</p>
          )}
        </div>
      )}

      {open && (
        <ExerciseHistoryRows entries={history} isUnilateral={we.exercise.unilateral} trackingMode={we.exercise.tracking_mode} />
      )}

      {open && (we.target_sets || we.target_reps) && (
        <p className="text-xs text-ink-muted pl-6">
          Target: {[
            we.target_sets   && `${we.target_sets} sets`,
            we.target_reps   && `${we.target_reps} reps`,
            (we as any).target_weight_kg && `${displayWeight((we as any).target_weight_kg)} lbs`,
          ].filter(Boolean).join(' × ')}
        </p>
      )}

      {open && sets.length > 0 && (
        <div className="pl-6">
          <div className="flex items-center gap-2 mb-1 text-xs text-ink-muted">
            <span className="w-5 text-center">#</span>
            {we.exercise.tracking_mode === 'weight_reps' && (
              <>
                <span className="flex-1 text-center">Reps</span>
                <span className="flex-1 text-center">Weight</span>
                <span className="w-12 text-center">RPE</span>
                <span className="w-6"></span>
              </>
            )}
            {we.exercise.tracking_mode === 'bodyweight' && (
              <>
                <span className="flex-1 text-center">Reps</span>
                <span className="w-12 text-center">RPE</span>
                <span className="w-6"></span>
              </>
            )}
            {we.exercise.tracking_mode === 'cardio' && (
              <>
                <span className="flex-1 text-center">Duration</span>
                <span className="flex-1 text-center">Distance</span>
              </>
            )}
            {we.exercise.tracking_mode === 'timed' && (
              <>
                <span className="flex-1 text-center">Duration</span>
                <span className="w-12 text-center">RPE</span>
              </>
            )}
            <span className="w-7"></span>
            <span className="w-6"></span>
          </div>
          {sets.map((s: any) => (
            <SetRow
              key={s.id}
              set={s}
              isUnilateral={we.exercise.unilateral}
              trackingMode={we.exercise.tracking_mode}
              prType={setPRs[s.id] ?? null}
              targetFeedbackLabel={targetFeedbackBySetId[s.id]}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {open && !readOnly && (
        <div className="pl-6">
          <button type="button" onClick={handleAddSet} disabled={addingSet}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 disabled:opacity-50 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            {addingSet ? 'Adding…' : 'Add set'}
          </button>
        </div>
      )}
    </CardContent>
    </Card>
  )
}
