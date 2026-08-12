// ============================================================
// ForgeFitOS — Intentional Activity Utilities (Phase 5A.3)
// ============================================================
// Pure helpers for activity_sessions: the type vocabulary, manual
// input validation, canonical distance conversion, and small display
// formatting. Everything here is pure/deterministic so the harness
// executes it at runtime. Shared by the client forms and the
// server-authoritative /api/activity-sessions write routes — the
// server, not the browser, decides every persisted value.
//
// Boundary reminder: activity sessions never write steps or daily
// aggregates, and their calories are informational only.

// ── Activity type vocabulary ──────────────────────────────────────
// Mirrors the migration 015 CHECK exactly. Extensions are rare,
// additive migrations; 'other' absorbs the tail.

export const ACTIVITY_TYPES = [
  'walk',
  'run',
  'cycle',
  'hike',
  'row',
  'elliptical',
  'stair_climber',
  'swim',
  'other',
] as const

export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  walk: 'Walk',
  run: 'Run',
  cycle: 'Cycling',
  hike: 'Hike',
  row: 'Rowing',
  elliptical: 'Elliptical',
  stair_climber: 'Stair climber',
  swim: 'Swimming',
  other: 'Other',
}

export function isActivityType(value: unknown): value is ActivityType {
  return typeof value === 'string' && (ACTIVITY_TYPES as readonly string[]).includes(value)
}

// ── Canonical distance (011 convention: meters stored, miles UI) ──

export const METERS_PER_MILE = 1609.34

/** Miles (manual input) -> canonical meters, rounded to 2dp exactly
 *  like workout_sets.distance_meters entry (SetRow convention). */
export function milesToMeters(miles: number): number {
  return Math.round(miles * METERS_PER_MILE * 100) / 100
}

/** Canonical meters -> display/prefill miles at 2dp. The shared 2dp
 *  contract on both directions keeps edit round-trips stable. */
export function metersToMiles(meters: number): number {
  return Math.round((meters / METERS_PER_MILE) * 100) / 100
}

// ── Manual session validation ─────────────────────────────────────
// activity_date is the authoritative LOCAL calendar date. started_at
// is optional: a session with no known start instant is valid. When
// a start time exists it arrives as a composed local 'HH:mm' (from
// the segmented control), is parsed with the date exactly once in
// local time, and must not be materially in the future (the same
// 2-minute clock-skew tolerance as fasting/workouts). When no start
// time exists there is no instant to test, so the rule is simply
// that the calendar date is not later than `today`.

/** Clock-skew tolerance only — not a grace window. */
export const ACTIVITY_FUTURE_TOLERANCE_MS = 2 * 60 * 1000

/** Generous finite bound decided for the ACTIVITY model explicitly
 *  (not inherited from workouts): 24 hours. */
export const ACTIVITY_MAX_DURATION_MINUTES = 1440

export const ACTIVITY_NOTES_MAX_LENGTH = 2000

export type ActivitySessionValidation =
  | {
      ok: true
      activityType: ActivityType
      activityDate: string
      startedAt: Date | null
      durationSeconds: number
      distanceMeters: number | null
      caloriesBurned: number | null
      notes: string | null
    }
  | { ok: false; error: string }

