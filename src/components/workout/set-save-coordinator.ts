// ============================================================
// ForgeFitOS — Set-save coordinator (UI-5B1B security correction)
// Deterministic ordering between SetRow blur saves and the
// Apply-to-remaining action. Clicking Apply blurs the focused input,
// which STARTS a save request; without coordination the Apply
// request can reach the server before that save commits and copy the
// OLD persisted first-set values into blank sets (which blank-only
// idempotence would then never repair).
//
// Every SetRow save registers its in-flight promise here, keyed by
// the parent workout exercise id. Apply awaits the ENTIRE pending
// pool (including saves that start while waiting) and receives an
// honest verdict: true only if every awaited save succeeded. No
// timeouts, no delays, no assumptions about request ordering — the
// await IS the ordering.
// ============================================================

const pendingByExercise = new Map<string, Set<Promise<boolean>>>()

/** Register an in-flight set save. Returns the same promise so the
 *  caller's own await/rollback behavior is completely unchanged. */
export function trackSetSave(
  workoutExerciseId: string,
  save: Promise<boolean>
): Promise<boolean> {
  let pool = pendingByExercise.get(workoutExerciseId)
  if (!pool) {
    pool = new Set()
    pendingByExercise.set(workoutExerciseId, pool)
  }
  pool.add(save)
  const cleanup = () => {
    const current = pendingByExercise.get(workoutExerciseId)
    if (!current) return
    current.delete(save)
    if (current.size === 0) pendingByExercise.delete(workoutExerciseId)
  }
  save.then(cleanup, cleanup)
  return save
}

/** Await every pending save for this exercise (looping until the
 *  pool drains, so saves that begin mid-wait are covered too).
 *  Resolves true only if every awaited save reported success. */
export async function awaitPendingSetSaves(
  workoutExerciseId: string
): Promise<boolean> {
  let allSucceeded = true
  for (;;) {
    const pool = pendingByExercise.get(workoutExerciseId)
    if (!pool || pool.size === 0) return allSucceeded
    const batch = Array.from(pool)
    const results = await Promise.all(
      batch.map((p) => p.catch(() => false))
    )
    if (results.some((ok) => !ok)) allSucceeded = false
  }
}

/** Test/inspection hook: number of in-flight saves for an exercise. */
export function pendingSetSaveCount(workoutExerciseId: string): number {
  return pendingByExercise.get(workoutExerciseId)?.size ?? 0
}
