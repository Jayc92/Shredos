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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="active-workout-conflict-title"
    >
      <div
        className="
          relative z-[60] isolate
          w-full max-w-sm
          rounded-xl
          border border-black/20
          p-5
          shadow-2xl
          ring-1 ring-black/10
          space-y-4
          !bg-white
          !text-black
        "
        style={{
          background: '#ffffff',
          backgroundColor: '#ffffff',
          color: '#111111',
          opacity: 1,
          mixBlendMode: 'normal',
          backdropFilter: 'none',
        }}
      >
        <div>
          <h2 id="active-workout-conflict-title" className="text-sm font-semibold text-black">
            You already have a workout in progress
          </h2>
          <p className="text-xs text-neutral-700 mt-1.5">
            Resume it, or discard it to start a new one. Discarding preserves its logged data but marks it as skipped.
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-700 bg-red-50 rounded px-2 py-1.5">{error}</p>
        )}

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            Resume existing workout
          </button>
          <button
            type="button"
            onClick={onDiscardAndRetry}
            disabled={busy}
            className="w-full py-2.5 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {busy ? 'Working…' : 'Discard existing workout and start new'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="w-full py-2 text-sm text-neutral-600 hover:text-black disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
