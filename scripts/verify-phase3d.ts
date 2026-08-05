// ============================================================
// ShredOS — Phase 3D deterministic verification harness
// Verifies the manual decision follow-through and outcome loop:
//   - migration 012 contract (additive, safe defaults, constraints)
//   - the pure state model in src/lib/decisions.ts (transitions,
//     follow-through, outcomes, notes, review dates)
//   - API-boundary source contracts (validation, ownership, safe
//     errors, duplicate-prevention preserved)
//   - filters, legacy-row normalization, neutral language
//   - Phase 3A/3C invariants untouched
// Deterministic: fixed fixtures, no Date.now(), no network.
// Run from the repository root:
//   npx tsx scripts/verify-phase3d.ts
// ============================================================

import { readFileSync } from 'fs'
import {
  DECISION_STATUS_VALUES,
  FOLLOW_THROUGH_VALUES,
  DECISION_OUTCOME_VALUES,
  OUTCOME_NOTES_MAX_LENGTH,
  FOLLOW_THROUGH_LABELS,
  OUTCOME_LABELS,
  STATUS_TRANSITIONS,
  isFollowThroughEligible,
  isOutcomeEligible,
  followThroughOf,
  outcomeOf,
  isValidReviewDate,
  isReviewDateSaveable,
  isDueForReview,
  needsFollowThrough,
  normalizeOutcomeNotes,
  validateDecisionUpdate,
} from '../src/lib/decisions'
import type { DecisionUpdateCurrent } from '../src/lib/decisions'
import { buildCoachActions } from '../src/lib/coach-actions'
import { assembleWeeklyReview, resolveReviewWeekStart } from '../src/lib/weekly-review'

let passed = 0
let failed = 0

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const NOW = '2026-08-07T12:00:00.000Z'
const TODAY = '2026-08-07'

function current(overrides: Partial<DecisionUpdateCurrent> = {}): DecisionUpdateCurrent {
  return {
    status: 'suggested',
    follow_through_status: 'not_started',
    outcome: null,
    reviewed_at: null,
    ...overrides,
  }
}

// ── 1. Migration contract ────────────────────────────────────────────
console.log('\n1. Migration 012 contract')
{
  const sql = readFileSync('supabase/migrations/012_phase3d_decision_follow_through.sql', 'utf8')
  // Strip SQL comments first — the header comment legitimately says
  // "no column is dropped".
  const sqlCode = sql.replace(/--.*$/gm, '')
  check('migration is purely additive (ADD COLUMN only)',
    /ALTER TABLE decision_logs/.test(sqlCode) &&
    !/DROP|RENAME|ALTER COLUMN|USING|TRUNCATE|DELETE/i.test(sqlCode))
  check('follow_through_status has a legacy-preserving default',
    /follow_through_status TEXT NOT NULL DEFAULT 'not_started'/.test(sql))
  check('follow-through CHECK matches the shared value list',
    FOLLOW_THROUGH_VALUES.every((v) => sql.includes(`'${v}'`)))
  check('outcome CHECK matches the shared value list',
    DECISION_OUTCOME_VALUES.every((v) => sql.includes(`'${v}'`)))
  check('outcome notes length-limited at the database',
    sql.includes('char_length(outcome_notes) <= 500'))
  check('review_on is a date-only column', /review_on DATE/.test(sql))
  check('no trigger or RLS changes (existing policy covers new columns)',
    !/CREATE TRIGGER|CREATE POLICY|ALTER POLICY/i.test(sql))
}