export function validateActivitySessionInput(
  input: {
    activityType: unknown
    activityDate: unknown
    /** Composed local 'HH:mm', or null/'' when no start time given. */
    startTime?: unknown
    durationMinutes: unknown
    distanceMiles?: unknown
    caloriesBurned?: unknown
    notes?: unknown
  },
  /** Local calendar 'today' for the date-only future rule. */
  today: string,
  now: Date = new Date()
): ActivitySessionValidation {
  const { activityType, activityDate, startTime, durationMinutes, distanceMiles,
    caloriesBurned, notes } = input

  if (!isActivityType(activityType)) {
    return { ok: false, error: 'Choose an activity type.' }
  }

  if (typeof activityDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(activityDate)) {
    return { ok: false, error: 'Enter a valid activity date.' }
  }

  let startedAt: Date | null = null
  if (startTime !== undefined && startTime !== null && startTime !== '') {
    if (typeof startTime !== 'string' || !/^\d{2}:\d{2}$/.test(startTime)) {
      return { ok: false, error: 'Enter a complete start time.' }
    }
    // Single local parse of the combined date + time (never UTC-shifted).
    startedAt = new Date(`${activityDate}T${startTime}`)
    if (isNaN(startedAt.getTime())) {
      return { ok: false, error: 'Enter a valid activity date and start time.' }
    }
    if (startedAt.getTime() > now.getTime() + ACTIVITY_FUTURE_TOLERANCE_MS) {
      return { ok: false, error: 'Start time cannot be in the future.' }
    }
  } else {
    // Date-only record: no instant exists, so the future rule is the
    // calendar comparison alone.
    const probe = new Date(`${activityDate}T00:00`)
    if (isNaN(probe.getTime())) {
      return { ok: false, error: 'Enter a valid activity date.' }
    }
    if (activityDate > today) {
      return { ok: false, error: 'Activity date cannot be in the future.' }
    }
  }

  const minutes = Number(durationMinutes)
  if (!Number.isInteger(minutes) || minutes <= 0) {
    return { ok: false, error: 'Duration must be at least 1 minute.' }
  }
  if (minutes > ACTIVITY_MAX_DURATION_MINUTES) {
    return { ok: false, error: 'Duration cannot exceed 24 hours.' }
  }

  // Distance: blank -> NULL (not recorded); otherwise a positive,
  // finite miles value converted once to canonical meters.
  let distanceMeters: number | null = null
  if (distanceMiles !== undefined && distanceMiles !== null && distanceMiles !== '') {
    const miles = Number(distanceMiles)
    if (!Number.isFinite(miles) || miles <= 0) {
      return { ok: false, error: 'Distance must be a positive number of miles.' }
    }
    distanceMeters = milesToMeters(miles)
  }

  // Calories: NULL = not recorded; 0 = explicitly zero (014 rule).
  let calories: number | null = null
  if (caloriesBurned !== undefined && caloriesBurned !== null && caloriesBurned !== '') {
    const n = Number(caloriesBurned)
    if (!Number.isInteger(n) || n < 0) {
      return { ok: false, error: 'Calories must be a whole number of 0 or more.' }
    }
    calories = n
  }

  let cleanNotes: string | null = null
  if (typeof notes === 'string') {
    const trimmed = notes.trim()
    if (trimmed.length > ACTIVITY_NOTES_MAX_LENGTH) {
      return { ok: false, error: `Notes must be ${ACTIVITY_NOTES_MAX_LENGTH} characters or fewer.` }
    }
    cleanNotes = trimmed.length > 0 ? trimmed : null
  }

  return {
    ok: true,
    activityType,
    activityDate,
    startedAt,
    durationSeconds: minutes * 60,
    distanceMeters,
    caloriesBurned: calories,
    notes: cleanNotes,
  }
}

// ── Daily aggregate movement (Phase 5A.4) ─────────────────────────
// daily_activity_logs holds AGGREGATE daily signals; the sessions
// above are COMPONENT records largely contained within them. For
// both daily metrics: NULL = not recorded, 0 = explicitly zero, and
// each is independently optional — a distance-only day never
// fabricates zero steps and vice versa. No steps/distance conversion
// or estimation exists in either direction.

/** The migration 005 CHECK bound — the established step contract. */
export const DAILY_STEPS_MAX = 100000

/** NUMERIC(10,2) storage bound for canonical meters. This is the
 *  database's precision limit, NOT a product-level plausibility cap
 *  (approved D5: no arbitrary maximum distance; plausibility is a
 *  future warning concern). */
export const DAILY_DISTANCE_MAX_METERS = 99999999.99

export type DailyMovementValidation =
  | { ok: true; steps: number | null; distanceMeters: number | null }
  | { ok: false; error: string }

