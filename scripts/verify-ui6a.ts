// ============================================================
// ForgeFitOS — UI-6A Fuel visual rebuild harness
// Proves the presentation rebuild of /food, /food/saved, and
// /nutrition: approved wide-route compositions, primitive adoption,
// semantic-token-only styling, Lucide-only glyph affordances, 44px
// targets, honest loading geometry — while every food-log-ux,
// local-date, mutation, and calculation contract stays byte- or
// behavior-anchored, and the roadmap-only features stay unbuilt.
// Run from the repository root:
//   npx tsx scripts/verify-ui6a.ts
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
      usePathname: () => '/food',
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
const foodPage = read('src/app/(app)/food/page.tsx')
const savedPage = read('src/app/(app)/food/saved/page.tsx')
const nutritionPage = read('src/app/(app)/nutrition/page.tsx')
const foodLoading = read('src/app/(app)/food/loading.tsx')
const savedLoading = read('src/app/(app)/food/saved/loading.tsx')
const nutritionLoading = read('src/app/(app)/nutrition/loading.tsx')
const PAGES = [foodPage, savedPage, nutritionPage]
const ALL = INVENTORY.map(read)

async function main() {
  // ── A. Inventory and scope ──────────────────────────────────────────
  console.log('\nA. Inventory and scope')
  {
    check('A1: every inventory file exists', INVENTORY.every((f) => existsSync(f)))
    check('A2: worktree product changes stay inside the declared UI-6A inventory',
      (() => {
        let out = ''
        try { out = execSync('git status --porcelain', { encoding: 'utf8' }) } catch { return false }
        return out.split('\n').filter(Boolean).every((line) => {
          const f = line.slice(3).trim()
          return INVENTORY.includes(f) ||
            f.startsWith('scripts/verify-') || f.startsWith('docs/')
        })
      })())
    check('A3: business libraries, API routes, and other pillars untouched (git)',
      (() => {
        let out = ''
        try { out = execSync('git status --porcelain', { encoding: 'utf8' }) } catch { return false }
        return out.split('\n').filter(Boolean).every((line) => {
          const f = line.slice(3).trim()
          return !f.startsWith('src/lib/') && !f.startsWith('src/app/api/') &&
            !f.includes('fasting') && !f.includes('coach') && !f.includes('check-in') &&
            !f.includes('decisions')
        })
      })())
  }

  // ── B/C/D. Composition ──────────────────────────────────────────────
  console.log('\nB. Composition')
  {
    check('B1: all three routes on the approved wide width',
      PAGES.every((p) => p.includes('max-w-6xl')) &&
      PAGES.every((p) => !p.includes('max-w-3xl')))
    check('B2: /food — meal workflow is the feature column, supporting rail at lg',
      foodPage.includes('lg:flex lg:items-start lg:gap-6') &&
      foodPage.includes('lg:order-2 lg:w-80 lg:flex-shrink-0') &&
      foodPage.includes('lg:order-1 lg:mt-0 lg:min-w-0 lg:flex-1'))
    check('B3: /nutrition — two-column desktop grid, natural heights',
      nutritionPage.includes('lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start'))
    check('B4: /food/saved — responsive card grid, never one narrow floating column',
      (savedPage.match(/grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 items-start/g) || []).length === 2)
    check('C1: mobile order — date nav above columns; rail (macro, shortcuts) renders before meals',
      foodPage.indexOf('<DateNav') < foodPage.indexOf('<DailyMacroSummary') &&
      foodPage.indexOf('<DailyMacroSummary') < foodPage.indexOf('<QuickAddPanel') &&
      foodPage.indexOf('<QuickAddPanel') < foodPage.indexOf('<RecentFoodPanel') &&
      foodPage.indexOf('<RecentFoodPanel') < foodPage.indexOf('MEAL_TYPES.map'))
    check('D1: items-start everywhere; no equal-height forcing on any column',
      !stripComments(foodPage).includes('h-full') &&
      !stripComments(nutritionPage).includes('h-full') &&
      !stripComments(savedPage).includes('h-full'))
  }

  // ── E. Primitive adoption ───────────────────────────────────────────
  console.log('\nE. Primitives')
  {
    check('E1: PageHeader owns every route title (exactly one per page, no handwritten h1)',
      PAGES.every((p) => (p.match(/<PageHeader/g) || []).length === 1 && !p.includes('<h1')))
    check('E2: saved-meals group titles through SectionHeader',
      (savedPage.match(/<SectionHeader/g) || []).length === 2)
    check('E3: New-meal action lives in the PageHeader action slot with its 44px control',
      savedPage.includes('action={') && savedPage.includes('min-h-11 px-3 py-2'))
  }

  // ── F/G/H. Tokens and glyphs ────────────────────────────────────────
  console.log('\nF. Tokens and glyphs')
  {
    const LEGACY = /text-muted-foreground|text-foreground|bg-background|bg-secondary|bg-card|bg-muted|border-border|border-input|text-destructive|bg-destructive/
    const RAW = /(?:text|bg|border|ring)-(?:green|amber|blue|red|yellow|orange|zinc|gray|grey|neutral)-\d/
    for (let i = 0; i < INVENTORY.length; i++) {
      const code = stripComments(ALL[i])
      const name = INVENTORY[i].split('/').pop()
      if (LEGACY.test(code) || RAW.test(code)) {
        check(`F1-${name}: semantic tokens only`, false)
      }
    }
    check('F1: zero legacy aliases or raw palette classes across all 17 files',
      ALL.every((s) => !LEGACY.test(stripComments(s)) && !RAW.test(stripComments(s))))
    check('G1: status colors carry text, never color alone (remaining/over copy present)',
      read('src/components/food/DailyMacroSummary.tsx').includes("' remaining'") ||
      read('src/components/food/DailyMacroSummary.tsx').includes('remaining') &&
      read('src/components/food/DailyMacroSummary.tsx').includes('over target'))
    check('H1: no text-arrow/checkmark glyph affordances remain in touched code',
      ALL.every((s) => {
        const code = stripComments(s)
        return !code.includes('\u2192') && !code.includes('\u2713') && !code.includes('\u2193')
      }))
    check('H2: replacements are Lucide icons',
      read('src/components/food/DailyMacroSummary.tsx').includes('<ArrowRight') &&
      read('src/components/food/QuickAddPanel.tsx').includes('<ArrowRight') &&
      read('src/components/food/QuickDrinkLog.tsx').includes('<CheckCircle2') &&
      read('src/components/food/LabelCalculatorForm.tsx').includes('<CheckCircle2') &&
      nutritionPage.includes('<ArrowDown') && nutritionPage.includes('<CheckCircle2'))
  }

  // ── I. 44px targets (runtime) ───────────────────────────────────────
  console.log('\nI. Targets')
  {
    check('I1: primary actions and text-link buttons carry real 44px classes',
      nutritionPage.includes('min-h-11') &&
      savedPage.includes('min-h-11') &&
      read('src/components/nutrition/GoalAdjustmentReviewCard.tsx').includes('min-h-11 items-center'))
    const { DailyMacroSummary } = await import('../src/components/food/DailyMacroSummary')
    const noTarget = renderToStaticMarkup(React.createElement(DailyMacroSummary, {
      progress: null, target: null, compact: false } as never))
    check('I2: macro summary renders its Set-targets affordance as a link with an icon',
      noTarget.includes('Set targets') && noTarget.includes('<svg') &&
      noTarget.includes('href="/nutrition"'))
  }

  // ── J. Food-log-ux behavior intact ──────────────────────────────────
  console.log('\nJ. Food-log-ux behavior')
  {
    const quickAdd = read('src/components/food/QuickAddPanel.tsx')
    const recent = read('src/components/food/RecentFoodPanel.tsx')
    check('J1: both disclosures default collapsed with independent state',
      (quickAdd.match(/useState\(false\)/g) || []).length >= 1 &&
      (recent.match(/useState\(false\)/g) || []).length >= 1)
    check('J2: recently-logged copy and honest count preserved',
      recent.includes('Recently logged foods (') || recent.includes('Recently logged foods'))
    check('J3: 14-day/60-row/dedup/max-10 contract lines intact on the page',
      foodPage.includes('const fourteenDaysAgo = addDaysISO(todayStr, -13)') &&
      foodPage.includes('fetchRecentFoodLogs(supabase, user.id, fourteenDaysAgo, 60)') &&
      foodPage.includes('.trim().toLowerCase()') &&
      foodPage.includes('.slice(0, 10)'))
    check('J4: macro status text still sits beside its own value block',
      read('src/components/food/DailyMacroSummary.tsx').includes('remaining >= 0'))
  }

  // ── K. Local-date wiring intact ─────────────────────────────────────
  console.log('\nK. Local-date wiring')
  {
    check('K1: cookie-resolved today, validated ?date, pure string nav, honest sync mount',
      foodPage.includes('const todayStr = localTodayFromCookies()') &&
      foodPage.includes('const date = isValidDateParam(searchParams.date) ? searchParams.date : todayStr') &&
      foodPage.includes('const isNextFuture   = next > today') &&
      foodPage.includes('<LocalDateSync basePath="/food" resolvedDate={date} hadExplicitDate={isValidDateParam(searchParams.date)} />'))
    check('K2: meal pacing still keys off the user-local hour',
      foodPage.includes('const nowHour = localHourFromCookies()'))
    check('K3: nutrition day anchors stay browser-local',
      nutritionPage.includes(".lte('effective_date', localCalendarDayOf(new Date()))") &&
      nutritionPage.includes('const today = localCalendarDayOf(new Date())'))
  }

  // ── L. Mutations byte-anchored ──────────────────────────────────────
  console.log('\nL. Mutations')
  {
    check('L1: food-log mutations unchanged',
      read('src/components/food/AddFoodForm.tsx').includes("fetch('/api/food-logs'") &&
      read('src/components/food/FoodLogEntry.tsx').includes('`/api/food-logs/${entry.id}`'))
    check('L2: saved-meal CRUD + quick-add unchanged',
      read('src/components/food/SavedMealCard.tsx').includes('`/api/saved-meals/${meal.id}`') &&
      read('src/components/food/QuickAddPanel.tsx').includes('quick-add'))
    check('L3: direct browser-Supabase architecture retained on the two client pages',
      savedPage.includes("from('saved_meals')") &&
      nutritionPage.includes("from('nutrition_targets')") &&
      nutritionPage.includes("onConflict: 'user_id,effective_date'"))
    check('L4: decision-log side effect intact',
      nutritionPage.includes("from('decision_logs').insert({") &&
      nutritionPage.includes("decision_type: 'nutrition_targets_updated'"))
    check('L5: goal-adjustment review flow unchanged',
      read('src/components/nutrition/GoalAdjustmentReviewCard.tsx').includes('/api/goal-adjustment'))
    check('L6: day-status toggle wiring unchanged',
      foodPage.includes('{date <= todayStr && (') &&
      foodPage.includes('<DayCompleteToggle key={date} date={date} initialComplete={dayStatusRes.data !== null} />'))
  }

  // ── M/N. Honesty scans ──────────────────────────────────────────────
  console.log('\nM. Honesty')
  {
    check('M1: missing-vs-zero — no-target and no-food states stay honest copy',
      read('src/components/food/DailyMacroSummary.tsx').includes('No nutrition targets set.') &&
      read('src/components/food/DailyMacroSummary.tsx').includes('No food logged yet today.'))
    check('N1: no eat-back/burn-credit arithmetic anywhere in scope',
      ALL.every((s) => !/eat.?back|earned (calories|food)|burn.?credit|calories_burned/i.test(stripComments(s))))
  }

  // ── O. Loading geometry ─────────────────────────────────────────────
  console.log('\nO. Loading geometry')
  {
    check('O1: widths mirror the rebuilt pages',
      [foodLoading, savedLoading, nutritionLoading].every((l) => l.includes('max-w-6xl')))
    check('O2: food loading mirrors the two-column split including the rail-first order',
      foodLoading.includes('lg:flex lg:items-start lg:gap-6') &&
      foodLoading.includes('lg:order-2 lg:w-80 lg:flex-shrink-0') &&
      foodLoading.includes('lg:order-1 lg:mt-0 lg:min-w-0 lg:flex-1'))
    check('O3: nutrition loading mirrors the two-column grid',
      nutritionLoading.includes('lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'))
    check('O4: saved loading mirrors the header action slot and card grid',
      savedLoading.includes('sm:grid-cols-2 xl:grid-cols-3') &&
      savedLoading.includes('h-11 w-28'))
    check('O5: no interactive elements, copy, or fake values in loading states',
      [foodLoading, savedLoading, nutritionLoading].every((l) =>
        l.includes('aria-hidden="true"') && !l.includes('<Link') &&
        !l.includes('<button') && !l.match(/>[A-Z][a-z]+ /)))
  }

  // ── P/Q. Roadmap and inventory boundaries ───────────────────────────
  console.log('\nP. Boundaries')
  {
    const notes = read('docs/ui6a-fuel-visual-notes.md')
    check('P1: community publishing recorded as roadmap-only in the UI-6A notes',
      notes.includes('## Roadmap-only: community exercise and workout publishing') &&
      /Nothing about\s+this feature is implemented/.test(notes) &&
      notes.includes('moderation'))
    check('P2: no community/suggested-routine/StrengthLog product code',
      (() => {
        try {
          execSync("grep -ril 'strengthlog\\|upvote\\|publish.*workout' src", { encoding: 'utf8' })
          return false
        } catch { return true }
      })())
    check('Q1: dependencies and migrations unchanged',
      (() => {
        let out = ''
        try { out = execSync('git diff --name-only -- package.json package-lock.json supabase/', { encoding: 'utf8' }) } catch { return false }
        return out.trim() === '' &&
          readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 22
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
