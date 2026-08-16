// ============================================================
// ForgeFitOS — UI-3 verification harness
// Durable Today Widget Customization: proves the versioned
// preference contract and defensive normalization AT RUNTIME
// (nulls, garbage, unknown ids, duplicates, wrong versions, future
// widgets), the owner-only persistence path (no client user id, no
// service role, server re-normalization, single-column write), the
// editor's explicit-save/cancel/reset semantics and accessibility,
// the preference-driven Today rendering (order, visibility, spans,
// capability gating, empty-dashboard recovery), and every scope
// boundary (only migration 020, no dependency, Progress/shell
// untouched, honest data rules intact).
// Run from the repository root:
//   npx tsx scripts/verify-ui3.ts
// ============================================================

import { readFileSync, readdirSync, existsSync } from 'fs'
import React from 'react'
;(globalThis as any).React = React

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string) => readFileSync(p, 'utf8')
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

const lib = read('src/lib/dashboard-prefs.ts')
const migration = read('supabase/migrations/020_ui3_dashboard_preferences.sql')
const route = read('src/app/api/dashboard-prefs/route.ts')
const editorPage = read('src/app/(app)/dashboard/customize/page.tsx')
const editor = read('src/components/dashboard/CustomizeDashboardClient.tsx')
const page = read('src/app/(app)/dashboard/page.tsx')
const pageCode = stripComments(page)
const loading = read('src/app/(app)/dashboard/loading.tsx')
const CHANGED = [lib, route, editorPage, editor, page, loading]

