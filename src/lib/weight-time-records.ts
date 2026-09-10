// ============================================================
// ShredOS — weight_time RECORDS: the dedicated two-dimensional model (W8)
//
// A weighted hold has two independent dimensions — added weight and
// duration — and NO scalar combines them (Decision 4, EXLIB-1C0B4). This
// module is the ONLY place that reasons about weight_time performance:
//   * qualifying performances (completed, non-warmup, weight >= 0 with 0 a
//     legal intentional baseline, duration > 0; RPE is metadata only; reps
//     and distance do not participate);
//   * Pareto dominance and the CURRENT frontier (the complete set of
//     non-dominated qualifying performances — never collapsed to a number);
//   * longest hold (with its added weight) and heaviest hold (with its
//     duration), each with a deterministic tie-break;
//   * Weight-time PR events reconstructed CHRONOLOGICALLY from real workout
//     history: a performance is a PR iff no strictly earlier qualifying
//     performance dominates it and it is not an exact repeat of one. Later
//     performances may push an older point off the CURRENT frontier; they
//     never erase the historical fact that it was a PR when achieved.
//
// Deliberately NOT built on strength-records.ts, epley1RM, setScore or
// bestSet: those are strength/1RM scalars and weight_time must never enter
// them (strength-records.ts's allowlist excludes it by construction).
// Deliberately no weight × duration score, no RPE-adjusted score, no 1RM
// transformation, no scalar trend.
//
// Records DERIVE from the current authoritative workout_sets values on
// every read — there is no second mutable record ledger — so editing a
// completed set's legal values or its warm-up flag recomputes records,
// frontier and PR events on the next read.
//
// Chronological order for reconstruction (deterministic, never the
// database's incidental row order): workout_sessions.workout_date, then
// workout_sessions.created_at (same-date sessions), then the session id,
// then workout_exercises.order_index, then workout_sets.set_number, then
// the set id as the final stable tie-break.
//
// Everything above the "Server fetch helpers" line is a pure function of
// its inputs so scripts/verify-weight-time-records.ts can exercise every
// rule deterministically. Lives in its own module (plan §8.7): the Phase
// 2V cardio/timed readers keep server.ts strength/cardio-only.
// ============================================================

import type { ProgressSignal } from '@/types/app'

// ── Types ────────────────────────────────────────────────────────────

/** The two dimensions. Nothing else ever enters a comparison. */
export interface WeightTimePoint {
  weightKg: number
  durationSeconds: number
}

/** One qualifying performance, with the identity needed for deterministic ordering. */
export interface WeightTimePerformance extends WeightTimePoint {
  setId: string
  exerciseId: string
  sessionId: string
  /** 'YYYY-MM-DD' */
  workoutDate: string
  /** ISO timestamp of the session row — the same-date tie-break. */
  sessionCreatedAt: string
  /** workout_exercises.order_index */
  orderIndex: number
  setNumber: number
  /** Metadata only. No rule in this module reads it. */
  rpe: number | null
}

/** The raw workout_sets columns the qualifying rule needs. */
export interface WeightTimeRawSet {
  id: string
  set_number: number
  weight_kg: number | null
  duration_seconds: number | null
  rpe: number | null
  is_warmup: boolean
  completed: boolean
}

export interface WeightTimePREvent {
  setId: string
  exerciseId: string
  exerciseName: string
  isUnilateral: boolean
  workoutDate: string
  weightKg: number
  durationSeconds: number
}

export interface WeightTimeRecordSummary {
  /** Maximum duration; ties → highest added weight; ties → earliest achieved. */
  longestHold: WeightTimePerformance | null
  /** Maximum added weight; ties → longest duration; ties → earliest achieved. */
  heaviestHold: WeightTimePerformance | null
  /**
   * The CURRENT Pareto frontier: every non-dominated qualifying performance,
   * one display point per distinct (weight, duration) pair (the earliest
   * achieved represents a repeated pair), sorted for presentation by
   * added weight ascending, then duration descending, then chronology.
   */
  frontier: WeightTimePerformance[]
  /** Historical Weight-time PR events, most recent first. */
  prEvents: WeightTimePerformance[]
  qualifyingCount: number
}

