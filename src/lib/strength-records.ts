// ============================================================
// ShredOS — Strength Records (Phase 2D, refactored Phase 2E)
// All-time strength-record aggregation for /progress and the new
// single-exercise /progress/exercises/[id] detail page. Deliberately
// separate from progress-summary.ts (which stays a 28-day general
// progress read) — this file is the all-time strength/PR read.
//
// Deliberately does NOT reuse fetchExercisePRBaseline/
// fetchExerciseHistory/fetchPreviousBests (server.ts) for the
// all-exercise summary: those are scoped to a specific exercise-id
// list and a specific "current session" to exclude, neither of which
// exists at /progress's scope. fetchExerciseHistory IS reused directly
// for the single-exercise detail page's "recent best sets" section,
// where its existing exercise-id-scoped shape fits perfectly.
//
// Reuses the actual math (epley1RM, setScore) from workout.ts and the
// trend classification (classifyTrend) from workout-coach.ts, so
// there is exactly one implementation of each, not a parallel copy.
//
// Phase 2E: the core "process one session's qualifying sets for one
// exercise" logic is now a single shared function (processExerciseSession),
// used by both fetchStrengthRecords (looped across every exercise) and
// fetchExerciseProgressDetail (looped for one targeted exercise) — so
// PR-reconstruction semantics (first-ever performance establishes the
// baseline silently, later improvements over an EXISTING baseline
// create PR events, successive same-session PRs, Weight > Est. 1RM >
// Rep priority) live in exactly one place.
//
// No writes. No schema changes.
// ============================================================

import { epley1RM, setScore } from '@/lib/workout'
import { classifyTrend } from '@/lib/workout-coach'
import type { ProgressionTrend } from '@/lib/workout-coach'
import type { WorkoutSet, ExerciseType } from '@/types/database'

const RECENT_PR_DISPLAY_CAP = 10

// ── Types ────────────────────────────────────────────────────────────

export interface StrengthRecord {
  exerciseId: string
  exerciseName: string
  exerciseType: ExerciseType
  isUnilateral: boolean
  maxWeightKg: number | null
  maxEstimated1RmKg: number | null
  maxBodyweightReps: number | null
  mostRecentBest: { workoutDate: string; weightKg: number | null; reps: number | null; rpe: number | null } | null
  trend: ProgressionTrend
}

export type PREventType = 'weight' | 'estimated_1rm' | 'bodyweight_reps'

export interface PREvent {
  workoutDate: string
  exerciseId: string
  exerciseName: string
  isUnilateral: boolean
  type: PREventType
  weightKg: number | null
  reps: number | null
  /** Only populated when type === 'estimated_1rm' — the computed 1RM at that moment, not the raw set. */
  estimated1RmKg: number | null
}

export interface StrengthRecordsSummary {
  records: StrengthRecord[]
  recentPREvents: PREvent[] // most-recent-first, capped at RECENT_PR_DISPLAY_CAP
}

export interface ExerciseProgressDetail {
  exerciseId: string
  exerciseName: string
  exerciseType: ExerciseType
  isUnilateral: boolean
  maxWeightKg: number | null
  maxEstimated1RmKg: number | null
  maxBodyweightReps: number | null
  mostRecentBest: { workoutDate: string; weightKg: number | null; reps: number | null; rpe: number | null } | null
  trend: ProgressionTrend
  /** ALL PR events for this exercise, most-recent-first. No cap here — the caller decides how much to show. */
  prHistory: PREvent[]
}

// ── Shared per-exercise running-best state ─────────────────────────────

interface RunningBestState {
  maxWeightKg: number | null
  maxEstimated1RmKg: number | null
  maxBodyweightReps: number | null
}

function freshRunningBestState(): RunningBestState {
  return { maxWeightKg: null, maxEstimated1RmKg: null, maxBodyweightReps: null }
}

interface RawSet {
  set_number: number
  reps: number | null
  weight_kg: number | null
  rpe: number | null
  is_warmup: boolean
  completed: boolean
}

