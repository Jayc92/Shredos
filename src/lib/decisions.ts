// ============================================================
// ShredOS — Decision Follow-Through Domain (Phase 3D)
// Pure helpers for the manual decision-feedback loop: recommendation
// lifecycle transitions, follow-through, review timing, and manual
// outcome recording.
//
// Product rules encoded here (not omissions):
//   - Every state change is an explicit user action. Nothing here
//     performs I/O; the API route calls validateDecisionUpdate and
//     the UI renders from the same exported value lists, so server
//     validation and client options can never drift apart.
//   - A recommendation, a user decision, an applied change,
//     follow-through, and an observed outcome are distinct concepts:
//     status carries the recommendation lifecycle (unchanged existing
//     enum), follow_through_status carries what the user actually
//     did, and outcome carries the user's OWN neutral read of the
//     result — never computed from weight/nutrition/training data,
//     and never phrased causally.
//   - Historical rows predating migration 012 normalize safely
//     (missing fields read as not_started / null).
//
// Everything is deterministic and exercised by
// scripts/verify-phase3d.ts.
// ============================================================

import { parseISO } from 'date-fns'
import type {
  DecisionLog,
  DecisionStatus,
  FollowThroughStatus,
  DecisionOutcome,
} from '@/types/database'

// ── Value lists (single source for API validation AND UI options) ───

export const DECISION_STATUS_VALUES: readonly DecisionStatus[] = [
  'suggested', 'accepted', 'dismissed', 'applied', 'reversed',
]

export const FOLLOW_THROUGH_VALUES: readonly FollowThroughStatus[] = [
  'not_started', 'completed', 'abandoned', 'not_applicable',
]

export const DECISION_OUTCOME_VALUES: readonly DecisionOutcome[] = [
  'positive', 'neutral', 'negative', 'mixed', 'unclear', 'needs_more_time',
]

export const OUTCOME_NOTES_MAX_LENGTH = 500

/** Neutral labels only — no success/failure or causal framing. */
export const FOLLOW_THROUGH_LABELS: Record<FollowThroughStatus, string> = {
  not_started: 'Not started',
  completed: 'Completed',
  abandoned: 'Abandoned',
  not_applicable: 'Not applicable',
}

export const OUTCOME_LABELS: Record<DecisionOutcome, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  mixed: 'Mixed',
  unclear: 'Unclear',
  needs_more_time: 'Needs more time',
}

// ── State model ──────────────────────────────────────────────────────

/**
 * The recommendation-lifecycle transition map. Deliberately small:
 * only a pending suggestion moves, and only by explicit user action.
 * applied/reversed are set at creation by their existing system paths
 * and never transition through this API; dismissed is terminal (no
 * silent resurrection — a future recommendation creates a new row).
 */
export const STATUS_TRANSITIONS: Record<DecisionStatus, readonly DecisionStatus[]> = {
  suggested: ['accepted', 'dismissed'],
  accepted: [],
  dismissed: [],
  applied: [],
  reversed: [],
}

/** Follow-through only applies once a decision is accepted or applied. */
export function isFollowThroughEligible(status: DecisionStatus): boolean {
  return status === 'accepted' || status === 'applied'
}

/** Outcome can be recorded once follow-through reached a terminal state. */
export function isOutcomeEligible(followThrough: FollowThroughStatus): boolean {
  return followThrough !== 'not_started'
}

// ── Legacy-row normalization ─────────────────────────────────────────

/**
 * Rows read before migration 012 is applied (or cached client copies)
 * may lack the new fields entirely. Reading through these keeps every
 * consumer safe: missing follow-through reads as not_started, missing
 * outcome/review fields read as null.
 */
export function followThroughOf(
  decision: Partial<Pick<DecisionLog, 'follow_through_status'>>
): FollowThroughStatus {
  return decision.follow_through_status ?? 'not_started'
}

export function outcomeOf(
  decision: Partial<Pick<DecisionLog, 'outcome'>>
): DecisionOutcome | null {
  return decision.outcome ?? null
}

// ── Review timing (date-only, local semantics) ───────────────────────

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Strict 'YYYY-MM-DD' — parsed via parseISO (local midnight, no UTC
 * drift) purely to reject impossible dates like 2026-13-99. */
export function isValidReviewDate(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) return false
  return !Number.isNaN(parseISO(value).getTime())
}

/**
 * UI saveability rule for the review-date control (Phase 3D QA fix).
 * A null persisted review_on is semantically distinct from whatever
 * the date input happens to DISPLAY — some browsers render today's
 * date for an empty or defaulted input — so any valid input value is
 * saveable until a real review_on has actually been persisted. Once
 * persisted, resubmitting the identical value is a no-op and the
 * control disables. Pure; shared by the card and the harness so the
 * two can never disagree.
 */
export function isReviewDateSaveable(
  persistedReviewOn: string | null,
  inputValue: string
): boolean {
  if (inputValue === '' || !isValidReviewDate(inputValue)) return false
  return persistedReviewOn === null || inputValue !== persistedReviewOn
}

/**
 * Due when a review date exists, has arrived (lexical date-string
 * comparison — the repo's established no-drift convention), and no
 * outcome has been recorded yet.
 */
export function isDueForReview(
  decision: Partial<Pick<DecisionLog, 'review_on' | 'reviewed_at'>>,
  todayStr: string
): boolean {
  const reviewOn = decision.review_on ?? null
  const reviewedAt = decision.reviewed_at ?? null
  return reviewOn !== null && reviewOn <= todayStr && reviewedAt === null
}

/** Accepted/applied decisions whose follow-through hasn't been recorded. */
export function needsFollowThrough(
  decision: Partial<Pick<DecisionLog, 'status' | 'follow_through_status'>> &
    Pick<DecisionLog, 'status'>
): boolean {
  return isFollowThroughEligible(decision.status) && followThroughOf(decision) === 'not_started'
}