// ── 2. Value lists, labels, neutrality ───────────────────────────────
console.log('\n2. Values and labels')
{
  check('existing decision statuses preserved',
    DECISION_STATUS_VALUES.join(',') === 'suggested,accepted,dismissed,applied,reversed')
  check('follow-through model is the smallest useful set',
    FOLLOW_THROUGH_VALUES.join(',') === 'not_started,completed,abandoned,not_applicable')
  check('all six outcome categories present',
    DECISION_OUTCOME_VALUES.join(',') ===
    'positive,neutral,negative,mixed,unclear,needs_more_time')
  check('outcome labels are neutral (no success/failure framing)',
    Object.values(OUTCOME_LABELS).every(
      (l) => !/success|fail|fixed|caused|loss|gain/i.test(l)))
  check('follow-through labels are neutral',
    Object.values(FOLLOW_THROUGH_LABELS).every((l) => !/success|fail|good|bad/i.test(l)))
  const libSource = readFileSync('src/lib/decisions.ts', 'utf8')
  check('no causal language introduced in the domain module',
    !/caused|because of|led to|resulted in/i.test(libSource.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')))
  check('status-transition map is deterministic and closed',
    STATUS_TRANSITIONS.suggested.join(',') === 'accepted,dismissed' &&
    STATUS_TRANSITIONS.accepted.length === 0 &&
    STATUS_TRANSITIONS.dismissed.length === 0 &&
    STATUS_TRANSITIONS.applied.length === 0 &&
    STATUS_TRANSITIONS.reversed.length === 0)
}

// ── 3. Legacy-row normalization ──────────────────────────────────────
console.log('\n3. Legacy rows')
{
  const legacy = {} as Record<string, never>
  check('legacy record without new fields normalizes to not_started',
    followThroughOf(legacy) === 'not_started')
  check('legacy record outcome normalizes to null', outcomeOf(legacy) === null)
  check('legacy record is not due for review', isDueForReview(legacy, TODAY) === false)
  check('legacy accepted record correctly needs follow-through',
    needsFollowThrough({ status: 'accepted' }) === true)
  check('legacy dismissed record never needs follow-through',
    needsFollowThrough({ status: 'dismissed' }) === false)
}

// ── 4. Status transitions ────────────────────────────────────────────
console.log('\n4. Status transitions')
{
  const accept = validateDecisionUpdate(current(), { status: 'accepted' }, NOW)
  check('pending → accepted allowed',
    accept.ok && accept.update.status === 'accepted')
  check('accepting stamps applied_at (existing convention preserved)',
    accept.ok && accept.update.applied_at === NOW)
  const dismiss = validateDecisionUpdate(current(), { status: 'dismissed' }, NOW)
  check('pending → dismissed allowed', dismiss.ok && dismiss.update.status === 'dismissed')
  check('dismissed → accepted rejected',
    !validateDecisionUpdate(current({ status: 'dismissed' }), { status: 'accepted' }, NOW).ok)
  check('accepted → dismissed rejected',
    !validateDecisionUpdate(current({ status: 'accepted' }), { status: 'dismissed' }, NOW).ok)
  check('arbitrary status strings rejected',
    !validateDecisionUpdate(current(), { status: 'super_done' }, NOW).ok)
  check('non-string status rejected',
    !validateDecisionUpdate(current(), { status: 42 }, NOW).ok)
  const idem = validateDecisionUpdate(current({ status: 'accepted' }), { status: 'accepted' }, NOW)
  check('same-status resubmission is an idempotent no-op',
    idem.ok && Object.keys(idem.update).length === 0)
}

// ── 5. Follow-through ────────────────────────────────────────────────
console.log('\n5. Follow-through')
{
  const acceptedRow = current({ status: 'accepted' })
  const complete = validateDecisionUpdate(acceptedRow, { follow_through_status: 'completed' }, NOW)
  check('accepted decision can complete follow-through',
    complete.ok && complete.update.follow_through_status === 'completed')
  check('completed follow-through timestamp set correctly',
    complete.ok && complete.update.completed_at === NOW)
  const abandon = validateDecisionUpdate(acceptedRow, { follow_through_status: 'abandoned' }, NOW)
  check('accepted decision can be abandoned',
    abandon.ok && abandon.update.follow_through_status === 'abandoned')
  check('abandoned also stamps the terminal timestamp',
    abandon.ok && abandon.update.completed_at === NOW)
  check('not-applicable is recordable',
    validateDecisionUpdate(acceptedRow, { follow_through_status: 'not_applicable' }, NOW).ok)
  check('applied decision can complete follow-through',
    validateDecisionUpdate(current({ status: 'applied' }), { follow_through_status: 'completed' }, NOW).ok)
  check('pending decision cannot record follow-through',
    !validateDecisionUpdate(current(), { follow_through_status: 'completed' }, NOW).ok)
  check('dismissed decision cannot become completed (invalid transition)',
    !validateDecisionUpdate(current({ status: 'dismissed' }), { follow_through_status: 'completed' }, NOW).ok)
  check('recorded follow-through cannot be silently rewritten',
    !validateDecisionUpdate(
      current({ status: 'accepted', follow_through_status: 'completed' }),
      { follow_through_status: 'abandoned' }, NOW).ok)
  check('follow-through cannot revert to not_started',
    !validateDecisionUpdate(
      current({ status: 'accepted', follow_through_status: 'completed' }),
      { follow_through_status: 'not_started' }, NOW).ok)
  const idem = validateDecisionUpdate(
    current({ status: 'accepted', follow_through_status: 'completed' }),
    { follow_through_status: 'completed' }, NOW)
  check('same follow-through resubmission is idempotent',
    idem.ok && Object.keys(idem.update).length === 0)
  check('invalid follow-through value rejected',
    !validateDecisionUpdate(acceptedRow, { follow_through_status: 'done' }, NOW).ok)
  check('accept + complete in one request supported (single explicit action)',
    (() => {
      const r = validateDecisionUpdate(current(), { status: 'accepted', follow_through_status: 'completed' }, NOW)
      return r.ok && r.update.status === 'accepted' && r.update.follow_through_status === 'completed'
    })())
}

// ── 6. Outcome ───────────────────────────────────────────────────────
console.log('\n6. Outcome')
{
  const eligible = current({ status: 'accepted', follow_through_status: 'completed' })
  for (const value of DECISION_OUTCOME_VALUES) {
    const r = validateDecisionUpdate(eligible, { outcome: value }, NOW)
    check(`${value} outcome accepted`, r.ok && r.update.outcome === value)
  }
  const first = validateDecisionUpdate(eligible, { outcome: 'neutral' }, NOW)
  check('outcome review timestamp set',
    first.ok && first.update.reviewed_at === NOW)
  check('invalid outcome rejected',
    !validateDecisionUpdate(eligible, { outcome: 'amazing' }, NOW).ok)
  check('outcome cannot be recorded before follow-through',
    !validateDecisionUpdate(current({ status: 'accepted' }), { outcome: 'positive' }, NOW).ok)
  check('outcome cannot be recorded on a pending decision',
    !validateDecisionUpdate(current(), { outcome: 'positive' }, NOW).ok)
  check('outcome re-record is an explicit allowed correction',
    (() => {
      const r = validateDecisionUpdate(
        current({ status: 'accepted', follow_through_status: 'completed', outcome: 'neutral', reviewed_at: NOW }),
        { outcome: 'mixed' }, NOW)
      return r.ok && r.update.outcome === 'mixed' && r.update.reviewed_at === NOW
    })())

  const withNotes = validateDecisionUpdate(
    eligible, { outcome: 'positive', outcome_notes: '  went as planned  ' }, NOW)
  check('outcome notes trimmed',
    withNotes.ok && withNotes.update.outcome_notes === 'went as planned')
  const blank = validateDecisionUpdate(eligible, { outcome: 'positive', outcome_notes: '   ' }, NOW)
  check('empty notes normalized to null',
    blank.ok && blank.update.outcome_notes === null)
  check('notes maximum length enforced',
    !validateDecisionUpdate(
      eligible, { outcome: 'positive', outcome_notes: 'x'.repeat(OUTCOME_NOTES_MAX_LENGTH + 1) }, NOW).ok)
  check('notes at exactly the limit accepted',
    validateDecisionUpdate(
      eligible, { outcome: 'positive', outcome_notes: 'x'.repeat(OUTCOME_NOTES_MAX_LENGTH) }, NOW).ok)
  check('non-string notes rejected',
    !validateDecisionUpdate(eligible, { outcome: 'positive', outcome_notes: 7 }, NOW).ok)
  check('notes without any outcome rejected',
    !validateDecisionUpdate(eligible, { outcome_notes: 'note' }, NOW).ok)
  check('notes alongside an existing recorded outcome allowed',
    validateDecisionUpdate(
      current({ status: 'accepted', follow_through_status: 'completed', outcome: 'neutral', reviewed_at: NOW }),
      { outcome_notes: 'update' }, NOW).ok)
}

// ── 7. Review dates ──────────────────────────────────────────────────
console.log('\n7. Review dates')
{
  const acceptedRow = current({ status: 'accepted' })
  const set = validateDecisionUpdate(acceptedRow, { review_on: '2026-08-14' }, NOW)
  check('review date accepted', set.ok && set.update.review_on === '2026-08-14')
  check('review date stays a date-only string (no UTC drift)',
    set.ok && set.update.review_on === '2026-08-14' && isValidReviewDate('2026-08-14'))
  check('invalid review date rejected',
    !validateDecisionUpdate(acceptedRow, { review_on: '14/08/2026' }, NOW).ok &&
    !validateDecisionUpdate(acceptedRow, { review_on: '2026-13-99' }, NOW).ok &&
    !isValidReviewDate('2026-13-99'))
  check('review date on a pending decision rejected',
    !validateDecisionUpdate(current(), { review_on: '2026-08-14' }, NOW).ok)
  const clear = validateDecisionUpdate(acceptedRow, { review_on: null }, NOW)
  check('review date can be cleared', clear.ok && clear.update.review_on === null)

  check('due-for-review classification (date arrived, not reviewed)',
    isDueForReview({ review_on: '2026-08-07', reviewed_at: null }, TODAY) &&
    isDueForReview({ review_on: '2026-08-01', reviewed_at: null }, TODAY))
  check('future review not due',
    !isDueForReview({ review_on: '2026-08-08', reviewed_at: null }, TODAY))
  check('no review date is never due',
    !isDueForReview({ review_on: null, reviewed_at: null }, TODAY))
  check('already-reviewed decision not due',
    !isDueForReview({ review_on: '2026-08-01', reviewed_at: NOW }, TODAY))
}

// ── 7b. Review-date saveability (QA fix: null vs displayed today) ────
console.log('\n7b. Review-date saveability')
{
  check('null persisted review_on + input showing today is UNSAVED (saveable)',
    isReviewDateSaveable(null, TODAY) === true)
  check('null persisted review_on + any valid date is saveable',
    isReviewDateSaveable(null, '2026-08-14') === true)
  check('Set review date permitted in the unsaved-today state (button rule)',
    isReviewDateSaveable(null, TODAY) && isValidReviewDate(TODAY))
  check('saved today + unchanged input is idempotent (disabled) AFTER persist only',
    isReviewDateSaveable(TODAY, TODAY) === false &&
    isReviewDateSaveable(null, TODAY) === true)
  check('saved date + different input is saveable',
    isReviewDateSaveable('2026-08-06', '2026-08-14') === true)
  check('empty input never saveable', isReviewDateSaveable(null, '') === false)
  check('invalid input never saveable',
    isReviewDateSaveable(null, '08/04/2026') === false &&
    isReviewDateSaveable(null, '2026-13-99') === false)

  // Persisting today end-to-end through the validator: the literal
  // date-only string round-trips untouched (no UTC drift) and the
  // saved decision is due for review immediately.
  const acceptedRow = current({ status: 'accepted' })
  const saveToday = validateDecisionUpdate(acceptedRow, { review_on: TODAY }, NOW)
  check('persisting today stores the literal YYYY-MM-DD (no drift)',
    saveToday.ok && saveToday.update.review_on === TODAY)
  check('persisted today is due today',
    isDueForReview({ review_on: TODAY, reviewed_at: null }, TODAY) === true)
  check('persisted future date remains not due (behavior unchanged)',
    (() => {
      const future = validateDecisionUpdate(acceptedRow, { review_on: '2026-08-14' }, NOW)
      return future.ok && future.update.review_on === '2026-08-14' &&
        !isDueForReview({ review_on: '2026-08-14', reviewed_at: null }, TODAY)
    })())
  check('clearing a saved date returns review_on to null',
    (() => {
      const cleared = validateDecisionUpdate(acceptedRow, { review_on: null }, NOW)
      return cleared.ok && cleared.update.review_on === null
    })())

  const card = readFileSync('src/components/decisions/DecisionCard.tsx', 'utf8')
  check('card save button uses the shared saveability rule',
    card.includes('isReviewDateSaveable(decision.review_on ?? null, reviewDateInput)'))
  check('card save button always submits the actual input value (never null)',
    card.includes('handleUpdate({ review_on: reviewDateInput })') &&
    !card.includes('review_on: reviewDateInput || null'))
  check('card input initializes to a real value (persisted date or today)',
    card.includes('useState(decision.review_on ?? todayISO())'))
}

// ── 8. Unknown fields and empty patches ──────────────────────────────
console.log('\n8. Patch hygiene')
{
  const r = validateDecisionUpdate(
    current({ status: 'accepted' }),
    { follow_through_status: 'completed', user_id: 'someone-else', reason: 'hax', applied_at: '1999' },
    NOW)
  check('unknown fields consistently ignored (never persisted)',
    r.ok && !('user_id' in r.update) && !('reason' in r.update) &&
    Object.keys(r.update).join(',') === 'follow_through_status,completed_at')
  check('patch with no recognized fields rejected',
    !validateDecisionUpdate(current(), { user_id: 'x' }, NOW).ok)
  const input = current({ status: 'accepted' })
  const snapshot = JSON.stringify(input)
  validateDecisionUpdate(input, { follow_through_status: 'completed' }, NOW)
  check('validator never mutates its inputs', JSON.stringify(input) === snapshot)
  check('no NaN/Infinity in validator output',
    !JSON.stringify(r).includes('NaN') && !JSON.stringify(r).includes('Infinity'))
  check('notes normalizer is pure',
    (() => {
      const n = '  hi  '
      const res = normalizeOutcomeNotes(n)
      return res.ok && res.value === 'hi' && n === '  hi  '
    })())
}

// ── 9. API-boundary source contracts ─────────────────────────────────
console.log('\n9. API boundary')
{
  const route = readFileSync('src/app/api/decisions/route.ts', 'utf8')
  check('PATCH validates through the shared state model',
    route.includes('validateDecisionUpdate('))
  check('unauthenticated update rejected',
    route.includes("json({ error: 'Unauthorized' }, { status: 401 })"))
  check('ownership enforced at the API boundary (user_id scoping on read and write)',
    (route.match(/\.eq\('user_id', user\.id\)/g) ?? []).length >= 3)
  check('unknown decision id returns a safe not-found',
    route.includes('maybeSingle') && route.includes("'Decision not found.'"))
  check('raw database errors never reach the response',
    !route.includes('error.message'))
  check('database failures log server-side',
    route.includes('console.error'))
  check('duplicate-prevention guard preserved (coach suggested per type)',
    route.includes("eq('decision_type', decisionType)") &&
    route.includes("eq('status', 'suggested')") &&
    route.includes('duplicate: true'))
  check('idempotent no-op returns the unchanged row without a write',
    route.includes('Object.keys(result.update).length === 0'))
  check('no service-role usage anywhere in src',
    !readFileSync('src/lib/supabase/server.ts', 'utf8').includes('SERVICE_ROLE') &&
    !route.toLowerCase().includes('service_role'))
}

// ── 10. UI/server agreement and no automatic writes ──────────────────
console.log('\n10. UI agreement and write discipline')
{
  const card = readFileSync('src/components/decisions/DecisionCard.tsx', 'utf8')
  check('client outcome options come from the SAME shared value list',
    card.includes('DECISION_OUTCOME_VALUES.map'))
  check('client notes input enforces the shared max length',
    card.includes('maxLength={OUTCOME_NOTES_MAX_LENGTH}'))
  check('no generic ambiguous "Done" control',
    !/>\s*Done\s*</.test(card))
  check('explicit labeled actions present',
    card.includes('Mark completed') && card.includes('Mark abandoned') &&
    card.includes('Not applicable') && card.includes('Set review date') &&
    card.includes('Record outcome'))
  check('failed update keeps card state (no optimistic success)',
    card.includes('if (!res.ok)') && card.includes('setError'))
  check('notes render as plain text (no HTML injection path)',
    !card.includes('dangerouslySetInnerHTML'))

  const coach = readFileSync('src/lib/coach-actions.ts', 'utf8')
  const weekly = readFileSync('src/lib/weekly-review.ts', 'utf8')
  // Strip comments — coach-actions' header documents the endpoint by
  // name; only actual calls matter.
  const coachCode = coach.replace(/\/\/.*$/gm, '')
  const weeklyCode = weekly.replace(/\/\/.*$/gm, '')
  check('no automatic decision insertion from coach or weekly review',
    !coachCode.includes("fetch('/api/decisions'") && !coachCode.includes('.insert(') &&
    !weeklyCode.includes('.insert(') && !weeklyCode.includes('.update('))
  check('no automatic target or routine mutation introduced',
    !/nutrition_targets|workout_routines/.test(
      readFileSync('src/lib/decisions.ts', 'utf8')))
  const dashboard = readFileSync('src/components/dashboard/DecisionLogCard.tsx', 'utf8')
  check('dashboard card unchanged (documented decision — no new counts)',
    !dashboard.includes('follow_through'))
}

// ── 11. Filters and coach/weekly invariants ──────────────────────────
console.log('\n11. Filters and invariants')
{
  const mk = (status: string, ft = 'not_started', review_on: string | null = null, reviewed_at: string | null = null) => ({
    status, follow_through_status: ft, review_on, reviewed_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any
  const rows = [
    mk('suggested'),
    mk('accepted'),
    mk('accepted', 'completed'),
    mk('applied'),
    mk('dismissed'),
    mk('accepted', 'completed', '2026-08-01', null),
    mk('applied', 'not_started', '2026-08-01', NOW),
  ]
  check('pending filter matches suggested only',
    rows.filter((d) => d.status === 'suggested').length === 1)
  check('accepted filter unchanged',
    rows.filter((d) => d.status === 'accepted').length === 3)
  check('applied filter unchanged',
    rows.filter((d) => d.status === 'applied').length === 2)
  check('dismissed filter unchanged',
    rows.filter((d) => d.status === 'dismissed').length === 1)
  check('needs-follow-through filter (accepted/applied, not started)',
    rows.filter((d) => needsFollowThrough(d)).length === 3)
  check('due-for-review filter (arrived, unreviewed)',
    rows.filter((d) => isDueForReview(d, TODAY)).length === 1)
  check('empty decision list state safe',
    ([] as typeof rows).filter((d) => needsFollowThrough(d)).length === 0)

  // Coach and weekly-review invariants (Phase 3A/3C untouched).
  const review = {
    daysElapsed: 5, weighInsThisWeek: 0, foodLoggedDays: 5, proteinStatus: 'meeting',
    sessionsCompleted: 2, stepGoal: null, stepLoggedDays: 0,
    availability: { weight: true, nutrition: true, training: true, activity: true, fasting: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
  const actions = buildCoachActions(review, { calorieSuggestion: null, calorieTrend: 'insufficient-data' } as never, 'fat_loss')
  check('coach decision metadata unchanged',
    actions.primaryAction?.decisionType === 'coach_log_weigh_in' &&
    actions.primaryAction?.title === 'Log a weigh-in this week')
  check('Phase 3C action logic unchanged (availability gating intact)',
    buildCoachActions(
      { ...review, availability: { ...review.availability, weight: false } },
      { calorieSuggestion: null, calorieTrend: 'insufficient-data' } as never, 'fat_loss'
    ).primaryAction?.type !== 'log_weigh_in')
  const empty3a = assembleWeeklyReview({
    todayStr: '2026-08-04', weekStart: '2026-07-27',
    weighInRows: [], foodLogRows: [], sessionRows: [], activityRows: [], fastRows: [],
    proteinTargetGrams: null, fastingEnabled: false,
  })
  check('Phase 3A weekly review unchanged',
    empty3a.range.label === 'Jul 27–Aug 2' &&
    resolveReviewWeekStart('2026-08-04', undefined) === '2026-07-27')
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