function isQualifyingSet(s: RawSet): boolean {
  return s.completed && !s.is_warmup && (
    (s.weight_kg !== null && s.weight_kg > 0) || (s.reps !== null && s.reps > 0)
  )
}

interface SessionExerciseResult {
  prEvents: PREvent[]
  sessionBestScore: number | null
  bestOfSession: { weightKg: number | null; reps: number | null; rpe: number | null } | null
}

/**
 * Processes one session's already-merged qualifying sets for ONE
 * exercise (sorted by set_number): emits PR events and mutates the
 * running-best state in place.
 *
 * A first-ever qualifying value for a given metric (state.*Kg/Reps is
 * still null) SILENTLY establishes the running best and is never
 * itself reported as a PR — there was nothing to beat yet. Only a
 * later set that exceeds an already-established baseline counts as a
 * PR. The running best is updated after each set, so a second set in
 * the same session can be recognized as a new record even though it's
 * only beating THIS session's first set (successive same-workout PRs).
 *
 * Priority when a single weighted set qualifies for more than one PR
 * type: weight PR wins over estimated-1RM PR. A set is never both a
 * weighted PR and a bodyweight-rep PR (mutually exclusive based on
 * whether the set has a real weight).
 *
 * This is the ONE shared implementation used by both
 * fetchStrengthRecords (called once per exercise per session, across
 * every exercise) and fetchExerciseProgressDetail (called once per
 * session, for a single targeted exercise).
 */
function processExerciseSession(
  sortedSets: RawSet[],
  state: RunningBestState,
  workoutDate: string,
  exerciseId: string,
  exerciseName: string,
  isUnilateral: boolean
): SessionExerciseResult {
  const prEvents: PREvent[] = []
  let sessionBestScore: number | null = null

  for (const s of sortedSets) {
    let prType: PREventType | null = null
    let rmForThisSet: number | null = null

    if (s.weight_kg !== null && s.weight_kg > 0) {
      const hadWeightBaseline = state.maxWeightKg !== null
      if (state.maxWeightKg === null || s.weight_kg > state.maxWeightKg) {
        if (hadWeightBaseline) prType = 'weight'
        state.maxWeightKg = s.weight_kg
      }

      rmForThisSet = s.reps ? epley1RM(s.weight_kg, s.reps) : null
      if (rmForThisSet !== null) {
        const hadRmBaseline = state.maxEstimated1RmKg !== null
        if (state.maxEstimated1RmKg === null || rmForThisSet > state.maxEstimated1RmKg) {
          if (hadRmBaseline && prType === null) prType = 'estimated_1rm'
          state.maxEstimated1RmKg = rmForThisSet
        }
      }
    } else if (s.reps !== null && s.reps > 0) {
      const hadBwBaseline = state.maxBodyweightReps !== null
      if (state.maxBodyweightReps === null || s.reps > state.maxBodyweightReps) {
        if (hadBwBaseline) prType = 'bodyweight_reps'
        state.maxBodyweightReps = s.reps
      }
    }

    if (prType !== null) {
      prEvents.push({
        workoutDate,
        exerciseId,
        exerciseName,
        isUnilateral,
        type: prType,
        weightKg: s.weight_kg,
        reps: s.reps,
        estimated1RmKg: prType === 'estimated_1rm' ? rmForThisSet : null,
      })
    }

    const score = setScore(s as WorkoutSet)
    if (sessionBestScore === null || score > sessionBestScore) {
      sessionBestScore = score
    }
  }

  const bestOfSessionSet = sortedSets.reduce(
    (best, s) => (setScore(s as WorkoutSet) > setScore(best as WorkoutSet) ? s : best),
    sortedSets[0]
  )

  return {
    prEvents,
    sessionBestScore,
    bestOfSession: bestOfSessionSet
      ? { weightKg: bestOfSessionSet.weight_kg, reps: bestOfSessionSet.reps, rpe: bestOfSessionSet.rpe ?? null }
      : null,
  }
}

