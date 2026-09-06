import type { SupabaseClient } from "@supabase/supabase-js"
import { deriveLegacyExerciseType } from "@/lib/exercise-validation"
import type { MuscleTarget } from "@/lib/exercise-validation"

// Phase 2R: each seed exercise now specifies tracking_mode directly
// (the source of truth going forward) instead of the legacy
// exercise_type.
//
// Phase 5A.6B: seed anatomy uses the explicit-roles model — primary
// on the exercise row, secondary/tertiary in exercise_muscles. The
// deprecated secondary_muscles JSONB is NEVER written (it stays at
// its DB default '[]' for new rows). Refinements affect NEW users
// only; existing user rows are never rewritten. Every taxonomy
// change from the pre-5A.6B seeds is documented:
//   - Bench press:            primary chest (unchanged); secondary
//                             triceps kept; secondary shoulders ->
//                             front_delts (the pressing delt head)
//   - Incline dumbbell press: same refinement as bench press
//   - Lat pulldown:           primary back -> lats; secondary biceps
//                             kept
//   - Seated cable row:       primary back -> upper_back; secondary
//                             biceps kept; secondary lats added
//                             (horizontal-row lat involvement)
//   - Shoulder press:         primary shoulders -> front_delts;
//                             secondary triceps kept; secondary
//                             side_delts added
//   - Lateral raise:          primary shoulders -> side_delts
//   - Squat:                  primary quads (unchanged); secondary
//                             glutes/hamstrings kept; tertiary
//                             lower_back added (isometric support)
//   - Romanian deadlift:      primary hamstrings (unchanged);
//                             secondary glutes kept; secondary back
//                             -> tertiary lower_back (the approved
//                             example refinement)
//   - Plank:                  primary core -> abs; secondary
//                             obliques added
//
// EXLIB-2S delivery activation (the promoted activation design's
// seed-flip event): the Plank seed entry now carries the PUBLISHED
// catalog identity — tracking_mode timed (derived exercise_type
// mobility, migration 010's map) and the approved anatomy
// {(obliques, secondary), (lower_back, tertiary)} — matching the
// hosted-published Plank content version exactly at every field this
// module expresses. The seed delivers the identity only: the
// published instructional payload and the two projected
// relationships (progression -> Ab wheel rollout, substitution ->
// Dead bug) are catalog facts, not expressible as seed rows.
// seed_link_compatible flips to true in the SAME commit (the
// design's same-commit rule).
//   - Chest fly / Leg press / Leg curl / Leg extension / Biceps curl
//     / Triceps pushdown:     unchanged (no fabricated precision)
export const SEED_EXERCISES: ReadonlyArray<{
  name: string
  category: string
  primary_muscle: string
  equipment: string
  tracking_mode: "weight_reps" | "bodyweight" | "cardio" | "timed"
  unilateral: boolean
  muscle_targets: ReadonlyArray<MuscleTarget>
}> = [
  { name: "Bench press",            category: "compound",  primary_muscle: "chest",       equipment: "barbell",    tracking_mode: "weight_reps", unilateral: false,
    muscle_targets: [{ muscle: "triceps", role: "secondary" }, { muscle: "front_delts", role: "secondary" }] },
  { name: "Incline dumbbell press", category: "compound",  primary_muscle: "chest",       equipment: "dumbbell",   tracking_mode: "weight_reps", unilateral: false,
    muscle_targets: [{ muscle: "triceps", role: "secondary" }, { muscle: "front_delts", role: "secondary" }] },
  { name: "Chest fly",              category: "isolation", primary_muscle: "chest",       equipment: "cable",      tracking_mode: "weight_reps", unilateral: false,
    muscle_targets: [] },
  { name: "Lat pulldown",           category: "compound",  primary_muscle: "lats",        equipment: "cable",      tracking_mode: "weight_reps", unilateral: false,
    muscle_targets: [{ muscle: "biceps", role: "secondary" }] },
  { name: "Seated cable row",       category: "compound",  primary_muscle: "upper_back",  equipment: "cable",      tracking_mode: "weight_reps", unilateral: false,
    muscle_targets: [{ muscle: "lats", role: "secondary" }, { muscle: "biceps", role: "secondary" }] },
  { name: "Shoulder press",         category: "compound",  primary_muscle: "front_delts", equipment: "dumbbell",   tracking_mode: "weight_reps", unilateral: false,
    muscle_targets: [{ muscle: "triceps", role: "secondary" }, { muscle: "side_delts", role: "secondary" }] },
  { name: "Lateral raise",          category: "isolation", primary_muscle: "side_delts",  equipment: "dumbbell",   tracking_mode: "weight_reps", unilateral: true,
    muscle_targets: [] },
  { name: "Squat",                  category: "compound",  primary_muscle: "quads",       equipment: "barbell",    tracking_mode: "weight_reps", unilateral: false,
    muscle_targets: [{ muscle: "glutes", role: "secondary" }, { muscle: "hamstrings", role: "secondary" }, { muscle: "lower_back", role: "tertiary" }] },
  { name: "Romanian deadlift",      category: "compound",  primary_muscle: "hamstrings",  equipment: "barbell",    tracking_mode: "weight_reps", unilateral: false,
    muscle_targets: [{ muscle: "glutes", role: "secondary" }, { muscle: "lower_back", role: "tertiary" }] },
  { name: "Leg press",              category: "compound",  primary_muscle: "quads",       equipment: "machine",    tracking_mode: "weight_reps", unilateral: false,
    muscle_targets: [{ muscle: "glutes", role: "secondary" }] },
  { name: "Leg curl",               category: "isolation", primary_muscle: "hamstrings",  equipment: "machine",    tracking_mode: "weight_reps", unilateral: false,
    muscle_targets: [] },
  { name: "Leg extension",          category: "isolation", primary_muscle: "quads",       equipment: "machine",    tracking_mode: "weight_reps", unilateral: false,
    muscle_targets: [] },
  { name: "Biceps curl",            category: "isolation", primary_muscle: "biceps",      equipment: "dumbbell",   tracking_mode: "weight_reps", unilateral: true,
    muscle_targets: [] },
  { name: "Triceps pushdown",       category: "isolation", primary_muscle: "triceps",     equipment: "cable",      tracking_mode: "weight_reps", unilateral: false,
    muscle_targets: [] },
  { name: "Plank",                  category: "isolation", primary_muscle: "abs",         equipment: "bodyweight", tracking_mode: "timed",       unilateral: false,
    muscle_targets: [{ muscle: "obliques", role: "secondary" }, { muscle: "lower_back", role: "tertiary" }] },
] as const