/** A row of an exercise's weight_time history: qualifying AND warm-up sets, for display only. */
export interface WeightTimeHistoryEntry {
  setId: string
  workoutDate: string
  weightKg: number
  durationSeconds: number
  rpe: number | null
  isWarmup: boolean
}

export interface WeightTimeExerciseRecord {
  exerciseId: string
  exerciseName: string
  isUnilateral: boolean
  summary: WeightTimeRecordSummary
}

export interface WeightTimeExerciseDetail extends WeightTimeExerciseRecord {
  /** Most recent first. Warm-ups included and flagged; they are excluded from `summary`. */
  history: WeightTimeHistoryEntry[]
  /** The most recent qualifying performance and the most recent one from an EARLIER session. */
  latestQualifying: WeightTimePerformance | null
  previousSessionQualifying: WeightTimePerformance | null
}

// ── Qualifying rule ──────────────────────────────────────────────────

/**
 * A set participates in weight_time records iff it is completed, not a
 * warm-up, carries a non-null weight >= 0 (0 is a legal intentional
 * baseline; null is not zero) and a duration > 0. The caller guarantees
 * the exercise's tracking_mode is weight_time.
 */
export function isQualifyingWeightTimeSet(set: Pick<WeightTimeRawSet, 'completed' | 'is_warmup' | 'weight_kg' | 'duration_seconds'>): boolean {
  return set.completed
    && !set.is_warmup
    && set.weight_kg !== null && set.weight_kg >= 0
    && set.duration_seconds !== null && set.duration_seconds > 0
}

// ── Deterministic chronology ─────────────────────────────────────────

const compareStrings = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

/** Real workout order: date, session created_at, session id, exercise order, set number, set id. */
export function compareChronologically(a: WeightTimePerformance, b: WeightTimePerformance): number {
  return compareStrings(a.workoutDate, b.workoutDate)
    || compareStrings(a.sessionCreatedAt, b.sessionCreatedAt)
    || compareStrings(a.sessionId, b.sessionId)
    || (a.orderIndex - b.orderIndex)
    || (a.setNumber - b.setNumber)
    || compareStrings(a.setId, b.setId)
}

// ── Pareto rules ─────────────────────────────────────────────────────

/** A dominates B iff A is at least as heavy AND at least as long, and strictly better in one dimension. */
export function dominates(a: WeightTimePoint, b: WeightTimePoint): boolean {
  return a.weightKg >= b.weightKg
    && a.durationSeconds >= b.durationSeconds
    && (a.weightKg > b.weightKg || a.durationSeconds > b.durationSeconds)
}

/** An exact weight/duration repeat. Repeats do not dominate one another and are never a new PR. */
export function isExactRepeat(a: WeightTimePoint, b: WeightTimePoint): boolean {
  return a.weightKg === b.weightKg && a.durationSeconds === b.durationSeconds
}

/** Presentation order for frontier points: weight ascending, duration descending, then chronology. */
function compareForFrontierDisplay(a: WeightTimePerformance, b: WeightTimePerformance): number {
  return (a.weightKg - b.weightKg)
    || (b.durationSeconds - a.durationSeconds)
    || compareChronologically(a, b)
}

/**
 * The complete current frontier: every qualifying performance that no other
 * qualifying performance dominates. Exact repeats collapse to one display
 * point — the earliest achieved — so the frontier never shows duplicate
 * points; the full history is preserved separately by the callers.
 */
export function computeCurrentFrontier(performances: WeightTimePerformance[]): WeightTimePerformance[] {
  const nonDominated = performances.filter((candidate) =>
    !performances.some((other) => other !== candidate && dominates(other, candidate)))
  const representatives = new Map<string, WeightTimePerformance>()
  for (const performance of [...nonDominated].sort(compareChronologically)) {
    const key = `${performance.weightKg}|${performance.durationSeconds}`
    if (!representatives.has(key)) representatives.set(key, performance)
  }
  return Array.from(representatives.values()).sort(compareForFrontierDisplay)
}

