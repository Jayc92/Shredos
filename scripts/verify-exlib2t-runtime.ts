// EXLIB-2T RUNTIME behavior tests (LOCAL-ONLY): the delivery-runtime
// entry point exercised against a FAKE in-memory Supabase client —
// no network, no hosted contact, no real database of any kind.
//
// Proves behaviorally what the activation design demands of S3:
//   - the flag defaults STRICTLY OFF (absent, empty, "false", "1",
//     "TRUE", padded variants — every non-exact value stays OFF), and
//     OFF runs the pre-existing seed path exactly once, idempotently,
//     never touching the delivery RPC;
//   - the flag-ON path is delivery-first and FAILS CLOSED — without
//     EVER invoking the seed — for every failure class the design
//     names: rejected delivery (database error), thrown client,
//     timeout (a never-resolving RPC), malformed response (wrong
//     shape, wrong run_key echo, non-integer counters), and the
//     unavailable path of a missing run-key configuration (which must
//     fail closed BEFORE any RPC is attempted);
//   - the ON path's success and already-initialized branches likewise
//     never touch the seed;
//   - across EVERY flag-ON scenario in this suite, the fake client
//     records ZERO seed-signature inserts (the cross-cutting proof
//     that no failure class can fall through to a seed row — with the
//     timed Plank seed live post-S7, exactly this property keeps the
//     prohibited unlinked-timed state impossible).
//
// Fail-closed: any mismatch fails the suite.
import { initializeExercisesIfNeeded } from '../src/lib/supabase/deliver-catalog'
import type { SupabaseClient } from '@supabase/supabase-js'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean, detail?: string): void => {
  if (ok) { passed += 1; console.log(`  PASS  ${name}`) }
  else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

type RpcResult = { data: unknown; error: { message: string } | null }
interface FakeOptions {
  existingCount?: number
  rpc?: () => Promise<RpcResult> | RpcResult
  rpcNeverResolves?: boolean
  rpcThrows?: boolean
}
interface FakeLog {
  rpcCalls: Array<{ fn: string; args: unknown }>
  exerciseInserts: number
  muscleInserts: number
  countQueries: number
}

// The narrow surface both code paths use: from('exercises') count
// select + insert().select(), from('exercise_muscles') insert, rpc().
function makeFake(opts: FakeOptions): { client: SupabaseClient; log: FakeLog } {
  const log: FakeLog = { rpcCalls: [], exerciseInserts: 0, muscleInserts: 0, countQueries: 0 }
  const client = {
    from(table: string) {
      if (table === 'exercises') {
        return {
          select(_cols: string, options?: { count?: string; head?: boolean }) {
            if (options?.count === 'exact') {
              return {
                eq: async () => {
                  log.countQueries += 1
                  return { count: opts.existingCount ?? 0, error: null }
                },
              }
            }
            throw new Error('unexpected exercises select shape')
          },
          insert(rows: Array<{ name: string }>) {
            log.exerciseInserts += rows.length
            return {
              select: async () => ({
                data: rows.map((r, i) => ({ id: `fake-${i}`, name: r.name })),
                error: null,
              }),
            }
          },
        }
      }
      if (table === 'exercise_muscles') {
        return {
          insert: async (rows: unknown[]) => {
            log.muscleInserts += rows.length
            return { error: null }
          },
        }
      }
      throw new Error(`unexpected table ${table}`)
    },
    rpc(fn: string, args: unknown) {
      log.rpcCalls.push({ fn, args })
      if (opts.rpcThrows) {
        return Promise.reject(new Error('socket destroyed'))
      }
      if (opts.rpcNeverResolves) {
        return new Promise(() => { /* never settles: the timeout class */ })
      }
      const r = opts.rpc ? opts.rpc() : { data: null, error: { message: 'no rpc behavior configured' } }
      return Promise.resolve(r)
    },
  }
  return { client: client as unknown as SupabaseClient, log }
}

const ENV_KEYS = ['CATALOG_DELIVERY_ENABLED', 'CATALOG_DELIVERY_RUN_KEY', 'CATALOG_DELIVERY_TIMEOUT_MS'] as const
function setEnv(env: Partial<Record<(typeof ENV_KEYS)[number], string>>): void {
  for (const k of ENV_KEYS) {
    if (env[k] === undefined) delete process.env[k]
    else process.env[k] = env[k]
  }
}
const RUN_KEY = 'release1-fixture-run-key'
const goodSummary = (): RpcResult => ({
  data: {
    run_key: RUN_KEY, eligible: 25, inserted: 25,
    skipped_already_delivered: 0, skipped_name_collision: 0, collision_names: [],
    alias_inserted: 3, alias_added_to_existing: 0, alias_already_delivered: 0,
    alias_skipped_no_exercise: 0, alias_skipped_inactive_exercise: 0, alias_skipped_collision: 0,
    inserted_catalog_logical_ids: [], plank_disposition: 'corrected_and_linked_pristine_seed',
  },
  error: null,
})

// Cross-cutting tally: seed-signature inserts observed during ANY
// flag-ON scenario anywhere in this suite.
let onPathSeedInserts = 0

async function main(): Promise<void> {
  console.log('EXLIB-2T runtime behavior verification (fake client; no network, no hosted contact)')

  console.log('\nA. The flag defaults STRICTLY OFF and OFF preserves the seed path unchanged')
  {
    setEnv({})
    let fake = makeFake({ existingCount: 0 })
    let out = await initializeExercisesIfNeeded(fake.client, 'user-1')
    check('A1: flag ABSENT — the seed path runs (15 exercise rows + anatomy rows inserted for a zero-exercise user), the outcome is "seeded", and the delivery RPC is NEVER called',
      out.path === 'seeded' && fake.log.exerciseInserts === 15 &&
      fake.log.muscleInserts > 0 && fake.log.rpcCalls.length === 0)

    setEnv({})
    fake = makeFake({ existingCount: 7 })
    out = await initializeExercisesIfNeeded(fake.client, 'user-1')
    check('A2: flag ABSENT, user already initialized — the seed path\'s own idempotent count guard inserts nothing and the RPC is never called',
      out.path === 'seeded' && fake.log.exerciseInserts === 0 && fake.log.rpcCalls.length === 0)

    let allOff = true
    for (const v of ['false', '1', 'TRUE', 'True', ' true', 'true ', 'yes', 'on', '']) {
      setEnv({ CATALOG_DELIVERY_ENABLED: v })
      fake = makeFake({ existingCount: 0 })
      out = await initializeExercisesIfNeeded(fake.client, 'user-1')
      if (!(out.path === 'seeded' && fake.log.rpcCalls.length === 0 && fake.log.exerciseInserts === 15)) {
        allOff = false
        console.log(`        non-exact value ${JSON.stringify(v)} did not stay OFF`)
      }
    }
    check('A3: every NON-EXACT flag value stays OFF — "false", "1", "TRUE", "True", " true", "true ", "yes", "on", and empty all run the seed path and never the RPC (only the exact string "true" enables delivery)',
      allOff)
  }

  console.log('\nB. Flag ON: delivery-first, and every failure class FAILS CLOSED without seeding')
  {
    const onEnv = { CATALOG_DELIVERY_ENABLED: 'true', CATALOG_DELIVERY_RUN_KEY: RUN_KEY }

    setEnv({ CATALOG_DELIVERY_ENABLED: 'true' })
    let fake = makeFake({ existingCount: 0 })
    let out = await initializeExercisesIfNeeded(fake.client, 'user-1')
    onPathSeedInserts += fake.log.exerciseInserts
    check('B1: UNAVAILABLE PATH (no run key configured) — fails closed BEFORE any RPC attempt: outcome failed_closed naming the missing configuration, zero RPC calls, zero seed inserts',
      out.path === 'failed_closed' && out.reason.includes('CATALOG_DELIVERY_RUN_KEY') &&
      fake.log.rpcCalls.length === 0 && fake.log.exerciseInserts === 0)

    setEnv(onEnv)
    fake = makeFake({ existingCount: 0, rpc: () => ({ data: null, error: { message: 'no sealed, approved, unrevoked delivery run for this key' } }) })
    out = await initializeExercisesIfNeeded(fake.client, 'user-1')
    onPathSeedInserts += fake.log.exerciseInserts
    check('B2: REJECTED DELIVERY (the database refuses: no sealed/approved/unrevoked run) — fails closed with the database\'s reason, exactly one RPC attempt, zero seed inserts',
      out.path === 'failed_closed' && out.reason.includes('no sealed, approved, unrevoked delivery run') &&
      fake.log.rpcCalls.length === 1 && fake.log.exerciseInserts === 0)

    setEnv(onEnv)
    fake = makeFake({ existingCount: 0, rpcThrows: true })
    out = await initializeExercisesIfNeeded(fake.client, 'user-1')
    onPathSeedInserts += fake.log.exerciseInserts
    check('B3: THROWN CLIENT (transport rejection) — fails closed via the exception boundary, zero seed inserts',
      out.path === 'failed_closed' && out.reason.includes('socket destroyed') && fake.log.exerciseInserts === 0)

    setEnv({ ...onEnv, CATALOG_DELIVERY_TIMEOUT_MS: '50' })
    fake = makeFake({ existingCount: 0, rpcNeverResolves: true })
    const t0 = Date.now()
    out = await initializeExercisesIfNeeded(fake.client, 'user-1')
    const elapsed = Date.now() - t0
    onPathSeedInserts += fake.log.exerciseInserts
    check('B4: TIMEOUT (the RPC never settles) — fails closed within the configured budget (50ms here; elapsed under 5s proves the race, not the RPC, resolved the request), one RPC attempt, zero seed inserts',
      out.path === 'failed_closed' && out.reason.includes('timed out') &&
      elapsed < 5000 && fake.log.rpcCalls.length === 1 && fake.log.exerciseInserts === 0)

    let allMalformed = true
    const malformedCases: Array<[string, unknown]> = [
      ['null data', null],
      ['array data', [1, 2, 3]],
      ['string data', 'ok'],
      ['wrong run_key echo', { ...goodSummary().data as object, run_key: 'some-other-run' }],
      ['missing counters', { run_key: RUN_KEY }],
      ['non-integer inserted', { run_key: RUN_KEY, eligible: 25, inserted: 3.5 }],
      ['negative eligible', { run_key: RUN_KEY, eligible: -1, inserted: 0 }],
    ]
    for (const [label, data] of malformedCases) {
      setEnv(onEnv)
      fake = makeFake({ existingCount: 0, rpc: () => ({ data, error: null }) })
      out = await initializeExercisesIfNeeded(fake.client, 'user-1')
      onPathSeedInserts += fake.log.exerciseInserts
      if (!(out.path === 'failed_closed' && out.reason.includes('malformed') && fake.log.exerciseInserts === 0)) {
        allMalformed = false
        console.log(`        malformed case not failed closed: ${label} -> ${JSON.stringify(out)}`)
      }
    }
    check('B5: MALFORMED RESPONSE — all seven malformed shapes (null/array/string data, a wrong run_key echo, missing counters, a non-integer counter, a negative counter) fail closed with zero seed inserts',
      allMalformed)

    setEnv(onEnv)
    fake = makeFake({ existingCount: 0, rpc: () => ({ data: null, error: { message: 'deliver_catalog_exercises: not authenticated' } }) })
    out = await initializeExercisesIfNeeded(fake.client, 'user-1')
    onPathSeedInserts += fake.log.exerciseInserts
    check('B6: UNAUTHENTICATED refusal from the function — fails closed like any rejection, zero seed inserts',
      out.path === 'failed_closed' && out.reason.includes('not authenticated') && fake.log.exerciseInserts === 0)
  }

  console.log('\nC. Flag ON: the healthy branches also never touch the seed')
  {
    const onEnv = { CATALOG_DELIVERY_ENABLED: 'true', CATALOG_DELIVERY_RUN_KEY: RUN_KEY }

    setEnv(onEnv)
    let fake = makeFake({ existingCount: 0, rpc: goodSummary })
    let out = await initializeExercisesIfNeeded(fake.client, 'user-1')
    onPathSeedInserts += fake.log.exerciseInserts
    check('C1: SUCCESSFUL DELIVERY — outcome "delivered" with the summary\'s integer counters (inserted 25 of eligible 25), exactly one RPC call carrying the configured p_run_key, zero seed inserts',
      out.path === 'delivered' && out.inserted === 25 && out.eligible === 25 &&
      fake.log.rpcCalls.length === 1 &&
      JSON.stringify(fake.log.rpcCalls[0]) === JSON.stringify({ fn: 'deliver_catalog_exercises', args: { p_run_key: RUN_KEY } }) &&
      fake.log.exerciseInserts === 0)

    setEnv(onEnv)
    fake = makeFake({ existingCount: 12, rpc: goodSummary })
    out = await initializeExercisesIfNeeded(fake.client, 'user-1')
    onPathSeedInserts += fake.log.exerciseInserts
    check('C2: ALREADY-INITIALIZED user — the count guard returns before any RPC or insert (idempotence preserved on the delivery path too)',
      out.path === 'already_initialized' && fake.log.rpcCalls.length === 0 && fake.log.exerciseInserts === 0)

    check('C3: CROSS-CUTTING FAIL-CLOSED PROOF — across EVERY flag-ON scenario in this suite (all failure classes and both healthy branches), the fake client observed ZERO seed-signature exercise inserts: no path with the flag ON can fall through to a seed row',
      onPathSeedInserts === 0)
  }

  setEnv({})
  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
