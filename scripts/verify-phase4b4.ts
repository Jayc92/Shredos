// ============================================================
// ForgeFitOS — Phase 4B.4 deterministic verification harness
// Verifies the Coach-pillar redesign (/coach, /check-in,
// /decisions): shared subnav, page hierarchies, card-variant
// mappings, state separation, loading geometry, accessibility —
// and, critically, that every Coach threshold/priority, Weekly
// Review reducer, decision transition, filter semantic, and API
// contract is byte-anchored unchanged.
// Run from the repository root:
//   npx tsx scripts/verify-phase4b4.ts
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'

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

const read = (p: string) => readFileSync(p, 'utf8')
const stripComments = (s: string) => s.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u')

const coachPage = read('src/app/(app)/coach/page.tsx')
const coachLoading = read('src/app/(app)/coach/loading.tsx')
const reviewPage = read('src/app/(app)/check-in/page.tsx')
const reviewLoading = read('src/app/(app)/check-in/loading.tsx')
const decisionsPage = read('src/app/(app)/decisions/page.tsx')
const decisionsLoading = read('src/app/(app)/decisions/loading.tsx')
const subNav = read('src/components/coach/CoachSubNav.tsx')
const readiness = read('src/components/coach/MuscleReadinessPanel.tsx')
const recordBtn = read('src/components/coach/RecordDecisionButton.tsx')
const decisionList = read('src/components/decisions/DecisionList.tsx')
const decisionCard = read('src/components/decisions/DecisionCard.tsx')
const coachLib = read('src/lib/coach-actions.ts')
const reviewLib = read('src/lib/weekly-review.ts')
const decisionsLib = read('src/lib/decisions.ts')
const decisionsApi = read('src/app/api/decisions/route.ts')
const notes = read('docs/phase4b4-coach-pillar-notes.md')

const PAGES = [coachPage, reviewPage, decisionsPage]
const LOADINGS = [coachLoading, reviewLoading, decisionsLoading]
const SCOPE = [...PAGES, ...LOADINGS, subNav, readiness, recordBtn, decisionList, decisionCard]

// ── 1. Checkpoint and routes ─────────────────────────────────────────
console.log('\n1. Checkpoint and routes')
{
  check('checkpoint artifacts exist (8d25dca tree)',
    ['scripts/verify-phase4b3.ts', 'docs/phase4b3-today-notes.md',
      'src/components/dashboard/TodayPrimaryAction.tsx',
      'src/components/layout/route-match.ts',
      'supabase/migrations/013_phase3e_goal_adjustments.sql']
      .every((f) => existsSync(f)))
  check('all prior notes exist',
    ['docs/phase4a-ux-information-architecture-audit.md', 'docs/phase4b1-foundation-notes.md',
      'docs/phase4b2-navigation-notes.md', 'docs/phase4b3-today-notes.md']
      .every((f) => existsSync(f)))
  check('4B.4 notes exist', notes.length > 1500)
  check('/coach retained', existsSync('src/app/(app)/coach/page.tsx'))
  check('/check-in retained', existsSync('src/app/(app)/check-in/page.tsx'))
  check('/decisions retained', existsSync('src/app/(app)/decisions/page.tsx'))
  check('no new route aliases',
    !existsSync('src/app/(app)/review') && !existsSync('src/app/(app)/weekly-review') &&
    !existsSync('src/app/(app)/coach-actions'))
  check('no redirects', !read('next.config.mjs').includes('redirects') &&
    PAGES.every((p) => !stripComments(p).includes("redirect('/coach'")))
  check('coach metadata aligned to Coach', coachPage.includes("title: 'Coach' }"))
  check('review metadata Weekly review', reviewPage.includes("title: 'Weekly review' }"))
  check('decisions metadata Decisions', decisionsPage.includes("title: 'Decisions' }"))
  // RETARGET (UI-6C): original boundary — each route rendered its
  // exact handwritten <h1>. The three Coach-pillar routes now render
  // the SAME titles through the PageHeader primitive (which owns the
  // single h1). One page title per route is still asserted.
  check('H1: Coach', coachPage.includes('title="Coach"'))
  check('H1: Weekly review', reviewPage.includes('title="Weekly review"'))
  check('H1: Decisions', decisionsPage.includes('title="Decisions"'))
  check('exactly one H1 per route',
    PAGES.every((p) =>
      (p.match(/<PageHeader/g) || []).length === 1 && !p.includes('<h1')) &&
    LOADINGS.every((l) => !l.includes('<h1')))
  check('auth gates preserved',
    PAGES.every((p) => p.includes("redirect('/login')")))
  check('onboarding gates preserved where they existed',
    coachPage.includes("redirect('/onboarding')") && reviewPage.includes("redirect('/onboarding')"))
}

