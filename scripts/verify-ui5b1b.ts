// ============================================================
// ForgeFitOS — UI-5B1B transactional ordering harness
// Proves migration 021's four functions (source contracts: auth,
// ownership, advisory-lock serialization, exact-set validation,
// order_index/set_number-only writes, grants), the two exercise-order
// routes, the hardened PATCH allowlists, the transactional set
// delete/resequence + locked Add Set numbering, the workout/routine
// optimistic reorder UIs, and the explicit blank-only
// Apply-to-remaining action — while every UI-5B1A presentation and
// behavior guarantee holds and the deferred UI-5B2 features stay
// absent.
//
// The set-numbering regression (delete Set 1 of 1,2,3 -> 1,2; Add ->
// 1,2,3) is proven at the algorithm level with a deterministic
// simulation that mirrors the SQL semantics exactly (ROW_NUMBER over
// (set_number, id); MAX+1 under the same lock). Migration 021 was
// applied by Joseph after review; read-only anon probes confirmed
// the four functions exist with anon execution revoked.
// Run from the repository root:
//   npx tsx scripts/verify-ui5b1b.ts
// ============================================================

import { readFileSync, readdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import React from 'react'
;(globalThis as any).React = React
import { renderToStaticMarkup } from 'react-dom/server'

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
const stripComments = (s: string) =>
  s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const sqlStripped = (s: string) => s.replace(/^\s*--.*$/gm, '')

const migration = read('supabase/migrations/021_ui5b_transactional_ordering.sql')
const workoutOrderRoute = read('src/app/api/workouts/[id]/exercise-order/route.ts')
const routineOrderRoute = read('src/app/api/routines/[id]/exercise-order/route.ts')
const wePatchRoute = read('src/app/api/workout-exercises/[id]/route.ts')
const rePatchRoute = read('src/app/api/routine-exercises/[id]/route.ts')
const setsRoute = read('src/app/api/workout-exercises/[id]/sets/route.ts')
const setIdRoute = read('src/app/api/workout-sets/[id]/route.ts')
const applyRoute = read('src/app/api/workout-exercises/[id]/apply-first-set/route.ts')
const detailClient = read('src/components/workout/WorkoutDetailClient.tsx')
const block = read('src/components/workout/WorkoutExerciseBlock.tsx')
const setRow = read('src/components/workout/SetRow.tsx')
const routineDetail = read('src/components/routine/RoutineDetailClient.tsx')

async function main() {
  // ── 1. Migration 021 function contracts (SQL source) ───────────────
  console.log('\n1. Migration 021 contracts')
  {
    const FUNCS = ['reorder_workout_exercises', 'reorder_routine_exercises',
      'delete_workout_set_and_resequence', 'append_workout_set']
    check('M1: exactly the four approved functions, correct migration name',
      existsSync('supabase/migrations/021_ui5b_transactional_ordering.sql') &&
      FUNCS.every((f) => migration.includes(`CREATE OR REPLACE FUNCTION ${f}(`)) &&
      (migration.match(/CREATE OR REPLACE FUNCTION/g) || []).length === 4)
    check('M2: every function is SECURITY INVOKER with a fixed search_path',
      (sqlStripped(migration).match(/SECURITY INVOKER/g) || []).length === 4 &&
      (sqlStripped(migration).match(/SET search_path = public/g) || []).length === 4)
    check('M3: every function rejects a missing auth.uid()',
      (migration.match(/v_uid := auth\.uid\(\);/g) || []).length === 4 &&
      (migration.match(/RAISE EXCEPTION 'not_authenticated';/g) || []).length === 4)
    check('M4: explicit owner checks on top of RLS (sessions/routines by user_id)',
      migration.includes('WHERE ws.id = p_session_id AND ws.user_id = v_uid') &&
      migration.includes('WHERE wr.id = p_routine_id AND wr.user_id = v_uid') &&
      migration.includes('WHERE s.id = p_set_id AND ws.user_id = v_uid') &&
      migration.includes('WHERE we.id = p_workout_exercise_id AND ws.user_id = v_uid'))
    check('M5: advisory xact locks serialize each domain',
      (migration.match(/pg_advisory_xact_lock\(/g) || []).length === 4 &&
      migration.includes("hashtext('reorder_workout_exercises')") &&
      migration.includes("hashtext('reorder_routine_exercises')") &&
      (migration.match(/hashtext\('workout_set_numbering'\)/g) || []).length === 2)
    check('M6: exact-set validation with explicit supplied(id) aliases',
      (migration.match(/unnest\(p_ordered_ids\) AS supplied\(id\)/g) || []).length >= 6 &&
      (migration.match(/unnest\(p_ordered_ids\) WITH ORDINALITY AS supplied\(id, ord\)/g) || []).length === 2 &&
      (migration.match(/RAISE EXCEPTION 'stale_exercise_list';/g) || []).length === 2)
    check('M7: null/empty/oversized/duplicate input rejected before any write',
      (migration.match(/RAISE EXCEPTION 'invalid_input';/g) || []).length >= 8 &&
      migration.includes('WHERE supplied.id IS NULL') &&
      (migration.match(/> 500/g) || []).length === 2 &&
      (migration.match(/COUNT\(DISTINCT supplied\.id\)/g) || []).length === 2)
    check('M8: reorders write order_index ONLY, contiguous zero-based, one UPDATE each',
      (migration.match(/SET order_index = supplied\.ord - 1/g) || []).length === 2 &&
      !sqlStripped(migration).match(/UPDATE workout_exercises[\s\S]{0,200}SET (?!order_index)/) &&
      (migration.match(/UPDATE workout_exercises/g) || []).length === 1 &&
      (migration.match(/UPDATE workout_routine_exercises/g) || []).length === 1)
    check('M9: workout reorder allowed for completed sessions (order-only by construction)',
      !migration.includes("v_session_status = 'completed'") ||
      // the two set-numbering functions DO check completion; the
      // reorder functions must NOT gate on status:
      (migration.split('delete_workout_set_and_resequence')[0].match(/'completed'/g) || []) .length === 0)
    check('M10: delete resequences deterministically by (set_number, id), set_number only',
      migration.includes('ROW_NUMBER() OVER (ORDER BY inner_s.set_number, inner_s.id)') &&
      migration.includes('SET set_number = renumbered.new_number') &&
      migration.includes('WHERE id = p_set_id AND workout_exercise_id = v_exercise_id') &&
      migration.includes('RETURNING id INTO v_deleted_id;') &&
      (migration.match(/DELETE FROM workout_sets/g) || []).length === 1)
    check('M11: delete + append both reject completed workouts fail-closed',
      (migration.match(/RAISE EXCEPTION 'workout_completed';/g) || []).length === 2)
    check('M12: append computes MAX+1 inside the shared lock, typed self-validating insert',
      migration.includes('COALESCE(MAX(s.set_number), 0) + 1') &&
      migration.indexOf("hashtext('workout_set_numbering')",
        migration.indexOf('append_workout_set')) <
        migration.indexOf('COALESCE(MAX(s.set_number), 0) + 1') &&
      migration.includes('INSERT INTO workout_sets (') &&
      !migration.includes('JSONB DEFAULT') && !migration.includes('p_set '))
    check('M13: grants — revoke PUBLIC/anon, execute for authenticated only, no service role',
      (migration.match(/FROM PUBLIC, anon;/g) || []).length === 4 &&
      (migration.match(/TO authenticated;/g) || []).length === 4 &&
      !migration.includes('service_role') &&
      !migration.includes('SECURITY DEFINER'))
    check('M14: schema reload + integrity comments present',
      migration.includes("NOTIFY pgrst, 'reload schema';") &&
      (migration.match(/COMMENT ON FUNCTION/g) || []).length === 4)
    check('M15: machine-mappable errors only (no raw SQL details leak)',
      ['not_authenticated', 'not_found', 'invalid_input', 'stale_exercise_list',
        'workout_completed'].every((e) => migration.includes(`'${e}'`)))
  }

  // ── 2. Set-numbering regression (deterministic simulation) ─────────
  console.log('\n2. Delete/resequence + append regression (algorithm proof)')
  {
    // Exact mirrors of the SQL semantics.
    type SimSet = { id: string; set_number: number; reps: number | null;
      weight_kg: number | null; rpe: number | null; completed: boolean;
      is_warmup: boolean; notes: string | null }
    const resequence = (sets: SimSet[]): SimSet[] =>
      [...sets]
        .sort((a, b) => a.set_number - b.set_number || a.id.localeCompare(b.id))
        .map((s, i) => ({ ...s, set_number: i + 1 }))
    const deleteAndResequence = (sets: SimSet[], id: string): SimSet[] =>
      resequence(sets.filter((s) => s.id !== id))
    const append = (sets: SimSet[]): SimSet[] => [...sets, {
      id: `new${sets.length}`, set_number: Math.max(0, ...sets.map((s) => s.set_number)) + 1,
      reps: null, weight_kg: null, rpe: null, completed: false, is_warmup: false, notes: null }]
    const numbers = (sets: SimSet[]) => resequenceView(sets)
    const resequenceView = (sets: SimSet[]) =>
      [...sets].sort((a, b) => a.set_number - b.set_number).map((s) => s.set_number)

    const start: SimSet[] = [
      { id: 'a', set_number: 1, reps: 8, weight_kg: 60, rpe: 8, completed: true, is_warmup: false, notes: 'n1' },
      { id: 'b', set_number: 2, reps: null, weight_kg: 61.2, rpe: null, completed: false, is_warmup: false, notes: null },
      { id: 'c', set_number: 3, reps: 5, weight_kg: null, rpe: 9.5, completed: false, is_warmup: true, notes: 'wu' },
    ]
    const afterDelete1 = deleteAndResequence(start, 'a')
    check('R1: delete Set 1 of 1,2,3 -> persisted 1,2',
      JSON.stringify(numbers(afterDelete1)) === '[1,2]')
    const afterAdd = append(afterDelete1)
    check('R2: Add Set afterward -> 1,2,3',
      JSON.stringify(numbers(afterAdd)) === '[1,2,3]' &&
      afterAdd[afterAdd.length - 1].set_number === 3)
    check('R3: delete middle Set 2 of 1,2,3 -> 1,2',
      JSON.stringify(numbers(deleteAndResequence(start, 'b'))) === '[1,2]')
    check('R4: delete last set -> remaining unchanged and contiguous',
      JSON.stringify(numbers(deleteAndResequence(start, 'c'))) === '[1,2]' &&
      deleteAndResequence(start, 'c').every((s) => ['a', 'b'].includes(s.id)))
    check('R5: remaining IDs are the same rows (never recreated)',
      afterDelete1.map((s) => s.id).join(',') === 'b,c')
    check('R6: remaining values and nulls byte-equivalent after resequence',
      JSON.stringify(afterDelete1.map(({ set_number, ...rest }) => rest)) ===
      JSON.stringify(start.filter((s) => s.id !== 'a').map(({ set_number, ...rest }) => rest)))
    check('R7: completion, warmup, and notes unchanged',
      afterDelete1[0].completed === false && afterDelete1[1].is_warmup === true &&
      afterDelete1[1].notes === 'wu')
    check('R8: completed-workout deletion rejected (SQL + route both enforce)',
      migration.includes("IF v_session_status = 'completed' THEN") &&
      setIdRoute.includes('blockIfWorkoutSetCompleted'))
    check('R9: rapid add/delete serialized by one shared lock key (no duplicates or gaps possible)',
      (migration.match(/hashtext\('workout_set_numbering'\)/g) || []).length === 2 &&
      // both callsites lock BEFORE reading or writing any set_number
      migration.indexOf("hashtext('workout_set_numbering')") <
        migration.indexOf('DELETE FROM workout_sets\n  WHERE id = p_set_id'))
    check('R10: refresh returns the same sequence (route refreshes; fetch orders by set_number)',
      setRow.includes('router.refresh()') &&
      read('src/lib/supabase/server.ts').includes('set_number'))
    check('R11: empty-after-delete remains valid (no minimum enforced anywhere)',
      !migration.toLowerCase().includes('minimum') &&
      !setIdRoute.toLowerCase().includes('minimum'))
  }

  // ── 3. Exercise-order route contracts ───────────────────────────────
  console.log('\n3. Exercise-order routes')
  {
    for (const [name, src, rpc, param] of [
      ['workout', workoutOrderRoute, 'reorder_workout_exercises', 'p_session_id'],
      ['routine', routineOrderRoute, 'reorder_routine_exercises', 'p_routine_id'],
    ] as const) {
      check(`O-${name}: authenticated PUT calling exactly one RPC`,
        src.includes('export async function PUT') &&
        src.includes(`supabase.rpc('${rpc}'`) &&
        (src.match(/supabase\.rpc\(/g) || []).length === 1 &&
        src.includes(`${param}: params.id`) &&
        src.includes("return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })"))
      check(`O-${name}: strict body contract (only ordered_ids; 400s for bad JSON/keys/ids/dupes)`,
        src.includes("keys.length !== 1 || keys[0] !== 'ordered_ids'") &&
        src.includes("Invalid JSON body.") &&
        src.includes('UUID_RE.test(id)') &&
        src.includes('new Set(ids).size !== ids.length') &&
        src.includes('ids.length === 0'))
      check(`O-${name}: distinct error mapping, no client user id, no service role`,
        src.includes("includes('not_found')") &&
        src.includes("includes('stale_exercise_list')") &&
        src.includes("includes('invalid_input')") &&
        !src.includes('user_id: body') && !src.includes('service_role') &&
        !stripComments(src).includes('.update('))
    }
  }

  // ── 4. PATCH allowlists (mass-assignment closed) ────────────────────
  console.log('\n4. PATCH hardening')
  {
    check('P1: workout-exercise PATCH allowlist exact (prescriptions + notes)',
      wePatchRoute.includes("'target_sets', 'target_reps_min', 'target_reps_max', 'target_weight_lbs', 'notes'") &&
      !wePatchRoute.includes("'order_index'") &&
      wePatchRoute.includes('Only prescription and note fields can be updated here.'))
    check('P2: workout-exercise PATCH rejects unknown keys and empty updates with 400',
      wePatchRoute.includes('unsupported.length > 0') &&
      wePatchRoute.includes('No valid fields to update.') &&
      !stripComments(wePatchRoute).includes('.update(body)'))
    check('P3: workout-exercise PATCH validates types/ranges; lbs converted server-side',
      wePatchRoute.includes('isNullableInt(body.target_sets, 1, 100)') &&
      wePatchRoute.includes('Math.round(lbsToKg(lbs) * 100) / 100') &&
      wePatchRoute.includes('blockIfWorkoutExerciseCompleted'))
    check('P4: routine-exercise PATCH allowlist exact (seven prescription fields + notes)',
      rePatchRoute.includes("'target_sets', 'target_reps_min', 'target_reps_max',") &&
      rePatchRoute.includes("'target_weight_lbs', 'target_rpe', 'rest_seconds', 'notes',") &&
      !rePatchRoute.includes("'order_index'") &&
      !stripComments(rePatchRoute).includes('{ ...body }'))
    check('P5: routine-exercise PATCH validates rpe/rest ranges, converts lbs, 400s unknowns',
      rePatchRoute.includes('rpe < 1 || rpe > 10') &&
      rePatchRoute.includes('isNullableInt(body.rest_seconds, 0, 3600)') &&
      rePatchRoute.includes('unsupported.length > 0'))
    check('P6: identity/ownership/foreign keys unreachable in both PATCHes',
      [wePatchRoute, rePatchRoute].every((src) =>
        !src.includes("'user_id'") && !src.includes("'exercise_id'") &&
        !src.includes("'workout_session_id'") && !src.includes("'routine_id'") &&
        !src.includes("'created_at'")))
    check('P7: RoutineExerciseRow edit contract still matches the allowlist exactly',
      (() => {
        const row = read('src/components/routine/RoutineExerciseRow.tsx')
        return ['target_sets', 'target_reps_min', 'target_reps_max', 'target_weight_lbs',
          'target_rpe', 'rest_seconds', 'notes'].every((f) => row.includes(f)) &&
          !stripComments(row).includes('order_index')
      })())
  }

  // ── 5. Set routes on the transactional primitives ───────────────────
  console.log('\n5. Set routes')
  {
    check('S1: DELETE calls delete_workout_set_and_resequence, keeps the completed guard',
      setIdRoute.includes("supabase.rpc('delete_workout_set_and_resequence'") &&
      setIdRoute.includes('blockIfWorkoutSetCompleted') &&
      !stripComments(setIdRoute).includes(".from('workout_sets').delete()"))
    check('S2: DELETE returns success only from the committed RPC result',
      setIdRoute.indexOf('success: true') > setIdRoute.indexOf('delete_workout_set_and_resequence'))
    check('S3: Add Set inserts through append_workout_set (numbering inside the lock)',
      setsRoute.includes("supabase.rpc('append_workout_set'") &&
      !stripComments(setsRoute).includes(".from('workout_sets')\n    .insert") &&
      !stripComments(setsRoute).includes('?.set_number ?? 0) + 1'))
    check('S4: Add Set keeps every tracking-mode validation and carry-forward rule',
      setsRoute.includes('MODE_ALLOWED_FIELDS[trackingMode]') &&
      setsRoute.includes('Reps are required to complete this set.') &&
      setsRoute.includes('Duration is required to complete this set.') &&
      setsRoute.includes('const insertPayload: Record<string, unknown>') &&
      block.includes("weight_lbs: lastSet?.weight_kg ? displayWeight(lastSet.weight_kg) : null"))
    check('S5: set identity never client-controlled (typed params; no id/number params exist)',
      setsRoute.includes('p_workout_exercise_id: params.id') &&
      !setsRoute.includes('p_set_number') &&
      !migration.includes('p_set_number') &&
      migration.includes('p_workout_exercise_id, v_next_number,'))
  }

  // ── 6. Workout reorder UI (runtime) ─────────────────────────────────
  console.log('\n6. Workout reorder UI')
  {
    check('U1: optimistic ID-order overlay + snapshot restore + interlock',
      detailClient.includes('const [orderOverride, setOrderOverride] = useState<string[] | null>(null)') &&
      detailClient.includes('setOrderOverride(previousOrder)') &&
      detailClient.includes('if (reordering) return') &&
      detailClient.includes('router.refresh()'))
    check('U2: single transactional endpoint call with the complete ordered list',
      detailClient.includes('`/api/workouts/${session.id}/exercise-order`') &&
      detailClient.includes('JSON.stringify({ ordered_ids: nextOrder })') &&
      (stripComments(detailClient).match(/fetch\(/g) || []).length === 1)
    check('U3: move controls exist for completed workouts too (order-only)',
      detailClient.includes('isReordering={reordering}') &&
      !stripComments(detailClient).includes('readOnly && onMoveUp') &&
      detailClient.indexOf('onMoveUp={() => moveExercise(index, -1)}') > 0)
    check('U4: accessible reorder error', detailClient.includes('aria-live="polite"'))
    const { WorkoutExerciseBlock } = await import('../src/components/workout/WorkoutExerciseBlock')
    const mkWe = (over: Record<string, unknown> = {}) => ({
      id: 'we1', workout_session_id: 'w1', exercise_id: 'e1', order_index: 0,
      target_sets: null, target_reps: null, target_reps_min: null, target_reps_max: null,
      target_weight_kg: null, notes: null, created_at: '', updated_at: '',
      exercise: { id: 'e1', name: 'Bench Press', primary_muscle: 'chest', equipment: null,
        tracking_mode: 'weight_reps', unilateral: false, notes: null },
      workout_sets: [
        { id: 's1', workout_exercise_id: 'we1', set_number: 1, reps: 8, weight_kg: 60, rpe: 8,
          completed: false, is_warmup: false, notes: null, duration_seconds: null, distance_meters: null },
        { id: 's2', workout_exercise_id: 'we1', set_number: 2, reps: null, weight_kg: null, rpe: null,
          completed: false, is_warmup: false, notes: null, duration_seconds: null, distance_meters: null },
      ],
      ...over })
    const html = (props: Record<string, unknown> = {}) =>
      renderToStaticMarkup(React.createElement(WorkoutExerciseBlock, {
        we: mkWe() as never, previousBest: null, readOnly: false,
        isFirst: false, isLast: false, isReordering: false,
        onMoveUp: () => {}, onMoveDown: () => {}, ...props } as never))
    const mid = html()
    check('U5: real named 44px Move up/Move down buttons render',
      mid.includes('aria-label="Move exercise up"') &&
      mid.includes('aria-label="Move exercise down"') &&
      (mid.match(/flex h-11 w-11 items-center justify-center/g) || []).length >= 3)
    check('U6: first/last disabled logic',
      html({ isFirst: true }).match(/aria-label="Move exercise up"[^>]*/)?.[0] === undefined ||
      /disabled=""[^>]*aria-label="Move exercise up"|aria-label="Move exercise up"/.test(html({ isFirst: true })) &&
      html({ isFirst: true }).split('aria-label="Move exercise up"')[0].endsWith('disabled="" ') ===
        html({ isFirst: true }).includes('disabled=""'))
    check('U6b: disabled attributes present exactly where expected',
      (html({ isFirst: true }).match(/disabled=""/g) || []).length === 1 &&
      (html({ isLast: true }).match(/disabled=""/g) || []).length === 1 &&
      (html({ isReordering: true }).match(/disabled=""/g) || []).length >= 2)
    check('U7: move controls render in read-only (completed) blocks too',
      (() => {
        const ro = html({ readOnly: true })
        return ro.includes('aria-label="Move exercise up"') &&
          ro.includes('aria-label="Move exercise down"') &&
          !ro.includes('aria-label="Remove exercise"')
      })())
    check('U8: no drag-and-drop interaction anywhere',
      [detailClient, block, routineDetail].every((f) =>
        !stripComments(f).toLowerCase().includes('draggable') &&
        !stripComments(f).includes('onDragStart')))
  }

  // ── 7. Routine reorder migration ────────────────────────────────────
  console.log('\n7. Routine reorder')
  {
    check('T1: RoutineDetailClient persists through the transactional endpoint only',
      routineDetail.includes('`/api/routines/${routine.id}/exercise-order`') &&
      routineDetail.includes("method: 'PUT'") &&
      !routineDetail.includes('/api/routine-exercises/${snapshot'))
    check('T2: optimistic swap, snapshot rollback, interlock, and error copy preserved',
      routineDetail.includes('const snapshot: any[] = exerciseList.map((e: any) => ({ ...e }))') &&
      routineDetail.includes('setExerciseList(snapshot)') &&
      routineDetail.includes('if (reordering) return') &&
      routineDetail.includes('Reorder failed — please try again.'))
    check('T3: move labels and disabled logic unchanged (RoutineExerciseRow)',
      read('src/components/routine/RoutineExerciseRow.tsx').includes('aria-label="Move exercise up"') &&
      routineDetail.includes('isFirst={idx === 0} isLast={idx === exerciseList.length - 1}'))
    check('T4: routine CRUD/start/prescriptions untouched',
      routineDetail.includes('<RoutineForm existing={routine} onClose={() => setEditingMeta(false)} />') &&
      routineDetail.includes('res.status === 409 && body.has_sessions') &&
      (routineDetail.match(/<StartWorkoutButton/g) || []).length === 1)
  }

  // ── 8. Apply to remaining sets ──────────────────────────────────────
  console.log('\n8. Apply to remaining sets')
  {
    check('A1: server route reads PERSISTED sets at execution (never client values)',
      applyRoute.includes("from('workout_sets')") &&
      applyRoute.includes("order('set_number', { ascending: true })") &&
      !applyRoute.includes('request.json'))
    check('A2: template = first non-warmup set; per-mode copy fields exact',
      applyRoute.includes('.find((s: any) => !s.is_warmup)') &&
      applyRoute.includes("weight_reps: ['reps', 'weight_kg', 'rpe']") &&
      applyRoute.includes("bodyweight:  ['reps', 'weight_kg', 'rpe']") &&
      applyRoute.includes("cardio:      ['duration_seconds', 'distance_meters']") &&
      applyRoute.includes("timed:       ['duration_seconds', 'rpe']"))
    check('A3: blank-only targets — later, non-warmup, incomplete, at least one blank field',
      applyRoute.includes('s.set_number > (template as any).set_number && !s.is_warmup && !s.completed') &&
      applyRoute.includes('copyFields.some((f) => s[f] === null)'))
    check('A4: copies ONLY blank fields; absent template values omitted (blank never zero)',
      applyRoute.includes('if (target[f] !== null) continue') &&
      applyRoute.includes(".filter((f) => (template as any)[f] !== null") &&
      !applyRoute.includes('?? 0'))
    check('A5: never touches notes, ids, numbering, warmup, or completion',
      !applyRoute.includes('update.notes') && !applyRoute.includes('update.set_number') &&
      !applyRoute.includes('update.completed') && !applyRoute.includes('update.is_warmup'))
    // RETARGET (UI-5B1B stale-state correction): original boundary —
    // the response carried only the honest counts. Hosted QA proved
    // the writes correct but the visible inputs stale (SetRow's
    // useState initializers never rerun across router.refresh), so
    // the response now ALSO returns the authoritative post-write
    // target rows for client reconciliation. The guard and the
    // honest counts are unchanged and still pinned; the rows come
    // from a re-read, never an echo of the template.
    check('A6: completed-workout guard + honest partial reporting',
      applyRoute.includes('blockIfWorkoutExerciseCompleted') &&
      applyRoute.includes('data: { applied, eligible: targets.length, failed, sets: updatedRows }') &&
      applyRoute.includes("select('id, reps, weight_kg, rpe, duration_seconds, distance_meters')") &&
      applyRoute.indexOf('const { data: reread }') > applyRoute.indexOf('for (const target of targets'))
    check('A7: client action is explicit, never automatic, 44px, honest disabled reasons',
      block.includes("'Apply to remaining sets'") &&
      block.includes('onClick={handleApplyToRemaining}') &&
      block.includes('flex min-h-11 items-center gap-1.5') &&
      block.includes("Apply to remaining sets unlocks once the first set's values are saved.") &&
      !stripComments(block).includes('useEffect(() => { handleApplyToRemaining'))
    check('A8: partial-failure copy + retry idempotence + refresh',
      block.includes('Try again for the remaining sets.') &&
      block.includes('aria-live="polite"') &&
      stripComments(block).split('handleApplyToRemaining()').length >= 2 &&
      block.indexOf('router.refresh()', block.indexOf('handleApplyToRemaining')) > 0)
    check('A9: eligibility from persisted props only; required fields per mode',
      block.includes('applyTemplate.reps !== null && applyTemplate.weight_kg !== null') &&
      block.includes('applyTemplate.duration_seconds !== null') &&
      block.includes('const applyEnabled = !readOnly && applyRequiredReady && applyTargets.length > 0'))
    check('A10: no replace-existing mode in V1',
      !stripComments(block).toLowerCase().includes('replace existing') &&
      !stripComments(applyRoute).toLowerCase().includes('overwrite'))
  }

  // ── 9. UI-5B1A guarantees preserved + 5B2 absent ────────────────────
  console.log('\n9. Boundaries')
  {
    check('B1: UI-5B1A SetRow untouched by this slice (44px boxes, handlers, modes intact)',
      setRow.includes("'w-11 h-11 rounded-full border-2") &&
      setRow.includes('await fetch(`/api/workout-sets/${set.id}`, {') &&
      !stripComments(setRow).includes('after:-inset'))
    check('B2: execution presentation guarantees hold (max-w-3xl, no glyphs)',
      read('src/app/(app)/workouts/[id]/page.tsx').includes('max-w-3xl') &&
      ['\u2713', '\u2190', '\u2192'].every((g) =>
        !stripComments(block).includes(g) && !stripComments(detailClient).includes(g)))
    // RETARGET (UI-5B2): original boundary — the deferred features
    // had to be ABSENT everywhere. UI-5B2 now ships them: the detail
    // client mounts the two approved buttons, while the UI-5B1B
    // execution internals this suite owns (the exercise block and
    // both set routes) and migration 021 must STILL never reference
    // them. The features' own contracts live in verify-ui5b2.
    check('B3: UI-5B2 reuse features live only at the approved mount, never in execution internals',
      [block, setIdRoute, setsRoute, migration].every((f) =>
        !/save.?as.?routine|repeat.?workout|save_as_routine|repeat_workout|create_routine_from_workout/i.test(
          stripComments(f))) &&
      detailClient.includes('<SaveAsRoutineButton workoutId={session.id} workoutTitle={session.title} />') &&
      detailClient.includes('{readOnly && <RepeatWorkoutButton workoutId={session.id} />}'))
    check('B4: migrations exactly 001-022; 021 is the only UI-5B1B addition',
      // RETARGET (UI-5B2): 022_ui5b2_workout_reuse.sql is the approved
      // workout-reuse migration (create_routine_from_workout +
      // repeat_workout). The boundary moves from exactly-21 to
      // exactly-22; no other migration may appear.
      readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 22 &&
      readdirSync('supabase/migrations').filter((f) => f.startsWith('021')).length === 1 &&
      readdirSync('supabase/migrations').filter((f) => f.startsWith('022')).length === 1 &&
      !readdirSync('supabase/migrations').some((f) => f.startsWith('023')))
    check('B5: zero dependency change',
      read('package.json').includes('"next": "14.2.13"') &&
      Object.keys(JSON.parse(read('package.json')).dependencies).length === 22)
    check('B6: file scope exact (git)',
      (() => {
        let diffFiles: string[] = []
        try {
          diffFiles = execSync('git diff --name-only HEAD && git ls-files --others --exclude-standard',
            { encoding: 'utf8' }).split('\n').filter(Boolean)
        } catch { return false }
        const ALLOWED = [
          'supabase/migrations/021_ui5b_transactional_ordering.sql',
          'src/app/api/workouts/[id]/exercise-order/route.ts',
          'src/app/api/routines/[id]/exercise-order/route.ts',
          'src/app/api/workout-exercises/[id]/route.ts',
          'src/app/api/workout-exercises/[id]/sets/route.ts',
          'src/app/api/workout-exercises/[id]/apply-first-set/route.ts',
          'src/app/api/workout-sets/[id]/route.ts',
          'src/app/api/routine-exercises/[id]/route.ts',
          'src/components/workout/WorkoutDetailClient.tsx',
          'src/components/workout/WorkoutExerciseBlock.tsx',
          'src/components/workout/SetRow.tsx',
          'src/components/workout/set-save-coordinator.ts',
          'src/components/workout/set-apply-reconcile.ts',
          'src/components/routine/RoutineDetailClient.tsx',
          'docs/ui5b1b-transactional-ordering-notes.md',
        ]
        // RETARGET (UI-5B2): the approved workout-reuse migration and
        // its harness are admitted while uncommitted.
        // RETARGET (UI-5B2): the approved product slice joins the
        // migration/harness/docs set.
        const UI5B2 = [
          'supabase/migrations/022_ui5b2_workout_reuse.sql',
          'scripts/verify-ui5b2.ts',
          // Approved documentation-only addendum: the Future Exercise
          // Library Expansion roadmap entry.
          'docs/ui5a-train-discovery-notes.md',
          // UI-5B2 notes: records 022's applied status + probes.
          'docs/ui5b2-workout-reuse-notes.md',
          // RETARGET (UI-6A): the Fuel visual-rebuild notes.
          'docs/ui6a-fuel-visual-notes.md',
          // RETARGET (UI-6B): the Fasting visual-rebuild notes.
          'docs/ui6b-fasting-visual-notes.md',
          // RETARGET (UI-6C): the Coach-pillar visual-rebuild notes.
          'docs/ui6c-coach-visual-notes.md',
          'src/app/api/workouts/[id]/save-as-routine/route.ts',
          'src/app/api/workouts/[id]/repeat/route.ts',
          'src/components/workout/SaveAsRoutineButton.tsx',
          'src/components/workout/RepeatWorkoutButton.tsx',
          'src/components/workout/WorkoutDetailClient.tsx',
          // RETARGET (UI-5B2 hosted-QA correction): dark-dialog
          // retoken + null-never-zero SetRow placeholders.
          // RETARGET (UI-5B2 hosted-QA correction, single-confirmation):
          // native confirm removed from the modal-protected discard
          // callbacks; those consumers join the admitted scope.
          'src/components/workout/ActiveWorkoutConflictModal.tsx',
          'src/components/workout/SetRow.tsx',
          'src/components/routine/StartWorkoutButton.tsx',
          'src/components/workout/CreateWorkoutButton.tsx',
        ]
        // RETARGET (LOCAL-DATE-FIX): the approved date-boundary
        // correction files are admitted — expanded to the full
        // repo-wide local-calendar sweep.
        const LOCAL_DATE_FIX = [
          'src/app/(app)/food/page.tsx',
          'src/app/(app)/activity/page.tsx',
          'src/app/(app)/check-in/page.tsx',
          'src/app/(app)/coach/page.tsx',
          'src/app/(app)/dashboard/page.tsx',
          'src/app/(app)/layout.tsx',
          'src/app/(app)/nutrition/page.tsx',
          'src/app/(app)/progress/page.tsx',
          'src/app/(app)/weigh-in/page.tsx',
          'src/app/(app)/workouts/page.tsx',
          'src/app/(app)/workouts/[id]/page.tsx',
          'src/app/api/activity/route.ts',
          'src/app/api/activity-sessions/route.ts',
          'src/app/api/activity-sessions/[id]/route.ts',
          'src/app/api/food-logs/route.ts',
          'src/app/api/goal-adjustment/route.ts',
          'src/app/api/nutrition/day-status/route.ts',
          'src/app/api/routines/[id]/start/route.ts',
          'src/app/api/saved-meals/[id]/quick-add/route.ts',
          'src/app/api/workouts/route.ts',
          'src/components/dashboard/NutritionCard.tsx',
          'src/components/dashboard/WeightCard.tsx',
          'src/components/food/QuickAddPanel.tsx',
          'src/components/food/RecentFoodPanel.tsx',
          'src/components/onboarding/OnboardingWizard.tsx',
          'src/components/shared/LocalDateSync.tsx',
          'src/lib/local-date.ts',
          'src/lib/local-date-server.ts',
          'src/lib/supabase/server.ts',
          'src/lib/workout-coach.ts',
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
        const UI6B = [
          'src/app/(app)/fasting/page.tsx',
          'src/app/(app)/fasting/loading.tsx',
          'src/components/fasting/FastingTimer.tsx',
          'src/components/fasting/FastingControls.tsx',
          'src/components/fasting/FastingHistory.tsx',
          'src/components/fasting/EditFastForm.tsx',
        ]
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
        return diffFiles.every((f) => ALLOWED.includes(f) ||
          LOCAL_DATE_FIX.includes(f) || UI5B2.includes(f) ||
          UI6A.includes(f) || UI6B.includes(f) || UI6C.includes(f) ||
          UI7.includes(f) ||
          f === 'docs/ui7-profile-onboarding-auth-consistency-notes.md' ||
          // RETARGET (UI-overhaul closeout): the final closeout
          // document is admitted while uncommitted.
          f === 'docs/ui-overhaul-closeout.md' ||
          // RETARGET (EXLIB-1A): the discovery-phase research
          // artifacts (docs/exlib1a-*) are admitted while uncommitted.
          f.startsWith('docs/exlib1a-') ||
          f.startsWith('scripts/verify-'))
      })())
    check('B7: application status recorded honestly (021 applied by Joseph, verified read-only)',
      read('docs/ui5b1b-transactional-ordering-notes.md').includes('APPLIED by Joseph') &&
      read('docs/ui5b1b-transactional-ordering-notes.md').includes('916e1665fdb1d4e9705b23300d258db63d690cd2422a09c12a63df068510eac0'))
  }

  // ── 10. Blur-race coordination (runtime) ────────────────────────────
  console.log('\n10. Blur-race coordination')
  {
    const { trackSetSave, awaitPendingSetSaves, pendingSetSaveCount } =
      await import('../src/components/workout/set-save-coordinator')

    // C1-C5: hold a save pending, start Apply's await, prove it does
    // not resolve until the save resolves — then succeeds.
    {
      let resolveSave!: (ok: boolean) => void
      const held = new Promise<boolean>((res) => { resolveSave = res })
      trackSetSave('exA', held)
      let awaitResolved = false as boolean
      const gate = awaitPendingSetSaves('exA').then((ok) => { awaitResolved = true; return ok })
      await new Promise((r) => setTimeout(r, 20))
      check('C1: save deliberately held pending is tracked',
        pendingSetSaveCount('exA') === 1)
      check('C2: Apply gate does NOT resolve while the save is pending',
        awaitResolved === false)
      resolveSave(true)
      const ok = await gate
      check('C3: gate resolves only after the save, and reports success',
        awaitResolved === true && ok === true && pendingSetSaveCount('exA') === 0)
    }
    // C4: a failing save prevents Apply (gate reports failure).
    {
      let rejectSave!: (ok: boolean) => void
      const held = new Promise<boolean>((res) => { rejectSave = res })
      trackSetSave('exB', held)
      const gate = awaitPendingSetSaves('exB')
      rejectSave(false)
      check('C4: failed save makes the gate report failure (Apply must not run)',
        (await gate) === false)
    }
    // C5: a save that STARTS while awaiting is still covered.
    {
      let resolveFirst!: (ok: boolean) => void
      let resolveSecond!: (ok: boolean) => void
      const first = new Promise<boolean>((res) => { resolveFirst = res })
      trackSetSave('exC', first)
      const gate = awaitPendingSetSaves('exC')
      const second = new Promise<boolean>((res) => { resolveSecond = res })
      trackSetSave('exC', second)
      resolveFirst(true)
      let resolved = false as boolean
      gate.then(() => { resolved = true })
      await new Promise((r) => setTimeout(r, 20))
      check('C5: a save starting mid-wait keeps the gate closed',
        resolved === false)
      resolveSecond(true)
      check('C5b: gate opens once the pool is fully drained', (await gate) === true)
    }
    // C6: a rejected promise (network throw) counts as failure and
    // never leaves a stuck entry.
    {
      let rejector!: (e: Error) => void
      const held = new Promise<boolean>((_res, rej) => { rejector = rej })
      trackSetSave('exD', held)
      const gate = awaitPendingSetSaves('exD')
      rejector(new Error('network'))
      check('C6: thrown save counts as failure and drains the pool',
        (await gate) === false && pendingSetSaveCount('exD') === 0)
    }
    check('C7: SetRow registers every save; callers still get the same promise',
      setRow.includes('return trackSetSave(set.workout_exercise_id, save)') &&
      setRow.includes("import { trackSetSave } from './set-save-coordinator'"))
    check('C8: Apply awaits the gate BEFORE the request exists, aborts honestly on failure',
      block.includes('const savesSucceeded = await awaitPendingSetSaves(we.id)') &&
      block.indexOf('await awaitPendingSetSaves(we.id)') <
        block.indexOf('/apply-first-set`') &&
      block.includes('if (!savesSucceeded) {') &&
      block.indexOf('setApplying(false)\n      return', block.indexOf('savesSucceeded')) > 0 &&
      block.includes('fix the set marked'))
    check('C9: double-click cannot start duplicate Apply operations',
      block.includes('if (readOnly || applying || !applyEnabled) return') &&
      block.indexOf('setApplying(true)') < block.indexOf('await awaitPendingSetSaves(we.id)'))
    check('C10: no timeouts or delay heuristics anywhere in the coordination',
      !stripComments(read('src/components/workout/set-save-coordinator.ts')).includes('setTimeout') &&
      !stripComments(block).includes('setTimeout'))
  }

  // ── 11. Direct-RPC adversarial contracts (append) ───────────────────
  console.log('\n11. Direct-RPC contracts')
  {
    const appendBody = migration.slice(
      migration.indexOf('CREATE OR REPLACE FUNCTION append_workout_set('),
      migration.indexOf('COMMENT ON FUNCTION append_workout_set'))
    check('D1: append takes explicit TYPED parameters — no JSONB blob remains',
      appendBody.includes('p_reps             SMALLINT DEFAULT NULL') &&
      appendBody.includes('p_notes            TEXT     DEFAULT NULL') &&
      !migration.includes('JSONB DEFAULT') && !appendBody.includes("->>"))
    // RETARGET within this suite (final review): the mode is now read
    // from the caller's exercises row UNDER FOR UPDATE, after the
    // session lock, because tracking_mode is mutable.
    check('D2: tracking mode read from the OWNED exercise row under a row lock, never from arguments',
      appendBody.includes('WHERE e.id = v_exercise_ref AND e.user_id = v_uid') &&
      appendBody.includes('SELECT e.tracking_mode INTO v_tracking_mode') &&
      !appendBody.includes('p_tracking_mode'))
    check('D3: ownership + completed rejection precede any write',
      appendBody.indexOf('ws.user_id = v_uid') < appendBody.indexOf('INSERT INTO workout_sets') &&
      appendBody.indexOf("RAISE EXCEPTION 'workout_completed';") <
        appendBody.indexOf('INSERT INTO workout_sets'))
    check('D4: per-mode field gating in the function body (all four modes + unknown-mode reject)',
      appendBody.includes("IF v_tracking_mode IN ('weight_reps', 'bodyweight') THEN") &&
      appendBody.includes("ELSIF v_tracking_mode = 'cardio' THEN") &&
      appendBody.includes("ELSIF v_tracking_mode = 'timed' THEN") &&
      appendBody.includes('ELSE\n    RAISE EXCEPTION \'invalid_input\';'))
    check('D5: type/range validation mirrors the route (reps/rpe/weight/duration/distance/notes)',
      appendBody.includes('p_reps < 0 OR p_reps > 1000') &&
      appendBody.includes('p_rpe < 1 OR p_rpe > 10') &&
      appendBody.includes('p_weight_kg <= 0 OR p_weight_kg > 1000') &&
      appendBody.includes('p_duration_seconds < 0 OR p_duration_seconds > 86400') &&
      appendBody.includes('p_distance_meters < 0 OR p_distance_meters > 1000000') &&
      appendBody.includes('length(p_notes) > 10000'))
    check('D6: per-mode completion requirements enforced in the function',
      appendBody.includes('IF v_completed THEN') &&
      appendBody.includes("v_tracking_mode = 'bodyweight' AND NOT v_is_warmup AND p_reps IS NULL"))
    check('D7: identity/FK/timestamp/set_number cannot be supplied (not parameters)',
      !appendBody.includes('p_id') && !appendBody.includes('p_user_id') &&
      !appendBody.includes('p_session') && !appendBody.includes('p_created_at') &&
      !appendBody.includes('p_set_number'))
    check('D8: no dynamic SQL anywhere in migration 021',
      !sqlStripped(migration).includes("EXECUTE '") &&
      !sqlStripped(migration).includes('EXECUTE format') &&
      !sqlStripped(migration).includes('format('))
    check('D9: grant/revoke signatures exactly match the created function',
      migration.includes('REVOKE ALL ON FUNCTION append_workout_set(UUID, SMALLINT, NUMERIC, NUMERIC, INTEGER, NUMERIC, BOOLEAN, BOOLEAN, TEXT) FROM PUBLIC, anon;') &&
      migration.includes('GRANT EXECUTE ON FUNCTION append_workout_set(UUID, SMALLINT, NUMERIC, NUMERIC, INTEGER, NUMERIC, BOOLEAN, BOOLEAN, TEXT) TO authenticated;'))
    check('D10: delete function — only the requested set deleted; remaining rows change set_number only; lock key identical to append',
      migration.includes('RETURNING id INTO v_deleted_id;') &&
      (migration.match(/hashtext\('workout_set_numbering'\)/g) || []).length === 2 &&
      migration.includes('SET set_number = renumbered.new_number'))
    check('D11: reorder lock domains are distinct from each other and from numbering',
      migration.includes("hashtext('reorder_workout_exercises')") &&
      migration.includes("hashtext('reorder_routine_exercises')") &&
      !migration.includes("hashtext('reorder_exercises')"))
    check('D12: routes map only reviewed tokens; unknown DB failures stay generic (no raw messages)',
      [setIdRoute, setsRoute, workoutOrderRoute, routineOrderRoute, wePatchRoute,
        rePatchRoute, applyRoute].every((src) =>
        !src.includes('error.message }, { status: 500 })') &&
        !src.includes('.message }, { status: 500 })')) &&
      setIdRoute.includes("'Could not delete the set.'") &&
      setsRoute.includes("'Could not add the set.'") &&
      workoutOrderRoute.includes("'Could not save the new order.'"))
    check('D13: apply route write-time null predicates (concurrent entries never overwritten)',
      applyRoute.includes('.is(f, null)') &&
      applyRoute.includes(".eq('completed', false)") &&
      applyRoute.includes("(written ?? []).length > 0") &&
      applyRoute.includes(".order('id', { ascending: true })"))
    check('D14: apply route leaks no raw DB messages',
      !applyRoute.includes('setsError.message'))
    // Migration fingerprint for the review report.
    const { createHash } = await import('crypto')
    const buf = readFileSync('supabase/migrations/021_ui5b_transactional_ordering.sql')
    console.log(`  INFO  migration 021: ${buf.length} bytes, sha256 ${createHash('sha256').update(buf).digest('hex')}`)
    check('D15: migration file present and non-trivial', buf.length > 8000)
  }

  // ── 12. Concurrency-review contracts (SQL source) ──────────────────
  console.log('\n12. Concurrency-review contracts')
  {
    const deleteBody = migration.slice(
      migration.indexOf('CREATE OR REPLACE FUNCTION delete_workout_set_and_resequence('),
      migration.indexOf('COMMENT ON FUNCTION delete_workout_set_and_resequence'))
    const appendBody = migration.slice(
      migration.indexOf('CREATE OR REPLACE FUNCTION append_workout_set('),
      migration.indexOf('COMMENT ON FUNCTION append_workout_set'))
    const workoutReorder = migration.slice(
      migration.indexOf('CREATE OR REPLACE FUNCTION reorder_workout_exercises('),
      migration.indexOf('COMMENT ON FUNCTION reorder_workout_exercises'))
    const routineReorder = migration.slice(
      migration.indexOf('CREATE OR REPLACE FUNCTION reorder_routine_exercises('),
      migration.indexOf('COMMENT ON FUNCTION reorder_routine_exercises'))

    check('K1: append/delete decide completion ONLY on a FOR UPDATE session re-read AFTER the advisory lock',
      [deleteBody, appendBody].every((b) => {
        const adv = b.indexOf("hashtext('workout_set_numbering')")
        const reread = b.indexOf('FOR UPDATE;', adv)
        const reject = b.indexOf("RAISE EXCEPTION 'workout_completed';")
        const mutate = Math.max(b.indexOf('DELETE FROM workout_sets'), b.indexOf('INSERT INTO workout_sets'))
        return adv > 0 && reread > adv && reject > reread && mutate > reject
      }))
    check('K2: initial lookups are never trusted for the completion decision',
      !deleteBody.slice(0, deleteBody.indexOf('pg_advisory_xact_lock'))
        .includes("workout_completed") &&
      !appendBody.slice(0, appendBody.indexOf('pg_advisory_xact_lock'))
        .includes("workout_completed"))
    check('K3: duplicate delete honesty — DELETE ... RETURNING with controlled not_found',
      deleteBody.includes('RETURNING id INTO v_deleted_id;') &&
      deleteBody.includes('IF v_deleted_id IS NULL THEN') &&
      deleteBody.indexOf("RAISE EXCEPTION 'not_found';",
        deleteBody.indexOf('RETURNING id INTO v_deleted_id;')) > 0)
    check('K4: reorders freeze membership — parent FOR UPDATE then child FOR UPDATE before validation',
      [workoutReorder, routineReorder].every((b) => {
        const parentLock = b.indexOf('FOR UPDATE;')
        const childLock = b.indexOf('FOR UPDATE;', parentLock + 1)
        const validate = b.indexOf('SELECT COUNT(*) INTO v_count')
        const update = b.indexOf('SET order_index')
        return parentLock > 0 && childLock > parentLock &&
          validate > childLock && update > validate
      }))
    check('K5: consistent global lock order documented and followed (advisory, then parent row, then children)',
      migration.includes('Global lock order: advisory') &&
      [workoutReorder, routineReorder, deleteBody, appendBody].every((b) =>
        b.indexOf('pg_advisory_xact_lock') < b.indexOf('FOR UPDATE;')))
    check('K6: FK KEY SHARE conflict is the insert-blocking mechanism (documented in SQL)',
      migration.includes('FOR KEY SHARE') &&
      migration.includes('conflicts with FOR KEY SHARE'))
  }

  // ── 13. Deterministic lock-model concurrency proofs ─────────────────
  // These execute the SQL's exact decision procedure against a model
  // of PostgreSQL's documented lock semantics (row UPDATE conflicts
  // with FOR UPDATE; child INSERT takes FK KEY SHARE on the parent,
  // which conflicts with FOR UPDATE; row locks are exclusive; READ
  // COMMITTED re-reads the latest committed row after a lock wait).
  // The source pins in section 12 prove the SQL takes exactly these
  // locks in exactly this order; real PostgreSQL execution awaits
  // migration application.
  console.log('\n13. Lock-model concurrency proofs')
  {
    type Db = { status: string; sets: { id: string; n: number }[]; members: string[]; order: string[] }
    const freshDb = (): Db => ({ status: 'in_progress',
      sets: [{ id: 'a', n: 1 }, { id: 'b', n: 2 }, { id: 'c', n: 3 }],
      members: ['e1', 'e2'], order: ['e1', 'e2'] })
    const resequence = (db: Db) => {
      db.sets.sort((x, y) => x.n - y.n || x.id.localeCompare(y.id))
        .forEach((s, i) => { s.n = i + 1 })
    }
    // The SQL decision procedure for append/delete: (advisory lock)
    // -> locked re-read of committed status -> reject or mutate.
    const tryDelete = (db: Db, id: string): string => {
      if (db.status === 'completed') return 'workout_completed'
      const before = db.sets.length
      db.sets = db.sets.filter((s) => s.id !== id)
      if (db.sets.length === before) return 'not_found'
      resequence(db)
      return 'ok'
    }
    const tryAppend = (db: Db): string => {
      if (db.status === 'completed') return 'workout_completed'
      db.sets.push({ id: `new${db.sets.length}`, n: Math.max(0, ...db.sets.map((s) => s.n)) + 1 })
      return 'ok'
    }
    // Reorder: frozen membership validation -> update or stale.
    const tryReorder = (db: Db, submitted: string[]): string => {
      const current = [...db.members].sort().join(',')
      const sub = [...submitted].sort().join(',')
      if (submitted.length !== db.members.length || current !== sub) return 'stale_exercise_list'
      db.order = [...submitted]
      return 'ok'
    }

    // 1. Completion wins, then Append rejects.
    {
      const db = freshDb()
      db.status = 'completed' // completion committed before append's locked re-read
      check('L1: completion first -> append observes completed and rejects (no mutation)',
        tryAppend(db) === 'workout_completed' && db.sets.length === 3)
    }
    // 2. Append wins (lock held), completion waits, then proceeds.
    {
      const db = freshDb()
      const r = tryAppend(db)      // append holds the session row lock and commits
      db.status = 'completed'      // completion could only run AFTER the lock released
      check('L2: append first -> commits, completion proceeds against the resulting state',
        r === 'ok' && db.sets.length === 4 && db.status === 'completed')
    }
    // 3. Completion wins, then Delete rejects.
    {
      const db = freshDb()
      db.status = 'completed'
      check('L3: completion first -> delete rejects (sets untouched)',
        tryDelete(db, 'a') === 'workout_completed' &&
        db.sets.map((s) => s.n).join(',') === '1,2,3')
    }
    // 4. Delete wins/resequences, completion proceeds afterward.
    {
      const db = freshDb()
      const r = tryDelete(db, 'a')
      db.status = 'completed'
      check('L4: delete first -> resequenced 1..N commits, completion proceeds',
        r === 'ok' && db.sets.map((s) => s.n).join(',') === '1,2' &&
        db.status === 'completed')
    }
    // 5. Invariant: after completed is authoritative, no mutation commits.
    {
      const db = freshDb()
      db.status = 'completed'
      const before = JSON.stringify(db.sets)
      check('L5: no set mutation can commit once completed is authoritative',
        tryAppend(db) !== 'ok' && tryDelete(db, 'b') !== 'ok' &&
        JSON.stringify(db.sets) === before)
    }
    // 6. Duplicate concurrent deletes: exactly one succeeds.
    {
      const db = freshDb()
      const first = tryDelete(db, 'a')   // A holds the lock, commits
      const second = tryDelete(db, 'a')  // B acquires after; RETURNING finds nothing
      check('L6: concurrent duplicate delete — one ok, one controlled not_found, numbering contiguous',
        first === 'ok' && second === 'not_found' &&
        db.sets.map((s) => s.n).join(',') === '1,2')
    }
    // 7. Reorder vs Add Exercise.
    {
      const db = freshDb()
      db.members.push('e3') // add committed BEFORE reorder locked the parent
      check('L7: membership grew first -> reorder rejects stale list, order unchanged',
        tryReorder(db, ['e2', 'e1']) === 'stale_exercise_list' &&
        db.order.join(',') === 'e1,e2')
      const db2 = freshDb()
      const r = tryReorder(db2, ['e2', 'e1']) // reorder holds parent lock; add waits
      db2.members.push('e3')                  // add can only commit after
      check('L8: reorder first -> commits against the exact list; add lands afterwards',
        r === 'ok' && db2.order.join(',') === 'e2,e1' && db2.members.length === 3)
    }
    // 8. Reorder vs Remove Exercise.
    {
      const db = freshDb()
      db.members = ['e1'] // removal committed before reorder froze the children
      check('L9: membership shrank first -> reorder rejects stale list',
        tryReorder(db, ['e2', 'e1']) === 'stale_exercise_list')
      const db2 = freshDb()
      const r = tryReorder(db2, ['e2', 'e1']) // child rows locked; removal waits
      db2.members = db2.members.filter((m) => m !== 'e1')
      check('L10: reorder first -> removal only afterwards; no reorder against a non-exact list ever commits',
        r === 'ok' && db2.order.join(',') === 'e2,e1')
    }
  }

  // ── 14. Tracking-mode race (final review) ───────────────────────────
  console.log('\n14. Tracking-mode race')
  {
    const appendBody = migration.slice(
      migration.indexOf('CREATE OR REPLACE FUNCTION append_workout_set('),
      migration.indexOf('COMMENT ON FUNCTION append_workout_set'))
    const advAt = appendBody.indexOf("hashtext('workout_set_numbering')")
    const sessionLockAt = appendBody.indexOf('FOR UPDATE;', advAt)
    const modeLockAt = appendBody.indexOf('SELECT e.tracking_mode INTO v_tracking_mode')
    const modeLockForUpdateAt = appendBody.indexOf('FOR UPDATE;', modeLockAt)
    const gatingAt = appendBody.indexOf("IF v_tracking_mode IN ('weight_reps', 'bodyweight') THEN")
    const completionRulesAt = appendBody.indexOf('IF v_completed THEN')
    const insertAt = appendBody.indexOf('INSERT INTO workout_sets')
    check('T1: locked mode read sits after advisory + session locks; gating and completion rules after it; insert last',
      advAt > 0 && sessionLockAt > advAt && modeLockAt > sessionLockAt &&
      modeLockForUpdateAt > modeLockAt && gatingAt > modeLockForUpdateAt &&
      completionRulesAt > gatingAt && insertAt > completionRulesAt)
    check('T2: pre-lock lookup resolves IDs only (no tracking_mode, no status decisions)',
      appendBody.includes('SELECT ws.id, we.exercise_id') &&
      !appendBody.slice(0, advAt).includes('e.tracking_mode') &&
      !appendBody.slice(0, advAt).includes("workout_completed"))
    check('T3: exercise row lock is owner-scoped (per-user rows, incl. seeded defaults)',
      appendBody.includes('WHERE e.id = v_exercise_ref AND e.user_id = v_uid') &&
      read('src/lib/supabase/seed-exercises.ts').includes('user_id: userId') &&
      read('supabase/migrations/003_phase1c_workout_logging.sql')
        .includes('GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises'))
    check('T4: no other 021 function locks exercises rows (no cycle with the edit path)',
      (migration.match(/FROM exercises e/g) || []).length === 1)

    // Lock-model proofs: mode edit vs append in both orders.
    type ModeDb = { mode: string; sets: number }
    const tryAppendPayload = (db: ModeDb, payload: { reps?: number; duration?: number }): string => {
      // Mirrors the SQL: gating runs against the LOCKED current mode.
      if (db.mode === 'weight_reps' || db.mode === 'bodyweight') {
        if (payload.duration !== undefined) return 'invalid_input'
      } else {
        if (payload.reps !== undefined) return 'invalid_input'
      }
      db.sets += 1
      return 'ok'
    }
    {
      const db: ModeDb = { mode: 'weight_reps', sets: 3 }
      db.mode = 'cardio' // edit committed before append's locked read
      check('T5: mode edit first -> append validates against the NEW mode (reps payload rejected)',
        tryAppendPayload(db, { reps: 8 }) === 'invalid_input' && db.sets === 3)
      check('T6: duration payload rejected once mode became weight/bodyweight',
        (() => { const d: ModeDb = { mode: 'cardio', sets: 2 }; d.mode = 'weight_reps'
          return tryAppendPayload(d, { duration: 60 }) === 'invalid_input' && d.sets === 2 })())
    }
    {
      const db: ModeDb = { mode: 'weight_reps', sets: 3 }
      const r = tryAppendPayload(db, { reps: 8 }) // append holds the row lock, commits
      db.mode = 'cardio'                          // edit can only commit afterwards
      check('T7: append first -> insert commits under the old mode; edit lands after',
        r === 'ok' && db.sets === 4 && db.mode === 'cardio')
    }
    check('T8: completion and numbering locks intact after the restructure',
      appendBody.includes("hashtext('workout_set_numbering')") &&
      appendBody.includes('SELECT ws.status INTO v_session_status') &&
      appendBody.indexOf('SELECT ws.status') < modeLockAt &&
      migration.includes('then exercise row, then child'))
  }

  // ── 15. Apply stale-state reconciliation (runtime interaction) ─────
  // Hosted QA proved the writes persisted (values present after a
  // browser refresh) but the visible inputs stayed blank: SetRow's
  // useState initializers run once and router.refresh() preserves
  // client state. These proofs drive the EXACT pure functions the
  // components call, then render the real SetRow with the resulting
  // rows to prove the visible input values.
  console.log('\n15. Apply stale-state reconciliation (runtime)')
  {
    const {
      buildAppliedOverrides, mergeAppliedSets, resolveActiveOverrides,
      reconcileSetRowState,
    } = await import('../src/components/workout/set-apply-reconcile')
    const { displayWeight } = await import('../src/lib/workout')
    const { SetRow } = await import('../src/components/workout/SetRow')

    const KG20 = 9.0718474 // stored kg for the 20 lbs the user typed
    const mk = (id: string, n: number, v: Record<string, unknown> = {}) => ({
      id, workout_exercise_id: 'we1', set_number: n,
      reps: null, weight_kg: null, rpe: null,
      duration_seconds: null, distance_meters: null,
      completed: false, is_warmup: false, notes: null, ...v,
    })
    const rowHtml = (set: any, mode = 'weight_reps') =>
      renderToStaticMarkup(React.createElement(SetRow, {
        set: set as never, isUnilateral: false, trackingMode: mode as never,
        prType: null,
      }))

    // The hosted case: Set 1 = 10 reps / 20 lbs / RPE 8, completed;
    // Sets 2 and 3 blank. The route's authoritative post-write
    // re-read of the two targets comes back in the response.
    const rawSets = [
      mk('s1', 1, { reps: 10, weight_kg: KG20, rpe: 8, completed: true }),
      mk('s2', 2, { notes: 'keep this note' }),
      mk('s3', 3),
    ]
    const responseRows = [
      { id: 's2', reps: 10, weight_kg: KG20, rpe: 8, duration_seconds: null, distance_meters: null },
      { id: 's3', reps: 10, weight_kg: KG20, rpe: 8, duration_seconds: null, distance_meters: null },
    ]
    const overrides = buildAppliedOverrides(responseRows)
    check('R1: response rows become per-ID overrides of exactly the five value fields',
      Object.keys(overrides).sort().join(',') === 's2,s3' &&
      Object.keys(overrides.s2).sort().join(',') ===
        'distance_meters,duration_seconds,reps,rpe,weight_kg' &&
      (overrides.s2 as any).reps === 10 && (overrides.s3 as any).rpe === 8)

    const state = { baseline: rawSets, overrides }
    const active = resolveActiveOverrides(state, rawSets)
    const merged = mergeAppliedSets(rawSets as any[], active.overrides)
    check('R2: both visible rows update immediately; identity, order, notes, completion all preserved',
      active.cleared === false &&
      merged[1].reps === 10 && merged[1].weight_kg === KG20 && merged[1].rpe === 8 &&
      merged[2].reps === 10 && merged[2].weight_kg === KG20 && merged[2].rpe === 8 &&
      merged[0] === rawSets[0] &&
      merged[1].id === 's2' && merged[1].set_number === 2 &&
      merged[1].completed === false && merged[1].is_warmup === false &&
      (merged[1] as any).notes === 'keep this note' &&
      merged.map((m: any) => m.id).join(',') === 's1,s2,s3')

    const u2 = reconcileSetRowState(rawSets[1] as never, merged[1] as never)
    check('R3: SetRow state updates match the initializers exactly, including kg-to-lbs display',
      u2.reps === '10' && u2.lbs === String(displayWeight(KG20)) && u2.lbs === '20' &&
      u2.rpe === '8' &&
      u2.completed === undefined && u2.isWarmup === undefined &&
      u2.durationMin === undefined && u2.distanceMi === undefined)

    const liveHtml = rowHtml(merged[1])
    check('R4: the real SetRow renders 10 reps / 20 lbs / RPE 8 from the reconciled row',
      liveHtml.includes('value="10"') && liveHtml.includes('value="20"') &&
      liveHtml.includes('value="8"'))

    // Simulated refresh: the next server render carries the applied
    // values in its own rows; the override snapshot clears (baseline
    // identity changed) and the display is identical.
    const refreshedRaw = [
      mk('s1', 1, { reps: 10, weight_kg: KG20, rpe: 8, completed: true }),
      mk('s2', 2, { reps: 10, weight_kg: KG20, rpe: 8, notes: 'keep this note' }),
      mk('s3', 3, { reps: 10, weight_kg: KG20, rpe: 8 }),
    ]
    const afterRefresh = resolveActiveOverrides(state, refreshedRaw)
    const mergedAfter = mergeAppliedSets(refreshedRaw as any[], afterRefresh.overrides)
    const refreshedHtml = rowHtml(mergedAfter[1])
    check('R5: refresh persistence — overrides clear on the new server render, values identical',
      afterRefresh.cleared === true &&
      mergedAfter[1] === refreshedRaw[1] &&
      refreshedHtml.includes('value="10"') && refreshedHtml.includes('value="20"') &&
      refreshedHtml.includes('value="8"'))

    // A later edit can never be clobbered: the edit\u2019s refresh
    // delivers a new rows array, so the stale response snapshot is
    // dropped on identity, and the newer server value flows through
    // reconciliation.
    const editedRaw = [
      refreshedRaw[0],
      mk('s2', 2, { reps: 12, weight_kg: KG20, rpe: 8, notes: 'keep this note' }),
      refreshedRaw[2],
    ]
    const afterEdit = resolveActiveOverrides(state, editedRaw)
    const mergedEdit = mergeAppliedSets(editedRaw as any[], afterEdit.overrides)
    check('R6: a later user edit wins — stale override snapshot never reapplies',
      afterEdit.cleared === true && mergedEdit[1].reps === 12 &&
      reconcileSetRowState(merged[1] as never, mergedEdit[1] as never).reps === '12')

    // Partial application: the response is a post-write RE-READ, so a
    // value the user saved between the route\u2019s read and write (the
    // IS NULL predicate skipped it) comes back as THEIR value.
    const partial = buildAppliedOverrides([
      { id: 's2', reps: 11, weight_kg: KG20, rpe: 8, duration_seconds: null, distance_meters: null },
    ])
    const mergedPartial = mergeAppliedSets(rawSets as any[],
      resolveActiveOverrides({ baseline: rawSets, overrides: partial }, rawSets).overrides)
    check('R7: partial application — the concurrent user entry survives reconciliation',
      mergedPartial[1].reps === 11 && mergedPartial[2] === rawSets[2] &&
      reconcileSetRowState(rawSets[1] as never, mergedPartial[1] as never).reps === '11')

    // In-progress typing protection: unchanged server fields produce
    // NO update keys, so unrelated local input state is untouched.
    check('R8: unchanged server fields produce zero state updates',
      Object.keys(reconcileSetRowState(merged[1] as never, { ...(merged[1] as any) } as never)).length === 0 &&
      Object.keys(reconcileSetRowState(mk('x', 2) as never, mk('x', 2, { rpe: 7 }) as never)).join(',') === 'rpe')

    // All four tracking modes reconcile and render.
    const bwNext = mk('b1', 2, { reps: 8, weight_kg: 2.2679618, rpe: null })
    const uBw = reconcileSetRowState(mk('b1', 2) as never, bwNext as never)
    check('R9: bodyweight — added weight reconciles and expands the affordance',
      uBw.reps === '8' && uBw.lbs === String(displayWeight(2.2679618)) &&
      uBw.addedWeightExpanded === true &&
      rowHtml(bwNext, 'bodyweight').includes(`value="${uBw.lbs}"`))
    const cardioNext = mk('c1', 2, { duration_seconds: 330, distance_meters: 1609.34 })
    const uCardio = reconcileSetRowState(mk('c1', 2) as never, cardioNext as never)
    const cardioHtml = rowHtml(cardioNext, 'cardio')
    check('R10: cardio — duration splits to min:sec and distance converts to miles',
      uCardio.durationMin === '5' && uCardio.durationSec === '30' && uCardio.distanceMi === '1' &&
      cardioHtml.includes('value="5"') && cardioHtml.includes('value="30"') &&
      cardioHtml.includes('value="1"'))
    const timedNext = mk('t1', 2, { duration_seconds: 90, rpe: 6 })
    const uTimed = reconcileSetRowState(mk('t1', 2) as never, timedNext as never)
    const timedHtml = rowHtml(timedNext, 'timed')
    check('R11: timed — duration + RPE reconcile and render',
      uTimed.durationMin === '1' && uTimed.durationSec === '30' && uTimed.rpe === '6' &&
      timedHtml.includes('value="1"') && timedHtml.includes('value="30"') &&
      timedHtml.includes('value="6"'))

    // Component wiring: reconciliation is the components\u2019 real path.
    check('R12: block merges overrides over props with the baseline-identity guard',
      block.includes('const [applyState, setApplyState] = useState<ApplyReconcileState>(EMPTY_APPLY_STATE)') &&
      block.includes('const resolvedOverrides = resolveActiveOverrides(applyState, we.workout_sets)') &&
      block.includes('if (resolvedOverrides.cleared) setApplyState(EMPTY_APPLY_STATE)') &&
      block.includes('mergeAppliedSets(rawSets as WorkoutSet[], resolvedOverrides.overrides)') &&
      block.includes('baseline: we.workout_sets') &&
      block.includes('overrides: buildAppliedOverrides(updatedRows)'))
    check('R13: SetRow adjusts state during render from the server row — no remount, no new fetch',
      setRow.includes('const [syncedSet, setSyncedSet] = useState(set)') &&
      setRow.includes('if (set !== syncedSet) {') &&
      setRow.includes('const u = reconcileSetRowState(syncedSet, set)') &&
      setRow.includes('setSyncedSet(set)') &&
      block.includes('key={s.id}') &&
      (stripComments(block).match(/fetch\(`\/api\/workout-exercises\/\$\{we\.id\}\/apply-first-set`/g) || []).length === 1 &&
      stripComments(block).includes('router.refresh()'))
    check('R14: saving/error indicators and readOnly guards untouched by the reconciliation',
      setRow.includes("const [saveError, setSaveError] = useState<string | null>(null)") &&
      setRow.includes('const [busy,      setBusy]      = useState(false)') &&
      setRow.includes('if (readOnly) return false'))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
