// ============================================================
// ShredOS — Phase 1E Workout Coaching Layer
// Pure server-side derivation. No schema changes.
// ============================================================

import { differenceInDays, parseISO, subDays, format } from 'date-fns'
import { addDaysISO } from '@/lib/local-date'

// ── Coaching constants ────────────────────────────────────────────────────────
// Hardcoded for Phase 1E. Per-user preferences deferred to Phase 2.
const FRESHNESS_THRESHOLDS = {
  fresh:      5,  // >= 5 days since last trained -> Fresh
  ready:      3,  // 3-4 days -> Ready
  recovering: 1,  // 1-2 days -> Recovering
                  // 0 days (today) -> Fatigued
} as const

const VOLUME_THRESHOLDS = {
  moderate: 4,    // 0-3 sets/week -> Low
  high:     9,    // 4-8 -> Moderate
  veryHigh: 15,   // 9-14 -> High; 15+ -> Very high
} as const

const COACHING_MIN_SESSIONS = 3  // sessions needed before showing coaching insights

// exercises.primary_muscle uses specific values; routines use broader groups.
// This map normalises specifics to the broad group for freshness matching.
// Phase 5A.6B (compatibility only, no new Coach behavior): the widened
// 25-value taxonomy maps into the same six display groups so newly
// specific muscles never fall through to a nonexistent group —
// lats/upper_back/lower_back/traps read as back, the delt heads as
// shoulders, hip_flexors/adductors/abductors as legs, abs/obliques as
// core. The retained broad values (back/shoulders/core) pass through
// unmapped exactly as before.
const MUSCLE_GROUP_MAP: Record<string, string> = {
  biceps:      'arms',
  triceps:     'arms',
  forearms:    'arms',
  quads:       'legs',
  hamstrings:  'legs',
  glutes:      'legs',
  calves:      'legs',
  hip_flexors: 'legs',
  adductors:   'legs',
  abductors:   'legs',
  lats:        'back',
  upper_back:  'back',
  lower_back:  'back',
  traps:       'back',
  front_delts: 'shoulders',
  side_delts:  'shoulders',
  rear_delts:  'shoulders',
  abs:         'core',
  obliques:    'core',
}

// Broad muscle groups shown in the readiness panel (matches ROUTINE_MUSCLE_FOCUS)
const DISPLAY_MUSCLE_GROUPS = [
  { value: 'chest',      label: 'Chest'     },
  { value: 'back',       label: 'Back'      },
  { value: 'legs',       label: 'Legs'      },
  { value: 'shoulders',  label: 'Shoulders' },
  { value: 'arms',       label: 'Arms'      },
  { value: 'core',       label: 'Core'      },
] as const

