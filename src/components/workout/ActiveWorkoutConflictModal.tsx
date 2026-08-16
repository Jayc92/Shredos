'use client'

interface ActiveWorkoutConflictModalProps {
  busy: boolean
  error: string | null
  onResume: () => void
  onDiscardAndRetry: () => void
  onCancel: () => void
}

/**
 * Shared conflict-resolution modal (Phase 2K), used identically by
 * CreateWorkoutButton and StartWorkoutButton whenever their creation
 * request returns 409 because a true active training session already
 * exists.
 *
 * Purely presentational — all async logic (the discard PATCH, the
 * retry, error handling) lives in the caller, which already knows
 * whether the original action was a manual creation or a routine
 * start and can retry the correct one. This component only renders
 * the three choices and reflects the caller's busy/error state; it
 * never fetches or mutates anything itself.
 */
export function ActiveWorkoutConflictModal({
  busy,
  error,
  onResume,
  onDiscardAndRetry,
  onCancel,
}: ActiveWorkoutConflictModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="active-workout-conflict-title"
    >
      {/* UI-5B2 hosted-QA correction: the forced-white shell violated
          the UI-1 semantic dark token system. Same structure, same
          copy, same callbacks — only tokens. */}
      <div className="relative w-full max-w-sm rounded-xl border border-edge bg-surface-raised p-5 shadow-2xl space-y-4">
        <div>
          <h2 id="active-workout-conflict-title" className="text-sm font-semibold text-ink">
            You already have a workout in progress
          </h2>
          <p className="text-xs text-ink-muted mt-1.5">
            Resume it, or discard it to start a new one. Discarding preserves its logged data but marks it as skipped.
          </p>
        </div>

        {error && (
          <p className="text-xs text-critical bg-critical-subtle rounded px-2 py-1.5">{error}</p>
        )}

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            disabled={busy}
            className="w-full min-h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            Resume existing workout
          </button>
          <button
            type="button"
            onClick={onDiscardAndRetry}
            disabled={busy}
            className="w-full min-h-11 rounded-lg border border-critical text-critical text-sm font-medium hover:bg-critical-subtle disabled:opacity-50 transition-colors"
          >
            {busy ? 'Working…' : 'Discard existing workout and start new'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="w-full min-h-11 rounded-lg text-sm text-ink-muted hover:text-ink disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
