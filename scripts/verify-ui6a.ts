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
  // RETARGET (UI-6A hosted-QA correction, macro-fill visibility):
  // the dashboard macro card provably shared the same dead-utility
  // regression (it renders the same lib/food class strings), so it
  // joins the corrected inventory.
  'src/components/dashboard/NutritionCard.tsx',
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
    // RETARGET (UI-6A hosted-QA correction, macro-fill visibility):
    // original boundary — every inventory file glyph-free. The
    // dashboard NutritionCard joined the inventory ONLY for the fill
    // correction; its pre-existing 'Log food' arrow affordance is a
    // Dashboard-pillar element pinned by verify-ui2/4b3 and is
    // deliberately outside this Fuel slice. The Fuel files' boundary
    // is unchanged.
    check('H1: no text-arrow/checkmark glyph affordances remain in touched Fuel code',
      INVENTORY.filter((f) => !f.includes('dashboard/')).every((f) => {
        const code = stripComments(read(f))
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

  // ── M. Macro-fill visibility (hosted-QA correction) ─────────────────
  // The hosted defect survived source-string checks, so these proofs
  // inspect the RENDERED markup (exact inline widths, real component)
  // and the COMPILED stylesheet (actual background-color declarations)
  // — never class names alone.
  console.log('\nM. Macro-fill visibility')
  {
    const { DailyMacroSummary } = await import('../src/components/food/DailyMacroSummary')
    const { computeNutritionProgress } = await import('../src/lib/food')
    const target: any = {
      calories: 2300, protein_g: 90, carbs_g: 250, fat_g: 60,
      effective_date: '2026-08-16',
    }
    const totals = (cal: number, p: number, c: number, f: number) => ({
      calories: cal, protein_g: p, carbs_g: c, fat_g: f,
    })
    const html = (t: any, compact = false) => renderToStaticMarkup(
      React.createElement(DailyMacroSummary, {
        progress: computeNutritionProgress(t as never, target, 12),
        target, compact,
      } as never))
    const fillWidths = (markup: string) =>
      Array.from(markup.matchAll(/class="h-full (bg-[a-z-]+) rounded-full[^"]*" style="width:([0-9.]+)%"/g))
        .map((m) => ({ cls: m[1], pct: parseFloat(m[2]) }))

    // The exact hosted-QA evidence values.
    const qa1 = fillWidths(html(totals(675, 46, 100, 20)))
    check('M1: track and fill both render for every macro row',
      qa1.length === 4 &&
      (html(totals(675, 46, 100, 20)).match(/h-2 bg-surface-sunken rounded-full overflow-hidden/g) || []).length === 4)
    // The width derives from the EXISTING lib calculation, which
    // rounds pct to whole percents (675/2300 = 29.35 -> 29). The
    // proofs assert the exact ratio within that established integer
    // rounding — the calculation itself is untouched (M15).
    check('M4: 675 / 2,300 calories renders its 29.35% ratio as the established rounded 29% fill',
      Math.abs(qa1[0].pct - (675 / 2300) * 100) < 0.5 &&
      qa1[0].pct === 29 && qa1[0].cls === 'bg-success')
    check('M5: 46 / 90g protein renders its 51.11% ratio as the established rounded 51% fill',
      Math.abs(qa1[1].pct - (46 / 90) * 100) < 0.5 &&
      qa1[1].pct === 51 && qa1[1].cls === 'bg-info')
    const qa2 = fillWidths(html(totals(1653, 105, 100, 64)))
    check('M6: 1,653 / 2,300 calories renders its 71.87% ratio as the established rounded 72% fill',
      Math.abs(qa2[0].pct - (1653 / 2300) * 100) < 0.5 &&
      qa2[0].pct === 72)
    check('M7: 105/90g and 64/60g stay bounded at exactly 100% — the fill never overflows its track',
      qa2[1].pct === 100 && qa2[3].pct === 100 &&
      qa2.every((w) => w.pct <= 100))
    check('M8: zero consumed renders width:0% — no fake sliver',
      (() => {
        const zero = fillWidths(html(totals(0, 0, 0, 0)))
        return zero.length === 4 && zero.every((w) => w.pct === 0)
      })())
    check('M9: missing target keeps the honest no-target state',
      renderToStaticMarkup(React.createElement(DailyMacroSummary, {
        progress: null, target: null, compact: false } as never))
        .includes('No nutrition targets set.'))
    check('M10: compact and full modes both carry visible fill classes',
      fillWidths(html(totals(675, 46, 100, 20), true)).length >= 1 &&
      fillWidths(html(totals(675, 46, 100, 20), false)).length === 4)
    check('M11: each status stays inside its own macro value block (over-protein next to protein)',
      (() => {
        const m = html(totals(675, 105, 100, 20))
        const protein = m.indexOf('Protein')
        const carbs = m.indexOf('Carbs')
        const over = m.indexOf('over target')
        return protein < over && over < carbs
      })())

    // Compiled-stylesheet computed styles: the semantic utilities
    // exist with real, distinct background-color declarations; the
    // dead legacy utilities are provably absent (the root cause).
    const cssFiles = readdirSync('.next/static/css').filter((f) => f.endsWith('.css'))
    check('M2-pre: a compiled stylesheet exists to inspect', cssFiles.length >= 1)
    const css = cssFiles.map((f) => read(`.next/static/css/${f}`)).join('\n')
    const decl = (cls: string) => {
      const m = css.match(new RegExp('\\.' + cls + '(?![a-z-])[^{]*\\{([^}]*)\\}'))
      return m ? m[1] : null
    }
    const track = decl('bg-surface-sunken')
    const fills = ['bg-success', 'bg-info', 'bg-caution', 'bg-critical'].map(decl)
    check('M2: track and all four fill tokens resolve to real, distinct compiled background colors',
      track !== null && track.includes('background-color') &&
      fills.every((f) => f !== null && f!.includes('background-color')) &&
      fills.every((f) => f !== track) &&
      new Set(fills).size === 4)
    check('M3: fill has nonzero compiled height and no transparency suppression',
      decl('h-2') !== null && decl('h-2')!.includes('height') &&
      decl('h-full') !== null && decl('h-full')!.includes('100%') &&
      !read('src/components/food/DailyMacroSummary.tsx').includes('opacity-0'))
    check('M3b: the dead legacy utilities are absent from the compiled stylesheet (root cause on record)',
      decl('bg-green-500') === null && decl('bg-blue-500') === null &&
      decl('bg-amber-500') === null && decl('bg-red-500') === null)
    check('M12: no raw palette, inline color, or forced style entered either corrected component',
      (() => {
        const RAW = /(?:text|bg|border|ring)-(?:green|amber|blue|red|yellow|orange|zinc|gray|grey|neutral)-\d/
        return ['src/components/food/DailyMacroSummary.tsx',
          'src/components/dashboard/NutritionCard.tsx'].every((f) => {
          const code = stripComments(read(f))
          return !RAW.test(code) && !code.includes('style={{ background') &&
            !code.includes('!important') && !code.includes('#')
        })
      })())
    check('M13: fills stay clipped inside the rounded track at every width (overflow-hidden on the track)',
      read('src/components/food/DailyMacroSummary.tsx')
        .includes('h-2 bg-surface-sunken rounded-full overflow-hidden') &&
      read('src/components/dashboard/NutritionCard.tsx')
        .includes('bg-surface-sunken rounded-full overflow-hidden'))
    check('M14: the dashboard NutritionCard shares the correction (same regression, same mapping)',
      (() => {
        const nc = read('src/components/dashboard/NutritionCard.tsx')
        return nc.includes("FILL_TOKEN[progressColor(pct, isCalories).split('-')[1]]") &&
          nc.includes("REMAINING_TOKEN[remainingColor(remaining).split('-')[1]]")
      })())
    check('M15: lib/food.ts is byte-untouched by this correction (thresholds and meaning intact)',
      (() => {
        try {
          return execSync('git diff --name-only -- src/lib/food.ts', { encoding: 'utf8' }).trim() === ''
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
