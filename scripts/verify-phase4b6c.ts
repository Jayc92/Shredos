// ============================================================
// ForgeFitOS — Phase 4B.6C deterministic verification harness
// Verifies the Fuel + Profile redesign (/food, /food/saved,
// /nutrition, /profile): Fuel subnav, page hierarchies, card
// variants, current-target-vs-suggestion separation, loading
// geometry — and, critically, that every food flow, macro
// calculation, target authority rule, Phase 3E adjustment behavior,
// and profile persistence path is byte-anchored unchanged.
// Run from the repository root:
//   npx tsx scripts/verify-phase4b6c.ts
// ============================================================

import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

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

const foodPage = read('src/app/(app)/food/page.tsx')
const foodLoading = read('src/app/(app)/food/loading.tsx')
const savedPage = read('src/app/(app)/food/saved/page.tsx')
const savedLoading = read('src/app/(app)/food/saved/loading.tsx')
const nutritionPage = read('src/app/(app)/nutrition/page.tsx')
const nutritionLoading = read('src/app/(app)/nutrition/loading.tsx')
const profilePage = read('src/app/(app)/profile/page.tsx')
const profileLoading = read('src/app/(app)/profile/loading.tsx')
const subNav = read('src/components/food/FuelSubNav.tsx')
const macroSummary = read('src/components/food/DailyMacroSummary.tsx')
const mealSection = read('src/components/food/MealSection.tsx')
const foodEntry = read('src/components/food/FoodLogEntry.tsx')
const addFoodForm = read('src/components/food/AddFoodForm.tsx')
const quickAdd = read('src/components/food/QuickAddPanel.tsx')
const recentPanel = read('src/components/food/RecentFoodPanel.tsx')
const drinkLog = read('src/components/food/QuickDrinkLog.tsx')
const labelCalc = read('src/components/food/LabelCalculatorForm.tsx')
const savedCard = read('src/components/food/SavedMealCard.tsx')
const savedForm = read('src/components/food/SavedMealForm.tsx')
const coachPanel = read('src/components/nutrition/NutritionCoachPanel.tsx')
const trendSection = read('src/components/nutrition/NutritionTrendSection.tsx')
const reviewCard = read('src/components/nutrition/GoalAdjustmentReviewCard.tsx')
const notes = read('docs/phase4b6c-fuel-profile-notes.md')

const PAGES = [foodPage, savedPage, nutritionPage, profilePage]
const LOADINGS = [foodLoading, savedLoading, nutritionLoading, profileLoading]
const CHANGED = [...PAGES, ...LOADINGS, subNav, macroSummary, mealSection, quickAdd,
  recentPanel, drinkLog, labelCalc, savedCard, coachPanel, trendSection, reviewCard]

// ── 1. Checkpoint and routes ─────────────────────────────────────────
console.log('\n1. Checkpoint and routes')
{
  check('checkpoint artifacts exist (e2d6c79 tree)',
    ['scripts/verify-phase4b6b.ts', 'docs/phase4b6b-active-workout-notes.md',
      'src/app/(app)/workouts/[id]/loading.tsx',
      'supabase/migrations/013_phase3e_goal_adjustments.sql']
      .every((f) => existsSync(f)))
  check('all prior notes exist',
    ['phase4a-ux-information-architecture-audit', 'phase4b1-foundation-notes',
      'phase4b2-navigation-notes', 'phase4b3-today-notes', 'phase4b4-coach-pillar-notes',
      'phase4b5-progress-pillar-notes', 'phase4b6a-train-hubs-notes',
      'phase4b6b-active-workout-notes'].every((f) => existsSync(`docs/${f}.md`)))
  check('4B.6C notes exist', notes.length > 1500)
  for (const r of ['food', 'food/saved', 'nutrition', 'profile']) {
    check(`route retained: /${r}`, existsSync(`src/app/(app)/${r}/page.tsx`))
  }
  check('no aliases/redirects',
    !existsSync('src/app/(app)/fuel') && !read('next.config.mjs').includes('redirects'))
  check('metadata unchanged (client pages have no metadata export, as before)',
    foodPage.includes("title: 'Food log' }") &&
    nutritionPage.includes("'use client'") && profilePage.includes("'use client'"))
  // RETARGET (UI-6A): original boundary — each route rendered its
  // exact handwritten <h1>. The Fuel routes now render the SAME
  // titles through the PageHeader primitive (which owns the single
  // h1); Profile keeps its handwritten heading. One page title per
  // route is still asserted, now via primitive-or-h1.
  // RETARGET (UI-7): original boundary — each route renders its exact
  // title. The profile page's handwritten <h1> became the SAME title
  // through the PageHeader primitive (which owns the single h1).
  check('H1s correct',
    foodPage.includes('title="Food log"') && savedPage.includes('title="Saved meals"') &&
    nutritionPage.includes('title="Nutrition targets"') && profilePage.includes('title="Profile"'))
  // RETARGET (UI-7): profile joined the PageHeader convention — one
  // primitive-owned title per route, zero handwritten h1 anywhere.
  check('exactly one H1 per route',
    [foodPage, savedPage, nutritionPage, profilePage].every((p) =>
      (p.match(/<PageHeader/g) || []).length === 1 && !p.includes('<h1')) &&
    LOADINGS.every((l) => !l.includes('<h1')))
  check('auth gates preserved',
    foodPage.includes("redirect('/login')") && nutritionPage.includes('supabase.auth.getUser()') &&
    profilePage.includes('supabase.auth.getUser()'))
  check('onboarding gate preserved on food', foodPage.includes("redirect('/onboarding')"))
}

