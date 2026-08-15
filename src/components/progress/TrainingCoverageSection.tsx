// ============================================================
// ForgeFitOS — Training coverage section (UI-4)
// Presents RECORDED training coverage from the already-fetched
// progress overview rows — no new reads, no new aggregation source.
//
// Attribution boundary (documented, honest): rows are grouped by
// each exercise's PRIMARY muscle — the same field the overview
// cards already display. The 5A.6B multi-muscle anatomy
// (secondary/tertiary roles) drives volume attribution elsewhere
// and is deliberately NOT re-derived here; this section claims only
// "tracked exercises by primary muscle", never full anatomical
// volume coverage.
//
// Honesty rules:
//   - "recently trained" means the exercise has at least one recent
//     session in the existing overview window — recorded data only
//   - muscles with no tracked exercises are listed as exactly that
//     ("no tracked exercises"), never as zero coverage or failure
//   - no scores, percentages-as-grades, badges, or streaks
// ============================================================

import { PRIMARY_MUSCLES } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import type { ExerciseProgressOverviewRow } from '@/lib/progress-overview'

export function TrainingCoverageSection({
  rows,
}: {
  rows: ExerciseProgressOverviewRow[]
}) {
  const groups = PRIMARY_MUSCLES.map((m) => {
    const tracked = rows.filter((r) => r.primaryMuscle === m.value)
    const recent = tracked.filter((r) => r.recentSessionCount > 0)
    return { value: m.value, label: m.label, tracked: tracked.length, recent: recent.length }
  })
  const covered = groups.filter((g) => g.tracked > 0)
  const untracked = groups.filter((g) => g.tracked === 0)

  return (
    <Card variant="metric" className="gap-0 py-4">
      <CardContent className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Training coverage</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Tracked exercises grouped by their primary muscle — recorded sessions only.
          </p>
        </div>

        {covered.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Complete a workout to begin building coverage evidence.
          </p>
        ) : (
          <div className="space-y-2.5">
            {covered.map((g) => (
              <div key={g.value} className="space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="min-w-0 break-words text-xs font-medium text-ink">
                    {g.label}
                  </span>
                  <span className="text-xs tabular-nums text-ink-muted">
                    {g.recent} of {g.tracked} tracked exercise{g.tracked !== 1 ? 's' : ''} trained recently
                  </span>
                </div>
                <ProgressBar
                  value={g.recent}
                  max={g.tracked}
                  size="sm"
                  label={`${g.label}: recently trained tracked exercises`}
                />
              </div>
            ))}
          </div>
        )}

        {untracked.length > 0 && (
          <p className="border-t border-edge-subtle pt-2 text-xs text-ink-muted">
            No tracked exercises yet:{' '}
            {untracked.map((g) => g.label).join(', ')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