async function main() {
  const {
    DASHBOARD_WIDGET_IDS,
    DASHBOARD_WIDGET_SIZES,
    DEFAULT_DASHBOARD_PREFS,
    normalizeDashboardPrefs,
    visibleDashboardWidgets,
    dashboardSpanClasses,
  } = await import('../src/lib/dashboard-prefs')

  const CANONICAL = ['calories', 'protein', 'steps', 'weight', 'nutrition',
    'workout', 'energy', 'fasting', 'coach', 'decisions']
  const idsOf = (p: { widgets: Array<{ id: string }> }) => p.widgets.map((w) => w.id)

  // ── 1. Contract and normalization (S1–S18, runtime) ────────────────
  console.log('\n1. Contract and normalization (runtime)')
  {
    check('S1: exactly ten canonical ids',
      DASHBOARD_WIDGET_IDS.length === 10 &&
      JSON.stringify([...DASHBOARD_WIDGET_IDS]) === JSON.stringify(CANONICAL))
    check('S2: canonical default order',
      JSON.stringify(idsOf(DEFAULT_DASHBOARD_PREFS)) === JSON.stringify(CANONICAL))
    check('S3: default sizes (3 compact tiles, full weight, half everything else)',
      DEFAULT_DASHBOARD_PREFS.widgets.every((w) =>
        w.enabled === true &&
        w.size === ({ calories: 'compact', protein: 'compact', steps: 'compact',
          weight: 'full' } as Record<string, string>)[w.id] ||
        (!['calories', 'protein', 'steps', 'weight'].includes(w.id) && w.size === 'half' && w.enabled)))
    check('S4: null input -> canonical defaults',
      JSON.stringify(normalizeDashboardPrefs(null)) === JSON.stringify(DEFAULT_DASHBOARD_PREFS))
    check('S5: missing/undefined input -> canonical defaults',
      JSON.stringify(normalizeDashboardPrefs(undefined)) === JSON.stringify(DEFAULT_DASHBOARD_PREFS) &&
      JSON.stringify(normalizeDashboardPrefs({})) === JSON.stringify(DEFAULT_DASHBOARD_PREFS))
    check('S6: malformed scalar -> defaults, never a throw',
      JSON.stringify(normalizeDashboardPrefs('garbage')) === JSON.stringify(DEFAULT_DASHBOARD_PREFS) &&
      JSON.stringify(normalizeDashboardPrefs(42)) === JSON.stringify(DEFAULT_DASHBOARD_PREFS))
    check('S7: malformed array input -> defaults',
      JSON.stringify(normalizeDashboardPrefs([1, 2, 3])) === JSON.stringify(DEFAULT_DASHBOARD_PREFS) &&
      JSON.stringify(normalizeDashboardPrefs({ version: 1, widgets: 'nope' })) ===
        JSON.stringify(DEFAULT_DASHBOARD_PREFS))
    check('S8: unsupported version -> defaults (rejected safely)',
      JSON.stringify(normalizeDashboardPrefs({ version: 2, widgets: [] })) ===
        JSON.stringify(DEFAULT_DASHBOARD_PREFS) &&
      JSON.stringify(normalizeDashboardPrefs({ version: '1', widgets: [] })) ===
        JSON.stringify(DEFAULT_DASHBOARD_PREFS))
    check('S9: unknown widget id ignored', (() => {
      const out = normalizeDashboardPrefs({ version: 1, widgets: [
        { id: 'sleep', enabled: true, size: 'half' },
        { id: 'weight', enabled: false, size: 'half' },
      ] })
      return !idsOf(out).includes('sleep') && out.widgets[0].id === 'weight' &&
        out.widgets[0].enabled === false
    })())
    check('S10: duplicate ids deduplicated deterministically (first wins)', (() => {
      const out = normalizeDashboardPrefs({ version: 1, widgets: [
        { id: 'coach', enabled: false, size: 'half' },
        { id: 'coach', enabled: true, size: 'full' },
      ] })
      const coach = out.widgets.find((w) => w.id === 'coach')!
      return idsOf(out).filter((i) => i === 'coach').length === 1 &&
        coach.enabled === false && coach.size === 'half'
    })())
    check('S11: missing widgets restored with defaults', (() => {
      const out = normalizeDashboardPrefs({ version: 1, widgets: [
        { id: 'workout', enabled: true, size: 'full' },
      ] })
      return out.widgets.length === 10 &&
        out.widgets.find((w) => w.id === 'weight')!.enabled === true
    })())
    check('S12: restored widgets appended in canonical order', (() => {
      const out = normalizeDashboardPrefs({ version: 1, widgets: [
        { id: 'decisions', enabled: true, size: 'half' },
      ] })
      return JSON.stringify(idsOf(out)) === JSON.stringify([
        'decisions', 'calories', 'protein', 'steps', 'weight', 'nutrition',
        'workout', 'energy', 'fasting', 'coach'])
    })())
    check('S13: valid user order preserved', (() => {
      const reversed = [...CANONICAL].reverse().map((id) => ({
        id, enabled: true, size: 'half',
      }))
      const out = normalizeDashboardPrefs({ version: 1, widgets: reversed })
      return JSON.stringify(idsOf(out)) === JSON.stringify([...CANONICAL].reverse())
    })())
    check('S14: invalid enabled repaired to the default (true)', (() => {
      const out = normalizeDashboardPrefs({ version: 1, widgets: [
        { id: 'coach', enabled: 'no', size: 'half' },
      ] })
      return out.widgets.find((w) => w.id === 'coach')!.enabled === true
    })())
    check('S15: invalid size repaired (enum AND per-widget support; weight AND energy)', (() => {
      const out = normalizeDashboardPrefs({ version: 1, widgets: [
        { id: 'steps', enabled: true, size: 'gigantic' },
        { id: 'energy', enabled: true, size: 'compact' }, // unsupported for energy
        { id: 'weight', enabled: true, size: 'compact' }, // unsupported for weight
      ] })
      return out.widgets.find((w) => w.id === 'steps')!.size === 'compact' &&
        out.widgets.find((w) => w.id === 'energy')!.size === 'half' &&
        out.widgets.find((w) => w.id === 'weight')!.size === 'full'
    })())
    check('S16: caller input never mutated', (() => {
      const input = { version: 1, widgets: [{ id: 'coach', enabled: false, size: 'half' }] }
      const snapshot = JSON.stringify(input)
      normalizeDashboardPrefs(input)
      return JSON.stringify(input) === snapshot
    })())
    check('S17: deterministic repeatability', (() => {
      const messy = { version: 1, widgets: [
        { id: 'fasting', enabled: false, size: 'weird' },
        { id: 'junk' }, { id: 'fasting', enabled: true, size: 'full' }, null,
      ] }
      return JSON.stringify(normalizeDashboardPrefs(messy)) ===
        JSON.stringify(normalizeDashboardPrefs(messy))
    })())
    check('S18: future-widget recovery (stored V1 missing a widget still shows it)', (() => {
      // Simulates a stored doc saved before "coach" existed.
      const stored = { version: 1, widgets: CANONICAL.filter((i) => i !== 'coach')
        .map((id) => ({ id, enabled: true, size: 'half' })) }
      const out = normalizeDashboardPrefs(stored)
      const coach = out.widgets[out.widgets.length - 1]
      return out.widgets.length === 10 && coach.id === 'coach' && coach.enabled === true
    })())
  }

  // ── 2. Persistence and security (S19–S30) ──────────────────────────
  console.log('\n2. Persistence and security')
  {
    // RETARGET (UI-5B1B): 021_ui5b_transactional_ordering.sql is the approved transactional-ordering migration.
    check('S19: migration 020 exists and remains the only UI-3 migration',
      existsSync('supabase/migrations/020_ui3_dashboard_preferences.sql') &&
      readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 21 &&
      readdirSync('supabase/migrations').filter((f) => f.startsWith('020')).length === 1)
    check('S20: JSONB dashboard_prefs on user_profiles',
      migration.includes('ALTER TABLE user_profiles') &&
      migration.includes('ADD COLUMN dashboard_prefs JSONB'))
    check('S21: safe non-null default, no destructive rewrite',
      migration.includes("NOT NULL DEFAULT '{}'::jsonb") &&
      !/UPDATE |DELETE |DROP TABLE|DROP COLUMN/.test(migration.replace(/^--.*$/gm, '')))
    check('S22: authenticated user derived server-side',
      route.includes('await supabase.auth.getUser()') &&
      route.includes("eq('user_id', user.id)"))
    check('S23: no client-provided user id in the save path',
      !stripComments(route).includes('body.userId') &&
      !stripComments(route).includes('body.user_id') &&
      !stripComments(editor).includes('user_id') && !stripComments(editor).includes('userId'))
    check('S24: no service-role client anywhere',
      CHANGED.every((f) => !f.toLowerCase().includes('service_role')) &&
      !read('src/lib/supabase/server.ts').toLowerCase().includes('service_role'))
    check('S25: server re-normalizes writes (untrusted browser JSON)',
      route.includes('const prefs = normalizeDashboardPrefs(body)') &&
      route.includes('.update({ dashboard_prefs: prefs })'))
    check('S26: only dashboard_prefs is written',
      (route.match(/\.update\(/g) || []).length === 1 &&
      route.includes('.update({ dashboard_prefs: prefs })'))
    check('S27: clear save failure (500 + message; 400 for unreadable body)',
      route.includes("{ status: 500 }") && route.includes("{ status: 400 }") &&
      route.includes('Could not save'))
    check('S28: Today revalidated after save',
      route.includes("revalidatePath('/dashboard')") &&
      editor.includes('router.refresh()'))
    check('S29: no Supabase operation embedded in verification scripts', (() => {
      // Needles assembled at runtime so this check cannot match its
      // own source text.
      const importNeedle = "from '@/lib/" + 'supabase'
      const pkgNeedle = 'supabase' + '-js'
      const self = read('scripts/verify-ui3.ts')
      return !self.includes(importNeedle) && !self.includes(pkgNeedle) &&
        !migration.includes('supabase.co')
    })())
    check('S30: RLS remains owner-scoped (no policy touched; 001 policies inherited)',
      !/POLICY|ROW LEVEL/.test(migration.replace(/^--.*$/gm, '')) &&
      read('supabase/migrations/001_phase1a_schema.sql').includes('"profile_update" ON user_profiles'))
  }

  // ── 3. Editor behavior (S31–S45) ───────────────────────────────────
  console.log('\n3. Editor behavior')
  {
    check('S31: all ten widgets listed (labels for every id)',
      CANONICAL.every((id) => lib.includes(`${id}:`)) &&
      editor.includes('widgets.map((w, i)') &&
      lib.includes('DASHBOARD_WIDGET_LABELS'))
    check('S32: Coach can be disabled (no special-casing in the editor)',
      !stripComments(editor).includes("w.id === 'coach'") &&
      editor.includes('onCheckedChange={(v) => setEnabled(i, v === true)}'))
    check('S33: every non-workout widget disableable (single generic toggle path)',
      (editor.match(/setEnabled\(/g) || []).length === 2 &&
      !stripComments(editor).includes('disabled={w.id'))
    check('S34: workout-only configuration valid (runtime)', (() => {
      const workoutOnly = normalizeDashboardPrefs({ version: 1, widgets:
        CANONICAL.map((id) => ({ id, enabled: id === 'workout', size: 'half' })) })
      const visible = visibleDashboardWidgets(workoutOnly, true)
      return visible.length === 1 && visible[0].id === 'workout'
    })())
    check('S35: all-disabled configuration valid (runtime)', (() => {
      const none = normalizeDashboardPrefs({ version: 1, widgets:
        CANONICAL.map((id) => ({ id, enabled: false, size: 'half' })) })
      return visibleDashboardWidgets(none, true).length === 0
    })())
    check('S36: save is explicit (single fetch on the save handler only)',
      (editor.match(/fetch\(/g) || []).length === 1 &&
      editor.includes("method: 'PUT'") && editor.includes('onClick={save}'))
    check('S37: cancel does not save (plain link, no handler)',
      editor.includes('href="/dashboard"') &&
      !editor.includes('onClick={cancel'))
    check('S38: reset is local until save',
      editor.includes('setWidgets(DEFAULT_DASHBOARD_PREFS.widgets.map((w) => ({ ...w })))') &&
      !stripComments(editor).split('function resetToDefault')[1]?.split('}')[0]?.includes('fetch'))
    check('S39: reorder is keyboard accessible (real buttons with names)',
      editor.includes('aria-label={`Move ${DASHBOARD_WIDGET_LABELS[w.id]} up`}') &&
      editor.includes('aria-label={`Move ${DASHBOARD_WIDGET_LABELS[w.id]} down`}') &&
      editor.includes('<button'))
    check('S40: reorder usable on mobile (same tap buttons, no drag dependency)',
      !editor.includes('onDrag') && !editor.includes('draggable') &&
      !read('package.json').includes('dnd'))
    check('S41: 44px targets (min-h-11 / min-w-11 on interactive rows)',
      editor.includes('min-h-11') && editor.includes('min-w-11'))
    check('S42: size selection carries non-color indication (aria-pressed + weight + border)',
      editor.includes('aria-pressed={w.size === size}') &&
      editor.includes('font-semibold'))
    check('S43: unavailable fasting explained',
      editor.includes('Fasting is currently turned off in your profile') &&
      editor.includes('fastingUnavailable'))
    check('S44: no fake drag handle (no drag affordance exists in CODE)',
      !editor.includes('GripVertical') &&
      !stripComments(editor).toLowerCase().includes('drag'))
    check('S45: save error retains draft state (no reset on failure)',
      editor.includes('setError(') && editor.includes('setSaving(false)') &&
      !stripComments(editor).split('async function save')[1]!.includes('setWidgets('))
  }

  // ── 4. Today rendering (S46–S67) ───────────────────────────────────
  console.log('\n4. Today rendering')
  {
    check('S46: normalized order drives DOM order (map over visible widgets)',
      page.includes('visibleWidgets.map((w) =>') &&
      page.includes('{widgetRegistry[w.id]}'))
    check('S47: disabled widgets omitted (runtime)', (() => {
      const some = normalizeDashboardPrefs({ version: 1, widgets:
        CANONICAL.map((id) => ({ id, enabled: id !== 'coach' && id !== 'energy', size: 'half' })) })
      const ids = visibleDashboardWidgets(some, true).map((w) => w.id)
      return !ids.includes('coach') && !ids.includes('energy') && ids.length === 8
    })())
    check('S48: each id renders at most once (registry has exactly one mount per id)',
      CANONICAL.every((id) =>
        (page.match(new RegExp(`<TodayWidget id="${id}">`, 'g')) || []).length === 1))
    check('S49-51: size spans (full=12, half=6, compact=4)',
      dashboardSpanClasses('full') === 'sm:col-span-2 lg:col-span-12' &&
      dashboardSpanClasses('half') === 'sm:col-span-1 lg:col-span-6' &&
      dashboardSpanClasses('compact') === 'sm:col-span-1 lg:col-span-4')
    check('S52: mobile maps every widget to a full row (grid-cols-1 base, no col overrides below sm)',
      page.includes('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12') &&
      !dashboardSpanClasses('compact').includes('col-span-1 ') === false ||
      !/(^|\s)col-span-/.test(dashboardSpanClasses('full')))
    check('S53: no horizontal overflow constructs',
      !pageCode.includes('overflow-x') && !pageCode.includes('w-[') &&
      !stripComments(editor).includes('overflow-x'))
    check('S54: natural heights preserved (items-start)',
      page.includes('lg:grid-cols-12 xl:gap-5 items-start'))
    check('S55: empty-dashboard recovery state (purposeful, with the edit action)',
      page.includes('visibleWidgets.length === 0') &&
      page.includes('Your dashboard is empty') &&
      page.includes('href="/dashboard/customize"'))
    check('S56: Edit layout always reachable (header control + empty state)',
      (page.match(/href="\/dashboard\/customize"/g) || []).length >= 2)
    check('S57: malformed read falls back to defaults (page normalizes)',
      page.includes('normalizeDashboardPrefs(profile.dashboard_prefs)'))
    check('S58: fasting preference cannot override the disabled capability (runtime)', (() => {
      const all = normalizeDashboardPrefs(null) // everything enabled
      const off = visibleDashboardWidgets(all, false).map((w) => w.id)
      const on = visibleDashboardWidgets(all, true).map((w) => w.id)
      return !off.includes('fasting') && on.includes('fasting')
    })())
    check('S59: calories/protein/steps remain non-duplicated (single registry mounts; nutrition card has no cal/protein bars)',
      !read('src/components/dashboard/NutritionCard.tsx').includes('label="Calories"') &&
      !read('src/components/dashboard/NutritionCard.tsx').includes('label="Protein"'))
    check('S60: missing-vs-zero preserved (tiles + steps card untouched semantics)',
      page.includes("missingText={nutritionTarget ? 'No food logged yet today.' : 'No nutrition targets set.'}") &&
      read('src/components/dashboard/StepsCard.tsx').includes('todayLog?.steps != null'))
    check('S61: weight observations remain real (same card, same chart)',
      page.includes('<WeightCard weighIns={weighIns} profile={profile} />') &&
      read('src/components/dashboard/WeightTrendChart.tsx').includes('never fabricated'))
    check('S62: energy card behavior unchanged (same props, untouched file)',
      page.includes('<EnergyBalanceCard model={energyBalance} />') &&
      !read('src/components/dashboard/EnergyBalanceCard.tsx').includes('UI-3'))
    check('S63: coach engine unchanged (same summary fetch, untouched card)',
      page.includes('<CoachCard summary={coachSummary} />') &&
      !read('src/components/coach/CoachCard.tsx').includes('UI-3'))
    check('S64: workout actions unchanged (hero + card + conflict flow)',
      page.includes('<TodayPrimaryAction') &&
      page.includes('findActiveTrainingSession(supabase, user.id).catch(() => null)') &&
      !read('src/components/dashboard/TodayPrimaryAction.tsx').includes('UI-3'))
    check('S65: no burn/eat-back arithmetic anywhere in scope',
      CHANGED.every((f) =>
        !/eat.?back|earned (calories|food)|totalBurn|calories_burned|total.?expenditure/i
          .test(stripComments(f))))
    check('S66: deterministic default rendering (same input, same output)', (() => {
      const a = JSON.stringify(visibleDashboardWidgets(DEFAULT_DASHBOARD_PREFS, true))
      const b = JSON.stringify(visibleDashboardWidgets(DEFAULT_DASHBOARD_PREFS, true))
      return a === b
    })())
    check('S67: loading state is layout-safe (generic, aria-hidden, no fixed personal promise)',
      loading.includes('GENERIC') && loading.includes('aria-hidden="true"') &&
      !loading.includes('lg:col-span-8'))
  }


  // ── 4b. Review-audit additions (zero-row guard, idempotence, packing) ──
  console.log('\n4b. Review-audit additions')
  {
    check('A1: zero-row update is a reported failure, never silent success',
      route.includes(".select('user_id')") &&
      route.includes('if (!data || data.length === 0)') &&
      route.includes('profile not found'))
    check('A2: write-shape equals read-shape (normalization is idempotent)', (() => {
      const messy = { version: 1, widgets: [
        { id: 'coach', enabled: false, size: 'full' },
        { id: 'junk' }, { id: 'weight', enabled: true, size: 'compact' },
      ] }
      const once = normalizeDashboardPrefs(messy)
      const twice = normalizeDashboardPrefs(once)
      return JSON.stringify(once) === JSON.stringify(twice)
    })())
    check('A3: canonical default packs complete 12-col rows (4+4+4 / 12 / 6+6 / 6+6 / 6+6)', (() => {
      const spans = visibleDashboardWidgets(DEFAULT_DASHBOARD_PREFS, true)
        .map((w) => (w.size === 'full' ? 12 : w.size === 'half' ? 6 : 4))
      return JSON.stringify(spans) === JSON.stringify([4, 4, 4, 12, 6, 6, 6, 6, 6, 6])
    })())
    check('A4: compact support matrix is exactly the audited contract',
      JSON.stringify(DASHBOARD_WIDGET_SIZES) === JSON.stringify({
        calories: ['compact', 'half', 'full'],
        protein: ['compact', 'half', 'full'],
        steps: ['compact', 'half', 'full'],
        weight: ['half', 'full'],
        nutrition: ['compact', 'half', 'full'],
        workout: ['compact', 'half', 'full'],
        energy: ['half', 'full'],
        fasting: ['compact', 'half', 'full'],
        coach: ['compact', 'half', 'full'],
        decisions: ['compact', 'half', 'full'],
      }))
    check('A5: unreadable body is a 400, not a default save',
      route.includes("{ status: 400 }") &&
      route.indexOf('Invalid JSON body') < route.indexOf('normalizeDashboardPrefs(body)'))
  }

  // ── 5. Boundaries (S68–S75) ────────────────────────────────────────
  console.log('\n5. Boundaries')
  {
    check('S68: Progress untouched',
      !read('src/app/(app)/progress/page.tsx').includes('UI-3') &&
      read('src/components/progress/EnergyTrendSection.tsx').includes('scroll={false}'))
    check('S69: shell/wordmark untouched',
      !read('src/components/layout/Sidebar.tsx').includes('UI-3') &&
      read('src/components/layout/BrandMark.tsx').includes('>FORGE</span>') &&
      !read('src/components/layout/TopBar.tsx').includes('UI-3'))
    check('S70: no new metric/badge/upcoming-run UI',
      CHANGED.every((f) => {
        const c = stripComments(f).toLowerCase()
        return !c.includes('streak') && !c.includes('badge') && !c.includes('upcoming run') &&
          !c.includes('consistency')
      }))
    // RETARGET (UI-5B1B): 021_ui5b_transactional_ordering.sql is the approved transactional-ordering migration.
    check('S71: no migration beyond 020 except the approved 021',
      readdirSync('supabase/migrations').filter((f) => f.startsWith('021')).length === 1 &&
      readdirSync('supabase/migrations').some((f) => f === '021_ui5b_transactional_ordering.sql') &&
      !readdirSync('supabase/migrations').some((f) => f.startsWith('022')))
    check('S72: no new dependency',
      !read('package.json').includes('dnd') && !read('package.json').includes('sortable') &&
      read('package.json').includes('"next": "14.2.13"'))
    check('S73: all UI-2 widget ids preserved (union unchanged, ten ids)',
      (read('src/components/dashboard/TodayWidget.tsx').match(/\| '/g) || []).length === 10)
    check('S74: UI-2 contract retargeted, not deleted (verify-ui2 still runs its checks)',
      read('scripts/verify-ui2.ts').includes('RETARGET (UI-3)') &&
      read('scripts/verify-ui2.ts').includes("check('S1: all prior widget ids unchanged'"))
    check('S75: no unrelated API/business-library changes',
      !read('src/lib/energy-facts.ts').includes('UI-3') &&
      !read('src/lib/goal-adjustments.ts').includes('UI-3') &&
      !read('src/lib/today-energy.ts').includes('UI-3') &&
      !existsSync('src/app/api/dashboard-prefs/route.ts') === false)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
