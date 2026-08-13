'use client'

// ============================================================
// ShredOS — Goal Adjustment Review Card (Phase 3E)
// The ONE authoritative adjustment-review surface. Fetches the
// server-computed review from /api/goal-adjustment (never runs
// eligibility logic client-side), shows neutral evidence rows, and
// separates the three explicit steps:
//   1. read the review   2. "Review proposed adjustment"
//   3. "Apply new calorie target" (before/after + review date shown
//      BEFORE approval; Cancel makes no changes)
// A failed apply leaves current targets and card state intact and
// shows the server's readable message. Nothing is automatic.
// ============================================================

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { GoalAdjustmentReview } from '@/lib/goal-adjustments'
import type { NutritionTarget } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'

interface GoalAdjustmentReviewCardProps {
  /** Lets the page refresh its own target state after an apply. */
  onApplied?: (target: NutritionTarget) => void
}

const ELIGIBILITY_MESSAGES: Record<string, string> = {
  hold: 'Keep current targets.',
  // Phase 5B.4 cause-differentiated states (plain language, no jargon):
  adherence_first: 'Focus on matching your current target first — the trend is re-read once intake settles.',
  activity_first: 'Restore your usual activity first — a smaller change than eating less.',
  insufficient_weight_data: 'Not enough weekly weigh-ins yet — one per week is enough.',
  insufficient_nutrition_data: 'Insufficient nutrition data to support a target change.',
  improve_logging: 'More completed food-log days are needed — sparse logs are never read as low intake.',
  awaiting_review: 'A recent change is awaiting its outcome review.',
  pending_existing_decision: 'An adjustment decision is already open.',
  recent_target_change: 'Wait longer after the recent target change.',
  unsupported_goal: 'Holding targets — no supported rate range for this goal.',
  missing_target: 'Set nutrition targets to enable the adjustment review.',
  data_unavailable: 'The adjustment review is unavailable right now — try again later.',
}

export function GoalAdjustmentReviewCard({ onApplied }: GoalAdjustmentReviewCardProps) {
  const [review, setReview] = useState<GoalAdjustmentReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState(false)

  async function loadReview() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/goal-adjustment')
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setReview(null)
        setError('The adjustment review is unavailable right now.')
        return
      }
      setReview(body.data as GoalAdjustmentReview)
    } catch {
      setReview(null)
      setError('The adjustment review is unavailable right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleApply() {
    if (!review || review.eligibility !== 'eligible') return
    setApplying(true)
    setError(null)
    try {
      const res = await fetch('/api/goal-adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedCurrentCalories: review.currentCalories,
          proposedCalories: review.proposedCalories,
          expectedGoal: review.goal,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Unable to apply the adjustment.')
        if (body.stale) {
          // Stale review — refresh so the user sees current evidence.
          setConfirming(false)
          await loadReview()
        }
        return
      }
      setApplied(true)
      setConfirming(false)
      if (body.data?.target) onApplied?.(body.data.target as NutritionTarget)
      await loadReview()
    } catch {
      setError('Unable to apply the adjustment.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <Card variant="status" className="gap-0 py-4">
      <CardContent className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-ink">Target adjustment review</h3>
        {review && (
          <span className="text-xs text-ink-muted">{review.window.label}</span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading review…</p>
      ) : !review ? (
        <p className="text-sm text-ink-muted">
          {error ?? 'The adjustment review is unavailable right now.'}
        </p>
      ) : (
        <div className="space-y-1.5">
          {/* Evidence rows — always shown when computed. Phase 5B.4:
              weekly-anchor evidence (Friday-cadence honest) replaces
              the two-week comparison line. */}
          {review.weight.currentAverageLbs !== null && (
            <p className="text-xs text-ink-muted">
              Latest weekly weight: {review.weight.currentAverageLbs.toFixed(1)} lbs
              {review.weight.anchorCount > 0 &&
                ` · ${review.weight.anchorCount} weekly weigh-in${review.weight.anchorCount !== 1 ? 's' : ''} on record`}
              {review.weight.weeklyChangePct !== null &&
                ` · trend ${review.weight.weeklyChangePct > 0 ? '+' : ''}${review.weight.weeklyChangePct.toFixed(2)}% per week`}
            </p>
          )}
          <p className="text-xs text-ink-muted">
            Complete nutrition days: {review.nutrition.loggedDays} of 7
            {review.nutrition.explicitCompleteDays > 0 &&
              ` (${review.nutrition.explicitCompleteDays} marked finished)`}
            {review.nutrition.averageCalories !== null &&
              ` · ${review.nutrition.averageCalories.toLocaleString()} average calories`}
          </p>
          {review.bodyFat.pct !== null && (
            <p className="text-xs text-ink-muted">
              Body-fat context: {review.bodyFat.pct}%{' '}
              ({review.bodyFat.source === 'recent_metric' ? 'recent measurement' : 'profile'})
            </p>
          )}

          {/* Conclusion */}
          <p className="text-sm text-ink">{review.explanation}</p>
          {review.eligibility !== 'eligible' && (
            <p className="text-xs text-ink-muted">
              {ELIGIBILITY_MESSAGES[review.eligibility] ?? ''}
            </p>
          )}

          {/* Phase 5B.4: restrained non-calorie guidance (adherence,
              protein, activity, training) — never invented numbers. */}
          {review.guidance && review.guidance.length > 0 && (
            <ul className="space-y-1">
              {review.guidance.map((g: string) => (
                <li key={g} className="text-xs text-ink-muted">{g}</li>
              ))}
            </ul>
          )}

          {applied && (
            <p className="text-xs text-green-400 bg-green-400/10 rounded px-2 py-1.5">
              Calorie target updated and logged as an applied decision.
            </p>
          )}

          {/* Step 2: review the proposal */}
          {review.eligibility === 'eligible' && !confirming && (
            <button
              onClick={() => setConfirming(true)}
              className="text-xs font-medium text-brand hover:underline"
            >
              Review proposed adjustment →
            </button>
          )}

          {/* Step 3: explicit before/after confirmation */}
          {review.eligibility === 'eligible' && confirming && (
            <div className="space-y-2 border border-border rounded-lg p-3 bg-secondary/50">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-secondary rounded-lg py-2">
                  <p className="text-xs text-ink-muted">Current</p>
                  <p className="text-base font-bold tabular-nums">
                    {review.before?.calories.toLocaleString()} cal
                  </p>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg py-2">
                  <p className="text-xs text-ink-muted">Proposed</p>
                  <p className="text-base font-bold tabular-nums text-primary">
                    {review.after?.calories.toLocaleString()} cal
                  </p>
                </div>
              </div>
              <p className="text-xs text-ink-muted">
                {review.adjustmentAmount !== null &&
                  `${review.adjustmentAmount > 0 ? '+' : ''}${review.adjustmentAmount} calories. `}
                Protein, carb, and fat targets stay unchanged — review macro allocation
                manually if needed.
              </p>
              {review.suggestedReviewOn && (
                <p className="text-xs text-ink-muted">
                  A review date of {format(parseISO(review.suggestedReviewOn), 'MMM d')} will be
                  set on the decision.
                </p>
              )}
              {review.guardrails.length > 0 && (
                <p className="text-xs text-ink-muted">
                  {review.guardrails.join(' ')}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {applying ? 'Applying…' : 'Apply new calorie target'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={applying}
                  className="text-xs font-medium text-ink-muted hover:text-ink disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1.5">
              {error}
            </p>
          )}
        </div>
      )}
    </CardContent>
    </Card>
  )
}
