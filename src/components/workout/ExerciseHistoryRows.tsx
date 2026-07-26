import { format, parseISO } from 'date-fns'
import { kgToLbs } from '@/lib/units'
import type { ExerciseHistoryEntry } from '@/lib/workout'

interface ExerciseHistoryRowsProps {
  entries?: ExerciseHistoryEntry[]
  isUnilateral?: boolean
}

/**
 * Compact "last few sessions" history for one exercise (Phase 2B).
 * Renders nothing if there's no history yet — Phase 2A's own
 * "Log a working set to start tracking targets." message already
 * covers that case, so this component doesn't add a second one.
 * No chart, no expand/collapse — up to 3 rows, always visible when
 * present, matching the same compact-text approach already
 * established for the Last/Try lines above it.
 */
export function ExerciseHistoryRows({ entries, isUnilateral }: ExerciseHistoryRowsProps) {
  if (!entries || entries.length === 0) return null

  return (
    <div className="pl-6 space-y-1">
      <p className="text-xs font-medium text-muted-foreground">
        Recent{isUnilateral ? ' (per side)' : ''}
      </p>
      {entries.map((entry, i) => {
        const dateLabel = format(parseISO(entry.workoutDate), 'MMM d')
        const isBodyweight = !entry.weightKg || entry.weightKg <= 0

        const mainText = isBodyweight
          ? (entry.reps !== null ? `${entry.reps} reps` : '—')
          : (entry.reps !== null
              ? `${Math.round(kgToLbs(entry.weightKg as number))} lbs × ${entry.reps}`
              : `${Math.round(kgToLbs(entry.weightKg as number))} lbs`)

        const extras: string[] = []
        if (entry.rpe !== null) extras.push(`RPE ${entry.rpe}`)
        if (!isBodyweight && entry.estimated1RmKg !== null) {
          extras.push(`est. 1RM ${Math.round(kgToLbs(entry.estimated1RmKg))} lbs`)
        }

        return (
          <p key={i} className="text-xs text-muted-foreground">
            {dateLabel} — {mainText}
            {extras.length > 0 ? ` · ${extras.join(' · ')}` : ''}
          </p>
        )
      })}
    </div>
  )
}