// ── fetchStrengthRecords — all exercises (Phase 2D, /progress) ────────

/**
 * Fetches and reconstructs all-time strength records and a
 * chronologically-correct recent-PR event timeline for EVERY exercise,
 * in a single query + single pass. Exercises of type 'cardio'/
 * 'mobility' are excluded entirely — neither a weight nor a rep-PR
 * framing fits them, same reasoning already applied in
 * suggestNextTarget (Phase 2C).
 */
export async function fetchStrengthRecords(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<StrengthRecordsSummary> {
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      id, workout_date,
      workout_exercises (
        exercise_id,
        exercise:exercises ( id, name, exercise_type, unilateral ),
        workout_sets ( set_number, reps, weight_kg, rpe, is_warmup, completed )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('workout_date', { ascending: true })

  type ExerciseMeta = { name: string; exerciseType: ExerciseType; isUnilateral: boolean }
  const exerciseMeta: Record<string, ExerciseMeta> = {}
  const state: Record<string, RunningBestState> = {}
  const mostRecentBest: Record<
    string,
    { workoutDate: string; weightKg: number | null; reps: number | null; rpe: number | null }
  > = {}
  // Per-exercise session-best-score history, built ascending (oldest
  // first) here — reversed before being handed to classifyTrend, which
  // expects most-recent-first (same convention fetchExerciseTrends uses).
  const sessionScoresAscending: Record<string, number[]> = {}
  const allPrEvents: PREvent[] = []

  for (const session of sessions ?? []) {
    const workoutDate: string = session.workout_date

    // Merge all workout_exercises blocks for the same exercise within
    // this one session before evaluating — so a same-exercise-added-
    // twice session isn't double-counted.
    const setsByExercise: Record<string, RawSet[]> = {}

    for (const we of session.workout_exercises ?? []) {
      const ex = we.exercise
      if (!ex) continue
      const exerciseId: string = we.exercise_id

      if (!exerciseMeta[exerciseId]) {
        exerciseMeta[exerciseId] = {
          name: ex.name,
          exerciseType: ex.exercise_type,
          isUnilateral: !!ex.unilateral,
        }
      }

      // cardio/mobility excluded entirely — don't even collect their sets.
      if (ex.exercise_type === 'cardio' || ex.exercise_type === 'mobility') continue

      const working = ((we.workout_sets ?? []) as RawSet[]).filter(isQualifyingSet)
      if (working.length === 0) continue

      if (!setsByExercise[exerciseId]) setsByExercise[exerciseId] = []
      setsByExercise[exerciseId].push(...working)
    }

    for (const [exerciseId, sets] of Object.entries(setsByExercise)) {
      const sorted = sets.slice().sort((a, b) => a.set_number - b.set_number)
      if (!state[exerciseId]) state[exerciseId] = freshRunningBestState()

      const result = processExerciseSession(
        sorted,
        state[exerciseId],
        workoutDate,
        exerciseId,
        exerciseMeta[exerciseId].name,
        exerciseMeta[exerciseId].isUnilateral
      )

      allPrEvents.push(...result.prEvents)
      if (result.bestOfSession) {
        mostRecentBest[exerciseId] = { workoutDate, ...result.bestOfSession }
      }
      if (result.sessionBestScore !== null) {
        if (!sessionScoresAscending[exerciseId]) sessionScoresAscending[exerciseId] = []
        sessionScoresAscending[exerciseId].push(result.sessionBestScore)
      }
    }
  }

  const records: StrengthRecord[] = Object.entries(exerciseMeta)
    .filter(([, meta]) => meta.exerciseType !== 'cardio' && meta.exerciseType !== 'mobility')
    .map(([exerciseId, meta]) => {
      const scoresDescending = (sessionScoresAscending[exerciseId] ?? []).slice().reverse()
      const st = state[exerciseId] ?? freshRunningBestState()
      return {
        exerciseId,
        exerciseName: meta.name,
        exerciseType: meta.exerciseType,
        isUnilateral: meta.isUnilateral,
        maxWeightKg: st.maxWeightKg,
        maxEstimated1RmKg: st.maxEstimated1RmKg,
        maxBodyweightReps: st.maxBodyweightReps,
        mostRecentBest: mostRecentBest[exerciseId] ?? null,
        trend: classifyTrend(scoresDescending),
      }
    })
    // Only exercises with at least one qualifying set become a record
    .filter((r) => r.maxWeightKg !== null || r.maxEstimated1RmKg !== null || r.maxBodyweightReps !== null)

  const recentPREvents = allPrEvents.slice().reverse().slice(0, RECENT_PR_DISPLAY_CAP)

  return { records, recentPREvents }
}

// ── fetchExerciseProgressDetail — one exercise (Phase 2E) ──────────────

/**
 * Fetches all-time strength-record data for ONE exercise, targeted at
 * the query level rather than scanning every exercise. Uses the
 * embedded-resource filter pattern (workout_exercises!inner +
 * .eq('workout_exercises.exercise_id', exerciseId)) so only sessions
 * containing this exercise are returned, and only this exercise's
 * workout_exercises rows are embedded.
 *
 * Defensively re-checks we.exercise_id === exerciseId before merging
 * sets (belt-and-suspenders correctness on already-fetched data, not
 * a fallback to a full scan) in case a session logged the exercise
 * under more than one workout_exercises block.
 *
 * Returns null if the exercise doesn't exist or doesn't belong to
 * this user — same "not found" contract fetchSessionWithDetails uses
 * elsewhere, for the caller to turn into notFound().
 */
export async function fetchExerciseProgressDetail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  exerciseId: string
): Promise<ExerciseProgressDetail | null> {
  const { data: exercise } = await supabase
    .from('exercises')
    .select('id, name, exercise_type, unilateral')
    .eq('id', exerciseId)
    .eq('user_id', userId)
    .single()

  if (!exercise) return null

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      id, workout_date,
      workout_exercises!inner (
        exercise_id,
        workout_sets ( set_number, reps, weight_kg, rpe, is_warmup, completed )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .eq('workout_exercises.exercise_id', exerciseId)
    .order('workout_date', { ascending: true })

  const state = freshRunningBestState()
  let mostRecentBest: { workoutDate: string; weightKg: number | null; reps: number | null; rpe: number | null } | null = null
  const scoresAscending: number[] = []
  const prHistory: PREvent[] = []

  for (const session of sessions ?? []) {
    const workoutDate: string = session.workout_date

    // Merge all workout_exercises blocks for THIS exercise within one
    // session (defensive: the !inner filter should already guarantee
    // every block here is exerciseId, but re-checking costs nothing on
    // already-fetched data and guards against a same-exercise-added-
    // twice session either way).
    const allSets: RawSet[] = []
    for (const we of session.workout_exercises ?? []) {
      if (we.exercise_id !== exerciseId) continue
      const working = ((we.workout_sets ?? []) as RawSet[]).filter(isQualifyingSet)
      allSets.push(...working)
    }
    if (allSets.length === 0) continue

    const sorted = allSets.slice().sort((a, b) => a.set_number - b.set_number)
    const result = processExerciseSession(
      sorted, state, workoutDate, exerciseId, exercise.name, !!exercise.unilateral
    )

    prHistory.push(...result.prEvents)
    if (result.bestOfSession) {
      mostRecentBest = { workoutDate, ...result.bestOfSession }
    }
    if (result.sessionBestScore !== null) {
      scoresAscending.push(result.sessionBestScore)
    }
  }

  return {
    exerciseId,
    exerciseName: exercise.name,
    exerciseType: exercise.exercise_type,
    isUnilateral: !!exercise.unilateral,
    maxWeightKg: state.maxWeightKg,
    maxEstimated1RmKg: state.maxEstimated1RmKg,
    maxBodyweightReps: state.maxBodyweightReps,
    mostRecentBest,
    trend: classifyTrend(scoresAscending.slice().reverse()),
    prHistory: prHistory.slice().reverse(),
  }
}