function toMuscleGroup(primaryMuscle: string): string {
  return MUSCLE_GROUP_MAP[primaryMuscle] ?? primaryMuscle
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type FreshnessLevel    = 'fresh' | 'ready' | 'recovering' | 'fatigued'
export type VolumeLevel       = 'low' | 'moderate' | 'high' | 'very-high'
export type ProgressionTrend  = 'improving' | 'steady' | 'stalling' | 'needs-data'

export interface MuscleReadiness {
  muscle:              string          // broad group, e.g. 'chest'
  label:               string          // display label, e.g. 'Chest'
  lastTrainedDaysAgo:  number | null   // null = never trained
  setsThisWeek:        number
  freshness:           FreshnessLevel
  volumeLevel:         VolumeLevel
}

export interface CoachSummary {
  muscleReadiness:   MuscleReadiness[]   // all 6 display groups
  freshMuscles:      MuscleReadiness[]   // fresh | ready
  recoveringMuscles: MuscleReadiness[]   // recovering | fatigued
  topRoutine:        any | null          // WorkoutRoutine | null
  routineReasonText: string
  fallbackFocusText: string | null       // shown when no routine matches
  weekStats: {
    sessionsThisWeek:    number
    setsThisWeek:        number
    musclesHitThisWeek:  string[]
  }
  hasEnoughData: boolean
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function categorizeFreshness(daysSince: number | null): FreshnessLevel {
  if (daysSince === null) return 'fresh'
  if (daysSince >= FRESHNESS_THRESHOLDS.fresh)      return 'fresh'
  if (daysSince >= FRESHNESS_THRESHOLDS.ready)      return 'ready'
  if (daysSince >= FRESHNESS_THRESHOLDS.recovering) return 'recovering'
  return 'fatigued'
}

function categorizeVolume(setsThisWeek: number): VolumeLevel {
  if (setsThisWeek < VOLUME_THRESHOLDS.moderate) return 'low'
  if (setsThisWeek < VOLUME_THRESHOLDS.high)     return 'moderate'
  if (setsThisWeek < VOLUME_THRESHOLDS.veryHigh) return 'high'
  return 'very-high'
}

const FRESHNESS_SCORE: Record<FreshnessLevel, number> = {
  fresh: 3, ready: 2, recovering: 0, fatigued: -2,
}

function scoreRoutine(
  routine: any,
  readinessMap: Record<string, FreshnessLevel>,
  recentRoutineIds: string[]
): number {
  const focus = routine.primary_muscle_focus as string | null
  if (!focus) return -99
  const freshness = readinessMap[focus] ?? 'fresh'
  let score = FRESHNESS_SCORE[freshness]
  if (recentRoutineIds.includes(routine.id)) score -= 1
  return score
}

function buildReasonText(allMuscleReadiness: MuscleReadiness[], focusMuscle: string | null): string {
  // Accepts full muscleReadiness so recovering-focus routines get accurate copy
  // rather than incorrectly citing OTHER muscles as the reason.
  if (!focusMuscle) return ''
  const m = allMuscleReadiness.find(m => m.muscle === focusMuscle)
  if (!m) return ''
  const days = m.lastTrainedDaysAgo
  if (days === null)                return `${m.label} — start building volume`
  if (m.freshness === 'fresh')      return `${m.label} is fresh — ${days} day${days !== 1 ? 's' : ''} rest`
  if (m.freshness === 'ready')      return `${m.label} is ready — ${days} day${days !== 1 ? 's' : ''} rest`
  if (m.freshness === 'recovering') return `${m.label} is recovering — keep it moderate`
  return ''
}

export function classifyTrend(scores: number[]): ProgressionTrend {
  if (scores.length < 3) return 'needs-data'
  const recent = scores.slice(0, 2)
  const prior  = scores.slice(2, 4)
  if (!prior.length) return 'needs-data'
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const priorAvg  = prior.reduce((a, b) => a + b, 0) / prior.length
  if (priorAvg === 0) return 'needs-data'
  const changePct = (recentAvg - priorAvg) / priorAvg
  if (changePct >  0.03) return 'improving'
  if (changePct < -0.05) return 'stalling'
  return 'steady'
}

// ── Main: fetchCoachSummary ───────────────────────────────────────────────────
// Called from dashboard/page.tsx and workouts/page.tsx (two independent calls,
// both acceptable for a personal app — no caching needed at this scale).

export async function fetchCoachSummary(
  supabase: any,
  userId: string,
  todayISO: string
): Promise<CoachSummary> {
  const today        = parseISO(todayISO)
  const ninetyDaysAgo = format(subDays(today, 90), 'yyyy-MM-dd')
  const sevenDaysAgo  = format(subDays(today, 7),  'yyyy-MM-dd')

  // One query: all sessions with exercises + sets from the last 90 days
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      id, workout_date, status, routine_id,
      workout_exercises (
        id, exercise_id,
        exercise:exercises (id, primary_muscle, name),
        workout_sets (id, completed, is_warmup, reps, weight_kg)
      )
    `)
    .eq('user_id', userId)
    .gte('workout_date', ninetyDaysAgo)
    .order('workout_date', { ascending: false })

  const sessionData: any[] = sessions ?? []

  // Active routines (second query — small table, fast)
  const { data: routines } = await supabase
    .from('workout_routines')
    .select('id, name, primary_muscle_focus, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)

  const routineData: any[] = routines ?? []

  // ── Per-muscle readiness ──────────────────────────────────────────────────
  const muscleReadiness: MuscleReadiness[] = DISPLAY_MUSCLE_GROUPS.map(({ value: broadGroup, label }) => {
    let lastTrainedISO: string | null = null
    let setsThisWeek = 0

    for (const session of sessionData) {
      for (const we of (session.workout_exercises ?? [])) {
        // Map specific muscle to broad group
        const exMuscle = toMuscleGroup((we.exercise as any)?.primary_muscle ?? '')
        if (exMuscle !== broadGroup) continue

        const completedSets = ((we.workout_sets ?? []) as any[]).filter(
          s => s.completed && !s.is_warmup
        )
        if (!completedSets.length) continue

        if (!lastTrainedISO || session.workout_date > lastTrainedISO) {
          lastTrainedISO = session.workout_date
        }

        if (session.workout_date >= sevenDaysAgo) {
          setsThisWeek += completedSets.length
        }
      }
    }

    const lastTrainedDaysAgo = lastTrainedISO
      ? differenceInDays(today, parseISO(lastTrainedISO))
      : null

    return {
      muscle:             broadGroup,
      label,
      lastTrainedDaysAgo,
      setsThisWeek,
      freshness:   categorizeFreshness(lastTrainedDaysAgo),
      volumeLevel: categorizeVolume(setsThisWeek),
    }
  })

  // ── Week stats ────────────────────────────────────────────────────────────
  const thisWeekSessions = sessionData.filter(s =>
    s.workout_date >= sevenDaysAgo &&
    (s.status === 'in_progress' || s.status === 'completed')
  )
  let setsThisWeek = 0
  const musclesHitSet = new Set<string>()

  for (const session of thisWeekSessions) {
    for (const we of (session.workout_exercises ?? [])) {
      for (const set of (we.workout_sets ?? []) as any[]) {
        if (set.completed && !set.is_warmup) {
          setsThisWeek++
          const m = toMuscleGroup((we.exercise as any)?.primary_muscle ?? '')
          if (m) musclesHitSet.add(m)
        }
      }
    }
  }

  const weekStats = {
    sessionsThisWeek: thisWeekSessions.length,
    setsThisWeek,
    musclesHitThisWeek: Array.from(musclesHitSet),
  }

  // ── Data gate ─────────────────────────────────────────────────────────────
  const hasEnoughData = sessionData.length >= COACHING_MIN_SESSIONS

  const freshMuscles     = muscleReadiness.filter(m => m.freshness === 'fresh' || m.freshness === 'ready')
  const recoveringMuscles = muscleReadiness.filter(m => m.freshness === 'recovering' || m.freshness === 'fatigued')

  if (!hasEnoughData) {
    return {
      muscleReadiness, freshMuscles, recoveringMuscles,
      topRoutine: null, routineReasonText: '', fallbackFocusText: null,
      weekStats, hasEnoughData: false,
    }
  }

  // ── Routine recommendation ────────────────────────────────────────────────
  const readinessMap: Record<string, FreshnessLevel> = {}
  for (const m of muscleReadiness) readinessMap[m.muscle] = m.freshness

  // IDs of the last 2 sessions' routines (used to penalise recency)
  const recentRoutineIds = sessionData
    .slice(0, 2)
    .map(s => s.routine_id)
    .filter(Boolean) as string[]

  let topRoutine: any | null = null
  let topScore = -Infinity

  for (const routine of routineData) {
    const score = scoreRoutine(routine, readinessMap, recentRoutineIds)
    if (score > topScore) { topScore = score; topRoutine = routine }
  }

  // Only recommend if the score is non-negative
  if (topScore < 0) topRoutine = null

  const routineReasonText = topRoutine
    ? buildReasonText(muscleReadiness, topRoutine.primary_muscle_focus)
    : ''

  const fallbackFocusText = !topRoutine && freshMuscles.length > 0
    ? `Consider training ${freshMuscles.slice(0, 2).map(m => m.label).join(' or ')} today`
    : null

  return {
    muscleReadiness,
    freshMuscles,
    recoveringMuscles,
    topRoutine,
    routineReasonText,
    fallbackFocusText,
    weekStats,
    hasEnoughData: true,
  }
}

// ── fetchExerciseTrends ───────────────────────────────────────────────────────
// Called from workouts/[id]/page.tsx to show progression labels per exercise.
// One batched query covers all exercises in the session.

export async function fetchExerciseTrends(
  supabase: any,
  userId: string,
  exerciseIds: string[],
  // Local-date fix: this lib is imported by client components, so it
  // cannot read the timezone cookie itself — the SERVER caller passes
  // the user's local calendar day explicitly.
  todayISO: string
): Promise<Record<string, ProgressionTrend>> {
  if (!exerciseIds.length) return {}

  // Local-date fix: workout_date is a user-local calendar date, so
  // the trailing 30-day window anchors to the user's day, not UTC's.
  const thirtyDaysAgo = addDaysISO(todayISO, -30)

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      id, workout_date,
      workout_exercises (
        exercise_id,
        workout_sets (completed, is_warmup, reps, weight_kg)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('workout_date', thirtyDaysAgo)
    .order('workout_date', { ascending: false })
    .limit(30)

  if (!sessions) return {}

  // history[exercise_id] = [bestScore in most-recent session, ..., oldest]
  const history: Record<string, number[]> = {}
  for (const eid of exerciseIds) history[eid] = []

  for (const session of sessions as any[]) {
    // Best score per exercise per session (highest weight × reps as a proxy)
    const sessionBests: Record<string, number> = {}

    for (const we of (session.workout_exercises ?? [])) {
      if (!exerciseIds.includes(we.exercise_id)) continue
      const validSets = ((we.workout_sets ?? []) as any[]).filter(
        s => s.completed && !s.is_warmup && (s.weight_kg ?? 0) > 0 && (s.reps ?? 0) > 0
      )
      if (!validSets.length) continue
      const best = Math.max(...validSets.map((s: any) => (s.weight_kg ?? 0) * (s.reps ?? 1)))
      if (sessionBests[we.exercise_id] === undefined || best > sessionBests[we.exercise_id]) {
        sessionBests[we.exercise_id] = best
      }
    }

    for (const [eid, score] of Object.entries(sessionBests)) {
      if (history[eid]) history[eid].push(score)
    }
  }

  const trends: Record<string, ProgressionTrend> = {}
  for (const [eid, scores] of Object.entries(history)) {
    trends[eid] = classifyTrend(scores)
  }
  return trends
}
