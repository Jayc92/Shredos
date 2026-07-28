// ============================================================
// ShredOS — Strength Records (Phase 2D)
// All-time strength-record aggregation for the /progress page.
// Deliberately separate from progress-summary.ts (which stays a
// 28-day general progress read) — this file is the all-time
// strength/PR read. Single query, single chronological pass.
//
// Deliberately does NOT reuse fetchExercisePRBaseline/
// fetchExerciseHistory/fetchPreviousBests (server.ts): all three are
// scoped to a specific exercise-id list and a specific "current
// session" to exclude, neither of which exists at this page's scope.
// Reusing them here would mean one query just to discover exercise
// ids, then 2-3 more full-history scans on top of that. This file
// does the equivalent work in exactly one query + one pass instead.
//
// Reuses the actual math (epley1RM, setScore) from workout.ts and the
// trend classification (classifyTrend) from workout-coach.ts, so
// there is exactly one implementation of each, not a parallel copy.
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
  mostRecentBest: { workoutDate: string; weightKg: number | null; reps: number | null } | null
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

// ── Main export ──────────────────────────────────────────────────────

/**
 * Fetches and reconstructs all-time strength records and a
 * chronologically-correct recent-PR event timeline, in a single query
 * + single pass. Exercises of type 'cardio'/'mobility' are excluded
 * entirely — neither a weight nor a rep-PR framing fits them, same
 * reasoning already applied in suggestNextTarget (Phase 2C).
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
        workout_sets ( set_number, reps, weight_kg, is_warmup, completed )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('workout_date', { ascending: true })

  type ExerciseMeta = { name: string; exerciseType: ExerciseType; isUnilateral: boolean }
  const exerciseMeta: Record<string, ExerciseMeta> = {}

  const runningMaxWeightKg: Record<string, number | null> = {}
  const runningMaxEstimated1RmKg: Record<string, number | null> = {}
  const runningMaxBodyweightReps: Record<string, number | null> = {}
  const mostRecentBest: Record<
    string,
    { workoutDate: string; weightKg: number | null; reps: number | null }
  > = {}
  // Per-exercise session-best-score history, built ascending (oldest
  // first) here — reversed before being handed to classifyTrend, which
  // expects most-recent-first (same convention fetchExerciseTrends uses).
  const sessionScoresAscending: Record<string, number[]> = {}

  const prEvents: PREvent[] = []

  for (const session of sessions ?? []) {
    const workoutDate: string = session.workout_date

    // Merge all workout_exercises blocks for the same exercise within
    // this one session before evaluating — same rule already
    // established in fetchExercisePRBaseline/fetchExerciseHistory, so
    // a same-exercise-added-twice session isn't double-counted.
    const setsByExercise: Record<string, any[]> = {}

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

      const working = (we.workout_sets ?? []).filter(
        (s: any) => s.completed && !s.is_warmup && (
          (s.weight_kg !== null && s.weight_kg > 0) || (s.reps !== null && s.reps > 0)
        )
      )
      if (working.length === 0) continue

      if (!setsByExercise[exerciseId]) setsByExercise[exerciseId] = []
      setsByExercise[exerciseId].push(...working)
    }

    for (const [exerciseId, sets] of Object.entries(setsByExercise)) {
      const sorted = sets.slice().sort((a, b) => a.set_number - b.set_number)
      let sessionBestScore: number | null = null

      for (const s of sorted) {
        let prType: PREventType | null = null
        let rmForThisSet: number | null = null

        if (s.weight_kg !== null && s.weight_kg > 0) {
          const curMaxW = runningMaxWeightKg[exerciseId] ?? null
          const hadWeightBaseline = curMaxW !== null
          if (curMaxW === null || s.weight_kg > curMaxW) {
            if (hadWeightBaseline) prType = 'weight'
            runningMaxWeightKg[exerciseId] = s.weight_kg
          }

          rmForThisSet = s.reps ? epley1RM(s.weight_kg, s.reps) : null
          if (rmForThisSet !== null) {
            const curMaxRm = runningMaxEstimated1RmKg[exerciseId] ?? null
            const hadRmBaseline = curMaxRm !== null
            if (curMaxRm === null || rmForThisSet > curMaxRm) {
              if (hadRmBaseline && prType === null) prType = 'estimated_1rm'
              runningMaxEstimated1RmKg[exerciseId] = rmForThisSet
            }
          }
        } else if (s.reps !== null && s.reps > 0) {
          const curMaxReps = runningMaxBodyweightReps[exerciseId] ?? null
          const hadBwBaseline = curMaxReps !== null
          if (curMaxReps === null || s.reps > curMaxReps) {
            if (hadBwBaseline) prType = 'bodyweight_reps'
            runningMaxBodyweightReps[exerciseId] = s.reps
          }
        }

        if (prType !== null) {
          prEvents.push({
            workoutDate,
            exerciseId,
            exerciseName: exerciseMeta[exerciseId].name,
            isUnilateral: exerciseMeta[exerciseId].isUnilateral,
            type: prType,
            weightKg: s.weight_kg,
            reps: s.reps,
            estimated1RmKg: prType === 'estimated_1rm' ? rmForThisSet : null,
          })
        }

        // Session-best score for trend classification — reuses the
        // exact same scoring function bestSet/evaluateSetPRs use.
        const score = setScore(s as WorkoutSet)
        if (sessionBestScore === null || score > sessionBestScore) {
          sessionBestScore = score
        }
      }

      // Most recent best set for display. Ascending processing order
      // means the last session written here is genuinely the most
      // recent — later sessions simply overwrite earlier entries.
      const bestOfSession = sorted.reduce(
        (best: any, s: any) => (setScore(s as WorkoutSet) > setScore(best as WorkoutSet) ? s : best),
        sorted[0]
      )
      mostRecentBest[exerciseId] = {
        workoutDate,
        weightKg: bestOfSession.weight_kg,
        reps: bestOfSession.reps,
      }

      if (sessionBestScore !== null) {
        if (!sessionScoresAscending[exerciseId]) sessionScoresAscending[exerciseId] = []
        sessionScoresAscending[exerciseId].push(sessionBestScore)
      }
    }
  }

  const records: StrengthRecord[] = Object.entries(exerciseMeta)
    .filter(([, meta]) => meta.exerciseType !== 'cardio' && meta.exerciseType !== 'mobility')
    .map(([exerciseId, meta]) => {
      const scoresDescending = (sessionScoresAscending[exerciseId] ?? []).slice().reverse()
      return {
        exerciseId,
        exerciseName: meta.name,
        exerciseType: meta.exerciseType,
        isUnilateral: meta.isUnilateral,
        maxWeightKg: runningMaxWeightKg[exerciseId] ?? null,
        maxEstimated1RmKg: runningMaxEstimated1RmKg[exerciseId] ?? null,
        maxBodyweightReps: runningMaxBodyweightReps[exerciseId] ?? null,
        mostRecentBest: mostRecentBest[exerciseId] ?? null,
        trend: classifyTrend(scoresDescending),
      }
    })
    // Only exercises with at least one qualifying set become a record
    .filter((r) => r.maxWeightKg !== null || r.maxEstimated1RmKg !== null || r.maxBodyweightReps !== null)

  const recentPREvents = prEvents.slice().reverse().slice(0, RECENT_PR_DISPLAY_CAP)

  return { records, recentPREvents }
}
