// ============================================================
// ShredOS — Tracking-Aware Progress Overview (Phase 2X)
// Builds the /progress page's unified exercise overview: one
// normalized row per exercise across all four tracking modes, with
// the latest representative-session summary and a tracking status
// derived from the EXISTING latest-vs-previous comparison logic.
//
// Deliberately reuses, never re-derives:
//   - representative-set selection: pickRepresentativeCardioSet +
//     setScore (workout.ts) — the same two primitives server.ts's
//     private pickRepresentativeSet composes; the tiny composition is
//     mirrored here (like strength-records.ts mirrors its own small
//     compositions) rather than importing server.ts, which would drag
//     next/headers into this pure module.
//   - status: progressSignal (weight_reps/bodyweight) and
//     trackingAwareProgressSignal (cardio/timed) — the existing Phase
//     2U comparisons with their existing ±1% thresholds. No new
//     classifier, and never Phase 2W's first-to-latest chart summary.
//   - display: formatTrackingAwareSetSummary / displayWeight /
//     epley1RM — no duplicated formatting.
//
// Everything except fetchTrackingAwareProgressOverview is a pure
// function of its inputs (no queries, no Date.now(), no mutation),
// so scripts/verify-phase2x.ts can exercise it deterministically.
// ============================================================

import {
  setScore,
  epley1RM,
  displayWeight,
  progressSignal,
  trackingAwareProgressSignal,
  pickRepresentativeCardioSet,
  pickRepresentativeHold,
  compareWeightTimeSets,
  weightTimeComparisonDetail,
  formatTrackingAwareSetSummary,
} from '@/lib/workout'
import type { WorkoutSet, TrackingMode, ExerciseEquipment, PrimaryMuscle } from '@/types/database'
// W9/W10.5: weight_time rows use the representativeHold and the
// two-dimensional comparison from workout.ts (pickRepresentativeHold,
// compareWeightTimeSets) — never setScore, never the duration-only signal.

// ── Types ────────────────────────────────────────────────────────────

/**
 * 'mixed' (W10.5-A ruling 3) is the weight_time-only status for an
 * incomparable latest-vs-previous pair (heavier-but-shorter or
 * lighter-but-longer). It is a NON-RANKING category: it sorts in the same
 * band as 'same', is never counted as improving or declining, carries a
 * neutral badge, and the row's statusDetail names the actual dimensional
 * change. It is never mapped to improved / declined / same.
 */
export type OverviewStatus = 'improved' | 'same' | 'declined' | 'mixed' | 'needs_data'

/** Normalized overview row — the page never sees raw joined shapes. */
export interface ExerciseProgressOverviewRow {
  exerciseId: string
  exerciseName: string
  trackingMode: TrackingMode
  primaryMuscle: PrimaryMuscle | null
  equipment: ExerciseEquipment | null
  isUnilateral: boolean
  /** ISO date of the most recent qualifying completed session. */
  latestWorkoutDate: string
  /** Capped at RECENT_SESSION_COUNT_CAP — a "recent" count, not all-time. */
  recentSessionCount: number
  /** Tracking-aware summary of the latest representative set. */
  latestSummary: string
  /** Optional secondary context (est. 1RM for weight_reps). */
  secondarySummary: string | null
  status: OverviewStatus
  /**
   * For status 'mixed' only: the dimensional change in words ("heavier,
   * shorter than the previous session"). The builder always sets it (null
   * for every other status); optional in the type so historical fixtures
   * that predate W10.5 still satisfy the row shape.
   */
  statusDetail?: string | null
}

/** Matches the Phase 2V detail-page header's own recent-session cap. */
export const RECENT_SESSION_COUNT_CAP = 5

/** Raw shapes for the pure builder — mirrors the embedded query rows. */
export interface RawOverviewSet {
  set_number: number | null
  reps: number | null
  weight_kg: number | null
  rpe: number | null
  is_warmup: boolean
  completed: boolean
  duration_seconds: number | null
  distance_meters: number | null
}

interface RawOverviewExerciseMeta {
  id: string
  name: string
  primary_muscle: PrimaryMuscle | null
  equipment: ExerciseEquipment | null
  tracking_mode: TrackingMode
  unilateral: boolean
}

export interface RawOverviewSession {
  workout_date: string
  workout_exercises: Array<{
    exercise_id: string
    exercise: RawOverviewExerciseMeta | RawOverviewExerciseMeta[] | null
    workout_sets: RawOverviewSet[]
  }>
}

// ── Filter parsing ───────────────────────────────────────────────────

