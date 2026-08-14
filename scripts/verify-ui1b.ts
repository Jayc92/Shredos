// ============================================================
// ForgeFitOS — UI-1B verification harness
// Shared Shell & Core Presentation Primitives: proves the FORGEFIT
// wordmark presentation (accessible name still ForgeFitOS), the
// polished shell preserves every destination/group/behavior, the six
// new primitives are domain-blind + server-compatible with honest
// zero/partial/complete/over/unavailable semantics (verified at
// RUNTIME by invoking the component functions and walking their
// element trees), the limited StepsCard adoption is copy-identical,
// and nothing excluded happened (no rename, no avatar, no new
// dependency, no migration 020, no Today/Progress change).
// Run from the repository root:
//   npx tsx scripts/verify-ui1b.ts
// ============================================================

import { readFileSync, readdirSync } from 'fs'
import React from 'react'

// The repo compiles JSX with the classic runtime under tsx, so the
// component modules reference a React global — provide it BEFORE
// importing them (dynamic imports below).
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

const brand = read('src/components/layout/BrandMark.tsx')
const sidebar = read('src/components/layout/Sidebar.tsx')
const topBar = read('src/components/layout/TopBar.tsx')
const bottomNav = read('src/components/layout/MobileBottomNav.tsx')
const moreSheet = read('src/components/layout/MoreSheet.tsx')
const routeMatch = read('src/components/layout/route-match.ts')
const appLayout = read('src/app/(app)/layout.tsx')
const globals = read('src/app/globals.css')
const stepsCard = read('src/components/dashboard/StepsCard.tsx')

const PRIMITIVES = {
  'page-header': read('src/components/ui/page-header.tsx'),
  'section-header': read('src/components/ui/section-header.tsx'),
  'metric-value': read('src/components/ui/metric-value.tsx'),
  'progress-bar': read('src/components/ui/progress-bar.tsx'),
  'progress-ring': read('src/components/ui/progress-ring.tsx'),
  'empty-state': read('src/components/ui/empty-state.tsx'),
}
const SHELL = [sidebar, topBar, bottomNav, moreSheet, brand]

// Element-tree helpers (components are plain functions returning
// element objects — no DOM needed).
type El = { type: unknown; props: Record<string, unknown> }
function collectText(node: unknown, out: string[]): void {
  if (node == null || typeof node === 'boolean') return
  if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return }
  if (Array.isArray(node)) { node.forEach((c) => collectText(c, out)); return }
  const el = node as El
  if (el.props) collectText(el.props.children, out)
}
function findByProp(node: unknown, key: string, matches: El[]): void {
  if (node == null || typeof node !== 'object') return
  if (Array.isArray(node)) { node.forEach((c) => findByProp(c, key, matches)); return }
  const el = node as El
  if (el.props && key in el.props) matches.push(el)
  if (el.props) findByProp(el.props.children, key, matches)
}

