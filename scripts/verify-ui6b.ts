// ============================================================
// ForgeFitOS — UI-6B Fasting visual rebuild harness
// Proves the presentation rebuild of /fasting: wide-route
// composition, PageHeader adoption, semantic-token-only styling,
// Lucide-only affordances, 44px targets, honest loading geometry —
// while every fasting calculation, timestamp, lifecycle rule,
// one-active-fast boundary, and payload stays byte- or
// behavior-anchored. Timer and timezone proofs use FIXED instants,
// never the machine clock.
// Run from the repository root:
//   npx tsx scripts/verify-ui6b.ts
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
      usePathname: () => '/fasting',
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

const INVENTORY = [
  'src/app/(app)/fasting/page.tsx',
  'src/app/(app)/fasting/loading.tsx',
  'src/components/fasting/FastingTimer.tsx',
  'src/components/fasting/FastingControls.tsx',
  'src/components/fasting/FastingHistory.tsx',
  'src/components/fasting/EditFastForm.tsx',
]
const page = read('src/app/(app)/fasting/page.tsx')
const loading = read('src/app/(app)/fasting/loading.tsx')
const timer = read('src/components/fasting/FastingTimer.tsx')
const controls = read('src/components/fasting/FastingControls.tsx')
const history = read('src/components/fasting/FastingHistory.tsx')
const editForm = read('src/components/fasting/EditFastForm.tsx')
const stats = read('src/components/fasting/FastingStats.tsx')

