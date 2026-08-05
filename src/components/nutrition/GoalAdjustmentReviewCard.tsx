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

interface GoalAdjustmentReviewCardProps {
  /** Lets the page refresh its own target state after an apply. */
  onApplied?: (target: NutritionTarget) => void
}

const ELIGIBILITY_MESSAGES: Record<string, string> = {
  hold: 'Keep current targets.',
  insufficient_weight_data: 'Insufficient weight data for a weekly comparison.',
  insufficient_nutrition_data: 'Insufficient nutrition data to support a target change.',
  improve_logging: 'Improve logging before adjusting targets.',
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
    <div className="shred-card space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">Target adjustment review</h3>
        {review && (
          <span className="text-xs text-muted-foreground">{review.window.label}</span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading review…</p>
      ) : !review ? (
        <p className="text-sm text-muted-foreground">
          {error ?? 'The adjustment review is unavailable right now.'}
        </p>
      ) : (
        <div className="space-y-1.5">
          {/* Evidence rows — always shown when computed */}
          {review.weight.currentAverageLbs !== null && (
            <p className="text-xs text-muted-foreground">
              Weekly average weight: {review.weight.currentAverageLbs.toFixed(1)} lbs
              {review.weight.priorAverageLbs !== null &&
                ` · prior week ${review.weight.priorAverageLbs.toFixed(1)} lbs`}
              {review.weight.weeklyChangePct !== null &&
                ` · ${review.weight.weeklyChangePct > 0 ? '+' : ''}${review.weight.weeklyChangePct.toFixed(2)}% per week`}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Nutrition logged on {review.nutrition.loggedDays} of 7 days
            {review.nutrition.averageCalories !== null &&
              ` · ${review.nutrition.averageCalories.toLocaleString()} average calories`}
          </p>
          {review.bodyFat.pct !== null && (
            <p className="text-xs text-muted-foreground">
              Body-fat context: {review.bodyFat.pct}%{' '}
              ({review.bodyFat.source === 'recent_metric' ? 'recent measurement' : 'profile'})
            </p>
          )}

          {/* Conclusion */}
          <p className="text-sm text-foreground">{review.explanation}</p>
          {review.eligibility !== 'eligible' && (
            <p className="text-xs text-muted-foreground">
              {ELIGIBILITY_MESSAGES[review.eligibility] ?? ''}
            </p>
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
              className="text-xs font-medium text-primary hover:underline"
            >
              Review proposed adjustment →
            </button>
          )}

          {/* Step 3: explicit before/after confirmation */}
          {review.eligibility === 'eligible' && confirming && (
            <div className="space-y-2 border border-border rounded-lg p-3 bg-secondary/50">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-secondary rounded-lg py-2">
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-base font-bold tabular-nums">
                    {review.before?.calories.toLocaleString()} cal
                  </p>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg py-2">
                  <p className="text-xs text-muted-foreground">Proposed</p>
                  <p className="text-base font-bold tabular-nums text-primary">
                    {review.after?.calories.toLocaleString()} cal
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {review.adjustmentAmount !== null &&
                  `${review.adjustmentAmount > 0 ? '+' : ''}${review.adjustmentAmount} calories. `}
                Protein, carb, and fat targets stay unchanged — review macro allocation
                manually if needed.
              </p>
              {review.suggestedReviewOn && (
                <p className="text-xs text-muted-foreground">
                  A review date of {format(parseISO(review.suggestedReviewOn), 'MMM d')} will be
                  set on the decision.
                </p>
              )}
              {review.guardrails.length > 0 && (
                <p className="text-xs text-muted-foreground">
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
                  className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
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
    </div>
  )
}