const VALID_MODE_FILTERS: readonly TrackingMode[] = [
  'weight_reps',
  'bodyweight',
  'cardio',
  'timed',
  // W4: the parser admits the fifth mode now; its /progress pill ships in
  // W10 (src/lib/constants.ts). A parser without a pill is an unreachable
  // URL that correctly shows an empty mode; a pill without a parser would
  // silently filter to "All" — so this side lands first on purpose.
  'weight_time',
]

/**
 * Parses a ?mode= query value. Anything that isn't exactly one of the
 * tracking modes (missing, arrays beyond the first value, arbitrary
 * strings) gracefully falls back to null — meaning "All".
 */
export function parseTrackingModeFilter(
  value: string | string[] | undefined
): TrackingMode | null {
  const candidate = Array.isArray(value) ? value[0] : value
  return VALID_MODE_FILTERS.includes(candidate as TrackingMode)
    ? (candidate as TrackingMode)
    : null
}

export function filterOverviewRows(
  rows: ExerciseProgressOverviewRow[],
  mode: TrackingMode | null
): ExerciseProgressOverviewRow[] {
  if (mode === null) return rows
  return rows.filter((r) => r.trackingMode === mode)
}

// ── Sorting ──────────────────────────────────────────────────────────

const STATUS_SORT_ORDER: Record<OverviewStatus, number> = {
  improved: 0,
  same: 1,
  // 'mixed' shares the non-directional band with 'same' on purpose: a
  // two-dimensional trade-off ranks neither above nor below "no change",
  // so the two interleave by recency instead of one preceding the other.
  mixed: 1,
  declined: 2,
  needs_data: 3,
}

/**
 * Improving → Steady/Mixed (one band) → Declining → More data needed;
 * within a status band, most recent completed session first, then
 * exercise name alphabetically as the deterministic fallback. Never sorts
 * by absolute performance. Pure — returns a new array.
 */
export function sortOverviewRows(
  rows: ExerciseProgressOverviewRow[]
): ExerciseProgressOverviewRow[] {
  return rows.slice().sort((a, b) => {
    const byStatus = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status]
    if (byStatus !== 0) return byStatus
    if (a.latestWorkoutDate !== b.latestWorkoutDate) {
      return a.latestWorkoutDate < b.latestWorkoutDate ? 1 : -1
    }
    return a.exerciseName.localeCompare(b.exerciseName)
  })
}

// ── Pure builder internals ───────────────────────────────────────────

/**
 * Same qualifying-set rule fetchPreviousBests / fetchExerciseHistory
 * already apply: completed, non-warm-up, and carrying at least one
 * meaningful value (weight, reps, or duration).
 */
function isQualifyingOverviewSet(s: RawOverviewSet): boolean {
  return (
    s.completed &&
    !s.is_warmup &&
    ((s.weight_kg !== null && s.weight_kg > 0) ||
      (s.reps !== null && s.reps > 0) ||
      (s.duration_seconds !== null && s.duration_seconds > 0))
  )
}

/**
 * Minimal synthetic WorkoutSet adapter — the same convention
 * fetchPreviousBests and the detail page already use to feed raw
 * historical rows into workout.ts helpers.
 */
function toWorkoutSet(raw: RawOverviewSet, workoutDate: string): WorkoutSet {
  return {
    id: '',
    workout_exercise_id: '',
    set_number: raw.set_number ?? 0,
    weight_kg: raw.weight_kg,
    reps: raw.reps,
    rpe: raw.rpe ?? null,
    completed: true,
    is_warmup: false,
    notes: null,
    duration_seconds: raw.duration_seconds ?? null,
    distance_meters: raw.distance_meters ?? null,
    created_at: workoutDate,
  }
}

/**
 * One representative set among a single session's qualifying sets —
 * the identical composition server.ts's private pickRepresentativeSet
 * uses: cardio/timed delegate to pickRepresentativeCardioSet, the
 * strength modes reduce by setScore. Both algorithms live only in
 * workout.ts.
 */
function pickRepresentativeSet(sets: WorkoutSet[], trackingMode: TrackingMode): WorkoutSet {
  switch (trackingMode) {
    case 'weight_time':
      // W9/W10.5: the representativeHold (longest; tie → heavier), never setScore.
      return pickRepresentativeHold(sets) ?? sets[0]
    case 'cardio':
    case 'timed':
      return pickRepresentativeCardioSet(sets, trackingMode) ?? sets[0]
    case 'weight_reps':
    case 'bodyweight':
      return sets.reduce((best, s) => (setScore(s) > setScore(best) ? s : best), sets[0])
  }
}