// ── Notes normalization ──────────────────────────────────────────────

export type NotesResult =
  | { ok: true; value: string | null }
  | { ok: false; error: string }

/** Trims; blank normalizes to null; enforces the shared max length.
 * Plain text only — rendering never treats this as HTML. */
export function normalizeOutcomeNotes(input: unknown): NotesResult {
  if (input === null) return { ok: true, value: null }
  if (typeof input !== 'string') return { ok: false, error: 'Invalid outcome notes.' }
  const trimmed = input.trim()
  if (trimmed.length === 0) return { ok: true, value: null }
  if (trimmed.length > OUTCOME_NOTES_MAX_LENGTH) {
    return {
      ok: false,
      error: `Outcome notes must be ${OUTCOME_NOTES_MAX_LENGTH} characters or fewer.`,
    }
  }
  return { ok: true, value: trimmed }
}

// ── Server-side update validation ────────────────────────────────────

/** The subset of a decision the validator needs to judge a patch. */
export type DecisionUpdateCurrent = Pick<
  DecisionLog,
  'status' | 'follow_through_status' | 'outcome' | 'reviewed_at'
>

export type DecisionUpdateResult =
  | { ok: true; update: Record<string, unknown> }
  | { ok: false; error: string }

/**
 * Validates one user-submitted decision patch against the state model
 * and returns exactly the columns to persist. Pure and deterministic
 * (the caller supplies the timestamp). Unknown fields are IGNORED —
 * only the five recognized keys are ever read — so a client can never
 * smuggle arbitrary columns into the update. Same-value submissions
 * are idempotent no-ops ({ ok: true, update: {} } → the API returns
 * the unchanged row). Error strings are user-readable and never
 * contain database internals.
 */
export function validateDecisionUpdate(
  current: DecisionUpdateCurrent,
  patch: Record<string, unknown>,
  nowIso: string
): DecisionUpdateResult {
  const update: Record<string, unknown> = {}
  const currentFollowThrough = followThroughOf(current)

  const recognized =
    'status' in patch ||
    'follow_through_status' in patch ||
    'review_on' in patch ||
    'outcome' in patch ||
    'outcome_notes' in patch
  if (!recognized) {
    return { ok: false, error: 'No valid fields to update.' }
  }

  // ── Recommendation lifecycle ──
  let effectiveStatus = current.status
  if (patch.status !== undefined) {
    const next = patch.status
    if (typeof next !== 'string' || !DECISION_STATUS_VALUES.includes(next as DecisionStatus)) {
      return { ok: false, error: 'Invalid status.' }
    }
    if (next !== current.status) {
      if (!STATUS_TRANSITIONS[current.status].includes(next as DecisionStatus)) {
        return { ok: false, error: 'That status change is not allowed.' }
      }
      update.status = next
      effectiveStatus = next as DecisionStatus
      // Existing convention preserved: accepting stamps applied_at
      // (the moment the user acted on the suggestion).
      if (next === 'accepted' || next === 'applied') {
        update.applied_at = nowIso
      }
    }
  }

  // ── Follow-through lifecycle ──
  let effectiveFollowThrough = currentFollowThrough
  if (patch.follow_through_status !== undefined) {
    const next = patch.follow_through_status
    if (
      typeof next !== 'string' ||
      !FOLLOW_THROUGH_VALUES.includes(next as FollowThroughStatus)
    ) {
      return { ok: false, error: 'Invalid follow-through value.' }
    }
    if (next !== currentFollowThrough) {
      if (!isFollowThroughEligible(effectiveStatus)) {
        return {
          ok: false,
          error: 'Follow-through can be recorded once the decision is accepted or applied.',
        }
      }
      if (currentFollowThrough !== 'not_started') {
        return { ok: false, error: 'Follow-through has already been recorded.' }
      }
      if (next === 'not_started') {
        return { ok: false, error: 'That follow-through change is not allowed.' }
      }
      update.follow_through_status = next
      update.completed_at = nowIso
      effectiveFollowThrough = next as FollowThroughStatus
    }
  }

  // ── Review date ──
  if (patch.review_on !== undefined) {
    const next = patch.review_on
    if (next === null) {
      update.review_on = null
    } else if (typeof next !== 'string' || !isValidReviewDate(next)) {
      return { ok: false, error: 'Invalid review date.' }
    } else if (!isFollowThroughEligible(effectiveStatus)) {
      return {
        ok: false,
        error: 'A review date can be set once the decision is accepted or applied.',
      }
    } else {
      update.review_on = next
    }
  }

  // ── Outcome ──
  if (patch.outcome !== undefined) {
    const next = patch.outcome
    if (typeof next !== 'string' || !DECISION_OUTCOME_VALUES.includes(next as DecisionOutcome)) {
      return { ok: false, error: 'Invalid outcome.' }
    }
    if (!isOutcomeEligible(effectiveFollowThrough)) {
      return { ok: false, error: 'Record follow-through before recording an outcome.' }
    }
    // Re-recording is an explicit user correction: value and
    // reviewed_at both refresh.
    if (next !== current.outcome || current.reviewed_at === null) {
      update.outcome = next
      update.reviewed_at = nowIso
    }
  }

  if (patch.outcome_notes !== undefined) {
    const hasOutcome = patch.outcome !== undefined || current.outcome !== null
    if (!hasOutcome) {
      return { ok: false, error: 'Record an outcome before adding outcome notes.' }
    }
    const notes = normalizeOutcomeNotes(patch.outcome_notes)
    if (!notes.ok) return notes
    update.outcome_notes = notes.value
  }

  return { ok: true, update }
}