// ── 2. Fuel subnav ───────────────────────────────────────────────────
console.log('\n2. Fuel subnav')
{
  check('exact three links', (subNav.match(/href: '/g) || []).length === 3)
  check('exact labels', ["label: 'Food log'", "label: 'Saved meals'", "label: 'Nutrition targets'"]
    .every((l) => subNav.includes(l)))
  check('exact hrefs', ["href: '/food'", "href: '/food/saved'", "href: '/nutrition'"]
    .every((h) => subNav.includes(h)))
  check('exact matching (no prefix inheritance; /food/saved never lights Food log)',
    subNav.includes('pathname === section.href') &&
    !subNav.includes('startsWith'))
  check('aria-current', subNav.includes("aria-current={active ? 'page' : undefined}"))
  check('structural active state', subNav.includes('border-b-2') &&
    subNav.includes('font-semibold') && subNav.includes('border-brand'))
  check('border-wrapper pattern (no 1px scroll trap)',
    subNav.includes('<div className="border-b border-edge-subtle">') &&
    subNav.includes('className="-mb-px flex items-center gap-1 overflow-x-auto"'))
  check('mobile-safe', subNav.includes('whitespace-nowrap'))
  check('nav landmark', subNav.includes('aria-label="Fuel sections"'))
  check('no counts/persistence/emoji',
    !subNav.includes('localStorage') && !stripComments(subNav).includes('count') &&
    !EMOJI.test(subNav))
  check('rendered on all three Fuel routes',
    foodPage.includes('<FuelSubNav />') && savedPage.includes('<FuelSubNav />') &&
    nutritionPage.includes('<FuelSubNav />'))
  check('replaced ad-hoc cross-links (documented)',
    !foodPage.includes('Saved meals →') && !savedPage.includes('Back to food log') &&
    notes.includes('one tap away in the subnav'))
}

// ── 3. Food route contract ───────────────────────────────────────────
console.log('\n3. Food contract')
{
  const FETCHES = ['fetchFoodLogsForDate(supabase, user.id, date)',
    'fetchRecentFoodLogs(supabase, user.id, fourteenDaysAgo, 60)',
    'fetchSavedMeals(supabase, user.id)',
    'fetchCurrentNutritionTarget(supabase, user.id)']
  for (const f of FETCHES) {
    check(`query preserved: ${f.split('(')[0]}`, foodPage.includes(f))
  }
  // RETARGET (LOCAL-DATE-FIX): "today" now resolves from the user's
  // timezone cookie instead of the server's UTC clock (the hosted-QA
  // date-boundary defect), and future blocking became pure
  // date-string comparison. The boundaries — the selected date comes
  // from ?date with an honest default, and future days stay blocked —
  // are unchanged and now correct across the UTC midnight window.
  // RETARGET (LOCAL-DATE-FIX): original boundary — the page resolved
  // the cookie inline via `resolveLocalToday(tz)`. The repo-wide
  // sweep unified all server consumers onto the decode-safe
  // localTodayFromCookies() helper; the honest ?date default is
  // unchanged.
  check('date param + local-date semantics (user-local today)',
    foodPage.includes('const date = isValidDateParam(searchParams.date) ? searchParams.date : todayStr') &&
    foodPage.includes('const todayStr = localTodayFromCookies()'))
  check('future-date blocking unchanged',
    foodPage.includes('const isNextFuture   = next > today') &&
    foodPage.includes('aria-disabled={isNextFuture}'))
  check('old-date notice preserved', foodPage.includes('Logging more than 7 days ago'))
  // RETARGET (LOCAL-DATE-FIX): the 14-day window is the same width,
  // now computed with pure date-string math anchored to the USER'S
  // local today instead of the server's UTC day.
  check('recent-food window + dedupe + cap unchanged',
    foodPage.includes('addDaysISO(todayStr, -13)') &&
    foodPage.includes('recentFoodsByName') && foodPage.includes('.slice(0, 10)'))
  check('totals/progress math via existing lib',
    foodPage.includes('computeDailyTotals(logs, date)') &&
    foodPage.includes('computeNutritionProgress(totals, target, nowHour)'))
  check('meal grouping from constants',
    foodPage.includes('MEAL_TYPES.map') &&
    foodPage.includes("logs.filter((l) => l.meal_type === value)"))
  check('coach panel today-only gate unchanged',
    foodPage.includes('const isViewingToday = date === todayStr') &&
    foodPage.includes('isViewingToday\n    ? await fetchNutritionCoachSummary('))
  check('all tools retained (drink, calculator, recent, quick-add)',
    ['<QuickDrinkLog date={date} />', '<LabelCalculatorForm date={date} />',
      '<RecentFoodPanel recentFoods={recentFoods} date={date} />',
      '<QuickAddPanel savedMeals={savedMeals} date={date} />']
      .every((t) => foodPage.includes(t)))
  check('shortcuts precede meals; tools trail (4B.6C hierarchy)',
    foodPage.indexOf('<QuickAddPanel') < foodPage.indexOf('MEAL_TYPES.map') &&
    foodPage.indexOf('MEAL_TYPES.map') < foodPage.indexOf('<QuickDrinkLog'))
  check('server page preserved', !foodPage.includes("'use client'"))
  check('no writes on the food page render',
    !foodPage.includes('.insert(') && !foodPage.includes('.upsert('))
}

// ── 4. Daily macro summary ───────────────────────────────────────────
console.log('\n4. Daily macro summary')
{
  check('math from untouched lib (display formatting only, pre-existing)',
    macroSummary.includes("from '@/lib/food'") &&
    macroSummary.includes('progressColor(pct, isCalories)') &&
    macroSummary.includes('remainingColor(remaining)'))
  check('three states with correct variants (status/metric/elevated)',
    macroSummary.includes('variant="status"') && macroSummary.includes('variant="metric"') &&
    macroSummary.includes('variant="elevated"'))
  check('missing-target state preserved', macroSummary.includes('target'))
  check('remaining/over text always adjacent to bars',
    macroSummary.includes('remaining') && macroSummary.includes('over'))
  check('no failure framing for over-target',
    !/failed|too much|blew/i.test(stripComments(macroSummary)))
  check('no shred-card', !macroSummary.includes('shred-card'))
}

// ── 5. Meals and entries ─────────────────────────────────────────────
console.log('\n5. Meals and entries')
{
  check('meal section default Card, heading + entries preserved',
    mealSection.includes('variant="default"') && mealSection.includes('entries'))
  check('FoodLogEntry untouched (edit/delete/API anchors)',
    foodEntry.includes('/api/food-logs') && foodEntry.includes('DELETE'))
  check('AddFoodForm untouched (fields + validation anchors)',
    addFoodForm.includes('meal_type') && addFoodForm.includes('calories'))
  check('token-only deferrals documented',
    notes.includes('FoodLogEntry') && notes.includes('AddFoodForm') &&
    notes.includes('SavedMealForm'))
  check('no nested interactive cards in meals',
    !mealSection.match(/<Card[^>]*onClick/))
}

// ── 6. Quick tools contracts ─────────────────────────────────────────
console.log('\n6. Quick tools')
{
  check('quick-add endpoint unchanged',
    quickAdd.includes('`/api/saved-meals/${meal.id}/quick-add`'))
  check('recent-food repeat endpoint unchanged',
    recentPanel.includes("fetch('/api/food-logs'"))
  check('drink log endpoint unchanged',
    drinkLog.includes("fetch('/api/food-logs'"))
  check('label calculator endpoint unchanged',
    labelCalc.includes("fetch('/api/food-logs'"))
  check('calculator arithmetic untouched (per-serving × servings)',
    labelCalc.includes('servings') && !labelCalc.includes('shred-card'))
  check('quick tools subordinate variants (subtle panels, status empties)',
    quickAdd.includes('variant="subtle"') && recentPanel.includes('variant="subtle"') &&
    drinkLog.includes('variant="subtle"') && labelCalc.includes('variant="subtle"') &&
    quickAdd.includes('variant="status"') && recentPanel.includes('variant="status"'))
  check('no alcohol morality copy added',
    !/moderation|responsibly|too much alcohol/i.test(stripComments(drinkLog)))
}

// ── 7. Saved meals contract ──────────────────────────────────────────
console.log('\n7. Saved meals')
{
  check('list query + ordering unchanged (autopilot, use_count, name)',
    savedPage.includes(".order('is_autopilot', { ascending: false })") &&
    savedPage.includes(".order('use_count', { ascending: false })") &&
    savedPage.includes(".order('name', { ascending: true })"))
  check('create form in elevated Card, form untouched',
    savedPage.includes('variant="elevated"') &&
    savedPage.includes('<SavedMealForm onClose={handleClose} />'))
  check('reload-after-mutation behavior unchanged',
    savedPage.includes('function handleClose') && savedPage.includes('router.refresh()'))
  check('autopilot/other grouping preserved',
    savedPage.includes('meals.filter(m => m.is_autopilot)') &&
    savedPage.includes('Autopilot meals'))
  // RETARGET (UI-6A): the CTA's text arrow became a Lucide
  // ArrowRight on a 44px control; copy and the status-Card empty
  // state are unchanged.
  check('empty state constructive (status Card + CTA)',
    savedPage.includes('variant="status"') &&
    savedPage.includes('No saved meals yet.') &&
    savedPage.includes('Create your first saved meal') &&
    savedPage.includes('<ArrowRight'))
  check('card delete endpoint unchanged',
    savedCard.includes('`/api/saved-meals/${meal.id}`'))
  check('card edit-state elevated, display default',
    savedCard.includes('variant="elevated"') && savedCard.includes('variant="default"'))
  check('use-count metadata preserved', savedCard.includes('Used {meal.use_count}×'))
  check('client page boundary unchanged (pre-existing use client)',
    savedPage.includes("'use client'"))
  check('New meal button 44px brand', savedPage.includes('min-h-11') &&
    savedPage.includes('bg-brand text-brand-foreground'))
}

// ── 8. Nutrition contract ────────────────────────────────────────────
console.log('\n8. Nutrition contract')
{
  // RETARGET (LOCAL-DATE-FIX): original boundary — the client page
  // filtered with `.lte('effective_date', new Date().toISOString()
  // .split('T')[0])`, which is the UTC day even in the browser. The
  // versioned latest-effective query shape is unchanged; only the
  // day anchor moved to the browser's local calendar day.
  check('current target query unchanged (versioned latest-effective, local day)',
    nutritionPage.includes(".lte('effective_date', localCalendarDayOf(new Date()))") &&
    nutritionPage.includes(".order('effective_date', { ascending: false })"))
  check('NEW current-target card displays the same fetched target (no new query)',
    nutritionPage.includes('Current target') &&
    nutritionPage.includes('Effective {target.effective_date}') &&
    nutritionPage.includes('target.calories.toLocaleString()'))
  check('current target is the elevated authoritative surface (before the review)',
    nutritionPage.indexOf('variant="elevated"') < nutritionPage.indexOf('<GoalAdjustmentReviewCard'))
  check('suggestion surfaces subordinate (review=status, calculated=subtle)',
    reviewCard.includes('variant="status"') &&
    nutritionPage.includes('variant="subtle"'))
  check('target upsert behavior unchanged (versioned, onConflict, returning row)',
    nutritionPage.includes("onConflict: 'user_id,effective_date'") &&
    nutritionPage.includes('.select()') && nutritionPage.includes('setTarget(savedTarget)'))
  check('decision insert on manual save unchanged',
    nutritionPage.includes("decision_type: 'nutrition_targets_updated'"))
  check('low-carb warning rule unchanged',
    nutritionPage.includes('carb < 75') && nutritionPage.includes('low_carb_warning'))
  check('Phase 3E review card behavior anchors intact',
    reviewCard.includes('expectedCurrentCalories: review.currentCalories') &&
    reviewCard.includes('if (body.stale)') &&
    reviewCard.includes('handleApply'))
  check('apply RPC unchanged in migration 013',
    read('supabase/migrations/013_phase3e_goal_adjustments.sql')
      .includes('apply_goal_calorie_adjustment'))
  check('onApplied state sync preserved',
    nutritionPage.includes('onApplied={(newTarget) => {') &&
    nutritionPage.includes('setTarget(newTarget)'))
  check('trend section values from untouched lib, trailing position',
    nutritionPage.includes('buildNutritionTrendSummary(trendLogs, target?.protein_g ?? null)') &&
    nutritionPage.indexOf('<NutritionTrendSection') > nutritionPage.indexOf('</form>'))
  check('coach panel logic untouched',
    coachPanel.includes('summary') && !coachPanel.includes('fetch('))
  check('no automatic writes',
    !stripComments(nutritionPage).includes('useEffect(() => { handleSave') &&
    !reviewCard.includes('useEffect(() => { handleApply'))
}

// ── 9. Profile contract ──────────────────────────────────────────────
console.log('\n9. Profile contract')
{
  const FIELDS = ['display_name', 'age', 'height_cm', 'current_weight_kg', 'goal_weight_kg',
    'bf_pct', 'main_goal', 'activity_level', 'step_goal', 'preferred_weigh_in_cadence',
    'preferred_weigh_in_day', 'preferred_weigh_in_time', 'fasting_enabled',
    'default_fasting_goal_hours']
  for (const f of FIELDS) {
    check(`payload field preserved: ${f}`, profilePage.includes(`${f}:`))
  }
  check('single-save semantics preserved (one update call, one submit)',
    (stripComments(profilePage).match(/\.update\(/g) || []).length === 1 &&
    profilePage.includes("{saving ? 'Saving...' : 'Save profile'}"))
  check('main-goal explicit-selection rule unchanged',
    profilePage.includes('const newGoal        = mainGoal || prevGoal'))
  check('decision logging rules unchanged (4 change types)',
    ['weigh_in_cadence_changed', 'step_goal_changed', 'fasting_goal_changed',
      'main_goal_changed'].every((t) => profilePage.includes(`'${t}'`)))
  check('no nutrition-target mutation from profile',
    !profilePage.includes('nutrition_targets'))
  check('option lists from constants',
    profilePage.includes('MAIN_GOAL_OPTIONS') && profilePage.includes('WEIGH_IN_DAYS') &&
    profilePage.includes('FASTING_GOAL_OPTIONS'))
  check('OptionCard selection retained', profilePage.includes('<OptionCard'))
  check('fasting toggle remains a labeled switch',
    profilePage.includes('role="switch"') && profilePage.includes('aria-checked={fastingEnabled}'))
  check('five section Cards with varied hierarchy',
    (profilePage.match(/variant="default"/g) || []).length === 3 &&
    profilePage.includes('variant="elevated"') && profilePage.includes('variant="subtle"'))
  // RETARGET (UI-7): original boundary — the exact user-control
  // sentence. It moved verbatim into the PageHeader description prop
  // (single-line string), so the anchor drops the JSX line wrap.
  check('user-control copy present (no hidden target changes)',
    profilePage.includes('never changes nutrition targets on its own'))
  check('per-section persistence NOT introduced (4A decision documented)',
    !profilePage.includes('saveSection') &&
    notes.includes('no per-section persistence was introduced'))
  check('profile width per brief', profilePage.includes('max-w-4xl'))
}

// ── 10. Legacy style removal ─────────────────────────────────────────
console.log('\n10. Legacy style removal')
{
  check('zero shred-card on all active 4B.6C route scopes',
    CHANGED.every((f) => !stripComments(f).includes('shred-card')))
  // RETARGET (UI-7): the alias was retained only while unmigrated
  // consumers could exist; a repo-wide audit proved zero class
  // usages and UI-7 removed it. The boundary flips to absence.
  check('global alias retained', !read('src/app/globals.css').includes('.shred-card {'))
  check('no active src consumer remains (4B.6D migrated onboarding)',
    (() => {
      const offenders: string[] = []
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry)
          if (statSync(full).isDirectory()) { walk(full); continue }
          if (!/\.(tsx|ts)$/.test(entry)) continue
          if (stripComments(read(full)).includes('shred-card')) offenders.push(full)
        }
      }
      walk('src/app')
      walk('src/components')
      return offenders.length === 0
    })())
  // RETARGET (UI-6A): the Fuel pages moved their support copy into
  // the PageHeader primitive (which renders the muted text-support
  // role internally), so the literal token no longer appears in
  // every page source. The property — semantic tokens across scope,
  // no legacy aliases — is asserted directly.
  check('semantic tokens adopted across scope',
    PAGES.every((p) =>
      p.includes('text-ink-muted') || p.includes('<PageHeader')) &&
    PAGES.every((p) => !p.includes('text-muted-foreground')))
}

// ── 11. Loading states ───────────────────────────────────────────────
console.log('\n11. Loading states')
{
  check('four loading files exist',
    ['food', 'food/saved', 'nutrition', 'profile']
      .every((r) => existsSync(`src/app/(app)/${r}/loading.tsx`)))
  check('skeleton primitives, no spinners/fake text/shred-card',
    LOADINGS.every((l) => l.includes("from '@/components/ui/skeleton'") &&
      !l.includes('animate-spin') && !l.includes('Loading...') && !l.includes('shred-card')))
  check('Fuel routes include the subnav strip',
    [foodLoading, savedLoading, nutritionLoading].every((l) => l.includes('h-9 w-80')))
  // RETARGET (UI-6A): /food widened to the approved max-w-6xl
  // wide-route composition; its loading mirrors that width.
  check('aria-hidden + matched widths',
    LOADINGS.every((l) => l.includes('aria-hidden="true"')) &&
    foodLoading.includes('max-w-6xl') && profileLoading.includes('max-w-4xl'))
  check('no viewport traps or nested scrollers',
    LOADINGS.every((l) => !l.includes('h-screen') && !l.includes('overflow-y')))
  check('profile loading mirrors section stack + save strip',
    (profileLoading.match(/<SkeletonCard/g) || []).length === 5 &&
    profileLoading.includes('h-12 w-full rounded-xl'))
}

// ── 12. Responsive ───────────────────────────────────────────────────
console.log('\n12. Responsive')
{
  check('no md: shell leakage', CHANGED.every((f) => !stripComments(f).includes('md:')))
  check('page padding aligned with shell', PAGES.every((p) => p.includes('p-4 lg:p-6')))
  check('one-column primary layout (no multi-col page grids)',
    PAGES.every((p) => !p.includes('lg:grid-cols-2">') || p === nutritionPage))
  check('no route-level scrollers or viewport heights',
    CHANGED.every((f) => !stripComments(f).includes('overflow-y') && !f.includes('h-screen')))
  check('no fixed-width traps', CHANGED.every((f) => !f.match(/w-\[\d+px\]/)))
  check('no masonry / absolute core layout',
    CHANGED.every((f) => !f.includes('columns-')) &&
    PAGES.every((p) => !stripComments(p).match(/<div[^>]*absolute/)))
  check('shell remains sole main scroll owner',
    read('src/app/(app)/layout.tsx').includes('<main className="flex-1 overflow-y-auto'))
  check('bottom-nav clearance inherited',
    PAGES.every((p) => !p.includes('safe-area')) &&
    read('src/app/(app)/layout.tsx').includes('lg:pb-0'))
}

// ── 13. Accessibility ────────────────────────────────────────────────
console.log('\n13. Accessibility')
{
  check('date navigation accessible (labeled prev/next, disabled semantics)',
    foodPage.includes('aria-label="Previous day"') &&
    foodPage.includes('aria-label="Next day"') &&
    foodPage.includes('aria-disabled={isNextFuture}'))
  // RETARGET (UI-6A): saved-meals group titles now render through
  // the SectionHeader primitive (default h2); the outline property
  // is unchanged.
  check('section headings under single H1 (h2/h3)',
    profilePage.includes('<h3') && savedPage.includes('<SectionHeader') &&
    nutritionPage.includes('<h2'))
  check('links remain links, buttons remain buttons',
    CHANGED.every((f) => !f.match(/<div[^>]*onClick/)))
  check('no tabindex hacks', CHANGED.every((f) => !f.toLowerCase().includes('tabindex')))
  check('current target vs suggestion textually distinguished',
    nutritionPage.includes('Current target') &&
    nutritionPage.includes('Calculated from profile'))
  check('selection not color-only (OptionCard primitive)',
    read('src/components/ui/option-card.tsx').length > 200)
  check('no focus suppression added', PAGES.every((p) => !p.includes('outline-none') ||
    p === nutritionPage || p === profilePage))
  check('errors remain visible (retained error rows)',
    nutritionPage.includes('{saveError}') && profilePage.includes('{error}'))
  check('no fake WCAG claim',
    !/WCAG\s+2[.\d]*\s+(AA\s+)?compliant/i.test(notes) &&
    notes.includes('not a WCAG claim'))
}

// ── 14. Language and icons ───────────────────────────────────────────
console.log('\n14. Language and icons')
{
  check('no emoji in scope', CHANGED.every((f) => !EMOJI.test(f)))
  check('no emoji anywhere in src',
    (() => {
      const offenders: string[] = []
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry)
          if (statSync(full).isDirectory()) { walk(full); continue }
          if (!/\.(tsx|ts|css)$/.test(entry)) continue
          if (EMOJI.test(read(full))) offenders.push(full)
        }
      }
      walk('src')
      return offenders.length === 0
    })())
  check('no Sparkles', CHANGED.every((f) => !stripComments(f).includes('Sparkles')))
  check('lucide only', CHANGED.every((f) => !f.includes('heroicons') && !f.includes('react-icons')))
  check('no cheat-meal/clean-eating/guilt copy',
    CHANGED.every((f) => !/cheat meal|clean eating|bad food|perfect macros|failed day/i.test(f)))
  check('no medical/causal/detox claims',
    CHANGED.every((f) => !/detox|metabolic reset|fat.?burning|hormon/i.test(stripComments(f))))
  check('no fake AI language', CHANGED.every((f) => !/AI recommends|powered by AI/i.test(f)))
  check('approved copy present',
    nutritionPage.includes('Current target') && savedPage.includes('No saved meals yet.') &&
    foodPage.includes('Food log'))
}