/**
 * Validates a daily aggregate movement payload. Blank/absent fields
 * mean "not recorded" (NULL) — never silently coerced to zero; an
 * explicit 0 is a real recorded zero for either metric. Distance
 * arrives as miles and converts to canonical meters exactly once,
 * here. Malformed, negative, or non-finite values are rejected with
 * exact errors — nothing is clamped.
 */
/** Blank/absent means "not recorded"; anything else must be a number
 *  or numeric string — booleans/arrays/objects would otherwise
 *  coerce through Number() into a fabricated explicit zero. */
function isBlank(value: unknown): boolean {
  return value === undefined || value === null ||
    (typeof value === 'string' && value.trim() === '')
}

export function validateDailyMovementInput(input: {
  steps?: unknown
  distanceMiles?: unknown
}): DailyMovementValidation {
  let steps: number | null = null
  if (!isBlank(input.steps)) {
    if (typeof input.steps !== 'number' && typeof input.steps !== 'string') {
      return { ok: false, error: 'Steps must be a whole number of 0 or more.' }
    }
    const n = Number(input.steps)
    if (!Number.isInteger(n) || n < 0) {
      return { ok: false, error: 'Steps must be a whole number of 0 or more.' }
    }
    if (n > DAILY_STEPS_MAX) {
      return { ok: false, error: `Steps cannot exceed ${DAILY_STEPS_MAX.toLocaleString()}.` }
    }
    steps = n
  }

  let distanceMeters: number | null = null
  if (!isBlank(input.distanceMiles)) {
    if (typeof input.distanceMiles !== 'number' && typeof input.distanceMiles !== 'string') {
      return { ok: false, error: 'Distance must be a valid number of miles.' }
    }
    const miles = Number(input.distanceMiles)
    if (!Number.isFinite(miles)) {
      return { ok: false, error: 'Distance must be a valid number of miles.' }
    }
    if (miles < 0) {
      return { ok: false, error: 'Distance cannot be negative.' }
    }
    const meters = milesToMeters(miles)
    if (meters > DAILY_DISTANCE_MAX_METERS) {
      return { ok: false, error: 'Distance is too large to store.' }
    }
    distanceMeters = meters
  }

  return { ok: true, steps, distanceMeters }
}

/** Sum of recorded session distances (NULL distances contribute
 *  nothing) — the component total for one calendar day. */
export function sessionDistanceTotalMeters(
  sessions: Array<{ distance_meters: number | null }>
): number {
  let total = 0
  for (const session of sessions) {
    if (session.distance_meters !== null && Number.isFinite(session.distance_meters)) {
      total += session.distance_meters
    }
  }
  return total
}

/**
 * Informational aggregate-vs-component reconciliation for one local
 * calendar date. Session distance is a COMPONENT of the daily
 * aggregate, so it exceeding the aggregate signals a data problem —
 * but manual entries can be wrong in either direction and device
 * sources measure differently, so this only ever returns a message:
 * it never blocks a save, mutates either value, or auto-fills
 * anything. Comparison happens on the 2dp display miles (the shared
 * metersToMiles contract) so floating-point meter noise can't
 * manufacture a warning. A NULL daily distance means "not recorded"
 * — nothing to reconcile against.
 */
export function dailyDistanceReconciliationWarning(
  dailyDistanceMeters: number | null,
  sessionDistanceMeters: number
): string | null {
  if (dailyDistanceMeters === null) return null
  const dailyMiles = metersToMiles(dailyDistanceMeters)
  const sessionMiles = metersToMiles(sessionDistanceMeters)
  if (sessionMiles <= dailyMiles) return null
  return `Your logged activities total ${sessionMiles} mi, but your daily movement total is ${dailyMiles} mi. Check your activity total or session distances.`
}

// ── Display formatting ────────────────────────────────────────────

/** '45m' / '1h 30m' from stored duration_seconds. */
export function formatActivityDuration(durationSeconds: number): string {
  const mins = Math.round(durationSeconds / 60)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

/** '2.3 mi' from canonical meters. */
export function formatActivityDistance(distanceMeters: number): string {
  return `${metersToMiles(distanceMeters)} mi`
}