async function main() {
  const { ProgressBar } = await import('../src/components/ui/progress-bar')
  const { ProgressRing } = await import('../src/components/ui/progress-ring')
  const { EmptyState } = await import('../src/components/ui/empty-state')
  const { PageHeader } = await import('../src/components/ui/page-header')
  const { SectionHeader } = await import('../src/components/ui/section-header')
  const { MetricValue } = await import('../src/components/ui/metric-value')

  // ── 1. UI-1A token contract intact ─────────────────────────────────
  console.log('\n1. UI-1A token contract intact')
  {
    check('S1: dark canvas token unchanged', globals.includes('--canvas: 220 25% 7%;'))
    check('S1b: brand mint unchanged', globals.includes('--brand: 163 62% 52%;'))
    check('S1c: no oklch reappears in code',
      !stripComments(globals).includes('oklch('))
    check('S1d: color-scheme still dark', globals.includes('color-scheme: dark;'))
    check('S1e: focus-visible + reduced-motion preserved',
      globals.includes(':focus-visible {') && globals.includes('prefers-reduced-motion'))
  }

  // ── 2. BrandMark presentation ──────────────────────────────────────
  console.log('\n2. BrandMark')
  {
    check('S2: mark-only presentation exists (BrandMark export unchanged)',
      brand.includes('export function BrandMark') &&
      brand.includes('viewBox="0 0 24 24"') && brand.includes('<rect'))
    check('S2b: wordmark presentation exists (BrandWordmark export)',
      brand.includes('export function BrandWordmark'))
    check('S3: visible wordmark reads FORGEFIT (FORGE ink + FIT mint)',
      brand.includes('>FORGE</span>') && brand.includes('>FIT</span>') &&
      brand.includes('text-brand'))
    check('S4: accessible product name remains ForgeFitOS',
      brand.includes('aria-label="ForgeFitOS"') &&
      (brand.match(/aria-label="ForgeFitOS"/g) ?? []).length >= 2 &&
      brand.includes("aria-hidden=\"true\""))
    check('S4b: compact variation exists and stays accessible',
      brand.includes("size?: 'default' | 'compact'"))
    check('S2c: mark geometry untouched (same three modular bars)',
      (brand.match(/<rect x="8"/g) ?? []).length === 3)
    check('no raster asset / no avatar in the brand component',
      !/\.(png|jpe?g|webp|svg\?|gif)/.test(brand) && !/avatar|Image/.test(brand))
  }

  // ── 3. No internal technical rename ────────────────────────────────
  console.log('\n3. No technical rename')
  {
    check('S5: package name still shredos',
      read('package.json').includes('"name": "shredos"'))
    check('S5b: metadata still ForgeFitOS',
      read('src/app/layout.tsx').includes("default: 'ForgeFitOS'") &&
      read('src/lib/constants.ts').includes("export const APP_NAME = 'ForgeFitOS'"))
    check('S5c: no env/route/db rename markers',
      !brand.includes('NEXT_PUBLIC') && routeMatch.includes("'/dashboard'"))
  }

  // ── 4. Navigation preservation ─────────────────────────────────────
  console.log('\n4. Navigation preservation')
  {
    check('S6: desktop groups unchanged (Today/Train/Fuel/Progress/Coach/Account)',
      ['today', 'train', 'fuel', 'progress', 'coach', 'account'].every((g) =>
        routeMatch.includes(`'${g}'`)) && !routeMatch.includes('UI-1B'))
    check('S6b: sidebar renders groups from the single model (unchanged source)',
      sidebar.includes('NAV_GROUPS.map') && sidebar.includes('activeRouteId(pathname)') &&
      sidebar.includes('requiresFastingEnabled || fastingEnabled'))
    check('S7: five mobile pillars unchanged',
      bottomNav.includes('MOBILE_PILLARS.map') && bottomNav.includes('grid-cols-5') &&
      ['Today', 'Train', 'Fuel', 'Progress', 'Coach'].every((l) => routeMatch.includes(`'${l}'`)))
    check('S8: More sheet destinations unchanged (single MORE_ROUTE_IDS source)',
      moreSheet.includes('MORE_ROUTE_IDS') &&
      moreSheet.includes('requiresFastingEnabled || fastingEnabled') &&
      moreSheet.includes('<SheetTitle>More</SheetTitle>'))
    check('S8b: no destination added/removed/renamed in shell components',
      SHELL.every((f) => !f.includes('href="/settings"') && !f.includes('href="/home"')) &&
      sidebar.includes('NAV_ROUTES.filter') && !sidebar.includes("label: '"))
    check('sign-out behavior untouched (same form POST, both surfaces)',
      sidebar.includes('action="/api/auth/signout" method="POST"') &&
      moreSheet.includes('action="/api/auth/signout" method="POST"'))
  }

  // ── 5. Active states, focus, targets, safe areas, scroll ───────────
  console.log('\n5. Shell accessibility and architecture')
  {
    check('S9: sidebar active is non-color-only (bar + tint + weight + aria-current)',
      sidebar.includes("aria-current={active ? 'page' : undefined}") &&
      sidebar.includes('w-0.5 rounded-full bg-brand') &&
      sidebar.includes('font-semibold'))
    check('S9b: bottom-nav active is non-color-only (bar + stroke + weight + aria-current)',
      bottomNav.includes("aria-current={active ? 'page' : undefined}") &&
      bottomNav.includes('strokeWidth={active ? 2.4 : 2}') &&
      bottomNav.includes('h-0.5 w-8'))
    check('S10: no focus-style removal anywhere in the shell',
      SHELL.every((f) => !f.includes('outline-none') && !f.includes('focus:outline-0')))
    check('S11: mobile targets at/above 44px (bottom nav 56px, More rows 44px)',
      bottomNav.includes('min-h-14') && moreSheet.includes('min-h-11'))
    check('S12: safe-area handling present (nav + main padding)',
      bottomNav.includes('env(safe-area-inset-bottom)') &&
      appLayout.includes('env(safe-area-inset-bottom)'))
    check('S13: main remains the sole content scroll owner',
      appLayout.includes('fixed inset-0 flex overflow-hidden bg-canvas') &&
      appLayout.includes('flex-1 overflow-y-auto'))
    check('S14: no new nested scrollers (only sidebar nav, More nav, main)',
      (sidebar.match(/overflow-y-auto/g) ?? []).length === 1 &&
      (moreSheet.match(/overflow-y-auto/g) ?? []).length === 1 &&
      !bottomNav.includes('overflow') && !topBar.includes('overflow-y'))
    check('bottom nav fixed within the shell architecture (unchanged)',
      bottomNav.includes('fixed inset-x-0 bottom-0 z-40') && bottomNav.includes('lg:hidden'))
    check('S29: no avatar/online indicator/profile image fabricated',
      SHELL.every((f) => !/avatar|online.?indicator|presence|profile.?(image|photo)/i.test(stripComments(f))))
  }

  // ── 6. Primitive hygiene ───────────────────────────────────────────
  console.log('\n6. Primitive hygiene')
  {
    const DOMAIN = /calorie|kcal|macro|protein|carb|fasting|adherence|coach|weigh|workout|nutrition|energy.?balance|tdee|maintenance/i
    for (const [name, src] of Object.entries(PRIMITIVES)) {
      check(`S15: ${name} is domain-blind (no domain vocabulary in code)`,
        !DOMAIN.test(stripComments(src)))
      check(`S16: ${name} is server-compatible (no 'use client')`,
        !src.includes("'use client'"))
      check(`${name} uses semantic tokens only (no raw palette colors)`,
        !/(green|red|blue|amber|gray|slate|zinc)-\d{3}|#[0-9a-fA-F]{3,8}\b/.test(stripComments(src)))
    }
    check('S17: heading levels are caller-controlled and valid',
      PRIMITIVES['page-header'].includes("as?: 'h1' | 'h2'") &&
      PRIMITIVES['section-header'].includes("as?: 'h2' | 'h3' | 'h4'") &&
      PRIMITIVES['page-header'].includes('as: Heading = ') &&
      PRIMITIVES['section-header'].includes('as: Heading = '))
    check('S22: no domain arithmetic in progress primitives (clamping only)',
      !/toFixed|Math\.round|toLocaleString/.test(stripComments(PRIMITIVES['progress-bar'])) &&
      !/toLocaleString/.test(stripComments(PRIMITIVES['progress-ring'])))
    check('typography roles adopted (the UI-1A role classes gain real consumers)',
      PRIMITIVES['page-header'].includes('text-page-title') &&
      PRIMITIVES['section-header'].includes('text-section-title') &&
      PRIMITIVES['empty-state'].includes('text-support'))
    check('no StatRow or other speculative primitive was created',
      !readdirSync('src/components/ui').some((f) => /stat-row|stat_row|tooltip|toast|tabs/.test(f)))
  }

  // ── 7. Runtime: ProgressBar edge semantics ─────────────────────────
  console.log('\n7. Runtime: ProgressBar')
  {
    const bar = (value: number | null | undefined, max?: number) =>
      (ProgressBar({ value, max, label: 'test bar' }) as unknown as El)
    const zero = bar(0, 100)
    const partial = bar(40, 100)
    const complete = bar(100, 100)
    const over = bar(130, 100)
    const missing = bar(null, 100)
    const badMax = bar(50, 0)

    check('S18: zero is a VALID value (valuenow 0, determinate, empty fill)',
      zero.props['aria-valuenow'] === 0 && zero.props['data-state'] === 'determinate')
    check('S18b: partial renders proportional fill', (() => {
      const fills: El[] = []; findByProp(partial, 'style', fills)
      return partial.props['aria-valuenow'] === 40 &&
        (fills[0]?.props.style as { width: string }).width === '40%'
    })())
    check('S18c: complete caps at 100%', (() => {
      const fills: El[] = []; findByProp(complete, 'style', fills)
      return (fills[0]?.props.style as { width: string }).width === '100%'
    })())
    check('S18d: over-range clamps rendering but never disguises the input', (() => {
      const fills: El[] = []; findByProp(over, 'style', fills)
      return over.props['data-state'] === 'over' &&
        (fills[0]?.props.style as { width: string }).width === '100%' &&
        over.props['aria-valuenow'] === 100 &&
        over.props['aria-valuetext'] === '130 of 100'
    })())
    check('S18e/S21: missing value is unavailable — never zero progress',
      missing.props['data-state'] === 'unavailable' &&
      missing.props['aria-valuenow'] === undefined &&
      missing.props['aria-valuetext'] === 'Not available' &&
      missing.props.children === false)
    check('S18f: invalid max is unavailable (explicit validation)',
      badMax.props['data-state'] === 'unavailable' && badMax.props['aria-valuenow'] === undefined)
    check('S20: accessible name/value semantics present',
      partial.props.role === 'progressbar' && partial.props['aria-label'] === 'test bar' &&
      partial.props['aria-valuemin'] === 0 && partial.props['aria-valuemax'] === 100)
  }

  // ── 8. Runtime: ProgressRing edge semantics ────────────────────────
  console.log('\n8. Runtime: ProgressRing')
  {
    const ring = (value: number | null | undefined, max?: number) =>
      (ProgressRing({ value, max, label: 'test ring' }) as unknown as El)
    const circles = (el: El) => {
      const out: El[] = []; findByProp(el, 'cx', out); return out
    }
    const zero = ring(0, 100)
    const partial = ring(25, 100)
    const complete = ring(100, 100)
    const over = ring(140, 100)
    const missing = ring(null, 100)

    check('S19: zero valid — solid track, NO arc, honest label',
      zero.props['data-state'] === 'determinate' && circles(zero).length === 1 &&
      circles(zero)[0].props.strokeDasharray === undefined &&
      zero.props['aria-label'] === 'test ring: 0 of 100')
    check('S19b: partial — arc with correct dash offset', (() => {
      const cs = circles(partial)
      if (cs.length !== 2) return false
      const arc = cs[1]
      const c = 2 * Math.PI * ((48 - 4) / 2)
      return Math.abs((arc.props.strokeDashoffset as number) - c * 0.75) < 1e-9
    })())
    check('S19c: complete — full arc (offset 0)', (() => {
      const cs = circles(complete)
      return cs.length === 2 && Math.abs(cs[1].props.strokeDashoffset as number) < 1e-9
    })())
    check('S19d: over-range — full arc, data-state over, TRUE value announced',
      over.props['data-state'] === 'over' &&
      over.props['aria-label'] === 'test ring: 140 of 100')
    check('S19e/S21: missing — dashed track, no arc, never zero',
      missing.props['data-state'] === 'unavailable' &&
      circles(missing).length === 1 &&
      circles(missing)[0].props.strokeDasharray === '3 5' &&
      missing.props['aria-label'] === 'test ring: not available')
    check('S20b: ring exposes role=img + <title> text alternative', (() => {
      const texts: string[] = []; collectText(partial, texts)
      return partial.props.role === 'img' && texts.join('').includes('test ring: 25 of 100')
    })())
    check('ring is static SVG (no client JS, no animation classes)',
      !PRIMITIVES['progress-ring'].includes('animate') &&
      !PRIMITIVES['progress-ring'].includes('useEffect'))
  }

  // ── 9. Runtime: EmptyState, PageHeader, SectionHeader, MetricValue ──
  console.log('\n9. Runtime: content primitives')
  {
    check('S23: EmptyState preserves caller copy exactly (compact)', (() => {
      const el = EmptyState({ mode: 'compact', title: 'No steps logged yet today.', description: 'Goal: 8,000 steps' }) as unknown as El
      const texts: string[] = []; collectText(el, texts)
      return texts.join('|') === 'No steps logged yet today.|Goal: 8,000 steps'
    })())
    check('S23b: EmptyState standard adds NO copy of its own', (() => {
      const el = EmptyState({ title: 'T', description: 'D' }) as unknown as El
      const texts: string[] = []; collectText(el, texts)
      return texts.join('|') === 'T|D'
    })())
    check('S17b: PageHeader defaults to h1 and honors as="h2"', (() => {
      const h1 = PageHeader({ title: 'X' }) as unknown as El
      const h2 = PageHeader({ title: 'X', as: 'h2' }) as unknown as El
      const find = (el: El) => { const o: El[] = []; findByProp(el, 'children', o); return o.map((e) => e.type) }
      return find(h1).includes('h1') && find(h2).includes('h2') && !find(h2).includes('h1')
    })())
    check('S17c: SectionHeader honors caller heading level', (() => {
      const h3 = SectionHeader({ title: 'X', as: 'h3' }) as unknown as El
      const o: El[] = []; findByProp(h3, 'children', o)
      return o.map((e) => e.type).includes('h3')
    })())
    check('MetricValue renders value verbatim with no computation', (() => {
      const el = MetricValue({ value: '8,643', unit: 'steps', label: 'today' }) as unknown as El
      const texts: string[] = []; collectText(el, texts)
      return texts.join('|') === '8,643|steps|today'
    })())
  }

  // ── 10. Limited adoption ───────────────────────────────────────────
  console.log('\n10. Limited adoption (StepsCard)')
  {
    check('StepsCard adopts ProgressBar with equivalent geometry (sm = h-1.5)',
      stepsCard.includes('<ProgressBar') && stepsCard.includes('size="sm"') &&
      PRIMITIVES['progress-bar'].includes("sm: 'h-1.5'"))
    check('StepsCard adopts compact EmptyState with identical copy',
      stepsCard.includes('<EmptyState') &&
      stepsCard.includes('title="No steps logged yet today."') &&
      stepsCard.includes('Goal: ${stepGoal.toLocaleString()} steps') &&
      stepsCard.includes('Set a step goal in your profile to track progress.'))
    check('StepsCard domain logic untouched (null-vs-zero, remaining, goal text)',
      stepsCard.includes('todayLog?.steps != null') &&
      stepsCard.includes('todayLog?.steps ?? 0') &&
      stepsCard.includes("'Goal met'") && stepsCard.includes('steps to goal'))
    // RETARGET (UI-2): this pinned that UI-1B itself performed no
    // route migration — true then. UI-2 legitimately adopted
    // PageHeader on Today (marked 'UI-2' in the page). The surviving
    // UI-1B boundary: Progress remains unmigrated and the StepsCard
    // adoption stands.
    check('no broad UI-1B migration: Progress untouched; Today adoption is UI-2-marked',
      !read('src/app/(app)/progress/page.tsx').includes('SectionHeader') &&
      read('src/app/(app)/dashboard/page.tsx').includes('UI-2'))
  }

  // ── 11. Exclusions and preservation ────────────────────────────────
  console.log('\n11. Exclusions and preservation')
  {
    check('S24: no new dependency',
      (() => {
        const pkg = read('package.json')
        return !pkg.includes('framer') && !pkg.includes('next-themes') &&
          !pkg.includes('radix-ui/react-progress') && pkg.includes('"next": "14.2.13"')
      })())
    // RETARGET (UI-3): 020 is the approved dashboard-prefs migration.
    check('S25: migration boundary (exactly 20; 020 = approved UI-3 file)',
      readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 20 &&
      readdirSync('supabase/migrations').some((f) => f === '020_ui3_dashboard_preferences.sql'))
    // RETARGET (UI-2): the pinned grid string described the pre-UI-2
    // composition; the boundary — UI-1B itself did not recompose
    // Today — survives as "no UI-1B marker in the page; the energy
    // widget contract is intact" (the recomposition is UI-2's, and
    // verify-ui2 owns its layout).
    check('S26: Today carries no UI-1B recomposition (energy contract intact)',
      (() => {
        const dash = read('src/app/(app)/dashboard/page.tsx')
        return dash.includes('<TodayWidget id="energy">') && !dash.includes('UI-1B')
      })())
    check('S27: Progress range navigation + scroll={false} unchanged',
      (() => {
        const section = read('src/components/progress/EnergyTrendSection.tsx')
        return section.includes('scroll={false}') &&
          section.includes('/progress?range=${weeks}') && !section.includes('UI-1B')
      })())
    check('S28: energy/eat-back prohibitions intact in every touched file',
      [...Object.values(PRIMITIVES), ...SHELL, stepsCard].every((f) =>
        !/eat.?back|earned (calories|food)|totalBurn|calories_burned/i.test(stripComments(f))))
    check('no global error/not-found boundaries added (deferred)',
      !readdirSync('src/app/(app)').includes('error.tsx') &&
      !readdirSync('src/app').includes('not-found.tsx'))
    check('no brand raster assets added (no public dir)',
      !readdirSync('.').includes('public'))
  }

  // ── 12. Determinism ────────────────────────────────────────────────
  console.log('\n12. Determinism')
  {
    check('S30: primitives are deterministic (no time/randomness)',
      Object.values(PRIMITIVES).every((src) =>
        !stripComments(src).includes('Math.random') && !stripComments(src).includes('Date.now')))
    check('S30b: repeated invocation yields identical output', (() => {
      const a = JSON.stringify(ProgressBar({ value: 42, max: 100, label: 'd' }))
      const b = JSON.stringify(ProgressBar({ value: 42, max: 100, label: 'd' }))
      const c = JSON.stringify(ProgressRing({ value: 42, max: 100, label: 'd' }))
      const d = JSON.stringify(ProgressRing({ value: 42, max: 100, label: 'd' }))
      return a === b && c === d
    })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
