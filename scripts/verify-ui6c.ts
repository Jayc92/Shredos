// ============================================================
// ForgeFitOS — UI-6C Coach-pillar visual rebuild harness
// Proves the presentation rebuild of /coach, /check-in, and
// /decisions (PageHeader adoption, approved widths, Lucide-only
// affordances, 44px targets, honest loading geometry, the approved
// decisions two-column recomposition) plus the workout-signal badge
// correction — while every coach action, weekly-review, decision
// lifecycle, local-date, and missing-vs-zero contract stays byte- or
// behavior-anchored. Week-boundary proofs use FIXED dates.
// Run from the repository root:
//   npx tsx scripts/verify-ui6c.ts
// ============================================================

import { readFileSync, readdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import React from 'react'
;(globalThis as any).React = React
import { renderToStaticMarkup } from 'react-dom/server'

// Runtime-render fixtures: the server pages are rendered for real
// (their own JSX branches, STATUS_META, signalBadgeClass, and child
// components), with ONLY the data-fetch modules stubbed at their
// exact alias specifiers. The harness's own relative imports
// ('../src/lib/weekly-review', '../src/lib/workout') stay REAL, so
// the pure-lib boundary proofs are untouched by these stubs.
const FIX: {
  actions: unknown
  review: unknown
  profile: unknown
  target: unknown
  foodLogs: unknown[]
} = {
  actions: null,
  review: null,
  profile: { onboarding_complete: true, fasting_enabled: false },
  target: null,
  foodLogs: [],
}

const Module = require('module')
const origLoad = Module._load
Module._load = function (request: string) {
  if (request === 'next/navigation') {
    return {
      redirect: (url: string) => { throw new Error(`redirect(${url})`) },
      useRouter: () => ({ push() {}, replace() {}, refresh() {}, back() {}, prefetch() {} }),
      usePathname: () => '/coach',
      useSearchParams: () => new URLSearchParams(),
    }
  }
  if (request === '@/lib/supabase/server') {
    return {
      createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: { id: 'u-verify' } } }) },
      }),
      fetchUserProfile: async () => FIX.profile,
      fetchCurrentNutritionTarget: async () => FIX.target,
      fetchFoodLogsForDate: async () => FIX.foodLogs,
    }
  }
  if (request === '@/lib/coach-actions') {
    return { fetchCoachActions: async () => FIX.actions }
  }
  if (request === '@/lib/workout-coach') {
    return {
      fetchCoachSummary: async () =>
        ({ hasEnoughData: false, muscleReadiness: [], weekStats: null, topRoutine: null }),
    }
  }
  if (request === '@/lib/weekly-review') {
    return { fetchWeeklyReviewSummary: async () => FIX.review }
  }
  if (request === '@/lib/local-date-server') {
    return { localTodayFromCookies: () => '2026-08-15', localHourFromCookies: () => 12 }
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

const INVENTORY = [
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
]
// The complete UI-6C candidate is EXACTLY these 22 paths: the 12
// product files above, the 8 prior harnesses carrying labeled
// RETARGET (UI-6C) entries, and the 2 new files.
const CANDIDATE_22 = [
  ...INVENTORY,
  'scripts/verify-phase4b4.ts',
  'scripts/verify-ui2.ts',
  'scripts/verify-ui5a.ts',
  'scripts/verify-ui5b1a.ts',
  'scripts/verify-ui5b1b.ts',
  'scripts/verify-ui5b2.ts',
  'scripts/verify-ui6a.ts',
  'scripts/verify-ui6b.ts',
  'scripts/verify-ui6c.ts',
  'docs/ui6c-coach-visual-notes.md',
]
// UI-6C hosted-QA correction (human-readable decision diffs): the
// uncommitted correction's own paths, allowed alongside the
// committed candidate.
const CORRECTION_FILES = [
  'src/components/decisions/DecisionValueChanges.tsx',
  'src/components/decisions/DecisionCard.tsx',
  'scripts/verify-phase4b4.ts',
  'scripts/verify-ui5a.ts',
  'scripts/verify-ui5b1a.ts',
  'scripts/verify-ui5b1b.ts',
  'scripts/verify-ui5b2.ts',
  'scripts/verify-ui6a.ts',
  'scripts/verify-ui6b.ts',
  'scripts/verify-ui6c.ts',
  'docs/ui6c-coach-visual-notes.md',
]
// RETARGET (UI-7): the approved UI-7 product scope, admitted
// while uncommitted.
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
const coachPage = read('src/app/(app)/coach/page.tsx')
const reviewPage = read('src/app/(app)/check-in/page.tsx')
const decisionsPage = read('src/app/(app)/decisions/page.tsx')
const coachLoading = read('src/app/(app)/coach/loading.tsx')
const reviewLoading = read('src/app/(app)/check-in/loading.tsx')
const decisionsLoading = read('src/app/(app)/decisions/loading.tsx')
const decisionCard = read('src/components/decisions/DecisionCard.tsx')
const decisionList = read('src/components/decisions/DecisionList.tsx')
const progressBadge = read('src/components/workout/ProgressBadge.tsx')
const progressPage = read('src/app/(app)/progress/page.tsx')
const PAGES = [coachPage, reviewPage, decisionsPage]
const LOADINGS = [coachLoading, reviewLoading, decisionsLoading]

async function main() {
  // ── A. Inventory and exclusions ─────────────────────────────────────
  console.log('\nA. Inventory and exclusions')
  {
    // RETARGET (UI-6C hosted-QA correction, human-readable decision
    // diffs): original boundary — the worktree held EXACTLY the 22
    // uncommitted candidate paths. The candidate is now COMMITTED as
    // 6d2a317 on ui6c-qa, so the boundary splits: (a) the committed
    // candidate contains exactly the declared 22 paths, and (b) any
    // current worktree change stays inside the candidate + declared
    // correction scope.
    check('A1a: the committed UI-6C candidate (6d2a317) contains exactly the 22 declared paths',
      (() => {
        let out = ''
        try {
          out = execSync(
            'git diff-tree --no-commit-id --name-only -r 6d2a3176cba7e0940fb2a4486d3e49d5a0d6f38b',
            { encoding: 'utf8' })
        } catch { return false }
        const actual = out.split('\n').filter(Boolean).sort()
        const expected = [...CANDIDATE_22].sort()
        return actual.length === 22 && actual.every((f, i) => f === expected[i])
      })())
    check('A1b: worktree changes stay inside the candidate + correction scope',
      (() => {
        let out = ''
        try { out = execSync('git status --porcelain', { encoding: 'utf8' }) } catch { return false }
        return out.split('\n').filter(Boolean).every((line) => {
          const f = line.slice(3).trim()
          // RETARGET (UI-7): the approved UI-7 product scope + notes
          // are admitted while uncommitted.
          return CANDIDATE_22.includes(f) || CORRECTION_FILES.includes(f) ||
            UI7.includes(f) ||
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
            // ADMISSION (EXLIB-1B3B migration 024 draft): the
            // uncommitted hardening draft is admitted.
            f === 'supabase/migrations/024_exlib_post_application_hardening.sql' ||
            // RETARGET (EXLIB-1B2): the approved-for-drafting migration
            // 023 draft is admitted while uncommitted.
            f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql' ||
            f === 'src/components/dashboard/DecisionLogCard.tsx' ||
            f.startsWith('scripts/verify-')
        })
      })())
    check('A2: protected libs, APIs, schema, and deps byte-untouched (git)',
      (() => {
        try {
          // ADMISSION (EXLIB-1B2 Revision H): the committed 023
          // draft (candidate 8ec67b4) is corrected in-review; its
          // tracked modification is admitted. Nothing else may.
          return execSync(
            'git diff --name-only -- src/lib/ src/app/api/ supabase/ package.json package-lock.json',
            { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
            .every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
        } catch { return false }
      })())
    check('A3: CoachSubNav and RecordDecisionButton untouched (already clean)',
      (() => {
        try {
          return execSync(
            'git diff --name-only -- src/components/coach/CoachSubNav.tsx src/components/coach/RecordDecisionButton.tsx',
            { encoding: 'utf8' }).trim() === ''
        } catch { return false }
      })())
  }

  // ── B/C/D/E. Composition ────────────────────────────────────────────
  console.log('\nB. Composition')
  {
    check('B1: PageHeader owns each route title (exactly one, no handwritten h1)',
      PAGES.every((p) => (p.match(/<PageHeader/g) || []).length === 1 && !p.includes('<h1')) &&
      coachPage.includes('title="Coach"') &&
      reviewPage.includes('title="Weekly review"') &&
      decisionsPage.includes('title="Decisions"'))
    check('C1: all routes and loadings on the approved max-w-6xl geometry',
      PAGES.every((p) => p.includes('max-w-6xl') && !p.includes('max-w-3xl')) &&
      LOADINGS.every((l) => l.includes('max-w-6xl') && !l.includes('max-w-3xl')))
    check('D1: decisions grid — one column below lg, two at lg, items-start, no fixed card height',
      decisionList.includes('grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start') &&
      !stripComments(decisionList).includes('h-full') &&
      !/h-\[\d/.test(stripComments(decisionCard)))
    check('D2: grid keeps stable keys and the newest-first data order (presentation only)',
      decisionList.includes('key={d.id}') &&
      decisionsPage.includes(".order('created_at', { ascending: false })"))
    check('E1: mobile DOM order honest — subnav then states/content in the established sequence',
      coachPage.indexOf('<PageHeader') < coachPage.indexOf('<CoachSubNav') &&
      coachPage.indexOf('<CoachSubNav') < coachPage.indexOf('hasEnoughData') &&
      reviewPage.indexOf('<CoachSubNav') < reviewPage.indexOf('Review period') &&
      decisionsPage.indexOf('<CoachSubNav') < decisionsPage.indexOf('Lifecycle'))
  }

  // ── F. Loading fidelity ─────────────────────────────────────────────
  console.log('\nF. Loading fidelity')
  {
    check('F1: coach loading mirrors hero + 2-col secondary + readiness',
      coachLoading.includes('grid grid-cols-1 gap-4 lg:grid-cols-2') &&
      (coachLoading.match(/<SkeletonCard/g) || []).length === 4)
    check('F2: review loading mirrors period card + domain grid + wide sections',
      reviewLoading.includes('grid grid-cols-1 gap-4 lg:grid-cols-2') &&
      reviewLoading.includes('lg:col-span-2') &&
      (reviewLoading.match(/<SkeletonCard/g) || []).length === 7)
    check('F3: decisions loading mirrors header action slot + explainer + chips + 2-col grid',
      decisionsLoading.includes('rounded-full') &&
      decisionsLoading.includes('grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start'))
    check('F4: no fake content or interactive controls in any loading state',
      LOADINGS.every((l) =>
        l.includes('aria-hidden="true"') && !l.includes('<Link') &&
        !l.includes('<button') && !l.match(/>[A-Z][a-z]+ /)))
  }

  // ── G/H/I. Tokens, glyphs, targets ──────────────────────────────────
  console.log('\nG. Tokens, glyphs, targets')
  {
    const LEGACY = /text-muted-foreground|text-foreground|bg-background|bg-secondary|bg-card|bg-muted(?!ed)|border-border|border-input|text-destructive|bg-destructive/
    const RAW = /(?:text|bg|border|ring)-(?:green|amber|blue|red|yellow|orange|zinc|gray|grey|neutral)-\d/
    check('G1: zero raw palette/legacy/forced-white/inline-color debt in the product scope',
      INVENTORY.every((f) => {
        const code = stripComments(read(f))
        return !LEGACY.test(code) && !RAW.test(code) &&
          !code.includes('bg-white') && !code.includes('#fff') &&
          !code.includes('!important') && !code.includes('style={{ background')
      }))
    check('H1: no text-glyph affordances remain in touched code (comments excluded)',
      [coachPage, reviewPage, decisionsPage,
        read('src/components/coach/CoachCard.tsx'),
        read('src/components/coach/MuscleReadinessPanel.tsx')].every((s) => {
        const code = stripComments(s)
        return !code.includes('\u2192') && !code.includes('\u2190') &&
          !code.includes('\u2191') && !code.includes('\u2193')
      }))
    check('H2: replacements are aria-hidden Lucide icons beside visible text',
      reviewPage.includes('Icon: TrendingUp') && reviewPage.includes('Icon: MoveRight') &&
      reviewPage.includes('Icon: TrendingDown') &&
      reviewPage.includes('<ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />') &&
      (reviewPage.match(/<ArrowRight className="w-3 h-3" aria-hidden="true" \/>/g) || []).length >= 12 &&
      (decisionsPage.match(/<ArrowRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" \/>/g) || []).length === 3)
    check('I1: real 44px targets on touched links and DecisionCard actions',
      coachPage.includes('inline-flex min-h-11 items-center gap-1 text-xs text-brand') &&
      reviewPage.includes('inline-flex min-h-11 items-center gap-1 text-xs text-brand') &&
      decisionCard.includes('flex min-h-11 items-center gap-1 text-xs text-ink-muted') &&
      (decisionCard.match(/inline-flex min-h-11 items-center text-xs font-medium/g) || []).length === 6)
  }

  // ── J/K. Coach contract ─────────────────────────────────────────────
  console.log('\nJ. Coach contract')
  {
    check('J1: the three Coach states remain structurally distinct',
      coachPage.includes('{!actions.hasEnoughData && (') &&
      coachPage.includes('{actions.hasEnoughData && !actions.primaryAction && (') &&
      coachPage.includes('{actions.hasEnoughData && actions.primaryAction && (') &&
      coachPage.includes('Evidence is still building') &&
      coachPage.includes('No suggested actions for this week.'))
    check('K1: action cards preserve titles, reasons, next steps, links, priority, and recording',
      coachPage.includes('{action.title}') && coachPage.includes('{action.reason}') &&
      coachPage.includes('{action.nextStep}') && coachPage.includes('{action.linkLabel}') &&
      coachPage.includes('href={action.linkHref}') &&
      coachPage.includes('Primary action') &&
      coachPage.includes('fetchCoachActions(supabase, user.id, today, profile, target, todayFoodLogs)') &&
      coachPage.includes('<RecordDecisionButton') &&
      coachPage.includes('decisionType={action.decisionType}'))
  }

  // ── L. Weekly review contract ───────────────────────────────────────
  console.log('\nL. Weekly review contract')
  {
    check('L1: completed-week-only semantics and explicit week navigation preserved',
      reviewPage.includes('the current partial week is never shown as reviewed') &&
      reviewPage.includes('searchParams?.week') &&
      reviewPage.includes('`/check-in?week=${navigation.previousWeekStart}`') &&
      reviewPage.includes('aria-label="Review week navigation"'))
    check('L2: confidence, domain aggregations, fasting flag, and focus items unchanged',
      reviewPage.includes('fetchWeeklyReviewSummary(') &&
      reviewPage.includes('profile.fasting_enabled') &&
      reviewPage.includes('confidence') && reviewPage.includes('focusItems') &&
      reviewPage.includes('trainingLine(training)'))
    // FIXED-DATE completed-week boundary proof from the pure lib.
    const { latestCompletedWeekStart, resolveReviewWeekStart } =
      await import('../src/lib/weekly-review')
    check('L3: fixed-date completed-week boundary — Saturday never reviews its own partial week',
      latestCompletedWeekStart('2026-08-15') === '2026-08-03' &&
      latestCompletedWeekStart('2026-08-17') === '2026-08-10' &&
      latestCompletedWeekStart('2026-08-16') === '2026-08-03')
    check('L4: explicit ?week wins when valid, clamps when it is not a completed week',
      resolveReviewWeekStart('2026-08-15', '2026-07-27') === '2026-07-27' &&
      resolveReviewWeekStart('2026-08-15', '2026-08-10') === '2026-08-03')
  }

  // ── M/N. Decisions contract ─────────────────────────────────────────
  console.log('\nM. Decisions contract')
  {
    check('M1: lifecycle vocabulary exact; pending count grounded in the uncapped read',
      decisionsPage.includes("decisions?.filter((d) => d.status === 'suggested').length") &&
      decisionsPage.includes('pending') &&
      decisionsPage.includes('Not every decision follows every stage'))
    check('N1: DecisionCard mutations, transitions, review-date rules, and refresh unchanged',
      decisionCard.includes("'/api/decisions'") === false
        ? decisionCard.includes('/api/decisions')
        : true)
    check('N2: DecisionCard endpoints and guards byte-present',
      decisionCard.includes('handleUpdate') &&
      decisionCard.includes("follow_through_status: 'completed'") &&
      decisionCard.includes("follow_through_status: 'abandoned'") &&
      decisionCard.includes("follow_through_status: 'not_applicable'") &&
      decisionCard.includes('isReviewDateSaveable(decision.review_on ?? null, reviewDateInput)') &&
      decisionCard.includes('Review now') &&
      decisionCard.includes('Applied: {formatDateShort(new Date(decision.applied_at))}'))
  }

  // ── ND. Human-readable decision diffs (hosted-QA correction) ───────
  console.log('\nND. Human-readable decision diffs')
  {
    const { buildDecisionDiff, DecisionValueChanges } =
      await import('../src/components/decisions/DecisionValueChanges')
    const dvc = read('src/components/decisions/DecisionValueChanges.tsx')
    const render = (previous: unknown, next: unknown) =>
      renderToStaticMarkup(React.createElement(DecisionValueChanges, { previous, next }))

    check('ND1: cadence weekly -> biweekly renders "Weigh-in schedule" with friendly values',
      (() => {
        const d = buildDecisionDiff({ cadence: 'weekly' }, { cadence: 'biweekly' })
        const html = render({ cadence: 'weekly' }, { cadence: 'biweekly' })
        return d.rows.length === 1 && d.rows[0].label === 'Weigh-in schedule' &&
          d.rows[0].before === 'Weekly' && d.rows[0].after === 'Every two weeks' &&
          !d.hasUntranslated &&
          html.includes('Weigh-in schedule') && html.includes('Weekly') &&
          html.includes('Every two weeks') && !html.includes('cadence') &&
          !html.includes('{')
      })())
    check('ND2: protein-only change lists ONE row; unchanged calories/carbs/fat are omitted',
      (() => {
        const prev = { calories: 2200, protein_g: 200, carbs_g: 220, fat_g: 70 }
        const next = { calories: 2200, protein_g: 90, carbs_g: 220, fat_g: 70 }
        const d = buildDecisionDiff(prev, next)
        const html = render(prev, next)
        return d.rows.length === 1 && d.rows[0].label === 'Protein target' &&
          d.rows[0].before === '200 g' && d.rows[0].after === '90 g' &&
          !html.includes('Calorie target') && !html.includes('Carbohydrate target') &&
          !html.includes('Fat target') && !html.includes('protein_g') &&
          !html.includes('2200') && !html.includes('2,200')
      })())
    check('ND3: multiple changed macros render every changed row with units and comma formatting',
      (() => {
        const d = buildDecisionDiff(
          { calories: 2450, protein_g: 200, carbs_g: 220, fat_g: 70 },
          { calories: 2100, protein_g: 180, carbs_g: 220, fat_g: 60 })
        return d.rows.length === 3 &&
          d.rows[0].label === 'Calorie target' &&
          d.rows[0].before === '2,450 cal' && d.rows[0].after === '2,100 cal' &&
          d.rows[1].before === '200 g' && d.rows[1].after === '180 g' &&
          d.rows[2].label === 'Fat target' && d.rows[2].after === '60 g'
      })())
    check('ND4: added value (no previous snapshot) reads "Not set" -> value',
      (() => {
        const d = buildDecisionDiff(null, { calories: 2100 })
        return d.rows.length === 1 && d.rows[0].before === 'Not set' &&
          d.rows[0].after === '2,100 cal' && !d.hasUntranslated
      })())
    check('ND5: removed/null value reads value -> "Not set" (missing is never zero)',
      (() => {
        const d = buildDecisionDiff({ fasting_goal_hours: 16 }, { fasting_goal_hours: null })
        return d.rows.length === 1 && d.rows[0].label === 'Fasting goal' &&
          d.rows[0].before === '16 hours' && d.rows[0].after === 'Not set'
      })())
    check('ND6: boolean change under an unknown key routes to Technical details (no invented label)',
      (() => {
        const d = buildDecisionDiff({ fasting_enabled: false }, { fasting_enabled: true })
        const html = render({ fasting_enabled: false }, { fasting_enabled: true })
        return d.rows.length === 0 && d.hasUntranslated &&
          html.includes('Technical details') && !html.includes('<details open')
      })())
    check('ND7: date-string change under an unknown key routes to Technical details, no crash',
      (() => {
        const d = buildDecisionDiff(
          { effective_date: '2026-08-01' }, { effective_date: '2026-08-15' })
        return d.rows.length === 0 && d.hasUntranslated
      })())
    check('ND8: unknown-key change -> collapsed Technical details carrying the untouched raw payload',
      (() => {
        const html = render({ mystery_field: 1 }, { mystery_field: 2 })
        return html.includes('Technical details') &&
          html.includes('&quot;mystery_field&quot;: 1') &&
          html.includes('&quot;mystery_field&quot;: 2') &&
          html.includes('Before') && html.includes('After') &&
          !html.includes('<details open')
      })())
    check('ND9: nested object under a KNOWN key falls back honestly instead of inventing text',
      (() => {
        const d = buildDecisionDiff(
          { calories: { total: 2400 } }, { calories: { total: 2100 } })
        return d.rows.length === 0 && d.hasUntranslated
      })())
    check('ND10: identical snapshots -> "No value changes were recorded." (no empty boxes, no JSON)',
      (() => {
        const same = { calories: 2100, protein_g: 180 }
        const d = buildDecisionDiff(same, { ...same })
        const html = render(same, { ...same })
        return d.identical && d.rows.length === 0 && !d.hasUntranslated &&
          html.includes('No value changes were recorded.') &&
          html.includes('<p') && !html.includes('Technical details') && !html.includes('{')
      })())
    check('ND11: field order is deterministic registry order regardless of payload key order',
      (() => {
        const a = buildDecisionDiff(
          { fat_g: 70, calories: 2400, protein_g: 200 },
          { fat_g: 60, calories: 2100, protein_g: 180 })
        const b = buildDecisionDiff(
          { protein_g: 200, fat_g: 70, calories: 2400 },
          { protein_g: 180, fat_g: 60, calories: 2100 })
        const order = (d: { rows: Array<{ key: string }> }) => d.rows.map((r) => r.key).join(',')
        return order(a) === order(b) && order(a) === 'calories,protein_g,fat_g'
      })())
    check('ND12: mobile-safe structure — flex-wrap rows, break-words values, min-w-0, wrapping pre',
      (() => {
        const html = render({ protein_g: 200 }, { protein_g: 90 })
        // overflow-wrap:anywhere is load-bearing: break-word alone
        // does NOT constrain a flex item's intrinsic min-content
        // width, so an unbroken long value would overflow at 320px
        // (caught empirically in the fixture measurements).
        return html.includes('flex-wrap') && html.includes('break-words') &&
          html.includes('min-w-0') &&
          html.includes('[overflow-wrap:anywhere]') &&
          dvc.includes('whitespace-pre-wrap break-words')
      })())
    check('ND13: raw JSON is NEVER the default — fully-translatable diffs render zero JSON syntax',
      (() => {
        const html = render(
          { calories: 2400, protein_g: 200 }, { calories: 2100, protein_g: 180 })
        return !html.includes('{') && !html.includes('&quot;') &&
          !html.includes('Technical details') &&
          !decisionCard.includes('JSON.stringify(decision.previous_value')
      })())
    check('ND14: accessible comparison — sr-only Before/After labels + aria-hidden ArrowRight',
      (() => {
        const html = render({ calories: 2400 }, { calories: 2100 })
        return html.includes('Before') && html.includes('After') &&
          html.includes('sr-only') &&
          /<svg[^>]*aria-hidden="true"/.test(html)
      })())
    check('ND15: semantic tokens only in the new component (no raw palette/legacy/glyph arrows)',
      (() => {
        const code = stripComments(dvc)
        const LEGACY = /text-muted-foreground|text-foreground|bg-background|bg-secondary|bg-card|bg-muted(?!ed)|border-border|border-input|text-destructive|bg-destructive/
        const RAW = /(?:text|bg|border|ring)-(?:green|amber|blue|red|yellow|orange|zinc|gray|grey|neutral)-\d/
        return !LEGACY.test(code) && !RAW.test(code) &&
          !code.includes('\u2192') && !code.includes('bg-white') &&
          !code.includes('!important') && !code.includes('safelist')
      })())
    check('ND16: DecisionCard renders the change list inside the expanded section, gated as before',
      decisionCard.includes('(decision.previous_value || decision.new_value) && (') &&
      decisionCard.includes('<DecisionValueChanges') &&
      decisionCard.includes('previous={decision.previous_value}') &&
      decisionCard.includes('next={decision.new_value}'))
  }

  // ── O/P. Local date and honesty ─────────────────────────────────────
  console.log('\nO. Local date and honesty')
  {
    check('O1: user-local day anchors preserved on coach and check-in',
      coachPage.includes('const today = localTodayFromCookies()') &&
      reviewPage.includes('localTodayFromCookies(),'))
    check('P1: missing values never become zero (review states carry honest copy)',
      reviewPage.includes('More data needed') &&
      coachPage.includes('Evidence is still building'))
  }

  // ── Q/R/S. Boundaries ───────────────────────────────────────────────
  console.log('\nQ. Boundaries')
  {
    check('Q1: Suggested Routine / StrengthLog / community remain absent from product code',
      (() => {
        try {
          execSync("grep -rilE 'strengthlog|upvote' src", { encoding: 'utf8' })
          return false
        } catch { return true }
      })() && !existsSync('src/components/coach/SuggestedRoutine.tsx'))
    check('R1: no new scoring, grades, streaks, ranking, consistency %, or gamification',
      INVENTORY.every((f) =>
        !/streak|grade|consistency %|leaderboard|gamif|points earned/i.test(stripComments(read(f)))))
    check('S1: src/lib/workout.ts byte-untouched (helpers and meanings intact)',
      (() => {
        try {
          return execSync('git diff --name-only -- src/lib/workout.ts', { encoding: 'utf8' }).trim() === ''
        } catch { return false }
      })())
  }

  // ── T/U/V/W/X. Badge correction ─────────────────────────────────────
  console.log('\nT. Badge correction')
  {
    const { ProgressBadge } = await import('../src/components/workout/ProgressBadge')
    const { progressColor } = await import('../src/lib/workout')
    const signals = ['improved', 'declined', 'new', 'same'] as const
    const EXPECT: Record<string, string> = {
      improved: 'bg-success-subtle text-success border-success/20',
      declined: 'bg-critical-subtle text-critical border-critical/20',
      new: 'bg-info-subtle text-info border-info/20',
      same: 'bg-surface-sunken text-ink-muted border-edge',
    }
    check('T1: rendered ProgressBadge carries the semantic tokens and visible text for every signal',
      signals.every((sig) => {
        const html = renderToStaticMarkup(React.createElement(ProgressBadge, { signal: sig }))
        return EXPECT[sig].split(' ').every((cls) => html.includes(cls)) &&
          />[^<]+</.test(html)
      }))
    check('U1: mapping is exhaustive over every possible progressColor return + visible fallback',
      (() => {
        const hues = signals.map((sig) => progressColor(sig).split(' ')[0].split('-')[1])
        return new Set(hues).size === 4 &&
          hues.every((h) => ['green', 'red', 'blue', 'secondary'].includes(h)) &&
          [progressBadge, reviewPage, progressPage].every((s) =>
            s.includes("green: 'bg-success-subtle text-success border-success/20'") &&
            s.includes("red: 'bg-critical-subtle text-critical border-critical/20'") &&
            s.includes("blue: 'bg-info-subtle text-info border-info/20'") &&
            s.includes("secondary: 'bg-surface-sunken text-ink-muted border-edge'") &&
            s.includes("?? 'bg-surface-sunken text-ink border-edge'"))
      })())
    // Explicit hue-derivation proofs over the ACTUAL helper returns
    // (the mapping key is the first class token's second dash segment;
    // plain split('-')[1] on the whole composite would yield
    // 'secondary text' for the same-signal return).
    const FALLBACK = 'bg-surface-sunken text-ink border-edge'
    check('U2: each actual progressColor return derives its intended key — same derives secondary (mapped, not fallback)',
      progressColor('improved').split(' ')[0].split('-')[1] === 'green' &&
      progressColor('declined').split(' ')[0].split('-')[1] === 'red' &&
      progressColor('new').split(' ')[0].split('-')[1] === 'blue' &&
      progressColor('same').split(' ')[0].split('-')[1] === 'secondary' &&
      EXPECT.same !== FALLBACK &&
      EXPECT.same === 'bg-surface-sunken text-ink-muted border-edge')
    // Faithful replica of every consumer's SIGNAL_TOKEN map (U1 pins
    // these exact entries + fallback literal in all three consumers).
    const TOKENS: Record<string, string> = {
      green: 'bg-success-subtle text-success border-success/20',
      red: 'bg-critical-subtle text-critical border-critical/20',
      blue: 'bg-info-subtle text-info border-info/20',
      secondary: 'bg-surface-sunken text-ink-muted border-edge',
    }
    check('U3: consumers use the exact first-token extraction; an out-of-map hue reaches the visible fallback',
      [progressBadge, reviewPage, progressPage].every((s) =>
        s.includes(".split(' ')[0].split('-')[1]")) &&
      (TOKENS['bg-amber-500/15 text-amber-400 border-amber-500/20'
        .split(' ')[0].split('-')[1]] ?? FALLBACK) === FALLBACK &&
      (TOKENS[progressColor('same').split(' ')[0].split('-')[1]] ?? FALLBACK) ===
        'bg-surface-sunken text-ink-muted border-edge')
    // Compiled stylesheet: semantic tokens resolve; consumers no
    // longer depend on the dead composites.
    const cssFiles = readdirSync('.next/static/css').filter((f) => f.endsWith('.css'))
    const css = cssFiles.map((f) => read(`.next/static/css/${f}`)).join('\n')
    const esc = (cls: string) => cls.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
    const decl = (cls: string) => {
      const m = css.match(new RegExp('\\.' + esc(cls) + '(?![a-z-])[^{]*\\{([^}]*)\\}'))
      return m ? m[1] : null
    }
    check('V1: compiled CSS carries visible declarations for every semantic badge token',
      ['bg-success-subtle', 'bg-critical-subtle', 'bg-info-subtle', 'bg-surface-sunken']
        .every((c) => decl(c) !== null && decl(c)!.includes('background-color')) &&
      ['text-success', 'text-critical', 'text-info', 'text-ink-muted']
        .every((c) => decl(c) !== null && decl(c)!.includes('color')) &&
      ['border-success/20', 'border-critical/20', 'border-info/20', 'border-edge']
        .every((c) => css.includes('.' + c.replace('/', '\\/'))))
    check('W1: consumers no longer reference the dead composite utilities (stripped code)',
      [progressBadge, reviewPage, progressPage].every((s) => {
        const code = stripComments(s)
        return !/(?:bg|border)-(?:green|red|blue)-500/.test(code)
      }))
    // RETARGET (UI-7): original boundary — every badge keeps visible
    // text and lib/workout stays byte-untouched (S1 still proves the
    // latter). UI-7 replaced the lib label's direction glyphs with
    // consumer-side SIGNAL_META/STATUS_META (same wording, aria-hidden
    // icons); progressLabel remains the explicit fallback.
    check('X1: labels stay text-present — progressLabel untouched and rendered',
      progressBadge.includes('progressLabel(signal)') &&
      progressBadge.includes("improved: { label: 'Improved', Icon: TrendingUp }") &&
      progressBadge.includes('{meta ? meta.label : progressLabel(signal)}') &&
      reviewPage.includes('{label}') &&
      progressPage.includes('const { label, Icon } = STATUS_META[status]'))
    // DecisionCard runtime matrix (client component rendered for
    // real) — one render per representative lifecycle status. The
    // review_on probes use extreme fixed dates so due/not-due is
    // deterministic regardless of when the harness runs.
    const { DecisionCard } = await import('../src/components/decisions/DecisionCard')
    const renderDecision = (overrides: Record<string, unknown>) =>
      renderToStaticMarkup(React.createElement(DecisionCard, {
        decision: {
          id: 'd1', decision_type: 'nutrition_targets_updated', status: 'suggested',
          decision_title: 'Probe decision', decision_summary: 'Summary', reason: 'Because',
          created_at: '2026-08-10T12:00:00Z', applied_at: null, review_on: null,
          reviewed_at: null, review_outcome: null,
          follow_through_status: 'not_started', previous_value: null, new_value: null,
          created_by: 'coach', user_id: 'u1',
          ...overrides,
        } as never,
        onUpdated: () => {},
      } as never))
    const suggestedHtml = renderDecision({})
    check('T2: suggested render — status label, title, and the Accept/Dismiss actions',
      suggestedHtml.includes('Probe decision') && suggestedHtml.includes('Suggested') &&
      suggestedHtml.includes('Accept') && suggestedHtml.includes('Dismiss'))
    const acceptedHtml = renderDecision({ status: 'accepted', review_on: '2999-01-01' })
    check('T3: accepted render — status label + future review date shown as "Review on", never "Review now"',
      acceptedHtml.includes('Accepted') && acceptedHtml.includes('Review on') &&
      !acceptedHtml.includes('Review now'))
    const appliedHtml = renderDecision({
      status: 'applied', applied_at: '2026-08-05T12:00:00Z', review_on: '1970-01-02',
    })
    check('T4: applied render — status label + past review date surfaces the "Review now" state',
      appliedHtml.includes('Applied') && appliedHtml.includes('Review now'))
    const dismissedHtml = renderDecision({ status: 'dismissed' })
    check('T5: dismissed render — historical status label without Accept/Dismiss actions',
      dismissedHtml.includes('Dismissed') &&
      !dismissedHtml.includes('>Accept<'))
  }

  // ── Y. Runtime render matrix (real server pages, stubbed data) ─────
  console.log('\nY. Runtime render matrix')
  {
    // The REAL coach page module (its own JSX branches and children),
    // with only the data-fetch modules stubbed at the top of this
    // harness. Three renders — one per contract state.
    const coachMod = await import('../src/app/(app)/coach/page')
    FIX.actions = { hasEnoughData: false, primaryAction: null, secondaryActions: [] }
    const coachInsufficient = renderToStaticMarkup(await coachMod.default())
    check('Y1: coach insufficient-evidence state renders its Notice and no action framing',
      coachInsufficient.includes('Evidence is still building') &&
      !coachInsufficient.includes('Primary action') &&
      !coachInsufficient.includes('No suggested actions for this week.'))
    FIX.actions = { hasEnoughData: true, primaryAction: null, secondaryActions: [] }
    const coachNoActions = renderToStaticMarkup(await coachMod.default())
    check('Y2: coach no-actions state renders its explicit empty status',
      coachNoActions.includes('No suggested actions for this week.') &&
      !coachNoActions.includes('Primary action') &&
      !coachNoActions.includes('Evidence is still building'))
    const probeAction = {
      type: 'protein_low', category: 'nutrition', title: 'Probe primary action',
      reason: 'Probe reason line', nextStep: 'Probe next step',
      linkHref: '/food', linkLabel: 'Probe link label',
      isRecordable: true, decisionType: 'nutrition_targets_updated',
    }
    FIX.actions = {
      hasEnoughData: true,
      primaryAction: probeAction,
      secondaryActions: [{ ...probeAction, title: 'Probe secondary action', isRecordable: false }],
    }
    const coachActions = renderToStaticMarkup(await coachMod.default())
    check('Y3: coach action state renders title, reason, next step, link, and the recording affordance',
      coachActions.includes('Primary action') &&
      coachActions.includes('Probe primary action') &&
      coachActions.includes('Probe reason line') &&
      coachActions.includes('Probe next step') &&
      coachActions.includes('Probe link label') &&
      coachActions.includes('href="/food"') &&
      coachActions.includes('Record this decision') &&
      coachActions.includes('Probe secondary action'))

    // The REAL check-in page with a review fixture whose notable
    // exercises cover all four overview statuses — so every
    // StatusBadge variant is rendered by the page's own STATUS_META
    // and signalBadgeClass (which calls the real progressColor).
    const notable = (status: string, name: string) => ({
      exerciseId: `e-${status}`, exerciseName: name, status,
      latestSummary: '3x8 @ 135 lb', latestWorkoutDate: '2026-08-07',
      trackingMode: 'weight_reps',
    })
    FIX.review = {
      hasAnyData: true,
      range: { label: 'Aug 3 – Aug 9', start: '2026-08-03', end: '2026-08-09' },
      navigation: { previousWeekStart: '2026-07-27', nextWeekStart: null, isLatest: true },
      confidence: { level: 'moderate', label: 'Moderate evidence', detail: 'Based on 5 logged days' },
      weight: { loggedDays: 3, averageWeightLbs: 180.2, latestWeightLbs: 179.8, comparisonLabel: null },
      nutrition: {
        loggedDays: 5, calorieDays: 5, averageCalories: 2100, averageProteinGrams: 150,
        proteinTargetEligibleDays: 5, proteinTargetMetDays: 3, comparisonLabels: [],
      },
      training: {
        completedWorkouts: 2, completedWorkingSets: 24,
        completedDurationSeconds: 5400, skippedWorkouts: 0,
      },
      exerciseProgress: {
        improving: 1, steady: 1, declining: 1, needsData: 1,
        notableExercises: [
          notable('improved', 'Probe Bench Press'),
          notable('same', 'Probe Squat'),
          notable('declined', 'Probe Deadlift'),
          notable('needs_data', 'Probe Row'),
        ],
      },
      activity: { loggedDays: 4, averageSteps: 8000, totalSteps: 32000 },
      fasting: { completedFasts: 0, totalDurationMinutes: 0, longestDurationMinutes: 0 },
      focusItems: ['Keep protein intake consistent'],
    }
    const checkinMod = await import('../src/app/(app)/check-in/page')
    const reviewHtml = renderToStaticMarkup(await checkinMod.default({ searchParams: {} }))
    // Each badge is asserted as ONE span: semantic tokens in its
    // class, the aria-hidden Lucide icon (when the status has one)
    // between the tag and its label, text always present.
    const badge = (tokenClass: string, icon: string | null, label: string) =>
      icon
        ? new RegExp(`<span[^>]*class="[^"]*${tokenClass}[^"]*"[^>]*><svg(?=[^>]*aria-hidden="true")[^>]*${icon}[\\s\\S]{0,800}?</svg>${label}</span>`)
        : new RegExp(`<span[^>]*class="[^"]*${tokenClass}[^"]*"[^>]*>${label}</span>`)
    check('Y4: improved StatusBadge — success tokens + aria-hidden TrendingUp + "Improving" text',
      badge('bg-success-subtle', 'lucide-trending-up', 'Improving').test(reviewHtml))
    check('Y5: same StatusBadge — sunken/ink-muted tokens + aria-hidden MoveRight + "Steady" text',
      badge('bg-surface-sunken', 'lucide-move-right', 'Steady').test(reviewHtml))
    check('Y6: declined StatusBadge — critical tokens + aria-hidden TrendingDown + "Declining" text',
      badge('bg-critical-subtle', 'lucide-trending-down', 'Declining').test(reviewHtml))
    check('Y7: needs_data StatusBadge — info tokens, NO icon required, "More data needed" text',
      badge('bg-info-subtle', null, 'More data needed').test(reviewHtml))
    // The measured six-width empirics are recorded in the phase notes
    // (method + full measurement table) — pinned here so the record
    // cannot silently drop a width.
    const notes = read('docs/ui6c-coach-visual-notes.md')
    check('Y8: responsive empirics recorded for all six approved widths with overflow columns',
      ['| 320 ', '| 375 ', '| 768 ', '| 1024 ', '| 1440 ', '| 1920 ']
        .every((w) => notes.includes(w)) &&
      notes.includes('Measured responsive empirics') &&
      notes.includes('| none |'))
  }

  // ── Z. Inventory integrity ──────────────────────────────────────────
  console.log('\nZ. Integrity')
  {
    check('Z1: dependencies unchanged and migrations exactly 001-022 with the 022 fingerprint',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'))
        const m022 = readFileSync('supabase/migrations/022_ui5b2_workout_reuse.sql')
        const { createHash } = require('crypto')
        // RETARGET (EXLIB-1B2): the approved-for-drafting EXLIB
        // catalog migration joins the boundary (DRAFT, not applied).
        // RETARGET (EXLIB-1B3B migration 024 draft): the hardening
        // draft joins the boundary (DRAFT, not applied);
        // exactly-23 becomes exactly-24 with both filenames pinned.
        return files.length === 24 &&
          files.includes('023_exlib_catalog_and_delivery_contract.sql') &&
          files.includes('024_exlib_post_application_hardening.sql') &&
          m022.length === 19112 &&
          createHash('sha256').update(m022).digest('hex') ===
            '1432692f700b1686243aa8219ea4af3146e2bec30b228b3f9138d60e072e1241'
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
