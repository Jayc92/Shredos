// ============================================================
// ForgeFitOS — UI-5B2 workout-reuse harness (migration phase)
// Proves migration 022's two SECURITY INVOKER functions at the
// source-contract level (auth, ownership, eligible status, single
// transaction, captured-order copy, grants) and the copy matrices at
// the runtime level with deterministic simulations that mirror the
// SQL semantics exactly. The UI/route slice is NOT implemented yet —
// this suite also pins that boundary.
// Run from the repository root:
//   npx tsx scripts/verify-ui5b2.ts
// ============================================================

import { readFileSync, readdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import React from 'react'
;(globalThis as any).React = React
import { renderToStaticMarkup } from 'react-dom/server'

// Client components render through the require-hook next/navigation
// stub (the established harness pattern).
const Module = require('module')
const origLoad = Module._load
Module._load = function (request: string) {
  if (request === 'next/navigation') {
    return {
      useRouter: () => ({ push() {}, replace() {}, refresh() {}, back() {}, prefetch() {} }),
      usePathname: () => '/workouts/abc',
      useSearchParams: () => new URLSearchParams(),
    }
  }
  return origLoad.apply(this, arguments as any)
}

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string) => readFileSync(p, 'utf8')
const stripSqlComments = (s: string) => s.replace(/^\s*--.*$/gm, '')

const MIGRATION = 'supabase/migrations/022_ui5b2_workout_reuse.sql'
const sql = read(MIGRATION)
const sqlCode = stripSqlComments(sql)
const createFn = sqlCode.slice(
  sqlCode.indexOf('CREATE OR REPLACE FUNCTION create_routine_from_workout'),
  sqlCode.indexOf('CREATE OR REPLACE FUNCTION repeat_workout'))
const repeatFn = sqlCode.slice(
  sqlCode.indexOf('CREATE OR REPLACE FUNCTION repeat_workout'),
  sqlCode.indexOf('REVOKE ALL'))