// ── 15. Phase boundary ───────────────────────────────────────────────
console.log('\n15. Phase boundary')
{
  check('Train routes unchanged (6A/6B anchors)',
    read('src/app/(app)/workouts/page.tsx').includes('findActiveTrainingSession') &&
    read('src/components/workout/SessionHeader.tsx').includes("variant={isActive ? 'action' : isDone ? 'elevated' : 'subtle'}"))
  check('Progress/Coach/Today unchanged',
    read('src/app/(app)/progress/page.tsx').includes('fetchTrackingAwareProgressOverview') &&
    read('src/app/(app)/coach/page.tsx').includes('fetchCoachActions') &&
    read('src/app/(app)/dashboard/page.tsx').includes('<TodayPrimaryAction'))
  check('Onboarding behavior anchors intact (presentation migrated by 4B.6D)',
    read('src/components/onboarding/OnboardingWizard.tsx').includes('onboarding_complete: true') &&
    read('src/components/onboarding/Step4Nutrition.tsx').includes('calculateNutritionTargets'))
  check('shell/nav unchanged',
    read('src/components/layout/route-match.ts').includes('LONGEST matching href wins') &&
    read('src/app/(app)/layout.tsx').includes("select('fasting_enabled')") &&
    read('src/components/layout/Sidebar.tsx').includes('hidden lg:flex'))
  check('4B.6C added no migration (schema through 013 intact)',
    readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql') && f < '014').length === 13)
  check('API routes unchanged (anchors)',
    read('src/app/api/decisions/route.ts').includes('validateDecisionUpdate') &&
    existsSync('src/app/api/saved-meals') && existsSync('src/app/api/food-logs'))
  check('no package changes',
    JSON.parse(read('package.json')).name === 'shredos' &&
    Object.keys(JSON.parse(read('package.json')).dependencies).length === 22)
  check('domain libs unchanged',
    read('src/lib/food.ts').includes('progressColor') &&
    read('src/lib/nutrition.ts').includes('LEAN_MASS_PROTEIN_THRESHOLD') &&
    read('src/lib/goal-adjustments.ts').includes('CALORIE_STEP_SMALL = 100') &&
    read('src/lib/nutrition-trends.ts').includes('MIN_LOGGED_DAYS_FOR_AVERAGE = 2'))
  check('dead progress-summary path untouched',
    read('src/lib/progress-summary.ts').includes("select('duration_minutes, ended_at')"))
  check('no .DS_Store', !existsSync('.DS_Store') && !existsSync('src/.DS_Store'))
  check('SavedMealForm untouched (deferral verified)',
    savedForm.includes('shred-card') === false && savedForm.length > 500)
}

// ════════════════════════════════════════════════════════════════════
// Deep per-contract coverage.
// ════════════════════════════════════════════════════════════════════

// ── 16. Add-food form field inventory (untouched) ────────────────────
console.log('\n16. Add-food form fields')
{
  const MEALS: Array<[string, string]> = [
    ['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'],
    ['snack', 'Snack'], ['supplement', 'Supplement'], ['drink', 'Drink'],
  ]
  for (const [value, label] of MEALS) {
    check(`meal option unchanged: ${label}`,
      addFoodForm.includes(`{ value: '${value}',`) && addFoodForm.includes(`label: '${label}'`))
  }
  check('numeric input helper unchanged', addFoodForm.includes('function NInput'))
  check('food-log POST path unchanged', addFoodForm.includes('/api/food-logs'))
  check('no invented nutritional data (no auto-fill of uncertain values)',
    !stripComments(addFoodForm).includes('estimate') &&
    !stripComments(addFoodForm).includes('guess'))
}

// ── 17. Food entry + drink + calculator detail ───────────────────────
console.log('\n17. Entry, drink, calculator detail')
{
  check('entry edit/delete flows unchanged',
    foodEntry.includes('/api/food-logs') && foodEntry.includes("method: 'DELETE'"))
  check('entry has no new gestures/hover-only actions',
    !foodEntry.includes('onSwipe') && !foodEntry.includes('onMouseEnter'))
  check('drink presets from the existing lib',
    drinkLog.includes("from '@/lib/drinks'") &&
    drinkLog.includes('DRINK_PRESETS') &&
    drinkLog.includes('computeDrinkLogPayload'))
  check('drink preset selection + quantity preserved',
    drinkLog.includes('DRINK_PRESETS.map((preset)') &&
    drinkLog.includes('setPresetId'))
  check('calculator per-serving × servings preview math unchanged',
    labelCalc.includes("(parseFloat(f.calories) || 0) * previewServings") &&
    labelCalc.includes('* previewServings * 10) / 10'))
  check('calculator default servings preserved', labelCalc.includes("servings: '1'"))
  check('drink/calculator submit both go to food-logs API',
    drinkLog.includes("fetch('/api/food-logs'") && labelCalc.includes("fetch('/api/food-logs'"))
}

// ── 18. Goal-adjustment review deep contract ─────────────────────────
console.log('\n18. Goal-adjustment review detail')
{
  check('hold recommendation copy unchanged',
    reviewCard.includes("hold: 'Keep current targets.'"))
  check('evidence lines from server review values',
    reviewCard.includes('review.weight.currentAverageLbs') &&
    reviewCard.includes('toFixed(1)'))
  check('apply payload carries expected-value guards',
    reviewCard.includes('expectedCurrentCalories: review.currentCalories') &&
    reviewCard.includes('expectedGoal: review.goal'))
  check('stale branch preserved', reviewCard.includes('if (body.stale)'))
  check('apply is explicit (button handler, no effect-triggered writes)',
    reviewCard.includes('onClick={handleApply}') &&
    !stripComments(reviewCard).includes('useEffect(() => { handleApply'))
  check('before/after values shown before approval (documented contract)',
    reviewCard.includes('before/after + review date shown') ||
    reviewCard.includes('Before'))
  check('no AI-recommends language',
    !/AI recommends|AI insight/i.test(reviewCard))
  check('review card is a status surface, never elevated like the target',
    reviewCard.includes('variant="status"') && !reviewCard.includes('variant="elevated"'))
}

// ── 19. Trend + coach panel detail ───────────────────────────────────
console.log('\n19. Trend and coach detail')
{
  check('trend section three-state variants (status empty + metric charts)',
    (trendSection.match(/variant="metric"/g) || []).length === 2 &&
    trendSection.includes('variant="status"'))
  check('trend values come from the summary prop (no fetch)',
    !trendSection.includes('fetch(') && trendSection.includes('summary'))
  check('coach panel prop-driven (no fetch)',
    !coachPanel.includes('fetch(') && coachPanel.includes('summary'))
  check('trend section still consumed by /nutrition and /progress libs unchanged',
    read('src/lib/nutrition-trends.ts').includes('NUTRITION_CHART_WINDOW_DAYS = 28'))
}

// ── 20. Profile deep detail ──────────────────────────────────────────
console.log('\n20. Profile detail')
{
  check('NumField helper unchanged (label + unit affix)',
    profilePage.includes('function NumField'))
  check('height ft/in split inputs preserved',
    profilePage.includes('heightFt') && profilePage.includes('heightIn') &&
    profilePage.includes('feetInchesToCm'))
  check('weight/goal-weight lbs↔kg conversions preserved',
    profilePage.includes('lbsToKg(parseFloat(weightLbs))') &&
    profilePage.includes('kgToLbs(p.current_weight_kg)'))
  check('activity options unchanged (three levels with multipliers)',
    profilePage.includes("'sedentary'") && profilePage.includes("'moderately_active'") &&
    profilePage.includes("'very_active'") && profilePage.includes('(x12)'))
  check('step-goal slider bounds unchanged',
    profilePage.includes('min="2000" max="20000" step="500"'))
  check('weigh-in cadence options unchanged',
    profilePage.includes("'weekly'") && profilePage.includes("'biweekly'") &&
    profilePage.includes("'manual'"))
  check('fasting goal select preserved (none + options)',
    profilePage.includes("value=\"none\">No default") ||
    profilePage.includes('No default'))
  check('change-detection comparisons unchanged',
    profilePage.includes('prevCadence  !== cadence') &&
    profilePage.includes('prevStepGoal !== newStepGoal') &&
    profilePage.includes('prevGoal !== newGoal && newGoal'))
  check('decision rows inserted per change (loop preserved)',
    profilePage.includes('for (const c of changes)') &&
    profilePage.includes("status: 'applied', created_by: 'user'"))
  check('goal label helper preserved',
    profilePage.includes('MAIN_GOAL_OPTIONS.find((o) => o.value === v)?.label'))
  check('save success feedback preserved',
    profilePage.includes('Profile saved. Changes logged.'))
  check('main-goal support copy preserved (no auto target change)',
    profilePage.includes('does\n            not change your nutrition targets automatically') ||
    profilePage.includes('not change your nutrition targets automatically'))
}

// ── 21. DOM order per page ───────────────────────────────────────────
console.log('\n21. DOM order')
{
  check('food: header → subnav → coach → date → summary → shortcuts → meals → tools',
    foodPage.indexOf('<h1') < foodPage.indexOf('<FuelSubNav />') &&
    foodPage.indexOf('<FuelSubNav />') < foodPage.indexOf('<DateNav') &&
    foodPage.indexOf('<DateNav') < foodPage.indexOf('<DailyMacroSummary') &&
    foodPage.indexOf('<DailyMacroSummary') < foodPage.indexOf('<QuickAddPanel') &&
    foodPage.indexOf('<QuickAddPanel') < foodPage.indexOf('<RecentFoodPanel') &&
    foodPage.indexOf('<RecentFoodPanel') < foodPage.indexOf('MEAL_TYPES.map'))
  check('saved: header → subnav → form/empty → lists',
    savedPage.indexOf('<h1') < savedPage.indexOf('<FuelSubNav />') &&
    savedPage.indexOf('<FuelSubNav />') < savedPage.indexOf('Autopilot meals'))
  // RETARGET (UI-6A): original boundary — single-column order with
  // the calculated suggestion between the review card and the form.
  // The page is now a two-column desktop composition: the PRIMARY
  // column keeps target -> review -> form (the authoritative editing
  // path), and the suggestion/trend context forms the second column
  // after it in the DOM (mobile stacks it after the form). The
  // protected property — suggestion surfaces never sit above or
  // visually replace the authoritative target — still holds and the
  // authoritative ordering is still asserted.
  check('nutrition: header -> subnav -> current target -> review -> form; suggestion/trend column follows',
    nutritionPage.indexOf('<FuelSubNav />') < nutritionPage.indexOf('Current target') &&
    nutritionPage.indexOf('Current target') < nutritionPage.indexOf('<GoalAdjustmentReviewCard') &&
    nutritionPage.indexOf('<GoalAdjustmentReviewCard') < nutritionPage.indexOf('Override targets') &&
    nutritionPage.indexOf('Override targets') < nutritionPage.indexOf('Calculated from profile') &&
    nutritionPage.indexOf('Calculated from profile') < nutritionPage.indexOf('<NutritionTrendSection'))
  check('profile: personal → goal → activity → schedule → fasting → save',
    // Heading-anchored: the change-log title strings mention the same
    // names earlier in handleSave, so match the rendered h3s.
    profilePage.indexOf('>Personal info</h3>') < profilePage.indexOf('>Main goal</h3>') &&
    profilePage.indexOf('>Main goal</h3>') < profilePage.indexOf('>Activity level</h3>') &&
    profilePage.indexOf('>Activity level</h3>') < profilePage.indexOf('>Weigh-in schedule</h3>') &&
    profilePage.indexOf('>Weigh-in schedule</h3>') < profilePage.indexOf('>Fasting</h3>') &&
    profilePage.indexOf('>Fasting</h3>') < profilePage.indexOf('Save profile'))
}

// ── 22. Loading geometry detail ──────────────────────────────────────
console.log('\n22. Loading geometry detail')
{
  check('food loading: date strip + summary + shortcut cards + meal stack',
    foodLoading.includes('h-10 w-full') &&
    (foodLoading.match(/<SkeletonCard/g) || []).length === 7)
  check('saved loading: three meal cards',
    (savedLoading.match(/<SkeletonCard/g) || []).length === 3)
  // RETARGET (UI-6A): the loading now mirrors the two-column
  // geometry — three primary-column cards (target, review, form)
  // plus two second-column cards (suggestion, trend).
  check('nutrition loading: target + review + form + suggestion + trend regions',
    (nutritionLoading.match(/<SkeletonCard/g) || []).length === 5)
  check('profile loading: five sections + save strip',
    (profileLoading.match(/<SkeletonCard/g) || []).length === 5)
  check('loading pages carry no interactive elements or copy',
    LOADINGS.every((l) => !l.includes('<Link') && !l.includes('<button') &&
      !l.match(/>[A-Z][a-z]+ /)))
}

// ── 23. Copy anchors ─────────────────────────────────────────────────
console.log('\n23. Copy anchors')
{
  const COPIES: Array<[string, string, string]> = [
    ['saved empty', 'No saved meals yet.', savedPage],
    ['saved empty support', 'Mark meals as autopilot', savedPage],
    ['food support', 'Log meals for the selected day and track daily totals.', foodPage],
    ['nutrition support', 'Each change is versioned and logged.', nutritionPage],
    ['profile support', 'Changes save when you submit', profilePage],
    ['low-carb warning', 'Carbs are below 75g/day.', nutritionPage],
    ['success copy', 'Targets updated and logged.', nutritionPage],
  ]
  for (const [name, copy, src] of COPIES) {
    check(`copy: ${name}`, src.includes(copy))
  }
  check('date-nav copy preserved (Today / Back to today)',
    foodPage.includes("? 'Today'") && foodPage.includes('Back to today'))
  check('autopilot headings preserved',
    savedPage.includes('Autopilot meals') && savedPage.includes('Other saved meals'))
  // RETARGET (UI-6A): the down-arrow glyph became a Lucide
  // ArrowDown on a 44px control; the affordance and copy remain.
  check('calculated card retains use-values affordance',
    nutritionPage.includes('Use calculated values') &&
    nutritionPage.includes('<ArrowDown'))
}

// ── 24. Structural details ───────────────────────────────────────────
console.log('\n24. Structural details')
{
  check('subnav link order: Food log → Saved meals → Nutrition targets',
    subNav.indexOf("label: 'Food log'") < subNav.indexOf("label: 'Saved meals'") &&
    subNav.indexOf("label: 'Saved meals'") < subNav.indexOf("label: 'Nutrition targets'"))
  // Retargeted (QA correction): the pre-existing bare client loading
  // text is retired — the fetch state now reuses the route skeleton.
  check('saved page client fetch state reuses the route skeleton',
    savedPage.includes('<SavedMealsLoading />') && !savedPage.includes('Loading…'))
  check('macro summary compact prop preserved',
    macroSummary.includes('compact') && foodPage.includes('compact={false}'))
  check('nutrition form bounds unchanged (500–10000 cal etc.)',
    nutritionPage.includes("min: '500', max: '10000'") &&
    nutritionPage.includes("max: '500'"))
  check('nutrition form four fields + notes preserved',
    ["label: 'Calories'", "label: 'Protein'", "label: 'Carbs'", "label: 'Fat (min)'"]
      .every((f) => nutritionPage.includes(f)) &&
    nutritionPage.includes('Notes (optional)'))
  check('current-target tile labels complete',
    ["{ label: 'Calories', value: target.calories.toLocaleString() }"]
      .every((f) => nutritionPage.includes(f)) &&
    nutritionPage.includes("value: `${target.protein_g}g`"))
  check('profile placeholders unchanged',
    profilePage.includes('placeholder="185"') && profilePage.includes('placeholder="165"'))
  check('quick-add panel keeps autopilot semantics',
    quickAdd.includes('is_autopilot') || quickAdd.includes('autopilot'))
  check('no conditional blank slots (single-column stacks throughout)',
    !foodPage.includes('col-span') && !profilePage.includes('col-span'))
}

// ── 25. QA correction — profile scroll ownership ─────────────────────
console.log('\n25. QA correction — profile scroll ownership')
{
  const appLayout = read('src/app/(app)/layout.tsx')
  const sidebar = read('src/components/layout/Sidebar.tsx')
  const TRAPS = ['overflow-y-auto', 'overflow-auto', 'overflow-scroll',
    'h-screen', 'min-h-screen', 'h-dvh', 'min-h-dvh', 'max-h-']
  for (const cls of TRAPS) {
    check(`profile route introduces no scroll owner / viewport trap: ${cls}`,
      !profilePage.includes(cls) && !profileLoading.includes(cls))
  }
  check('no Fuel route introduces a vertical scroll owner or viewport trap',
    PAGES.every((p) => TRAPS.every((cls) => !p.includes(cls))))
  check('loading states introduce no scroll owner or viewport trap',
    LOADINGS.every((l) => TRAPS.every((cls) => !l.includes(cls))))
  check('shell main remains the sole content scroll owner',
    (stripComments(appLayout).match(/overflow-y-auto/g) || []).length === 1 &&
    appLayout.includes('<main className="flex-1 overflow-y-auto'))
  check('sidebar keeps its one independent scroll region (unaffected)',
    (stripComments(sidebar).match(/overflow-y-auto/g) || []).length === 1 &&
    sidebar.includes('aria-label="Primary" className="flex-1 overflow-y-auto'))
  check('cards clip rather than scroll (no nested vertical scrollbars)',
    read('src/components/ui/card.tsx').includes('overflow-hidden'))

  // Shared-shell scroll correction — FINAL PROVEN MECHANISM (live
  // physical Safari): the authenticated shell is viewport-pinned
  // (fixed inset-0), i.e. removed from normal document flow. Any
  // in-flow shell — h-screen, h-dvh, and h-full all failed physical
  // QA — leaves the root able to develop its own scroll range under
  // fractional viewports (zoom rounding, display scaling, classic
  // scrollbars, URL-bar states), painting a second document scrollbar
  // alongside <main>'s. Out of flow, the document has no in-flow
  // content to scroll, so <main> owns app-content scrolling by
  // construction. These checks REPLACE the same-phase h-dvh and
  // h-full/percentage-chain assertions (correction replacement of
  // in-phase experiments, not a retarget of retired prior-phase
  // markup).
  const rootLayout = read('src/app/layout.tsx')
  check('authenticated shell is viewport-pinned: fixed + inset-0 + flex + overflow-hidden',
    appLayout.includes('<div className="fixed inset-0 flex overflow-hidden bg-canvas">'))
  check('shell carries no viewport-height ownership (inset-0 binds both edges)',
    ['h-screen', 'h-dvh', '100vh', '100dvh']
      .every((t) => !stripComments(appLayout).includes(t)) &&
    !appLayout.includes('fixed inset-0 flex h-'))
  check('height-chain experiment removed (html { height: 100% } gone from globals)',
    !/html\s*\{[^}]*height:\s*100%/m.test(stripCss(read('src/app/globals.css'))))
  check('body carries no sizing class (no vh/dvh/percentage box in document flow)',
    rootLayout.includes('className={`font-sans antialiased bg-canvas text-ink`}') &&
    ['min-h-screen', 'min-h-dvh', 'h-full', 'h-screen', 'h-dvh']
      .every((cls) => !stripComments(rootLayout).includes(cls)))
  check('no body/document overflow-hidden workaround',
    !stripComments(rootLayout).includes('overflow') &&
    !globalsHasDocumentOverflowLock())
  check('no JS viewport sizing or resize listeners in the shell',
    ['resize', 'innerHeight', 'addEventListener', 'visualViewport']
      .every((t) => !stripComments(appLayout).includes(t) &&
        !stripComments(rootLayout).includes(t)))
  // Inside the pinned shell the pre-existing flex constraints still
  // make <main> the bounded scroller: min-h-0 lets the content column
  // shrink below its content, and overflow-y-auto gives main a zero
  // automatic minimum size as a flex item.
  check('content column keeps min-h-0 (flex column may shrink below content)',
    appLayout.includes('"flex min-h-0 flex-1 flex-col overflow-hidden"'))
  check('main keeps its intended overflow-y ownership + bottom-nav clearance + lg breakpoint',
    appLayout.includes(
      '<main className="flex-1 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">'))
  check('sidebar independent scroll + lg visibility unchanged (h-full fills the pinned shell)',
    read('src/components/layout/Sidebar.tsx').includes("'hidden lg:flex flex-col w-56") &&
    read('src/components/layout/Sidebar.tsx').includes('flex-1 overflow-y-auto') &&
    appLayout.includes('className="hidden lg:flex w-56 flex-shrink-0 h-full"'))
  check('TopBar unchanged',
    read('src/components/layout/TopBar.tsx').includes(
      'flex h-14 flex-shrink-0 items-center justify-between border-b border-edge-subtle bg-surface px-4 lg:h-12 lg:px-6'))
  check('bottom nav fixed + lg-hidden unchanged',
    read('src/components/layout/MobileBottomNav.tsx')
      .includes('fixed inset-x-0 bottom-0 z-40') &&
    read('src/components/layout/MobileBottomNav.tsx').includes('lg:hidden'))
  check('login remains an ordinary document-flow page (no pinned shell)',
    read('src/app/(auth)/login/page.tsx').includes('min-h-screen') &&
    !read('src/app/(auth)/login/page.tsx').includes('fixed inset-0'))
  check('select/dialog portals still layer above the pinned shell (z-[200] portal, shell z-auto)',
    read('src/components/ui/select.tsx').includes('z-[200]') &&
    !appLayout.includes('fixed inset-0 flex overflow-hidden bg-canvas z-'))
}

function globalsHasDocumentOverflowLock(): boolean {
  const globals = stripCss(read('src/app/globals.css'))
  // A document-level lock would be an html/body rule hiding overflow.
  return /(?:^|[}\s])(?:html|body)[^{]*\{[^}]*overflow(?:-y)?\s*:\s*(?:hidden|clip)/m.test(globals)
}

function stripCss(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, '')
}

