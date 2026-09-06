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
//
//   - EXISTING USERS GET DELIVERY TOO (Codex round 1): the flag-ON
//     path carries NO client-side count guard. The database function
//     owns idempotence (skipped_already_delivered), per-user
//     collision handling, AND migration 026's pristine-Plank
//     reconciliation — an existing tenant with the original
//     bodyweight seed MUST reach the function for P2 correction to
//     ever run. Client-side short-circuiting on row count would
//     starve exactly those users; the legacy count guard belongs
//     only to the flag-OFF seed path (inside seedExercisesIfNeeded
//     itself).
//
//   - TIMEOUT AMBIGUITY, stated honestly (Codex round 1): the
//     timeout below abandons the WAIT — supabase-js RPC carries no
//     supported cancellation, so the already-started database
//     transaction may still commit after this request stops
//     listening. A timeout therefore means UNKNOWN EVENTUAL DELIVERY
//     OUTCOME, never proof that delivery did not occur. What the
//     fail-closed law guarantees is unchanged and is what matters:
//     the timed-out request NEVER seeds, and the next initialization
//     attempt reconciles safely because the database function is
//     idempotent per user. The timeout outcome is classified with
//     unknownDeliveryOutcome: true so callers and evidence never
//     misread it as a proven non-delivery.

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
  | { path: "delivered"; inserted: number; eligible: number; plankDisposition: string }
  | { path: "failed_closed"; reason: string; unknownDeliveryOutcome?: true }

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
  _userId: string,
): Promise<InitializeOutcome> {
  try {
    // NO client-side count guard here (Codex round 1): existing
    // users must reach the database function — it is idempotent per
    // user and performs the pristine-Plank reconciliation.
    const runKey = catalogDeliveryRunKey()
    if (runKey === null) {
      return failClosed("delivery is enabled but CATALOG_DELIVERY_RUN_KEY is not configured")
    }

    const attempt = await withTimeout(
      Promise.resolve(supabase.rpc("deliver_catalog_exercises", { p_run_key: runKey })),
      catalogDeliveryTimeoutMs(),
    )
    if (attempt.timedOut) {
      // UNKNOWN EVENTUAL OUTCOME: the wait was abandoned, not the
      // database transaction (no supported cancellation). No seeding
      // happened and none will; database idempotence reconciles the
      // next attempt.
      return {
        path: "failed_closed",
        reason: `delivery timed out after ${catalogDeliveryTimeoutMs()}ms; eventual delivery outcome UNKNOWN (the wait was abandoned, not the database transaction); no seeding occurred`,
        unknownDeliveryOutcome: true,
      }
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
    return {
      path: "delivered",
      inserted: summary.inserted,
      eligible: summary.eligible,
      plankDisposition: summary.plankDisposition,
    }
  } catch (e) {
    return failClosed(`delivery threw: ${e instanceof Error ? e.message : String(e)}`)
  }
}

function failClosed(reason: string): InitializeOutcome {
  console.error(`deliverCatalog failed closed (no seeding occurred): ${reason}`)
  return { path: "failed_closed", reason }
}

// The COMPLETE migration-026 delivery summary contract (Codex
// round 1: validate the whole shape, not a subset; Codex round 2:
// the accounting below is derived from the FULL function body, not
// just the RETURN). Derived mechanically from the function's RETURN
// jsonb_build_object: exactly these FOURTEEN keys, no more and no
// fewer; the run_key echoes the argument; every counter is a
// non-negative integer; collision_names is a string array;
// inserted_catalog_logical_ids is an array of well-formed UUIDs;
// plank_disposition is one of the seven schema-produced values; and
// the loop's own accounting holds. THE ACCOUNTING (Codex round 2):
// each eligible member lands in exactly one of inserted /
// skipped_already_delivered / skipped_name_collision, EXCEPT the
// successful P2 pristine-seed correction — that branch performs an
// in-place UPDATE, sets plank_disposition =
// 'corrected_and_linked_pristine_seed', and CONTINUEs WITHOUT
// incrementing any of the three counters (and without appending a
// logical id, so ids.length === inserted is unaffected), while
// v_eligible has already counted the row. Exactly one disposition
// value therefore carries an accounting offset of 1; every other
// CONTINUE path increments a counter first (already_valid_idempotent
// increments skipped_already_delivered; the collision skip
// increments skipped_name_collision and appends the name). Round 1
// asserted the sum WITHOUT this offset, which wrongly rejected a
// lawful committed Plank correction; corrected in round 2. Every
// insert appends one logical id; every name-collision skip appends
// one collision name. Anything else is malformed and fails closed.
const SUMMARY_KEYS = [
  "run_key", "eligible", "inserted", "skipped_already_delivered",
  "skipped_name_collision", "collision_names", "alias_inserted",
  "alias_added_to_existing", "alias_already_delivered",
  "alias_skipped_no_exercise", "alias_skipped_inactive_exercise",
  "alias_skipped_collision", "inserted_catalog_logical_ids",
  "plank_disposition",
] as const
const SUMMARY_COUNTERS = [
  "eligible", "inserted", "skipped_already_delivered",
  "skipped_name_collision", "alias_inserted", "alias_added_to_existing",
  "alias_already_delivered", "alias_skipped_no_exercise",
  "alias_skipped_inactive_exercise", "alias_skipped_collision",
] as const
const PLANK_DISPOSITIONS = [
  "not_in_run", "already_valid_idempotent",
  "corrected_and_linked_pristine_seed", "delivered_canonical_timed_plank",
  "precondition_failure_preserved_legacy_plus_distinguished_delivery",
  "delivered_distinguished_timed_plank",
  "skipped_canonical_and_distinguished_collision",
] as const
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
function isNonNegativeInt(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0
}
function parseDeliverySummary(
  data: unknown,
  expectedRunKey: string,
): { inserted: number; eligible: number; plankDisposition: string } | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null
  const obj = data as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  if (JSON.stringify(keys) !== JSON.stringify([...SUMMARY_KEYS].sort())) return null
  if (obj.run_key !== expectedRunKey) return null
  for (const k of SUMMARY_COUNTERS) {
    if (!isNonNegativeInt(obj[k])) return null
  }
  const collisions = obj.collision_names
  if (!Array.isArray(collisions) || !collisions.every((n) => typeof n === "string")) return null
  const logicalIds = obj.inserted_catalog_logical_ids
  if (!Array.isArray(logicalIds) ||
    !logicalIds.every((id) => typeof id === "string" && UUID_RE.test(id))) return null
  if (typeof obj.plank_disposition !== "string" ||
    !(PLANK_DISPOSITIONS as readonly string[]).includes(obj.plank_disposition)) return null
  const eligible = obj.eligible as number
  const inserted = obj.inserted as number
  const skippedExisting = obj.skipped_already_delivered as number
  const skippedCollision = obj.skipped_name_collision as number
  // The loop accounting, derived from the FULL function body (Codex
  // round 2): the successful P2 correction CONTINUEs without
  // touching the three counters, so that one disposition — and only
  // that one — explains an offset of exactly 1 against eligible.
  const correctedInPlace =
    obj.plank_disposition === "corrected_and_linked_pristine_seed" ? 1 : 0
  if (inserted + skippedExisting + skippedCollision + correctedInPlace !== eligible) return null
  if (logicalIds.length !== inserted) return null
  if (collisions.length !== skippedCollision) return null
  return { inserted, eligible, plankDisposition: obj.plank_disposition }
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