/** Maximum duration; ties broken by higher added weight, then by the earliest achieved. */
export function selectLongestHold(performances: WeightTimePerformance[]): WeightTimePerformance | null {
  return performances.reduce<WeightTimePerformance | null>((best, candidate) => {
    if (best === null) return candidate
    if (candidate.durationSeconds !== best.durationSeconds) return candidate.durationSeconds > best.durationSeconds ? candidate : best
    if (candidate.weightKg !== best.weightKg) return candidate.weightKg > best.weightKg ? candidate : best
    return compareChronologically(candidate, best) < 0 ? candidate : best
  }, null)
}

/** Maximum added weight; ties broken by longer duration, then by the earliest achieved. */
export function selectHeaviestHold(performances: WeightTimePerformance[]): WeightTimePerformance | null {
  return performances.reduce<WeightTimePerformance | null>((best, candidate) => {
    if (best === null) return candidate
    if (candidate.weightKg !== best.weightKg) return candidate.weightKg > best.weightKg ? candidate : best
    if (candidate.durationSeconds !== best.durationSeconds) return candidate.durationSeconds > best.durationSeconds ? candidate : best
    return compareChronologically(candidate, best) < 0 ? candidate : best
  }, null)
}

/**
 * Chronological PR reconstruction. Each performance is compared against
 * every STRICTLY EARLIER qualifying performance: it is a Weight-time PR iff
 * none dominates it and it is not an exact repeat of one. The first-ever
 * qualifying performance therefore is a PR (nothing earlier dominates it),
 * an exact repeat never is, a dominated performance never is, and a later
 * dominating performance never removes an earlier event. Returned most
 * recent first.
 */
export function reconstructWeightTimePREvents(performances: WeightTimePerformance[]): WeightTimePerformance[] {
  const chronological = [...performances].sort(compareChronologically)
  const events: WeightTimePerformance[] = []
  for (let index = 0; index < chronological.length; index += 1) {
    const candidate = chronological[index]
    const earlier = chronological.slice(0, index)
    const blocked = earlier.some((prior) => dominates(prior, candidate) || isExactRepeat(prior, candidate))
    if (!blocked) events.push(candidate)
  }
  return events.reverse()
}

/**
 * Active-workout badge evaluation: which of THIS session's qualifying sets
 * are Weight-time PRs against the prior history (every qualifying
 * performance from earlier completed sessions) plus this session's own
 * earlier sets, in set order. Same rule as the reconstruction above.
 */
export function evaluateWeightTimeSetPRs(currentSessionSets: WeightTimePerformance[], priorPoints: WeightTimePoint[]): Record<string, boolean> {
  const pool: WeightTimePoint[] = [...priorPoints]
  const result: Record<string, boolean> = {}
  for (const set of [...currentSessionSets].sort(compareChronologically)) {
    const blocked = pool.some((prior) => dominates(prior, set) || isExactRepeat(prior, set))
    result[set.setId] = !blocked
    pool.push({ weightKg: set.weightKg, durationSeconds: set.durationSeconds })
  }
  return result
}

/**
 * Two-dimensional latest-vs-previous status, the weight_time parallel to
 * progressSignal/trackingAwareProgressSignal WITHOUT a scalar: improved iff
 * the latest dominates the previous; declined iff the previous dominates
 * the latest; exact repeats AND incomparable pairs (heavier-but-shorter,
 * lighter-but-longer) are 'same' — neither direction may honestly be
 * claimed for an incomparable pair (Decision 4).
 */
export function weightTimeProgressSignal(latest: WeightTimePoint | null, previous: WeightTimePoint | null): ProgressSignal {
  if (!previous) return 'new'
  if (!latest) return 'same'
  if (dominates(latest, previous)) return 'improved'
  if (dominates(previous, latest)) return 'declined'
  return 'same'
}

