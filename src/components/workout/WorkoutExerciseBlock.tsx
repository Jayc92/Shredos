'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { bestSet, progressSignal, formatPreviousBest, displayWeight, suggestNextTarget, evaluateSetPRs } from '@/lib/workout'
import { ProgressBadge } from './ProgressBadge'
import { SetRow } from './SetRow'
import { ExerciseHistoryRows } from './ExerciseHistoryRows'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import type { WorkoutExerciseWithDetails, WorkoutSet } from '@/types/database'
import type { ProgressionTrend } from '@/lib/workout-coach'
import type { ExerciseHistoryEntry, PRBaseline } from '@/lib/workout'

// Trend labels and styles (Phase 1E — lightweight, no charts)
const TREND_LABEL: Partial<Record<ProgressionTrend, string>> = {
  improving: '↑ Improving',
  steady:    '→ Steady',
  stalling:  '↓ Possible stall',
}
const TREND_CLS: Partial<Record<ProgressionTrend, string>> = {
  improving: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  steady:    'bg-secondary text-muted-foreground border-border',
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
}

export function WorkoutExerciseBlock({ we, previousBest, trend, history, prBaseline }: WorkoutExerciseBlockProps) {
  const router = useRouter()
  const [open, setOpen]           = useState(true)
  const [addingSet, setAddingSet] = useState(false)
  const [removing, setRemoving]   = useState(false)

  const sets    = we.workout_sets ?? []
  const curBest = bestSet(sets)
  const signal  = progressSignal(curBest, previousBest)
  const prevSummary = formatPreviousBest(previousBest)
  const nextTarget = suggestNextTarget(previousBest, we.exercise.unilateral, we.exercise.exercise_type, trend)
  const setPRs = evaluateSetPRs(sets, prBaseline ?? EMPTY_PR_BASELINE)

  const completedSets = sets.filter((s: any) => s.completed && !s.is_warmup).length
  const totalSets     = sets.filter((s: any) => !s.is_warmup).length

  async function handleAddSet() {
    setAddingSet(true)
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null
    await fetch(`/api/workout-exercises/${we.id}/sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weight_lbs: (lastSet as any)?.weight_kg ? displayWeight((lastSet as any).weight_kg) : null,
        reps:       (lastSet as any)?.reps ?? null,
        is_warmup:  false,
        completed:  false,
      }),
    })
    setAddingSet(false)
    router.refresh()
  }

  async function handleRemove() {
    if (!confirm(`Remove ${we.exercise.name} from this workout?`)) return
    setRemoving(true)
    await fetch(`/api/workout-exercises/${we.id}`, { method: 'DELETE' })
    router.refresh()
  }

  const trendLabel = trend ? TREND_LABEL[trend] : undefined
  const trendCls   = trend ? TREND_CLS[trend]   : undefined

  return (
    <div className="shred-card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => setOpen(!open)}
          className="flex items-start gap-2 flex-1 text-left min-w-0">
          {open
            ? <ChevronDown  className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{we.exercise.name}</span>
              {we.exercise.unilateral && (
                <span className="text-xs text-muted-foreground">(per side)</span>
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
            <p className="text-xs text-muted-foreground mt-0.5">
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
          <button type="button" onClick={handleRemove} disabled={removing}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
            aria-label="Remove exercise">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="pl-6 space-y-0.5">
          {previousBest && (
            <p className="text-xs text-muted-foreground">Last: {prevSummary}</p>
          )}
          <p className="text-xs text-muted-foreground">{nextTarget.message}</p>
        </div>
      )}

      {open && (
        <ExerciseHistoryRows entries={history} isUnilateral={we.exercise.unilateral} />
      )}

      {open && (we.target_sets || we.target_reps) && (
        <p className="text-xs text-muted-foreground pl-6">
          Target: {[
            we.target_sets   && `${we.target_sets} sets`,
            we.target_reps   && `${we.target_reps} reps`,
            (we as any).target_weight_kg && `${displayWeight((we as any).target_weight_kg)} lbs`,
          ].filter(Boolean).join(' × ')}
        </p>
      )}

      {open && sets.length > 0 && (
        <div className="pl-6">
          <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
            <span className="w-5 text-center">#</span>
            <span className="flex-1 text-center">Reps</span>
            <span className="flex-1 text-center">Weight</span>
            <span className="w-12 text-center">RPE</span>
            <span className="w-6"></span>
            <span className="w-7"></span>
            <span className="w-6"></span>
          </div>
          {sets.map((s: any) => (
            <SetRow key={s.id} set={s} isUnilateral={we.exercise.unilateral} prType={setPRs[s.id] ?? null} />
          ))}
        </div>
      )}

      {open && (
        <div className="pl-6">
          <button type="button" onClick={handleAddSet} disabled={addingSet}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 disabled:opacity-50 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            {addingSet ? 'Adding…' : 'Add set'}
          </button>
        </div>
      )}
    </div>
  )
}
