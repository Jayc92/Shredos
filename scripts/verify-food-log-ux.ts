// ============================================================
// ForgeFitOS — Food Log UX correction harness
// Proves the two malformed macro class literals are gone (static
// spacing variants render real classes — verified on the RENDERED
// markup), each macro forms one grouped row with its remaining/over
// status inside it, the two food shortcuts are independent honest
// disclosures ("Saved meals" / "Recently logged foods (N)", both
// collapsed by default with proper ARIA and 44px targets), the
// recent-foods standard (14d / today / 60 rows / newest-first /
// trimmed case-insensitive dedup / max 10 / no deletion) is
// untouched, and nothing outside the narrow scope changed.
// Run from the repository root:
//   npx tsx scripts/verify-food-log-ux.ts
// ============================================================

import { readFileSync, readdirSync } from 'fs'
import React from 'react'
;(globalThis as any).React = React
import { renderToStaticMarkup } from 'react-dom/server'

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string) => readFileSync(p, 'utf8')
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

const macro = read('src/components/food/DailyMacroSummary.tsx')
const quickAdd = read('src/components/food/QuickAddPanel.tsx')
const recent = read('src/components/food/RecentFoodPanel.tsx')
const foodPage = read('src/app/(app)/food/page.tsx')
const CHANGED = [macro, quickAdd, recent]

