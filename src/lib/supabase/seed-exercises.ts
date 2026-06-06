import type { SupabaseClient } from "@supabase/supabase-js"

export const SEED_EXERCISES = [
  { name: "Bench press",           category: "compound",  primary_muscle: "chest",      equipment: "barbell",    exercise_type: "barbell",    unilateral: false, secondary_muscles: ["triceps","shoulders"] },
  { name: "Incline dumbbell press",category: "compound",  primary_muscle: "chest",      equipment: "dumbbell",   exercise_type: "dumbbell",   unilateral: false, secondary_muscles: ["triceps","shoulders"] },
  { name: "Chest fly",             category: "isolation", primary_muscle: "chest",      equipment: "cable",      exercise_type: "cable",      unilateral: false, secondary_muscles: [] },
  { name: "Lat pulldown",          category: "compound",  primary_muscle: "back",       equipment: "cable",      exercise_type: "cable",      unilateral: false, secondary_muscles: ["biceps"] },
  { name: "Seated cable row",      category: "compound",  primary_muscle: "back",       equipment: "cable",      exercise_type: "cable",      unilateral: false, secondary_muscles: ["biceps"] },
  { name: "Shoulder press",        category: "compound",  primary_muscle: "shoulders",  equipment: "dumbbell",   exercise_type: "dumbbell",   unilateral: false, secondary_muscles: ["triceps"] },
  { name: "Lateral raise",         category: "isolation", primary_muscle: "shoulders",  equipment: "dumbbell",   exercise_type: "dumbbell",   unilateral: true,  secondary_muscles: [] },
  { name: "Squat",                 category: "compound",  primary_muscle: "quads",      equipment: "barbell",    exercise_type: "barbell",    unilateral: false, secondary_muscles: ["glutes","hamstrings"] },
  { name: "Romanian deadlift",     category: "compound",  primary_muscle: "hamstrings", equipment: "barbell",    exercise_type: "barbell",    unilateral: false, secondary_muscles: ["glutes","back"] },
  { name: "Leg press",             category: "compound",  primary_muscle: "quads",      equipment: "machine",    exercise_type: "machine",    unilateral: false, secondary_muscles: ["glutes"] },
  { name: "Leg curl",              category: "isolation", primary_muscle: "hamstrings", equipment: "machine",    exercise_type: "machine",    unilateral: false, secondary_muscles: [] },
  { name: "Leg extension",         category: "isolation", primary_muscle: "quads",      equipment: "machine",    exercise_type: "machine",    unilateral: false, secondary_muscles: [] },
  { name: "Biceps curl",           category: "isolation", primary_muscle: "biceps",     equipment: "dumbbell",   exercise_type: "dumbbell",   unilateral: true,  secondary_muscles: [] },
  { name: "Triceps pushdown",      category: "isolation", primary_muscle: "triceps",    equipment: "cable",      exercise_type: "cable",      unilateral: false, secondary_muscles: [] },
  { name: "Plank",                 category: "isolation", primary_muscle: "core",       equipment: "bodyweight", exercise_type: "bodyweight", unilateral: false, secondary_muscles: [] },
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