/**
 * Status from the EXISTING latest-vs-previous comparison. A lone
 * session can't be judged → needs_data. The comparisons' rare 'new'
 * result (a previous session whose score can't form a baseline) also
 * maps to needs_data — there is still nothing meaningful to compare
 * against, and inventing a judgment would be a new classifier.
 */
function statusFor(
  latest: WorkoutSet,
  previous: WorkoutSet | null,
  trackingMode: TrackingMode
): { status: OverviewStatus; statusDetail: string | null } {
  if (!previous) return { status: 'needs_data', statusDetail: null }
  // W10.5-A ruling 3: weight_time is compared in two dimensions. Dominance
  // → improved/declined, an exact repeat → same, an incomparable pair →
  // 'mixed' with the dimensional change spelled out. Never Up/Down/Steady
  // for a trade-off, and never a scalar.
  if (trackingMode === 'weight_time') {
    const comparison = compareWeightTimeSets(latest, previous)
    if (comparison === 'improved' || comparison === 'declined' || comparison === 'same') return { status: comparison, statusDetail: null }
    if (comparison === 'heavier_shorter' || comparison === 'lighter_longer') return { status: 'mixed', statusDetail: weightTimeComparisonDetail(comparison) }
    return { status: 'needs_data', statusDetail: null }
  }
  const signal = signalFor(latest, previous, trackingMode)
  if (signal === 'improved' || signal === 'declined' || signal === 'same') return { status: signal, statusDetail: null }
  return { status: 'needs_data', statusDetail: null }
}

/**
 * The per-mode latest-vs-previous comparison for the FOUR legacy modes:
 * cardio/timed go through trackingAwareProgressSignal (pace/duration),
 * the strength modes use progressSignal. weight_time never reaches this
 * function — statusFor routes it to compareWeightTimeSets first, and
 * trackingAwareProgressSignal refuses weight_time (fail-closed).
 */
function signalFor(latest: WorkoutSet, previous: WorkoutSet, trackingMode: TrackingMode) {
  switch (trackingMode) {
    case 'weight_time':
      throw new Error('weight_time is compared by compareWeightTimeSets in statusFor, never by a ProgressSignal')
    case 'cardio':
    case 'timed':
      return trackingAwareProgressSignal(latest, previous, trackingMode)
    case 'weight_reps':
    case 'bodyweight':
      return progressSignal(latest, previous)
  }
}

/**
 * Latest-set display strings. Bodyweight added weight is nulled out
 * BEFORE formatting when it would display-round to 0 lbs, so "+0 lbs"
 * can never appear (the formatter itself is reused unchanged).
 * weight_reps gains est. 1RM as secondary context when the existing
 * epley1RM validity rules produce one.
 */
function summarizeLatestSet(
  latest: WorkoutSet,
  trackingMode: TrackingMode
): { latestSummary: string; secondarySummary: string | null } {
  const bodyweightAddedKg =
    latest.weight_kg !== null && latest.weight_kg > 0 && (displayWeight(latest.weight_kg) ?? 0) > 0
      ? latest.weight_kg
      : null

  const latestSummary = formatTrackingAwareSetSummary(
    {
      reps: latest.reps,
      weightKg: weightKgForSummary(trackingMode, latest.weight_kg, bodyweightAddedKg),
      rpe: latest.rpe,
      durationSeconds: latest.duration_seconds,
      distanceMeters: latest.distance_meters,
    },
    trackingMode
  )

  let secondarySummary: string | null = null
  // tracking-mode-census: exempt — est. 1RM is a weight_reps-only secondary; weight_time never enters epley1RM (D4)
  if (
    trackingMode === 'weight_reps' &&
    latest.weight_kg !== null &&
    latest.weight_kg > 0 &&
    latest.reps !== null
  ) {
    const rm = epley1RM(latest.weight_kg, latest.reps)
    if (rm !== null) secondarySummary = `est. 1RM ${displayWeight(rm)} lbs`
  }

  return { latestSummary, secondarySummary }
}

/**
 * Which weight the summary formatter sees. bodyweight nulls out an
 * added weight that would display-round to 0 (so "+0 lbs" never
 * appears); weight_time passes its stored value through UNCHANGED — a
 * stored 0 is a real value and must render as "0 lb added" (O5); the
 * other modes pass the stored value through as before.
 */
function weightKgForSummary(
  trackingMode: TrackingMode,
  storedWeightKg: number | null,
  bodyweightAddedKg: number | null
): number | null {
  switch (trackingMode) {
    case 'bodyweight':
      return bodyweightAddedKg
    case 'weight_time':
    case 'weight_reps':
    case 'cardio':
    case 'timed':
      return storedWeightKg
  }
}