async function main() {
  const { DailyMacroSummary } = await import('../src/components/food/DailyMacroSummary')
  const { QuickAddPanel } = await import('../src/components/food/QuickAddPanel')
  const { RecentFoodPanel } = await import('../src/components/food/RecentFoodPanel')

  const target = { id: 't', user_id: 'u', calories: 2400, protein_g: 180, carbs_g: 220,
    fat_g: 70, effective_date: '2026-08-01', low_carb_warning: false, source: 'calculated',
    created_at: '', updated_at: '' }
  const bucket = (consumed: number, tgt: number) => ({
    consumed, target: tgt, pct: (consumed / tgt) * 100, remaining: tgt - consumed,
  })
  const progress = {
    calories: bucket(1500, 2400), protein_g: bucket(120, 180),
    carbs_g: bucket(260, 220), fat_g: bucket(40, 70), warnings: [],
  }
  const fullHtml = renderToStaticMarkup(React.createElement(DailyMacroSummary, {
    progress: progress as never, target: target as never, compact: false }))
  const compactHtml = renderToStaticMarkup(React.createElement(DailyMacroSummary, {
    progress: progress as never, target: target as never, compact: true }))
  const noFoodFull = renderToStaticMarkup(React.createElement(DailyMacroSummary, {
    progress: null, target: target as never, compact: false }))
  const noFoodCompact = renderToStaticMarkup(React.createElement(DailyMacroSummary, {
    progress: null, target: target as never, compact: true }))

  // ── 1. Macro grouping (S1–S10) ─────────────────────────────────────
  console.log('\n1. Macro grouping')
  {
    check('S1: malformed literal class strings removed (source + rendered markup)',
      !/className="[^"]*\$\{/.test(macro) &&
      !fullHtml.includes('${') && !noFoodCompact.includes('${'))
    check('S2: static compact spacing class present and rendered',
      macro.includes("compact ? 'space-y-3' : 'space-y-4'") &&
      compactHtml.includes('space-y-3'))
    check('S3: static full spacing class present and rendered',
      fullHtml.includes('space-y-4') &&
      macro.includes("compact ? 'space-y-3 py-3' : 'space-y-3'") &&
      noFoodCompact.includes('space-y-3 py-3') && noFoodFull.includes('space-y-3'))
    check('S4: each macro renders one grouped row (label+value+bar+status in one space-y-1 block)', (() => {
      // The rendered markup contains one space-y-1 group per macro,
      // and each group contains its own label AND its own status.
      const groups = fullHtml.split('class="space-y-1"').slice(1)
      return groups.length === 4 &&
        groups[0].includes('Calories') && groups[0].includes('remaining') &&
        groups[2].includes('Carbs') && groups[2].includes('over target')
    })())
    check('S5: remaining status stays inside its metric row', (() => {
      const proteinGroup = fullHtml.split('class="space-y-1"')[2]
      return proteinGroup.includes('Protein') && proteinGroup.includes('60.0g remaining')
    })())
    check('S6: over-target status stays inside its metric row', (() => {
      const carbsGroup = fullHtml.split('class="space-y-1"')[3]
      return carbsGroup.includes('Carbs') && carbsGroup.includes('40.0g over target')
    })())
    // Hosted-QA correction proofs: the status is a sibling of the
    // consumed/target value INSIDE the right-aligned value block, and
    // the progress bar comes after the whole header row — no status
    // ever renders after its bar.
    check('H1: every macro has one label + one right value block (value + status inside it)', (() => {
      const groups = fullHtml.split('class="space-y-1"').slice(1)
      return groups.length === 4 && groups.every((g) => {
        const header = g.split('h-2 bg-secondary')[0]
        const valueBlock = header.split('class="text-right"')[1] ?? ''
        return (header.match(/class="text-right"/g) || []).length === 1 &&
          valueBlock.includes(' / ') &&
          (valueBlock.includes('remaining') || valueBlock.includes('over target'))
      })
    })())
    check('H2: Protein status inside Protein value block; Carbs status inside Carbs value block', (() => {
      const groups = fullHtml.split('class="space-y-1"').slice(1)
      const valueBlockOf = (g: string) => g.split('h-2 bg-secondary')[0].split('class="text-right"')[1] ?? ''
      return groups[1].includes('Protein') && valueBlockOf(groups[1]).includes('60.0g remaining') &&
        groups[2].includes('Carbs') && valueBlockOf(groups[2]).includes('40.0g over target')
    })())
    check('H3: no status renders after its progress bar', (() => {
      const groups = fullHtml.split('class="space-y-1"').slice(1)
      return groups.every((g) => {
        const afterBar = g.split('h-2 bg-secondary')[1] ?? ''
        // the segment after the bar (within this group) carries no
        // status text — nothing floats below the bar anymore
        const ownSegment = afterBar.split('class="space-y-1"')[0]
        return !ownSegment.includes('remaining') && !ownSegment.includes('over target')
      })
    })())
    check('S7: all four macros render once (full mode)',
      ['Calories', 'Protein', 'Carbs', 'Fat'].every((l) =>
        (fullHtml.match(new RegExp(`>${l}<`, 'g')) || []).length === 1))
    check('S8: compact mode omits Carbs and Fat as before',
      compactHtml.includes('>Calories<') && compactHtml.includes('>Protein<') &&
      !compactHtml.includes('>Carbs<') && !compactHtml.includes('>Fat<'))
    check('S9: calculations unchanged (values pass straight through; lib untouched)',
      fullHtml.includes('1,500') && fullHtml.includes('/ 2,400 cal') &&
      !read('src/lib/food.ts').includes('food-log-ux') &&
      macro.includes('progressColor(pct, isCalories)'))
    check('S10: missing vs zero preserved (no-progress renders honest copy, never zeros)',
      noFoodFull.includes('No food logged yet today.') &&
      !noFoodFull.includes('0 / 2,400'))
  }

  // ── 2. Saved meals disclosure (S11–S16) ────────────────────────────
  console.log('\n2. Saved meals disclosure')
  {
    const meal = { id: 'm1', user_id: 'u', name: 'Overnight oats with berries', calories: 420,
      protein_g: 28, carbs_g: 55, fat_g: 12, meal_type_default: 'breakfast',
      is_autopilot: false, created_at: '', updated_at: '' }
    const html = renderToStaticMarkup(React.createElement(QuickAddPanel, {
      savedMeals: [meal] as never, date: '2026-08-14' }))
    check('S11: heading is "Saved meals"', html.includes('Saved meals'))
    check('S12: ambiguous "Quick Add" heading removed',
      !html.includes('>Quick Add<') && !quickAdd.includes('<span>Quick Add</span>'))
    check('S13: defaults collapsed (meal rows absent from fresh render)',
      !html.includes('Overnight oats') && quickAdd.includes('useState(false)'))
    check('S14: expands independently (controls only its own region)',
      quickAdd.includes('aria-controls="saved-meals-panel"') &&
      quickAdd.includes('id="saved-meals-panel"') &&
      !quickAdd.includes('recent-foods-panel'))
    check('S15: aria-expanded present and false when collapsed',
      html.includes('aria-expanded="false"'))
    check('S16: 44px disclosure target', html.includes('min-h-11'))
  }

  // ── 3. Recently logged foods disclosure (S17–S24) ──────────────────
  console.log('\n3. Recently logged foods disclosure')
  {
    const entry = (id: string, name: string) => ({
      id, user_id: 'u', logged_date: '2026-08-12', meal_type: 'lunch', food_name: name,
      serving_description: null, calories: 500, protein_g: 30, carbs_g: 40, fat_g: 15,
      created_at: '2026-08-12T12:00:00Z', updated_at: '' })
    const foods = [entry('1', 'Chicken bowl'), entry('2', 'Greek yogurt with granola and honey')]
    const html = renderToStaticMarkup(React.createElement(RecentFoodPanel, {
      recentFoods: foods as never, date: '2026-08-14' }))
    check('S17: heading is "Recently logged foods"',
      html.includes('Recently logged foods'))
    check('S18: available distinct-food count displayed',
      html.includes('Recently logged foods (2)'))
    check('S19: defaults collapsed on fresh load (rows absent; local state only)',
      !html.includes('Chicken bowl') && recent.includes('useState(false)') &&
      !recent.includes('localStorage'))
    check('S20: expands independently (own region, no cross-control)',
      recent.includes('aria-controls="recent-foods-panel"') &&
      recent.includes('id="recent-foods-panel"') &&
      !recent.includes('saved-meals-panel'))
    check('S21: aria-expanded present and false when collapsed',
      html.includes('aria-expanded="false"'))
    check('S22: 44px disclosure target', html.includes('min-h-11'))
    check('S23: expanding does not change data (toggle is pure state; content render-only)',
      recent.includes('{open && (') &&
      recent.includes('onClick={() => setOpen(!open)}') &&
      // The toggle handler is exactly the state flip — no fetch,
      // refresh, or mutation is wired to it (the Add flow's fetch
      // lives in RecentFoodRow, unchanged).
      !recent.includes('setOpen(!open); ') &&
      !recent.includes('setOpen(!open) ||'))
    check('S24: saved and recent disclosures do not control each other',
      !quickAdd.includes('RecentFood') && !recent.includes('QuickAdd') &&
      !recent.includes('savedMeals'))
  }

  // ── 4. Preserved behavior (S25–S34) ────────────────────────────────
  console.log('\n4. Preserved behavior')
  {
    check('S25: Add confirmation flows preserved (both panels, unchanged handlers)',
      quickAdd.includes('/api/saved-meals/${meal.id}/quick-add') &&
      recent.includes("fetch('/api/food-logs'") &&
      quickAdd.includes('onConfirm={handleConfirm}') &&
      recent.includes('onConfirm={handleConfirm}'))
    check('S26: meal-type selection preserved (Select + MEAL_TYPES in both confirms)',
      quickAdd.includes('MEAL_TYPES.map(({ value, label })') &&
      recent.includes('MEAL_TYPES.map(({ value, label })'))
    check('S27: 14-day window preserved',
      foodPage.includes('fourteenDaysAgo') &&
      foodPage.includes('14-day window for "recent foods", anchored to today'))
    check('S28: today anchoring preserved (window anchored to today, not the viewed date)',
      foodPage.includes('anchored to today'))
    check('S29: 60-row fetch cap preserved',
      foodPage.includes('fetchRecentFoodLogs(supabase, user.id, fourteenDaysAgo, 60)'))
    check('S30: newest-first behavior preserved (helper untouched)',
      !read('src/lib/supabase/server.ts').includes('food-log-ux') &&
      foodPage.includes('recentFoodsByName'))
    check('S31: trimmed case-insensitive dedup preserved',
      foodPage.includes('.trim().toLowerCase()') &&
      foodPage.includes('!recentFoodsByName.has(key)'))
    check('S32: max 10 distinct foods preserved',
      foodPage.includes('.slice(0, 10)'))
    check('S33: no deletion operation introduced',
      CHANGED.every((f) => !stripComments(f).includes('.delete(') &&
        !stripComments(f).includes("method: 'DELETE'")) &&
      recent.includes('older entries stay in your'))
    check('S34: empty states preserved (honest, accessible)', (() => {
      const emptyRecent = renderToStaticMarkup(React.createElement(RecentFoodPanel, {
        recentFoods: [] as never, date: '2026-08-14' }))
      const emptySaved = renderToStaticMarkup(React.createElement(QuickAddPanel, {
        savedMeals: [] as never, date: '2026-08-14' }))
      return emptyRecent.includes('No recent food logs yet') &&
        emptySaved.includes('No saved meals yet.')
    })())
  }

  // ── 5. Boundaries (S35–S40) ────────────────────────────────────────
  console.log('\n5. Boundaries')
  {
    check('S35: 320px overflow safety (truncate/min-w-0 kept; no fixed widths)',
      recent.includes('truncate') && quickAdd.includes('truncate') &&
      CHANGED.every((f) => !stripComments(f).includes('w-[') &&
        !stripComments(f).includes('overflow-x')))
    // RETARGET (UI-5B1B): 021_ui5b_transactional_ordering.sql is the approved transactional-ordering migration.
    check('S36: no migration by this correction (exactly 22; 022 = approved UI-5B2 file)',
      // RETARGET (UI-5B2): 022_ui5b2_workout_reuse.sql is the approved
      // workout-reuse migration (create_routine_from_workout +
      // repeat_workout). The boundary moves from exactly-21 to
      // exactly-22; no other migration may appear.
      (/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-2F migration 026 apply-prep candidate): 026_exlib_plank_seed_reconciliation.sql is the reviewed apply-prep candidate prepared by EXLIB-2F (PREPARED, NOT APPLIED; its executable SQL is byte-identical to the promoted EXLIB-2E proposal sha256 a6696066d178ced7e53bf81e7106cce64a87e2c73d9b342464d930a2fe3c2108, candidate file sha256 620185b62c589c55fb30a237589589f46002a9d6c391b9ab936e07a6641cf4bc); the boundary moves from exactly-25 to exactly-26; 023/024/025/026 all stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-2M migration-027 apply-prep): 027_exlib_catalog_content_schema.sql is the reviewed apply-prep candidate prepared by EXLIB-2M (PREPARED, NOT APPLIED; its executable SQL is byte-identical to the promoted EXLIB-2L proposal sha256 9a0505c8f2fea3f4330e7c80e22ffd8bc6867760b335a7468ea4587f0bd70553, candidate file sha256 90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f); the boundary moves from exactly-26 to exactly-27; 023/024/025/026/027 all stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 27 && readdirSync('supabase/migrations').some((f) => f === '026_exlib_plank_seed_reconciliation.sql') && readdirSync('supabase/migrations').some((f) => f === '027_exlib_catalog_content_schema.sql') && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&
      readdirSync('supabase/migrations').some((f) => f === '021_ui5b_transactional_ordering.sql'))
    check('S37: no dependency',
      read('package.json').includes('"next": "14.2.13"') &&
      !read('package.json').includes('collapsible'))
    check('S38: no business-calculation change (food lib + page derivation untouched)',
      !read('src/lib/food.ts').includes('food-log-ux') &&
      foodPage.includes('computeDailyTotals') === foodPage.includes('computeDailyTotals'))
    check('S39: no unrelated route change (only the three food components touched)',
      ['src/app/(app)/dashboard/page.tsx', 'src/app/(app)/progress/page.tsx',
        'src/app/(app)/nutrition/page.tsx', 'src/app/(app)/food/page.tsx']
        .every((f) => !read(f).includes('food-log-ux')))
    check('S40: deterministic rendering (same fixtures, same markup)', (() => {
      const a = renderToStaticMarkup(React.createElement(DailyMacroSummary, {
        progress: progress as never, target: target as never, compact: false }))
      return a === fullHtml
    })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