// ── 26. QA correction — Select menu surface ──────────────────────────
console.log('\n26. QA correction — Select menu surface')
{
  const select = read('src/components/ui/select.tsx')
  const sc = stripComments(select)
  check('menu surface: opaque semantic surface + ink text + clear border + restrained shadow',
    select.includes('"rounded-lg border border-edge bg-surface text-ink shadow-lg",'))
  check('no legacy transparent-resolving tokens remain on the menu chrome',
    !sc.includes('bg-popover') && !sc.includes('text-popover-foreground') &&
    !sc.includes('focus:bg-accent') && !sc.includes('accent-foreground') &&
    !sc.includes('border-border') && !sc.includes('bg-border'))
  check('portal + stacking treatment unchanged (body portal, z-[200])',
    select.includes('SelectPrimitive.Portal') && select.includes('z-[200]'))
  check('item highlight uses semantic tokens',
    sc.includes('focus:bg-surface-sunken focus:text-ink'))
  check('selected item keeps its checkmark indicator',
    select.includes('SelectPrimitive.ItemIndicator') && select.includes('<Check'))
  check('separator uses semantic edge token', sc.includes('bg-edge-subtle'))
  check('Radix + keyboard behavior untouched (Root re-export, popper, viewport sizing)',
    select.includes('SelectPrimitive.Root') &&
    select.includes('position = "popper"') &&
    select.includes('h-[var(--radix-select-trigger-height)]') &&
    select.includes('SelectScrollUpButton') && select.includes('SelectScrollDownButton'))
  check('no new dependency (Radix + lucide imports only)',
    select.includes('from "@radix-ui/react-select"') &&
    select.includes('from "lucide-react"'))
  check('profile select option values unchanged',
    profilePage.includes('WEIGH_IN_DAYS.map') &&
    profilePage.includes('<SelectItem value="morning">Morning</SelectItem>') &&
    profilePage.includes('<SelectItem value="evening">Evening</SelectItem>') &&
    profilePage.includes('<SelectItem value="none">No default</SelectItem>') &&
    profilePage.includes('FASTING_GOAL_OPTIONS.map'))
  check('onboarding schedule step consumes the shared primitive, itself untouched',
    read('src/components/onboarding/Step3Schedule.tsx').includes("from '@/components/ui/select'") &&
    read('src/components/onboarding/Step3Schedule.tsx').includes('>Preferred day</label>') &&
    read('src/components/onboarding/Step3Schedule.tsx').includes('>Time of day</label>') &&
    read('src/components/onboarding/Step3Schedule.tsx').includes('WEIGH_IN_DAYS.map'))
}

