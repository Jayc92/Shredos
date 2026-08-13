// ============================================================
// ShredOS — Goal Adjustment Review API (Phase 3E)
// GET  → computes the current adjustment review server-side (the
//        client never runs eligibility logic against Supabase).
// POST → the explicit user-approved apply: the server RECOMPUTES the
//        review from fresh data, validates the client's expectations
//        against it (stale target/goal/proposal → safe 409), updates
//        the nutrition target through the existing versioned-upsert
//        path, then logs the Applied decision.
//
// Atomicity (Phase 3E review correction): the target-version upsert
// and the Applied decision insert happen inside ONE PostgreSQL
// function — apply_goal_calorie_adjustment (migration 013), SECURITY
// INVOKER, executed as the authenticated user under the existing RLS
// policies. Either both writes commit or both roll back: a target can
// never change without its Applied decision. The database ALSO
// revalidates ownership, the expected current target, and the round
// +/-100/200 step (see migration 013); this route still recomputes
// full domain eligibility from fresh bounded data first — neither
// layer trusts a client "eligible" flag.
//
// Nothing here runs automatically: GET performs zero writes, and
// POST only ever runs from the explicit "Apply new calorie target"
// confirmation. Raw database errors stay in server logs; responses
// carry only literal safe messages.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, fetchUserProfile, fetchCurrentNutritionTarget } from '@/lib/supabase/server'
import {
  fetchGoalAdjustmentReview,
  validateAdjustmentApply,
} from '@/lib/goal-adjustments'
import { todayISO } from '@/lib/dates'

async function loadContext(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const [profile, target] = await Promise.all([
    fetchUserProfile(supabase, userId),
    fetchCurrentNutritionTarget(supabase, userId),
  ])
  return { profile, target }
}

const profileContext = (profile: NonNullable<Awaited<ReturnType<typeof fetchUserProfile>>>) => ({
  activityLevel: profile.activity_level,
  fastingEnabled: profile.fasting_enabled,
  sex: profile.sex,
  age: profile.age,
  heightCm: profile.height_cm,
  currentWeightKg: profile.current_weight_kg,
})

/** GET /api/goal-adjustment — read-only review computation. */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile, target } = await loadContext(supabase, user.id)
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  }

  // Phase 5B.4: profile context feeds the activity/training/adaptive
  // evidence layers (absent sources degrade to unknown, never low).
  const review = await fetchGoalAdjustmentReview(
    supabase,
    user.id,
    todayISO(),
    profile.main_goal,
    profile.bf_pct,
    target,
    profileContext(profile)
  )

  return NextResponse.json({ data: review })
}

/** POST /api/goal-adjustment — explicit user-approved apply. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { expectedCurrentCalories?: unknown; proposedCalories?: unknown; expectedGoal?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { profile, target } = await loadContext(supabase, user.id)
  if (!profile || !target) {
    return NextResponse.json({ error: 'No active nutrition target.' }, { status: 409 })
  }

  // Server-side recomputation from FRESH data — the client's
  // eligibility claim is never trusted.
  const freshReview = await fetchGoalAdjustmentReview(
    supabase, user.id, todayISO(), profile.main_goal, profile.bf_pct, target,
    profileContext(profile)
  )

  const validation = validateAdjustmentApply(freshReview, {
    expectedCurrentCalories: Number(body.expectedCurrentCalories),
    proposedCalories: Number(body.proposedCalories),
    expectedGoal: String(body.expectedGoal ?? ''),
  })
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error, stale: validation.stale },
      { status: validation.stale ? 409 : 400 }
    )
  }

  const proposed = freshReview.proposedCalories as number
  const today = todayISO()
  const direction = (freshReview.adjustmentAmount ?? 0) < 0 ? 'decreased' : 'increased'

  // One atomic operation (migration 013): the target-version upsert
  // and the Applied decision insert commit or roll back TOGETHER.
  // Macros are read from the authoritative row inside the
  // transaction — never from this request. The function re-verifies
  // auth.uid(), ownership, the expected current calories, and the
  // round step, and a per-user advisory lock makes a concurrent
  // double-click fail the stale check instead of double-applying.
  const { data: applied, error: applyError } = await supabase.rpc(
    'apply_goal_calorie_adjustment',
    {
      p_effective_date: today,
      p_expected_calories: freshReview.currentCalories,
      p_proposed_calories: proposed,
      p_decision_title: `Calorie target ${direction} to ${proposed.toLocaleString()}`,
      p_decision_summary: `Calorie target changed from ${target.calories.toLocaleString()} to ${proposed.toLocaleString()} after the ${freshReview.window.label} review. Protein and fat targets unchanged.`,
      p_reason: freshReview.explanation,
      p_data_snapshot: {
        window: freshReview.window,
        weeklyChangePct: freshReview.weight.weeklyChangePct,
        weightBand: freshReview.weight.band,
        nutritionLoggedDays: freshReview.nutrition.loggedDays,
        evidenceStrength: freshReview.evidenceStrength,
        // Phase 5B.4 evidence (additive jsonb — old records unaffected):
        anchorCount: freshReview.weight.anchorCount,
        trendConfidence: freshReview.weight.trendConfidence,
        explicitCompleteDays: freshReview.nutrition.explicitCompleteDays,
        adherence: freshReview.nutrition.adherence,
        activityContext: freshReview.activityContext,
        trainingSignal: freshReview.trainingSignal,
        adaptiveStatus: freshReview.adaptiveEvidence.status,
      },
      p_review_on: freshReview.suggestedReviewOn,
    }
  )

  if (applyError) {
    // Classification only — the raw message never reaches the client.
    const detail = String(applyError.message ?? '')
    if (detail.includes('stale_target')) {
      return NextResponse.json(
        {
          error: 'The review is out of date — refresh the adjustment review and try again.',
          stale: true,
        },
        { status: 409 }
      )
    }
    if (detail.includes('invalid_adjustment')) {
      return NextResponse.json(
        { error: 'Adjustments are limited to 100 or 200 calories.' },
        { status: 400 }
      )
    }
    if (detail.includes('not_authenticated')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('POST /api/goal-adjustment apply error:', applyError)
    return NextResponse.json(
      { error: 'Unable to apply the adjustment. Nothing was changed.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data: { target: applied?.target ?? null, decision: applied?.decision ?? null },
  })
}