/** The whole record model for one exercise's qualifying performances. */
export function summarizeWeightTimePerformances(performances: WeightTimePerformance[]): WeightTimeRecordSummary {
  return {
    longestHold: selectLongestHold(performances),
    heaviestHold: selectHeaviestHold(performances),
    frontier: computeCurrentFrontier(performances),
    prEvents: reconstructWeightTimePREvents(performances),
    qualifyingCount: performances.length,
  }
}

// ── Raw-row adapters (shared by the fetchers and the verifier) ───────

export interface WeightTimeRawSession {
  id: string
  workout_date: string
  created_at: string
  workout_exercises: Array<{
    id: string
    exercise_id: string
    order_index: number
    exercise: { id: string; name: string; tracking_mode: string; unilateral: boolean }
      | { id: string; name: string; tracking_mode: string; unilateral: boolean }[]
      | null
    workout_sets: WeightTimeRawSet[]
  }>
}

interface CollectedExercise {
  exerciseId: string
  exerciseName: string
  isUnilateral: boolean
  performances: WeightTimePerformance[]
  history: WeightTimeHistoryEntry[]
}

/** Collects weight_time performances (and display history) per exercise from raw completed-session rows. */
export function collectWeightTimePerformances(sessions: WeightTimeRawSession[]): Map<string, CollectedExercise> {
  const byExercise = new Map<string, CollectedExercise>()
  for (const session of sessions) {
    for (const block of session.workout_exercises ?? []) {
      const exercise = Array.isArray(block.exercise) ? block.exercise[0] : block.exercise
      if (!exercise || exercise.tracking_mode !== 'weight_time') continue
      let collected = byExercise.get(block.exercise_id)
      if (!collected) {
        collected = { exerciseId: block.exercise_id, exerciseName: exercise.name, isUnilateral: !!exercise.unilateral, performances: [], history: [] }
        byExercise.set(block.exercise_id, collected)
      }
      for (const set of block.workout_sets ?? []) {
        // History shows every completed set with both dimensions, warm-ups flagged.
        if (set.completed && set.weight_kg !== null && set.duration_seconds !== null && set.duration_seconds > 0) {
          collected.history.push({ setId: set.id, workoutDate: session.workout_date, weightKg: set.weight_kg, durationSeconds: set.duration_seconds, rpe: set.rpe, isWarmup: set.is_warmup })
        }
        if (!isQualifyingWeightTimeSet(set)) continue
        collected.performances.push({
          setId: set.id,
          exerciseId: block.exercise_id,
          sessionId: session.id,
          workoutDate: session.workout_date,
          sessionCreatedAt: session.created_at,
          orderIndex: block.order_index ?? 0,
          setNumber: set.set_number,
          weightKg: set.weight_kg as number,
          durationSeconds: set.duration_seconds as number,
          rpe: set.rpe,
        })
      }
    }
  }
  return byExercise
}

const SESSION_SELECT = `
  id, workout_date, created_at,
  workout_exercises (
    id, exercise_id, order_index,
    exercise:exercises ( id, name, tracking_mode, unilateral ),
    workout_sets ( id, set_number, weight_kg, duration_seconds, rpe, is_warmup, completed )
  )
`

const RECENT_PR_DISPLAY_CAP = 10

// ── Server fetch helpers ─────────────────────────────────────────────

/**
 * All-time weight_time records for EVERY weight_time exercise, one query,
 * completed sessions only (the same bound strength-records.ts and the
 * Phase 2V cardio/timed readers use). Uses the caller's authenticated
 * client, so RLS ownership applies unchanged.
 */