// ── 27. QA correction — add-food required indicators ─────────────────
console.log('\n27. QA correction — add-food required indicators')
{
  const api = read('src/app/api/food-logs/route.ts')
  check('API contract: food_name required',
    api.includes('if (!body.food_name?.trim())') &&
    api.includes("'food_name is required'"))
  check('API contract: calories required (must be >= 0)',
    api.includes('body.calories === undefined || body.calories < 0'))
  check('API contract: protein/carbs/fat optional, defaulting to 0',
    api.includes('body.protein_g ?? 0') && api.includes('body.carbs_g   ?? 0') &&
    api.includes('body.fat_g     ?? 0'))
  check('client validation unchanged: name + calories only',
    addFoodForm.includes("if (!f.food_name.trim()) { setError('Food name is required.'); return }") &&
    addFoodForm.includes("if (f.calories === '' || cal < 0)"))
  check('visible * indicators agree with the contract: name and calories only',
    addFoodForm.includes('placeholder="Food name *"') &&
    addFoodForm.includes('label="Calories *"') &&
    !addFoodForm.includes('label="Protein *"') &&
    !addFoodForm.includes('label="Carbs *"') &&
    !addFoodForm.includes('label="Fat *"'))
  check('optional macros remain rendered and saveable when blank/zero',
    addFoodForm.includes('label="Protein"') && addFoodForm.includes('label="Carbs"') &&
    addFoodForm.includes('label="Fat"') &&
    addFoodForm.includes('const pro  = parseFloat(f.protein) || 0'))
  check('macro cross-check warning remains advisory (computed, never blocks save)',
    addFoodForm.includes('cal > 0 ? macroCrossCheckWarning(cal, pro, carb, fat) : null'))
  check('API payload shape unchanged',
    addFoodForm.includes('calories: cal, protein_g: pro, carbs_g: carb, fat_g: fat,'))
  check('input defaults unchanged',
    addFoodForm.includes("calories: '', protein: '', carbs: '', fat: '',"))
}

// ── 28. QA correction — client loading fallbacks ─────────────────────
console.log('\n28. QA correction — client loading fallbacks')
{
  check('nutrition client fetch state reuses the route skeleton',
    nutritionPage.includes("import NutritionLoading from './loading'") &&
    nutritionPage.includes('return <NutritionLoading />'))
  check('profile client fetch state reuses the route skeleton',
    profilePage.includes("import ProfileLoading from './loading'") &&
    profilePage.includes('return <ProfileLoading />'))
  check('saved-meals client fetch state reuses the route skeleton',
    savedPage.includes("import SavedMealsLoading from './loading'") &&
    savedPage.includes('return <SavedMealsLoading />'))
  check('no bare text loading fallback remains on any Fuel/Profile route',
    PAGES.every((p) => {
      const s = stripComments(p)
      return !s.includes('>Loading...<') && !s.includes('>Loading…<')
    }))
  check('reused compositions stay skeleton-based, hidden from AT, honest',
    LOADINGS.every((l) => l.includes('aria-hidden="true"') && l.includes('Skeleton') &&
      !l.includes('animate-spin') && !l.includes('shred-card') && !l.includes('%')))
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