/**
 * Seeds 15 default exercises for a new user on first /workouts visit.
 * Idempotent — checks count before inserting.
 */
export async function seedExercisesIfNeeded(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from("exercises")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)

  if (count && count > 0) return

  const rows = SEED_EXERCISES.map(({ muscle_targets, ...e }) => ({
    ...e,
    // Phase 2R: this raw insert bypasses the shared exercise-validation
    // module entirely (seeded rows are system-authored, not a caller
    // payload), so exercise_type must be derived here explicitly, the
    // same way POST /api/exercises derives it from tracking_mode.
    exercise_type: deriveLegacyExerciseType(e.tracking_mode),
    user_id: userId,
    is_system: true,
    is_active: true,
  }))

  const { data: inserted, error } = await supabase
    .from("exercises").insert(rows).select("id, name")
  // Ignore unique-constraint errors from concurrent seed attempts
  if (error) {
    if (error.code !== "23505") console.error("seedExercises error:", error.message)
    return
  }

  // Phase 5A.6B: seed the secondary/tertiary relationship rows into
  // exercise_muscles (the authoritative table). Matched by name from
  // the insert we just performed for THIS user.
  const targetRows: Array<Record<string, unknown>> = []
  for (const seed of SEED_EXERCISES) {
    if (seed.muscle_targets.length === 0) continue
    const created = (inserted ?? []).find((r) => r.name === seed.name)
    if (!created) continue
    for (const target of seed.muscle_targets) {
      targetRows.push({
        user_id: userId,
        exercise_id: created.id,
        muscle: target.muscle,
        role: target.role,
      })
    }
  }
  if (targetRows.length > 0) {
    const { error: targetsError } = await supabase
      .from("exercise_muscles").insert(targetRows)
    if (targetsError && targetsError.code !== "23505") {
      console.error("seedExercises (exercise_muscles) error:", targetsError.message)
    }
  }
}
