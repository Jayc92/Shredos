import type { SupabaseClient } from "@supabase/supabase-js"
import { seedExercisesIfNeeded } from "./seed-exercises"

// EXLIB-2T — catalog delivery runtime (activation design state S3).
//
// This module is the ONLY initialization entry point the application
// uses (every former direct seedExercisesIfNeeded call site now goes
// through initializeExercisesIfNeeded). It exists so the runtime can
// be DEPLOYED while remaining behaviorally inert:
//
//   - THE FLAG DEFAULTS STRICTLY OFF. Delivery runs only when
//     CATALOG_DELIVERY_ENABLED is EXACTLY the string "true". Absent,
//     empty, "false", "1", "TRUE", "yes" — anything else — means OFF,
//     and OFF means the pre-existing seed path runs byte-for-byte
//     unchanged. Enabling the flag is the activation design's S6
//     event and is NOT part of this milestone.
//
//   - THE FAIL-CLOSED LAW (the activation design's post-S7 rule,
//     implemented from day one): when the flag is ON, a delivery
//     failure of ANY kind — a rejected or missing run, a database
//     error, a timeout, a malformed response, a missing run-key
//     configuration, or an unexpected exception — ends this request's
//     initialization WITHOUT seeding. The flag-ON path structurally
//     cannot reach seedExercisesIfNeeded: the identifier appears
//     NOWHERE below the deliverCatalogFirst marker line, which
//     scripts/verify-exlib2t.ts proves mechanically, and
//     scripts/verify-exlib2t-runtime.ts proves behaviorally for every
//     failure class. A temporary inability to initialize exercises is
//     the design-accepted safe outcome; a fallback seed row is not.
//
//   - The delivery call is migration 023/026's
//     public.deliver_catalog_exercises(p_run_key TEXT) over the
//     authenticated user's own connection (EXECUTE is granted to
//     authenticated; the database's sealed/approved/unrevoked run
//     predicate — not this flag — is the security boundary). The run
//     key names WHICH sealed run to deliver and comes from
//     CATALOG_DELIVERY_RUN_KEY; with the flag ON and no key the path
//     fails closed without calling the database.

export function isCatalogDeliveryEnabled(): boolean {
  return process.env.CATALOG_DELIVERY_ENABLED === "true"
}

export function catalogDeliveryRunKey(): string | null {
  const key = process.env.CATALOG_DELIVERY_RUN_KEY
  if (typeof key !== "string" || key.trim().length === 0) return null
  return key
}

// Operational knob only (never a behavior flag): how long one
// delivery attempt may run before this request fails closed. The
// default matches interactive page budgets; tests exercise the
// timeout class by shrinking it.
const DEFAULT_DELIVERY_TIMEOUT_MS = 10_000
export function catalogDeliveryTimeoutMs(): number {
  const raw = process.env.CATALOG_DELIVERY_TIMEOUT_MS
  if (typeof raw !== "string" || raw.trim() === "") return DEFAULT_DELIVERY_TIMEOUT_MS
  const n = Number(raw)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return DEFAULT_DELIVERY_TIMEOUT_MS
  return n
}

export type InitializeOutcome =
  | { path: "seeded" }
  | { path: "already_initialized" }
  | { path: "delivered"; inserted: number; eligible: number }
  | { path: "failed_closed"; reason: string }

/**
 * The single initialization entry point. Flag OFF (the strict
 * default): the pre-existing idempotent seed path, unchanged. Flag
 * ON: delivery-first with the fail-closed law above.
 */
export async function initializeExercisesIfNeeded(
  supabase: SupabaseClient,
  userId: string,
): Promise<InitializeOutcome> {
  if (!isCatalogDeliveryEnabled()) {
    await seedExercisesIfNeeded(supabase, userId)
    return { path: "seeded" }
  }
  return deliverCatalogFirst(supabase, userId)
}

// ─────────────────────────────────────────────────────────────────
// FAIL-CLOSED REGION — nothing below this line may reference the
// seed path, in any branch, ever. (verify-exlib2t.ts asserts the
// seed identifier count above/below this exact marker.)
// ─────────────────────────────────────────────────────────────────

async function deliverCatalogFirst(
  supabase: SupabaseClient,
  userId: string,
): Promise<InitializeOutcome> {
  try {
    const { count, error: countError } = await supabase
      .from("exercises")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
    if (countError) {
      return failClosed(`initialization count guard failed: ${countError.message}`)
    }
    if (count && count > 0) return { path: "already_initialized" }

    const runKey = catalogDeliveryRunKey()
    if (runKey === null) {
      return failClosed("delivery is enabled but CATALOG_DELIVERY_RUN_KEY is not configured")
    }

    const attempt = await withTimeout(
      Promise.resolve(supabase.rpc("deliver_catalog_exercises", { p_run_key: runKey })),
      catalogDeliveryTimeoutMs(),
    )
    if (attempt.timedOut) {
      return failClosed(`delivery timed out after ${catalogDeliveryTimeoutMs()}ms`)
    }

    const { data, error } = attempt.value as {
      data: unknown
      error: { message?: string } | null
    }
    if (error) {
      return failClosed(`delivery rejected: ${error.message ?? "unknown database error"}`)
    }
    const summary = parseDeliverySummary(data, runKey)
    if (summary === null) {
      return failClosed("delivery returned a malformed response")
    }
    return { path: "delivered", inserted: summary.inserted, eligible: summary.eligible }
  } catch (e) {
    return failClosed(`delivery threw: ${e instanceof Error ? e.message : String(e)}`)
  }
}

function failClosed(reason: string): InitializeOutcome {
  console.error(`deliverCatalog failed closed (no seeding occurred): ${reason}`)
  return { path: "failed_closed", reason }
}

// The migration-026 delivery summary is a JSONB object whose
// run_key echoes the argument and whose counters are non-negative
// integers; anything else is malformed and fails closed.
function parseDeliverySummary(
  data: unknown,
  expectedRunKey: string,
): { inserted: number; eligible: number } | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null
  const obj = data as Record<string, unknown>
  if (obj.run_key !== expectedRunKey) return null
  const inserted = obj.inserted
  const eligible = obj.eligible
  if (typeof inserted !== "number" || !Number.isInteger(inserted) || inserted < 0) return null
  if (typeof eligible !== "number" || !Number.isInteger(eligible) || eligible < 0) return null
  return { inserted, eligible }
}

async function withTimeout<T>(
  work: Promise<T>,
  ms: number,
): Promise<{ timedOut: false; value: T } | { timedOut: true }> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      work.then((value) => ({ timedOut: false as const, value })),
      new Promise<{ timedOut: true }>((resolve) => {
        timer = setTimeout(() => resolve({ timedOut: true }), ms)
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}