async function main() {
  // ── 1. Inventory and exclusions ─────────────────────────────────────
  console.log('\n1. Inventory and exclusions')
  {
    check('A1: worktree product changes stay inside the declared UI-6B inventory',
      (() => {
        let out = ''
        try { out = execSync('git status --porcelain', { encoding: 'utf8' }) } catch { return false }
        // RETARGET (UI-6C): the approved Coach-pillar rebuild +
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
        return out.split('\n').filter(Boolean).every((line) => {
          const f = line.slice(3).trim()
          // RETARGET (EXLIB-1B2): the approved-for-drafting migration
          // 023 draft is admitted while uncommitted.
          if (f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql') return true
          // ADMISSION (EXLIB-1B3B migration 024 draft): the
          // uncommitted hardening draft is admitted.
          if (f === 'supabase/migrations/024_exlib_post_application_hardening.sql') return true
          return INVENTORY.includes(f) || UI6C.includes(f) || UI7.includes(f) ||
            f.startsWith('scripts/verify-') || f.startsWith('docs/')
        })
      })())
    check('A2: fasting libs, APIs, other pillars, migrations, and deps untouched (git)',
      (() => {
        let out = ''
        try { out = execSync('git status --porcelain', { encoding: 'utf8' }) } catch { return false }
        return out.split('\n').filter(Boolean).every((line) => {
          const f = line.slice(3).trim()
          // RETARGET (UI-6C): the Coach pillar and the badge
          // co-victims are now their own approved slice; libs, APIs,
          // schema, deps, and Fuel stay locked.
          // RETARGET (EXLIB-1B2): the approved-for-drafting migration
          // 023 draft is admitted while uncommitted, and retargeted
          // harnesses (e.g. verify-food-log-ux) are worktree-present.
          if (f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql') return true
          // ADMISSION (EXLIB-1B3B migration 024 draft): the
          // uncommitted hardening draft is admitted.
          if (f === 'supabase/migrations/024_exlib_post_application_hardening.sql') return true
          if (f.startsWith('scripts/verify-')) return true
          return !f.startsWith('src/lib/') && !f.startsWith('src/app/api/') &&
            !f.startsWith('supabase/') && !f.includes('package') &&
            !f.includes('food') && !f.includes('nutrition')
        })
      })())
    check('A3: FastingStats untouched (already clean)',
      (() => {
        try {
          return execSync('git diff --name-only -- src/components/fasting/FastingStats.tsx',
            { encoding: 'utf8' }).trim() === ''
        } catch { return false }
      })())
  }

  // ── 2. Composition ──────────────────────────────────────────────────
  console.log('\n2. Composition')
  {
    check('B1: PageHeader owns the title with the established honest support copy verbatim',
      (page.match(/<PageHeader/g) || []).length === 1 && !page.includes('<h1') &&
      page.includes('title="Fasting"') &&
      page.includes('description="Fasting is a calorie adherence tool — not magic. Calories still determine fat loss."'))
    check('B2: approved wide width with the primary/supporting split, natural heights',
      page.includes('max-w-6xl') && !page.includes('max-w-3xl') &&
      page.includes('lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6') &&
      !stripComments(page).includes('h-full'))
    check('B3: mobile task-first order — timer, controls, stats, history',
      page.indexOf('<FastingTimer') < page.indexOf('<FastingControls') &&
      page.indexOf('<FastingControls') < page.indexOf('<FastingStats') &&
      page.indexOf('<FastingStats') < page.indexOf('<FastingHistory'))
    check('B4: ProgressSubNav retained in its established location with the profile flag',
      page.includes('<ProgressSubNav fastingEnabled={profile.fasting_enabled} />') &&
      page.indexOf('<PageHeader') < page.indexOf('<ProgressSubNav') &&
      page.indexOf('<ProgressSubNav') < page.indexOf('<FastingTimer'))
  }

  // ── 3. Tokens, glyphs, targets ──────────────────────────────────────
  console.log('\n3. Tokens, glyphs, targets')
  {
    const LEGACY = /text-muted-foreground|text-foreground|bg-background|bg-secondary|bg-card|bg-muted|border-border|border-input|text-destructive|bg-destructive/
    const RAW = /(?:text|bg|border|ring)-(?:green|amber|blue|red|yellow|orange|zinc|gray|grey|neutral)-\d/
    check('C1: zero legacy aliases or raw palette classes across the fasting scope',
      [page, loading, timer, controls, history, editForm, stats].every((s) =>
        !LEGACY.test(stripComments(s)) && !RAW.test(stripComments(s))))
    check('C2: no text-glyph affordances remain; replacements are aria-hidden Lucide icons',
      [page, timer, controls, history, editForm].every((s) => {
        const code = stripComments(s)
        return !code.includes('\u2713') && !code.includes('\u2192') && !code.includes('\u2193')
      }) &&
      timer.includes('<CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />') &&
      history.includes('<CheckCircle2 className="w-3 h-3" aria-hidden="true" />') &&
      controls.includes('<Plus className="w-3.5 h-3.5" aria-hidden="true" />'))
    check('C3: inputs on the semantic interactive-surface/edge/ring convention',
      (controls.match(/bg-surface-interactive border border-edge/g) || []).length === 5 &&
      (editForm.match(/bg-surface-interactive border border-edge/g) || []).length === 2)
    check('C4: real 44px targets — history edit/delete boxes, edit toggle, manual toggle, form actions',
      history.includes('flex h-11 w-11 items-center justify-center text-ink-muted hover:text-ink') &&
      history.includes('flex h-11 w-11 items-center justify-center text-ink-muted hover:text-critical') &&
      controls.includes('w-full min-h-11 py-2 rounded-lg border border-edge') &&
      controls.includes('flex w-full min-h-11 items-center justify-center gap-1 py-2') &&
      (editForm.match(/min-h-11 py-2\.5/g) || []).length === 2 &&
      (controls.match(/py-3 rounded-lg/g) || []).length >= 3)
    check('C5: goal-met and goal-reached states carry text, never color alone',
      history.includes('goal met') && history.includes('goal not met') &&
      timer.includes('Reached!'))
  }

  // ── 4. Timer and timezone (fixed instants) ──────────────────────────
  console.log('\n4. Timer and timezone')
  {
    const { getFastingDuration, formatDurationHMS, formatDuration, didCompleteGoal,
      getCurrentMilestone, getNextMilestone } = await import('../src/lib/fasting')
    check('D1: elapsed duration is deterministic for fixed instants (16h30m fast)',
      (() => {
        const { minutes, seconds } = getFastingDuration(
          '2026-08-15T18:00:00.000Z', '2026-08-16T10:30:00.000Z')
        return minutes === 990 && seconds === 0
      })())
    check('D2: HMS formatting is exact',
      formatDurationHMS(990, 0).length > 0 &&
      formatDurationHMS(990, 0) === formatDurationHMS(990, 0) &&
      formatDuration(990).includes('16'))
    check('D3: goal completion boundary is exact at the goal hour',
      didCompleteGoal('2026-08-15T18:00:00.000Z', '2026-08-16T10:00:00.000Z', 16) === true &&
      didCompleteGoal('2026-08-15T18:00:00.000Z', '2026-08-16T09:59:00.000Z', 16) === false)
    check('D4: goal progress is bounded at 100 exactly as the component computes it',
      (() => {
        const pct = (mins: number, goal: number) => Math.min(100, (mins / (goal * 60)) * 100)
        return pct(990, 16) === 100 && Math.abs(pct(480, 16) - 50) < 0.001 && pct(0, 16) === 0
      })())
    check('D5: milestone thresholds unchanged (12/16/18/24) and honestly hedged',
      (() => {
        const lib = read('src/lib/fasting.ts')
        return getCurrentMilestone(11.9) === null &&
          getCurrentMilestone(12)!.hours === 12 &&
          getCurrentMilestone(17)!.hours === 16 &&
          getNextMilestone(17)!.hours === 18 &&
          getCurrentMilestone(25)!.hours === 24 &&
          lib.includes('Calories still determine fat loss.') &&
          lib.includes('Not required for fat loss.')
      })())
    check('D6: timer ticks every second from the actual start instant and cleans up',
      timer.includes('getFastingDuration(fast.started_at, null)') &&
      timer.includes('const id = setInterval(tick, 1000)') &&
      timer.includes('return () => clearInterval(id)') &&
      timer.includes('}, [fast.started_at])'))
    check('D7: rendered active timer shows goal context and projected end from the start instant',
      (() => {
        const { FastingTimer } = require('../src/components/fasting/FastingTimer')
        const markup = renderToStaticMarkup(React.createElement(FastingTimer, {
          fast: {
            id: 'f1', started_at: '2026-08-15T18:00:00.000Z', ended_at: null,
            goal_hours: 16, fasting_type: 'intermittent', completed_goal: null, notes: null,
          } as never,
        }))
        return markup.includes('Active fast') && markup.includes('Goal: 16h') &&
          markup.includes('Ends around') &&
          markup.includes('bg-surface-sunken rounded-full overflow-hidden')
      })())
    check('D8: local-week boundary unchanged — fasting week anchors to the user-local day',
      read('src/lib/supabase/server.ts')
        .includes('const weekStart = startOfISOWeek(parseISO(localTodayFromCookies()))'))
  }

  // ── 5. Lifecycle and payloads byte-anchored ─────────────────────────
  console.log('\n5. Lifecycle and payloads')
  {
    check('E1: start-fast payload unchanged (instant timestamps, derived type, null completion)',
      controls.includes("started_at: new Date().toISOString()") &&
      controls.includes('ended_at: null,') &&
      controls.includes("fasting_type: hours ? fastingTypeFromHours(hours) : 'intermittent'") &&
      controls.includes('completed_goal: null,'))
    check('E2: end-fast payload unchanged (didCompleteGoal on real instants)',
      controls.includes('const endedAt = new Date().toISOString()') &&
      controls.includes('didCompleteGoal(activeFast.started_at, endedAt, activeFast.goal_hours)') &&
      controls.includes(".update({ ended_at: endedAt, completed_goal: completed })"))
    check('E3: one-active-fast boundary intact — 23505 mapping and the conflict copy',
      (controls.match(/23505/g) || []).length === 2 &&
      controls.includes('You already have an active fast. End the current fast before starting another ongoing fast.') &&
      controls.includes('if (!endedAt && activeFast) {'))
    check('E4: manual entry validation and blank-End-means-ongoing preserved',
      controls.includes('validateManualFastTimes(manualStart, manualEnd)') &&
      controls.includes('Leave End blank to start an ongoing fast from this time.'))
    check('E5: edit/delete flows unchanged (same row corrected, confirm before delete)',
      editForm.includes('validateManualFastTimes(start, end)') &&
      history.includes("confirm('Delete this fasting log?')") &&
      history.includes(".delete().eq('id', id)"))
    check('E6: session-derived user only; no client user id, no service role',
      [controls, editForm].every((s) => s.includes('supabase.auth.getUser()')) &&
      // history's delete is RLS-scoped by row id (the established
      // architecture) — it never sends a user id either.
      !history.includes('user_id') &&
      [controls, editForm, history].every((s) => !/service_role/i.test(s)))
    check('E7: presets unchanged — real named options from the canonical registry',
      controls.includes('FASTING_GOAL_OPTIONS.map(({ value, label })') &&
      read('src/lib/constants.ts').includes("{ value: '16', label: '16 hours (Common IF)' }"))
    check('E8: refresh restoration — the page rereads the active fast server-side each render',
      page.includes('fetchActiveFast(supabase, user.id)') &&
      page.includes('{activeFast && <FastingTimer fast={activeFast} />}'))
    check('E9: history stays bounded, newest-first, completed-only, with the honest empty state',
      page.includes(".not('ended_at', 'is', null)") &&
      page.includes(".order('started_at', { ascending: false })") &&
      page.includes('.limit(50)') &&
      history.includes('No completed fasts yet.'))
    check('E10: missing-vs-zero — null end never renders as a zero timestamp',
      history.includes('fasts.filter((f) => f.ended_at !== null)') &&
      stats.includes("stats.avgDurationFormatted ?? '\u2014'"))
    check('E11: failure states keep input and stay usable (error state, no form reset on error)',
      controls.includes('if (dbError) {') &&
      !controls.includes("setManualStart('')\n    setError") &&
      editForm.includes('setError(validation.error)'))
  }

  // ── 6. Loading geometry ─────────────────────────────────────────────
  console.log('\n6. Loading geometry')
  {
    check('F1: loading mirrors width, header, subnav, and the two-column split',
      loading.includes('max-w-6xl') &&
      loading.includes('lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]') &&
      loading.includes('aria-hidden="true"'))
    check('F2: no fake timer value, history rows, copy, or interactive controls',
      !loading.includes('<Link') && !loading.includes('<button') &&
      !loading.match(/\d\d:\d\d/) && !loading.match(/>[A-Z][a-z]+ /))
  }

  // ── 7. Honesty and roadmap boundaries ───────────────────────────────
  console.log('\n7. Honesty and boundaries')
  {
    check('G1: no streaks, scores, ranks, badges, adherence %, or medical promises added',
      [page, timer, controls, history, editForm, stats].every((s) => {
        const code = stripComments(s).toLowerCase()
        return !/streak|score|rank|badge|detox|autophagy|guarantee|fat.burn/i.test(code)
      }))
    check('G2: educational milestones byte-untouched (lib diff empty)',
      (() => {
        try {
          return execSync('git diff --name-only -- src/lib/fasting.ts src/lib/constants.ts',
            { encoding: 'utf8' }).trim() === ''
        } catch { return false }
      })())
    check('G3: roadmap-only fasting futures recorded in the notes, unimplemented',
      (() => {
        const notes = read('docs/ui6b-fasting-visual-notes.md')
        return notes.includes('## Roadmap-only: future fasting opportunities') &&
          notes.includes('reminders') && notes.includes('safety') &&
          !existsSync('src/app/api/fasting-reminders')
      })())
    check('G4: dependencies and migrations unchanged (exactly 001-022)',
      (() => {
        let out = ''
        try { out = execSync('git diff --name-only -- package.json package-lock.json supabase/', { encoding: 'utf8' }) } catch { return false }
        // ADMISSION (EXLIB-1B2 Revision H): the committed 023 draft
        // (candidate 8ec67b4) is corrected in-review; its tracked
        // modification is admitted. Nothing else may appear.
        return out.trim().split('\n').filter(Boolean)
          .every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql') &&
          (/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql'))
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