export async function fetchWeightTimeRecords(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<{ records: WeightTimeExerciseRecord[]; recentPREvents: WeightTimePREvent[] }> {
  const { data: sessions, error } = await supabase
    .from('workout_sessions')
    .select(SESSION_SELECT)
    .eq('user_id', userId)
    .eq('status', 'completed')
  if (error) console.error('fetchWeightTimeRecords error:', error)

  const collected = collectWeightTimePerformances((sessions ?? []) as WeightTimeRawSession[])
  const records: WeightTimeExerciseRecord[] = []
  const events: WeightTimePREvent[] = []
  for (const exercise of Array.from(collected.values())) {
    if (exercise.performances.length === 0) continue
    const summary = summarizeWeightTimePerformances(exercise.performances)
    records.push({ exerciseId: exercise.exerciseId, exerciseName: exercise.exerciseName, isUnilateral: exercise.isUnilateral, summary })
    for (const event of summary.prEvents) {
      events.push({ setId: event.setId, exerciseId: exercise.exerciseId, exerciseName: exercise.exerciseName, isUnilateral: exercise.isUnilateral, workoutDate: event.workoutDate, weightKg: event.weightKg, durationSeconds: event.durationSeconds })
    }
  }
  records.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName))
  const eventOrder = new Map(events.map((event) => [event.setId, event]))
  const recentPREvents = Array.from(eventOrder.values())
    .sort((a, b) => compareStrings(b.workoutDate, a.workoutDate) || a.exerciseName.localeCompare(b.exerciseName))
    .slice(0, RECENT_PR_DISPLAY_CAP)
  return { records, recentPREvents }
}

/**
 * All-time weight_time detail for ONE exercise (workout_exercises!inner
 * embedded filter, the same pattern the strength and cardio/timed detail
 * readers use). Returns null when the exercise has no completed history.
 */
export async function fetchWeightTimeExerciseDetail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  exerciseId: string,
): Promise<WeightTimeExerciseDetail | null> {
  const { data: sessions, error } = await supabase
    .from('workout_sessions')
    .select(SESSION_SELECT.replace('workout_exercises (', 'workout_exercises!inner ('))
    .eq('user_id', userId)
    .eq('status', 'completed')
    .eq('workout_exercises.exercise_id', exerciseId)
  if (error) console.error('fetchWeightTimeExerciseDetail error:', error)

  const collected = collectWeightTimePerformances((sessions ?? []) as WeightTimeRawSession[]).get(exerciseId)
  if (!collected) return null
  const summary = summarizeWeightTimePerformances(collected.performances)
  const chronological = [...collected.performances].sort(compareChronologically)
  const latestQualifying = chronological.length > 0 ? chronological[chronological.length - 1] : null
  const previousSessionQualifying = latestQualifying
    ? [...chronological].reverse().find((performance) => performance.sessionId !== latestQualifying.sessionId) ?? null
    : null
  const history = [...collected.history].sort((a, b) => compareStrings(b.workoutDate, a.workoutDate) || compareStrings(b.setId, a.setId))
  return { exerciseId: collected.exerciseId, exerciseName: collected.exerciseName, isUnilateral: collected.isUnilateral, summary, history, latestQualifying, previousSessionQualifying }
}

/**
 * Prior qualifying points per weight_time exercise for the ACTIVE
 * workout's PR badges — every completed session except the current one,
 * no session or date bound (a PR claim must be all-time-correct, the same
 * reasoning fetchExercisePRBaseline gives for strength). Exercises that
 * are not weight_time get no entry.
 */
export async function fetchWeightTimePRBaselines(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  exerciseIds: string[],
  currentSessionId: string,
): Promise<Record<string, WeightTimePoint[]>> {
  if (exerciseIds.length === 0) return {}
  const { data: sessions, error } = await supabase
    .from('workout_sessions')
    .select(SESSION_SELECT)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .neq('id', currentSessionId)
  if (error) console.error('fetchWeightTimePRBaselines error:', error)

  const collected = collectWeightTimePerformances((sessions ?? []) as WeightTimeRawSession[])
  const result: Record<string, WeightTimePoint[]> = {}
  for (const exerciseId of exerciseIds) {
    const exercise = collected.get(exerciseId)
    if (!exercise) continue
    result[exerciseId] = exercise.performances.map((performance) => ({ weightKg: performance.weightKg, durationSeconds: performance.durationSeconds }))
  }
  return result
}