// ── Pure builder ─────────────────────────────────────────────────────

/**
 * Reduces newest-first completed sessions into one normalized row per
 * exercise. Duplicate workout_exercises blocks for the same exercise
 * within one session are merged before picking that session's
 * representative set (same convention as fetchExerciseHistory), so a
 * session can never yield two "sessions" for one exercise, and an
 * exercise can never appear twice in the result.
 */
export function buildExerciseProgressOverview(
  sessionsNewestFirst: RawOverviewSession[]
): ExerciseProgressOverviewRow[] {
  interface ExerciseState {
    meta: RawOverviewExerciseMeta
    latestWorkoutDate: string
    sessionCount: number
    latestRepresentative: WorkoutSet
    previousRepresentative: WorkoutSet | null
  }
  const stateByExercise: Record<string, ExerciseState> = {}
  const orderSeen: string[] = []

  for (const session of sessionsNewestFirst) {
    // Merge same-exercise blocks within this one session first.
    const setsByExercise: Record<string, WorkoutSet[]> = {}
    const metaByExercise: Record<string, RawOverviewExerciseMeta> = {}

    for (const we of session.workout_exercises ?? []) {
      const ex = Array.isArray(we.exercise) ? we.exercise[0] : we.exercise
      if (!ex) continue

      const qualifying = (we.workout_sets ?? [])
        .filter(isQualifyingOverviewSet)
        .map((s) => toWorkoutSet(s, session.workout_date))
      if (qualifying.length === 0) continue

      metaByExercise[we.exercise_id] = ex
      if (!setsByExercise[we.exercise_id]) setsByExercise[we.exercise_id] = []
      setsByExercise[we.exercise_id].push(...qualifying)
    }

    for (const [exerciseId, sets] of Object.entries(setsByExercise)) {
      const meta = metaByExercise[exerciseId]
      const representative = pickRepresentativeSet(sets, meta.tracking_mode)

      const existing = stateByExercise[exerciseId]
      if (!existing) {
        stateByExercise[exerciseId] = {
          meta,
          latestWorkoutDate: session.workout_date,
          sessionCount: 1,
          latestRepresentative: representative,
          previousRepresentative: null,
        }
        orderSeen.push(exerciseId)
      } else {
        existing.sessionCount += 1
        if (existing.previousRepresentative === null) {
          // Sessions arrive newest-first: the second one seen is the
          // "immediately previous qualifying session" the comparison needs.
          existing.previousRepresentative = representative
        }
      }
    }
  }

  return orderSeen.map((exerciseId) => {
    const state = stateByExercise[exerciseId]
    const { latestSummary, secondarySummary } = summarizeLatestSet(
      state.latestRepresentative,
      state.meta.tracking_mode
    )
    const { status, statusDetail } = statusFor(
      state.latestRepresentative,
      state.previousRepresentative,
      state.meta.tracking_mode
    )
    return {
      exerciseId,
      exerciseName: state.meta.name,
      trackingMode: state.meta.tracking_mode,
      primaryMuscle: state.meta.primary_muscle ?? null,
      equipment: state.meta.equipment ?? null,
      isUnilateral: !!state.meta.unilateral,
      latestWorkoutDate: state.latestWorkoutDate,
      recentSessionCount: Math.min(state.sessionCount, RECENT_SESSION_COUNT_CAP),
      latestSummary,
      secondarySummary,
      status,
      statusDetail,
    }
  })
}

// ── Server fetch helper ──────────────────────────────────────────────

/**
 * One batched query + the pure reducer above — never one query per
 * exercise. Scans ALL completed sessions (no session-count bound),
 * which is the exact bound the /progress page's existing all-time
 * reads (fetchStrengthRecords, fetchCardioTimedRecords) already use;
 * "exercises tracked" must include an exercise whose last session
 * predates any recent window. Newest-first ordering is what the
 * latest-vs-previous reducer expects. Uses the caller's authenticated
 * client, so RLS ownership applies unchanged.
 */
export async function fetchTrackingAwareProgressOverview(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<ExerciseProgressOverviewRow[]> {
  const { data: sessions, error } = await supabase
    .from('workout_sessions')
    .select(`
      id, workout_date,
      workout_exercises (
        exercise_id,
        exercise:exercises ( id, name, primary_muscle, equipment, tracking_mode, unilateral ),
        workout_sets ( set_number, reps, weight_kg, rpe, is_warmup, completed, duration_seconds, distance_meters )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('workout_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) console.error('fetchTrackingAwareProgressOverview error:', error)

  return sortOverviewRows(buildExerciseProgressOverview(sessions ?? []))
}