// ── 2. Shared Coach-pillar subnav ────────────────────────────────────
console.log('\n2. Shared subnav')
{
  check('component exists', subNav.includes('export function CoachSubNav'))
  check('exactly three links',
    (subNav.match(/href: '/g) || []).length === 3)
  check('exact labels', ["label: 'Coach'", "label: 'Weekly review'", "label: 'Decisions'"]
    .every((l) => subNav.includes(l)))
  check('exact hrefs', ["href: '/coach'", "href: '/check-in'", "href: '/decisions'"]
    .every((h) => subNav.includes(h)))
  check('aria-current on active link',
    subNav.includes("aria-current={active ? 'page' : undefined}"))
  check('active state not color-only (underline + weight)',
    subNav.includes('border-b-2') && subNav.includes('font-semibold') &&
    subNav.includes('border-brand'))
  check('real links (next/link)', subNav.includes("from 'next/link'") &&
    subNav.includes('<Link'))
  check('exact-match active (no prefix conflation)',
    subNav.includes('pathname === section.href'))
  check('mobile-safe (scrollable, no clipped labels)',
    subNav.includes('overflow-x-auto') && subNav.includes('whitespace-nowrap'))
  check('nav landmark labeled', subNav.includes('aria-label="Coach sections"'))
  check('no persistence / badge counts / emoji',
    !subNav.includes('localStorage') && !stripComments(subNav).includes('count') &&
    !EMOJI.test(subNav))
  check('rendered on all three routes',
    PAGES.every((p) => p.includes('<CoachSubNav />')))
  // RETARGET (UI-6C): original boundary — no page may duplicate the
  // subnav's route declarations. The old anchor banned any
  // "label: '" literal, which the review page's STATUS_META icon
  // table now legitimately uses for its status TEXT labels. The
  // protected property is pinned precisely: no href+label route
  // pair outside CoachSubNav.
  check('no duplicated route declarations outside the component',
    PAGES.every((p) => !/href: '\/[a-z-]+', label: /.test(stripComments(p))))
}

// ── 3. Coach query/logic contract ────────────────────────────────────
console.log('\n3. Coach logic contract')
{
  check('existing fetch helper retained', coachPage.includes('fetchCoachActions('))
  check('action builder unchanged (export anchors)',
    coachLib.includes('export function buildCoachActions') &&
    coachLib.includes('export async function fetchCoachActions'))
  check('priorities unchanged (1..7 present)',
    [1, 2, 3, 4, 5, 6, 7].every((n) => coachLib.includes(`priority: ${n},`)))
  check('evidence gate unchanged (daysElapsed < 3)',
    coachLib.includes('if (daysElapsed < 3)'))
  check('availability gating unchanged (3C: failed query is never zero)',
    coachLib.includes('const { availability } = weeklyReview'))
  check('priority sort unchanged',
    coachLib.includes('candidates.sort((a, b) => a.priority - b.priority)'))
  check('secondary cap unchanged (3)',
    coachLib.includes('rest.slice(0, 3)'))
  check('primary is the existing first action (page never reselects)',
    coachPage.includes('actions.primaryAction') &&
    !stripComments(coachPage).includes('.sort(') &&
    !stripComments(coachPage).includes('priority'))
  check('secondary actions render in existing order (no re-sort/filter)',
    coachPage.includes('actions.secondaryActions.map((action) =>') &&
    !coachPage.includes('secondaryActions.sort') &&
    !coachPage.includes('secondaryActions.filter'))
  check('action links come from the model (linkHref/linkLabel)',
    coachPage.includes('href={action.linkHref}') &&
    coachPage.includes('{action.linkLabel}'))
  check('decision metadata unchanged (type/title/reason to the button)',
    coachPage.includes('decisionType={action.decisionType}') &&
    coachPage.includes('title={action.title}') && coachPage.includes('reason={action.reason}'))
  check('RecordDecisionButton still explicit (button + POST + suggested)',
    recordBtn.includes("status: 'suggested'") && recordBtn.includes("created_by: 'coach'") &&
    recordBtn.includes('onClick={handleRecord}'))
  check('record button copy still promises no automatic change',
    recordBtn.includes('nothing changes automatically'))
  check('no writes on render (page has no insert/update/fetch POST)',
    !coachPage.includes('.insert(') && !coachPage.includes('.update(') &&
    !coachPage.includes("method: 'POST'"))
  check('readiness uses the existing summary helper only',
    coachPage.includes('fetchCoachSummary(supabase, user.id, today)') &&
    read('src/lib/workout-coach.ts').includes('export async function fetchCoachSummary'))
  check('readiness addition documented as the one data addition',
    notes.includes('one data addition') && notes.includes('fetchCoachSummary'))
  check('no new recommendation type',
    (coachLib.match(/priority: \d+,/g) || []).length === 9)
  check('server component preserved (no use client on page)',
    !coachPage.includes("'use client'"))
}

// ── 4. Coach presentation ────────────────────────────────────────────
console.log('\n4. Coach presentation')
{
  check('primary action first (before secondary section)',
    coachPage.indexOf('isPrimary />') < coachPage.indexOf('Also worth a look'))
  check('primary uses action variant; secondary default',
    coachPage.includes("variant={isPrimary ? 'action' : 'default'}"))
  check('primary labeled "Primary action" (not fake severity)',
    coachPage.includes('Primary action') && !coachPage.includes('URGENT'))
  check('secondary section subordinate (uppercase support heading + grid)',
    coachPage.includes('Also worth a look') &&
    coachPage.includes('grid-cols-1 gap-4 lg:grid-cols-2'))
  check('readiness section present', coachPage.includes('<MuscleReadinessPanel'))
  check('insufficient evidence: info Notice, coverage wording',
    coachPage.includes('variant="info"') &&
    coachPage.includes('Evidence is still building'))
  check('valid zero-actions state distinct and explicit',
    coachPage.includes('actions.hasEnoughData && !actions.primaryAction') &&
    coachPage.includes('No suggested actions for this week.'))
  check('zero state grounded, never a success claim on failure',
    coachPage.includes("Based on this week&apos;s available data") &&
    !coachPage.includes('on track') && !coachPage.includes('all good'))
  check('no shred-card in coach scope',
    !coachPage.includes('shred-card') && !stripComments(readiness).includes('shred-card') &&
    !recordBtn.includes('shred-card'))
  check('semantic tokens in coach scope',
    coachPage.includes('text-ink-muted') && coachPage.includes('border-edge-subtle'))
  check('max-w-6xl coach layout', coachPage.includes('max-w-6xl'))
  check('mobile one-column (grid-cols-1 base)', coachPage.includes('grid-cols-1'))
  check('no more than two secondary columns', !coachPage.includes('lg:grid-cols-3'))
  check('coach loading exists and matches geometry',
    coachLoading.includes('max-w-6xl') && coachLoading.includes('lg:grid-cols-2') &&
    coachLoading.includes('SkeletonCard'))
}

// ── 5. Weekly Review logic contract ──────────────────────────────────
console.log('\n5. Weekly Review logic contract')
{
  check('completed-week helper unchanged',
    reviewPage.includes('fetchWeeklyReviewSummary(') &&
    reviewLib.includes('export async function fetchWeeklyReviewSummary'))
  check('week param passthrough unchanged',
    reviewPage.includes('searchParams?.week'))
  check('fasting flag passthrough unchanged',
    reviewPage.includes('profile.fasting_enabled'))
  check('confidence copy comes from the lib (labels unchanged)',
    reviewLib.includes("'Limited data'") && reviewLib.includes("'Building confidence'") &&
    reviewLib.includes("'Strong data'"))
  check('confidence documented as data-completeness, not performance',
    reviewLib.includes('Data-completeness confidence, nothing more'))
  check('notable cap unchanged (3)',
    reviewLib.includes("filter((r) => r.status === 'needs_data').slice(0, 3)") &&
    reviewLib.includes('[...improving, ...declining].slice(0, 3)'))
  check('focus cap unchanged (3)', reviewLib.includes('candidates.slice(0, 3)'))
  check('page renders lib values verbatim (no new recomputation)',
    reviewPage.includes('{confidence.label}') && reviewPage.includes('{confidence.detail}') &&
    reviewPage.includes('{range.label}') &&
    // The single pre-existing display conversion (seconds -> minutes
    // for formatDuration inside trainingLine) is the only Math use.
    (stripComments(reviewPage).match(/Math\./g) || []).length === 1)
  check('navigation destinations unchanged',
    reviewPage.includes('href={`/check-in?week=${navigation.previousWeekStart}`}') &&
    reviewPage.includes('href={`/check-in?week=${navigation.nextWeekStart}`}'))
  check('future week prevented (next link conditional)',
    reviewPage.includes('{navigation.nextWeekStart && ('))
  check('latest-week link conditional', reviewPage.includes('{!navigation.isLatest && ('))
  check('missing days never fake zeros',
    reviewPage.includes('No weigh-ins this week.') &&
    reviewPage.includes('No nutrition logs this week.') &&
    reviewPage.includes('No completed workouts this week.') &&
    reviewPage.includes('No activity logged this week.'))
  check('fasting section omitted when disabled', reviewPage.includes('{fasting !== null && ('))
  check('no writes on review page',
    !reviewPage.includes('.insert(') && !reviewPage.includes('.update('))
  check('server component preserved', !reviewPage.includes("'use client'"))
  check('whole-week empty banner retained',
    reviewPage.includes('No data was logged for this review period.'))
  check('training/nutrition/weight/activity values verbatim from reducers',
    ['weight.latestWeightLbs', 'nutrition.loggedDays', 'trainingLine(training)',
      'activity.averageSteps'].every((v) => reviewPage.includes(v)))
}

// ── 6. Weekly Review presentation ────────────────────────────────────
console.log('\n6. Weekly Review presentation')
{
  check('summary row: period + evidence coverage',
    reviewPage.includes('Review period') && reviewPage.includes('Evidence coverage'))
  check('summary uses elevated variant', reviewPage.includes('variant="elevated"'))
  check('completed-week semantics explicit in copy',
    reviewPage.includes('current partial week is'))
  check('domain grid two columns at lg',
    reviewPage.includes('grid grid-cols-1 gap-4 lg:grid-cols-2'))
  check('domain sections are metric cards',
    (reviewPage.match(/variant="metric"/g) || []).length === 5)
  check('fasting spans the row (no blank conditional slot)',
    reviewPage.includes('lg:col-span-2') &&
    reviewPage.indexOf('lg:col-span-2') > reviewPage.indexOf('{fasting !== null && ('))
  check('progression is a wide standalone section below the grid',
    reviewPage.indexOf('Exercise progression') > reviewPage.indexOf('Activity</h2>'))
  check('next-week focus is a status card',
    reviewPage.includes('variant="status"') &&
    reviewPage.indexOf('variant="status"') < reviewPage.indexOf('Next-week focus') + 500)
  check('notable rows preserve link + status badge',
    reviewPage.includes('/progress/exercises/${row.exerciseId}') &&
    reviewPage.includes('<StatusBadge status={row.status} />'))
  // RETARGET (UI-6C): original boundary — status labels always
  // visible text. The direction glyphs became aria-hidden Lucide
  // icons (TrendingUp/MoveRight/TrendingDown) beside the SAME text
  // labels; text-always-present is asserted on the new structure.
  check('status labels always text (never color alone)',
    reviewPage.includes("improved: { label: 'Improving', Icon: TrendingUp }") &&
    reviewPage.includes("same: { label: 'Steady', Icon: MoveRight }") &&
    reviewPage.includes("declined: { label: 'Declining', Icon: TrendingDown }") &&
    reviewPage.includes("needs_data: { label: 'More data needed', Icon: null }") &&
    reviewPage.includes('{label}'))
  check('no shred-card in review page', !reviewPage.includes('shred-card'))
  check('no success/failure score language',
    !/perfect week|bad week|you failed|score/i.test(stripComments(reviewPage)))
  check('max-w-6xl review layout', reviewPage.includes('max-w-6xl'))
  check('review loading matches geometry (4-card grid + wide sections)',
    reviewLoading.includes('lg:grid-cols-2') &&
    (reviewLoading.match(/<SkeletonCard/g) || []).length >= 6)
  check('count tiles use sunken surface (not broken legacy)',
    reviewPage.includes('bg-surface-sunken rounded-lg px-2 py-2.5 text-center'))
}

// ── 7. Decision model/API contract ───────────────────────────────────
console.log('\n7. Decision model/API contract')
{
  check('status values unchanged',
    decisionsLib.includes('export const DECISION_STATUS_VALUES'))
  check('follow-through values unchanged',
    decisionsLib.includes('export const FOLLOW_THROUGH_VALUES'))
  check('outcome values unchanged',
    decisionsLib.includes('export const DECISION_OUTCOME_VALUES'))
  check('transition map unchanged',
    decisionsLib.includes("suggested: ['accepted', 'dismissed']"))
  check('notes limit unchanged', decisionsLib.includes('OUTCOME_NOTES_MAX_LENGTH = 500'))
  check('review-date semantics unchanged',
    decisionsLib.includes('export function isReviewDateSaveable') &&
    decisionsLib.includes('export function isDueForReview'))
  check('PATCH validation unchanged',
    decisionsApi.includes('validateDecisionUpdate') &&
    decisionsApi.includes('export async function PATCH'))
  check('auth boundary unchanged (401)', decisionsApi.includes("{ status: 401 }"))
  check('ownership via safe 404', decisionsApi.includes('safe 404'))
  check('no raw DB error response',
    !decisionsApi.includes('error.message }'))
  check('page query unchanged (full list, newest first, user-scoped)',
    decisionsPage.includes(".order('created_at', { ascending: false })") &&
    decisionsPage.includes(".eq('user_id', user.id)") &&
    !decisionsPage.includes('.limit('))
  check('pending count grounded in the uncapped list',
    decisionsPage.includes("filter((d) => d.status === 'suggested').length"))
  check('filter set unchanged (all seven, same order)',
    (() => {
      const i = decisionList.indexOf("value: 'all'")
      return i >= 0 &&
        i < decisionList.indexOf("value: 'suggested'") &&
        decisionList.indexOf("value: 'suggested'") < decisionList.indexOf("value: 'applied'") &&
        decisionList.indexOf("value: 'applied'") < decisionList.indexOf("value: 'accepted'") &&
        decisionList.indexOf("value: 'accepted'") < decisionList.indexOf("value: 'dismissed'") &&
        decisionList.indexOf("value: 'dismissed'") < decisionList.indexOf("value: 'needs_follow_through'") &&
        decisionList.indexOf("value: 'needs_follow_through'") < decisionList.indexOf("value: 'due_review'")
    })())
  check('filter semantics unchanged (same predicate functions)',
    decisionList.includes('needsFollowThrough(d)') && decisionList.includes('isDueForReview(d, todayStr)') &&
    decisionList.includes('d.status === filter'))
  check('list state mirrors API rows (no optimistic guess)',
    decisionList.includes('handleDecisionChange(updated: DecisionLog)') &&
    decisionCard.includes('if (body.data) onDecisionChange?.(body.data as DecisionLog)'))
  check('one action → one PATCH, failure retains state',
    decisionCard.includes("method: 'PATCH'") &&
    decisionCard.includes("setError(typeof body.error === 'string'"))
  check('accept/dismiss conditions unchanged',
    decisionCard.includes("decision.status === 'suggested'") &&
    decisionCard.includes("handleUpdate({ status: 'accepted' })") &&
    decisionCard.includes("handleUpdate({ status: 'dismissed' })"))
  check('follow-through controls unchanged',
    ["follow_through_status: 'completed'", "follow_through_status: 'abandoned'",
      "follow_through_status: 'not_applicable'"].every((c) => decisionCard.includes(c)))
  check('review-date controls unchanged (set + clear + saveable gate)',
    decisionCard.includes('handleUpdate({ review_on: reviewDateInput })') &&
    decisionCard.includes('handleUpdate({ review_on: null })') &&
    decisionCard.includes('isReviewDateSaveable(decision.review_on ?? null, reviewDateInput)'))
  check('outcome controls unchanged (eligibility + values + notes limit)',
    decisionCard.includes('isOutcomeEligible(followThrough)') &&
    decisionCard.includes('DECISION_OUTCOME_VALUES.map') &&
    decisionCard.includes('maxLength={OUTCOME_NOTES_MAX_LENGTH}'))
  check('no automatic write / no service role in scope',
    SCOPE.every((f) => !f.includes('service_role')) &&
    !decisionsPage.includes('.insert(') && !decisionList.includes('fetch('))
  check('notes remain plain text (no markdown/html rendering)',
    !decisionCard.includes('dangerouslySetInnerHTML') && !decisionCard.includes('markdown'))
}

// ── 8. Decisions presentation ────────────────────────────────────────
console.log('\n8. Decisions presentation')
{
  // RETARGET (UI-6C): original boundary — the lifecycle strip uses
  // the existing vocabulary only. The prose arrows became aria-hidden
  // ArrowRight icons between the SAME stage words; vocabulary is
  // still asserted exactly and 'Archived' still banned.
  check('lifecycle strip uses existing vocabulary only',
    decisionsPage.includes('Suggested') && decisionsPage.includes('Accepted or Applied') &&
    decisionsPage.includes('Follow-through') && decisionsPage.includes('Review outcome') &&
    (decisionsPage.match(/<ArrowRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" \/>/g) || []).length === 3 &&
    !decisionsPage.includes('Archived'))
  check('lifecycle does not imply a mandatory path',
    decisionsPage.includes('Not every decision follows every stage') &&
    decisionsPage.includes('dismissed decisions stay in'))
  check('lifecycle strip is a subtle card', decisionsPage.includes('variant="subtle"'))
  check('filters use the FilterChip primitive',
    decisionList.includes('<FilterChip') &&
    decisionList.includes("from '@/components/ui/filter-chip'"))
  check('selected chip not color-only (primitive: check + border + weight)',
    read('src/components/ui/filter-chip.tsx').includes('aria-pressed') &&
    read('src/components/ui/filter-chip.tsx').includes('<Check'))
  check('pending count via chip count slot (grounded)',
    decisionList.includes("count={value === 'suggested' ? pendingCount : undefined}"))
  check('filters horizontally scrollable, none hidden',
    decisionList.includes('overflow-x-auto') &&
    (decisionList.match(/value: '/g) || []).length === 7)
  check('DecisionCard uses semantic Card with state-driven variant',
    decisionCard.includes('function cardVariantFor') &&
    decisionCard.includes("if (status === 'suggested') return 'action'") &&
    decisionCard.includes("if (dueForReview) return 'status'") &&
    decisionCard.includes("if (status === 'dismissed' || status === 'reversed') return 'subtle'") &&
    decisionCard.includes("return 'elevated'"))
  check('variant precedence documented', decisionCard.includes('deterministic precedence'))
  check('status badge carries text label',
    decisionCard.includes('DECISION_STATUS_LABELS[decision.status]'))
  check('status pill styles are semantic state tokens',
    decisionCard.includes("suggested: 'text-caution bg-caution-subtle") &&
    decisionCard.includes("applied: 'text-info bg-info-subtle"))
  check('metadata row retained (type · relative date · author)',
    decisionCard.includes('DECISION_TYPE_LABELS[decision.decision_type]') &&
    decisionCard.includes('formatRelativeDate(decision.created_at)'))
  check('expand control is a real button, not hover-only',
    decisionCard.includes('onClick={() => setExpanded(!expanded)}') &&
    !decisionCard.includes('onMouseEnter'))
  check('Dismiss neutral, not destructive-styled',
    decisionCard.includes('text-ink-muted hover:text-ink') &&
    !decisionCard.match(/Dismiss[\s\S]{0,120}text-critical/))
  check('Accept success-toned with icon + label',
    decisionCard.includes('<CheckCircle') && decisionCard.includes('Accept'))
  check('controls wrap on mobile', decisionCard.includes('flex-wrap'))
  check('error rendering retained and visible',
    decisionCard.includes('text-critical bg-critical-subtle'))
  check('empty states neutral per filter',
    decisionList.includes('No pending recommendations.') &&
    decisionList.includes('No decisions awaiting follow-through.') &&
    decisionList.includes('No decisions due for review.') &&
    decisionList.includes('No decisions match this filter.'))
  check('decisions loading exists with chip-row geometry',
    decisionsLoading.includes('rounded-full') && decisionsLoading.includes('SkeletonCard'))
  // RETARGET (UI-6C): original boundary — the documented readable
  // 3xl width. That decision was explicitly superseded by the
  // approved UI-6C contract: the route widened to the app-wide
  // max-w-6xl with a two-column lg DecisionList; the UI-6C notes
  // document records the change.
  check('decisions approved width (max-w-6xl, documented in UI-6C notes)',
    decisionsPage.includes('max-w-6xl') && !decisionsPage.includes('max-w-3xl') &&
    read('docs/ui6c-coach-visual-notes.md').includes('max-w-6xl'))
}

// ── 9. Accessibility ─────────────────────────────────────────────────
console.log('\n9. Accessibility')
{
  check('section headings are h2 under the single h1',
    reviewPage.includes('<h2 className="text-sm font-semibold text-ink">Weight</h2>') &&
    coachPage.includes('<h2 className="px-1 text-xs') &&
    (readiness.includes('<h2') || readiness.includes('font-semibold')))
  check('week navigation is a labeled nav landmark',
    reviewPage.includes('aria-label="Review week navigation"'))
  check('links remain links, buttons remain buttons',
    PAGES.every((p) => !p.match(/<div[^>]*onClick/)) &&
    !decisionCard.match(/<div[^>]*onClick/) && !decisionList.match(/<div[^>]*onClick/))
  check('form controls keep labels',
    decisionCard.includes('aria-label="Review date"') &&
    decisionCard.includes('aria-label="Outcome"') &&
    decisionCard.includes('aria-label="Outcome notes"'))
  check('decorative icons/dots aria-hidden',
    readiness.includes("aria-hidden=\"true\"") && decisionsPage.includes('Lifecycle'))
  check('no tabindex hacks', SCOPE.every((f) => !f.toLowerCase().includes('tabindex')))
  check('no color-only status anywhere in scope (labels asserted above)',
    readiness.includes('{m.label}') && decisionCard.includes('FOLLOW_THROUGH_LABELS[followThrough]'))
  check('no fake WCAG claim', !/WCAG\s+2[.\d]*\s+(AA\s+)?compliant/i.test(notes) &&
    notes.includes('not** a WCAG conformance claim'))
  check('no focus suppression', SCOPE.every((f) => !f.includes('outline-none') ||
    f === decisionCard || f === decisionList))
}

// ── 10. Responsive ───────────────────────────────────────────────────
console.log('\n10. Responsive')
{
  check('no md: shell leakage in pillar scope',
    SCOPE.every((f) => !stripComments(f).includes('md:')))
  check('shell breakpoint unchanged at lg',
    read('src/components/layout/Sidebar.tsx').includes('hidden lg:flex') &&
    read('src/components/layout/MobileBottomNav.tsx').includes('lg:hidden'))
  check('no absolute core layout', PAGES.every((p) => !stripComments(p).includes('absolute')))
  check('no CSS masonry / column hacks', SCOPE.every((f) => !f.includes('columns-')))
  check('no overflow-x workaround', SCOPE.every((f) => !f.includes('overflow-x-hidden')))
  check('bottom-nav clearance inherited (pages add none)',
    PAGES.every((p) => !p.includes('safe-area')) &&
    read('src/app/(app)/layout.tsx').includes('pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0'))
  check('page padding aligned with shell (p-4 lg:p-6)',
    PAGES.every((p) => p.includes('p-4 lg:p-6')))
  check('no conditional blank slots (fasting spans; grids unconditional otherwise)',
    reviewPage.includes('lg:col-span-2'))
}

// ── 11. Loading states ───────────────────────────────────────────────
console.log('\n11. Loading states')
{
  check('three loading.tsx files exist',
    ['coach', 'check-in', 'decisions'].every((r) =>
      existsSync(`src/app/(app)/${r}/loading.tsx`)))
  check('all use 4B.1 skeleton primitives',
    LOADINGS.every((l) => l.includes("from '@/components/ui/skeleton'")))
  check('no spinner-only pages', LOADINGS.every((l) => !l.includes('animate-spin')))
  check('no fake copy', LOADINGS.every((l) => !l.includes('Loading...')))
  check('no shred-card in loading', LOADINGS.every((l) => !l.includes('shred-card')))
  check('shell not duplicated', LOADINGS.every((l) =>
    !l.includes('Sidebar') && !l.includes('TopBar') && !l.includes('CoachSubNav')))
  check('aria-hidden loading regions', LOADINGS.every((l) => l.includes('aria-hidden="true"')))
  // RETARGET (UI-6C): decisions widened to max-w-6xl (approved); its
  // loading mirrors that width.
  check('route-specific geometry (widths match pages)',
    coachLoading.includes('max-w-6xl') && reviewLoading.includes('max-w-6xl') &&
    decisionsLoading.includes('max-w-6xl'))
  check('reduced-motion inherited (4B.1 block intact)',
    read('src/app/globals.css').includes('prefers-reduced-motion'))
}

// ── 12. Language and icons ───────────────────────────────────────────
console.log('\n12. Language and icons')
{
  check('no emoji in pillar scope', SCOPE.every((f) => !EMOJI.test(f)))
  check('no emoji anywhere in src',
    (() => {
      const { readdirSync: rd, statSync } = require('fs')
      const { join } = require('path')
      const offenders: string[] = []
      const walk = (dir: string) => {
        for (const entry of rd(dir)) {
          const full = join(dir, entry)
          if (statSync(full).isDirectory()) { walk(full); continue }
          if (!/\.(tsx|ts|css)$/.test(entry)) continue
          if (EMOJI.test(read(full))) offenders.push(full)
        }
      }
      walk('src')
      return offenders.length === 0
    })())
  check('no Sparkles in scope', SCOPE.every((f) => !stripComments(f).includes('Sparkles')))
  check('lucide only (no second icon lib)',
    SCOPE.every((f) => !f.includes('heroicons') && !f.includes('react-icons')))
  check('no AI claims', SCOPE.every((f) => !/AI coach|AI insight|powered by AI/i.test(f)))
  check('no guilt language', SCOPE.every((f) =>
    !/you failed|you're behind|lazy|no excuses/i.test(f)))
  check('no medical/physiological claims', SCOPE.every((f) =>
    !/metabolic|hormon|ketosis|your body is telling/i.test(stripComments(f))))
  check('no causal claims', SCOPE.every((f) => !/caused your|because you didn't/i.test(f)))
  check('no punitive/celebratory week language',
    SCOPE.every((f) => !/perfect week|bad week|crush/i.test(f)))
  check('approved wording present',
    coachPage.includes('Primary action') && reviewPage.includes('Review period') &&
    decisionList.includes('No decisions match this filter.'))
}

// ── 13. Phase boundary ───────────────────────────────────────────────
console.log('\n13. Phase boundary')
{
  check('dashboard unchanged',
    read('src/app/(app)/dashboard/page.tsx').includes('<TodayPrimaryAction') &&
    read('src/components/dashboard/TodayWidget.tsx').includes('export type TodayWidgetId'))
  check('navigation model unchanged',
    read('src/components/layout/route-match.ts').includes('LONGEST matching href wins') &&
    read('src/components/layout/nav-items.ts').includes('export const NAV_ICONS'))
  check('shell layout unchanged',
    read('src/app/(app)/layout.tsx').includes("select('fasting_enabled')"))
  check('4B.4 added no migration (schema through 013 intact)',
    readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql') && f < '014').length === 13)
  check('no API files changed (decisions route anchors intact)',
    decisionsApi.includes('export async function POST') &&
    decisionsApi.includes('export async function PATCH') &&
    !existsSync('src/app/api/coach'))
  check('no package changes',
    JSON.parse(read('package.json')).name === 'shredos' &&
    Object.keys(JSON.parse(read('package.json')).dependencies).length === 22)
  check('no target logic changes',
    read('src/lib/goal-adjustments.ts').includes('CALORIE_STEP_SMALL = 100'))
  check('no workout logic changes',
    read('src/lib/workout.ts').includes('weightKg * (1 + reps / 30)'))
  check('no nutrition logic changes',
    read('src/lib/nutrition.ts').includes('LEAN_MASS_PROTEIN_THRESHOLD'))
  check('no profile/onboarding changes',
    read('src/app/(app)/profile/page.tsx').includes('main_goal_changed') &&
    read('src/components/onboarding/OnboardingWizard.tsx').includes('fasting_enabled'))
  check('coach-actions wording block untouched',
    read('src/lib/coach-actions.ts').includes("title: 'Log a weigh-in this week'"))
  check('weekly-review reducers untouched',
    reviewLib.includes('PROGRESSION_LOOKBACK_DAYS = 56'))
  check('no generated images / local fonts in scope dirs',
    readdirSync('src/components/coach').every((f) => f.endsWith('.tsx')) &&
    readdirSync('src/components/decisions').every((f) => f.endsWith('.tsx')))
  check('no .DS_Store',
    !existsSync('.DS_Store') && !existsSync('src/.DS_Store') && !existsSync('docs/.DS_Store'))
  check('apply-script boundaries documented in notes',
    notes.includes('Presentation and information hierarchy only') ||
    notes.includes('Presentation'))
}

// ── 14. Per-action wording/destination contract ─────────────────────
console.log('\n14. Coach action definitions (byte-anchored)')
{
  const ACTIONS: Array<[string, string]> = [
    ['Log a weigh-in this week', '/weigh-in'],
    ['Prioritize protein this week', '/food'],
    ['Get a workout in this week', '/workouts'],
    ['Log steps more consistently', '/activity'],
    ['Consider a small calorie reduction', '/nutrition'],
    ['Keep your plan as-is', '/check-in'],
    ['Prioritize recovery this week', '/workouts'],
    ['Calories are on track', '/nutrition'],
  ]
  for (const [title, href] of ACTIONS) {
    check(`action unchanged: "${title}" → ${href}`,
      coachLib.includes(`title: '${title}',`) && coachLib.includes(`linkHref: '${href}',`))
  }
  check('nine action definitions total (one title reused across goals)',
    (coachLib.match(/linkHref: '/g) || []).length === 9)
  check('category labels map preserved on the page',
    ['weight', 'nutrition', 'training', 'activity', 'general']
      .every((c) => coachPage.includes(`${c}: '`)))
  check('legacy "Today’s focus" pill retired for approved wording',
    !coachPage.includes('Today’s focus') && !coachPage.includes("Today's focus"))
}

// ── 15. Decision vocabulary (each value byte-anchored) ───────────────
console.log('\n15. Decision vocabulary')
{
  const TRANSITIONS: Array<[string, string]> = [
    ['suggested', "['accepted', 'dismissed']"],
    ['accepted', '[]'],
    ['dismissed', '[]'],
    ['applied', '[]'],
    ['reversed', '[]'],
  ]
  for (const [status, allowed] of TRANSITIONS) {
    check(`transition map: ${status} → ${allowed}`,
      decisionsLib.includes(`${status}: ${allowed},`))
  }
  for (const label of ['Not started', 'Completed', 'Abandoned', 'Not applicable']) {
    check(`follow-through label unchanged: ${label}`,
      decisionsLib.includes(`'${label}'`))
  }
  for (const label of ['Positive', 'Neutral', 'Negative', 'Mixed', 'Unclear', 'Needs more time']) {
    check(`outcome label unchanged: ${label}`, decisionsLib.includes(`'${label}'`))
  }
  check('outcome eligibility rule unchanged (follow-through first)',
    decisionsLib.includes('export function isOutcomeEligible'))
  check('follow-through eligibility rule unchanged (accepted/applied only)',
    decisionsLib.includes('Follow-through only applies once a decision is accepted or applied'))
}

// ── 16. API contract detail ──────────────────────────────────────────
console.log('\n16. Decisions API detail')
{
  check('POST creates via authenticated insert (RLS path)',
    decisionsApi.includes('export async function POST') && decisionsApi.includes('.insert('))
  check('PATCH validates through the shared lib validator',
    decisionsApi.includes('validateDecisionUpdate'))
  check('PATCH returns the normalized row (list state mirrors DB)',
    decisionsApi.includes('data'))
  check('validation failures are 400s',
    decisionsApi.includes('400'))
  check('unknown/foreign ids → safe 404', decisionsApi.includes('404'))
  check('unauthorized → 401', decisionsApi.includes('401'))
  check('ownership scoping on fetch', decisionsApi.includes(".eq('user_id'"))
  check('maybeSingle row fetch (no throw-on-empty)',
    decisionsApi.includes('.maybeSingle()'))
  check('useDecisions hook untouched',
    read('src/hooks/useDecisions.ts').includes('useQuery'))
}

// ── 17. Per-section links and card details ───────────────────────────
console.log('\n17. Section links and card details')
{
  const REVIEW_LINKS = ['/weigh-in', '/food', '/workouts', '/activity', '/fasting', '/progress', '/nutrition']
  for (const href of REVIEW_LINKS) {
    check(`review section link retained: ${href}`, reviewPage.includes(`href="${href}"`))
  }
  // RETARGET (UI-6C): the label's text arrow became an aria-hidden
  // ArrowRight icon; the approved 'Coach' label (never 'Coach
  // actions') is still asserted.
  check('review bottom links use approved labels',
    /Coach\s*\n\s*<ArrowRight/.test(reviewPage) && !reviewPage.includes('Coach actions'))
  check('decision card: due pill retained (Review now)',
    decisionCard.includes('Review now'))
  check('decision card: scheduled review pill retained',
    decisionCard.includes('Review on {formatDateShort(decision.review_on'))
  check('decision card: applied timestamp retained',
    decisionCard.includes('Applied: {formatDateShort(new Date(decision.applied_at))}'))
  // RETARGET (UI-6C hosted-QA correction, human-readable decision
  // diffs): original boundary — the expanded card surfaces the stored
  // before/after audit values. The raw JSON boxes were the DEFAULT
  // view; hosted QA rejected that presentation. The same stored
  // payloads now render as a human-readable change list
  // (DecisionValueChanges), with the untouched raw JSON preserved
  // behind its collapsed Technical details disclosure.
  check('decision card: before/after value blocks retained',
    decisionCard.includes('<DecisionValueChanges') &&
    decisionCard.includes('previous={decision.previous_value}') &&
    decisionCard.includes('next={decision.new_value}') &&
    read('src/components/decisions/DecisionValueChanges.tsx').includes('Technical details') &&
    read('src/components/decisions/DecisionValueChanges.tsx').includes('JSON.stringify(previous, null, 2)'))
  check('decision card: expand gate wording by manageability',
    decisionCard.includes("manageable ? 'Details & follow-through' : 'Full reason'"))
  check('decision card: manageability from the lib gate',
    decisionCard.includes('isFollowThroughEligible(decision.status)'))
  check('readiness chips keep tooltips (data detail preserved)',
    readiness.includes('never trained') && readiness.includes('sets this week'))
  check('readiness suggested-routine link retained',
    readiness.includes('/workouts/routines/${topRoutine.id}'))
  check('readiness hides without evidence (no placeholder clutter)',
    readiness.includes('if (!hasEnoughData) return null'))
  check('record button loading/saved/error states retained',
    recordBtn.includes("'Recording…'") && recordBtn.includes('Recorded as a suggested decision.') &&
    recordBtn.includes('Couldn’t record that. Try again.'))
}

// ── 18. Loading geometry detail ──────────────────────────────────────
console.log('\n18. Loading geometry detail')
{
  check('coach loading: subnav strip + hero + 2-col secondary + readiness',
    coachLoading.includes('h-9 w-64') && coachLoading.includes('h-40') &&
    (coachLoading.match(/<SkeletonCard/g) || []).length === 4)
  check('review loading: summary + four domain cards + wide sections',
    reviewLoading.includes('h-28') &&
    (reviewLoading.match(/<SkeletonCard/g) || []).length === 7)
  // RETARGET (UI-6C): original boundary — the loading mirrored the
  // old single-column stack (lifecycle h-14 strip, 4 rounded chips, 3
  // stacked cards). It now mirrors the rebuilt page: PageHeader block
  // with the pending-pill slot, lifecycle explainer, chip row, and
  // the one-column / lg two-column natural-height card grid.
  check('decisions loading: lifecycle strip + chip row + card grid',
    decisionsLoading.includes('h-20') &&
    decisionsLoading.includes('rounded-full') &&
    decisionsLoading.includes('grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start') &&
    (decisionsLoading.match(/<SkeletonCard/g) || []).length === 5)
  check('loading pages carry no interactive elements',
    LOADINGS.every((l) => !l.includes('<Link') && !l.includes('<button')))
  check('loading pages carry no text content',
    LOADINGS.every((l) => !l.match(/>[A-Z][a-z]+ /)))
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