async function main() {
  // ── 1. SQL contract: security and shape ─────────────────────────────
  console.log('\n1. SQL contract: security and shape')
  {
    check('M1: exactly two functions, both SECURITY INVOKER with fixed search_path incl. pg_temp',
      (sqlCode.match(/CREATE OR REPLACE FUNCTION/g) || []).length === 2 &&
      (sqlCode.match(/SECURITY INVOKER/g) || []).length === 2 &&
      (sqlCode.match(/SET search_path = public, pg_temp/g) || []).length === 2 &&
      !sqlCode.includes('SECURITY DEFINER'))
    check('M2: auth.uid() non-null guard in both bodies',
      (sqlCode.match(/v_uid := auth\.uid\(\)/g) || []).length === 2 &&
      (sqlCode.match(/RAISE EXCEPTION 'not_authenticated'/g) || []).length === 2)
    check('M3: explicit source-owner predicate in both (RLS is the floor, not the only wall)',
      (sqlCode.match(/ws\.user_id = v_uid/g) || []).length >= 2 &&
      createFn.includes('WHERE ws.id = p_workout_session_id AND ws.user_id = v_uid') &&
      repeatFn.includes('WHERE ws.id = p_workout_session_id AND ws.user_id = v_uid'))
    check('M4: eligible source status validated (create: live/completed; repeat: completed only)',
      createFn.includes("IF v_status NOT IN ('in_progress', 'completed') THEN") &&
      repeatFn.includes("IF v_source.status <> 'completed' THEN"))
    check('M5: one transaction per RPC — no compensating cleanup, no writes to the source',
      !/\bDELETE\b/i.test(sqlCode) &&
      // Row locks (FOR UPDATE / FOR SHARE) are reads; the ONLY
      // UPDATE tokens allowed are those lock clauses — no UPDATE
      // statement exists.
      !/(?<!FOR )\bUPDATE\b/i.test(sqlCode) &&
      !sqlCode.includes('pg_advisory') &&
      !/service_role/i.test(sql))
    check('M6: bounded input mirroring 021 ceilings — 500 exercises AND 5000 sets in BOTH functions',
      createFn.includes('> 500') && repeatFn.includes('> 500') &&
      createFn.includes('> 5000') && repeatFn.includes('> 5000') &&
      createFn.includes('SELECT COUNT(*) INTO v_set_count'))
    check('M7: signature-exact revoke/grant pairs; nothing granted to anon or PUBLIC',
      sql.includes('REVOKE ALL ON FUNCTION create_routine_from_workout(UUID, TEXT, TEXT) FROM PUBLIC, anon;') &&
      sql.includes('REVOKE ALL ON FUNCTION repeat_workout(UUID, DATE) FROM PUBLIC, anon;') &&
      sql.includes('GRANT EXECUTE ON FUNCTION create_routine_from_workout(UUID, TEXT, TEXT) TO authenticated;') &&
      sql.includes('GRANT EXECUTE ON FUNCTION repeat_workout(UUID, DATE) TO authenticated;') &&
      !/GRANT[^;]*TO[^;]*(anon|PUBLIC)/i.test(sqlCode))
    check('M8: return shapes carry only the created id or the established conflict code',
      createFn.includes("jsonb_build_object('routine_id', v_routine_id)") &&
      repeatFn.includes("jsonb_build_object('session_id', v_session_id)") &&
      (repeatFn.match(/'error', 'active_workout_exists',\s*\n?\s*'active_workout_id', v_active_id/g) || []).length === 2)
    const buf = readFileSync(MIGRATION)
    console.log(`  INFO  migration 022: ${buf.length} bytes, sha256 ${createHash('sha256').update(buf).digest('hex')}`)
  }

  // ── 2. SQL contract: concurrency ────────────────────────────────────
  console.log('\n2. SQL contract: concurrency')
  {
    check('C1: duplicate names resolved by the EXISTING case-insensitive unique index',
      createFn.includes('EXCEPTION WHEN unique_violation THEN') &&
      createFn.includes("SQLERRM LIKE '%workout_routines_user_name_idx%'") &&
      createFn.includes("RETURN jsonb_build_object('error', 'duplicate_name')") &&
      createFn.includes('RAISE;'))
    check('C2: active-workout precheck uses the exact migration-008 index predicate',
      repeatFn.includes("AND ws.status = 'in_progress'") &&
      repeatFn.includes('AND ws.completed_duration_seconds IS NULL'))
    check('C3: precheck race closed by the 008 partial unique index on the session insert itself',
      repeatFn.includes('EXCEPTION WHEN unique_violation THEN') &&
      repeatFn.includes("SQLERRM LIKE '%workout_sessions_one_active_training_per_user_idx%'") &&
      repeatFn.includes('RAISE;'))
    // RETARGET (UI-5B2 final review): original boundary — no
    // ROW_NUMBER anywhere in repeat. The final correction NORMALIZES
    // set numbering with exactly one ROW_NUMBER window over the sets
    // (PARTITION BY exercise, (set_number, id) order); exercise
    // positions still come only from the captured array, so the
    // no-order-re-read property is now pinned precisely instead of
    // by a blanket token ban.
    check('C4: repeat captures the authoritative source order ONCE and derives every position from it',
      repeatFn.includes('SELECT array_agg(locked.id ORDER BY locked.order_index, locked.id)') &&
      (repeatFn.match(/unnest\(v_src_ids\) WITH ORDINALITY AS src\(id, ord\)/g) || []).length === 2 &&
      !repeatFn.includes('ROW_NUMBER() OVER (ORDER BY we.order_index'))
    check('C6: repeat locks the SOURCE in the 021 parent-before-children order — session, exercises, sets',
      (() => {
        const parent = repeatFn.indexOf('FOR UPDATE;\n  IF v_source.id IS NULL')
        const exLock = repeatFn.indexOf('ORDER BY we.id\n    FOR UPDATE')
        const setLock = repeatFn.indexOf('ORDER BY s.id\n  FOR UPDATE')
        return parent > -1 && exLock > parent && setLock > exLock
      })())
    check('C7: exercise locks ride the capture subquery (aggregate outside, FOR UPDATE inside, id order)',
      repeatFn.includes('FROM (\n    SELECT we.id, we.order_index') &&
      repeatFn.includes('ORDER BY we.id\n    FOR UPDATE\n  ) locked'))
    check('C8: set rows locked in deterministic id order and the 5000 bound counted AFTER the freeze',
      repeatFn.indexOf('ORDER BY s.id') < repeatFn.indexOf('SELECT COUNT(*) INTO v_set_count') &&
      repeatFn.includes("WHERE s.workout_exercise_id = ANY (v_src_ids)"))
    check('C9: dense-exact order guaranteed; every superseded consistency claim is gone',
      sql.includes('dense and exact: positions 0..n-1 with no vacancies') &&
      !sql.includes('simply drops') &&
      !sql.includes('position stays vacant') &&
      !sql.includes('no locks on the source are needed') &&
      !sql.includes('one MVCC snapshot') &&
      !sql.includes('deliberately NOT'))
    // RETARGET (UI-5B2 review round 3): original boundary — create
    // held only a parent FOR SHARE and copied from a fresh snapshot,
    // which let a live workout gain children between the bounds check
    // and the copy. Superseded: create now uses the SAME three-step
    // freeze as repeat_workout, and both are proven positionally
    // below (C5/C10/C11/C12).
    check('C5: create locks the SOURCE in the 021 parent-before-children order — session, exercises, sets',
      (() => {
        const parent  = createFn.indexOf('FOR UPDATE;\n  IF v_status IS NULL')
        const exLock  = createFn.indexOf('ORDER BY we.id\n    FOR UPDATE')
        const setLock = createFn.indexOf('ORDER BY s.id\n  FOR UPDATE')
        const insert  = createFn.indexOf('INSERT INTO workout_routines')
        const copy    = createFn.indexOf('INSERT INTO workout_routine_exercises')
        return parent > -1 && exLock > parent && setLock > exLock &&
          insert > setLock && copy > insert &&
          !createFn.includes('FOR SHARE')
      })())
    check('C10: create bounds counted only AFTER the relevant membership is frozen (positional)',
      (() => {
        const exLock   = createFn.indexOf('ORDER BY we.id\n    FOR UPDATE')
        const exBound  = createFn.indexOf('> 500')
        const setLock  = createFn.indexOf('ORDER BY s.id\n  FOR UPDATE')
        const setCount = createFn.indexOf('SELECT COUNT(*) INTO v_set_count')
        const setBound = createFn.indexOf('> 5000')
        return exLock > -1 && exBound > exLock &&
          setLock > exBound && setCount > setLock && setBound > setCount
      })())
    check('C11: repeat bounds counted only AFTER the relevant membership is frozen (positional)',
      (() => {
        const exLock   = repeatFn.indexOf('ORDER BY we.id\n    FOR UPDATE')
        const exBound  = repeatFn.indexOf('> 500')
        const setLock  = repeatFn.indexOf('ORDER BY s.id\n  FOR UPDATE')
        const setCount = repeatFn.indexOf('SELECT COUNT(*) INTO v_set_count')
        const setBound = repeatFn.indexOf('> 5000')
        return exLock > -1 && exBound > exLock &&
          setLock > exBound && setCount > setLock && setBound > setCount
      })())
    check('C12: BOTH copies read the frozen capture — unnest ordinality, no EXERCISE-order re-read',
      (createFn.match(/unnest\(v_src_ids\) WITH ORDINALITY AS src\(id, ord\)/g) || []).length === 1 &&
      !createFn.includes('ROW_NUMBER') &&
      // repeat's ONLY window is the set-number normalizer — proven
      // exactly against the function BODY (the COMMENT ON string
      // also mentions it), and it never touches order_index.
      (repeatFn.slice(0, repeatFn.indexOf('COMMENT ON FUNCTION'))
        .match(/ROW_NUMBER/g) || []).length === 1 &&
      repeatFn.includes('PARTITION BY src.id') &&
      repeatFn.includes('ORDER BY s.set_number, s.id') &&
      createFn.includes('SELECT array_agg(locked.id ORDER BY locked.order_index, locked.id)') &&
      // the comment text lives in `sql` (raw), not the stripped body
      sql.includes('Structure copy FROM THE LOCKED SOURCE'))
  }

  // ── 3. SQL contract: copy matrices ──────────────────────────────────
  console.log('\n3. SQL contract: copy matrices')
  {
    check('X1: routine copy carries NO notes, NO rpe, NO rest — columns absent from the insert',
      createFn.includes('routine_id, exercise_id, order_index,') &&
      createFn.includes('target_sets, target_reps_min, target_reps_max, target_weight_kg') &&
      !createFn.includes('rest_seconds') && !createFn.includes('target_rpe') &&
      (() => {
        const insert = createFn.slice(
          createFn.indexOf('INSERT INTO workout_routine_exercises'))
        return !insert.slice(0, insert.indexOf(';')).includes('notes')
      })())
    check('X2: target_sets falls back to the NON-WARMUP set COUNT, never zero (NULLIF)',
      createFn.includes('NULLIF(COUNT(*), 0)') &&
      createFn.includes('AND s.is_warmup = false'))
    check('X3: no performance derivation — create never reads set values',
      !/s\.(reps|weight_kg|rpe|duration_seconds|distance_meters)/.test(createFn))
    check('X4: legacy explicit target_reps maps to an exact min=max range only when both are absent',
      createFn.includes('COALESCE(we.target_reps_min,') &&
      createFn.includes('CASE WHEN we.target_reps_max IS NULL THEN we.target_reps END') &&
      createFn.includes('CASE WHEN we.target_reps_min IS NULL THEN we.target_reps END'))
    check('X5: repeated session — source title reused, routine_id NULL, live provenance, caller-supplied local date',
      repeatFn.includes("v_uid, p_workout_date, v_source.title, 'in_progress', NOW(), 'live', NULL"))
    check('X6: repeated exercises — explicit target columns verbatim, notes never copied',
      repeatFn.includes('we.target_sets, we.target_reps, we.target_reps_min,') &&
      repeatFn.includes('we.target_reps_max, we.target_weight_kg') &&
      !/INSERT INTO workout_exercises[\s\S]*?notes/.test(repeatFn.slice(0, repeatFn.indexOf('INSERT INTO workout_sets'))))
    // RETARGET (UI-5B2 final review): original boundary — set_number
    // copied verbatim. Superseded: numbering is NORMALIZED to dense
    // 1..N per exercise over the deterministic (set_number, id)
    // source order, so gapped/duplicate legacy sources can never
    // seed a new workout violating UI-5B1B's contiguous invariant.
    check('X7: repeated sets — dense 1..N numbering, warmup identity kept, EVERY value NULL, completed=false',
      repeatFn.includes('PARTITION BY src.id') &&
      repeatFn.includes('ORDER BY s.set_number, s.id') &&
      !repeatFn.includes('    s.set_number,') &&
      repeatFn.includes('NULL, NULL, NULL, NULL, NULL,') &&
      repeatFn.includes('false, s.is_warmup, NULL'))
  }

  // ── 4. Runtime copy-matrix simulations ──────────────────────────────
  // Deterministic TS mirrors of the SQL semantics (the same proof style
  // as 021's lock-model simulations).
  console.log('\n4. Runtime copy-matrix simulations')
  {
    type SrcSet = { id: string; set_number: number; is_warmup: boolean; reps: number | null; weight_kg: number | null; rpe: number | null; duration_seconds: number | null; distance_meters: number | null; notes: string | null; completed: boolean }
    type SrcEx = { id: string; exercise_id: string; order_index: number; target_sets: number | null; target_reps: number | null; target_reps_min: number | null; target_reps_max: number | null; target_weight_kg: number | null; notes: string | null; sets: SrcSet[] }

    // Mirrors create_routine_from_workout's INSERT ... SELECT exactly.
    const simulateRoutineCopy = (exercises: SrcEx[]) =>
      [...exercises]
        .sort((a, b) => a.order_index - b.order_index || a.id.localeCompare(b.id))
        .map((we, i) => ({
          exercise_id: we.exercise_id,
          order_index: i,
          target_sets: we.target_sets ??
            (we.sets.filter((s) => !s.is_warmup).length || null),
          target_reps_min: we.target_reps_min ??
            (we.target_reps_max === null ? we.target_reps : null),
          target_reps_max: we.target_reps_max ??
            (we.target_reps_min === null ? we.target_reps : null),
          target_weight_kg: we.target_weight_kg,
        }))

    // Mirrors repeat_workout's captured-order copy exactly.
    const simulateRepeatCopy = (exercises: SrcEx[]) => {
      const srcIds = [...exercises]
        .sort((a, b) => a.order_index - b.order_index || a.id.localeCompare(b.id))
        .map((e) => e.id)
      return srcIds.map((id, ord) => {
        const we = exercises.find((e) => e.id === id)!
        return {
          exercise_id: we.exercise_id,
          order_index: ord,
          target_sets: we.target_sets, target_reps: we.target_reps,
          target_reps_min: we.target_reps_min, target_reps_max: we.target_reps_max,
          target_weight_kg: we.target_weight_kg,
          notes: null,
          // Dense renumber over the deterministic (set_number, id)
          // source order — mirrors the SQL ROW_NUMBER window exactly.
          sets: [...we.sets]
            .sort((a, b) => a.set_number - b.set_number || a.id.localeCompare(b.id))
            .map((src, i) => ({
              set_number: i + 1, is_warmup: src.is_warmup, srcId: src.id,
              reps: null, weight_kg: null, rpe: null,
              duration_seconds: null, distance_meters: null,
              completed: false, notes: null,
            })),
        }
      })
    }

    const set = (n: number, v: Partial<SrcSet> = {}): SrcSet => ({
      id: `set-${n}`, set_number: n, is_warmup: false, reps: 10, weight_kg: 9.07, rpe: 8,
      duration_seconds: null, distance_meters: null, notes: 'grinder', completed: true, ...v,
    })

    // The canonical mixed source: explicit targets, absent targets,
    // warmups, zero targets, cardio/timed exercises, a 0-set exercise,
    // and a scrambled display order with a tie.
    const source: SrcEx[] = [
      { id: 'b', exercise_id: 'bench', order_index: 1, target_sets: 4, target_reps: null, target_reps_min: 6, target_reps_max: 10, target_weight_kg: 60, notes: 'wide grip', sets: [set(1), set(2), set(3)] },
      { id: 'a', exercise_id: 'squat', order_index: 0, target_sets: null, target_reps: null, target_reps_min: null, target_reps_max: null, target_weight_kg: null, notes: null, sets: [set(1, { is_warmup: true }), set(2), set(3), set(4)] },
      { id: 'c', exercise_id: 'row', order_index: 2, target_sets: null, target_reps: 8, target_reps_min: null, target_reps_max: null, target_weight_kg: 0, notes: null, sets: [] },
      { id: 'd', exercise_id: 'bike', order_index: 3, target_sets: null, target_reps: null, target_reps_min: null, target_reps_max: null, target_weight_kg: null, notes: null, sets: [set(1, { reps: null, weight_kg: null, rpe: null, duration_seconds: 0, distance_meters: 1609.34 })] },
      { id: 'e', exercise_id: 'plank2', order_index: 2, target_sets: null, target_reps: null, target_reps_min: 2, target_reps_max: null, target_weight_kg: null, notes: null, sets: [set(1, { duration_seconds: 60 })] },
    ]

    const routine = simulateRoutineCopy(source)
    check('R1: displayed order preserved with dense 0-based resequence and (order_index, id) tiebreak',
      routine.map((r) => r.exercise_id).join(',') === 'squat,bench,row,plank2,bike' &&
      routine.map((r) => r.order_index).join(',') === '0,1,2,3,4')
    check('R2: explicit target_sets wins; absent falls back to NON-warmup count; 0 sets stays NULL',
      routine[1].target_sets === 4 &&      // bench: explicit 4 beats its 3 rows
      routine[0].target_sets === 3 &&      // squat: 4 rows minus 1 warmup
      routine[2].target_sets === null &&   // row: zero set rows -> NULL, never 0
      routine[4].target_sets === 1)        // bike: 1 working set
    check('R3: explicit reps range verbatim; legacy target_reps becomes exact min=max; min-only stays open',
      routine[1].target_reps_min === 6 && routine[1].target_reps_max === 10 &&
      routine[2].target_reps_min === 8 && routine[2].target_reps_max === 8 &&
      routine[3].target_reps_min === 2 && routine[3].target_reps_max === null)
    check('R4: target weight verbatim including explicit zero (NULL vs zero preserved)',
      routine[2].target_weight_kg === 0 && routine[0].target_weight_kg === null)
    check('R5: nothing derived from logged performance and no notes anywhere in the routine copy',
      routine.every((r: any) =>
        !('reps' in r) && !('weight' in r) && !('target_rpe' in r) &&
        !('rest_seconds' in r) && !('notes' in r)))

    const repeated = simulateRepeatCopy(source)
    check('R6: repeat preserves order, set counts, set numbering, and is_warmup flags',
      repeated.map((r) => r.exercise_id).join(',') === 'squat,bench,row,plank2,bike' &&
      repeated[0].sets.length === 4 &&
      repeated[0].sets[0].is_warmup === true &&
      repeated[0].sets.map((s) => s.set_number).join(',') === '1,2,3,4' &&
      repeated[2].sets.length === 0)
    check('R7: every repeated set has NULL values and completed=false — logged zeros are NOT copied',
      repeated.every((r) => r.sets.every((s) =>
        s.reps === null && s.weight_kg === null && s.rpe === null &&
        s.duration_seconds === null && s.distance_meters === null &&
        s.completed === false && s.notes === null)) &&
      repeated[4].sets[0].duration_seconds === null) // source logged 0 -> NULL, not 0
    check('R8: repeated exercises keep explicit targets verbatim (incl. zero) and drop notes',
      repeated[1].target_sets === 4 && repeated[1].target_reps_min === 6 &&
      repeated[2].target_weight_kg === 0 && repeated[2].target_reps === 8 &&
      repeated.every((r) => r.notes === null))
    check('R9: empty source degrades honestly (empty routine / empty session, no fabrication)',
      simulateRoutineCopy([]).length === 0 && simulateRepeatCopy([]).length === 0)

    // Bounds, mirrored exactly from the SQL guards: both functions
    // reject over-limit sources with invalid_input BEFORE any insert.
    const simulateBoundsGuard = (exerciseCount: number, setCount: number) =>
      exerciseCount > 500 || setCount > 5000 ? 'invalid_input' : 'ok'
    check('R11: 500-exercise and 5000-set bounds both enforced; at-limit sources pass',
      simulateBoundsGuard(500, 5000) === 'ok' &&
      simulateBoundsGuard(501, 0) === 'invalid_input' &&
      simulateBoundsGuard(0, 5001) === 'invalid_input' &&
      simulateBoundsGuard(3, 12) === 'ok')

    // Set-number NORMALIZATION scenarios (final-review contract):
    // set count + deterministic source order + warmup identity are
    // preserved while numbering becomes dense 1..N.
    const renumber = (sets: SrcSet[]) =>
      simulateRepeatCopy([{ id: 'x1', exercise_id: 'x', order_index: 0,
        target_sets: null, target_reps: null, target_reps_min: null,
        target_reps_max: null, target_weight_kg: null, notes: null,
        sets }])[0].sets
    check('R12: legacy source numbered 2,3 repeats as 1,2',
      renumber([set(2), set(3)]).map((s) => s.set_number).join(',') === '1,2')
    check('R13: gapped source 1,3,7 repeats as 1,2,3',
      renumber([set(1), set(3), set(7)]).map((s) => s.set_number).join(',') === '1,2,3')
    check('R14: duplicate source numbers tie-break deterministically on the source row id',
      (() => {
        const out = renumber([
          set(2, { id: 'bb' }), set(2, { id: 'aa' }), set(1, { id: 'cc' }),
        ])
        return out.map((s) => s.set_number).join(',') === '1,2,3' &&
          out.map((s: any) => s.srcId).join(',') === 'cc,aa,bb'
      })())
    check('R15: warmup flags stay attached to their corresponding ordered rows',
      (() => {
        const out = renumber([
          set(3, { is_warmup: false }), set(1, { is_warmup: true }), set(2, { is_warmup: false }),
        ])
        return out.map((s) => `${s.set_number}:${s.is_warmup ? 'wu' : 'w'}`).join(',') ===
          '1:wu,2:w,3:w'
      })())
    check('R16: an already-contiguous source is reproduced unchanged',
      renumber([set(1), set(2), set(3)]).map((s) => s.set_number).join(',') === '1,2,3' &&
      renumber([set(1), set(2), set(3)]).every((s) =>
        s.reps === null && s.completed === false && s.notes === null))

    // Conflict shape: precheck and race path return the same data the
    // existing modal consumes.
    const conflict = { error: 'active_workout_exists', active_workout_id: 'active-1' }
    check('R10: conflict payload matches the established modal contract',
      conflict.error === 'active_workout_exists' &&
      typeof conflict.active_workout_id === 'string' &&
      repeatFn.includes("'active_workout_id', v_active_id"))
  }

  // ── 5. Scope and protected semantics ────────────────────────────────
  console.log('\n5. Scope and protected semantics')
  {
    const m021 = readFileSync('supabase/migrations/021_ui5b_transactional_ordering.sql')
    check('S1: migration 021 byte-identical (22930 bytes, approved sha256)',
      m021.length === 22930 &&
      createHash('sha256').update(m021).digest('hex') ===
        '916e1665fdb1d4e9705b23300d258db63d690cd2422a09c12a63df068510eac0')
    check('S2: migrations exactly 001-022; 022 is the only addition',
      (/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&
      readdirSync('supabase/migrations').some((f) => f === '022_ui5b2_workout_reuse.sql'))
    // RETARGET (UI-5B2): original boundary — the product slice had
    // to be ABSENT until ChatGPT approved the SQL and Joseph applied
    // it. Both happened; the slice now exists exactly as approved
    // and sections 6-8 own its contracts.
    check('S3: UI/route slice implemented exactly as approved (post-application)',
      existsSync('src/app/api/workouts/[id]/save-as-routine/route.ts') &&
      existsSync('src/app/api/workouts/[id]/repeat/route.ts') &&
      existsSync('src/components/workout/SaveAsRoutineButton.tsx') &&
      existsSync('src/components/workout/RepeatWorkoutButton.tsx'))
    check('S4: worktree contains only the migration + harness files (git)',
      (() => {
        let out = ''
        try {
          out = execSync('git status --porcelain', { encoding: 'utf8' })
        } catch { return false }
        return out.split('\n').filter(Boolean).every((line) => {
          const f = line.slice(3).trim()
          // RETARGET (UI-5B2): the approved product slice joins the
          // allowed set.
          // RETARGET (UI-5B2 hosted-QA correction): the dark-dialog
          // retoken (both dialogs) and the null-never-zero SetRow
          // placeholder fix are admitted while uncommitted.
          // RETARGET (UI-5B2 hosted-QA correction, single-confirmation):
          // the redundant native confirm was removed from ALL THREE
          // modal-protected discard callbacks — the two pre-existing
          // consumers join the scope.
          const UI5B2_PRODUCT = [
            'src/components/routine/StartWorkoutButton.tsx',
            'src/components/workout/CreateWorkoutButton.tsx',
            'src/components/workout/ActiveWorkoutConflictModal.tsx',
            'src/components/workout/SetRow.tsx',
            'src/app/api/workouts/[id]/save-as-routine/route.ts',
            'src/app/api/workouts/[id]/repeat/route.ts',
            // git reports the two untracked routes as directories
            'src/app/api/workouts/[id]/save-as-routine/',
            'src/app/api/workouts/[id]/repeat/',
            'src/components/workout/SaveAsRoutineButton.tsx',
            'src/components/workout/RepeatWorkoutButton.tsx',
            'src/components/workout/WorkoutDetailClient.tsx',
          ]
          // RETARGET (UI-6A): the approved Fuel visual rebuild is
          // admitted while uncommitted.
          // RETARGET (UI-6B): the approved Fasting visual rebuild is
          // admitted while uncommitted.
          // RETARGET (UI-6C): the approved Coach-pillar visual rebuild +
          // badge correction is admitted while uncommitted.
          const UI6C = [
            'src/app/(app)/coach/page.tsx',
            'src/app/(app)/coach/loading.tsx',
            'src/app/(app)/check-in/page.tsx',
            'src/app/(app)/check-in/loading.tsx',
            'src/app/(app)/decisions/page.tsx',
            'src/app/(app)/decisions/loading.tsx',
            'src/app/(app)/progress/page.tsx',
            'src/components/coach/CoachCard.tsx',
            'src/components/coach/MuscleReadinessPanel.tsx',
            'src/components/decisions/DecisionCard.tsx',
            'src/components/decisions/DecisionList.tsx',
            'src/components/workout/ProgressBadge.tsx',
            // RETARGET (UI-6C hosted-QA correction, human-readable decision
            // diffs): the diff formatter/presenter joins the admitted scope.
            'src/components/decisions/DecisionValueChanges.tsx',
          ]
          // RETARGET (UI-7): the approved Profile/Onboarding/Auth/
          // consistency phase (incl. glyph + dead-presentation cleanup) is
          // admitted while uncommitted.
          const UI7 = [
            '.env.example',
            'src/app/(app)/dashboard/page.tsx',
            'src/app/(app)/profile/page.tsx',
            'src/app/(app)/progress/exercises/[id]/page.tsx',
            'src/app/(app)/progress/page.tsx',
            'src/app/(app)/weigh-in/page.tsx',
            'src/app/(auth)/login/page.tsx',
            // RETARGET (UI-7 closeout correction, authentication
            // messaging): the colocated message helper is admitted.
            'src/app/(auth)/login/auth-messages.ts',
            'src/app/globals.css',
            'src/components/dashboard/DailyMetricTile.tsx',
            'src/components/dashboard/DecisionLogCard.tsx',
            'src/components/dashboard/FastingCard.tsx',
            'src/components/dashboard/NutritionCard.tsx',
            'src/components/dashboard/StepsCard.tsx',
            'src/components/dashboard/WeightCard.tsx',
            'src/components/dashboard/WorkoutCard.tsx',
            'src/components/onboarding/OnboardingWizard.tsx',
            'src/components/onboarding/Step1Bio.tsx',
            'src/components/onboarding/Step3Schedule.tsx',
            'src/components/onboarding/Step4Nutrition.tsx',
            'src/components/weigh-in/WeighInForm.tsx',
            'src/components/workout/ExercisePicker.tsx',
            'src/components/workout/ProgressBadge.tsx',
            'tailwind.config.ts',
          ]
          if (UI6C.includes(f)) return true
          const UI6B = [
            'src/app/(app)/fasting/page.tsx',
            'src/app/(app)/fasting/loading.tsx',
            'src/components/fasting/FastingTimer.tsx',
            'src/components/fasting/FastingControls.tsx',
            'src/components/fasting/FastingHistory.tsx',
            'src/components/fasting/EditFastForm.tsx',
          ]
          if (UI6B.includes(f)) return true
          const UI6A = [
            'src/app/(app)/food/page.tsx',
            'src/app/(app)/food/loading.tsx',
            'src/app/(app)/food/saved/page.tsx',
            'src/app/(app)/food/saved/loading.tsx',
            'src/app/(app)/nutrition/page.tsx',
            'src/app/(app)/nutrition/loading.tsx',
            'src/components/food/AddFoodForm.tsx',
            'src/components/food/DailyMacroSummary.tsx',
            'src/components/food/FoodLogEntry.tsx',
            'src/components/food/LabelCalculatorForm.tsx',
            'src/components/food/QuickAddPanel.tsx',
            'src/components/food/QuickDrinkLog.tsx',
            'src/components/food/RecentFoodPanel.tsx',
            'src/components/food/SavedMealCard.tsx',
            'src/components/food/SavedMealForm.tsx',
            'src/components/nutrition/GoalAdjustmentReviewCard.tsx',
            'src/components/nutrition/NutritionCoachPanel.tsx',
            // RETARGET (UI-6A hosted-QA correction, macro-fill visibility):
            // dashboard co-victim of the dead-utility regression.
            'src/components/dashboard/NutritionCard.tsx',
          ]
          if (UI6A.includes(f)) return true
          return f === 'supabase/migrations/022_ui5b2_workout_reuse.sql' ||
            // Approved documentation-only addendum: the Future
            // Exercise Library Expansion roadmap entry.
            f === 'docs/ui5a-train-discovery-notes.md' ||
            // UI-5B2 notes: records 022's applied status + probes.
            f === 'docs/ui5b2-workout-reuse-notes.md' ||
            // RETARGET (UI-6A): the Fuel visual-rebuild notes.
            f === 'docs/ui6a-fuel-visual-notes.md' ||
            // RETARGET (UI-6B): the Fasting visual-rebuild notes.
            f === 'docs/ui6b-fasting-visual-notes.md' ||
            // RETARGET (UI-6C): the Coach-pillar visual-rebuild notes.
            f === 'docs/ui6c-coach-visual-notes.md' ||
            // RETARGET (UI-7): the UI-7 phase notes + product scope are
            // admitted while uncommitted.
            f === 'docs/ui7-profile-onboarding-auth-consistency-notes.md' ||
            // RETARGET (UI-overhaul closeout): the final closeout
            // document is admitted while uncommitted.
            f === 'docs/ui-overhaul-closeout.md' ||
            // RETARGET (EXLIB-1A): the discovery-phase research
            // artifacts (docs/exlib1a-*) are admitted while uncommitted.
            f.startsWith('docs/exlib1a-') ||
            // RETARGET (EXLIB-1B1): the architecture/review-contract
            // artifacts (docs/exlib1b1-*) are admitted while uncommitted.
            f.startsWith('docs/exlib1b1-') ||
            // ADMISSION (EXLIB-1B3A): the audit-only hardening
            // notes (docs/exlib1b3-*) are admitted while uncommitted.
            f.startsWith('docs/exlib1b3-') ||
            // ADMISSION (EXLIB-1C0): the approval-packet and
            // review-proposal artifacts are admitted while
            // uncommitted.
            f.startsWith('docs/exlib1c0-') ||
            // ADMISSION (EXLIB-1B3B migration 024 draft): the
            // uncommitted hardening draft is admitted.
            f === 'supabase/migrations/024_exlib_post_application_hardening.sql' ||
            // RETARGET (EXLIB-1B2): the approved-for-drafting migration
            // 023 draft is admitted while uncommitted.
            f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql' ||
            UI7.includes(f) ||
            UI5B2_PRODUCT.includes(f) ||
            f.startsWith('scripts/verify-')
        })
      })())
    check('S6: migration 022 application recorded honestly (applied by Joseph, verified read-only)',
      read('docs/ui5b2-workout-reuse-notes.md').includes('APPLIED by Joseph') &&
      read('docs/ui5b2-workout-reuse-notes.md')
        .includes('1432692f700b1686243aa8219ea4af3146e2bec30b228b3f9138d60e072e1241') &&
      read('docs/ui5b2-workout-reuse-notes.md').includes('42501') &&
      read('docs/ui5b2-workout-reuse-notes.md').includes('PGRST202'))
    check('S5: Coach suggested-routine stays roadmap-only (no feature code)',
      (() => {
        let out = ''
        try {
          out = execSync("grep -ril 'suggested.routine' src --include='*.ts' --include='*.tsx' || true", { encoding: 'utf8' })
        } catch { return false }
        const files = out.split('\n').filter(Boolean)
        // The single allowed hit is a pre-existing UI-5A comment in
        // MuscleReadinessPanel describing an unchanged element; the
        // string appears in no code path and no other file.
        if (files.length > 1) return false
        if (files.length === 1 && files[0] !== 'src/components/coach/MuscleReadinessPanel.tsx') return false
        return !existsSync('src/app/api/coach/suggested-routine') &&
          !existsSync('src/components/coach/SuggestedRoutine.tsx')
      })())
  }

  // ── 6. Product routes (UI-5B2 slice) ────────────────────────────────
  console.log('\n6. Product routes')
  {
    const saveRoute = read('src/app/api/workouts/[id]/save-as-routine/route.ts')
    const repeatRoute = read('src/app/api/workouts/[id]/repeat/route.ts')
    const both: Array<[string, string]> = [['save', saveRoute], ['repeat', repeatRoute]]
    for (const [label, src] of both) {
      check(`P1-${label}: user derived ONLY from the server client; no client user id anywhere`,
        src.includes('const { data: { user } } = await supabase.auth.getUser()') &&
        src.indexOf('auth.getUser()') < src.indexOf('supabase.rpc(') &&
        !src.includes('user_id') && !src.includes('body.user'))
      check(`P2-${label}: exactly ONE RPC call and no other database access`,
        (src.match(/supabase\.rpc\(/g) || []).length === 1 &&
        !src.includes('.from(') && !src.includes('.insert(') &&
        !src.includes('.update(') && !src.includes('.delete(') &&
        !/service_role/i.test(src))
      check(`P3-${label}: full HTTP mapping — 401, 400 invalid, 404 unleaky, 500 fallback, fail-closed id`,
        src.includes("{ status: 401, error: 'Unauthorized' }") &&
        src.includes("message.includes('not_found')") &&
        src.includes("{ status: 404, error: 'Not found' }") &&
        src.includes("message.includes('invalid_input')") &&
        src.includes('UUID_RE.test(params.id)') &&
        /return NextResponse\.json\(\{ error: [^}]+\}, \{ status: 500 \}\)/.test(src) &&
        src.includes('!UUID_RE.test('))
    }
    check('P4: save route validates JSON shape, allowed fields, trimmed name, and both lengths',
      saveRoute.includes("'Invalid JSON body.'") &&
      saveRoute.includes("keys.every((k) => k === 'name' || k === 'description')") &&
      saveRoute.includes('const name = raw.name.trim()') &&
      saveRoute.includes('name.length > 120') &&
      saveRoute.includes('description.length > 2000'))
    check('P5: save route maps duplicate_name to the inline 409 copy',
      saveRoute.includes("(data as any)?.error === 'duplicate_name'") &&
      saveRoute.includes("'A routine with this name already exists.'") &&
      saveRoute.includes('{ status: 409 }'))
    check('P6: save success fails closed unless routine_id is a real id, then returns 201',
      saveRoute.includes("typeof routineId !== 'string' || !UUID_RE.test(routineId)") &&
      saveRoute.includes("{ data: { routine_id: routineId } }, { status: 201 }"))
    check('P7: repeat route accepts NO body — non-empty payloads are rejected, never ignored',
      repeatRoute.includes('await request.text()') &&
      repeatRoute.includes("rawBody.trim() !== '' && rawBody.trim() !== '{}'") &&
      repeatRoute.includes("'This endpoint accepts no request body.'"))
    check('P8: repeat date is the user-local day resolved server-side (shipped cookie contract)',
      repeatRoute.includes("import { localTodayFromCookies } from '@/lib/local-date-server'") &&
      repeatRoute.includes('const workoutDate = localTodayFromCookies()') &&
      repeatRoute.includes('p_workout_date: workoutDate') &&
      !repeatRoute.includes('new Date()'))
    check('P9: repeat maps active_workout_exists to the modal-consumable 409 shape',
      repeatRoute.includes("(data as any)?.error === 'active_workout_exists'") &&
      repeatRoute.includes("'A workout is already in progress.'") &&
      repeatRoute.includes('active_workout_id') &&
      repeatRoute.includes('{ status: 409 }'))
    check('P10: repeat success fails closed unless session_id is a real id, then returns 201',
      repeatRoute.includes("typeof sessionId !== 'string' || !UUID_RE.test(sessionId)") &&
      repeatRoute.includes("{ data: { session_id: sessionId } }, { status: 201 }"))
    check('P11: blank set values and dense numbering stay owned by the deployed RPC contract',
      !repeatRoute.includes('set_number') && !repeatRoute.includes('reps') &&
      !repeatRoute.includes('weight') &&
      !saveRoute.includes('target_') && !saveRoute.includes('workout_sets'))
  }

  // ── 7. Product components (runtime + structure) ─────────────────────
  console.log('\n7. Product components')
  {
    const saveBtn = read('src/components/workout/SaveAsRoutineButton.tsx')
    const repeatBtn = read('src/components/workout/RepeatWorkoutButton.tsx')
    const detail = read('src/components/workout/WorkoutDetailClient.tsx')
    const { SaveAsRoutineButton } = await import('../src/components/workout/SaveAsRoutineButton')
    const { RepeatWorkoutButton } = await import('../src/components/workout/RepeatWorkoutButton')

    const saveHtml = renderToStaticMarkup(React.createElement(SaveAsRoutineButton, {
      workoutId: 'w1', workoutTitle: 'Push Day' }))
    const repeatHtml = renderToStaticMarkup(React.createElement(RepeatWorkoutButton, {
      workoutId: 'w1' }))
    check('U1: both buttons render real 44px controls with lucide icons and honest labels',
      saveHtml.includes('min-h-11') && saveHtml.includes('Save as routine') &&
      saveHtml.includes('<svg') &&
      repeatHtml.includes('min-h-11') && repeatHtml.includes('Repeat workout') &&
      repeatHtml.includes('<svg'))
    check('U2: visibility rules at the mount — Save on live AND completed, Repeat gated on completed',
      detail.includes('<SaveAsRoutineButton workoutId={session.id} workoutTitle={session.title} />') &&
      detail.includes('{readOnly && <RepeatWorkoutButton workoutId={session.id} />}') &&
      detail.indexOf("const readOnly = session.status === 'completed'") <
        detail.indexOf('<SaveAsRoutineButton'))
    check('U3: dialog is accessible with the required prefilled name and optional description',
      saveBtn.includes('role="dialog"') && saveBtn.includes('aria-modal="true"') &&
      saveBtn.includes('aria-labelledby="save-as-routine-title"') &&
      saveBtn.includes('id="save-as-routine-title"') &&
      saveBtn.includes('const [name, setName] = useState(workoutTitle)') &&
      saveBtn.includes('aria-required="true"') &&
      saveBtn.includes('maxLength={120}') && saveBtn.includes('maxLength={2000}'))
    check('U4: dialog states its honest copy summary (structure yes, performance/notes never)',
      saveBtn.includes('exercise structure, order, explicit') &&
      saveBtn.includes('targets, and set counts') &&
      saveBtn.includes('logged performance or notes'))
    check('U5: failure preserves dialog contents; duplicate-name 409 lands as inline feedback',
      saveBtn.includes('setError(body.error ?? ') &&
      !saveBtn.includes("setName('')") &&
      saveBtn.includes('aria-live="polite"') &&
      saveBtn.includes("if (error === null) setName(workoutTitle)"))
    check('U6: double-submit prevention in both components (synchronous pendingRef guard)',
      saveBtn.includes('if (pendingRef.current || saving) return') &&
      saveBtn.includes('pendingRef.current = true') &&
      repeatBtn.includes('if (pendingRef.current) return') &&
      repeatBtn.includes('pendingRef.current = true'))
    check('U7: success navigation targets',
      saveBtn.includes('router.push(`/workouts/routines/${body.data.routine_id}`)') &&
      repeatBtn.includes('router.push(`/workouts/${data.session_id}`)'))
    check('U8: conflict flow reuses ActiveWorkoutConflictModal with Resume + Discard-and-retry',
      repeatBtn.includes("import { ActiveWorkoutConflictModal } from '@/components/workout/ActiveWorkoutConflictModal'") &&
      repeatBtn.includes('onResume={handleResume}') &&
      repeatBtn.includes('onDiscardAndRetry={handleDiscardAndRetry}') &&
      repeatBtn.includes('router.push(`/workouts/${conflictId}`)') &&
      repeatBtn.includes("fetch(`/api/workouts/${conflictId}/skip`, { method: 'POST' })"))
    check('U9: discard retries exactly ONCE — a second conflict re-renders the modal, never loops',
      (repeatBtn.match(/await attemptRepeat\(\)/g) || []).length === 2 &&
      repeatBtn.includes('// Retry exactly once') &&
      repeatBtn.indexOf('setConflictId(result.activeWorkoutId)\n        return',
        repeatBtn.indexOf('handleDiscardAndRetry')) > -1 &&
      repeatBtn.includes("setModalError('Could not discard the existing workout. Please try again.')"))
    check('U10: repeat client sends no body, no date, no user id',
      repeatBtn.includes("fetch(`/api/workouts/${workoutId}/repeat`, { method: 'POST' })") &&
      !repeatBtn.includes('workout_date') && !repeatBtn.includes('user_id') &&
      !repeatBtn.includes('JSON.stringify'))
    check('U11: save client sends only name and optional description',
      saveBtn.includes('name: name.trim(),') &&
      saveBtn.includes("...(description.trim() ? { description: description.trim() } : {})") &&
      !saveBtn.includes('user_id'))
  }

  // ── 8. Slice-level protections ──────────────────────────────────────
  console.log('\n8. Slice-level protections')
  {
    check('G1: migration 022 fingerprint unchanged by the product slice',
      (() => {
        const buf = readFileSync(MIGRATION)
        return buf.length === 19112 &&
          createHash('sha256').update(buf).digest('hex') ===
            '1432692f700b1686243aa8219ea4af3146e2bec30b228b3f9138d60e072e1241'
      })())
    check('G2: execution internals untouched — no reuse-feature reference in block/set paths',
      !read('src/components/workout/WorkoutExerciseBlock.tsx').includes('SaveAsRoutine') &&
      !read('src/components/workout/SetRow.tsx').includes('Repeat') &&
      !read('src/app/api/workout-sets/[id]/route.ts').includes('repeat_workout'))
    // RETARGET (UI-5B2 hosted-QA correction, single-confirmation):
    // original boundary — no routine-component change. The shared
    // conflict-modal confirmation fix necessarily touches
    // StartWorkoutButton (a routine component); it is the ONLY
    // admitted exception, and business libraries stay locked.
    check('G3: routine components and business libraries untouched (git)',
      (() => {
        let out = ''
        try {
          out = execSync('git status --porcelain', { encoding: 'utf8' })
        } catch { return false }
        return out.split('\n').filter(Boolean).every((line) => {
          const f = line.slice(3).trim()
          return (!f.startsWith('src/components/routine/') ||
              f === 'src/components/routine/StartWorkoutButton.tsx') &&
            !f.startsWith('src/lib/')
        })
      })())
    check('G4: Exercise Library Expansion stays roadmap-only (doc entry, zero product code)',
      read('docs/ui5a-train-discovery-notes.md').includes('### Future Exercise Library Expansion') &&
      (() => {
        try {
          execSync("grep -ril 'strengthlog' src", { encoding: 'utf8' })
          return false
        } catch { return true }
      })())
  }

  // ── 9. Hosted-QA corrections (dark dialogs + null-never-zero) ──────
  console.log('\n9. Hosted-QA corrections')
  {
    const saveBtn = read('src/components/workout/SaveAsRoutineButton.tsx')
    const modal = read('src/components/workout/ActiveWorkoutConflictModal.tsx')
    const setRowSrc = read('src/components/workout/SetRow.tsx')
    const stripComments = (t: string) =>
      t.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

    // Both dialogs: semantic dark tokens, zero light-palette escapes.
    for (const [label, src] of [['save-dialog', saveBtn], ['conflict-modal', modal]] as const) {
      check(`D1-${label}: semantic dark surface, border, and ink tokens`,
        src.includes('bg-surface-raised') && src.includes('border-edge') &&
        src.includes('text-ink') && src.includes('text-ink-muted') &&
        src.includes('bg-canvas/80'))
      check(`D2-${label}: no raw white/black/gray/red palette escape (code, not comments)`,
        (() => {
          const code = stripComments(src)
          return !/bg-white|text-black|neutral-|!bg-|red-\d|gray-|grey-|#fff|#111/i.test(code) &&
            !code.includes('style={{')
        })())
    }
    check('D3: save-dialog inputs use the semantic interactive surface and ring',
      (saveBtn.match(/bg-surface-interactive/g) || []).length === 2 &&
      (saveBtn.match(/focus:ring-ring/g) || []).length === 2)
    check('D4: error styling is the semantic critical treatment in both dialogs',
      saveBtn.includes('text-critical bg-critical-subtle') &&
      modal.includes('text-critical bg-critical-subtle') &&
      modal.includes('border-critical text-critical') &&
      modal.includes('hover:bg-critical-subtle'))

    // Runtime render of the REAL shared modal: tokens present,
    // callbacks wired, copy and structure unchanged, 44px controls.
    const { ActiveWorkoutConflictModal } =
      await import('../src/components/workout/ActiveWorkoutConflictModal')
    const modalHtml = renderToStaticMarkup(React.createElement(ActiveWorkoutConflictModal, {
      busy: false, error: 'probe-error',
      onResume: () => {}, onDiscardAndRetry: () => {}, onCancel: () => {},
    }))
    check('D5: rendered conflict modal — dark tokens, a11y pairing, all three actions, 44px',
      modalHtml.includes('bg-surface-raised') &&
      modalHtml.includes('role="dialog"') && modalHtml.includes('aria-modal="true"') &&
      modalHtml.includes('aria-labelledby="active-workout-conflict-title"') &&
      modalHtml.includes('id="active-workout-conflict-title"') &&
      modalHtml.includes('You already have a workout in progress') &&
      modalHtml.includes('Resume existing workout') &&
      modalHtml.includes('Discard existing workout and start new') &&
      modalHtml.includes('Cancel') &&
      modalHtml.includes('probe-error') &&
      (modalHtml.match(/min-h-11/g) || []).length >= 3 &&
      !modalHtml.includes('bg-white') && !modalHtml.includes('#ffffff'))
    check('D6: shared-consumer behavior intact — StartWorkoutButton wiring unchanged',
      (() => {
        const start = read('src/components/routine/StartWorkoutButton.tsx')
        return start.includes('onResume={handleResume}') &&
          start.includes('onDiscardAndRetry={handleDiscardAndRetry}') &&
          start.includes('onCancel={handleCancel}') &&
          modal.includes("busy ? 'Working…'")
      })())

    // Null-never-zero: the deployed RPC writes NULL (fingerprint-
    // pinned in G1); the client defect was the weight/distance
    // "0" PLACEHOLDERS presenting a missing value as measured zero.
    const { SetRow } = await import('../src/components/workout/SetRow')
    const mkSet = (v: Record<string, unknown> = {}) => ({
      id: 'ns1', workout_exercise_id: 'we1', set_number: 1,
      reps: null, weight_kg: null, rpe: null,
      duration_seconds: null, distance_meters: null,
      completed: false, is_warmup: false, notes: null, ...v,
    })
    const rowHtml2 = (set: any, mode: string) =>
      renderToStaticMarkup(React.createElement(SetRow, {
        set: set as never, isUnilateral: false, trackingMode: mode as never,
        prType: null,
      }))
    const nullCardio = rowHtml2(mkSet(), 'cardio')
    check('N1: repeated cardio set with NULL distance renders an EMPTY input — no visible 0',
      nullCardio.includes('aria-label="Distance in miles"') &&
      !/aria-label="Distance in miles"[^>]*value="0"/.test(nullCardio) &&
      !nullCardio.includes('placeholder="0"') &&
      nullCardio.includes('placeholder="mi"'))
    check('N2: genuine stored zero stays distinguishable — it renders as an actual 0 value',
      (() => {
        const zeroCardio = rowHtml2(mkSet({ distance_meters: 0, duration_seconds: 0 }), 'cardio')
        return /value="0"/.test(zeroCardio)
      })())
    check('N3: NULL duration renders blank min:sec',
      !/aria-label="Duration — minutes"[^>]*value="/.test(nullCardio.replace(/value=""/g, '')) &&
      nullCardio.includes('placeholder="min"') && nullCardio.includes('placeholder="sec"'))
    check('N4: NULL reps, weight, and RPE render blank with unit placeholders (never "0")',
      (() => {
        const wr = rowHtml2(mkSet(), 'weight_reps')
        return !wr.includes('placeholder="0"') &&
          wr.includes('placeholder="lbs"') && wr.includes('placeholder="reps"') &&
          wr.includes('placeholder="RPE"') &&
          !/aria-label="Reps"[^>]*value="\d/.test(wr) &&
          !/aria-label="Weight in lbs"[^>]*value="\d/.test(wr)
      })())
    check('N5: existing non-null values still format identically (10 reps / 20 lbs / RPE 8)',
      (() => {
        const wr = rowHtml2(mkSet({ reps: 10, weight_kg: 9.0718474, rpe: 8 }), 'weight_reps')
        return wr.includes('value="10"') && wr.includes('value="20"') && wr.includes('value="8"')
      })())
    check('N6: no "0" placeholder anywhere in SetRow — only unit/name placeholders remain',
      !setRowSrc.includes('placeholder="0"') &&
      setRowSrc.includes('placeholder="lbs"') && setRowSrc.includes('placeholder="mi"'))
  }

  // ── 10. Single-confirmation boundary (hosted-QA correction) ────────
  console.log('\n10. Single-confirmation boundary')
  {
    const stripC = (t: string) =>
      t.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    const repeatBtn = read('src/components/workout/RepeatWorkoutButton.tsx')
    const startBtn = read('src/components/routine/StartWorkoutButton.tsx')
    const createBtn = read('src/components/workout/CreateWorkoutButton.tsx')

    // The app modal is the ONE confirmation: no native confirm
    // survives in any modal-protected discard callback.
    for (const [label, src] of [
      ['RepeatWorkoutButton', repeatBtn],
      ['StartWorkoutButton', startBtn],
      ['CreateWorkoutButton', createBtn],
    ] as const) {
      check(`F1-${label}: no window.confirm / bare confirm in code (modal is the sole confirmation)`,
        (() => {
          const code = stripC(src)
          return !/\bwindow\.confirm\b|(?<![.\w])confirm\(/.test(code)
        })())
    }
    check('F2: one Discard click = exactly one authorized skip request, then exactly one retry',
      (repeatBtn.match(/fetch\(`\/api\/workouts\/\$\{conflictId\}\/skip`/g) || []).length === 1 &&
      (repeatBtn.match(/await attemptRepeat\(\)/g) || []).length === 2 &&
      repeatBtn.indexOf('/skip`', repeatBtn.indexOf('handleDiscardAndRetry')) <
        repeatBtn.indexOf('await attemptRepeat()', repeatBtn.indexOf('handleDiscardAndRetry')))
    check('F3: skip failure stops the flow — no retry, honest inline message',
      repeatBtn.includes("if (!skipRes.ok) {") &&
      repeatBtn.includes("setModalError('Could not discard the existing workout. Please try again.')") &&
      repeatBtn.indexOf('if (!skipRes.ok)') <
        repeatBtn.indexOf('await attemptRepeat()', repeatBtn.indexOf('handleDiscardAndRetry')))
    check('F4: a second conflict re-renders the modal and never loops (return, no further call)',
      (() => {
        const h = repeatBtn.slice(repeatBtn.indexOf('async function handleDiscardAndRetry'))
        const afterRetry = h.slice(h.indexOf('await attemptRepeat()'))
        return afterRetry.includes("if (result.status === 'conflict') {") &&
          afterRetry.includes('setConflictId(result.activeWorkoutId)') &&
          !afterRetry.slice(afterRetry.indexOf('setConflictId(result.activeWorkoutId)'))
            .includes('await attemptRepeat()')
      })())
    check('F5: Resume and Cancel behavior unchanged in all three consumers',
      repeatBtn.includes('router.push(`/workouts/${conflictId}`)') &&
      startBtn.includes('router.push(`/workouts/${conflictId}`)') &&
      createBtn.includes('conflictId') &&
      repeatBtn.includes('setConflictId(null)\n    setModalError(null)') &&
      startBtn.includes('setConflictId(null)') && createBtn.includes('setConflictId(null)'))
    check('F6: no duplicate session possible — modal-busy gate plus the 008-index-backed 409 flow',
      repeatBtn.includes('setModalBusy(true)') &&
      repeatBtn.includes('disabled={busy}') === false && // busy prop lives in the modal
      read('src/components/workout/ActiveWorkoutConflictModal.tsx')
        .split('disabled={busy}').length - 1 === 3)
    check('F7: direct destructive actions NOT behind the modal retain their confirmations',
      stripC(read('src/components/workout/SetRow.tsx')).includes("confirm('Delete this set?')") &&
      stripC(read('src/components/workout/WorkoutExerciseBlock.tsx')).includes('Remove ${we.exercise.name} from this workout?') &&
      stripC(read('src/components/routine/RoutineDetailClient.tsx')).includes('Permanently delete') &&
      stripC(read('src/components/workout/SessionHeader.tsx')).includes('confirm('))
    check('F8: the modal itself stays semantic-dark, accessible, and worded identically',
      (() => {
        const m = read('src/components/workout/ActiveWorkoutConflictModal.tsx')
        return m.includes('bg-surface-raised') && m.includes('role="dialog"') &&
          m.includes('aria-modal="true"') &&
          m.includes('You already have a workout in progress') &&
          m.includes('Resume it, or discard it to start a new one.') &&
          m.includes('Discard existing workout and start new')
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
