import type { SupabaseClient } from "@supabase/supabase-js"
import { deriveLegacyExerciseType } from "@/lib/exercise-validation"

// Phase 2R: each seed exercise now specifies tracking_mode directly
// (the source of truth going forward) instead of the legacy
// exercise_type. Every value below was re-derived from this file's
// previous exercise_type literals using the approved mapping
// (barbell/dumbbell/cable/machine -> weight_reps, bodyweight ->
// bodyweight) -- confirmed to produce the exact same tracking
// behavior these 15 exercises already had.
export const SEED_EXERCISES = [
  { name: "Bench press",           category: "compound",  primary_muscle: "chest",      equipment: "barbell",    tracking_mode: "weight_reps", unilateral: false, secondary_muscles: ["triceps","shoulders"] },
  { name: "Incline dumbbell press",category: "compound",  primary_muscle: "chest",      equipment: "dumbbell",   tracking_mode: "weight_reps", unilateral: false, secondary_muscles: ["triceps","shoulders"] },
  { name: "Chest fly",             category: "isolation", primary_muscle: "chest",      equipment: "cable",      tracking_mode: "weight_reps", unilateral: false, secondary_muscles: [] },
  { name: "Lat pulldown",          category: "compound",  primary_muscle: "back",       equipment: "cable",      tracking_mode: "weight_reps", unilateral: false, secondary_muscles: ["biceps"] },
  { name: "Seated cable row",      category: "compound",  primary_muscle: "back",       equipment: "cable",      tracking_mode: "weight_reps", unilateral: false, secondary_muscles: ["biceps"] },
  { name: "Shoulder press",        category: "compound",  primary_muscle: "shoulders",  equipment: "dumbbell",   tracking_mode: "weight_reps", unilateral: false, secondary_muscles: ["triceps"] },
  { name: "Lateral raise",         category: "isolation", primary_muscle: "shoulders",  equipment: "dumbbell",   tracking_mode: "weight_reps", unilateral: true,  secondary_muscles: [] },
  { name: "Squat",                 category: "compound",  primary_muscle: "quads",      equipment: "barbell",    tracking_mode: "weight_reps", unilateral: false, secondary_muscles: ["glutes","hamstrings"] },
  { name: "Romanian deadlift",     category: "compound",  primary_muscle: "hamstrings", equipment: "barbell",    tracking_mode: "weight_reps", unilateral: false, secondary_muscles: ["glutes","back"] },
  { name: "Leg press",             category: "compound",  primary_muscle: "quads",      equipment: "machine",    tracking_mode: "weight_reps", unilateral: false, secondary_muscles: ["glutes"] },
  { name: "Leg curl",              category: "isolation", primary_muscle: "hamstrings", equipment: "machine",    tracking_mode: "weight_reps", unilateral: false, secondary_muscles: [] },
  { name: "Leg extension",         category: "isolation", primary_muscle: "quads",      equipment: "machine",    tracking_mode: "weight_reps", unilateral: false, secondary_muscles: [] },
  { name: "Biceps curl",           category: "isolation", primary_muscle: "biceps",     equipment: "dumbbell",   tracking_mode: "weight_reps", unilateral: true,  secondary_muscles: [] },
  { name: "Triceps pushdown",      category: "isolation", primary_muscle: "triceps",    equipment: "cable",      tracking_mode: "weight_reps", unilateral: false, secondary_muscles: [] },
  { name: "Plank",                 category: "isolation", primary_muscle: "core",       equipment: "bodyweight", tracking_mode: "bodyweight",  unilateral: false, secondary_muscles: [] },
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

  const rows = SEED_EXERCISES.map((e) => ({
    ...e,
    secondary_muscles: [...e.secondary_muscles],
    // Phase 2R: this raw insert bypasses the shared exercise-validation
    // module entirely (seeded rows are system-authored, not a caller
    // payload), so exercise_type must be derived here explicitly, the
    // same way POST /api/exercises derives it from tracking_mode.
    exercise_type: deriveLegacyExerciseType(e.tracking_mode),
    user_id: userId,
    is_system: true,
    is_active: true,
  }))

  const { error } = await supabase.from("exercises").insert(rows)
  // Ignore unique-constraint errors from concurrent seed attempts
  if (error && error.code !== "23505") {
    console.error("seedExercises error:", error.message)
  }
}
