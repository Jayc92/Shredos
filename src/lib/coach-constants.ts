// ============================================================
// ShredOS — Shared Coaching Constants (Phase 1K)
//
// Centralizes domain rules that were previously duplicated (with
// inconsistent names but identical values) across nutrition-coach.ts,
// weekly-review.ts, and coach-actions.ts.
//
// Only genuinely-identical rules live here. Constants that merely
// look similar but represent a different domain rule — different time
// window, different purpose — are intentionally kept local to their
// own file, with a comment explaining why. See:
//   - progress-summary.ts's PROTEIN_HIT_RATIO (factual 28-day count,
//     not a coaching threshold)
//   - progress-summary.ts's 28-day nutrition confidence thresholds
//     and weight-stable threshold (different window/shape)
//   - nutrition-coach.ts's NUTRITION_MIN_WEIGH_INS and
//     MIN_CALORIES_FLOOR (unique to its own calorie-suggestion gates)
// ============================================================

/**
 * Goals eligible for cutting-oriented coaching: weigh-in nudges,
 * calorie-reduction suggestions, and related "fat loss" framing.
 */
export const CUTTING_GOALS = ['fat_loss', 'recomposition'] as const

/** Fraction of daily protein target considered "meeting" the goal. */
export const PROTEIN_MEETING_THRESHOLD = 0.90

/** Fraction of daily protein target considered "close" (below this = low). */
export const PROTEIN_CLOSE_THRESHOLD = 0.80

/** Calories within this fraction of target count as "on-track". */
export const CALORIE_ON_TRACK_RANGE = 0.10

/**
 * Minimum number of logged days, within whatever window the caller is
 * evaluating (nutrition-coach's rolling 7-day window; weekly-review's
 * and coach-actions' current-ISO-week-so-far), needed for a "reliable"
 * read on food or step consistency.
 *
 * NOT used by progress-summary.ts — its 28-day confidence tiers (10 /
 * 20 days) are a different scale entirely, not this same rule restated.
 */
export const MIN_RELIABLE_LOGGED_DAYS = 4
